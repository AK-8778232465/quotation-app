const { createClient } = require('@supabase/supabase-js');

const PROJECT_NAME = 'quotation-app';
const BACKUP_PREFIX = 'quotation-backups/';
const BACKUP_FILE_PREFIX = 'quotation-backup-';
const DEFAULT_RETENTION_COUNT = 30;

function getRequiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getBearerToken(request) {
  const authorization = request.headers.authorization || '';
  if (!authorization.startsWith('Bearer ')) {
    return null;
  }

  return authorization.slice(7).trim();
}

function formatBackupFileName(timestamp) {
  return `${BACKUP_PREFIX}${BACKUP_FILE_PREFIX}${timestamp.slice(0, 10)}.json`;
}

function buildBackupPayload(entries, source) {
  return {
    project: PROJECT_NAME,
    generated_at: new Date().toISOString(),
    row_count: entries.length,
    source,
    entries,
  };
}

function parseJsonBody(request) {
  if (request.body && typeof request.body === 'object') {
    return Promise.resolve(request.body);
  }

  return new Promise((resolve, reject) => {
    let rawBody = '';

    request.on('data', (chunk) => {
      rawBody += chunk;
    });

    request.on('end', () => {
      if (!rawBody) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(rawBody));
      } catch (error) {
        reject(new Error('Invalid JSON request body.'));
      }
    });

    request.on('error', reject);
  });
}

async function fetchQuotationEntries() {
  const supabaseUrl = getRequiredEnv('SUPABASE_URL');
  const serviceRoleKey = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY');
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from('quotation_entries')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Supabase query failed: ${error.message}`);
  }

  return data ?? [];
}

async function uploadBackupToBlob(pathname, payload) {
  const { put } = await import('@vercel/blob');
  const token = getRequiredEnv('BLOB_READ_WRITE_TOKEN');

  return put(pathname, JSON.stringify(payload, null, 2), {
    access: 'private',
    allowOverwrite: true,
    contentType: 'application/json; charset=utf-8',
    token,
  });
}

async function enforceRetention() {
  const { del, list } = await import('@vercel/blob');
  const token = getRequiredEnv('BLOB_READ_WRITE_TOKEN');
  const retentionCount = Number.parseInt(process.env.BACKUP_RETENTION_COUNT || String(DEFAULT_RETENTION_COUNT), 10);
  const keepCount = Number.isFinite(retentionCount) && retentionCount > 0 ? retentionCount : DEFAULT_RETENTION_COUNT;

  const { blobs } = await list({
    prefix: BACKUP_PREFIX,
    token,
  });

  const filesToDelete = [...blobs]
    .sort((first, second) => new Date(second.uploadedAt).getTime() - new Date(first.uploadedAt).getTime())
    .slice(keepCount);

  if (filesToDelete.length > 0) {
    await del(
      filesToDelete.map((file) => file.url),
      { token }
    );
  }

  return {
    kept: Math.min(blobs.length, keepCount),
    deleted: filesToDelete.length,
  };
}

module.exports = async (request, response) => {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  try {
    const expectedToken = getRequiredEnv('BACKUP_INTERNAL_TOKEN');
    const providedToken = getBearerToken(request);

    if (!providedToken || providedToken !== expectedToken) {
      response.status(401).json({ error: 'Unauthorized backup request.' });
      return;
    }

    const body = await parseJsonBody(request);
    const source = typeof body.source === 'string' && body.source.trim() ? body.source.trim() : 'manual';
    const entries = await fetchQuotationEntries();
    const payload = buildBackupPayload(entries, source);
    const pathname = formatBackupFileName(payload.generated_at);
    const blob = await uploadBackupToBlob(pathname, payload);
    const retention = await enforceRetention();

    response.status(201).json({
      message: 'Backup uploaded successfully.',
      backup_pathname: blob.pathname,
      backup_url: blob.url,
      generated_at: payload.generated_at,
      row_count: payload.row_count,
      retention,
    });
  } catch (error) {
    console.error('backup-json failed', error);
    response.status(500).json({
      error: error instanceof Error ? error.message : 'Unexpected backup failure.',
    });
  }
};

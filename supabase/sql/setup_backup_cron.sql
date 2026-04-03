-- One-time setup for the Vercel Blob JSON backup scheduler.
-- Run the vault.create_secret statement only once per project.

create extension if not exists pg_cron;
create extension if not exists pg_net;
create extension if not exists vault;

select vault.create_secret(
  'replace-with-a-long-random-token',
  'backup_internal_token',
  'Bearer token used by Supabase Cron to call the Vercel backup-json endpoint'
)
where not exists (
  select 1
  from vault.decrypted_secrets
  where name = 'backup_internal_token'
);

select cron.schedule(
  'backup-json-daily',
  '30 20 * * *',
  $$
  select
    net.http_post(
      url := 'https://YOUR_VERCEL_PRODUCTION_URL/api/backup-json',
      headers := jsonb_build_object(
        'Authorization',
        'Bearer ' || (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'backup_internal_token'
          limit 1
        ),
        'Content-Type',
        'application/json'
      ),
      body := '{"source":"cron"}'::jsonb
    );
  $$
);

-- To change the schedule later:
--   select cron.unschedule('backup-json-daily');
--   then re-run the cron.schedule statement with a new cron expression.

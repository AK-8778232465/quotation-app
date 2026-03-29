import { hasSupabaseConfig, supabase } from './supabase';
import { calculateAmount, normalizeEntry, sortEntries } from '../utils/quotationHelpers';

const STORAGE_KEY = 'quotation_entries_v1';

function withStorageMode(entries, mode) {
  return entries.map((entry) => ({ ...entry, storage_mode: mode }));
}

function readLocalEntries() {
  const rawEntries = window.localStorage.getItem(STORAGE_KEY);
  if (!rawEntries) return [];

  try {
    const parsedEntries = JSON.parse(rawEntries).map((entry) => normalizeEntry(entry));
    const hasOnlySampleEntries = parsedEntries.length > 0 && parsedEntries.every((entry) => String(entry.id).startsWith('sample-'));
    return hasOnlySampleEntries ? [] : parsedEntries;
  } catch (error) {
    return [];
  }
}

function writeLocalEntries(entries) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  return withStorageMode(sortEntries(entries), 'local');
}

async function fetchSupabaseEntries() {
  const { data, error } = await supabase
    .from('quotation_entries')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    return {
      data: withStorageMode(readLocalEntries(), 'local'),
      error: 'Supabase fetch failed. Showing local backup data.',
      source: 'local',
    };
  }

  return { data: withStorageMode(sortEntries(data), 'supabase'), error: null, source: 'supabase' };
}

export async function getEntries() {
  if (hasSupabaseConfig) return fetchSupabaseEntries();
  return { data: withStorageMode(readLocalEntries(), 'local'), error: null, source: 'local' };
}

async function insertLocalEntry(payload) {
  const localEntries = readLocalEntries();
  const entry = normalizeEntry({
    ...payload,
    id: payload.id || crypto.randomUUID(),
    amount: calculateAmount(payload.quantity, payload.rate),
    created_at: payload.created_at || new Date().toISOString(),
  });

  const entryIndex = localEntries.findIndex((item) => item.id === entry.id);
  if (entryIndex >= 0) localEntries[entryIndex] = entry;
  else localEntries.push(entry);

  return { data: writeLocalEntries(localEntries), error: null };
}

async function copyPreviousDayLocal(targetDate) {
  const localEntries = readLocalEntries();
  const uniqueDates = [...new Set(localEntries.map((entry) => entry.date))].sort((a, b) => b.localeCompare(a));
  const sourceDate = uniqueDates.find((date) => date < targetDate);

  if (!sourceDate) {
    return { data: withStorageMode(sortEntries(localEntries), 'local'), error: 'No previous day entries found to copy.' };
  }

  const nextEntries = localEntries.filter((entry) => entry.date !== targetDate);
  const clones = localEntries
    .filter((entry) => entry.date === sourceDate)
    .map((entry) =>
      normalizeEntry({
        ...entry,
        id: crypto.randomUUID(),
        date: targetDate,
        created_at: new Date().toISOString(),
      })
    );

  return { data: writeLocalEntries([...nextEntries, ...clones]), error: null, source: 'local' };
}

async function copyPreviousDaySupabase(targetDate) {
  const entriesResult = await fetchSupabaseEntries();
  const supabaseEntries = entriesResult.data
    .filter((entry) => entry.storage_mode === 'supabase')
    .map(({ storage_mode, ...entry }) => entry);
  const uniqueDates = [...new Set(supabaseEntries.map((entry) => entry.date))].sort((a, b) => b.localeCompare(a));
  const sourceDate = uniqueDates.find((date) => date < targetDate);

  if (!sourceDate) {
    return {
      data: entriesResult.data,
      error: 'No previous day entries found to copy.',
      source: entriesResult.source,
    };
  }

  const clones = supabaseEntries
    .filter((entry) => entry.date === sourceDate)
    .map((entry) => ({
      ...entry,
      id: crypto.randomUUID(),
      date: targetDate,
      created_at: new Date().toISOString(),
    }));

  const { error } = await supabase.from('quotation_entries').insert(clones);
  if (error) {
    return copyPreviousDayLocal(targetDate);
  }

  return fetchSupabaseEntries();
}

export async function saveEntry(payload) {
  if (payload.copy_previous_day_to) {
    if (hasSupabaseConfig) return copyPreviousDaySupabase(payload.copy_previous_day_to);
    return copyPreviousDayLocal(payload.copy_previous_day_to);
  }

  const normalizedPayload = normalizeEntry({
    ...payload,
    amount: calculateAmount(payload.quantity, payload.rate),
  });

  if (!hasSupabaseConfig) return insertLocalEntry(normalizedPayload);

  const { error } = await supabase.from('quotation_entries').upsert(normalizedPayload);
  if (error) {
    const fallback = await insertLocalEntry(normalizedPayload);
    return {
      data: fallback.data,
      error: 'Supabase save failed. Entry stored in local backup only.',
      source: 'local',
    };
  }

  return fetchSupabaseEntries();
}

export async function deleteEntry(entryId) {
  if (!hasSupabaseConfig) {
    const nextEntries = readLocalEntries().filter((entry) => entry.id !== entryId);
    return { data: writeLocalEntries(nextEntries), error: null, source: 'local' };
  }

  const { error } = await supabase.from('quotation_entries').delete().eq('id', entryId);
  if (error) {
    const nextEntries = readLocalEntries().filter((entry) => entry.id !== entryId);
    return {
      data: writeLocalEntries(nextEntries),
      error: 'Supabase delete failed. Entry removed from local backup only.',
      source: 'local',
    };
  }

  return fetchSupabaseEntries();
}

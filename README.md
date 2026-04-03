# Quotation App

Mobile-first React single-page application for managing electrical work quotations with Supabase persistence.

## Features

- Fast daily quotation entry form
- Suggested amount with manual override
- Equipment-based suggestions for rate and description
- Copy previous day entries
- Entries grouped by date with daily total and grand total
- Mobile editing cards and desktop table view
- PDF generation with `jsPDF`
- Analytics with `Chart.js`
- Excel export
- JSON backup import/export
- Local storage fallback when Supabase env vars are not configured

## Project Structure

```text
src/
  components/
  pages/
  services/
  utils/
  App.js
```

## Supabase Setup

Create a table named `quotation_entries`:

```sql
create extension if not exists pgcrypto;

create table if not exists public.quotation_entries (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  ref_no text not null,
  equipment text not null,
  description text not null,
  quantity text not null,
  unit text null default '',
  rate numeric(12,2) not null default 0,
  amount numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  deleted_at timestamptz null
);

create index if not exists quotation_entries_date_idx on public.quotation_entries (date desc);
create index if not exists quotation_entries_equipment_idx on public.quotation_entries (equipment);
create index if not exists quotation_entries_deleted_at_idx on public.quotation_entries (deleted_at);
```

If you already have the old table in production, run this safe migration first:

```sql
alter table public.quotation_entries
  alter column quantity type text using quantity::text,
  alter column unit drop not null,
  alter column unit set default '';

alter table public.quotation_entries
  add column if not exists deleted_at timestamptz null;

create index if not exists quotation_entries_deleted_at_idx on public.quotation_entries (deleted_at);
```

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Fill:

```env
REACT_APP_SUPABASE_URL=...
REACT_APP_SUPABASE_ANON_KEY=...
```

## Scheduled Vercel Blob Backup

This project includes a Vercel serverless endpoint for daily JSON backups to Vercel Blob:

- Function path: `api/backup-json.js`
- Cron SQL template: `supabase/sql/setup_backup_cron.sql`
- Backup file name pattern: `quotation-backup-YYYY-MM-DD.json`
- Default retention: keep the latest 30 backup files

### 1. Add Vercel environment variables

Add these environment variables to your Vercel project:

- `BLOB_READ_WRITE_TOKEN`
- `BACKUP_INTERNAL_TOKEN`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional:

- `BACKUP_RETENTION_COUNT=30`

### 2. Deploy to Vercel

Deploy the app to production after the environment variables are set. The backup endpoint will be available at:

```text
https://YOUR_VERCEL_PRODUCTION_URL/api/backup-json
```

### 3. Create the daily cron job in Supabase

Open the Supabase SQL Editor, edit `YOUR_VERCEL_PRODUCTION_URL` inside `supabase/sql/setup_backup_cron.sql`, then run the SQL script.

The included schedule is:

```text
30 20 * * *
```

That is `20:30 UTC` every day. Adjust it if you want a different backup time.

### 5. Test manually before enabling cron

```bash
curl -X POST "https://YOUR_VERCEL_PRODUCTION_URL/api/backup-json" \
  -H "Authorization: Bearer your-long-random-token" \
  -H "Content-Type: application/json" \
  -d "{\"source\":\"manual\"}"
```

Expected result:

- a new private JSON file appears in Vercel Blob under `quotation-backups/`
- the response includes `row_count` and `backup_pathname`
- older files beyond the retention count are deleted after a successful upload

### 6. Recovery

Recovery stays intentionally simple:

1. Download the required JSON backup from Vercel Blob or from your internal admin tooling.
2. Use the existing JSON import action in the app.

Manual JSON export/import from the app is still available as a second safety layer.

## Run Locally

```bash
npm install
npm start
```

App runs at `http://localhost:3000`.

## Production Build

```bash
npm run build
```

Deploy the `build/` output to your preferred static host. For Vercel, Netlify, or Nginx static hosting, make sure the environment variables are configured before building.

## Usage Flow

1. Open the app on mobile or desktop.
2. Enter company and client details.
3. Add daily work entries.
4. Reuse previous entries through suggestions or `Copy previous day`.
5. Edit grouped rows directly in the quotation table.
6. Generate PDF or export Excel.

## Notes

- If Supabase is unavailable, the app automatically uses browser local storage.
- Sample data loads automatically when the app is empty so first-time users can understand the flow quickly.

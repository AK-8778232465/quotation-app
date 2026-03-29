# Quotation App

Mobile-first React single-page application for managing electrical work quotations with Supabase persistence.

## Features

- Fast daily quotation entry form
- Auto-calculated amount
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
  quantity numeric(12,2) not null default 0,
  unit text not null,
  rate numeric(12,2) not null default 0,
  amount numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists quotation_entries_date_idx on public.quotation_entries (date desc);
create index if not exists quotation_entries_equipment_idx on public.quotation_entries (equipment);
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

# AGENTS.md

## Project Summary

This project is a mobile-first single-page React application for managing electrical work quotations.
It replaces an Excel-to-PDF workflow and is optimized for fast daily data entry by non-technical users.

Core capabilities already implemented:

- Daily quotation entry form
- Grouped quotation table by date
- Inline row editing
- Daily total and grand total calculation
- PDF export
- Excel export
- JSON backup import/export
- Analytics dashboard with charts
- Supabase persistence with local storage fallback

## Tech Stack

- React 19
- Create React App
- Supabase JS client
- Chart.js + react-chartjs-2
- jsPDF + jspdf-autotable
- xlsx
- file-saver

## Important Files

- `src/pages/HomePage.js`
  Main app orchestration, state, load/save flow, exports, and dashboard composition.

- `src/components/EntryForm.js`
  Daily entry form, company/client details, copy previous day, suggestion-based entry support.

- `src/components/EntryTable.js`
  Grouped date view, desktop editable table, mobile editable cards, delete/update actions.

- `src/components/AnalyticsDashboard.js`
  Daily trend chart, equipment usage chart, monthly total summary.

- `src/components/StickyActionBar.js`
  Mobile-friendly sticky bottom actions.

- `src/services/supabase.js`
  Supabase client bootstrapping from environment variables.

- `src/services/quotationService.js`
  Read/write service for entries, with Supabase-first behavior and local fallback.

- `src/utils/quotationHelpers.js`
  Grouping, totals, formatting, normalization, and auto-suggestion helpers.

- `src/utils/pdf.js`
  Quotation PDF generation logic.

- `src/utils/exportHelpers.js`
  Excel and JSON export/import helpers.

- `src/utils/sampleData.js`
  Starter demo entries used for first-load onboarding.

## Data Model

Each quotation entry follows this shape:

```js
{
  id,
  date,
  ref_no,
  equipment,
  description,
  quantity,
  unit,
  rate,
  amount,
  created_at
}
```

## Supabase Notes

Expected table: `quotation_entries`

Required frontend environment variables:

```env
REACT_APP_SUPABASE_URL=
REACT_APP_SUPABASE_ANON_KEY=
```

If these are missing or Supabase fails, the app falls back to browser local storage.

## Developer Guidance

- Keep the UX simple and mobile-friendly.
- Prefer readable code over abstractions.
- Do not introduce Redux unless explicitly requested.
- Preserve the current single-page workflow.
- Maintain local fallback behavior unless the project intentionally moves to Supabase-only mode.
- When adding fields, update:
  - form state
  - service normalization
  - table rendering
  - PDF export
  - Excel/JSON export if needed
  - Supabase schema docs in `README.md`

## Testing and Verification

Primary verification commands:

```bash
npm test -- --watchAll=false
npm run build
```

## Future Improvements

- Add proper toast notifications
- Add search and filter controls
- Add client/project master data
- Add authentication if multi-user access is needed
- Add server-side validation and row-level security in Supabase

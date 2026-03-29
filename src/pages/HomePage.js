import { useEffect, useMemo, useState } from 'react';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import EntryForm from '../components/EntryForm';
import EntryTable from '../components/EntryTable';
import StickyActionBar from '../components/StickyActionBar';
import SummaryCards from '../components/SummaryCards';
import { deleteEntry, getEntries, saveEntry, seedSampleEntries } from '../services/quotationService';
import { exportEntriesToExcel, exportEntriesToJson, importEntriesFromJson } from '../utils/exportHelpers';
import { buildSuggestions, getGrandTotal, getLatestDate, groupEntriesByDate } from '../utils/quotationHelpers';
import { generateQuotationPdf } from '../utils/pdf';

const defaultCompanyDetails = {
  companyName: 'Prime Electrical Works',
  clientName: 'Client Name',
  quotationTitle: 'Work Quotation',
};

const emptyEntry = (fallbackDate) => ({
  date: fallbackDate,
  ref_no: '',
  equipment: '',
  description: '',
  quantity: '1',
  unit: 'NO',
  rate: '',
  amount: 0,
});

function HomePage() {
  const today = new Date().toISOString().slice(0, 10);
  const [entries, setEntries] = useState([]);
  const [draftEntry, setDraftEntry] = useState(emptyEntry(today));
  const [companyDetails, setCompanyDetails] = useState(defaultCompanyDetails);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showForm, setShowForm] = useState(true);

  useEffect(() => {
    const loadEntries = async () => {
      setIsLoading(true);
      const result = await getEntries();

      if (result.error) setMessage({ type: 'error', text: result.error });
      setEntries(result.data || []);

      if (!result.data?.length) {
        const seeded = await seedSampleEntries();
        setEntries(seeded.data || []);
        if (seeded.data?.length) {
          setMessage({ type: 'success', text: 'Sample entries loaded so you can start quickly.' });
        }
      }

      setIsLoading(false);
    };

    loadEntries();
  }, []);

  useEffect(() => {
    const latestDate = getLatestDate(entries) || today;
    setDraftEntry((current) => ({ ...current, date: current.date || latestDate }));
  }, [entries, today]);

  const suggestions = useMemo(() => buildSuggestions(entries), [entries]);
  const groupedEntries = useMemo(() => groupEntriesByDate(entries), [entries]);
  const grandTotal = useMemo(() => getGrandTotal(entries), [entries]);

  const persistEntry = async (payload, successText) => {
    setIsSaving(true);
    const result = await saveEntry(payload);
    if (result.error) setMessage({ type: 'error', text: result.error });
    else {
      setEntries(result.data);
      setMessage({ type: 'success', text: successText });
    }
    setIsSaving(false);
    return result;
  };

  const handleDraftChange = (field, value) => {
    const nextDraft = { ...draftEntry, [field]: value };
    if (field === 'equipment') {
      const matchedSuggestion = suggestions.equipmentLookup[value.trim().toLowerCase()];
      if (matchedSuggestion) {
        nextDraft.description = nextDraft.description || matchedSuggestion.description;
        nextDraft.rate = nextDraft.rate || String(matchedSuggestion.rate || '');
        nextDraft.unit = nextDraft.unit || matchedSuggestion.unit || 'NO';
      }
    }
    setDraftEntry(nextDraft);
  };

  const handleAddEntry = async (event) => {
    event.preventDefault();
    const payload = {
      ...draftEntry,
      quantity: Number(draftEntry.quantity || 0),
      rate: Number(draftEntry.rate || 0),
    };
    const result = await persistEntry(payload, 'Entry saved successfully.');
    if (!result.error) {
      setDraftEntry(emptyEntry(draftEntry.date || today));
      setShowForm(false);
    }
  };

  const handleRowUpdate = async (updatedEntry) => {
    await persistEntry(updatedEntry, 'Entry updated.');
  };

  const handleDeleteEntry = async (entryId) => {
    setIsSaving(true);
    const result = await deleteEntry(entryId);
    if (result.error) setMessage({ type: 'error', text: result.error });
    else {
      setEntries(result.data);
      setMessage({ type: 'success', text: 'Entry deleted.' });
    }
    setIsSaving(false);
  };

  const handleCopyPreviousDay = async (targetDate) => {
    const result = await persistEntry({ copy_previous_day_to: targetDate }, `Previous working day copied to ${targetDate}.`);
    if (!result.error) setDraftEntry(emptyEntry(targetDate));
  };

  const handleGeneratePdf = async () => {
    setIsGeneratingPdf(true);
    try {
      generateQuotationPdf({ companyDetails, groupedEntries, grandTotal });
      setMessage({ type: 'success', text: 'Quotation PDF downloaded.' });
    } catch (error) {
      setMessage({ type: 'error', text: 'PDF generation failed. Please try again.' });
    }
    setIsGeneratingPdf(false);
  };

  const handleJsonImport = async (file) => {
    try {
      const importedEntries = await importEntriesFromJson(file);
      if (!importedEntries?.length) {
        setMessage({ type: 'error', text: 'No entries found in the selected JSON file.' });
        return;
      }

      setIsSaving(true);
      let latestData = entries;

      for (const importedEntry of importedEntries) {
        const result = await saveEntry(importedEntry);
        if (result.error) {
          setMessage({ type: 'error', text: result.error });
          setIsSaving(false);
          return;
        }
        latestData = result.data;
      }

      setEntries(latestData);
      setMessage({ type: 'success', text: 'Backup imported successfully.' });
      setIsSaving(false);
    } catch (error) {
      setMessage({ type: 'error', text: 'JSON import failed. Please check the file and try again.' });
      setIsSaving(false);
    }
  };

  const storageMode = entries.some((entry) => entry.storage_mode === 'supabase') ? 'Supabase' : 'Local backup';

  return (
    <main className="app-shell">
      <section className="hero">
        <div className="hero-top">
          <div>
            <span className="eyebrow">Quotation Workspace</span>
            <h1>Fast daily electrical quotation entry</h1>
            <p>
              Add work done, reuse previous job details, check totals instantly, and export a clean quotation
              without touching spreadsheets.
            </p>
          </div>
          <div className={`status-chip ${storageMode === 'Supabase' ? '' : 'status-chip--warning'}`}>
            <span>Storage</span>
            <strong>{storageMode}</strong>
          </div>
        </div>
      </section>

      <SummaryCards entries={entries} groupedEntries={groupedEntries} grandTotal={grandTotal} />

      <section className="top-grid">
        <EntryForm
          companyDetails={companyDetails}
          draftEntry={draftEntry}
          isSaving={isSaving}
          message={message}
          onAddEntry={handleAddEntry}
          onCompanyDetailChange={setCompanyDetails}
          onCopyPreviousDay={handleCopyPreviousDay}
          onDraftChange={handleDraftChange}
          onSeedSample={async () => {
            const seeded = await seedSampleEntries();
            setEntries(seeded.data || []);
            setMessage({ type: 'success', text: 'Sample entries loaded.' });
          }}
          setShowForm={setShowForm}
          showForm={showForm}
          suggestions={suggestions}
        />

        <AnalyticsDashboard entries={entries} groupedEntries={groupedEntries} />
      </section>

      <section className="panel table-panel">
        <div className="section-head">
          <div>
            <h2>Daily quotations</h2>
            <p className="panel-subtitle">Rows are grouped by date, with editable fields and instant totals.</p>
          </div>
          <div className="inline-actions">
            <button className="btn btn-secondary" onClick={handleGeneratePdf} disabled={isGeneratingPdf || !entries.length}>
              {isGeneratingPdf ? 'Preparing PDF...' : 'Generate PDF'}
            </button>
            <button className="btn btn-secondary" onClick={() => exportEntriesToExcel(entries)} disabled={!entries.length}>
              Export Excel
            </button>
          </div>
        </div>

        <EntryTable
          groupedEntries={groupedEntries}
          grandTotal={grandTotal}
          isLoading={isLoading}
          isSaving={isSaving}
          onDeleteEntry={handleDeleteEntry}
          onUpdateEntry={handleRowUpdate}
          suggestions={suggestions}
        />
      </section>

      <StickyActionBar
        onAddClick={() => setShowForm(true)}
        onExcelExport={() => exportEntriesToExcel(entries)}
        onGeneratePdf={handleGeneratePdf}
        onJsonExport={() => exportEntriesToJson(entries)}
        onJsonImport={handleJsonImport}
      />
    </main>
  );
}

export default HomePage;

import { useEffect, useMemo, useState } from 'react';
import EntryForm from '../components/EntryForm';
import EntryTable from '../components/EntryTable';
import StickyActionBar from '../components/StickyActionBar';
import SummaryCards from '../components/SummaryCards';
import { deleteEntry, getEntries, saveEntry } from '../services/quotationService';
import { exportEntriesToExcel, exportEntriesToJson, importEntriesFromJson } from '../utils/exportHelpers';
import {
  buildSuggestions,
  filterEntriesByDateRange,
  getGrandTotal,
  getLatestDate,
  groupEntriesByDate,
} from '../utils/quotationHelpers';
import { generateQuotationPdf } from '../utils/pdf';

const emptyEntry = (fallbackDate) => ({
  date: fallbackDate,
  ref_no: '',
  equipment: '',
  description: '',
  quantity: '',
  unit: 'NO',
  rate: '',
  amount: 0,
});

function HomePage() {
  const currentDate = new Date();
  const today = currentDate.toISOString().slice(0, 10);
  const lastSevenDaysStart = new Date(currentDate);
  lastSevenDaysStart.setDate(currentDate.getDate() - 6);
  const defaultFromDate = lastSevenDaysStart.toISOString().slice(0, 10);
  const [entries, setEntries] = useState([]);
  const [draftEntry, setDraftEntry] = useState(emptyEntry(today));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showForm, setShowForm] = useState(true);
  const [pdfRange, setPdfRange] = useState({ from: defaultFromDate, to: today });
  const [storageSource, setStorageSource] = useState('local');

  useEffect(() => {
    const loadEntries = async () => {
      setIsLoading(true);
      const result = await getEntries();

      if (result.error) setMessage({ type: 'error', text: result.error });
      setEntries(result.data || []);
      setStorageSource(result.source || 'local');

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
  const filteredPdfEntries = useMemo(
    () => filterEntriesByDateRange(entries, pdfRange.from, pdfRange.to),
    [entries, pdfRange.from, pdfRange.to]
  );
  const filteredPdfGroups = useMemo(() => groupEntriesByDate(filteredPdfEntries), [filteredPdfEntries]);
  const filteredPdfTotal = useMemo(() => getGrandTotal(filteredPdfEntries), [filteredPdfEntries]);

  const persistEntry = async (payload, successText) => {
    setIsSaving(true);
    const result = await saveEntry(payload);
    if (result.error) setMessage({ type: 'error', text: result.error });
    else {
      setEntries(result.data);
      setMessage({ type: 'success', text: successText });
    }
    setStorageSource(result.source || 'local');
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
    const confirmed = window.confirm('Are you sure you want to delete this entry?');
    if (!confirmed) {
      return;
    }

    setIsSaving(true);
    const result = await deleteEntry(entryId);
    if (result.error) setMessage({ type: 'error', text: result.error });
    else {
      setEntries(result.data);
      setMessage({ type: 'success', text: 'Entry deleted.' });
    }
    setStorageSource(result.source || 'local');
    setIsSaving(false);
  };

  const handleGeneratePdf = async () => {
    setIsGeneratingPdf(true);
    try {
      if (!filteredPdfEntries.length) {
        setMessage({ type: 'error', text: 'No entries found in the selected date range for PDF export.' });
        setIsGeneratingPdf(false);
        return;
      }

      generateQuotationPdf({ groupedEntries: filteredPdfGroups, grandTotal: filteredPdfTotal });
      setMessage({
        type: 'success',
        text: `Quotation PDF downloaded for ${pdfRange.from} to ${pdfRange.to}.`,
      });
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
        setStorageSource(result.source || 'local');
      }

      setEntries(latestData);
      setMessage({ type: 'success', text: 'Backup imported successfully.' });
      setIsSaving(false);
    } catch (error) {
      setMessage({ type: 'error', text: 'JSON import failed. Please check the file and try again.' });
      setIsSaving(false);
    }
  };

  const storageMode = storageSource === 'supabase' ? 'Supabase' : 'Local backup';

  return (
    <main className="app-shell">
      <SummaryCards entries={entries} groupedEntries={groupedEntries} grandTotal={grandTotal} />

      <section className="top-grid top-grid--single">
        <EntryForm
          draftEntry={draftEntry}
          isSaving={isSaving}
          message={message}
          onAddEntry={handleAddEntry}
          onDraftChange={handleDraftChange}
          setShowForm={setShowForm}
          showForm={showForm}
          storageMode={storageMode}
          suggestions={suggestions}
        />
      </section>

      <section className="panel table-panel">
        <div className="section-head">
          <div>
            <h2>Quotation Datas</h2>
            <p className="panel-subtitle">Use the date range below to view and edit only the required entries.</p>
          </div>
          <div className="inline-actions">
            <div className="export-range">
              <div className="field export-range-field">
                <label htmlFor="pdf-from-date">From</label>
                <input
                  id="pdf-from-date"
                  type="date"
                  value={pdfRange.from}
                  onChange={(event) => setPdfRange((current) => ({ ...current, from: event.target.value }))}
                />
              </div>
              <div className="field export-range-field">
                <label htmlFor="pdf-to-date">To</label>
                <input
                  id="pdf-to-date"
                  type="date"
                  value={pdfRange.to}
                  onChange={(event) => setPdfRange((current) => ({ ...current, to: event.target.value }))}
                />
              </div>
            </div>
            <button className="btn btn-secondary desktop-only" onClick={handleGeneratePdf} disabled={isGeneratingPdf || !entries.length}>
              {isGeneratingPdf ? 'Preparing PDF...' : 'Generate PDF'}
            </button>
            <button className="btn btn-secondary desktop-only" onClick={() => exportEntriesToExcel(entries)} disabled={!entries.length}>
              Export Excel
            </button>
          </div>
        </div>

        <EntryTable
          groupedEntries={filteredPdfGroups}
          grandTotal={filteredPdfTotal}
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

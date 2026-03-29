import { useEffect, useState } from 'react';
import { QUOTATION_UNITS } from '../utils/constants';
import { formatCurrency } from '../utils/quotationHelpers';

function EditableCard({ entry, onDeleteEntry, onUpdateEntry, suggestions }) {
  const [draft, setDraft] = useState(entry);

  useEffect(() => {
    setDraft(entry);
  }, [entry]);

  const updateDraft = (field, value) => {
    const nextDraft = { ...draft, [field]: value };
    if (field === 'equipment') {
      const suggestion = suggestions.equipmentLookup[value.trim().toLowerCase()];
      if (suggestion) {
        nextDraft.description = nextDraft.description || suggestion.description;
        nextDraft.rate = nextDraft.rate || suggestion.rate;
        nextDraft.unit = nextDraft.unit || suggestion.unit;
      }
    }
    setDraft(nextDraft);
  };

  const normalizedDraft = {
    ...draft,
    quantity: Number(draft.quantity || 0),
    rate: Number(draft.rate || 0),
  };
  const rowAmount = normalizedDraft.quantity * normalizedDraft.rate;

  return (
    <div className="entry-card">
      <div className="entry-card-head">
        <strong>#{entry.sequence}</strong>
        <span className="cell-amount">{formatCurrency(rowAmount)}</span>
      </div>

      <div className="entry-card-grid">
        <div className="field">
          <label>Date</label>
          <input type="date" value={draft.date} onChange={(event) => updateDraft('date', event.target.value)} />
        </div>
        <div className="field">
          <label>Ref No</label>
          <input value={draft.ref_no} onChange={(event) => updateDraft('ref_no', event.target.value)} />
        </div>
        <div className="field">
          <label>Equipment</label>
          <input value={draft.equipment} onChange={(event) => updateDraft('equipment', event.target.value)} />
        </div>
        <div className="field">
          <label>Description</label>
          <textarea value={draft.description} onChange={(event) => updateDraft('description', event.target.value)} />
        </div>
        <div className="field">
          <label>Quantity</label>
          <input type="number" min="0" step="0.01" value={draft.quantity} onChange={(event) => updateDraft('quantity', event.target.value)} />
        </div>
        <div className="field">
          <label>Unit</label>
          <select value={draft.unit} onChange={(event) => updateDraft('unit', event.target.value)}>
            {QUOTATION_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Rate</label>
          <input type="number" min="0" step="0.01" value={draft.rate} onChange={(event) => updateDraft('rate', event.target.value)} />
        </div>
        <div className="inline-actions">
          <button className="btn btn-secondary" onClick={() => onUpdateEntry({ ...normalizedDraft, amount: rowAmount })} type="button">
            Save
          </button>
          <button className="btn btn-danger" onClick={() => onDeleteEntry(entry.id)} type="button">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function EntryTable({ groupedEntries, grandTotal, isLoading, isSaving, onDeleteEntry, onUpdateEntry, suggestions }) {
  if (isLoading) return <div className="empty-state">Loading quotation entries...</div>;
  if (!groupedEntries.length) return <div className="empty-state">No entries yet. Add your first work item to begin.</div>;

  const flatEntries = groupedEntries.flatMap((group) => group.entries);

  return (
    <div className="table-grid">
      {isSaving ? <span className="helper-text">Saving changes...</span> : null}

      <div className="table-wrap">
        <table className="desktop-table">
          <thead>
            <tr>
              <th>SI No</th>
              <th>Date</th>
              <th>Ref No</th>
              <th>Equipment</th>
              <th>Description</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Rate</th>
              <th>Amount</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {flatEntries.map((entry, index) => (
              <tr key={entry.id}>
                <td>{index + 1}</td>
                <td>
                  <input type="date" defaultValue={entry.date} onBlur={(event) => onUpdateEntry({ ...entry, date: event.target.value })} />
                </td>
                <td>
                  <input defaultValue={entry.ref_no} onBlur={(event) => onUpdateEntry({ ...entry, ref_no: event.target.value })} />
                </td>
                <td>
                  <input defaultValue={entry.equipment} onBlur={(event) => onUpdateEntry({ ...entry, equipment: event.target.value })} />
                </td>
                <td>
                  <textarea defaultValue={entry.description} onBlur={(event) => onUpdateEntry({ ...entry, description: event.target.value })} />
                </td>
                <td>
                  <input type="number" min="0" step="0.01" defaultValue={entry.quantity} onBlur={(event) => onUpdateEntry({ ...entry, quantity: Number(event.target.value || 0) })} />
                </td>
                <td>
                  <select defaultValue={entry.unit} onChange={(event) => onUpdateEntry({ ...entry, unit: event.target.value })}>
                    {QUOTATION_UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input type="number" min="0" step="0.01" defaultValue={entry.rate} onBlur={(event) => onUpdateEntry({ ...entry, rate: Number(event.target.value || 0) })} />
                </td>
                <td className="cell-amount">{formatCurrency(entry.amount)}</td>
                <td>
                  <button className="btn btn-danger" onClick={() => onDeleteEntry(entry.id)} type="button">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mobile-cards">
        {flatEntries.map((entry, index) => (
          <EditableCard
            entry={{ ...entry, sequence: index + 1 }}
            key={`mobile-${entry.id}`}
            onDeleteEntry={onDeleteEntry}
            onUpdateEntry={onUpdateEntry}
            suggestions={suggestions}
          />
        ))}
      </div>

      <div className="grand-total">
        <div>
          <h3>Grand total</h3>
          <p className="helper-text">This is the full quotation amount across all work dates.</p>
        </div>
        <strong>{formatCurrency(grandTotal)}</strong>
      </div>
    </div>
  );
}

export default EntryTable;

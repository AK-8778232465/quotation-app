import { useEffect, useState } from 'react';
import { calculateAmount, formatCurrency } from '../utils/quotationHelpers';

function getNextAmount(previousDraft, nextDraft, changedField) {
  const suggestedAmount = calculateAmount(nextDraft.quantity, nextDraft.rate);
  const previousSuggestedAmount = calculateAmount(previousDraft.quantity, previousDraft.rate);
  const normalizedCurrentAmount = String(previousDraft.amount ?? '').trim();

  if (changedField !== 'amount' && suggestedAmount === null) {
    return '';
  }

  const shouldAutoFill =
    changedField !== 'amount' &&
    (normalizedCurrentAmount === '' ||
      (previousSuggestedAmount !== null && Number(normalizedCurrentAmount) === Number(previousSuggestedAmount)));

  if (shouldAutoFill && suggestedAmount !== null) {
    return String(suggestedAmount);
  }

  return nextDraft.amount;
}

function EditableDesktopRow({ entry, onDeleteEntry, onUpdateEntry, suggestions, sequence }) {
  const [draft, setDraft] = useState({ ...entry, amount: String(entry.amount ?? '') });

  useEffect(() => {
    setDraft({ ...entry, amount: String(entry.amount ?? '') });
  }, [entry]);

  const updateDraft = (field, value) => {
    const nextDraft = { ...draft, [field]: value };
    if (field === 'equipment') {
      const suggestion = suggestions.equipmentLookup[value.trim().toLowerCase()];
      if (suggestion) {
        nextDraft.description = nextDraft.description || suggestion.description;
        nextDraft.rate = nextDraft.rate || String(suggestion.rate || '');
        nextDraft.quantity = nextDraft.quantity || suggestion.quantity || '';
      }
    }

    nextDraft.amount = getNextAmount(draft, nextDraft, field);
    setDraft(nextDraft);
  };

  const suggestedAmount = calculateAmount(draft.quantity, draft.rate);
  const saveDraft = () =>
    onUpdateEntry({
      ...draft,
      rate: Number(draft.rate || 0),
      amount: draft.amount === '' ? null : Number(draft.amount || 0),
    });

  return (
    <tr>
      <td>{sequence}</td>
      <td>
        <input type="date" value={draft.date} onChange={(event) => updateDraft('date', event.target.value)} />
      </td>
      <td>
        <input value={draft.ref_no} onChange={(event) => updateDraft('ref_no', event.target.value)} />
      </td>
      <td>
        <input value={draft.equipment} onChange={(event) => updateDraft('equipment', event.target.value)} />
      </td>
      <td>
        <textarea value={draft.description} onChange={(event) => updateDraft('description', event.target.value)} />
      </td>
      <td>
        <input value={draft.quantity} onChange={(event) => updateDraft('quantity', event.target.value)} placeholder="25 MTR or LS" />
      </td>
      <td>
        <input type="number" min="0" step="0.01" value={draft.rate} onChange={(event) => updateDraft('rate', event.target.value)} />
      </td>
      <td>
        <input type="number" min="0" step="0.01" value={draft.amount} onChange={(event) => updateDraft('amount', event.target.value)} />
        <div className="table-helper-text">{suggestedAmount === null ? 'Manual' : `Suggested ${formatCurrency(suggestedAmount)}`}</div>
      </td>
      <td>
        <div className="row-actions">
          <button className="btn btn-secondary" onClick={saveDraft} type="button">
            Save
          </button>
          <button className="btn btn-danger" onClick={() => onDeleteEntry(entry.id)} type="button">
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

function EditableCard({ entry, onDeleteEntry, onUpdateEntry, suggestions }) {
  const [draft, setDraft] = useState({ ...entry, amount: String(entry.amount ?? '') });

  useEffect(() => {
    setDraft({ ...entry, amount: String(entry.amount ?? '') });
  }, [entry]);

  const updateDraft = (field, value) => {
    const nextDraft = { ...draft, [field]: value };
    if (field === 'equipment') {
      const suggestion = suggestions.equipmentLookup[value.trim().toLowerCase()];
      if (suggestion) {
        nextDraft.description = nextDraft.description || suggestion.description;
        nextDraft.rate = nextDraft.rate || String(suggestion.rate || '');
        nextDraft.quantity = nextDraft.quantity || suggestion.quantity || '';
      }
    }
    nextDraft.amount = getNextAmount(draft, nextDraft, field);
    setDraft(nextDraft);
  };

  const suggestedAmount = calculateAmount(draft.quantity, draft.rate);

  return (
    <div className="entry-card">
      <div className="entry-card-head">
        <strong>#{entry.sequence}</strong>
        <span className="cell-amount">{formatCurrency(draft.amount || suggestedAmount || 0)}</span>
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
          <label>Quantity / Unit</label>
          <input value={draft.quantity} onChange={(event) => updateDraft('quantity', event.target.value)} />
        </div>
        <div className="field">
          <label>Rate</label>
          <input type="number" min="0" step="0.01" value={draft.rate} onChange={(event) => updateDraft('rate', event.target.value)} />
        </div>
        <div className="field">
          <label>Amount</label>
          <input type="number" min="0" step="0.01" value={draft.amount} onChange={(event) => updateDraft('amount', event.target.value)} />
          <span className="table-helper-text">{suggestedAmount === null ? 'Manual amount required' : `Suggested ${formatCurrency(suggestedAmount)}`}</span>
        </div>
        <div className="inline-actions">
          <button
            className="btn btn-secondary"
            onClick={() =>
              onUpdateEntry({
                ...draft,
                rate: Number(draft.rate || 0),
                amount: draft.amount === '' ? null : Number(draft.amount || 0),
              })
            }
            type="button"
          >
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
              <th>Qty / Unit</th>
              <th>Rate</th>
              <th>Amount</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {flatEntries.map((entry, index) => (
              <EditableDesktopRow
                entry={entry}
                key={entry.id}
                onDeleteEntry={onDeleteEntry}
                onUpdateEntry={onUpdateEntry}
                sequence={index + 1}
                suggestions={suggestions}
              />
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

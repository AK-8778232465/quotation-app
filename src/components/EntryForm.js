import { useMemo } from 'react';
import { calculateAmount, formatCurrency } from '../utils/quotationHelpers';

function EntryForm({
  draftEntry,
  isSaving,
  message,
  onAddEntry,
  onDraftChange,
  setShowForm,
  showForm,
  storageMode,
  suggestions,
}) {
  const amount = useMemo(
    () => calculateAmount(draftEntry.quantity, draftEntry.rate),
    [draftEntry.quantity, draftEntry.rate]
  );

  return (
    <div className="panel">
      <div className="section-head">
        <div className={`status-chip ${storageMode === 'Supabase' ? '' : 'status-chip--warning'}`}>
          <span>Storage</span>
          <strong>{storageMode}</strong>
        </div>
        <button className="btn btn-ghost" onClick={() => setShowForm((current) => !current)} type="button">
          {showForm ? 'Hide entry form' : 'Show entry form'}
        </button>
      </div>

      {showForm ? (
        <form onSubmit={onAddEntry}>
          <div className="section-head" style={{ marginTop: 18 }}>
            <div>
              <h3>Add daily entry</h3>
              <p className="panel-subtitle">Previous equipment entries help auto-fill descriptions and rates.</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="entry-date">Date</label>
              <input id="entry-date" type="date" value={draftEntry.date} onChange={(event) => onDraftChange('date', event.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="entry-ref">Ref No</label>
              <input id="entry-ref" value={draftEntry.ref_no} onChange={(event) => onDraftChange('ref_no', event.target.value)} placeholder="REF-101" required />
            </div>
            <div className="field field--full">
              <label htmlFor="entry-equipment">Equipment name</label>
              <input
                id="entry-equipment"
                list="equipment-suggestions"
                value={draftEntry.equipment}
                onChange={(event) => onDraftChange('equipment', event.target.value)}
                placeholder="Cable Tray, Panel Board..."
                required
              />
              <datalist id="equipment-suggestions">
                {suggestions.equipmentNames.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>
            <div className="field field--full">
              <label htmlFor="entry-description">Description</label>
              <textarea
                id="entry-description"
                value={draftEntry.description}
                onChange={(event) => onDraftChange('description', event.target.value)}
                placeholder="Describe the electrical work done..."
                required
              />
            </div>
            <div className="field field--compact">
              <label htmlFor="entry-quantity">Quantity / Unit</label>
              <input
                id="entry-quantity"
                value={draftEntry.quantity}
                onChange={(event) => onDraftChange('quantity', event.target.value)}
                placeholder="25 MTR or LS"
                required
              />
            </div>
            <div className="field field--compact">
              <label htmlFor="entry-rate">Rate</label>
              <input
                id="entry-rate"
                type="number"
                min="0"
                step="0.01"
                list="rate-suggestions"
                value={draftEntry.rate}
                onChange={(event) => onDraftChange('rate', event.target.value)}
                placeholder="0.00"
                required
              />
              <datalist id="rate-suggestions">
                {suggestions.rates.map((rate) => (
                  <option key={rate} value={rate} />
                ))}
              </datalist>
            </div>
            <div className="field field--compact">
              <label htmlFor="entry-amount">Amount</label>
              <input
                id="entry-amount"
                type="number"
                min="0"
                step="0.01"
                value={draftEntry.amount}
                onChange={(event) => onDraftChange('amount', event.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="field field--compact">
              <div className="amount-box">
                <span>{amount === null ? 'Manual amount required' : 'Suggested amount'}</span>
                <strong>{amount === null ? 'Enter manually' : formatCurrency(amount)}</strong>
              </div>
            </div>
          </div>

          <div className="button-row button-row--center" style={{ marginTop: 16 }}>
            <button className="btn btn-primary" type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save entry'}
            </button>
          </div>
        </form>
      ) : (
        null
      )}

      {message.text ? (
        <p className={`message ${message.type === 'error' ? 'message--error' : 'message--success'}`}>{message.text}</p>
      ) : null}
    </div>
  );
}

export default EntryForm;

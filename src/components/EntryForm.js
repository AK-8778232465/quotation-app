import { useMemo } from 'react';
import { QUOTATION_UNITS } from '../utils/constants';
import { formatCurrency } from '../utils/quotationHelpers';

function EntryForm({
  draftEntry,
  isSaving,
  message,
  onAddEntry,
  onCopyPreviousDay,
  onDraftChange,
  onSeedSample,
  setShowForm,
  showForm,
  storageMode,
  suggestions,
}) {
  const amount = useMemo(
    () => Number(draftEntry.quantity || 0) * Number(draftEntry.rate || 0),
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
            <div className="inline-actions">
              <button className="btn btn-secondary" onClick={() => onCopyPreviousDay(draftEntry.date)} type="button">
                Copy previous day
              </button>
              <button className="btn btn-secondary" onClick={onSeedSample} type="button">
                Load sample data
              </button>
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
              <label htmlFor="entry-quantity">Quantity</label>
              <input id="entry-quantity" type="number" min="0" step="0.01" value={draftEntry.quantity} onChange={(event) => onDraftChange('quantity', event.target.value)} required />
            </div>
            <div className="field field--compact">
              <label htmlFor="entry-unit">Unit</label>
              <select id="entry-unit" value={draftEntry.unit} onChange={(event) => onDraftChange('unit', event.target.value)}>
                {QUOTATION_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
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
            <div className="field field--full">
              <div className="amount-box">
                <span>Auto-calculated amount</span>
                <strong>{formatCurrency(amount)}</strong>
              </div>
            </div>
          </div>

          <div className="button-row" style={{ marginTop: 16 }}>
            <button className="btn btn-primary" type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save entry'}
            </button>
          </div>
        </form>
      ) : (
        <div className="empty-state">
          <p className="helper-text">Use the sticky Add Entry button below whenever you want to enter a new item.</p>
        </div>
      )}

      {message.text ? (
        <p className={`message ${message.type === 'error' ? 'message--error' : 'message--success'}`}>{message.text}</p>
      ) : (
        <p className="helper-text">Without Supabase env vars, the app still works using browser local storage.</p>
      )}
    </div>
  );
}

export default EntryForm;

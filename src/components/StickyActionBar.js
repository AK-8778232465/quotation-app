function StickyActionBar({ onAddClick, onExcelExport, onGeneratePdf, onJsonExport, onJsonImport }) {
  return (
    <div className="sticky-actions">
      <button className="btn btn-primary" onClick={onAddClick} type="button">
        Add Entry
      </button>
      <button className="btn btn-secondary" onClick={onGeneratePdf} type="button">
        PDF
      </button>
      <button className="btn btn-secondary" onClick={onExcelExport} type="button">
        Excel
      </button>
      <button className="btn btn-secondary" onClick={onJsonExport} type="button">
        Backup JSON
      </button>
      <label className="btn btn-secondary" htmlFor="json-import">
        Import JSON
      </label>
      <input
        className="sr-only"
        id="json-import"
        type="file"
        accept="application/json"
        onChange={(event) => {
          const [file] = event.target.files || [];
          if (file) onJsonImport(file);
          event.target.value = '';
        }}
      />
    </div>
  );
}

export default StickyActionBar;

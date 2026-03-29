import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

export function exportEntriesToExcel(entries) {
  const worksheet = XLSX.utils.json_to_sheet(entries);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Quotation Entries');
  const output = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([output], { type: 'application/octet-stream' }), 'quotation-entries.xlsx');
}

export function exportEntriesToJson(entries) {
  const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json;charset=utf-8' });
  saveAs(blob, 'quotation-backup.json');
}

export function importEntriesFromJson(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result || '[]');
        resolve(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

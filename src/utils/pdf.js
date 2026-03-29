import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from './quotationHelpers';

export function generateQuotationPdf({ companyDetails, groupedEntries, grandTotal }) {
  const doc = new jsPDF();
  const rows = [];
  let serial = 1;

  groupedEntries.forEach((group) => {
    group.entries.forEach((entry) => {
      rows.push([
        serial,
        entry.date,
        entry.ref_no,
        entry.equipment,
        entry.description,
        `${entry.quantity} ${entry.unit}`,
        formatCurrency(entry.rate),
        formatCurrency(entry.amount),
      ]);
      serial += 1;
    });
  });

  doc.setFontSize(18);
  doc.text(companyDetails.companyName || 'Company Name', 14, 20);
  doc.setFontSize(12);
  doc.text(companyDetails.quotationTitle || 'Work Quotation', 14, 28);
  doc.text(`Client: ${companyDetails.clientName || 'Client Name'}`, 14, 35);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 42);

  autoTable(doc, {
    startY: 50,
    head: [['SI No', 'Date', 'Ref No', 'Equipment', 'Description', 'Qty', 'Rate', 'Amount']],
    body: rows,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [38, 70, 83] },
    foot: [['', '', '', '', '', '', 'Grand Total', formatCurrency(grandTotal)]],
    footStyles: {
      fillColor: [201, 95, 45],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
  });

  doc.save(`quotation-${new Date().toISOString().slice(0, 10)}.pdf`);
}

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PDF_TEMPLATE } from './pdfTemplate';

function formatPdfDate(value) {
  const date = new Date(value);
  const day = String(date.getDate()).padStart(2, '0');
  const month = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

function formatMonthLabel(groupedEntries) {
  const firstDate = groupedEntries[0]?.date || new Date().toISOString().slice(0, 10);
  return new Intl.DateTimeFormat('en-IN', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(firstDate));
}

function formatMoney(value) {
  return Number(value || 0).toFixed(2);
}

function drawHeader(doc, groupedEntries) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const left = 14;
  const right = pageWidth - 14;
  const width = right - left;

  doc.setFillColor(22, 44, 52);
  doc.roundedRect(left, 12, width, 24, 3, 3, 'F');

  doc.setFillColor(247, 248, 250);
  doc.roundedRect(left, 40, width, 24, 3, 3, 'F');
  doc.setDrawColor(214, 220, 226);
  doc.roundedRect(left, 40, width, 24, 3, 3, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.text(PDF_TEMPLATE.companyName, pageWidth / 2, 21, { align: 'center' });
  doc.setFontSize(12);
  doc.text(PDF_TEMPLATE.companySubtitle, pageWidth / 2, 28, { align: 'center' });

  doc.setFillColor(203, 95, 45);
  doc.roundedRect(pageWidth / 2 - 22, 30.5, 44, 8, 2, 2, 'F');
  doc.setFontSize(10.5);
  doc.text(PDF_TEMPLATE.quotationTitle, pageWidth / 2, 35.8, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(28, 30, 34);
  doc.setFontSize(8.8);
  doc.setFont('helvetica', 'bold');
  doc.text('To', left + 3, 47);
  doc.text('Vendor Code', left + 98, 47);
  doc.text('Unit', left + 98, 53.5);
  doc.text('Month', left + 98, 60);

  doc.setFont('helvetica', 'normal');
  PDF_TEMPLATE.clientLines.forEach((line, index) => {
    doc.text(line, left + 10, 47 + index * 6);
  });

  doc.text(`: ${PDF_TEMPLATE.vendorCode}`, left + 120, 47);
  doc.text(`: ${PDF_TEMPLATE.unit}`, left + 120, 53.5);
  doc.text(`: ${formatMonthLabel(groupedEntries)}`, left + 120, 60);
}

function drawFooter(doc) {
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageNumber = doc.getCurrentPageInfo().pageNumber;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(90, 90, 90);
  doc.text(`Generated on ${new Date().toLocaleDateString('en-IN')}`, 14, pageHeight - 8);
  doc.text(`Page ${pageNumber}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
  doc.setTextColor(0, 0, 0);
}

export function generateQuotationPdf({ groupedEntries, grandTotal }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const rows = [];
  let serial = 1;

  groupedEntries.forEach((group) => {
    group.entries.forEach((entry) => {
      rows.push([
        serial,
        formatPdfDate(entry.date),
        entry.ref_no,
        entry.equipment,
        entry.description,
        `${entry.quantity} ${entry.unit}`,
        formatMoney(entry.rate),
        formatMoney(entry.amount),
      ]);
      serial += 1;
    });
  });

  autoTable(doc, {
    startY: 70,
    margin: { top: 70, left: 14, right: 14, bottom: 16 },
    head: [['SI No', 'DATE', 'Ref.No', 'Equipment Name', 'Description', 'Qty', 'Rate', 'Amount']],
    body: rows,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      lineColor: [212, 218, 223],
      lineWidth: 0.12,
      valign: 'top',
      overflow: 'linebreak',
      textColor: [20, 20, 20],
    },
    headStyles: {
      fillColor: [232, 236, 239],
      textColor: [24, 29, 34],
      fontStyle: 'bold',
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: [250, 251, 252],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 28 },
      4: { cellWidth: 45 },
      5: { cellWidth: 20, halign: 'center' },
      6: { cellWidth: 19, halign: 'right' },
      7: { cellWidth: 20, halign: 'right' },
    },
    foot: [['', '', '', '', '', '', 'Grand Total', formatMoney(grandTotal)]],
    footStyles: {
      fillColor: [22, 44, 52],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'right',
    },
    didDrawPage: () => {
      drawHeader(doc, groupedEntries);
      drawFooter(doc);
    },
  });

  doc.save(`quotation-${new Date().toISOString().slice(0, 10)}.pdf`);
}

import { formatCurrency } from '../utils/quotationHelpers';

function SummaryCards({ entries, groupedEntries, grandTotal }) {
  const latestDay = groupedEntries[0];
  const summaryItems = [
    { label: 'Total entries', value: entries.length, note: 'Across all quotation dates' },
    { label: 'Work days', value: groupedEntries.length, note: 'Grouped by entered date' },
    {
      label: 'Latest day total',
      value: latestDay ? formatCurrency(latestDay.total) : formatCurrency(0),
      note: latestDay ? latestDay.label : 'No entries yet',
    },
    { label: 'Grand total', value: formatCurrency(grandTotal), note: 'Full quotation amount' },
  ];

  return (
    <section className="summary-grid">
      {summaryItems.map((item) => (
        <article className="summary-card" key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          <small>{item.note}</small>
        </article>
      ))}
    </section>
  );
}

export default SummaryCards;

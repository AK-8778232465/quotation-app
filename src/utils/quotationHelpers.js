export function calculateAmount(quantity, rate) {
  return Number(quantity || 0) * Number(rate || 0);
}

export function normalizeEntry(entry) {
  return {
    id: entry.id,
    date: entry.date || new Date().toISOString().slice(0, 10),
    ref_no: entry.ref_no || '',
    equipment: entry.equipment || '',
    description: entry.description || '',
    quantity: Number(entry.quantity || 0),
    unit: entry.unit || 'NO',
    rate: Number(entry.rate || 0),
    amount: Number(entry.amount ?? calculateAmount(entry.quantity, entry.rate)),
    created_at: entry.created_at || new Date().toISOString(),
  };
}

export function sortEntries(entries) {
  return [...entries]
    .map((entry) => normalizeEntry(entry))
    .sort((first, second) => {
      if (first.date !== second.date) {
        return second.date.localeCompare(first.date);
      }
      return new Date(second.created_at).getTime() - new Date(first.created_at).getTime();
    });
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

export function formatDateLabel(date) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export function groupEntriesByDate(entries) {
  const sortedEntries = sortEntries(entries);
  const groupedMap = sortedEntries.reduce((accumulator, entry) => {
    accumulator[entry.date] = accumulator[entry.date] || [];
    accumulator[entry.date].push(entry);
    return accumulator;
  }, {});

  return Object.entries(groupedMap).map(([date, grouped]) => ({
    date,
    label: formatDateLabel(date),
    total: grouped.reduce((sum, entry) => sum + Number(entry.amount || 0), 0),
    entries: grouped.map((entry, index) => ({
      ...entry,
      sequence: index + 1,
    })),
  }));
}

export function getGrandTotal(entries) {
  return entries.reduce((total, entry) => total + Number(entry.amount || 0), 0);
}

export function getLatestDate(entries) {
  return sortEntries(entries)[0]?.date;
}

export function buildSuggestions(entries) {
  const equipmentMap = {};
  const equipmentNames = [];
  const descriptions = [];
  const rates = [];

  sortEntries(entries).forEach((entry) => {
    if (entry.equipment && !equipmentMap[entry.equipment.toLowerCase()]) {
      equipmentMap[entry.equipment.toLowerCase()] = {
        description: entry.description,
        rate: entry.rate,
        unit: entry.unit,
      };
      equipmentNames.push(entry.equipment);
    }

    if (entry.description && !descriptions.includes(entry.description)) {
      descriptions.push(entry.description);
    }

    const rateValue = String(entry.rate);
    if (!rates.includes(rateValue)) {
      rates.push(rateValue);
    }
  });

  return {
    equipmentLookup: equipmentMap,
    equipmentNames,
    descriptions,
    rates,
  };
}

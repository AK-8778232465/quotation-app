export function parseQuantityValue(quantity) {
  const normalizedQuantity = String(quantity ?? '').trim().replace(',', '.');
  if (!normalizedQuantity) {
    return null;
  }

  const match = normalizedQuantity.match(/^(\d+(?:\.\d+)?)(?:\s+([A-Za-z]+))?$/);
  return match ? Number(match[1]) : null;
}

export function extractUnitFromQuantity(quantity) {
  const normalizedQuantity = String(quantity ?? '').trim();
  if (!normalizedQuantity) return '';

  const withoutLeadingNumber = normalizedQuantity.replace(/^-?\d+(\.\d+)?\s*/, '').trim();
  return withoutLeadingNumber || normalizedQuantity;
}

export function calculateAmount(quantity, rate) {
  const quantityValue = parseQuantityValue(quantity);
  if (quantityValue === null) {
    return null;
  }

  return quantityValue * Number(rate || 0);
}

export function resolveAmount(entry) {
  if (entry.amount !== null && entry.amount !== undefined && String(entry.amount).trim() !== '') {
    const explicitAmount = Number(entry.amount);
    if (Number.isFinite(explicitAmount)) {
      return explicitAmount;
    }
  }

  const calculatedAmount = calculateAmount(entry.quantity, entry.rate);
  if (calculatedAmount !== null) {
    return calculatedAmount;
  }

  return 0;
}

export function normalizeEntry(entry) {
  return {
    id: entry.id,
    date: entry.date || new Date().toISOString().slice(0, 10),
    ref_no: entry.ref_no || '',
    equipment: entry.equipment || '',
    description: entry.description || '',
    quantity: String(entry.quantity ?? '').trim(),
    unit: entry.unit || extractUnitFromQuantity(entry.quantity),
    rate: Number(entry.rate || 0),
    amount: resolveAmount(entry),
    created_at: entry.created_at || new Date().toISOString(),
    deleted_at: entry.deleted_at || null,
  };
}

export function isEntryDeleted(entry) {
  return Boolean(entry?.deleted_at);
}

export function getActiveEntries(entries) {
  return entries.filter((entry) => !isEntryDeleted(entry));
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

export function getOldestDate(entries) {
  return sortEntries(entries).at(-1)?.date;
}

export function filterEntriesByDateRange(entries, fromDate, toDate) {
  return entries.filter((entry) => {
    const entryDate = entry.date;
    if (fromDate && entryDate < fromDate) {
      return false;
    }
    if (toDate && entryDate > toDate) {
      return false;
    }
    return true;
  });
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
        quantity: entry.quantity,
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

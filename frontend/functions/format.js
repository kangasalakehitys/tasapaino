// Finnish number and date formatting.

const intFmt = new Intl.NumberFormat('fi-FI', { maximumFractionDigits: 0 });
const pctFmt = new Intl.NumberFormat('fi-FI', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export const MONTHS = [
  'tammikuu', 'helmikuu', 'maaliskuu', 'huhtikuu', 'toukokuu', 'kesäkuu',
  'heinäkuu', 'elokuu', 'syyskuu', 'lokakuu', 'marraskuu', 'joulukuu'
];

export const fmtInt = (n) => intFmt.format(n);
export const fmtPct = (n) => `${n > 0 ? '+' : ''}${pctFmt.format(n)} %`;
// Unsigned percentage, e.g. model error rates.
export const fmtPctPlain = (n) => `${pctFmt.format(n)} %`;
export const fmtSigned =(n) => `${n > 0 ? '+' : ''}${intFmt.format(n)}`;
export const pctChange = (from, to) => ((to - from) / from) * 100;

// '2026M08' -> { year: 2026, month: 8 }
export function parsePeriod(period) {
  const [y, m] = period.split('M');
  return { year: Number(y), month: Number(m) };
}

// '2026M08' -> 'elokuu 2026'
export function periodLabel(period) {
  const { year, month } = parsePeriod(period);
  return `${MONTHS[month - 1]} ${year}`;
}

// '2026M08' -> 'elokuun 2026 lopussa'
export function periodEndLabel(period) {
  const { year, month } = parsePeriod(period);
  return `${MONTHS[month - 1]}n ${year} lopussa`;
}

// '2026Q2' -> { year: 2026, quarter: 2 }
export function parseQuarter(period) {
  const [y, q] = period.split('Q');
  return { year: Number(y), quarter: Number(q) };
}

// '2026Q2' -> 'tammi–kesäkuu 2026' (cumulative from the start of the year)
export function yearToDateLabel(period) {
  const { year, quarter } = parseQuarter(period);
  return `tammi–${MONTHS[quarter * 3 - 1]} ${year}`;
}

// Short label for a table or tooltip: '2025', 'Q2/2026', '8/2026'.
export function periodShort(period) {
  const p = String(period);
  if (p.includes('Q')) {
    const { year, quarter } = parseQuarter(p);
    return `Q${quarter}/${year}`;
  }
  if (p.includes('M')) {
    const { year, month } = parsePeriod(p);
    return `${month}/${year}`;
  }
  return p;
}

// End of a period as a UTC timestamp: year, quarter ('2026Q2') or month ('2026M08').
export function periodEnd(period) {
  const p = String(period);
  if (p.includes('Q')) {
    const { year, quarter } = parseQuarter(p);
    return Date.UTC(year, quarter * 3, 0);
  }
  if (p.includes('M')) {
    const { year, month } = parsePeriod(p);
    return Date.UTC(year, month, 0);
  }
  return Date.UTC(Number(p), 11, 31);
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}

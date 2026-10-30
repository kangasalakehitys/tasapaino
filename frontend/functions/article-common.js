// Helpers shared by the Tasapaino articles. Element ids inside an article are
// `<article id>-<name>`, e.g. vuosikate-analysis (the PowerPoint export reads
// -kicker, -standfirst, -meta and -analysis, functions/pptx-deck.js).

import { escapeHtml } from './format.js';

const nf0 = new Intl.NumberFormat('fi-FI', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('fi-FI', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nf2 = new Intl.NumberFormat('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtEur = (v) => (v == null ? '–' : `${nf0.format(v)} €`);
export const fmtEurPc = (v) => (v == null ? '–' : `${nf0.format(v)} €/as`);
export const fmtMe = (v) => (v == null ? '–' : `${nf1.format(v / 1e6)} M€`);
export const fmtPct = (v, d = 1) => (v == null ? '–' : `${(d === 2 ? nf2 : nf1).format(v)} %`);
export const fmtSignedPct = (v) => (v == null ? '–' : `${v > 0 ? '+' : ''}${nf1.format(v)} %`);
export const fmtSignedEur = (v) => (v == null ? '–' : `${v > 0 ? '+' : ''}${nf0.format(v)} €`);
export const fmtNum = (v) => (v == null ? '–' : nf1.format(v));

// Formatter by unit of compare-set.mjs: '€/as', '%', 'htv'.
export function formatter(unit) {
  if (unit === '%') return (v) => fmtPct(v, Math.abs(v ?? 0) < 20 ? 2 : 1);
  if (unit === '€/as') return fmtEurPc;
  return fmtNum;
}
// Short axis formatter (no unit).
export const axisFormat = (unit) => (unit === '%' ? (v) => nf1.format(v) : (v) => nf0.format(v));

export const paragraphs = (list) => list.filter(Boolean).map((p) => `<p>${escapeHtml(p)}</p>`).join('');
export const listItems = (list) => `<ul>${list.filter(Boolean).map((p) => `<li>${escapeHtml(p)}</li>`).join('')}</ul>`;

export const byPrefix = (prefix) => (name) => document.getElementById(`${prefix}-${name}`);

// Figure markup with a chart, table or other element inside.
export function figureHtml(id, { title, subtitle = '', source = '', body }) {
  return `
    <figure class="figure" id="${id}">
      <h2 class="figure__title">${escapeHtml(title)}</h2>
      ${subtitle ? `<p class="figure__subtitle">${escapeHtml(subtitle)}</p>` : ''}
      ${body}
      ${source ? `<p class="figure__source">Lähde: ${escapeHtml(source)}</p>` : ''}
    </figure>`;
}

export function summaryHtml(text, title = 'Yhteenveto') {
  return `<aside class="summary-box"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(text)}</p></aside>`;
}

export function showError(container, err) {
  console.error(err);
  container.innerHTML = `<p class="error">Tietojen haku epäonnistui: ${escapeHtml(err.message)}</p>`;
}

// Difference in percent, or null.
export const diffPct = (a, b) => (a == null || b == null || b === 0 ? null : (100 * (a - b)) / Math.abs(b));

// "x % yli/alle" sentence part.
export function compareWords(own, ref, unit) {
  if (own == null || ref == null) return 'ei vertailutietoa';
  if (unit === '%') {
    const d = own - ref;
    return `${nf1.format(Math.abs(d))} %-yksikköä ${d >= 0 ? 'korkeampi' : 'matalampi'}`;
  }
  const d = diffPct(own, ref);
  return `${nf0.format(Math.abs(d))} % ${d >= 0 ? 'suurempi' : 'pienempi'}`;
}

// Runs `render` for an article when its tab is first opened (and again when
// the municipality or peers change while it is open). Articles that were not
// opened are rendered when they are opened.
export function lazyArticles(submenu, renderers) {
  const done = new Set();
  const run = (id) => {
    if (!renderers[id] || done.has(id)) return;
    done.add(id);
    Promise.resolve(renderers[id]()).catch((err) => showError(document.getElementById(`${id}-content`), err));
  };
  submenu.addEventListener('tab-change', (e) => run(e.detail.id));
  run(submenu.selected || submenu.querySelector('article[data-tab]')?.id);
  return {
    // Re-render the open article, forget the others.
    reset() {
      done.clear();
      run(submenu.selected);
    }
  };
}

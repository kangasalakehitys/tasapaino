// <kpi-tile> — key figure with a comparison (stat tile). The difference to the
// reference is green when it is in the good direction and red otherwise
// (brand_overview.md: positive #009651, negative #DE232F).
//
//   el.setData({ label, value, unit?, format: (v) => string, ref?, refLabel?,
//                better?: 'high' | 'low' | null, note?, href? })

import { escapeHtml } from '../functions/format.js';

const nf1 = new Intl.NumberFormat('fi-FI', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

class KpiTile extends HTMLElement {
  setData({ label, value, format, ref = null, refLabel = '', better = null, unit = '', note = '', href = '' }) {
    this.classList.add('kpi');
    let delta = '';
    if (value != null && ref != null) {
      const diff = unit === '%' ? value - ref : ref !== 0 ? (100 * (value - ref)) / Math.abs(ref) : null;
      if (diff != null) {
        const good = better == null ? null : (better === 'high') === (diff >= 0);
        const cls = good == null ? '' : good ? 'kpi__delta--good' : 'kpi__delta--bad';
        const text = unit === '%'
          ? `${diff >= 0 ? '+' : '−'}${nf1.format(Math.abs(diff))} %-yks.`
          : `${diff >= 0 ? '+' : '−'}${Math.round(Math.abs(diff))} %`;
        delta = `<p class="kpi__delta ${cls}">${text} <span>vs. ${escapeHtml(refLabel)} ${escapeHtml(format(ref))}</span></p>`;
      }
    }
    const body = `
      <p class="kpi__label">${escapeHtml(label)}</p>
      <p class="kpi__value">${escapeHtml(value == null ? '–' : format(value))}</p>
      ${delta}
      ${note ? `<p class="kpi__note">${escapeHtml(note)}</p>` : ''}`;
    this.innerHTML = href ? `<a class="kpi__link" href="${href}">${body}</a>` : body;
    return this;
  }
}

customElements.define('kpi-tile', KpiTile);

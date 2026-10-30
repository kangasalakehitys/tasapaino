// <data-table> — reusable sortable table (two colours, 10pt).
//
//   el.setData({
//     columns: [{ key, label, format?: (v, row) => string, numeric?: bool,
//                 signColor?: bool   (positive green, negative red) }],
//     rows: [{ ... }],
//     highlight?: (row) => bool,
//     sort?: { key, dir: 'asc' | 'desc' },
//     caption?: string
//   });

import { escapeHtml } from '../functions/format.js';

function cellClass(column, value) {
  const classes = [];
  if (column.numeric) classes.push('num');
  if (column.signColor && typeof value === 'number') {
    if (value > 0) classes.push('pos');
    if (value < 0) classes.push('neg');
  }
  return classes.join(' ');
}

class DataTable extends HTMLElement {
  setData(data) {
    this.data = data;
    this.sort = data.sort || null;
    this.render();
  }

  sortedRows() {
    const rows = [...this.data.rows];
    if (!this.sort) return rows;
    const { key, dir } = this.sort;
    const sign = dir === 'asc' ? 1 : -1;
    return rows.sort((a, b) => {
      const va = a[key];
      const vb = b[key];
      if (va == null) return 1;
      if (vb == null) return -1;
      return (typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb), 'fi')) * sign;
    });
  }

  render() {
    const { columns, highlight, caption } = this.data;
    const ariaSort = (c) => (this.sort?.key === c.key ? (this.sort.dir === 'asc' ? 'ascending' : 'descending') : 'none');
    const arrow = (c) => (this.sort?.key === c.key ? (this.sort.dir === 'asc' ? '▲' : '▼') : '↕');
    this.innerHTML = `
      <div class="data-table">
        <table>
          ${caption ? `<caption>${escapeHtml(caption)}</caption>` : ''}
          <thead><tr>
            ${columns.map((c) => `
              <th scope="col" aria-sort="${ariaSort(c)}" class="${c.numeric ? 'num' : ''}">
                <button type="button" data-key="${c.key}">${escapeHtml(c.label)} <span aria-hidden="true">${arrow(c)}</span></button>
              </th>`).join('')}
          </tr></thead>
          <tbody>
            ${this.sortedRows().map((row) => `
              <tr${highlight?.(row) ? ' class="is-highlight"' : ''}>
                ${columns.map((c) => `<td class="${cellClass(c, row[c.key])}">${escapeHtml(c.format ? c.format(row[c.key], row) : row[c.key] ?? '')}</td>`).join('')}
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
    this.querySelectorAll('th button').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        const dir = this.sort?.key === key && this.sort.dir === 'desc' ? 'asc' : 'desc';
        this.sort = { key, dir };
        this.render();
      });
    });
  }
}

customElements.define('data-table', DataTable);

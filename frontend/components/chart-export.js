// <chart-export> — PNG / JPG / SVG / CSV download toolbar for any chart.
// Set `el.source = { filename, getSVG(): string, getCSV(): string }`.

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function svgToRaster(svg, type, scale = 2) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      // JPG has no transparency, so give it a white background.
      if (type === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Kuvan muodostus epäonnistui'))), type, 0.95);
    };
    img.onerror = reject;
    img.src = url;
  });
}

export async function exportAs(format, source) {
  const name = source.filename || 'kuvaaja';
  if (format === 'csv') {
    // BOM so Excel opens Finnish characters correctly.
    download(new Blob(['﻿' + source.getCSV()], { type: 'text/csv;charset=utf-8' }), `${name}.csv`);
    return;
  }
  const svg = source.getSVG();
  if (format === 'svg') {
    download(new Blob([svg], { type: 'image/svg+xml' }), `${name}.svg`);
    return;
  }
  const type = format === 'jpg' ? 'image/jpeg' : 'image/png';
  download(await svgToRaster(svg, type), `${name}.${format}`);
}

export function toCSV(header, rows) {
  const cell = (v) => {
    const s = v == null ? '' : String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  // Semicolon separator works with Finnish Excel locale.
  return [header, ...rows].map((r) => r.map(cell).join(';')).join('\r\n');
}

class ChartExport extends HTMLElement {
  connectedCallback() {
    this.classList.add('chart-export');
    this.innerHTML = ['png', 'jpg', 'svg', 'csv']
      .map((f) => `<button type="button" data-format="${f}" title="Lataa ${f.toUpperCase()}">${f.toUpperCase()}</button>`)
      .join('');
    this.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-format]');
      if (btn && this.source) exportAs(btn.dataset.format, this.source);
    });
  }
}

customElements.define('chart-export', ChartExport);

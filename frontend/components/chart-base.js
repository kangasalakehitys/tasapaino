// Shared base for ECharts components (spec: backend/md/site/brand_overview.md).
// Requires the global `echarts` (loaded from CDN in the page).
//
// Subclasses implement buildOption(data, { compact, exporting, zoom }).
// Default mode has zoom and PNG/JPG/SVG/CSV export; attribute `compact`
// renders a small teaser chart without them. Exports are rendered on a hidden
// chart instance, so the zoom slider is never part of a download.

import './chart-export.js';
import { toCSV } from './chart-export.js';

export const FONT = 'Century Gothic, CenturyGothic, AppleGothic, sans-serif';
export const INK = '#000000';
export const MUTED = '#595959';
export const GRID = '#E0E0E0';

// Brand colour order.
export const PALETTE = ['#DE232F', '#FCB316', '#28336C', '#E64925', '#00ADC5', '#009651'];
export const POSITIVE = '#009651';
export const NEGATIVE = '#DE232F';

// Axis labels, axis names and legends: 14px, normal weight (brand_overview.md).
// Compact teaser charts keep smaller text so that the plot still fits.
export const AXIS_LABEL = { fontFamily: FONT, fontWeight: 'normal', color: INK, fontSize: 14 };
export const axisLabel = (compact) => (compact ? { ...AXIS_LABEL, fontSize: 11 } : AXIS_LABEL);
export const axisName = (compact, extra = {}) => ({ fontFamily: FONT, color: MUTED, fontSize: compact ? 11 : 14, ...extra });
export const legendText = (compact) => ({ fontFamily: FONT, fontWeight: 'normal', fontSize: compact ? 11 : 14, color: INK });

// "Use transparency if colors aren't enough": after the six brand colours the
// palette repeats with lower opacity.
export function withAlpha(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${alpha})`;
}
export const paletteColor = (i) => {
  const base = PALETTE[i % PALETTE.length];
  const round = Math.floor(i / PALETTE.length);
  return round ? withAlpha(base, Math.max(0.3, 1 - round * 0.35)) : base;
};
export const SPLIT_LINE = { show: true, lineStyle: { type: 'dashed', color: GRID, width: 1 } };

export function sliderZoom(extra = {}) {
  return {
    type: 'slider', height: 18, bottom: 8, filterMode: 'none',
    borderColor: 'transparent', backgroundColor: 'transparent',
    fillerColor: 'rgba(222,35,47,0.10)',
    dataBackground: { lineStyle: { color: GRID }, areaStyle: { color: 'transparent' } },
    handleStyle: { color: PALETTE[0] },
    textStyle: { color: MUTED, fontSize: 10 },
    ...extra
  };
}

export class ChartBase extends HTMLElement {
  // Usage hint under the chart; subclasses may override.
  get hint() {
    return 'Zoomaa hiiren rullalla tai alareunan liukusäätimellä.';
  }

  connectedCallback() {
    if (this.chart) return;
    this.compact = this.hasAttribute('compact');
    this.classList.add('chart');
    this.innerHTML = this.compact
      ? '<div class="chart__canvas"></div>'
      : `<chart-export></chart-export><div class="chart__canvas"></div><p class="chart__hint">${this.hint}</p>`;
    this.canvas = this.querySelector('.chart__canvas');
    this.chart = window.echarts.init(this.canvas, null, { renderer: 'svg' });
    this.resizeObserver = new ResizeObserver(() => this.chart?.resize());
    this.resizeObserver.observe(this.canvas);
    const exporter = this.querySelector('chart-export');
    if (exporter) {
      const self = this;
      exporter.source = {
        get filename() { return self.data?.filename; },
        getSVG: () => this.exportSVG(),
        getCSV: () => toCSV(this.data.csv.header, this.data.csv.rows)
      };
    }
    if (this.data) this.setData(this.data);
  }

  disconnectedCallback() {
    this.resizeObserver?.disconnect();
    this.chart?.dispose();
    this.chart = null;
  }

  setData(data) {
    this.data = data;
    if (!this.chart) return;
    this.chart.setOption(this.buildOption(data, { compact: this.compact }), true);
  }

  // Current zoom window, so the export shows what the reader is looking at.
  currentZoom() {
    const dz = this.chart.getOption().dataZoom?.[0];
    return dz ? { startValue: dz.startValue, endValue: dz.endValue } : {};
  }

  // Size of the export: the chart's own size, or for a chart in a hidden tab
  // (PowerPoint export of the whole page) a default width and the CSS height.
  exportSize() {
    const width = this.canvas.clientWidth || 960;
    const height = this.canvas.clientHeight || parseFloat(getComputedStyle(this.canvas).height) || 420;
    return { width, height };
  }

  exportSVG() {
    const { width, height } = this.exportSize();
    const host = document.createElement('div');
    host.style.cssText = `position:fixed;left:-10000px;top:0;width:${width}px;height:${height}px`;
    document.body.appendChild(host);
    const chart = window.echarts.init(host, null, { renderer: 'svg' });
    chart.setOption({
      ...this.buildOption(this.data, { exporting: true, zoom: this.currentZoom() }),
      animation: false
    });
    const svg = chart.renderToSVGString();
    chart.dispose();
    host.remove();
    return svg;
  }
}

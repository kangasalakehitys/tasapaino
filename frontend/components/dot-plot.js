// <dot-plot> — reusable Cleveland dot plot: categories on the y-axis, values on
// the x-axis. Other units are small grey sub-markers, the compared ones large
// main markers on a line from the smallest to the largest main value
// (backend/md/site/brand_overview.md, "Cleveland dot plot"). Attribute
// `compact` renders a teaser chart without export and hint.
//
//   el.setData({
//     categories: ['Perusopetus', ...],
//     others?: { name: 'Muut kunnat', points: [{ category: 0, value, label }] },
//     markers: [{ name, color?, symbol?: 'circle' | 'diamond' | ..., values: [...] }],
//     xName, filename,
//     valueFormat?: (v) => string,
//     csv: { header: [...], rows: [[...], ...] }
//   });

import { ChartBase, FONT, INK, MUTED, GRID, axisLabel, legendText, paletteColor, SPLIT_LINE } from './chart-base.js';
import { fmtInt, escapeHtml } from '../functions/format.js';

const ROW_HEIGHT = 26;
// Main markers are 20 % bigger than the sub-markers.
const MAIN_SIZE = 12;
const SUB_SIZE = 10;
const OTHER_COLOR = 'rgba(89,89,89,0.5)';

class DotPlot extends ChartBase {
  get hint() {
    return 'Vie hiiri pisteen päälle nähdäksesi kunnan ja arvon.';
  }

  setData(data) {
    // One row per category, so long lists stay readable on every screen.
    if (this.canvas && !this.compact) this.canvas.style.height = `${Math.max(240, data.categories.length * ROW_HEIGHT + 80)}px`;
    super.setData(data);
    this.setHint(data);
    this.chart?.resize();
  }

  // Value axis without the most extreme sub-markers (1 % at both ends), so a
  // few outliers do not squeeze the compared markers; main markers always fit.
  axisRange(data) {
    const others = (data.others?.points || []).map((p) => p.value).sort((a, b) => a - b);
    const main = data.markers.flatMap((m) => m.values).filter((v) => v != null);
    const at = (q) => others[Math.min(others.length - 1, Math.floor(q * others.length))];
    const lo = Math.min(0, ...main, ...(others.length ? [at(0.01)] : []));
    const hi = Math.max(...main, ...(others.length ? [at(0.99)] : []));
    const clipped = others.length > 0 && (others[0] < lo || others.at(-1) > hi);
    // Round the ends to a tenth of the order of magnitude, e.g. 1 352 -> 1 400.
    const step = 10 ** Math.floor(Math.log10(Math.max(Math.abs(hi), Math.abs(lo), 1))) / 10;
    return { min: Math.floor(lo / step) * step, max: Math.ceil((hi * 1.03) / step) * step, clipped };
  }

  setHint(data) {
    const hint = this.querySelector('.chart__hint');
    if (!hint) return;
    hint.textContent = this.hint + (this.axisRange(data).clipped
      ? ' Akseli on rajattu: yksittäiset ääriarvot ovat taulukossa ja CSV-tiedostossa.' : '');
  }

  buildOption(data, { compact = false, exporting = false } = {}) {
    const fmt = data.valueFormat || fmtInt;
    const n = data.categories.length;
    const range = this.axisRange(data);
    // Line between the smallest and the largest main marker of each category.
    const ranges = data.categories.map((_, i) => {
      const vs = data.markers.map((m) => m.values[i]).filter((v) => v != null);
      return vs.length ? [Math.min(...vs), Math.max(...vs)] : null;
    });
    const series = [];
    if (data.others?.points.length) {
      series.push({
        name: data.others.name,
        type: 'scatter',
        symbolSize: SUB_SIZE,
        // Thousands of points: drawn as one path, without animation.
        large: true,
        largeThreshold: 500,
        animation: false,
        itemStyle: { color: OTHER_COLOR, borderWidth: 0 },
        emphasis: { itemStyle: { color: MUTED } },
        data: data.others.points.map((p) => [p.value, p.category]),
        z: 1
      });
    }
    series.push({
      name: 'range',
      type: 'custom',
      silent: true,
      legendHoverLink: false,
      renderItem: (params, api) => {
        const r = ranges[params.dataIndex];
        if (!r) return null;
        const a = api.coord([r[0], params.dataIndex]);
        const b = api.coord([r[1], params.dataIndex]);
        return { type: 'line', shape: { x1: a[0], y1: a[1], x2: b[0], y2: b[1] }, style: { stroke: INK, lineWidth: 1.5 } };
      },
      data: ranges.map((_, i) => [0, i]),
      z: 2
    });
    data.markers.forEach((m, i) => {
      series.push({
        name: m.name,
        type: 'scatter',
        symbol: m.symbol || 'circle',
        symbolSize: MAIN_SIZE,
        itemStyle: { color: m.color || paletteColor(i), borderColor: '#fff', borderWidth: 2, borderType: 'solid' },
        data: m.values.map((v, c) => (v == null ? null : { value: [v, c], name: m.name })),
        z: 3 + i
      });
    });

    return {
      backgroundColor: 'transparent',
      textStyle: { fontFamily: FONT, color: INK },
      animationDuration: 600,
      grid: { left: 4, right: compact ? 12 : 24, top: compact ? 52 : 40, bottom: 4, containLabel: true },
      legend: {
        top: 0, left: 0, itemWidth: 12, itemHeight: 12, itemGap: compact ? 6 : 10,
        data: [...data.markers.map((m) => ({ name: m.name, icon: m.symbol || 'circle' })),
          ...(data.others?.points.length ? [{ name: data.others.name, icon: 'circle' }] : [])],
        textStyle: legendText(compact)
      },
      tooltip: {
        show: !exporting,
        trigger: 'item',
        backgroundColor: '#fff',
        borderColor: GRID,
        textStyle: { fontFamily: FONT, color: INK, fontSize: 12 },
        formatter: (p) => {
          const [value, category] = Array.isArray(p.data) ? p.data : p.data.value;
          const name = Array.isArray(p.data) ? data.others.points[p.dataIndex].label : p.name;
          return `<b>${escapeHtml(name)}</b><br>${escapeHtml(data.categories[category])}: ${escapeHtml(fmt(value))}`;
        }
      },
      xAxis: {
        type: 'value',
        position: 'top',
        name: '',
        min: range.min,
        max: range.max,
        splitNumber: compact ? 3 : 5,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { ...axisLabel(compact), formatter: (v) => fmt(v) },
        splitLine: SPLIT_LINE
      },
      yAxis: {
        type: 'category',
        data: data.categories,
        inverse: true,
        max: n - 1,
        axisLine: { lineStyle: { color: INK } },
        axisTick: { show: false },
        axisLabel: { ...axisLabel(compact), width: compact ? 110 : 220, overflow: 'truncate' },
        splitLine: SPLIT_LINE
      },
      series
    };
  }
}

customElements.define('dot-plot', DotPlot);

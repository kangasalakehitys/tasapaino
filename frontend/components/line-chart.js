// <line-chart> — reusable line chart on a time axis.
//
//   el.setData({
//     series: [{ name, color?, dashed?: true | 'dotted', period?: 'year' | 'quarter' | 'month' | 'auto',
//                symbol?: false, axis?: 1, data: [[timestampMs, value], ...] }],
//       Series with the same name share one legend entry.
//       A null value breaks the line (e.g. between years of a cumulative series).
//       `axis: 1` draws the series against a second y-axis on the right.
//     yName, y2Name?, xName? (default 'Vuosi'), filename,
//     zoomStart?: timestampMs,          initial zoom window start
//     valueFormat?: (v) => string,      y-axis and tooltip formatting
//     csv: { header: [...], rows: [[...], ...] }
//   });
//
// Zooming in switches the x-axis labels from years to months.

import {
  ChartBase, FONT, INK, MUTED, GRID, axisLabel, axisName, legendText, paletteColor, SPLIT_LINE, sliderZoom
} from './chart-base.js';
import { fmtInt } from '../functions/format.js';

function pointLabel(ts, period) {
  const d = new Date(ts);
  // 'auto': year-end points (31.12.) as years, other points as months.
  if (period === 'auto') period = d.getUTCMonth() === 11 && d.getUTCDate() === 31 ? 'year' : 'month';
  if (period === 'month') return `${d.getUTCMonth() + 1}/${d.getUTCFullYear()}`;
  if (period === 'quarter') return `Q${Math.floor(d.getUTCMonth() / 3) + 1}/${d.getUTCFullYear()}`;
  return `${d.getUTCFullYear()}`;
}

class LineChart extends ChartBase {
  buildOption(data, { compact = false, exporting = false, zoom = {} } = {}) {
    const fmt = data.valueFormat || fmtInt;
    const showLegend = !compact || data.series.length > 1;
    const withSlider = !compact && !exporting;
    const zoomWindow = exporting ? zoom : { startValue: data.zoomStart };
    const hasSecondAxis = data.series.some((s) => s.axis === 1);

    return {
      backgroundColor: 'transparent',
      textStyle: { fontFamily: FONT, color: INK },
      animationDuration: 600,
      grid: {
        left: 4,
        right: compact ? 8 : 16,
        // Narrow screens wrap a legend of two or more items onto two rows.
        top: !showLegend ? 12 : data.series.length > 1 && this.canvas?.clientWidth < 520 ? 76 : 52,
        bottom: withSlider ? 72 : compact ? 8 : 32,
        containLabel: true
      },
      legend: {
        show: showLegend,
        top: 0, left: 0, icon: 'circle', itemWidth: 10, itemHeight: 10,
        textStyle: legendText(compact)
      },
      tooltip: {
        show: !exporting,
        trigger: 'axis',
        backgroundColor: '#fff',
        borderColor: GRID,
        textStyle: { fontFamily: FONT, color: INK, fontSize: 12 },
        formatter: (items) => {
          const s = data.series[items[0].seriesIndex];
          // Series of the same name may share a point: list it once.
          const seen = new Set();
          const unique = items.filter((i) => {
            if (i.value[1] == null) return false;
            const key = `${i.seriesName}|${i.value[1]}`;
            return !seen.has(key) && seen.add(key);
          });
          if (!unique.length) return '';
          return `<b>${pointLabel(items[0].value[0], s.period)}</b><br>` + unique
            .map((i) => `${i.marker}${i.seriesName}: <b>${fmt(i.value[1])}</b>`)
            .join('<br>');
        }
      },
      xAxis: {
        type: 'time',
        // Yearly series: one tick per year, no month labels.
        minInterval: data.series.every((x) => x.period === 'year') ? 365 * 24 * 3600 * 1000 : undefined,
        name: compact ? '' : data.xName ?? 'Vuosi',
        nameLocation: 'middle',
        nameGap: 28,
        nameTextStyle: axisName(compact),
        axisLine: { lineStyle: { color: INK } },
        axisTick: { show: false },
        axisLabel: {
          ...axisLabel(compact),
          hideOverlap: true,
          // Level-based labels: years when zoomed out, months when zoomed in.
          formatter: { year: '{yyyy}', month: '{M}/{yyyy}', day: '{d}.{M}.{yyyy}' }
        },
        splitLine: { show: false }
      },
      yAxis: [
        {
          type: 'value',
          name: compact ? '' : data.yName || '',
          nameTextStyle: axisName(compact, { align: 'left' }),
          scale: true,
          splitNumber: compact ? 3 : 5,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { ...axisLabel(compact), formatter: (v) => fmt(v) },
          splitLine: SPLIT_LINE
        },
        // Second axis for a series of a much smaller scale; no grid lines of its own.
        ...(hasSecondAxis ? [{
          type: 'value',
          position: 'right',
          name: compact ? '' : data.y2Name || '',
          nameTextStyle: axisName(compact, { align: 'right' }),
          scale: true,
          splitNumber: compact ? 3 : 5,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { ...axisLabel(compact), formatter: (v) => fmt(v) },
          splitLine: { show: false }
        }] : [])
      ],
      dataZoom: compact ? [] : [
        // weakFilter lets the y-axis rescale to the zoomed window.
        { type: 'inside', filterMode: 'weakFilter', ...zoomWindow },
        ...(withSlider ? [sliderZoom({ ...zoomWindow, filterMode: 'weakFilter', labelFormatter: (v) => new Date(v).getUTCFullYear() })] : [])
      ],
      series: data.series.map((s, i) => {
        const color = s.color || paletteColor(i);
        const lineType = s.dashed === true ? 'dashed' : s.dashed || 'solid';
        return {
          name: s.name,
          type: 'line',
          data: s.data,
          yAxisIndex: hasSecondAxis && s.axis === 1 ? 1 : 0,
          smooth: 0.5,
          showSymbol: s.symbol !== false,
          showAllSymbol: true,
          symbol: 'circle',
          symbolSize: compact ? 6 : 8,
          lineStyle: { color, width: 2.5, type: lineType },
          itemStyle: { color, borderColor: '#ffffff', borderWidth: 2, borderType: 'solid' },
          emphasis: { focus: 'series' }
        };
      })
    };
  }
}

customElements.define('line-chart', LineChart);

// <waterfall-chart> — bridge from the first item to the total, e.g. the
// "toiminnan ja investointien rahavirta" formula (finance_compiler.md).
// Increases are green, decreases red and totals navy; the bars float on an
// invisible base.
//
//   el.setData({
//     steps: [{ label, value, total?: true }],   total = bar from zero (sum so far)
//     yName, filename, valueFormat?, csv
//   });

import {
  ChartBase, FONT, INK, GRID, POSITIVE, NEGATIVE, axisLabel, axisName, SPLIT_LINE
} from './chart-base.js';
import { fmtInt } from '../functions/format.js';

const TOTAL = '#28336C';

class WaterfallChart extends ChartBase {
  get hint() {
    return 'Vie hiiri pylvään päälle nähdäksesi erän ja kertymän.';
  }

  buildOption(data, { compact = false, exporting = false } = {}) {
    const fmt = data.valueFormat || fmtInt;
    // Each bar runs from `from` to `to`; drawn as a custom series so that
    // bars below zero work too.
    let running = 0;
    const bars = data.steps.map((step, i) => {
      const from = step.total ? 0 : running;
      const to = step.total ? (step.value ?? running) : running + step.value;
      running = to;
      const color = step.total ? TOTAL : step.value >= 0 ? POSITIVE : NEGATIVE;
      return { value: [i, from, to], raw: step.total ? to : step.value, cumulative: to, itemStyle: { color } };
    });
    const values = bars.flatMap((b) => [b.value[1], b.value[2]]);
    return {
      backgroundColor: 'transparent',
      textStyle: { fontFamily: FONT, color: INK },
      animationDuration: 600,
      grid: { left: 4, right: 12, top: 24, bottom: compact ? 8 : 16, containLabel: true },
      tooltip: {
        show: !exporting,
        trigger: 'axis',
        axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(0,0,0,0.04)' } },
        backgroundColor: '#fff',
        borderColor: GRID,
        textStyle: { fontFamily: FONT, color: INK, fontSize: 12 },
        formatter: (items) => {
          const i = items[0].dataIndex;
          const step = data.steps[i];
          return `<b>${step.label}</b><br>${step.total ? 'Yhteensä' : 'Erä'}: <b>${fmt(bars[i].raw)}</b>` +
            (step.total ? '' : `<br>Kertymä: ${fmt(bars[i].cumulative)}`);
        }
      },
      xAxis: {
        type: 'category',
        data: data.steps.map((s) => s.label),
        axisLine: { lineStyle: { color: INK } },
        axisTick: { show: false },
        axisLabel: { ...axisLabel(compact), interval: 0, fontSize: compact ? 10 : 12, lineHeight: 15 }
      },
      yAxis: {
        type: 'value',
        name: compact ? '' : data.yName || '',
        nameTextStyle: axisName(compact, { align: 'left' }),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { ...axisLabel(compact), formatter: (v) => fmt(v) },
        min: Math.min(0, ...values),
        max: Math.max(0, ...values),
        splitLine: SPLIT_LINE
      },
      series: [{
        type: 'custom',
        data: bars,
        encode: { x: 0, y: [1, 2] },
        renderItem: (params, api) => {
          const i = api.value(0);
          const a = api.coord([i, api.value(1)]);
          const b = api.coord([i, api.value(2)]);
          const width = Math.min(56, api.size([1, 0])[0] * 0.6);
          const bar = bars[params.dataIndex];
          return {
            type: 'group',
            children: [
              { type: 'rect', shape: { x: a[0] - width / 2, y: Math.min(a[1], b[1]), width, height: Math.max(1, Math.abs(a[1] - b[1])) },
                style: { fill: bar.itemStyle.color } },
              ...(compact ? [] : [{ type: 'text', style: {
                text: fmt(bar.raw), x: a[0], y: Math.min(a[1], b[1]) - 6, align: 'center', verticalAlign: 'bottom',
                fontFamily: FONT, fontSize: 12, fill: INK } }])
            ]
          };
        }
      }]
    };
  }
}

customElements.define('waterfall-chart', WaterfallChart);

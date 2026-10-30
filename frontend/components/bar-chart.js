// <bar-chart> — reusable column chart on a category axis.
//
//   el.setData({
//     categories: ['2016', '2017', ...],
//     series: [{ name, color?, values: [...] }],
//     signColors?: true,                 positive green, negative red
//     horizontal?: true,                 categories on the y-axis, top to bottom
//     stack?: true,                      series stacked in one bar per category
//     yName, filename,
//     valueFormat?: (v) => string,
//     csv: { header: [...], rows: [[...], ...] }
//   });

import {
  ChartBase, FONT, INK, MUTED, GRID, POSITIVE, NEGATIVE,
  axisLabel, axisName, legendText, paletteColor, SPLIT_LINE, sliderZoom
} from './chart-base.js';
import { fmtInt } from '../functions/format.js';

class BarChart extends ChartBase {
  setData(data) {
    super.setData(data);
    // Horizontal bars cannot be zoomed.
    const hint = this.querySelector('.chart__hint');
    if (hint) hint.hidden = Boolean(data.horizontal);
  }

  buildOption(data, { compact = false, exporting = false, zoom = {} } = {}) {
    const fmt = data.valueFormat || fmtInt;
    const showLegend = data.series.length > 1;
    const horizontal = Boolean(data.horizontal);
    // Horizontal bars have few categories and no slider.
    const withSlider = !compact && !exporting && !horizontal;
    const categoryAxis = {
      type: 'category',
      data: data.categories,
      inverse: horizontal,
      axisLine: { lineStyle: { color: INK } },
      axisTick: { show: false },
      axisLabel: { ...axisLabel(compact), hideOverlap: true }
    };
    const valueAxis = {
      type: 'value',
      name: compact ? '' : data.yName || '',
      nameTextStyle: axisName(compact, { align: 'left' }),
      splitNumber: compact ? 3 : 5,
      max: data.max,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { ...axisLabel(compact), formatter: (v) => fmt(v) },
      splitLine: SPLIT_LINE
    };

    return {
      backgroundColor: 'transparent',
      textStyle: { fontFamily: FONT, color: INK },
      animationDuration: 600,
      grid: {
        left: 4,
        // Room for the last value-axis label of horizontal bars.
        right: horizontal ? 24 : 8,
        top: showLegend ? 40 : 16,
        bottom: withSlider ? 64 : 8,
        containLabel: true
      },
      legend: {
        show: showLegend,
        top: 0, left: 0, icon: 'roundRect', itemWidth: 12, itemHeight: 12,
        textStyle: legendText(compact)
      },
      tooltip: {
        show: !exporting,
        trigger: 'axis',
        axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(0,0,0,0.04)' } },
        backgroundColor: '#fff',
        borderColor: GRID,
        textStyle: { fontFamily: FONT, color: INK, fontSize: 12 },
        valueFormatter: (v) => fmt(v)
      },
      // The unit of horizontal bars is in the chart subtitle.
      xAxis: horizontal ? { ...valueAxis, name: '' } : categoryAxis,
      yAxis: horizontal ? categoryAxis : valueAxis,
      dataZoom: compact || horizontal ? [] : [
        { type: 'inside', ...(exporting ? zoom : {}) },
        ...(withSlider ? [sliderZoom()] : [])
      ],
      series: data.series.map((s, i) => {
        const color = s.color || paletteColor(i);
        return {
          name: s.name,
          type: 'bar',
          barMaxWidth: 28,
          stack: data.stack ? 'total' : undefined,
          data: data.signColors
            ? s.values.map((v) => ({ value: v, itemStyle: { color: v < 0 ? NEGATIVE : POSITIVE } }))
            : s.values,
          itemStyle: { color }
        };
      })
    };
  }
}

customElements.define('bar-chart', BarChart);

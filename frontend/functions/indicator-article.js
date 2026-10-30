// Generic article for one comparison indicator (compare-set.mjs INDICATORS):
//   1. trend over the years: selected municipality, peers, size-class average,
//      mean of the three best of the class and mainland average (line chart)
//   2. latest year for every unit separately (horizontal bars)
//   3. analysis: difference to the class average and the best, rank, trend
//   4. table
// The headline is written from the data as a full sentence (action title).
//
//   await renderIndicator('vuosikate', group, { id: 'annualMargin', intro: [...], source })

import '../components/line-chart.js';
import '../components/bar-chart.js';
import '../components/data-table.js';
import { valueOf, latestYearOf, classRank } from './compare.js';
import {
  byPrefix, figureHtml, summaryHtml, paragraphs, formatter, axisFormat, compareWords, diffPct
} from './article-common.js';

const yearTs = (y) => Date.UTC(Number(y), 0, 1);

// Sentence on the direction of change over the years shown.
function trendSentence(name, values, unit, fmt) {
  const xs = values.filter(([, v]) => v != null);
  if (xs.length < 2) return '';
  const [y0, v0] = xs[0];
  const [y1, v1] = xs.at(-1);
  if (unit === '%') {
    const d = v1 - v0;
    return `${name}: ${fmt(v0)} vuonna ${y0} ja ${fmt(v1)} vuonna ${y1} (${d >= 0 ? '+' : '−'}${Math.abs(d).toFixed(1).replace('.', ',')} %-yksikköä).`;
  }
  const d = diffPct(v1, v0);
  return `${name}: ${fmt(v0)} vuonna ${y0} ja ${fmt(v1)} vuonna ${y1}${d == null ? '' : ` (${d >= 0 ? '+' : '−'}${Math.abs(Math.round(d))} %)`}.`;
}

// Headline as a full sentence, e.g. "Kangasalan vuosikate on 40 % kokoluokan keskiarvoa pienempi".
export function headline(group, id, year) {
  const ind = group.data.indicators[id];
  const own = valueOf(group.main, id, year);
  const ref = valueOf(group.classAvg, id, year);
  if (own == null) return `${ind.label}: ei tietoa vuodelta ${year}`;
  const words = compareWords(own, ref, ind.unit);
  return `${group.main.name}: ${ind.label.toLowerCase()} ${formatter(ind.unit)(own)} – ${words} kuin kokoluokassa keskimäärin (${year})`;
}

export async function renderIndicator(prefix, group, { id, intro = [], source = 'Valtiokonttori, kuntien taloustietopalvelu; Tilastokeskus', note = '' }) {
  const el = byPrefix(prefix);
  const ind = group.data.indicators[id];
  const fmt = formatter(ind.unit);
  const year = latestYearOf(group, id);
  const years = group.years.filter((y) => group.members.some((m) => valueOf(m, id, y) != null));
  const own = valueOf(group.main, id, year);
  const avg = valueOf(group.classAvg, id, year);
  const best = valueOf(group.bestAvg, id, year);
  const { rank, count } = classRank(group, id, year);

  el('title').textContent = headline(group, id, year);
  el('kicker').textContent = `${group.main.name} · ${ind.label}`;

  const analysis = [
    `${group.main.name}: ${fmt(own)} vuonna ${year}. Kokoluokan keskiarvo on ${fmt(avg)} ja kokoluokan kolmen parhaan keskiarvo ${fmt(best)}.`,
    ...group.peers.map((p) => `${p.name}: ${fmt(valueOf(p, id, year))}.`),
    rank ? `${group.main.name} on kokoluokassaan sijalla ${rank}/${count} (${ind.better === 'high' ? 'suurin' : 'pienin'} ensin).` : '',
    trendSentence(group.main.name, years.map((y) => [y, valueOf(group.main, id, y)]), ind.unit, fmt)
  ];
  const position = ind.better && own != null && avg != null
    ? ((ind.better === 'high') === (own >= avg) ? 'paremmalla' : 'heikommalla') : null;

  el('content').innerHTML = `
    <div class="article__body">${paragraphs(intro)}</div>
    ${figureHtml(`${prefix}-trend`, {
    title: `${ind.label} vuosina ${years[0]}–${years.at(-1)}`,
    subtitle: `${ind.unit}. Kokoluokka: ${group.main.sizeClass}.`,
    source,
    body: `<line-chart id="${prefix}-chart"></line-chart>`
  })}
    ${figureHtml(`${prefix}-latest`, {
    title: `${ind.label} vuonna ${year} vertailujoukossa`,
    subtitle: `${ind.unit}. Kokoluokan parhaat: talouden vahvuuden pisteytys (toiminnan ja investointien rahavirta, vuosikate/poistot, lainakanta, kertynyt ylijäämä, konsernin lainakanta).`,
    source,
    body: `<bar-chart id="${prefix}-bars" class="chart--bars"></bar-chart>`
  })}
    <div class="article__body" id="${prefix}-analysis">
      <h2>Analyysi</h2>
      ${paragraphs(analysis)}
      ${note ? `<p class="note">${note}</p>` : ''}
    </div>
    ${position ? summaryHtml(`${group.main.name} on tässä tunnusluvussa ${position} tasolla kuin kokoluokka keskimäärin (${compareWords(own, avg, ind.unit)}).`) : ''}
    <data-table id="${prefix}-table"></data-table>`;

  el('chart').setData({
    series: group.members.map((m) => ({
      name: m.name,
      color: m.color,
      dashed: m.kind === 'classAvg' ? true : m.kind === 'country' ? 'dotted' : false,
      period: 'year',
      data: years.map((y) => [yearTs(y), valueOf(m, id, y)])
    })),
    yName: ind.unit,
    valueFormat: axisFormat(ind.unit),
    filename: `${prefix}-${group.main.slug}`,
    csv: {
      header: ['Yksikkö', ...years],
      rows: group.members.map((m) => [m.name, ...years.map((y) => valueOf(m, id, y))])
    }
  });

  const units = group.all.filter((m) => valueOf(m, id, year) != null);
  el('bars').style.setProperty('--rows', units.length);
  el('bars').setData({
    categories: units.map((m) => (m.kind === 'best' ? `${m.name} (paras)` : m.name)),
    series: [{ name: ind.label, values: units.map((m) => ({ value: valueOf(m, id, year), itemStyle: { color: m.color } })) }],
    horizontal: true,
    valueFormat: axisFormat(ind.unit),
    filename: `${prefix}-${year}-${group.main.slug}`,
    csv: { header: ['Yksikkö', `${ind.label} ${year} (${ind.unit})`], rows: units.map((m) => [m.name, valueOf(m, id, year)]) }
  });

  el('table').setData({
    caption: `${ind.label} (${ind.unit})`,
    columns: [
      { key: 'name', label: 'Yksikkö' },
      ...years.map((y) => ({ key: y, label: y, numeric: true, format: (v) => fmt(v) }))
    ],
    rows: group.all.map((m) => ({ name: m.name, kind: m.kind, ...Object.fromEntries(years.map((y) => [y, valueOf(m, id, y)])) })),
    highlight: (r) => r.kind === 'main'
  });
}

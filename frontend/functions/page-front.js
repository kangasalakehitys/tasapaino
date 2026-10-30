// Front page (spec: backend/md/site/frontpage.md): the balance status in one
// sentence, key figures against the comparison group, and teasers of the four
// perspectives with a small chart each.

import '../components/site-header.js';
import '../components/site-footer.js';
import '../components/peer-picker.js';
import '../components/teaser-card.js';
import '../components/kpi-tile.js';
import '../components/line-chart.js';
import '../components/bar-chart.js';
import { comparisonGroup, valueOf, onPeersChange } from './compare.js';
import { onMunicipalityChange, withKunta } from './municipality.js';
import { buildRecommendations, AREAS } from './recommendations.js';
import { fmtEurPc, fmtPct, fmtMe, showError } from './article-common.js';
import { setNames } from './subpage.js';
import { escapeHtml } from './format.js';

const yearTs = (y) => Date.UTC(Number(y), 0, 1);

function lineChart(group, id) {
  const chart = document.createElement('line-chart');
  chart.setAttribute('compact', '');
  queueMicrotask(() => chart.setData({
    series: group.members.filter((m) => m.kind !== 'country').map((m) => ({
      name: m.name, color: m.color, period: 'year', dashed: m.kind === 'classAvg',
      data: group.years.map((y) => [yearTs(y), valueOf(m, id, y)])
    })),
    filename: `${id}-${group.main.slug}`,
    csv: { header: ['Yksikkö', ...group.years], rows: group.members.map((m) => [m.name, ...group.years.map((y) => valueOf(m, id, y))]) }
  }));
  return chart;
}

function barChart(group, id, year) {
  const chart = document.createElement('bar-chart');
  chart.setAttribute('compact', '');
  const units = group.all.filter((m) => valueOf(m, id, year) != null);
  queueMicrotask(() => chart.setData({
    categories: units.map((m) => m.name),
    series: [{ name: group.data.indicators[id].label, values: units.map((m) => ({ value: valueOf(m, id, year), itemStyle: { color: m.color } })) }],
    horizontal: true, valueFormat: (v) => String(Math.round(v * 10) / 10).replace('.', ','),
    filename: `${id}-${group.main.slug}`,
    csv: { header: ['Yksikkö', id], rows: units.map((m) => [m.name, valueOf(m, id, year)]) }
  }));
  return chart;
}

async function render() {
  const lead = document.getElementById('lead');
  const grid = document.getElementById('grid');
  try {
    const group = await comparisonGroup();
    setNames(group.main.name);
    const y = group.year;
    const v = (id, yy = y) => valueOf(group.main, id, yy);
    const ref = (id, yy = y) => valueOf(group.classAvg, id, yy);
    const exSum = group.years.slice(-3).reduce((s, yy) => s + (v('cashflowExDisposals', yy) ?? 0), 0);
    const balanced = (v('marginToDepreciation') ?? 0) >= 100 && exSum >= 0;
    lead.innerHTML = `
      <p class="article__kicker">${escapeHtml(group.main.name)} · tilinpäätös ${y}</p>
      <h1 class="front-title">${escapeHtml(balanced
    ? `${group.main.name}: tulorahoitus riittää investointeihin`
    : `${group.main.name}: tulorahoitus ei riitä investointeihin – rahavirta ilman myyntituloja ${fmtEurPc(exSum)} kolmessa vuodessa`)}</h1>
      <p class="front-standfirst">${escapeHtml(`Talouden vahvuuden pisteytyksessä ${group.main.name} on kokoluokassaan (${group.main.sizeClass}) sijalla ${group.rank}/${group.classCount}. Kokoluokan vahvimmat: ${group.best.map((b) => b.name).join(', ')}.`)}</p>
      <div class="kpi-grid" id="front-tiles"></div>`;
    const tiles = document.getElementById('front-tiles');
    const ind = group.data.indicators;
    for (const [id, href] of [['marginToDepreciation', 'kokonaistalous.html#vuosikate-poistot'], ['cashflowExDisposals', 'kokonaistalous.html#rahavirta'],
      ['loans', 'kokonaistalous.html#lainakanta'], ['operatingCosts', 'palveluluokat.html#menot'],
      ['effectiveTaxRate', 'verotus.html#efektiivinen'], ['propertyTax', 'verotus.html#kiinteistovero']]) {
      const yy = [...group.years].reverse().find((x) => v(id, x) != null);
      const [page, hash] = href.split('#');
      const tile = document.createElement('kpi-tile');
      tiles.append(tile);
      tile.setData({
        label: `${ind[id].label} ${yy}`, value: v(id, yy), ref: ref(id, yy), refLabel: 'kokoluokka',
        unit: ind[id].unit, better: ind[id].better, format: ind[id].unit === '%' ? (x) => fmtPct(x, 2) : fmtEurPc,
        href: `${withKunta(page)}#${hash}`
      });
    }

    const rec = await buildRecommendations(group);
    grid.replaceChildren();
    const teasers = [
      { href: withKunta('kokonaistalous.html'), kicker: 'Kokonaistalous', title: 'Rahavirta ilman omaisuuden myyntituloja',
        text: 'Vuosikate miinus nettoinvestoinnit ilman kertaluonteisia luovutustuloja, €/as.', media: lineChart(group, 'cashflowExDisposals') },
      { href: withKunta('palveluluokat.html'), kicker: 'Palveluluokat', title: 'Toimintakulut asukasta kohden',
        text: 'Ulkoiset toimintakulut €/as verrokkeihin ja kokoluokkaan.', media: lineChart(group, 'operatingCosts') },
      { href: withKunta('verotus.html'), kicker: 'Verotus', title: 'Efektiivinen veroaste',
        text: 'Maksuunpantu kunnallisvero prosentteina ansiotuloista.', media: barChart(group, 'effectiveTaxRate', [...group.years].reverse().find((x) => v('effectiveTaxRate', x) != null)) }
    ];
    for (const t of teasers) {
      const card = document.createElement('teaser-card');
      grid.append(card);
      card.setData(t);
      card.setMedia(t.media);
    }
    const recCard = document.createElement('teaser-card');
    grid.append(recCard);
    recCard.setData({ href: withKunta('toimenpiteet.html'), kicker: 'Toimenpiteet', title: 'Viiden näkökulman tärkeimmät nostot',
      text: 'Palveluverkko, toimintakulut, investoinnit, tulot ja jokeri (tekoäly).' });
    const list = document.createElement('ol');
    list.className = 'front-recs';
    list.innerHTML = AREAS.map((a) => {
      const item = rec[a.id][0];
      return item ? `<li><a href="${withKunta('toimenpiteet.html')}#${a.id}"><b>${escapeHtml(a.label)}:</b> ${escapeHtml(item.title)}${item.impact ? ` <span>(enint. ${escapeHtml(fmtMe(item.impact))}/v)</span>` : ''}</a></li>` : '';
    }).join('');
    recCard.setMedia(list);
  } catch (err) {
    showError(lead, err);
  }
}

render();
onMunicipalityChange(() => {
  const url = new URL(location.href);
  url.searchParams.delete('verrokit');
  history.replaceState(null, '', url);
  render();
});
onPeersChange(render);

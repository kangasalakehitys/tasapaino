// Kokonaistalous page (spec: backend/md/pages/kokonaistalous.md).

import '../components/kpi-tile.js';
import '../components/waterfall-chart.js';
import '../components/line-chart.js';
import '../components/bar-chart.js';
import '../components/data-table.js';
import { setupPage } from './subpage.js';
import { loadTasapaino, loadTolt } from './data.js';
import { valueOf, classRank } from './compare.js';
import {
  byPrefix, figureHtml, summaryHtml, paragraphs, listItems, fmtEurPc, fmtMe, fmtPct
} from './article-common.js';
import { buildRecommendations, AREAS } from './recommendations.js';
import { withKunta } from './municipality.js';
import { escapeHtml } from './format.js';

const yearTs = (y) => Date.UTC(Number(y), 0, 1);
const SOURCE = 'Valtiokonttori, kuntien taloustietopalvelu (KKNR, KKTR, KKOTR, KTAS, KTPE); Tilastokeskus';

// Alarm signals of the balance (finance_compiler.md, "Hälytysmerkit").
function signals(group) {
  const y = group.year;
  const v = (id, yy = y) => valueOf(group.main, id, yy);
  const recent = group.years.slice(-3);
  const out = [];
  if ((v('marginToDepreciation') ?? 100) < 100) out.push(`Vuosikate kattaa poistoista vain ${fmtPct(v('marginToDepreciation'))}: tulorahoitus ei riitä korvausinvestointeihin.`);
  const negEx = recent.filter((yy) => (v('cashflowExDisposals', yy) ?? 0) < 0).length;
  if (negEx >= 2) out.push(`Toiminnan ja investointien rahavirta ilman omaisuuden myyntituloja on ollut negatiivinen ${negEx} vuotena kolmesta.`);
  const loanGap = v('loans') - valueOf(group.classAvg, 'loans', y);
  if (loanGap > 0) out.push(`Lainakanta on ${fmtEurPc(loanGap)} kokoluokan keskiarvoa suurempi.`);
  if (v('groupLoans') > 1.5 * valueOf(group.country, 'groupLoans', y)) out.push('Konsernin lainakanta ylittää maan keskiarvon yli 50 %:lla (yksi arviointimenettelyn tunnusluvuista).');
  if ((v('accumulatedSurplus') ?? 0) < 0) out.push('Taseessa on kattamatonta alijäämää: kuntalain mukainen kattamisvelvollisuus.');
  if ((v('surplus') ?? 0) < 0) out.push(`Tilikausi ${y} oli alijäämäinen.`);
  return out;
}

async function renderStatus(a, group) {
  const el = byPrefix(a.id);
  const y = group.year;
  const v = (id) => valueOf(group.main, id, y);
  const ref = (id) => valueOf(group.classAvg, id, y);
  const ind = group.data.indicators;
  const tiles = [
    ['marginToDepreciation', 'vuosikate-poistot'], ['cashflow', 'rahavirta'], ['surplus', 'tulos'],
    ['accumulatedSurplus', 'kertynyt'], ['loans', 'lainakanta'], ['groupLoans', 'konserni']
  ];
  const warn = signals(group);
  el('title').textContent = warn.length
    ? `${group.main.name}: talous ei ole tasapainossa – ${warn.length} hälytysmerkkiä vuonna ${y}`
    : `${group.main.name}: talous on tunnuslukujen valossa tasapainossa vuonna ${y}`;
  el('content').innerHTML = `
    <div class="kpi-grid" id="${a.id}-tiles"></div>
    <div class="article__body" id="${a.id}-analysis">
      <h2>Hälytysmerkit</h2>
      ${warn.length ? listItems(warn) : '<p>Ei hälytysmerkkejä avainluvuissa.</p>'}
      <h2>Talouden vahvuus kokoluokassa</h2>
      <p>${escapeHtml(`Talouden vahvuuden pisteytyksessä ${group.main.name} on kokoluokassaan sijalla ${group.rank}/${group.classCount}. Pisteytys yhdistää toiminnan ja investointien rahavirran, vuosikatteen suhteen poistoihin, lainakannan, kertyneen ylijäämän ja konsernin lainakannan (${group.data.score.years.join('–')}). Kokoluokan vahvimmat ovat ${group.best.map((b) => b.name).join(', ')}.`)}</p>
    </div>
    ${summaryHtml(warn.length
    ? `${group.main.name} tarvitsee tasapainotustoimia: ${warn[0]}`
    : `${group.main.name} on tunnuslukujen valossa tasapainossa; seuraa investointien rahoitusta.`)}`;
  const box = el('tiles');
  for (const [id, href] of tiles) {
    const tile = document.createElement('kpi-tile');
    tile.setData({
      label: ind[id].label, value: v(id), unit: ind[id].unit, better: ind[id].better,
      format: ind[id].unit === '%' ? (x) => fmtPct(x) : fmtEurPc,
      ref: ref(id), refLabel: 'kokoluokka',
      note: (() => { const r = classRank(group, id, y); return r.rank ? `sija ${r.rank}/${r.count} kokoluokassa` : ''; })(),
      href: `#${href}`
    });
    box.append(tile);
  }
}

async function renderCashflow(a, group) {
  const el = byPrefix(a.id);
  const t = await loadTasapaino(group.main.slug);
  const kktr = t?.tables?.KKTR?.['k-t02']?.values || {};
  const year = Object.keys(kktr).sort().at(-1);
  const c = (row) => kktr[year]?.[row]?.C0010 ?? 0;
  const steps = [
    { label: 'Vuosikate', value: c('R0020') },
    // Line breaks keep the category labels readable on narrow screens.
    { label: 'Satunnaiset\nerät', value: c('R0030') },
    { label: 'Korjaus-\nerät', value: c('R0040') },
    { label: 'Investointi-\nmenot', value: -c('R0060') },
    { label: 'Rahoitus-\nosuudet', value: c('R0070') },
    { label: 'Luovutus-\ntulot', value: c('R0080') },
    { label: 'Rahavirta', value: c('R0090'), total: true }
  ];
  const years = Object.keys(kktr).sort();
  const total = (yy) => kktr[yy]?.R0090?.C0010 ?? null;
  const exDisp = (yy) => (total(yy) == null ? null : total(yy) - (kktr[yy]?.R0080?.C0010 ?? 0));
  const sum = years.reduce((s, yy) => s + (total(yy) ?? 0), 0);
  const sumEx = years.reduce((s, yy) => s + (exDisp(yy) ?? 0), 0);
  el('title').textContent = `${group.main.name}: toiminnan ja investointien rahavirta ${fmtMe(c('R0090'))} vuonna ${year}, ilman luovutustuloja ${fmtMe(exDisp(year))}`;
  el('content').innerHTML = `
    <div class="article__body">${paragraphs([
    'Rahavirta lasketaan: vuosikate + satunnaiset erät + tulorahoituksen korjauserät (sisältää mm. tuloutukset rahastoista ja myyntivoittojen oikaisun) − investointimenot + rahoitusosuudet investointeihin + käyttöomaisuuden luovutustulot.',
    'Jos rahavirta on useana vuonna negatiivinen, vaje katetaan kassavaroja vähentämällä tai ottamalla uutta lainaa.'
  ])}</div>
    ${figureHtml(`${a.id}-bridge`, { title: `Rahavirran muodostuminen ${year}`, subtitle: `${group.main.name}, euroa.`, source: 'Valtiokonttori, KKTR', body: `<waterfall-chart id="${a.id}-waterfall"></waterfall-chart>` })}
    ${figureHtml(`${a.id}-trend`, { title: 'Rahavirta ilman luovutustuloja vertailujoukossa', subtitle: '€/as. Ilman omaisuuden myyntituloja rahavirta kuvaa toistuvaa tasapainoa.', source: SOURCE, body: `<line-chart id="${a.id}-chart"></line-chart>` })}
    <div class="article__body" id="${a.id}-analysis">
      <h2>Analyysi</h2>
      ${paragraphs([
    `Vuosina ${years[0]}–${years.at(-1)} rahavirta oli yhteensä ${fmtMe(sum)} ja ilman luovutustuloja ${fmtMe(sumEx)}.`,
    `Vuonna ${year} luovutustulot olivat ${fmtMe(c('R0080'))} ja investointimenot ${fmtMe(c('R0060'))}. Lainakanta muuttui ${fmtMe(kktr[year]?.R0140?.C0010)} ja kassavarat ${fmtMe(kktr[year]?.R0310?.C0010)}.`
  ])}
    </div>
    ${summaryHtml(sumEx < 0
    ? `Ilman kertaluonteisia myyntituloja ${group.main.name} ei ole rahoittanut investointejaan tulorahoituksella: vaje ${fmtMe(-sumEx)} viidessä vuodessa.`
    : `${group.main.name} on rahoittanut investointinsa tulorahoituksella.`)}
    <data-table id="${a.id}-table"></data-table>`;
  el('waterfall').setData({
    steps, yName: '€', valueFormat: (v) => fmtMe(v).replace(' M€', ''), filename: `rahavirta-${year}-${group.main.slug}`,
    csv: { header: ['Erä', `${year} (€)`], rows: steps.map((s) => [s.label, s.value]) }
  });
  el('chart').setData({
    series: group.members.map((m) => ({
      name: m.name, color: m.color, period: 'year',
      dashed: m.kind === 'classAvg' ? true : m.kind === 'country' ? 'dotted' : false,
      data: group.years.map((yy) => [yearTs(yy), valueOf(m, 'cashflowExDisposals', yy)])
    })),
    yName: '€/as', filename: `rahavirta-ilman-luovutuksia-${group.main.slug}`,
    csv: { header: ['Yksikkö', ...group.years], rows: group.members.map((m) => [m.name, ...group.years.map((yy) => valueOf(m, 'cashflowExDisposals', yy))]) }
  });
  const rows = [['R0020', 'Vuosikate'], ['R0030', 'Satunnaiset erät'], ['R0040', 'Korjauserät'], ['R0060', 'Investointimenot'],
    ['R0070', 'Rahoitusosuudet'], ['R0080', 'Luovutustulot'], ['R0090', 'Toiminnan ja investointien rahavirta'],
    ['R0140', 'Lainakannan muutos'], ['R0320', 'Rahavarat 31.12.']];
  el('table').setData({
    caption: `${group.main.name}: rahoituslaskelma (M€)`,
    columns: [{ key: 'label', label: 'Erä' }, ...years.map((yy) => ({ key: yy, label: yy, numeric: true, format: (v) => fmtMe(v) }))],
    rows: rows.map(([code, label]) => ({ label, ...Object.fromEntries(years.map((yy) => [yy, kktr[yy]?.[code]?.C0010 ?? null])) }))
  });
}

async function renderGroup(a, group) {
  const el = byPrefix(a.id);
  const t = await loadTasapaino(group.main.slug);
  const k = t?.tables?.KKOTR || {};
  const years = Object.keys(k['kk-t01']?.values || {}).sort();
  const g = (table, row, yy) => k[table]?.values?.[yy]?.[row]?.C0010 ?? null;
  const kktr = t?.tables?.KKTR?.['k-t02']?.values || {};
  const rows = [
    ['Vuosikate', (yy) => g('kk-t01', 'R0130', yy), (yy) => t.annual[yy]?.annualMargin],
    ['Tilikauden ylijäämä', (yy) => g('kk-t01', 'R0250', yy), (yy) => t.annual[yy]?.surplus],
    ['Investointimenot', (yy) => g('kk-t02', 'R0080', yy), (yy) => kktr[yy]?.R0060?.C0010],
    ['Toiminnan ja investointien rahavirta', (yy) => g('kk-t02', 'R0110', yy), (yy) => kktr[yy]?.R0090?.C0010],
    ['Lainakanta', (yy) => (g('kk-t03', 'R0700', yy) ?? 0) + (g('kk-t03', 'R0820', yy) ?? 0), (yy) => t.annual[yy]?.loans],
    ['Kertynyt ylijäämä', (yy) => (g('kk-t03', 'R0570', yy) ?? 0) + (g('kk-t03', 'R0580', yy) ?? 0), (yy) => t.annual[yy]?.accumulatedSurplus]
  ];
  const last = years.at(-1);
  const loansGroup = rows[4][1](last);
  const loansOwn = rows[4][2](last);
  el('title').textContent = `${group.main.name}: konsernin lainakanta ${fmtMe(loansGroup)}, josta ${fmtMe(loansGroup - loansOwn)} tytäryhteisöissä ja kuntayhtymäosuuksissa (${last})`;
  el('content').innerHTML = `
    <div class="article__body">${paragraphs([
    'Kuntakonserni yhdistää kunnan, tytäryhteisöt, kuntayhtymäosuudet ja osakkuusyhteisöjen tulokset. Konsernin ja kunnan erotus kuvaa TOLT-yhteisöjen (tytär- ja osakkuusyhteisöt, kuntayhtymät, liikelaitokset) vaikutusta.'
  ])}</div>
    ${figureHtml(`${a.id}-loans`, { title: 'Konsernin lainakanta vertailujoukossa', subtitle: '€/as', source: 'Valtiokonttori, KKOTR; Tilastokeskus', body: `<line-chart id="${a.id}-chart"></line-chart>` })}
    <div class="article__body" id="${a.id}-analysis"><h2>Kunta vs. konserni</h2>
      <p>${escapeHtml(`Konsernin vuosikate oli ${fmtMe(rows[0][1](last))} ja kunnan ${fmtMe(rows[0][2](last))} vuonna ${last}. Konsernin lainoista ${fmtPct(100 * (loansGroup - loansOwn) / loansGroup)} on muissa konserniyhteisöissä kuin kunnassa.`)}</p>
    </div>
    <data-table id="${a.id}-table"></data-table>`;
  el('chart').setData({
    series: group.members.map((m) => ({
      name: m.name, color: m.color, period: 'year',
      dashed: m.kind === 'classAvg' ? true : m.kind === 'country' ? 'dotted' : false,
      data: group.years.map((yy) => [yearTs(yy), valueOf(m, 'groupLoans', yy)])
    })),
    yName: '€/as', filename: `konsernin-lainakanta-${group.main.slug}`,
    csv: { header: ['Yksikkö', ...group.years], rows: group.members.map((m) => [m.name, ...group.years.map((yy) => valueOf(m, 'groupLoans', yy))]) }
  });
  el('table').setData({
    caption: `${group.main.name}: konserni ja kunta (M€); erotus = TOLT-yhteisöjen vaikutus`,
    columns: [{ key: 'label', label: 'Erä' }, ...years.flatMap((yy) => [
      { key: `g${yy}`, label: `Konserni ${yy}`, numeric: true, format: (v) => fmtMe(v) },
      { key: `d${yy}`, label: `Erotus ${yy}`, numeric: true, format: (v) => fmtMe(v) }
    ]).slice(-6)],
    rows: rows.map(([label, grp, own]) => ({
      label,
      ...Object.fromEntries(years.flatMap((yy) => [[`g${yy}`, grp(yy)], [`d${yy}`, grp(yy) != null && own(yy) != null ? grp(yy) - own(yy) : null]]))
    }))
  });
}

async function renderTolt(a, group) {
  const el = byPrefix(a.id);
  const [tolt, t] = await Promise.all([loadTolt(), loadTasapaino(group.main.slug)]);
  const own = tolt?.municipalities?.[group.main.slug];
  const entities = own?.entities || [];
  const years = Object.keys(t.annual).sort();
  el('content').innerHTML = `
    <div class="article__body">${paragraphs([
    'TOLTA: tytäryhteisöt, osakkuusyhteisöt, muut omistusyhteysyhteisöt, kuntayhtymät ja muut sidosyksiköt. TOLTB: liikelaitokset ja vesihuollon taseyksiköt.',
    'Valtiokonttorin avoimessa rajapinnassa TOLT-tiedot eivät ole yhteisökohtaisina. Konsernitason vaikutus näkyy Kuntakonserni-välilehden erotussarakkeissa ja kunnan taseen tytäryhteisöosakkeissa alla.'
  ])}</div>
    ${figureHtml(`${a.id}-shares`, { title: 'Osakkeet ja osuudet tytäryhteisöissä kunnan taseessa', subtitle: `${group.main.name}, M€`, source: 'Valtiokonttori, KKNR (tase)', body: `<bar-chart id="${a.id}-chart"></bar-chart>` })}
    <div class="article__body" id="${a.id}-analysis">
      <h2>Yhteisökohtaiset tiedot</h2>
      ${entities.length ? '' : `<p class="note">Yhteisökohtaisia tietoja ei ole vielä lisätty. Täydennä ne tilinpäätöksen konsernin liitetiedoista tiedostoon backend/data/tolt/tolt.json (ohje: backend/md/data/tolt.md).</p>`}
    </div>
    <data-table id="${a.id}-table"></data-table>`;
  el('chart').setData({
    categories: years,
    series: [{ name: 'Tytäryhteisöosakkeet', values: years.map((yy) => t.annual[yy]?.subsidiaryShares ?? null) }],
    yName: '€', valueFormat: (v) => fmtMe(v).replace(' M€', ''), filename: `tytaryhteisot-${group.main.slug}`,
    csv: { header: ['Vuosi', 'Osakkeet tytäryhteisöissä (€)'], rows: years.map((yy) => [yy, t.annual[yy]?.subsidiaryShares]) }
  });
  if (entities.length) {
    el('table').setData({
      caption: `${group.main.name}: TOLT-yhteisöt (${own.year}, lähde: ${own.source})`,
      columns: [
        { key: 'name', label: 'Yhteisö' }, { key: 'type', label: 'Tyyppi' },
        { key: 'ownership', label: 'Omistus-%', numeric: true, format: (v) => fmtPct(v) },
        { key: 'revenue', label: 'Liikevaihto', numeric: true, format: (v) => fmtMe(v) },
        { key: 'result', label: 'Tulos', numeric: true, format: (v) => fmtMe(v), signColor: true },
        { key: 'loans', label: 'Lainat', numeric: true, format: (v) => fmtMe(v) }
      ],
      rows: entities
    });
  } else {
    el('table').remove();
  }
}

async function renderBudget(a, group) {
  const el = byPrefix(a.id);
  const t = await loadTasapaino(group.main.slug);
  const ktas = t?.tables?.KTAS?.['k-t05']?.values || {};
  const ktpe = t?.tables?.KTPE?.['k-t25']?.values || {};
  const kktr = t?.tables?.KKTR?.['k-t02']?.values || {};
  const by = Object.keys(ktas).sort().at(-1);
  const pe = Object.keys(ktpe).sort().at(-1);
  const actualYears = Object.keys(t.annual).sort();
  const lastActual = actualYears.at(-1);
  // Row codes are the same in KTAS (k-t05) and KTPE (k-t25).
  const rows = [['R0150', 'Toimintakate', 'operatingMargin'], ['R0160', 'Verotulot', 'taxes'], ['R0170', 'Valtionosuudet', 'stateAid'],
    ['R0190', 'Vuosikate', 'annualMargin'], ['R0200', 'Poistot', 'depreciation'], ['R0240', 'Tilikauden ylijäämä', 'surplus'],
    ['R0250', 'Investointimenot', null], ['R0380', 'Toiminnan ja investointien rahavirta', null], ['R0390', 'Lainakanta 31.12.', 'loans']];
  const actual = (key, code, yy) => (key ? t.annual[yy]?.[key] : code === 'R0250' ? kktr[yy]?.R0060?.C0010 : kktr[yy]?.R0090?.C0010) ?? null;
  const cols = [
    { key: 'a', label: `Toteuma ${lastActual}` },
    { key: 'pe', label: `Ennuste ${pe} (KTPE)` },
    { key: 'b0', label: `TA ${by}` },
    { key: 'b1', label: `TS ${Number(by) + 1}` },
    { key: 'b2', label: `TS ${Number(by) + 2}` }
  ];
  const table = rows.map(([code, label, key]) => ({
    label,
    a: actual(key, code, lastActual),
    pe: ktpe[pe]?.[code]?.C0010 ?? null,
    b0: ktas[by]?.[code]?.C0020 ?? null,
    b1: ktas[by]?.[code]?.C0030 ?? null,
    b2: ktas[by]?.[code]?.C0040 ?? null
  }));
  const cf = table.find((r) => r.label.startsWith('Toiminnan'));
  const loans = table.find((r) => r.label.startsWith('Lainakanta'));
  el('title').textContent = `${group.main.name}: suunnitelmakaudella ${by}–${Number(by) + 2} rahavirta ${fmtMe((cf.b0 ?? 0) + (cf.b1 ?? 0) + (cf.b2 ?? 0))} ja lainakanta kasvaa ${fmtMe(loans.a)} → ${fmtMe(loans.b2)}`;
  const chartYears = [...actualYears.map((yy) => ({ label: yy, kind: 'Toteuma', v: actual(null, 'R0380', yy) })),
    { label: `${pe} ennuste`, kind: 'Ennuste', v: cf.pe },
    { label: `TA ${by}`, kind: 'Talousarvio', v: cf.b0 },
    { label: `TS ${Number(by) + 1}`, kind: 'Suunnitelma', v: cf.b1 },
    { label: `TS ${Number(by) + 2}`, kind: 'Suunnitelma', v: cf.b2 }];
  el('content').innerHTML = `
    <div class="article__body">${paragraphs([
    'Talousarvio ja taloussuunnitelma (KTAS) raportoidaan Valtiokonttorille tammikuussa. Tilinpäätösennuste (KTPE) on kunnan oma arvio kuluvasta vuodesta, ja se raportoidaan elokuussa.'
  ])}</div>
    ${figureHtml(`${a.id}-cf`, { title: 'Toiminnan ja investointien rahavirta: toteuma, ennuste ja suunnitelma', subtitle: `${group.main.name}, M€`, source: 'Valtiokonttori, KKTR, KTPE, KTAS', body: `<bar-chart id="${a.id}-chart"></bar-chart>` })}
    <div class="article__body" id="${a.id}-analysis"><h2>Analyysi</h2>${paragraphs([
    `Talousarvion ${by} vuosikate (${fmtMe(table[3].b0)}) ${table[3].b0 < table[4].b0 ? 'ei kata' : 'kattaa'} poistoja (${fmtMe(table[4].b0)}).`,
    `Lainakanta on suunnitelman mukaan ${fmtMe(loans.b2)} vuoden ${Number(by) + 2} lopussa, ${fmtPct(100 * (loans.b2 - loans.a) / loans.a)} enemmän kuin ${lastActual}.`,
    cf.pe != null ? `Kunnan oma tilinpäätösennuste vuodelle ${pe} on ${fmtMe(cf.pe)} (talousarvio ${fmtMe(cf.b0)}).` : ''
  ])}</div>
    <data-table id="${a.id}-table"></data-table>`;
  el('chart').setData({
    categories: chartYears.map((c) => c.label),
    series: [{ name: 'Rahavirta', values: chartYears.map((c) => c.v) }],
    signColors: true, yName: '€', valueFormat: (v) => fmtMe(v).replace(' M€', ''), filename: `suunnitelma-${group.main.slug}`,
    csv: { header: ['Kausi', 'Tyyppi', 'Rahavirta (€)'], rows: chartYears.map((c) => [c.label, c.kind, c.v]) }
  });
  el('table').setData({
    caption: `${group.main.name}: talousarvio, suunnitelma ja ennuste (M€)`,
    columns: [{ key: 'label', label: 'Erä' }, ...cols.map((c) => ({ ...c, numeric: true, format: (v) => fmtMe(v) }))],
    rows: table
  });
}

async function renderDevelopment(a, group) {
  const el = byPrefix(a.id);
  const rec = await buildRecommendations(group);
  const firsts = AREAS.map((area) => ({ area, item: rec[area.id][0] })).filter((x) => x.item);
  el('title').textContent = `${group.main.name}: viisi tärkeintä kehitysehdotusta`;
  el('content').innerHTML = `
    <div class="article__body" id="${a.id}-analysis">
      <p>Jokaisen tasapainotusohjelman osa-alueen tärkein nosto. Kaikki ehdotukset perusteluineen ovat Toimenpiteet-sivulla.</p>
      <ol class="rec-list">${firsts.map(({ area, item }) => `
        <li><p class="rec-list__area">${escapeHtml(area.label)}</p>
          <h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p>
          ${item.impact ? `<p class="rec-list__impact">Potentiaali enintään ${escapeHtml(fmtMe(item.impact))} vuodessa (${escapeHtml(item.impactNote || '')})</p>` : ''}
          <a href="${withKunta(`toimenpiteet.html#${area.id}`)}">Kaikki ${escapeHtml(area.label.toLowerCase())} -ehdotukset</a></li>`).join('')}
      </ol>
    </div>`;
}

setupPage('kokonaistalous', {
  tila: renderStatus,
  rahavirta: renderCashflow,
  konserni: renderGroup,
  tolt: renderTolt,
  talousarvio: renderBudget,
  kehitys: renderDevelopment
});

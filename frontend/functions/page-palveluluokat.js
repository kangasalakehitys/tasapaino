// Palveluluokat page (spec: backend/md/pages/palveluluokat.md): external income
// and costs per resident by service class (KKTPP) and by account, statutory
// status, education unit costs (TOTT) and purchase invoices.

import '../components/dot-plot.js';
import '../components/bar-chart.js';
import '../components/data-table.js';
import '../components/kpi-tile.js';
import { setupPage } from './subpage.js';
import {
  loadServiceComparison, loadFinancePL, loadInvoices, loadInvoiceComparison
} from './data.js';
import { valueOf, COLORS } from './compare.js';
import { classGaps } from './recommendations.js';
import {
  byPrefix, figureHtml, summaryHtml, paragraphs, fmtEurPc, fmtMe, fmtPct, fmtEur
} from './article-common.js';
import { escapeHtml } from './format.js';

const KKTPP = 'Valtiokonttori, KKTPP (ulkoiset erät); Tilastokeskus';
const nf0 = new Intl.NumberFormat('fi-FI', { maximumFractionDigits: 0 });

// Per-resident items of one municipality from its finance-pl.json: { code: { item: €/as } }.
async function ownClasses(slug, year) {
  const f = await loadFinancePL(slug);
  const y = f?.years?.find((x) => x.year === year);
  if (!y?.population) return null;
  return Object.fromEntries(Object.entries(y.classes).filter(([, v]) => v).map(([code, v]) => [code,
    Object.fromEntries(Object.entries(v).map(([k, x]) => [k, x == null ? null : x / y.population]))]));
}

// Members of the class comparison: main, peers, class average, mean of the
// best three, mainland average; values { code: { item: €/as } }.
async function classMembers(group, sc) {
  const units = [group.main, ...group.peers, ...group.best];
  const own = await Promise.all(units.map((m) => ownClasses(m.slug, sc.year)));
  const bySlug = Object.fromEntries(units.map((m, i) => [m.slug, own[i]]));
  const best = group.best.map((b) => bySlug[b.slug]).filter(Boolean);
  const bestMean = {};
  for (const code of Object.keys(sc.averages.country)) {
    bestMean[code] = {};
    for (const item of Object.keys(sc.items)) {
      const xs = best.map((b) => b[code]?.[item] ?? 0);
      bestMean[code][item] = xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null;
    }
  }
  return [
    { ...group.main, classes: bySlug[group.main.slug] },
    ...group.peers.map((p) => ({ ...p, classes: bySlug[p.slug] })),
    { ...group.classAvg, classes: sc.averages.classes[group.main.sizeClass] },
    { ...group.bestAvg, classes: bestMean },
    { ...group.country, classes: sc.averages.country }
  ].filter((m) => m.classes);
}

function renderDots(item, background) {
  return async (a, group) => {
    const el = byPrefix(a.id);
    const sc = await loadServiceComparison();
    const members = await classMembers(group, sc);
    const avg = sc.averages.classes[group.main.sizeClass];
    // The 20 classes where the size class spends (or earns) the most.
    const classes = [...sc.classes].sort((x, y) => (avg[y.code]?.[item] ?? 0) - (avg[x.code]?.[item] ?? 0)).slice(0, 20);
    const main = members[0];
    const gaps = classes.map((c) => ({ c, own: main.classes[c.code]?.[item] ?? 0, ref: avg[c.code]?.[item] ?? 0 }))
      .map((g) => ({ ...g, gap: g.own - g.ref }));
    const over = [...gaps].sort((x, y) => (item === 'operating-costs' ? y.gap - x.gap : x.gap - y.gap)).slice(0, 3);
    const label = item === 'operating-costs' ? 'toimintakulut' : 'toimintatuotot';
    el('title').textContent = item === 'operating-costs'
      ? `${group.main.name}: suurimmat ylitykset kokoluokan keskiarvoon ${over.map((g) => g.c.name.toLowerCase()).join(', ')}`
      : `${group.main.name}: tuotot jäävät keskiarvosta eniten luokissa ${over.map((g) => g.c.name.toLowerCase()).join(', ')}`;
    el('content').innerHTML = `
      ${figureHtml(`${a.id}-fig`, {
    title: `Ulkoiset ${label} palveluluokittain ${sc.year}`,
    subtitle: `€/as. Pienet pisteet: kokoluokan ${group.main.sizeClass} muut kunnat. Kokoluokan 20 suurinta luokkaa.`,
    source: KKTPP,
    body: `<dot-plot id="${a.id}-dots"></dot-plot>`
  })}
      <div class="article__body" id="${a.id}-analysis"><h2>Analyysi</h2>${paragraphs(over.map((g) =>
    `${g.c.name}: ${group.main.name} ${fmtEurPc(g.own)}, kokoluokka ${fmtEurPc(g.ref)} (ero ${fmtEurPc(g.gap)}, ${fmtMe(g.gap * valueOf(group.main, 'population', group.year))} vuodessa).`))}</div>
      <data-table id="${a.id}-table"></data-table>`;
    const others = background
      ? sc.municipalities.filter((m) => m.sizeClass === group.main.sizeClass && m.slug !== group.main.slug)
        .flatMap((m) => classes.map((c, i) => ({ category: i, value: (item === 'operating-costs' ? m.costs : m.income)[c.code] ?? 0, label: m.name })))
      : [];
    el('dots').setData({
      categories: classes.map((c) => c.name),
      others: { name: 'Kokoluokan muut kunnat', points: others },
      markers: members.map((m, i) => ({
        name: m.name, color: m.color,
        symbol: m.kind === 'classAvg' ? 'diamond' : m.kind === 'bestAvg' ? 'triangle' : m.kind === 'country' ? 'rect' : 'circle',
        values: classes.map((c) => m.classes[c.code]?.[item] ?? (i === 0 ? 0 : null))
      })),
      xName: '€/as', filename: `${a.id}-${group.main.slug}`,
      csv: { header: ['Palveluluokka', ...members.map((m) => m.name)], rows: classes.map((c) => [c.name, ...members.map((m) => m.classes[c.code]?.[item] ?? null)]) }
    });
    el('table').setData({
      caption: `Ulkoiset ${label} €/as ${sc.year}`,
      columns: [{ key: 'name', label: 'Palveluluokka' }, ...members.map((m, i) => ({ key: `m${i}`, label: m.name, numeric: true, format: (v) => fmtEurPc(v) })),
        { key: 'gap', label: 'Ero kokoluokkaan', numeric: true, signColor: true, format: (v) => fmtEurPc(v) }],
      rows: classes.map((c) => ({
        name: c.name,
        ...Object.fromEntries(members.map((m, i) => [`m${i}`, m.classes[c.code]?.[item] ?? null])),
        gap: (main.classes[c.code]?.[item] ?? 0) - (avg[c.code]?.[item] ?? 0)
      })),
      sort: { key: 'gap', dir: item === 'operating-costs' ? 'desc' : 'asc' }
    });
  };
}

async function renderStatutory(a, group) {
  const el = byPrefix(a.id);
  const { list, statutory, year } = await classGaps(group);
  const byStatus = {};
  for (const g of list) byStatus[g.status || 'muu'] = (byStatus[g.status || 'muu'] || 0) + Math.max(0, g.gapEuros);
  const statuses = Object.keys(statutory.statuses);
  const voluntaryOver = list.filter((g) => ['voluntary', 'licensed'].includes(g.status) && g.gapEuros > 0);
  el('title').textContent = `${group.main.name}: menot ylittävät kokoluokan keskiarvon ${fmtMe(Object.values(byStatus).reduce((s, x) => s + x, 0))}, josta vapaaehtoisissa ja luvanvaraisissa tehtävissä ${fmtMe((byStatus.voluntary || 0) + (byStatus.licensed || 0))}`;
  el('content').innerHTML = `
    <div class="article__body">${paragraphs([
    'Palveluluokat on jaettu lakisääteisyyden mukaan kuntien lakisääteisten tehtävien vertailun (VM, kuntien_lakisaateiset_tehtavat_vertailtu) perusteella. Luokittelu on arvio: laissa voi olla järjestämisvelvollisuus, vaikka palvelun laajuus ja tuotantotapa ovat kunnan päätettävissä.',
    'Ero kokoluokan keskiarvoon on laskettu nettomenoista (ulkoiset toimintakulut − toimintatuotot) euroa asukasta kohden ja kerrottu kunnan asukasluvulla. Vain keskiarvon ylitykset on laskettu yhteen.'
  ])}</div>
    ${figureHtml(`${a.id}-fig`, { title: `Keskiarvon ylitys lakisääteisyyden mukaan ${year}`, subtitle: 'M€ vuodessa', source: `${KKTPP}; VM`, body: `<bar-chart id="${a.id}-chart"></bar-chart>` })}
    <div class="article__body" id="${a.id}-analysis"><h2>Vapaaehtoiset ja luvanvaraiset tehtävät, joissa menot ylittävät keskiarvon</h2>
      ${paragraphs(voluntaryOver.sort((x, y) => y.gapEuros - x.gapEuros).map((g) => `${g.name}: ${fmtEurPc(g.net)} vs. ${fmtEurPc(g.avgNet)} (${fmtMe(g.gapEuros)}). ${g.law}.`))}
    </div>
    <data-table id="${a.id}-table"></data-table>`;
  el('chart').setData({
    categories: statuses.map((s) => statutory.statuses[s].label),
    series: [{ name: 'Ylitys', values: statuses.map((s) => byStatus[s] || 0) }],
    horizontal: true, valueFormat: (v) => fmtMe(v).replace(' M€', ''), filename: `lakisaateisyys-${group.main.slug}`,
    csv: { header: ['Tehtävätyyppi', 'Ylitys (€)'], rows: statuses.map((s) => [statutory.statuses[s].label, byStatus[s] || 0]) }
  });
  el('table').setData({
    caption: `Nettomenot €/as ${year} ja ero kokoluokan keskiarvoon`,
    columns: [
      { key: 'name', label: 'Palveluluokka' },
      { key: 'statusLabel', label: 'Lakisääteisyys' },
      { key: 'net', label: group.main.name, numeric: true, format: (v) => fmtEurPc(v) },
      { key: 'avgNet', label: 'Kokoluokka', numeric: true, format: (v) => fmtEurPc(v) },
      { key: 'gapEuros', label: 'Ero (M€)', numeric: true, signColor: true, format: (v) => fmtMe(v) }
    ],
    rows: list.map((g) => ({ ...g, statusLabel: statutory.statuses[g.status]?.label ?? '–' })),
    sort: { key: 'gapEuros', dir: 'desc' }
  });
}

function renderAccounts(items, title) {
  return async (a, group) => {
    const el = byPrefix(a.id);
    const sc = await loadServiceComparison();
    const members = await classMembers(group, sc);
    const main = members[0];
    const avg = members.find((m) => m.kind === 'classAvg');
    const diffs = items.map(([key, label]) => ({ label, own: main.classes.x0?.[key] ?? 0, ref: avg.classes.x0?.[key] ?? 0 }));
    const biggest = [...diffs].sort((x, y) => Math.abs(y.own - y.ref) - Math.abs(x.own - x.ref))[0];
    el('title').textContent = `${group.main.name}: ${biggest.label.toLowerCase()} ${fmtEurPc(biggest.own)} vs. kokoluokan ${fmtEurPc(biggest.ref)} (${sc.year})`;
    el('content').innerHTML = `
      ${figureHtml(`${a.id}-fig`, { title: `${title} tileittäin ${sc.year}`, subtitle: '€/as, koko kunta (ulkoiset erät)', source: KKTPP, body: `<bar-chart id="${a.id}-chart" class="chart--tall"></bar-chart>` })}
      <div class="article__body" id="${a.id}-analysis"><h2>Analyysi</h2>${paragraphs(diffs.map((d) =>
    `${d.label}: ${fmtEurPc(d.own)}, kokoluokka ${fmtEurPc(d.ref)} (${d.own >= d.ref ? '+' : '−'}${fmtEurPc(Math.abs(d.own - d.ref))}).`))}</div>
      <data-table id="${a.id}-table"></data-table>`;
    el('chart').setData({
      categories: items.map(([, label]) => label),
      series: members.map((m) => ({ name: m.name, color: m.color, values: items.map(([key]) => m.classes.x0?.[key] ?? null) })),
      horizontal: true, filename: `${a.id}-${group.main.slug}`,
      csv: { header: ['Tili', ...members.map((m) => m.name)], rows: items.map(([key, label]) => [label, ...members.map((m) => m.classes.x0?.[key] ?? null)]) }
    });
    el('table').setData({
      caption: `${title} €/as ${sc.year}`,
      columns: [{ key: 'label', label: 'Tili' }, ...members.map((m, i) => ({ key: `m${i}`, label: m.name, numeric: true, format: (v) => fmtEurPc(v) }))],
      rows: items.map(([key, label]) => ({ label, ...Object.fromEntries(members.map((m, i) => [`m${i}`, m.classes.x0?.[key] ?? null])) }))
    });
  };
}

async function renderEducation(a, group) {
  const el = byPrefix(a.id);
  const ids = ['costPreschool', 'costBasic', 'costUpper'];
  const ind = group.data.indicators;
  const year = [...group.years].reverse().find((y) => valueOf(group.main, 'costBasic', y) != null);
  const units = group.all;
  el('title').textContent = `${group.main.name}: perusopetus ${fmtEur(valueOf(group.main, 'costBasic', year))} ja esiopetus ${fmtEur(valueOf(group.main, 'costPreschool', year))} ikäluokan asukasta kohden (${year})`;
  el('content').innerHTML = `
    <div class="article__body">${paragraphs([
    'Toimintakulut (TOTT) on jaettu ikäluokan asukasmäärällä: esiopetus 6-vuotiaat, perusopetus 7–15-vuotiaat ja lukio 16–18-vuotiaat (Tilastokeskus, viimeisin toteutunut vuosi). Mittari on oppilasmäärään perustuvaa yksikkökustannusta karkeampi: lukiossa opiskelee myös muiden kuntien nuoria, eikä kaikki ikäluokka opiskele lukiossa.'
  ])}</div>
    ${ids.map((id) => figureHtml(`${a.id}-${id}`, { title: `${ind[id].label} ${year}`, subtitle: '€ ikäluokan asukasta kohden', source: 'Valtiokonttori, TOTT; Tilastokeskus', body: `<bar-chart id="${a.id}-${id}-chart"></bar-chart>` })).join('')}
    <div class="article__body" id="${a.id}-analysis"><h2>Analyysi</h2>${paragraphs(ids.map((id) => {
    const own = valueOf(group.main, id, year);
    const ref = valueOf(group.classAvg, id, year);
    return `${ind[id].label}: ${fmtEur(own)}, kokoluokka ${fmtEur(ref)} (${own >= ref ? '+' : '−'}${fmtPct(Math.abs(100 * (own - ref) / ref))}).`;
  }))}</div>
    <data-table id="${a.id}-table"></data-table>`;
  for (const id of ids) {
    const rows = units.filter((m) => valueOf(m, id, year) != null);
    el(`${id}-chart`).setData({
      categories: rows.map((m) => (m.kind === 'best' ? `${m.name} (paras)` : m.name)),
      series: [{ name: ind[id].label, values: rows.map((m) => ({ value: valueOf(m, id, year), itemStyle: { color: m.color } })) }],
      horizontal: true, filename: `${id}-${group.main.slug}`,
      csv: { header: ['Yksikkö', `${ind[id].label} ${year}`], rows: rows.map((m) => [m.name, valueOf(m, id, year)]) }
    });
  }
  el('table').setData({
    caption: `Opetuksen kustannukset ikäluokan asukasta kohden ${year} (€)`,
    columns: [{ key: 'name', label: 'Yksikkö' }, ...ids.map((id) => ({ key: id, label: ind[id].label, numeric: true, format: (v) => fmtEur(v) }))],
    rows: units.map((m) => ({ name: m.name, kind: m.kind, ...Object.fromEntries(ids.map((id) => [id, valueOf(m, id, year)])) })),
    highlight: (r) => r.kind === 'main'
  });
}

// Municipalities with published invoice data (ostolaskut.py).
const INVOICE_SLUGS = ['kangasala', 'ylojarvi'];

async function invoiceUnits(group) {
  const slugs = [group.main.slug, ...INVOICE_SLUGS.filter((s) => s !== group.main.slug)];
  const data = await Promise.all(slugs.map((s) => loadInvoices(s)));
  return slugs.map((slug, i) => ({ slug, data: data[i] })).filter((u) => u.data);
}

function noInvoices(el, group) {
  el('content').innerHTML = `<p class="note">${escapeHtml(group.main.name)} ei ole mukana ostolaskuaineistossa. Aineisto on käytettävissä kunnista Kangasala ja Ylöjärvi (aineisto/ostolaskut).</p>`;
}

async function renderInvoices(a, group) {
  const el = byPrefix(a.id);
  const units = await invoiceUnits(group);
  if (!units.length || units[0].slug !== group.main.slug) return noInvoices(el, group);
  const popOf = (slug) => valueOf(group.data.municipalities.find((m) => m.slug === slug), 'population', group.year);
  const groups = ['Muiden palvelujen ostot', 'Asiakaspalvelujen ostot', 'Aineet, tarvikkeet ja tavarat', 'Avustukset', 'Vuokrat', 'Muut toimintakulut', 'Muut'];
  const years = Object.keys(units[0].data.years).sort();
  const last = years.at(-1);
  const own = units[0].data.years[last];
  el('title').textContent = `${group.main.name}: ${nf0.format(own.invoices)} ostolaskua vuonna ${last}, joista ${fmtPct(100 * own.smallInvoices.share)} alle ${own.smallInvoices.limit} euron`;
  el('content').innerHTML = `
    <div class="kpi-grid" id="${a.id}-tiles"></div>
    ${figureHtml(`${a.id}-fig`, { title: 'Ostot tiliryhmittäin', subtitle: '€/as ilman arvonlisäveroa, toimintakulutilit', source: 'Kuntien julkaisemat ostolaskut', body: `<bar-chart id="${a.id}-chart" class="chart--tall"></bar-chart>` })}
    <div class="article__body" id="${a.id}-analysis"><h2>Analyysi</h2>${paragraphs([
    units[0].data.note,
    ...units.map((u) => {
      const d = u.data.years[last];
      return d ? `${u.data.name} ${last}: ostot ${fmtMe(d.operating)} (toimintakulutilit), ${nf0.format(d.suppliers)} toimittajaa, kymmenen suurimman osuus ${fmtPct(100 * d.top10Share)}.` : '';
    }),
    'Taseen ja investointien tilit (esim. lainanlyhennykset, eläkemaksut, rakennusurakat) on jätetty tiliryhmävertailun ulkopuolelle.'
  ])}</div>`;
  const tiles = el('tiles');
  const other = units[1]?.data.years[last];
  for (const [label, value, ref, fmt] of [
    ['Ostot toimintakulutileillä', own.operating / popOf(group.main.slug), other ? other.operating / popOf(units[1].slug) : null, fmtEurPc],
    ['Laskuja', own.invoices, other?.invoices, (v) => nf0.format(v)],
    ['Toimittajia', own.suppliers, other?.suppliers, (v) => nf0.format(v)],
    ['Pienlaskujen osuus', 100 * own.smallInvoices.share, other ? 100 * other.smallInvoices.share : null, (v) => fmtPct(v)]
  ]) {
    tiles.append(Object.assign(document.createElement('kpi-tile')).setData({ label, value, ref, refLabel: units[1]?.data.name ?? '', format: fmt, unit: label.includes('osuus') ? '%' : '' }));
  }
  el('chart').setData({
    categories: groups,
    series: units.flatMap((u, i) => years.filter((y) => u.data.years[y]).slice(-1).map((y) => ({
      name: `${u.data.name} ${y}`, color: i === 0 ? COLORS.main : COLORS.peer[0],
      values: groups.map((g) => (u.data.years[y].groups[g] ?? 0) / popOf(u.slug))
    }))),
    horizontal: true, filename: `ostot-${group.main.slug}`,
    csv: { header: ['Tiliryhmä', ...units.map((u) => u.data.name)], rows: groups.map((g) => [g, ...units.map((u) => (u.data.years[last]?.groups[g] ?? 0) / popOf(u.slug))]) }
  });
}

async function renderSuppliers(a, group) {
  const el = byPrefix(a.id);
  const units = await invoiceUnits(group);
  if (!units.length || units[0].slug !== group.main.slug) return noInvoices(el, group);
  const d = units[0].data;
  const years = Object.keys(d.years).sort();
  const last = years.at(-1);
  const top = d.years[last].topSuppliers.slice(0, 15);
  el('title').textContent = `${group.main.name}: kymmenen suurinta toimittajaa saa ${fmtPct(100 * d.years[last].top10Share)} ostoista (${last})`;
  el('content').innerHTML = `
    ${figureHtml(`${a.id}-fig`, { title: `15 suurinta toimittajaa ${last}`, subtitle: 'M€ ilman arvonlisäveroa, kaikki tilit', source: 'Kunnan julkaisema ostolaskudata', body: `<bar-chart id="${a.id}-chart" class="chart--tall"></bar-chart>` })}
    <div class="article__body" id="${a.id}-analysis"><h2>Analyysi</h2>${paragraphs([
    'Suurimpia maksunsaajia ovat usein muut julkisyhteisöt (kuntayhtymät, naapurikunnat, Kela) ja rahoituslaitokset. Hankintojen ohjauksessa keskeisiä ovat yritystoimittajat, joiden sopimukset voi kilpailuttaa uudelleen.',
    `Toimittajia oli ${nf0.format(d.years[last].suppliers)}. Mitä enemmän pieniä toimittajia, sitä enemmän laskujen käsittelytyötä per euro.`
  ])}</div>
    <data-table id="${a.id}-table"></data-table>`;
  el('chart').setData({
    categories: top.map((s) => s.name),
    series: [{ name: `Ostot ${last}`, color: COLORS.main, values: top.map((s) => s.sum) }],
    horizontal: true, valueFormat: (v) => fmtMe(v).replace(' M€', ''), filename: `toimittajat-${group.main.slug}`,
    csv: { header: ['Toimittaja', 'Y-tunnus', `Ostot ${last} (€)`], rows: top.map((s) => [s.name, s.id, s.sum]) }
  });
  el('table').setData({
    caption: `Suurimmat toimittajat ${years[0]}–${last} (M€)`,
    columns: [{ key: 'name', label: 'Toimittaja' }, ...years.map((y) => ({ key: y, label: y, numeric: true, format: (v) => fmtMe(v) }))],
    rows: d.supplierTrend.map((s) => ({ name: s.name, ...s.years })),
    sort: { key: last, dir: 'desc' }
  });
}

async function renderShared(a, group) {
  const el = byPrefix(a.id);
  const cmp = await loadInvoiceComparison();
  if (!cmp || !INVOICE_SLUGS.includes(group.main.slug)) return noInvoices(el, group);
  el('title').textContent = `Kangasala ja Ylöjärvi ostavat ${cmp.sharedSuppliers} samalta toimittajalta: ${fmtMe(cmp.sharedSum.kangasala)} ja ${fmtMe(cmp.sharedSum.ylojarvi)} vuosina ${cmp.years[0]}–${cmp.years.at(-1)}`;
  el('content').innerHTML = `
    <div class="article__body" id="${a.id}-analysis">${paragraphs([
    'Yhteiset toimittajat on tunnistettu y-tunnuksesta, ja mukana ovat vain toimintakulutilit (ei lainoja, eläkemaksuja tai investointeja). Yhteiset kilpailutukset, puitejärjestelyt tai seudullinen hankintayksikkö voivat tuoda hintaetua ja vähentää kilpailutustyötä.'
  ])}</div>
    ${summaryHtml(`Kahden prosentin hintaetu yhteisostoista olisi Kangasalalle noin ${fmtMe(cmp.sharedSum.kangasala / cmp.years.length * 0.02)} vuodessa.`)}
    <data-table id="${a.id}-table"></data-table>`;
  el('table').setData({
    caption: `Yhteiset toimittajat ${cmp.years[0]}–${cmp.years.at(-1)} (M€, toimintakulutilit)`,
    columns: [
      { key: 'name', label: 'Toimittaja' },
      { key: 'kangasala', label: 'Kangasala', numeric: true, format: (v) => fmtMe(v) },
      { key: 'ylojarvi', label: 'Ylöjärvi', numeric: true, format: (v) => fmtMe(v) }
    ],
    rows: cmp.top,
    sort: { key: 'kangasala', dir: 'desc' }
  });
}

setupPage('palveluluokat', {
  menot: renderDots('operating-costs', true),
  tulot: renderDots('operating-income', true),
  lakisaateiset: renderStatutory,
  kulurakenne: renderAccounts([
    ['personnel', 'Henkilöstökulut'], ['customer-services', 'Asiakaspalvelujen ostot'], ['other-services', 'Muiden palvelujen ostot'],
    ['materials', 'Aineet, tarvikkeet ja tavarat'], ['grants', 'Avustukset'], ['other-costs', 'Muut toimintakulut']
  ], 'Toimintakulut'),
  tulorakenne: renderAccounts([
    ['sales', 'Myyntituotot'], ['fees', 'Maksutuotot'], ['subsidies', 'Tuet ja avustukset'], ['other-income', 'Muut toimintatuotot (ml. vuokrat)']
  ], 'Toimintatuotot'),
  opetus: renderEducation,
  ostolaskut: renderInvoices,
  toimittajat: renderSuppliers,
  yhteiset: renderShared
});

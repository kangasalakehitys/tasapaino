// Builds the comparison data of the Tasapaino service (spec:
// backend/md/api/finance_compiler.md "Vertailujoukko ja parhaat kunnat") from
// backend/output/<kunta>/tasapaino.json and backend/data/tax/tuloverot.json:
//   backend/data/tasapaino/vertailu.json
//     indicators    id -> { label, unit, better }
//     municipalities[{ slug, name, code, population, sizeClass, values.<year>.<id> }]
//     averages      { country, classes.<sizeClass> } .<year>.<id>   (unweighted means)
//     ranking       <sizeClass> -> [{ slug, name, score, parts }]   best first
// Usage: node backend/functions/compare-set.mjs

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { saveData } from './data-files.mjs';
import { backendRoot } from './lib/tutkihallintoa.mjs';

// brand_overview.md "New municipality category".
export const SIZE_CLASSES = [
  ['alle 2 000 asukasta', 0, 1999],
  ['2 000–5 000 asukasta', 2000, 5000],
  ['5 001–10 000 asukasta', 5001, 10000],
  ['10 001–20 000 asukasta', 10001, 20000],
  ['20 001–40 000 asukasta', 20001, 40000],
  ['40 001–100 000 asukasta', 40001, 100000],
  ['yli 100 000 asukasta', 100001, Infinity]
];
const sizeClassOf = (p) => SIZE_CLASSES.find(([, lo, hi]) => p >= lo && p <= hi)?.[0] ?? null;

// better: 'high' | 'low' | null (no direction).
const EUR = '€/as';
const INDICATORS = {
  operatingIncome: { label: 'Toimintatuotot', unit: EUR, better: 'high' },
  operatingCosts: { label: 'Toimintakulut', unit: EUR, better: 'low' },
  operatingMargin: { label: 'Toimintakate', unit: EUR, better: 'high' },
  personnel: { label: 'Henkilöstökulut', unit: EUR, better: 'low' },
  services: { label: 'Palvelujen ostot', unit: EUR, better: 'low' },
  materials: { label: 'Aineet, tarvikkeet ja tavarat', unit: EUR, better: 'low' },
  grants: { label: 'Avustukset', unit: EUR, better: 'low' },
  otherCosts: { label: 'Muut toimintakulut', unit: EUR, better: 'low' },
  feeIncome: { label: 'Maksutuotot', unit: EUR, better: 'high' },
  salesIncome: { label: 'Myyntituotot', unit: EUR, better: 'high' },
  rentIncome: { label: 'Vuokratuotot', unit: EUR, better: 'high' },
  taxes: { label: 'Verotulot', unit: EUR, better: 'high' },
  municipalTax: { label: 'Kunnallisvero', unit: EUR, better: 'high' },
  propertyTax: { label: 'Kiinteistövero', unit: EUR, better: 'high' },
  corporateTax: { label: 'Yhteisövero', unit: EUR, better: 'high' },
  stateAid: { label: 'Valtionosuudet', unit: EUR, better: null },
  interestCosts: { label: 'Korkokulut', unit: EUR, better: 'low' },
  annualMargin: { label: 'Vuosikate', unit: EUR, better: 'high' },
  depreciation: { label: 'Poistot ja arvonalentumiset', unit: EUR, better: null },
  surplus: { label: 'Tilikauden ylijäämä (alijäämä)', unit: EUR, better: 'high' },
  investments: { label: 'Investointimenot', unit: EUR, better: null },
  loans: { label: 'Lainakanta', unit: EUR, better: 'low' },
  accumulatedSurplus: { label: 'Kertynyt ylijäämä (alijäämä)', unit: EUR, better: 'high' },
  cash: { label: 'Rahavarat', unit: EUR, better: 'high' },
  marginToDepreciation: { label: 'Vuosikate / poistot', unit: '%', better: 'high' },
  incomeToCosts: { label: 'Toimintatuotot / toimintakulut', unit: '%', better: 'high' },
  cashflow: { label: 'Toiminnan ja investointien rahavirta', unit: EUR, better: 'high' },
  disposals: { label: 'Käyttöomaisuuden luovutustulot', unit: EUR, better: null },
  cashflowExDisposals: { label: 'Toiminnan ja investointien rahavirta ilman luovutustuloja', unit: EUR, better: 'high' },
  groupAnnualMargin: { label: 'Konsernin vuosikate', unit: EUR, better: 'high' },
  groupLoans: { label: 'Konsernin lainakanta', unit: EUR, better: 'low' },
  groupAccumulated: { label: 'Konsernin kertynyt ylijäämä (alijäämä)', unit: EUR, better: 'high' },
  groupCashflow: { label: 'Konsernin toiminnan ja investointien rahavirta', unit: EUR, better: 'high' },
  nominalTaxRate: { label: 'Tuloveroprosentti (nimellinen)', unit: '%', better: null },
  propertyRateGeneral: { label: 'Yleinen (rakennuksen) kiinteistöveroprosentti', unit: '%', better: null },
  propertyRateResidential: { label: 'Vakituisen asunnon kiinteistöveroprosentti', unit: '%', better: null },
  effectiveTaxRate: { label: 'Efektiivinen veroaste', unit: '%', better: null },
  effectiveToNominal: { label: 'Efektiivisen ja nimellisen veroasteen suhde', unit: '%', better: 'high' },
  earnedIncome: { label: 'Veronalaiset ansiotulot', unit: EUR, better: 'high' },
  personnelYears: { label: 'Henkilötyövuodet / 1 000 asukasta', unit: 'htv', better: null },
  // TOTT costs per resident of the age cohort (pyramid.json, latest actual year).
  costPreschool: { label: 'Esiopetuksen kulut / 6-vuotias', unit: '€/ikäluokan as.', better: 'low' },
  costBasic: { label: 'Perusopetuksen kulut / 7–15-vuotias', unit: '€/ikäluokan as.', better: 'low' },
  costUpper: { label: 'Lukiokoulutuksen kulut / 16–18-vuotias', unit: '€/ikäluokan as.', better: 'low' }
};

// Financial strength score (top 3 of the size class), latest SCORE_YEARS years.
// Equal-weight mean of z-scores within the size class; 'low' parts are negated.
const SCORE_YEARS = 3;
const SCORE_PARTS = [
  { id: 'cashflow', how: 'sum', better: 'high' },
  { id: 'marginToDepreciation', how: 'mean', better: 'high' },
  { id: 'loans', how: 'latest', better: 'low' },
  { id: 'accumulatedSurplus', how: 'latest', better: 'high' },
  { id: 'groupLoans', how: 'latest', better: 'low' }
];

const round = (v, d = 1) => (v == null || !Number.isFinite(v) ? null : Math.round(v * 10 ** d) / 10 ** d);
const cell = (tables, set, table, period, row, col = 'C0010') => tables?.[set]?.[table]?.values?.[period]?.[row]?.[col] ?? null;
const add = (...xs) => (xs.some((x) => x == null) ? null : xs.reduce((s, x) => s + x, 0));
const perCohort = (cost, n) => (cost == null || !n ? null : cost / n);
const ratio = (a, b) => (a == null || !b ? null : (100 * a) / b);

// Residents of the given ages (inclusive) in the latest actual year of pyramid.json.
function cohort(pyramid, from, to) {
  const y = pyramid?.years?.find((x) => x.kind === 'actual' && x.year === pyramid.actualYear);
  if (!y) return null;
  let n = 0;
  for (let age = from; age <= to; age++) n += (y.men[age] || 0) + (y.women[age] || 0);
  return n || null;
}

function indicatorsOf(t, tax, rates, year, pyramid) {
  const a = t.annual[year];
  const pop = t.population[year] ?? t.population[Number(year) - 1];
  if (!a || !pop) return null;
  const pc = (v) => (v == null ? null : v / pop);
  const tb = t.tables;
  const cashflow = cell(tb, 'KKTR', 'k-t02', year, 'R0090');
  const disposals = cell(tb, 'KKTR', 'k-t02', year, 'R0080');
  // Kuntaliitto's yearly files (tax_rates.py); KTAS leaves the rate empty for most municipalities.
  const rate = rates?.[year];
  const nominal = rate?.income ?? null;
  const tx = tax?.[year];
  const effective = tx && tx.earnedIncome ? (100 * tx.municipalTax) / tx.earnedIncome : null;
  const v = {
    population: pop,
    marginToDepreciation: ratio(a.annualMargin, a.depreciation),
    incomeToCosts: ratio(a.operatingIncome, a.operatingCosts),
    cashflow: pc(cashflow),
    disposals: pc(disposals),
    cashflowExDisposals: pc(cashflow == null ? null : cashflow - (disposals ?? 0)),
    groupAnnualMargin: pc(cell(tb, 'KKOTR', 'kk-t01', year, 'R0130')),
    groupLoans: pc(add(cell(tb, 'KKOTR', 'kk-t03', year, 'R0700'), cell(tb, 'KKOTR', 'kk-t03', year, 'R0820'))),
    groupAccumulated: pc(add(cell(tb, 'KKOTR', 'kk-t03', year, 'R0570'), cell(tb, 'KKOTR', 'kk-t03', year, 'R0580'))),
    groupCashflow: pc(cell(tb, 'KKOTR', 'kk-t02', year, 'R0110')),
    nominalTaxRate: nominal,
    effectiveTaxRate: effective,
    effectiveToNominal: effective != null && nominal ? (100 * effective) / nominal : null,
    earnedIncome: tx ? pc(tx.earnedIncome) : null,
    propertyRateGeneral: rate?.propertyGeneral ?? null,
    propertyRateResidential: rate?.propertyResidential ?? null,
    personnelYears: pc(cell(tb, 'KTAS', 'k-t05', year, 'R0400', 'C0020')) * 1000 || null,
    costPreschool: perCohort(cell(tb, 'TOTT', 'k-t16.011', year, 'R0005'), cohort(pyramid, 6, 6)),
    costBasic: perCohort(cell(tb, 'TOTT', 'k-t16.012', year, 'R0380') ?? cell(tb, 'TOTT', 'k-t16.012', year, 'R0010'), cohort(pyramid, 7, 15)),
    costUpper: perCohort(cell(tb, 'TOTT', 'k-t16.03', year, 'R0010'), cohort(pyramid, 16, 18))
  };
  for (const id of Object.keys(INDICATORS)) if (!(id in v)) v[id] = pc(a[id]);
  return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, round(x, /Rate/.test(k) || k === 'effectiveToNominal' ? 2 : 1)]));
}

function mean(rows, year, id) {
  const xs = rows.map((r) => r.values[year]?.[id]).filter((x) => x != null);
  return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null;
}

function averages(rows, years) {
  return Object.fromEntries(years.map((y) => [y, Object.fromEntries(
    Object.keys(INDICATORS).map((id) => [id, round(mean(rows, y, id), 2)]))]));
}

function scoreClass(rows, years) {
  const recent = years.slice(-SCORE_YEARS);
  const raw = rows.map((r) => {
    const parts = {};
    for (const p of SCORE_PARTS) {
      const xs = recent.map((y) => r.values[y]?.[p.id]).filter((x) => x != null);
      if (!xs.length) { parts[p.id] = null; continue; }
      parts[p.id] = p.how === 'sum' ? xs.reduce((s, x) => s + x, 0)
        : p.how === 'mean' ? xs.reduce((s, x) => s + x, 0) / xs.length
          : r.values[recent.at(-1)]?.[p.id] ?? xs.at(-1);
    }
    return { slug: r.slug, name: r.name, parts };
  });
  const stats = Object.fromEntries(SCORE_PARTS.map((p) => {
    const xs = raw.map((r) => r.parts[p.id]).filter((x) => x != null);
    const m = xs.reduce((s, x) => s + x, 0) / xs.length;
    const sd = Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / xs.length) || 1;
    return [p.id, { m, sd }];
  }));
  return raw
    .filter((r) => SCORE_PARTS.every((p) => r.parts[p.id] != null))
    .map((r) => {
      const z = SCORE_PARTS.map((p) => ((r.parts[p.id] - stats[p.id].m) / stats[p.id].sd) * (p.better === 'low' ? -1 : 1));
      return { ...r, score: round(z.reduce((s, x) => s + x, 0) / z.length, 3),
        parts: Object.fromEntries(Object.entries(r.parts).map(([k, x]) => [k, round(x, 1)])) };
    })
    .sort((a, b) => b.score - a.score);
}

// Service classes (KKTPP, latest year): external items per resident of every
// municipality and the means of the size classes and the whole country.
const CLASS_ITEMS = ['operating-income', 'sales', 'fees', 'subsidies', 'other-income', 'operating-costs',
  'personnel', 'customer-services', 'other-services', 'materials', 'grants', 'other-costs'];

async function serviceClasses(rows) {
  const meta = JSON.parse(await readFile(join(backendRoot, 'data', 'finance', 'kktpp-classes.json'), 'utf8'));
  const labels = JSON.parse(await readFile(join(backendRoot, 'data', 'finance', 'kktpp-datapoints.json'), 'utf8')).items;
  const codes = meta.classes.map((c) => c.code);
  const per = [];
  for (const r of rows) {
    let f;
    try {
      f = JSON.parse(await readFile(join(backendRoot, 'output', r.slug, 'finance-pl.json'), 'utf8'));
    } catch { continue; }
    const y = f.years.find((x) => x.year === meta.year);
    const pop = y?.population;
    if (!pop) continue;
    const values = {};
    for (const code of ['x0', ...codes]) {
      const c = y.classes[code];
      if (!c) continue;
      values[code] = Object.fromEntries(CLASS_ITEMS.map((i) => [i, c[i] == null ? null : round(c[i] / pop, 1)]));
    }
    per.push({ slug: r.slug, name: r.name, sizeClass: r.sizeClass, values });
  }
  const meanOf = (list) => Object.fromEntries(['x0', ...codes].map((code) => [code, Object.fromEntries(CLASS_ITEMS.map((i) => {
    // A municipality without the class counts as zero, as in the published sums.
    const xs = list.map((m) => m.values[code]?.[i] ?? 0);
    return [i, xs.length ? round(xs.reduce((a, b) => a + b, 0) / xs.length, 1) : null];
  }))]));
  return {
    year: meta.year, source: 'Valtiokonttori, KKTPP (ulkoiset erät)',
    classes: meta.classes.map(({ code, name, rank }) => ({ code, name, rank })),
    items: Object.fromEntries(CLASS_ITEMS.map((i) => [i, labels[i]])),
    // Background points of the dot plots: costs and income only. Selected
    // municipalities are read in full from their own finance-pl.json.
    municipalities: per.map((m) => ({ slug: m.slug, name: m.name, sizeClass: m.sizeClass,
      costs: Object.fromEntries(Object.entries(m.values).map(([c, v]) => [c, v['operating-costs']])),
      income: Object.fromEntries(Object.entries(m.values).map(([c, v]) => [c, v['operating-income']])) })),
    averages: {
      country: meanOf(per),
      classes: Object.fromEntries(SIZE_CLASSES.map(([name]) => [name, meanOf(per.filter((m) => m.sizeClass === name))]))
    }
  };
}

async function main() {
  const tax = JSON.parse(await readFile(join(backendRoot, 'data', 'tax', 'tuloverot.json'), 'utf8'));
  const rates = JSON.parse(await readFile(join(backendRoot, 'data', 'tax', 'veroprosentit.json'), 'utf8'));
  const rows = [];
  const yearSet = new Set();
  for (const entry of await readdir(join(backendRoot, 'output'), { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    let t;
    try {
      t = JSON.parse(await readFile(join(backendRoot, 'output', entry.name, 'tasapaino.json'), 'utf8'));
    } catch { continue; }
    let pyramid = null;
    try {
      pyramid = JSON.parse(await readFile(join(backendRoot, 'output', entry.name, 'pyramid.json'), 'utf8'));
    } catch { /* no age data */ }
    const values = {};
    for (const year of Object.keys(t.annual)) {
      const v = indicatorsOf(t, tax.municipalities[t.code], rates.municipalities[t.code], year, pyramid);
      if (v) { values[year] = v; yearSet.add(year); }
    }
    const years = Object.keys(values).sort();
    if (!years.length) continue;
    const population = values[years.at(-1)].population;
    rows.push({ slug: entry.name, name: t.name, code: t.code, population, sizeClass: sizeClassOf(population), values });
  }
  const years = [...yearSet].sort();
  const classes = Object.fromEntries(SIZE_CLASSES.map(([name]) => [name, rows.filter((r) => r.sizeClass === name)]));
  await saveData(backendRoot, 'data/tasapaino/vertailu.json', {
    updated: new Date().toISOString(),
    source: 'Valtiokonttori (KKNR, KKTR, KKOTR, KTAS), Verohallinto, Kuntaliitto, Tilastokeskus',
    years, latestYear: years.at(-1),
    sizeClasses: SIZE_CLASSES.map(([name, lo, hi]) => ({ name, min: lo, max: Number.isFinite(hi) ? hi : null, count: classes[name].length })),
    indicators: INDICATORS,
    score: { years: years.slice(-SCORE_YEARS), parts: SCORE_PARTS },
    municipalities: rows.sort((a, b) => a.name.localeCompare(b.name, 'fi')),
    averages: {
      country: averages(rows, years),
      classes: Object.fromEntries(Object.entries(classes).map(([name, rs]) => [name, averages(rs, years)]))
    },
    ranking: Object.fromEntries(Object.entries(classes).map(([name, rs]) => [name, scoreClass(rs, years)]))
  }, { compact: true });
  const pl = await serviceClasses(rows);
  await saveData(backendRoot, 'data/tasapaino/palveluluokat.json', { updated: new Date().toISOString(), ...pl }, { compact: true });
  console.log(`Palveluluokat ${pl.year}: ${pl.municipalities.length} kuntaa, ${pl.classes.length} luokkaa.`);
  const k = rows.find((r) => r.slug === 'kangasala');
  const rank = scoreClass(classes[k.sizeClass], years);
  console.log(`${rows.length} kuntaa, vuodet ${years.join(', ')}. ${k.name}: ${k.sizeClass} (${classes[k.sizeClass].length} kuntaa).`);
  console.log('Parhaat:', rank.slice(0, 5).map((r) => `${r.name} ${r.score}`).join(', '));
  console.log(`${k.name} sijalla ${rank.findIndex((r) => r.slug === 'kangasala') + 1}/${rank.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

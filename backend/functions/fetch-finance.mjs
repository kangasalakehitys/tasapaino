// Fetches the quarterly finance figures of the Talous-Q page from the State
// Treasury's municipal finance API (spec: backend/md/pages/finance.md, api:
// backend/md/api/api.md) for the municipalities listed in
// backend/data/finance/ytunnukset.json, and writes
//   backend/output/<kunta>/finance.json
//     quarterly, budget   surplus (deficit) for the period: KKNR (cumulative) + KTAS budget
//     series.<id>         the other figures in the same shape (see METRICS)
// Usage: node backend/functions/fetch-finance.mjs

import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { saveData } from './data-files.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const API = 'https://prodkuntarest.westeurope.cloudapp.azure.com/rest/v1/json';
const KKNR = 'KKNR';
const KTAS = 'KTAS';
// Datapoint ids of the Kuntatalous taxonomy (table models in hkt20260602.zip,
// avoindata.fi). KKNR: whole municipality, external items (column x01), income
// statement k-t07 cumulative from the start of the year, balance sheet k-t09 at
// the end of the quarter; periods 2026C03, 2026C06... The ids are the same in
// every taxonomy version since 2021. KTAS: budget of the reporting year (C0020).
// "Tilikauden ylijäämä (alijäämä)" (KKNR 1447, KTAS 1098) is the top-level series.
const SURPLUS = { kknr: ['1447'], ktas: '1098' };
// kknr: ids summed together; stock: a balance-sheet item, not cumulative.
const METRICS = {
  'operating-income': { kknr: ['3319283'], ktas: '16' }, // Toimintatuotot
  'operating-costs': { kknr: ['3418067'], ktas: '632' }, // Toimintakulut
  personnel: { kknr: ['1562'], ktas: '473' }, // 4000-4299 Henkilöstökulut
  services: { kknr: ['699'], ktas: '15' }, // 4300-4499 Palvelujen ostot
  materials: { kknr: ['683'], ktas: '4' }, // 4500-4699 Aineet, tarvikkeet ja tavarat
  grants: { kknr: ['3432179'], ktas: '627' }, // 4700-4799 Avustukset
  'other-costs': { kknr: ['3446291'], ktas: '561' }, // 4800-4995 Muut toimintakulut
  // Toimintakate; not in the 2021 taxonomy, derived below when missing.
  'operating-margin': { kknr: ['5752390'], ktas: '545' },
  taxes: { kknr: ['3460403'], ktas: '584' }, // 5000-5499 Verotulot
  'municipal-tax': { kknr: ['3474515'] }, // 5000 Kunnan tulovero
  'property-tax': { kknr: ['94279'] }, // 5100 Kiinteistövero
  'corporate-tax': { kknr: ['3502739'] }, // 5200 Osuus yhteisöveron tuotosta
  'state-aid': { kknr: ['3530963'], ktas: '1157' }, // 5500-5899 Valtionosuudet
  interest: { kknr: ['556'] }, // 6200-6299 Korkokulut
  // Lainakanta = pitkäaikainen + lyhytaikainen korollinen vieras pääoma
  // (joukkovelkakirjalainat, lainat rahoitus- ja vakuutuslaitoksilta,
  // julkisyhteisöiltä ja muilta luotonantajilta).
  loans: { kknr: ['4362557', '4363646'], ktas: '1580', stock: true }
};
// Parts of the derived operating margin: income + change in inventories +
// production for own use - costs.
const MARGIN_PARTS = { income: '3319283', inventories: '1139', ownUse: '1599', costs: '3418067' };
// A later approval stage replaces an earlier one.
const STAGES = { Alustava: 0, Lopullinen: 1, 'Jälkikorjattu': 2 };
const CONCURRENCY = 6;
const RETRIES = 3;

// Retries transient errors, since one full run makes thousands of requests.
async function getJson(url) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
      return await res.json();
    } catch (err) {
      if (attempt >= RETRIES) throw err;
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
}

// Latest approval stage of each (report, y-tunnus, period).
function latestDocuments(list, ytunnukset) {
  const best = new Map();
  for (const d of list) {
    if (!ytunnukset.has(d.ytunnus) || ![KKNR, KTAS].includes(d.raportointikokonaisuus)) continue;
    const key = `${d.raportointikokonaisuus}|${d.ytunnus}|${d.raportointikausi}`;
    const prev = best.get(key);
    if (!prev || STAGES[d.hyvaksymisvaihe] > STAGES[prev.hyvaksymisvaihe]) best.set(key, d);
  }
  return [...best.values()];
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

// '2026C06' -> '2026Q2'
const quarterPeriod = (kausi) => `${kausi.slice(0, 4)}Q${Number(kausi.slice(5)) / 3}`;

// Sum of the ids that are present, or null when none of them is.
function sumOf(values, ids) {
  const present = ids.filter((id) => values.has(id));
  return present.length ? present.reduce((sum, id) => sum + values.get(id), 0) : null;
}

// All figures of one document: { surplus, <metric id>: value | null }.
function extract(report, rows) {
  const values = new Map(rows.map((r) => [r.tunnusluku, Number(r.arvo)]));
  const pick = (m) => (report === KKNR ? sumOf(values, m.kknr) : m.ktas ? sumOf(values, [m.ktas]) : null);
  const out = { surplus: pick(SURPLUS) };
  for (const [id, m] of Object.entries(METRICS)) out[id] = pick(m);
  if (report === KKNR && out['operating-margin'] == null &&
    values.has(MARGIN_PARTS.income) && values.has(MARGIN_PARTS.costs)) {
    const v = (id) => values.get(id) ?? 0;
    out['operating-margin'] =
      v(MARGIN_PARTS.income) + v(MARGIN_PARTS.inventories) + v(MARGIN_PARTS.ownUse) - v(MARGIN_PARTS.costs);
  }
  return out;
}

// Interest costs per loans, %: the year-to-date interest costs as an annual
// rate, divided by the loans at the end of the quarter.
function interestRate(interest, loans) {
  const loanBy = new Map(loans.map((l) => [l.period, l.value]));
  return interest
    .filter((i) => loanBy.get(i.period) > 0)
    .map((i) => {
      const quarter = Number(i.period.slice(5));
      const rate = ((i.value / quarter) * 4 / loanBy.get(i.period)) * 100;
      return { period: i.period, value: Math.round(rate * 1000) / 1000 };
    });
}

async function main() {
  const list = JSON.parse(await readFile(join(root, 'data', 'finance', 'ytunnukset.json'), 'utf8'));
  const unknown = list.filter((m) => !m.ytunnus);
  if (unknown.length) console.warn(`Varoitus: y-tunnus puuttuu (${unknown.length}): ${unknown.map((m) => m.name).join(', ')}`);
  const municipalities = list.filter((m) => m.ytunnus);
  const ytunnukset = new Set(municipalities.map((m) => m.ytunnus));

  console.log('Haetaan aineistolista (Valtiokonttori, kuntatalous)...');
  const { aineistot } = await getJson(`${API}/aineistot`);
  const docs = latestDocuments(aineistot, ytunnukset);

  console.log(`Haetaan ${docs.length} dokumenttia (KKNR, KTAS)...`);
  let done = 0;
  const values = await mapLimit(docs, CONCURRENCY, async (d) => {
    if (++done % 500 === 0) console.log(`  ${done}/${docs.length}`);
    let rows;
    try {
      rows = await getJson(d.tunnusluvut);
    } catch (err) {
      console.warn(`Varoitus: ${d.raportointikokonaisuus} ${d.ytunnus} ${d.raportointikausi}: ${err.message}`);
      return { doc: d, value: {} };
    }
    const value = extract(d.raportointikokonaisuus, rows);
    if (value.surplus == null) {
      console.warn(`Varoitus: ${d.raportointikokonaisuus} ${d.ytunnus} ${d.raportointikausi}: tilikauden ylijäämää ei löytynyt`);
    }
    return { doc: d, value };
  });

  const updated = new Date().toISOString();
  for (const m of municipalities) {
    const own = values.filter((v) => v.doc.ytunnus === m.ytunnus);
    const kknr = own
      .filter((v) => v.doc.raportointikokonaisuus === KKNR)
      .map((v) => ({ period: quarterPeriod(v.doc.raportointikausi), stage: v.doc.hyvaksymisvaihe, value: v.value }))
      .sort((a, b) => a.period.localeCompare(b.period));
    const ktas = own
      .filter((v) => v.doc.raportointikokonaisuus === KTAS)
      .map((v) => ({ year: Number(v.doc.raportointikausi), value: v.value }))
      .sort((a, b) => a.year - b.year);
    const quarterlyOf = (id) => kknr.filter((q) => q.value[id] != null).map((q) => ({ period: q.period, value: q.value[id] }));
    const budgetOf = (id) => ktas.filter((b) => b.value[id] != null).map((b) => ({ year: b.year, value: b.value[id] }));

    const quarterly = kknr
      .filter((q) => q.value.surplus != null)
      .map((q) => ({ period: q.period, value: q.value.surplus, stage: q.stage }));
    if (!quarterly.length) {
      console.warn(`Varoitus: kunnalta ${m.name} (${m.ytunnus}) ei löytynyt KKNR-tietoja`);
      continue;
    }
    const series = {};
    for (const [id, metric] of Object.entries(METRICS)) {
      series[id] = { quarterly: quarterlyOf(id), budget: budgetOf(id), ...(metric.stock ? { stock: true } : {}) };
    }
    series['interest-rate'] = {
      quarterly: interestRate(series.interest.quarterly, series.loans.quarterly),
      budget: [],
      stock: true
    };
    await saveData(root, `output/${m.slug}/finance.json`, {
      code: m.code, name: m.name, ytunnus: m.ytunnus, updated, source: 'KKNR, KTAS',
      quarterly, budget: budgetOf('surplus'), series
    });
    console.log(`${m.name}: ${quarterly[0].period}–${quarterly.at(-1).period}, talousarviot ${ktas.map((b) => b.year).join(', ')}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

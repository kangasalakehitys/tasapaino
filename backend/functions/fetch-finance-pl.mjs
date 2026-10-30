// Fetches the service-class accounts of the TalousPL page from the State
// Treasury's municipal finance API (spec: backend/md/pages/finance_pl.md, api:
// backend/md/api/api.md): "Kunnan ja kuntayhtymien tilinpäätöstiedot
// palveluluokkakohtaisesti" (KKTPP), income statement k-t08, external items
// (column x01). Datapoint ids per service class: backend/data/finance/kktpp-datapoints.json.
// Writes
//   backend/output/<kunta>/finance-pl.json          the latest YEARS years, the TOP_CLASSES
//                                                   largest classes and the whole municipality
//   backend/data/finance/kktpp-external-costs.json  external operating costs of every
//                                                   municipality by service class, latest year
//   backend/data/finance/kktpp-classes.json         the TOP_CLASSES largest classes (external
//                                                   operating costs of all municipalities, latest
//                                                   year); one tab each (build-finance-pl-page.mjs)
// Usage: node backend/functions/fetch-finance-pl.mjs

import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { saveData } from './data-files.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const API = 'https://prodkuntarest.westeurope.cloudapp.azure.com/rest/v1/json';
const KKTPP = 'KKTPP';
// Latest years fetched for the yearly comparison. The service classes of
// 2021-2022 follow an older taxonomy (social and health care before the 2023
// reform), so the classes are comparable from 2023 on.
const YEARS = 3;
// Largest service classes: two dot plots of 20 and one tab each.
const TOP_CLASSES = 40;
// Whole municipality ("Kaikki palvelu- ja tehtäväluokat").
const TOTAL = 'x0';
// Service classes of the comparison (the list in backend/md/api/finance_compiler.md).
// x7202 and x7220 are rescue services and social and health care, which moved
// to the wellbeing services counties in 2023; x5560 and x5569 are sums.
const COMPARISON_CLASSES = [
  'x1101', 'x1102', 'x1120', 'x2701', 'x2702', 'x2703', 'x2705', 'x2706',
  'x3021', 'x3022', 'x3023', 'x3041', 'x3051', 'x3052', 'x3101', 'x3151', 'x3152',
  'x3251', 'x3252', 'x3351', 'x3352', 'x3451', 'x3452', 'x3453', 'x3455',
  'x3501', 'x3502', 'x3503', 'x3551', 'x3601', 'x3701', 'x3702', 'x3751', 'x3851', 'x3901',
  'x4101', 'x4102', 'x4104', 'x4105', 'x4201', 'x4301', 'x4302', 'x4401', 'x4402',
  'x4601', 'x4602', 'x4701', 'x5351', 'x5352', 'x5353', 'x5361', 'x5501', 'x5551',
  'x5560', 'x5569', 'x6101', 'x6102', 'x6103', 'x6104', 'x6105', 'x6201', 'x6251',
  'x6252', 'x6301', 'x6601', 'x6901', 'x7101', 'x7202', 'x7220'
];
// A later approval stage replaces an earlier one.
const STAGES = { Alustava: 0, Lopullinen: 1, 'Jälkikorjattu': 2 };
const CONCURRENCY = 6;
const RETRIES = 3;

// Retries transient errors; one document is about 8 MB.
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

// Latest approval stage of each (y-tunnus, year) of the given years.
function latestDocuments(list, ytunnukset, years) {
  const best = new Map();
  for (const d of list) {
    if (d.raportointikokonaisuus !== KKTPP || !ytunnukset.has(d.ytunnus) || !years.includes(Number(d.raportointikausi))) continue;
    const key = `${d.ytunnus}|${d.raportointikausi}`;
    const prev = best.get(key);
    if (!prev || STAGES[d.hyvaksymisvaihe] > STAGES[prev.hyvaksymisvaihe]) best.set(key, d);
  }
  return [...best.values()];
}

// Tab id of a class: 'Päiväkotitoiminta' -> 'paivakotitoiminta'.
function slugify(name) {
  return name.toLowerCase()
    .replace(/[åä]/g, 'a').replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Population at the end of the year, or the latest earlier year available.
async function populationOf(slug) {
  try {
    const { yearly } = JSON.parse(await readFile(join(root, 'output', slug, 'population.json'), 'utf8'));
    return (year) => (yearly.find((r) => r.year === year) || yearly.filter((r) => r.year < year).at(-1))?.value ?? null;
  } catch {
    return () => null;
  }
}

async function main() {
  const datapoints = JSON.parse(await readFile(join(root, 'data', 'finance', 'kktpp-datapoints.json'), 'utf8'));
  const list = JSON.parse(await readFile(join(root, 'data', 'finance', 'ytunnukset.json'), 'utf8'));
  const municipalities = list.filter((m) => m.ytunnus);
  const ytunnukset = new Set(municipalities.map((m) => m.ytunnus));
  const itemIds = Object.keys(datapoints.items);

  console.log('Haetaan aineistolista (Valtiokonttori, kuntatalous)...');
  const { aineistot } = await getJson(`${API}/aineistot`);
  const allYears = [...new Set(aineistot.filter((d) => d.raportointikokonaisuus === KKTPP).map((d) => Number(d.raportointikausi)))]
    .sort((a, b) => a - b);
  const years = allYears.slice(-YEARS);
  const docs = latestDocuments(aineistot, ytunnukset, years);

  console.log(`Haetaan ${docs.length} KKTPP-dokumenttia (${years.join(', ')})...`);
  let done = 0;
  // Only the needed figures are kept from each document.
  const values = await mapLimit(docs, CONCURRENCY, async (d) => {
    if (++done % 50 === 0) console.log(`  ${done}/${docs.length}`);
    let rows;
    try {
      rows = await getJson(d.tunnusluvut);
    } catch (err) {
      console.warn(`Varoitus: ${d.ytunnus} ${d.raportointikausi}: ${err.message}`);
      return null;
    }
    const byId = new Map(rows.filter((r) => r.osakokonaisuus === 'k-t08').map((r) => [r.tunnusluku, Number(r.arvo)]));
    const pick = (code, item) => byId.get(datapoints.classes[code].items[item]) ?? null;
    const classes = {};
    for (const code of [TOTAL, ...COMPARISON_CLASSES]) {
      classes[code] = Object.fromEntries(itemIds.map((item) => [item, pick(code, item)]));
    }
    const external = Object.fromEntries(COMPARISON_CLASSES.map((code) => [code, pick(code, 'operating-costs') ?? 0]));
    const total = pick(TOTAL, 'operating-costs');
    // The comparison classes are the published level (sub-classes are partly
    // left out for data protection), so they add up to the whole.
    const classSum = Object.values(external).reduce((sum, v) => sum + v, 0);
    // Only the latest year: earlier years have partly other class codes.
    if (Number(d.raportointikausi) === years.at(-1) && total && Math.abs(classSum - total) / Math.abs(total) > 0.01) {
      console.warn(`Varoitus: ${d.ytunnus} ${d.raportointikausi}: palveluluokkien toimintakulut ${Math.round(classSum)} ≠ yhteensä ${Math.round(total)}`);
    }
    return { ytunnus: d.ytunnus, year: Number(d.raportointikausi), stage: d.hyvaksymisvaihe, classes, external };
  });

  const updated = new Date().toISOString();
  const latestYear = years.at(-1);
  // The largest classes by the external operating costs of all municipalities.
  const national = Object.fromEntries(COMPARISON_CLASSES.map((code) => [code, values
    .filter((v) => v?.year === latestYear)
    .reduce((sum, v) => sum + v.external[code], 0)]));
  const top = [...COMPARISON_CLASSES].sort((a, b) => national[b] - national[a]).slice(0, TOP_CLASSES);
  await saveData(root, 'data/finance/kktpp-classes.json', {
    year: latestYear, updated, source: KKTPP,
    classes: top.map((code, i) => ({
      code, rank: i + 1, name: datapoints.classes[code].name, slug: slugify(datapoints.classes[code].name), total: national[code]
    }))
  });
  const comparison = [];
  for (const m of municipalities) {
    const own = values.filter((v) => v && v.ytunnus === m.ytunnus).sort((a, b) => a.year - b.year);
    if (!own.length) {
      console.warn(`Varoitus: kunnalta ${m.name} (${m.ytunnus}) ei löytynyt KKTPP-tietoja`);
      continue;
    }
    const population = await populationOf(m.slug);
    await saveData(root, `output/${m.slug}/finance-pl.json`, {
      code: m.code, name: m.name, ytunnus: m.ytunnus, updated, source: KKTPP,
      years: own.map((v) => ({
        year: v.year, stage: v.stage, population: population(v.year),
        classes: Object.fromEntries([TOTAL, ...top].map((code) => [code, v.classes[code]]))
      }))
    });
    const latest = own.find((v) => v.year === latestYear);
    if (latest) {
      comparison.push({ code: m.code, slug: m.slug, name: m.name, population: population(latestYear), values: latest.external });
    }
  }

  await saveData(root, 'data/finance/kktpp-external-costs.json', {
    year: latestYear, updated, source: KKTPP,
    classes: COMPARISON_CLASSES.map((code) => ({ code, name: datapoints.classes[code].name })),
    municipalities: comparison
  });
  console.log(`KKTPP ${years.join(', ')}: ${comparison.length} kuntaa vertailussa vuodelta ${latestYear}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

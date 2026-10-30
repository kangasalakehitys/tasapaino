// Fetches the yearly finance data of the Tasapaino service from the State
// Treasury API (spec: backend/md/api/api.md, finance_compiler.md) for every
// municipality in backend/data/finance/ytunnukset.json and writes
//   backend/output/<kunta>/tasapaino.json
//     annual.<year>.<metric>      KKNR year-end figures (lib/metrics.mjs)
//     current { period, values }  latest KKNR period of the running year (cumulative)
//     tables.<SET>.<table>        KKTR, KKOTR, KTAS, KTPE and TOTT tables with labels:
//                                 { title, columns, rows[{ code, label }], values.<period>.<row>.<col> }
//     population.<year>           population at the end of the year
// Raw documents are cached in backend/data/raw (git-ignored), so a rerun only
// fetches new documents.
// Usage: node backend/functions/fetch-tasapaino.mjs [--kunta kangasala,nokia,ylojarvi]

import { saveData } from './data-files.mjs';
import {
  backendRoot, loadAineistot, latestDocuments, loadDocument, loadDatapoints,
  loadMunicipalityIds, loadPopulationByYear, mapLimit
} from './lib/tutkihallintoa.mjs';
import { KKNR_METRICS, TABLE_SETS } from './lib/metrics.mjs';

const FIRST_YEAR = 2021;
// TOTT is only needed for the latest years.
const TOTT_YEARS = 3;
const CONCURRENCY = 6;

const arg = process.argv.indexOf('--kunta');
const only = arg > 0 ? new Set(process.argv[arg + 1].split(',')) : null;

function sumOf(values, ids) {
  const present = ids.filter((id) => values.has(id));
  return present.length ? present.reduce((sum, id) => sum + values.get(id), 0) : null;
}

const kknrValues = (values) =>
  Object.fromEntries(Object.entries(KKNR_METRICS).map(([key, ids]) => [key, sumOf(values, ids)]));

// '2026C06' -> '2026Q2'
const quarterOf = (kausi) => `${kausi.slice(0, 4)}Q${Number(kausi.slice(5)) / 3}`;

async function main() {
  const municipalities = (await loadMunicipalityIds()).filter((m) => !only || only.has(m.slug));
  const ytunnukset = new Set(municipalities.map((m) => m.ytunnus));
  const aineistot = await loadAineistot();

  const yearsOf = (set) => [...new Set(aineistot.filter((d) => d.raportointikokonaisuus === set)
    .map((d) => Number(d.raportointikausi.slice(0, 4))))].sort((a, b) => a - b);
  const tottYears = new Set(yearsOf('TOTT').slice(-TOTT_YEARS));
  const latestKknrYear = yearsOf('KKNR').at(-1);

  const sets = ['KKNR', ...Object.keys(TABLE_SETS)];
  const docs = latestDocuments(aineistot, {
    sets,
    ytunnukset,
    periods: (set, kausi) => {
      const year = Number(kausi.slice(0, 4));
      if (year < FIRST_YEAR) return false;
      if (set === 'TOTT') return tottYears.has(year);
      // KKNR: year-end periods and the running year.
      if (set === 'KKNR') return kausi.endsWith('C12') || year === latestKknrYear;
      return true;
    }
  });
  // Only the latest KKNR period of the running year is needed.
  const running = new Map();
  for (const d of docs.filter((d) => d.raportointikokonaisuus === 'KKNR' && Number(d.raportointikausi.slice(0, 4)) === latestKknrYear)) {
    const prev = running.get(d.ytunnus);
    if (!prev || d.raportointikausi > prev.raportointikausi) running.set(d.ytunnus, d);
  }
  const wanted = docs.filter((d) => d.raportointikokonaisuus !== 'KKNR' ||
    d.raportointikausi.endsWith('C12') || running.get(d.ytunnus) === d);

  const models = Object.fromEntries(await Promise.all(Object.keys(TABLE_SETS)
    .map(async (set) => [set, await loadDatapoints(set)])));

  console.log(`Haetaan ${wanted.length} dokumenttia (${sets.join(', ')}), ${municipalities.length} kuntaa...`);
  let done = 0;
  const loaded = await mapLimit(wanted, CONCURRENCY, async (d) => {
    if (++done % 250 === 0) console.log(`  ${done}/${wanted.length}`);
    try {
      return { doc: d, values: await loadDocument(d) };
    } catch (err) {
      console.warn(`Varoitus: ${d.raportointikokonaisuus} ${d.ytunnus} ${d.raportointikausi}: ${err.message}`);
      return null;
    }
  });

  const updated = new Date().toISOString();
  for (const m of municipalities) {
    const own = loaded.filter((x) => x && x.doc.ytunnus === m.ytunnus);
    const annual = {};
    let current = null;
    for (const { doc, values } of own.filter((x) => x.doc.raportointikokonaisuus === 'KKNR')) {
      const kausi = doc.raportointikausi;
      if (kausi.endsWith('C12')) annual[kausi.slice(0, 4)] = { stage: doc.hyvaksymisvaihe, ...kknrValues(values) };
      if (running.get(m.ytunnus) === doc && !kausi.endsWith('C12')) {
        current = { period: quarterOf(kausi), stage: doc.hyvaksymisvaihe, values: kknrValues(values) };
      }
    }
    const tables = {};
    for (const [set, tableIds] of Object.entries(TABLE_SETS)) {
      const setDocs = own.filter((x) => x.doc.raportointikokonaisuus === set);
      if (!setDocs.length) continue;
      tables[set] = {};
      for (const t of tableIds) {
        const model = models[set].tables[t];
        if (!model) continue;
        const values = {};
        for (const { doc, values: v } of setDocs) {
          const byRow = {};
          for (const row of model.rows) {
            const cols = {};
            for (const [col, id] of Object.entries(row.ids)) if (v.has(id)) cols[col] = v.get(id);
            if (Object.keys(cols).length) byRow[row.code] = cols;
          }
          if (Object.keys(byRow).length) values[doc.raportointikausi] = byRow;
        }
        tables[set][t] = {
          title: model.title, columns: model.columns,
          rows: model.rows.map((r) => ({ code: r.code, label: r.label })), values
        };
      }
    }
    if (!Object.keys(annual).length) {
      console.warn(`Varoitus: kunnalta ${m.name} (${m.ytunnus}) ei löytynyt KKNR-tilinpäätöstietoja`);
      continue;
    }
    await saveData(backendRoot, `output/${m.slug}/tasapaino.json`, {
      code: m.code, name: m.name, ytunnus: m.ytunnus, updated,
      source: 'Valtiokonttori, kuntien taloustietopalvelu: KKNR, KKTR, KKOTR, KTAS, KTPE, TOTT',
      population: await loadPopulationByYear(m.slug),
      annual, current, tables
    });
  }
  console.log(`Valmis: ${municipalities.length} kuntaa.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

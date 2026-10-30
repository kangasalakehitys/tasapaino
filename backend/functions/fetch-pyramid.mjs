// Fetches the population pyramid for all municipalities from StatFin
// (spec: backend/md/pages/migration.md, tab Väestöpyramidi) and writes
//   backend/output/<kunta>/pyramid.json   latest actual year (11re) + projection years (14wx)
// Usage: node backend/functions/fetch-pyramid.mjs

import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PXWEB_BASE, PYRAMID_TABLES, fetchInBatches, areaCode } from '../../frontend/functions/pxweb.js';
import { pyramidByArea, completeYears } from '../../frontend/functions/pyramid-series.js';
import { saveData } from './data-files.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const save = (path, data) => saveData(root, path, data);

async function timeValues(table) {
  const meta = await (await fetch(`${PXWEB_BASE}/${table.path}`)).json();
  return meta.variables.find((v) => v.code === table.time).values;
}

// Fetches `table` for the given years in area batches.
async function fetchYears(table, years) {
  const t = { ...table, fixed: { ...table.fixed, [table.time]: years.map(String) } };
  const out = {};
  await fetchInBatches(t, '*', (json) => Object.assign(out, pyramidByArea(json, t.area, t.time)));
  return out;
}

async function main() {
  // Municipality list from fetch-population.mjs (npm run fetch runs it first).
  const municipalities = JSON.parse(await readFile(join(root, 'data', 'kunnat.json'), 'utf8'));
  const areas = [...municipalities, { code: 'SSS', name: 'Koko maa', slug: 'koko-maa' }];
  const key = (m) => (m.code === 'SSS' ? 'SSS' : areaCode(m.code));

  const actualYear = Number((await timeValues(PYRAMID_TABLES.actual)).at(-1));
  console.log(`Haetaan 11re (väestö sukupuolen ja iän mukaan ${actualYear}, useassa osassa)...`);
  const actual = await fetchYears(PYRAMID_TABLES.actual, [actualYear]);

  const forecastYears = (await timeValues(PYRAMID_TABLES.forecast)).map(Number).filter((y) => y > actualYear);
  console.log(`Haetaan 14wx (väestöennuste 2024, ${forecastYears[0]}–${forecastYears.at(-1)}, useassa osassa)...`);
  const forecast = await fetchYears(PYRAMID_TABLES.forecast, forecastYears);

  const updated = new Date().toISOString();
  let count = 0;
  for (const m of areas) {
    const code = key(m);
    const a = completeYears(actual[code]).find((y) => y.year === actualYear);
    if (!a) {
      console.warn(`Ei ikärakennetta: ${m.name} (${code})`);
      continue;
    }
    // 14wx uses the 2024 municipality list, so a merged municipality may be missing.
    const f = completeYears(forecast[code]);
    if (!f.length) console.warn(`Ei väestöennustetta 14wx: ${m.name} (${code})`);
    await save(`output/${m.slug}/pyramid.json`, {
      code: m.code, name: m.name, updated, actualYear,
      source: '11re, 14wx',
      years: [{ ...a, kind: 'actual' }, ...f.map((y) => ({ ...y, kind: 'forecast' }))]
    });
    count++;
  }
  console.log(`Valmis: väestöpyramidi ${count} alueelle (${actualYear} + ennuste ${forecastYears.length} vuotta).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

// Fetches population data for all municipalities from StatFin and writes
// raw data to backend/data and per-municipality files to backend/output/<kunta>/:
//   population.json  väkiluku (11re, 11lj)
//   vital.json       births, deaths and natural increase (121w, 11lk)
//   agegroups.json   population in three age groups (11re, 11lj by age)
// Usage: node functions/fetch-population.mjs

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TABLES, VITAL_TABLES, AGE_TABLES, MUNICIPALITIES_URL, fetchTable, fetchSplitSeries, seriesByArea,
  toPopulation, toVital, toAgeGroups, parseMunicipalities, slugify, areaCode
} from '../../frontend/functions/pxweb.js';
import { saveData } from './data-files.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Raw StatFin responses are large and only needed in Node: no .js twin.
const save = (path, data) => saveData(root, path, data, { script: !path.startsWith('data/population/') });

async function main() {
  console.log('Haetaan kuntalista...');
  const res = await fetch(MUNICIPALITIES_URL);
  if (!res.ok) throw new Error(`Kuntalista: HTTP ${res.status}`);
  const municipalities = parseMunicipalities(await res.json())
    .map((m) => ({ ...m, slug: slugify(m.name) }));
  await save('data/kunnat.json', municipalities);

  console.log('Haetaan 11re (väestö vuosittain)...');
  const yearlyRaw = await fetchTable(TABLES.yearly);
  await save('data/population/11re.json', yearlyRaw);

  console.log('Haetaan 11lj (ennakkotiedot kuukausittain)...');
  const prelimRaw = await fetchTable(TABLES.preliminary);
  await save('data/population/11lj.json', prelimRaw);

  const yearly = seriesByArea(yearlyRaw, TABLES.yearly.area, TABLES.yearly.time);
  const prelim = seriesByArea(prelimRaw, TABLES.preliminary.area, TABLES.preliminary.time);
  const updated = new Date().toISOString();

  let count = 0;
  for (const m of municipalities) {
    const code = areaCode(m.code);
    if (!yearly[code]) {
      console.warn(`Ei vuositietoja: ${m.name} (${code})`);
      continue;
    }
    await save(`output/${m.slug}/population.json`, {
      code: m.code, name: m.name, updated,
      ...toPopulation(yearly[code], prelim[code])
    });
    count++;
  }
  await save('output/koko-maa/population.json', {
    code: 'SSS', name: 'Koko maa', updated,
    ...toPopulation(yearly.SSS, prelim.SSS)
  });
  console.log(`Valmis: ${count} kuntaa tallennettu kansioon output/.`);

  const areas = [...municipalities, { code: 'SSS', name: 'Koko maa', slug: 'koko-maa' }];
  await fetchVital(areas, updated);
  await fetchAgeGroups(areas, updated);
}

const areaKey = (m) => (m.code === 'SSS' ? 'SSS' : areaCode(m.code));

async function fetchVital(areas, updated) {
  console.log('Haetaan 121w (väestönmuutokset vuosittain)...');
  const yearlyRaw = await fetchTable(VITAL_TABLES.yearly);
  await save('data/population/121w.json', yearlyRaw);

  console.log('Haetaan 11lk (väestönmuutosten ennakkotiedot neljännesvuosittain)...');
  const prelimRaw = await fetchTable(VITAL_TABLES.preliminary);
  await save('data/population/11lk.json', prelimRaw);

  const { yearly: yt, preliminary: pt } = VITAL_TABLES;
  const yearly = seriesByArea(yearlyRaw, yt.area, yt.time, yt.split);
  const prelim = seriesByArea(prelimRaw, pt.area, pt.time, pt.split);
  let count = 0;
  for (const m of areas) {
    const code = areaKey(m);
    if (!yearly[code]) continue;
    await save(`output/${m.slug}/vital.json`, {
      code: m.code, name: m.name, updated, ...toVital(yearly[code], prelim[code])
    });
    count++;
  }
  console.log(`Valmis: väestönmuutokset ${count} alueelle.`);
}

// 1-year ages for every area exceed the PxWeb cell limit, so these are
// fetched in batches and only the age group sums are saved.
async function fetchAgeGroups(areas, updated) {
  console.log('Haetaan 11re iän mukaan (vuosittain, useassa osassa)...');
  const yearly = await fetchSplitSeries(AGE_TABLES.yearly);
  console.log('Haetaan 11lj iän mukaan (kuukausittain, useassa osassa)...');
  const prelim = await fetchSplitSeries(AGE_TABLES.preliminary);
  let count = 0;
  for (const m of areas) {
    const code = areaKey(m);
    if (!yearly[code]) continue;
    await save(`output/${m.slug}/agegroups.json`, {
      code: m.code, name: m.name, updated, ...toAgeGroups(yearly[code], prelim[code])
    });
    count++;
  }
  console.log(`Valmis: ikäryhmät ${count} alueelle.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

// Client for the State Treasury municipal finance API (tutkihallintoa.fi,
// spec: backend/md/api/api.md). Shared by every fetch-*.mjs script.
//
// - loadAineistot()       list of all reported documents, cached for a day in
//                         backend/data/raw/aineistot.json
// - latestDocuments()     latest approval stage of each (set, y-tunnus, period)
// - loadDocument()        one document as Map(DatapointID -> number), cached in
//                         backend/data/raw/docs/<SET>/<y-tunnus>/<period>-<stage>.json
//
// DatapointIDs are unique over the whole taxonomy, so a document can be read
// with plain ids (maps: backend/data/finance/datapoints/<SET>.json).

import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const API = 'https://prodkuntarest.westeurope.cloudapp.azure.com/rest/v1/json';
export const backendRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const rawDir = join(backendRoot, 'data', 'raw');

// A later approval stage replaces an earlier one.
export const STAGES = { Alustava: 0, Lopullinen: 1, 'Jälkikorjattu': 2 };
const RETRIES = 3;

export async function getJson(url) {
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

export async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  };
  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function writeJson(path, data) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(data), 'utf8');
}

// The document list changes when municipalities report, so it is refreshed daily.
export async function loadAineistot({ maxAgeHours = 24 } = {}) {
  const path = join(rawDir, 'aineistot.json');
  try {
    const age = (Date.now() - (await stat(path)).mtimeMs) / 3.6e6;
    if (age < maxAgeHours) return (await readJson(path)).aineistot;
  } catch { /* not cached yet */ }
  console.log('Haetaan aineistolista (Valtiokonttori, kuntatalous)...');
  const data = await getJson(`${API}/aineistot`);
  await writeJson(path, data);
  return data.aineistot;
}

// Latest approval stage of each (set, y-tunnus, period).
// `periods(set, kausi)` decides which periods are wanted.
export function latestDocuments(list, { sets, ytunnukset, periods = () => true }) {
  const best = new Map();
  for (const d of list) {
    if (!sets.includes(d.raportointikokonaisuus) || !ytunnukset.has(d.ytunnus)) continue;
    if (!periods(d.raportointikokonaisuus, d.raportointikausi)) continue;
    const key = `${d.raportointikokonaisuus}|${d.ytunnus}|${d.raportointikausi}`;
    const prev = best.get(key);
    if (!prev || STAGES[d.hyvaksymisvaihe] > STAGES[prev.hyvaksymisvaihe]) best.set(key, d);
  }
  return [...best.values()];
}

// One document as Map(DatapointID -> number). Approved documents do not
// change, so the cache is keyed by period and stage.
export async function loadDocument(doc) {
  const path = join(rawDir, 'docs', doc.raportointikokonaisuus, doc.ytunnus,
    `${doc.raportointikausi}-${doc.hyvaksymisvaihe}.json`);
  try {
    return new Map(Object.entries(await readJson(path)));
  } catch { /* not cached yet */ }
  const rows = await getJson(doc.tunnusluvut);
  const values = {};
  for (const r of rows) {
    const v = Number(r.arvo);
    if (Number.isFinite(v)) values[r.tunnusluku] = v;
  }
  await writeJson(path, values);
  return new Map(Object.entries(values));
}

// DatapointID map of a reporting set (tools/extract_datapoints.py).
export async function loadDatapoints(set) {
  return readJson(join(backendRoot, 'data', 'finance', 'datapoints', `${set}.json`));
}

// Municipalities with a y-tunnus (backend/data/finance/ytunnukset.json).
export async function loadMunicipalityIds() {
  const list = await readJson(join(backendRoot, 'data', 'finance', 'ytunnukset.json'));
  return list.filter((m) => m.ytunnus);
}

// Population at the end of each year: { year: value } (fetch-population.mjs).
export async function loadPopulationByYear(slug) {
  try {
    const { yearly } = await readJson(join(backendRoot, 'output', slug, 'population.json'));
    return Object.fromEntries(yearly.map((r) => [r.year, r.value]));
  } catch {
    return {};
  }
}

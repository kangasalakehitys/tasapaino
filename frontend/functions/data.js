// Browser-side data loading of the Tasapaino service. All data is pre-built
// into backend/data and backend/output (npm run update). Over file:// the .js
// twins of the JSON files are loaded with <script> tags, because fetch() is
// blocked there.

import { dataAsset, isFileProtocol } from './paths.js';

function loadDataScript(path) {
  return new Promise((resolve, reject) => {
    const cached = window.KUNTATIETO_DATA?.[path];
    if (cached) return resolve(cached);
    const script = document.createElement('script');
    script.src = dataAsset(path.replace(/\.json$/, '.js'));
    script.onload = () => {
      const data = window.KUNTATIETO_DATA?.[path];
      if (data) resolve(data);
      else reject(new Error(`Ei dataa: ${path}`));
    };
    script.onerror = () => reject(new Error(`Ei dataa: ${path}`));
    document.head.appendChild(script);
  });
}

const cache = new Map();

// A backend data file (path relative to /backend), loaded once.
export function loadDataFile(path) {
  if (!cache.has(path)) {
    cache.set(path, (async () => {
      if (isFileProtocol()) return loadDataScript(path);
      const res = await fetch(dataAsset(path));
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${path}`);
      return res.json();
    })());
  }
  return cache.get(path);
}

// backend/output/<kunta>/<file>; a missing file resolves to null.
const loadOutput = (slug, file) => loadDataFile(`output/${slug}/${file}`).catch(() => null);

// Municipalities 2026: [{ code, name, slug }].
export const loadMunicipalities = () => loadDataFile('data/kunnat.json');

export async function findMunicipality(slug) {
  const list = await loadMunicipalities();
  return list.find((m) => m.slug === slug) || list.find((m) => m.slug === 'kangasala');
}

// Comparison of all municipalities: indicators by year, size-class and country
// averages, financial strength ranking (compare-set.mjs).
export const loadComparison = () => loadDataFile('data/tasapaino/vertailu.json');

// Service classes (KKTPP) of all municipalities, latest year (compare-set.mjs).
export const loadServiceComparison = () => loadDataFile('data/tasapaino/palveluluokat.json');

// Statutory status of the service classes (lakisaateiset.json).
export const loadStatutory = () => loadDataFile('data/lakisaateiset.json');

// Tax bases and rates (fetch-tax.mjs, tax_rates.py).
export const loadIncomeTax = () => loadDataFile('data/tax/tuloverot.json');
export const loadPropertyTax = () => loadDataFile('data/tax/kiinteistovero.json');
export const loadTaxRates = () => loadDataFile('data/tax/veroprosentit.json');

// Purchase invoices of the municipalities that publish them (ostolaskut.py).
export const loadInvoices = (slug) => loadOutput(slug, 'ostolaskut.json');
export const loadInvoiceComparison = () => loadDataFile('data/ostolaskut/vertailu.json').catch(() => null);

// Subsidiaries and other group entities, maintained by hand (data/tolt/tolt.json).
export const loadTolt = () => loadDataFile('data/tolt/tolt.json').catch(() => null);

// Per municipality: yearly finance and tables (fetch-tasapaino.mjs), service
// classes (fetch-finance-pl.mjs), population by age (fetch-pyramid.mjs).
export const loadTasapaino = (slug) => loadOutput(slug, 'tasapaino.json');
export const loadFinancePL = (slug) => loadOutput(slug, 'finance-pl.json');
export const loadPyramid = (slug) => loadOutput(slug, 'pyramid.json');

// Municipality borders 2026 (TopoJSON, object Kunnat2026_geo) for map views.
export const loadMunicipalityTopo = () => loadDataFile('data/maps/kunnat2026_topo.json');

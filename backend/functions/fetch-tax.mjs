// Fetches the municipal tax bases from Verohallinto's statistics database
// (PX-Web, spec: backend/md/api/api.md "Verohallinto") and writes
//   backend/data/tax/tuloverot.json        income and municipal tax (table 6.A)
//     municipalities.<kuntakoodi>.<year>.{ totalIncome, earnedIncome, taxableEarned, municipalTax, recipients }
//   backend/data/tax/kiinteistovero.json   property tax and taxable value by use (table 2.1)
//     municipalities.<kuntakoodi>.<year>.<use>.{ tax, value }
// Effective tax rate (finance_compiler.md) = municipalTax / earnedIncome.
// Usage: node backend/functions/fetch-tax.mjs

import { saveData } from './data-files.mjs';
import { backendRoot } from './lib/tutkihallintoa.mjs';

const PX = 'https://vero2.stat.fi/PXWeb/api/v1/fi/Vero/';
const INCOME_TABLE = `${PX}Henkiloasiakkaiden_tuloverot/lopulliset/alue/alue_999.px`;
const PROPERTY_TABLE = `${PX}Kiinteistoverot/kive_201.px`;
const FIRST_YEAR = 2019;
// Items of table 6.A (Erä).
const INCOME_ITEMS = {
  totalIncome: 'HVT_TULOT_60', // 3. Veronalaiset tulot yhteensä
  earnedIncome: 'HVT_TULOT_70', // 4. Ansiotulot yhteensä
  taxableEarned: 'HVT_TULOT_1030', // 9.1 Verotettava ansiotulo kunnallisverotuksessa
  municipalTax: 'HVT_VEROT_60' // 1.1.2 Kunnallisvero (maksuunpantu, vähennysten jälkeen)
};
const RECIPIENTS = 'HVT_TULOT_20'; // 1.1 Yleisesti verovelvolliset (lukumäärä)
// Uses of table 2.1 (Käyttötarkoitus) -> keys of the tax rate file (tax_rates.py).
const PROPERTY_USES = {
  SSSSSS: 'total',
  2: 'residential', // Vakituinen asuinrakennus
  3: 'otherResidential', // Muu kuin vakituinen asuinrakennus
  7: 'general', // Yleinen (rakennus)
  11: 'land', // Yleinen (maapohja)
  13: 'unbuilt' // Rakentamaton rakennuspaikka
};

async function meta(table) {
  const res = await fetch(table);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${table}`);
  return res.json();
}

// POST a query and return the cells as [{ <dim>: code, value }] (json-stat2).
async function query(table, selections) {
  const body = {
    query: Object.entries(selections).map(([code, values]) => ({ code, selection: { filter: 'item', values } })),
    response: { format: 'json-stat2' }
  };
  const res = await fetch(table, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const stat = await res.json();
  const dims = stat.id.map((id) => Object.entries(stat.dimension[id].category.index)
    .sort((a, b) => a[1] - b[1]).map(([code]) => code));
  const cells = [];
  const counter = new Array(dims.length).fill(0);
  for (let i = 0; i < stat.value.length; i++) {
    if (stat.value[i] != null) {
      const cell = { value: stat.value[i] };
      stat.id.forEach((id, d) => { cell[id] = dims[d][counter[d]]; });
      cells.push(cell);
    }
    for (let d = dims.length - 1; d >= 0; d--) {
      if (++counter[d] < dims[d].length) break;
      counter[d] = 0;
    }
  }
  return cells;
}

const valuesOf = (m, code) => m.variables.find((v) => v.code === code).values;
// Three-digit codes are municipalities; 000 is the whole country.
const municipalityCodes = (m) => valuesOf(m, 'Alue').filter((c) => /^\d{3}$/.test(c));

async function fetchIncome() {
  const m = await meta(INCOME_TABLE);
  const codes = municipalityCodes(m);
  const years = valuesOf(m, 'Verovuosi').filter((y) => Number(y) >= FIRST_YEAR);
  console.log(`Tuloverot (6.A): ${codes.length} aluetta, vuodet ${years[0]}–${years.at(-1)}...`);
  const cells = await query(INCOME_TABLE, {
    'Alueluokitusten vuosi': valuesOf(m, 'Alueluokitusten vuosi').slice(-1),
    Alue: codes,
    Verovuosi: years,
    'Erä': [...Object.values(INCOME_ITEMS), RECIPIENTS],
    Tunnusluvut: ['Sum', 'N']
  });
  const keyOf = Object.fromEntries(Object.entries(INCOME_ITEMS).map(([k, v]) => [v, k]));
  const municipalities = {};
  for (const c of cells) {
    const target = ((municipalities[c.Alue] ||= {})[c.Verovuosi] ||= {});
    if (c['Erä'] === RECIPIENTS && c.Tunnusluvut === 'N') target.recipients = c.value;
    else if (keyOf[c['Erä']] && c.Tunnusluvut === 'Sum') target[keyOf[c['Erä']]] = c.value;
  }
  await saveData(backendRoot, 'data/tax/tuloverot.json', {
    updated: new Date().toISOString(),
    source: 'Verohallinto, henkilöasiakkaiden tuloverotilastot, taulukko 6.A',
    years: years.map(Number), items: INCOME_ITEMS, municipalities
  });
  const k = municipalities['211']?.[years.at(-1)];
  if (k) console.log(`  Kangasala ${years.at(-1)}: efektiivinen veroaste ${(100 * k.municipalTax / k.earnedIncome).toFixed(2)} %`);
}

async function fetchProperty() {
  const m = await meta(PROPERTY_TABLE);
  const codes = municipalityCodes(m);
  // The latest year is a preliminary figure (ennakkotieto).
  const years = valuesOf(m, 'Vuosi').filter((y) => Number(y) >= FIRST_YEAR);
  console.log(`Kiinteistövero (2.1): ${codes.length} aluetta, vuodet ${years[0]}–${years.at(-1)}...`);
  const cells = await query(PROPERTY_TABLE, {
    Alue: codes,
    'Käyttötarkoitus': Object.keys(PROPERTY_USES),
    Vuosi: years,
    Tiedot: ['Arvo_vero', 'Arvo_verotusarvo']
  });
  const municipalities = {};
  for (const c of cells) {
    const use = PROPERTY_USES[c['Käyttötarkoitus']];
    const target = (((municipalities[c.Alue] ||= {})[c.Vuosi] ||= {})[use] ||= {});
    target[c.Tiedot === 'Arvo_vero' ? 'tax' : 'value'] = c.value;
  }
  await saveData(backendRoot, 'data/tax/kiinteistovero.json', {
    updated: new Date().toISOString(),
    source: 'Verohallinto, kiinteistöverotilasto, taulukko 2.1',
    years: years.map(Number), preliminary: Number(years.at(-1)), uses: PROPERTY_USES, municipalities
  });
  const k = municipalities['211']?.[years.at(-2)];
  if (k) console.log(`  Kangasala ${years.at(-2)}: kiinteistövero ${(k.total.tax / 1e6).toFixed(1)} M€, vakituiset asunnot verotusarvo ${(k.residential.value / 1e6).toFixed(0)} M€`);
}

async function main() {
  await fetchIncome();
  await fetchProperty();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

// TalousPL comparison helpers (backend/md/pages/finance_pl.md) on
// backend/data/finance/kktpp-external-costs.json: external operating costs of
// every municipality by service class, and the municipality size categories of
// backend/md/site/brand_overview.md ("New municipality category").

// Population size categories: [label, smallest, largest].
export const SIZE_CATEGORIES = [
  ['alle 2 000 asukasta', 0, 1999],
  ['2 000–5 000 asukasta', 2000, 5000],
  ['5 001–10 000 asukasta', 5001, 10000],
  ['10 001–20 000 asukasta', 10001, 20000],
  ['20 001–40 000 asukasta', 20001, 40000],
  ['40 001–100 000 asukasta', 40001, 100000],
  ['yli 100 000 asukasta', 100001, Infinity]
];

export function sizeCategory(population) {
  return SIZE_CATEGORIES.find(([, lo, hi]) => population >= lo && population <= hi)?.[0] ?? null;
}

// Municipalities with a population: [{ slug, name, population, category,
// euros: { code }, perCapita: { code } }]. A municipality without a class
// counts as zero.
export function comparisonRows(costs) {
  return costs.municipalities
    .filter((m) => m.population > 0)
    .map((m) => {
      const euros = Object.fromEntries(costs.classes.map((c) => [c.code, m.values[c.code] || 0]));
      return {
        slug: m.slug,
        name: m.name,
        population: m.population,
        category: sizeCategory(m.population),
        euros,
        perCapita: Object.fromEntries(costs.classes.map((c) => [c.code, euros[c.code] / m.population]))
      };
    });
}

// Mean of every class over the rows: { euros: { code }, perCapita: { code } }.
export function averageOf(rows, classes) {
  const mean = (key, code) => (rows.length ? rows.reduce((sum, r) => sum + r[key][code], 0) / rows.length : null);
  return {
    count: rows.length,
    euros: Object.fromEntries(classes.map((c) => [c.code, mean('euros', c.code)])),
    perCapita: Object.fromEntries(classes.map((c) => [c.code, mean('perCapita', c.code)]))
  };
}

// Rank of a value among the rows, 1 = the largest.
export const rankOf = (rows, key, code, value) => 1 + rows.filter((r) => r[key][code] > value).length;

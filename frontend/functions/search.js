// Free-text site search (spec: backend/md/site/header.md).
// Matches pages and sections from the generated search index, and
// municipalities from the municipality list. A municipality named in the
// query ("nokia verotus") sets the municipality the results link to.

// Lower case without diacritics, so "vaesto" also finds "väestö".
export function normalize(s) {
  return String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const words = (s) => normalize(s).split(' ').filter(Boolean);

// Weight of the best field where some word starts with `token`.
function tokenScore(token, fields) {
  let best = 0;
  for (const { words: w, weight } of fields) {
    if (weight > best && w.some((word) => word.startsWith(token))) best = weight;
  }
  return best;
}

function prepare(index) {
  return index.map((entry) => ({
    entry,
    fields: [
      { words: words(entry.title), weight: 3 },
      { words: words(entry.keywords), weight: 2 },
      { words: words(`${entry.page} ${entry.description}`), weight: 1 }
    ]
  }));
}

let prepared;
let preparedFor;

// Municipality whose full name appears in the query, longest name first.
function namedMunicipality(query, municipalities) {
  const q = ` ${normalize(query)} `;
  let found = null;
  for (const m of municipalities) {
    const name = normalize(m.name);
    if (q.includes(` ${name} `) && (!found || name.length > normalize(found.name).length)) found = m;
  }
  return found;
}

export function search(query, index, municipalities = [], { limit = 8, municipalityLimit = 5 } = {}) {
  if (preparedFor !== index) {
    prepared = prepare(index);
    preparedFor = index;
  }
  const municipality = namedMunicipality(query, municipalities);
  let tokens = words(query);
  if (municipality) {
    const nameWords = words(municipality.name);
    tokens = tokens.filter((t) => !nameWords.includes(t));
  }

  // Municipality suggestions: names with a word starting with a query word.
  const queryWords = words(query).filter((t) => t.length >= 2);
  const municipalityHits = municipalities
    .filter((m) => m === municipality || words(m.name).some((w) => queryWords.some((t) => w.startsWith(t))))
    .sort((a, b) => (a === municipality ? -1 : b === municipality ? 1 : a.name.localeCompare(b.name, 'fi')))
    .slice(0, municipalityLimit);

  let pages;
  if (!tokens.length) {
    // Only a municipality was given: offer its pages.
    pages = municipality ? prepared.filter((p) => !p.entry.href.includes('#')).map((p) => ({ ...p, score: 0 })) : [];
  } else {
    pages = prepared
      .map((p) => {
        const scores = tokens.map((t) => tokenScore(t, p.fields));
        return { ...p, score: scores.every((s) => s > 0) ? scores.reduce((a, b) => a + b, 0) : 0 };
      })
      .filter((p) => p.score > 0);
  }
  pages.sort((a, b) =>
    (a.entry.upcoming - b.entry.upcoming) || (b.score - a.score) || a.entry.href.localeCompare(b.entry.href));

  return {
    municipality,
    municipalities: municipalityHits,
    pages: pages.slice(0, limit).map((p) => p.entry)
  };
}

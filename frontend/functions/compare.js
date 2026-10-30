// Comparison group of the Tasapaino service (spec: backend/md/api/finance_compiler.md,
// "Vertailujoukko"): the selected municipality, two selectable peers, the
// average of its size class, the three best of the size class (financial
// strength score of compare-set.mjs) and the mainland average.
//
// Peers: ?verrokit=nokia,ylojarvi in the URL, localStorage as fallback. The
// default for Kangasala is Nokia and Ylöjärvi (CLAUDE.md); for other
// municipalities the two closest by population in the same size class.

import { loadComparison } from './data.js';
import { getSelectedSlug } from './municipality.js';

const STORAGE_KEY = 'tasapaino.verrokit';
export const PEERS_EVENT = 'peers-change';
const DEFAULT_PEERS = { kangasala: ['nokia', 'ylojarvi'] };

// Colours by role (brand order; brand_overview.md).
export const COLORS = {
  main: '#DE232F',
  peer: ['#28336C', '#00ADC5'],
  classAvg: '#FCB316',
  best: '#009651',
  country: '#595959'
};

function readStorage() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; }
}

// Peers saved for this main municipality, or null.
function storedPeers(main) {
  const fromUrl = new URLSearchParams(location.search).get('verrokit');
  if (fromUrl) return fromUrl.split(',').filter(Boolean).slice(0, 2);
  return readStorage()?.[main] || null;
}

export function setPeers(peers) {
  const main = getSelectedSlug();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...(readStorage() || {}), [main]: peers }));
  } catch { /* ignore */ }
  const url = new URL(location.href);
  url.searchParams.set('verrokit', peers.join(','));
  history.replaceState(null, '', url);
  window.dispatchEvent(new CustomEvent(PEERS_EVENT, { detail: { peers } }));
}

export const onPeersChange = (callback) => window.addEventListener(PEERS_EVENT, (e) => callback(e.detail.peers));

function defaultPeers(data, main) {
  if (DEFAULT_PEERS[main.slug]) return DEFAULT_PEERS[main.slug];
  return data.municipalities
    .filter((m) => m.slug !== main.slug && m.sizeClass === main.sizeClass)
    .sort((a, b) => Math.abs(a.population - main.population) - Math.abs(b.population - main.population))
    .slice(0, 2)
    .map((m) => m.slug);
}

const average = (name, values, kind, color) => ({ slug: null, name, kind, color, values });

// The whole group: { data, year, main, peers[], classAvg, best[], bestAvg, country, members[] }.
// `members` is the drawing order of charts and tables.
export async function comparisonGroup(slug = getSelectedSlug()) {
  const data = await loadComparison();
  const bySlug = new Map(data.municipalities.map((m) => [m.slug, m]));
  const main = bySlug.get(slug) || bySlug.get('kangasala');
  const peerSlugs = (storedPeers(main.slug) || defaultPeers(data, main))
    .filter((s) => s !== main.slug && bySlug.has(s));
  const peers = peerSlugs.map((s, i) => ({ ...bySlug.get(s), kind: 'peer', color: COLORS.peer[i] }));
  const excluded = new Set([main.slug, ...peerSlugs]);
  const best = (data.ranking[main.sizeClass] || [])
    .filter((r) => !excluded.has(r.slug))
    .slice(0, 3)
    .map((r) => ({ ...bySlug.get(r.slug), kind: 'best', color: COLORS.best, score: r.score }));
  const classAvg = average(`Kokoluokan ka. (${main.sizeClass})`, data.averages.classes[main.sizeClass], 'classAvg', COLORS.classAvg);
  const country = average('Manner-Suomen kuntien ka.', data.averages.country, 'country', COLORS.country);
  // Mean of the three best, for charts where three extra lines would crowd.
  const bestAvg = average('Kokoluokan 3 parasta (ka.)', Object.fromEntries(data.years.map((y) => [y,
    Object.fromEntries(Object.keys(data.indicators).map((id) => {
      const xs = best.map((b) => b.values[y]?.[id]).filter((x) => x != null);
      return [id, xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null];
    }))])), 'bestAvg', COLORS.best);
  const rank = (data.ranking[main.sizeClass] || []).findIndex((r) => r.slug === main.slug) + 1;
  return {
    data, year: data.latestYear, years: data.years,
    main: { ...main, kind: 'main', color: COLORS.main },
    peers, best, classAvg, bestAvg, country,
    rank, classCount: (data.ranking[main.sizeClass] || []).length,
    members: [{ ...main, kind: 'main', color: COLORS.main }, ...peers, classAvg, bestAvg, country],
    // Every unit separately, e.g. for the latest-year bars and tables.
    all: [{ ...main, kind: 'main', color: COLORS.main }, ...peers, classAvg, ...best, country]
  };
}

// Value of one member, indicator and year (null when missing).
export const valueOf = (member, id, year) => member.values?.[year]?.[id] ?? null;

// Latest year with a value for the main municipality.
export function latestYearOf(group, id) {
  return [...group.years].reverse().find((y) => valueOf(group.main, id, y) != null) ?? group.year;
}

// Rank of the main municipality within its size class for an indicator
// (1 = best by the indicator's direction), and the class size.
export function classRank(group, id, year) {
  const ind = group.data.indicators[id];
  const rows = group.data.municipalities
    .filter((m) => m.sizeClass === group.main.sizeClass)
    .map((m) => valueOf(m, id, year))
    .filter((v) => v != null);
  const own = valueOf(group.main, id, year);
  if (own == null || !ind.better) return { rank: null, count: rows.length };
  const better = rows.filter((v) => (ind.better === 'high' ? v > own : v < own)).length;
  return { rank: better + 1, count: rows.length };
}

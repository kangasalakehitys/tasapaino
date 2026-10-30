// Fetches the 2026 municipality and region borders from Statistics Finland's
// Geoserver (spec: backend/md/api/api.md, Geoserver-Stat) and writes
//   backend/data/maps/kunnat2026_topo.json   TopoJSON, object Kunnat2026_geo
// Each municipality gets the properties kunta, nimi, maakunta and nimi_2
// (region name). The municipality layer has no region code, so the region is
// taken from the region layer by voting with points inside the municipality.
// Usage: node backend/functions/fetch-maps.mjs

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { topology } from 'topojson-server';
import { saveData } from './data-files.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const WFS = 'https://geo.stat.fi/geoserver/tilastointialueet/wfs';
const YEAR = 2026;
const SCALE = '1000k';
const PATH = `data/maps/kunnat${YEAR}_topo.json`;
const OBJECT = `Kunnat${YEAR}_geo`;
const GRID = 24; // sample points per bbox side for the region vote
const DECIMALS = 5; // ~1 m, well below the 1:1 000 000 generalisation

async function getFeatures(layer) {
  const params = new URLSearchParams({
    service: 'WFS', version: '2.0.0', request: 'GetFeature',
    typeNames: `tilastointialueet:${layer}`,
    outputFormat: 'application/json', srsName: 'EPSG:4326'
  });
  const res = await fetch(`${WFS}?${params}`);
  if (!res.ok) throw new Error(`${layer}: HTTP ${res.status}`);
  const json = await res.json();
  if (!json.features?.length) throw new Error(`${layer}: ei kohteita`);
  return json.features;
}

const polygons = (g) => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates);

function inRing([x, y], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

const inGeometry = (p, g) => polygons(g).some(([outer, ...holes]) => inRing(p, outer) && !holes.some((h) => inRing(p, h)));

function bbox(g) {
  const b = [Infinity, Infinity, -Infinity, -Infinity];
  for (const poly of polygons(g)) for (const [x, y] of poly[0]) {
    b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], y);
    b[2] = Math.max(b[2], x); b[3] = Math.max(b[3], y);
  }
  return b;
}

// Points of a regular grid that fall inside the geometry, plus its vertices'
// midpoints as a fallback for very small or narrow municipalities.
function samplePoints(g) {
  const [x0, y0, x1, y1] = bbox(g);
  const points = [];
  for (let i = 0; i < GRID; i++) for (let j = 0; j < GRID; j++) {
    const p = [x0 + ((i + 0.5) * (x1 - x0)) / GRID, y0 + ((j + 0.5) * (y1 - y0)) / GRID];
    if (inGeometry(p, g)) points.push(p);
  }
  if (points.length) return points;
  for (const poly of polygons(g)) {
    const [a, b, c] = poly[0];
    if (c) points.push([(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3]);
  }
  return points;
}

function regionOf(municipality, regions) {
  const votes = new Map();
  const points = samplePoints(municipality.geometry);
  for (const p of points) {
    const r = regions.find((r) => r.bbox[0] <= p[0] && p[0] <= r.bbox[2] && r.bbox[1] <= p[1] && p[1] <= r.bbox[3] &&
      inGeometry(p, r.geometry));
    if (r) votes.set(r, (votes.get(r) || 0) + 1);
  }
  const [best, count] = [...votes].sort((a, b) => b[1] - a[1])[0] || [];
  return { region: best, share: best ? count / points.length : 0 };
}

const round = (coords) => (typeof coords[0] === 'number'
  ? coords.map((v) => +v.toFixed(DECIMALS))
  : coords.map(round));

async function main() {
  console.log(`Haetaan kunta${SCALE}_${YEAR} ja maakunta${SCALE}_${YEAR} (geo.stat.fi)...`);
  const [municipalities, regionFeatures] = await Promise.all([
    getFeatures(`kunta${SCALE}_${YEAR}`),
    getFeatures(`maakunta${SCALE}_${YEAR}`)
  ]);
  const regions = regionFeatures.map((f) => ({ ...f, bbox: bbox(f.geometry) }));

  const features = [];
  const members = new Map();
  for (const m of municipalities) {
    const { kunta, nimi } = m.properties;
    const { region, share } = regionOf(m, regions);
    if (!region) throw new Error(`Kunnalle ${nimi} (${kunta}) ei löytynyt maakuntaa`);
    if (share < 0.9) console.warn(`Varoitus: ${nimi} (${kunta}) -> ${region.properties.nimi}, osuus ${(share * 100).toFixed(0)} %`);
    members.set(region, (members.get(region) || 0) + 1);
    features.push({
      type: 'Feature',
      properties: { kunta, nimi, maakunta: region.properties.maakunta, nimi_2: region.properties.nimi },
      geometry: { type: m.geometry.type, coordinates: round(m.geometry.coordinates) }
    });
  }
  const empty = regions.filter((r) => !members.has(r));
  if (empty.length) throw new Error(`Maakunnilla ei kuntia: ${empty.map((r) => r.properties.nimi).join(', ')}`);

  features.sort((a, b) => a.properties.kunta.localeCompare(b.properties.kunta));
  const topo = topology({ [OBJECT]: { type: 'FeatureCollection', features } }, 1e5);
  await saveData(root, PATH, topo, { compact: true });
  console.log(`Tallennettu ${PATH}: ${features.length} kuntaa, ${regions.length} maakuntaa.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

// Node helpers for writing data files. Every JSON file also gets a .js twin
// that registers the data on window.KUNTATIETO_DATA, because browsers block
// fetch() of local files when the site is opened directly (file://).

import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export function dataScript(key, data) {
  return 'window.KUNTATIETO_DATA = window.KUNTATIETO_DATA || {};\n' +
    `window.KUNTATIETO_DATA[${JSON.stringify(key)}] = ${JSON.stringify(data)};\n`;
}

// `root` is the backend directory and `path` is relative to it, e.g. 'output/kangasala/population.json'.
// `compact` drops the indentation, e.g. for large map geometry.
export async function saveData(root, path, data, { script = true, compact = false } = {}) {
  const full = join(root, path);
  await mkdir(dirname(full), { recursive: true });
  await writeFile(full, JSON.stringify(data, null, compact ? 0 : 2), 'utf8');
  if (script) await writeFile(full.replace(/\.json$/, '.js'), dataScript(path, data), 'utf8');
}

// Regenerate .js twins from existing JSON without fetching anything.
export async function buildDataScripts(root) {
  const paths = ['data/kunnat.json', 'data/maps/kunnat2026_topo.json',
    'data/finance/kktpp-external-costs.json', 'data/finance/kktpp-classes.json',
    'data/tasapaino/vertailu.json', 'data/tasapaino/palveluluokat.json', 'data/lakisaateiset.json',
    'data/tax/tuloverot.json', 'data/tax/kiinteistovero.json', 'data/tax/veroprosentit.json',
    'data/ostolaskut/vertailu.json', 'data/tolt/tolt.json'];
  for (const entry of await readdir(join(root, 'output'), { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const files = await readdir(join(root, 'output', entry.name));
    paths.push(...files.filter((f) => f.endsWith('.json')).map((f) => `output/${entry.name}/${f}`));
  }
  let count = 0;
  for (const path of paths) {
    try {
      const data = JSON.parse(await readFile(join(root, path), 'utf8'));
      await writeFile(join(root, path.replace(/\.json$/, '.js')), dataScript(path, data), 'utf8');
      count++;
    } catch { /* missing file: skip */ }
  }
  return count;
}

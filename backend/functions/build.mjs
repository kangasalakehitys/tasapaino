// Builds the site so it also works when opened directly from disk (file://):
//  1. writes the subpage shells from frontend/functions/pages-config.js (build-pages.mjs)
//  2. writes .js twins of the backend data JSON files (data-files.mjs)
//  3. generates the site search index from the pages (search-index.mjs)
//  4. bundles each page script (frontend/functions/page-*.js) into a classic
//     script in frontend/functions/dist/, since browsers block ES modules over file://
//
// Usage: npm run build            (one-off)
//        npm run build -- --watch (rebuild on change)

import { readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
import { buildDataScripts } from './data-files.mjs';
import { buildSearchIndex } from './search-index.mjs';
import { buildPages } from './build-pages.mjs';

const backend = join(dirname(fileURLToPath(import.meta.url)), '..');
const frontend = join(backend, '..', 'frontend');
const watch = process.argv.includes('--watch');

console.log(`Pages: ${await buildPages(frontend)}`);
console.log(`Data scripts: ${await buildDataScripts(backend)}`);
console.log(`Search index: ${await buildSearchIndex(frontend)} entries`);

const entryPoints = (await readdir(join(frontend, 'functions')))
  .filter((f) => /^page-.*\.js$/.test(f))
  .map((f) => join(frontend, 'functions', f));

const options = {
  entryPoints,
  outdir: join(frontend, 'functions', 'dist'),
  bundle: true,
  format: 'iife',
  target: 'es2020',
  charset: 'utf8',
  legalComments: 'none',
  logLevel: 'info'
};

if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  console.log('Watching for changes…');
} else {
  await esbuild.build(options);
}

// Minimal static server for local use: npm run serve -> http://localhost:8080
// (The site also works opened directly from disk after `npm run build`.)

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

// Serves the project root: pages load frontend/ assets and backend/ data.
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const port = Number(process.env.PORT) || 8080;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ttf': 'font/ttf',
  '.csv': 'text/csv; charset=utf-8'
};

createServer(async (req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  // The front page is index.html in the project root, as on GitHub Pages;
  // directories are served through their index.html below.
  let file = normalize(join(root, urlPath));
  if (!file.startsWith(root)) {
    res.writeHead(403).end();
    return;
  }
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Ei löydy');
  }
}).listen(port, () => {
  console.log(`Kuntatieto: http://localhost:${port}/`);
});

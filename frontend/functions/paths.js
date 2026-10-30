// URLs of the site files, independent of where the page is: the front page
// is index.html in the project root (so GitHub Pages serves it at the site
// root) and the other pages are in frontend/pages. Works over http://, on a
// GitHub Pages project path (/<repo>/) and over file://.

const PAGES = '/frontend/pages/';

// Project root (the folder of index.html) as an absolute URL ending in '/'.
function rootUrl() {
  const url = new URL('.', location.href);
  const i = url.pathname.lastIndexOf(PAGES);
  if (i >= 0) url.pathname = url.pathname.slice(0, i + 1);
  return url;
}

export const ROOT = rootUrl().href;

// Frontend file, e.g. 'brand/logos/x.svg'.
export function asset(path) {
  return new URL(`frontend/${path}`, ROOT).href;
}

// Backend data file, e.g. 'output/kangasala/population.json'.
export function dataAsset(path) {
  return new URL(`backend/${path}`, ROOT).href;
}

// Page by its file name: 'index.html' is the front page in the root, the
// others are in frontend/pages. A '#hash' is kept.
export function pageUrl(name) {
  const [file, hash] = name.split('#');
  const url = new URL(file === 'index.html' ? 'index.html' : `frontend/pages/${file}`, ROOT);
  if (hash) url.hash = hash;
  return url.href;
}

export const isFileProtocol = () => location.protocol === 'file:';

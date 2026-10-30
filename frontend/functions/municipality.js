// Selected municipality: ?kunta=<slug> in the URL, localStorage as fallback.

import { pageUrl } from './paths.js';

const STORAGE_KEY = 'kuntatieto.kunta';
export const DEFAULT_SLUG = 'kangasala';
export const CHANGE_EVENT = 'kunta-change';

function readStorage() {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}

function writeStorage(slug) {
  try { localStorage.setItem(STORAGE_KEY, slug); } catch { /* ignore */ }
}

export function getSelectedSlug() {
  const fromUrl = new URLSearchParams(location.search).get('kunta');
  return fromUrl || readStorage() || DEFAULT_SLUG;
}

export function setSelectedSlug(slug) {
  writeStorage(slug);
  const url = new URL(location.href);
  url.searchParams.set('kunta', slug);
  history.replaceState(null, '', url);
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { slug } }));
}

export function onMunicipalityChange(callback) {
  window.addEventListener(CHANGE_EVENT, (e) => callback(e.detail.slug));
}

// Keep ?kunta= on internal links so the selection follows navigation. `href`
// is a page file name ('talous.html', 'index.html'); it is resolved with
// pageUrl, so links work from the front page in the root and from frontend/pages.
export function withKunta(href, slug = getSelectedSlug()) {
  const [path] = href.split('?');
  return `${pageUrl(path)}?kunta=${encodeURIComponent(slug)}`;
}

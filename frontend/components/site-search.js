// <site-search> — "Haku" link in the top bar that opens a free-text search
// of the site (spec: backend/md/site/header.md). The panel is positioned
// against the sticky .site-header. Enter opens the first result, Esc closes.

import searchIndex from '../functions/search-index.js';
import { search } from '../functions/search.js';
import { loadMunicipalities } from '../functions/data.js';
import { getSelectedSlug, withKunta } from '../functions/municipality.js';
import { escapeHtml } from '../functions/format.js';

const ICON = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M15.5 15.5 21 21" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"/></svg>';

function link(href, slug) {
  const [path, hash] = href.split('#');
  return withKunta(path, slug) + (hash ? `#${hash}` : '');
}

class SiteSearch extends HTMLElement {
  connectedCallback() {
    if (this.toggle) return;
    this.innerHTML = `
      <button type="button" class="site-search__toggle" aria-expanded="false" aria-controls="site-search-panel">
        ${ICON}<span class="site-search__toggle-label">Haku</span>
      </button>
      <div id="site-search-panel" class="site-search__panel" hidden>
        <div class="container">
          <form class="site-search__form" role="search">
            <label for="site-search-input" class="visually-hidden">Hae sivustolta</label>
            <input id="site-search-input" type="search" autocomplete="off"
              placeholder="Hae sivustolta, esim. vuosikate, kiinteistövero tai Nokia verotus">
            <button type="button" class="site-search__close" aria-label="Sulje haku">Sulje</button>
          </form>
          <p class="site-search__status" aria-live="polite"></p>
          <div class="site-search__results"></div>
        </div>
      </div>`;

    this.toggle = this.querySelector('.site-search__toggle');
    this.panel = this.querySelector('.site-search__panel');
    this.input = this.querySelector('input');
    this.status = this.querySelector('.site-search__status');
    this.results = this.querySelector('.site-search__results');

    this.toggle.addEventListener('click', () => (this.panel.hidden ? this.open() : this.close()));
    this.querySelector('.site-search__close').addEventListener('click', () => this.close(true));
    this.input.addEventListener('input', () => this.update());
    // A result on the current page only scrolls, so close the panel too.
    this.results.addEventListener('click', (e) => {
      if (e.target.closest('a')) this.close();
    });
    this.querySelector('form').addEventListener('submit', (e) => {
      e.preventDefault();
      const first = this.results.querySelector('a');
      if (first) location.href = first.href;
    });
    this.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.panel.hidden) this.close(true);
    });
    this.onDocumentClick = (e) => {
      if (!this.panel.hidden && !this.contains(e.target)) this.close();
    };
    document.addEventListener('click', this.onDocumentClick);
  }

  disconnectedCallback() {
    document.removeEventListener('click', this.onDocumentClick);
  }

  async open() {
    this.panel.hidden = false;
    this.toggle.setAttribute('aria-expanded', 'true');
    this.input.focus();
    this.municipalities ||= await loadMunicipalities().catch(() => []);
    this.update();
  }

  close(returnFocus = false) {
    this.panel.hidden = true;
    this.toggle.setAttribute('aria-expanded', 'false');
    if (returnFocus) this.toggle.focus();
  }

  update() {
    const query = this.input.value.trim();
    if (!query) {
      this.status.textContent = '';
      this.results.innerHTML = '';
      return;
    }
    const r = search(query, searchIndex, this.municipalities || []);
    const slug = r.municipality?.slug || getSelectedSlug();
    const count = r.pages.length + r.municipalities.length;

    this.status.textContent = count
      ? `${count} tulosta` + (r.municipality ? `, kunta: ${r.municipality.name}` : '')
      : `Ei tuloksia haulle ”${query}”.`;

    const pageItems = r.pages.map((p) => `
      <li><a href="${escapeHtml(link(p.href, slug))}">
        <span class="site-search__title">${escapeHtml(p.title)}</span>
        <span class="site-search__meta">${escapeHtml(p.upcoming ? `${p.page} · sisältö tulossa` : p.href.includes('#') ? p.page : p.description || p.page)}</span>
      </a></li>`).join('');
    const municipalityItems = r.municipalities.map((m) => `
      <li><a href="${escapeHtml(link('index.html', m.slug))}">
        <span class="site-search__title">${escapeHtml(m.name)}</span>
        <span class="site-search__meta">Kunnan etusivu</span>
      </a></li>`).join('');

    this.results.innerHTML =
      (pageItems ? `<h2 class="site-search__group">Sivut</h2><ul>${pageItems}</ul>` : '') +
      (municipalityItems ? `<h2 class="site-search__group">Kunnat</h2><ul>${municipalityItems}</ul>` : '');
  }
}

customElements.define('site-search', SiteSearch);

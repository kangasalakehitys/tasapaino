// <site-header active="kokonaistalous"> — shared top bar with site title, navigation,
// municipality selector and site search (spec: backend/md/site/header.md).

import './site-search.js';
import { loadMunicipalities } from '../functions/data.js';
import { getSelectedSlug, setSelectedSlug, onMunicipalityChange, withKunta } from '../functions/municipality.js';
import { escapeHtml } from '../functions/format.js';

// Links in the order of header.md.
export const NAV_ITEMS = [
  { id: 'kokonaistalous', label: 'Kokonaistalous', href: 'kokonaistalous.html' },
  { id: 'palveluluokat', label: 'Palveluluokat', href: 'palveluluokat.html' },
  { id: 'verotus', label: 'Verotus', href: 'verotus.html' },
  { id: 'toimenpiteet', label: 'Toimenpiteet', href: 'toimenpiteet.html' }
];

class SiteHeader extends HTMLElement {
  connectedCallback() {
    const active = this.getAttribute('active');
    this.innerHTML = `
      <header class="site-header">
        <div class="site-header__bar container">
          <a class="site-header__logo" data-href="index.html" href="index.html" aria-label="Etusivu">
            <span class="site-header__title">Tasapaino</span>
          </a>
          <label class="kunta-select">
            <span class="kunta-select__label">Kunta</span>
            <select aria-label="Valitse kunta"><option>Ladataan…</option></select>
          </label>
          <site-search></site-search>
          <button class="site-header__toggle" aria-expanded="false" aria-controls="site-nav" aria-label="Valikko">
            <span></span><span></span><span></span>
          </button>
        </div>
        <nav id="site-nav" class="site-nav">
          <ul class="container">
            ${NAV_ITEMS.map((item) => `
              <li><a data-href="${item.href}" href="${item.href}"${item.id === active ? ' aria-current="page"' : ''}>${item.label}</a></li>
            `).join('')}
          </ul>
        </nav>
      </header>`;

    const toggle = this.querySelector('.site-header__toggle');
    const nav = this.querySelector('.site-nav');
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('is-open', !open);
    });

    this.select = this.querySelector('select');
    this.select.addEventListener('change', () => setSelectedSlug(this.select.value));
    onMunicipalityChange(() => this.updateLinks());
    this.updateLinks();
    this.populate();
  }

  async populate() {
    const list = await loadMunicipalities();
    const selected = getSelectedSlug();
    this.select.innerHTML = list
      .map((m) => `<option value="${m.slug}"${m.slug === selected ? ' selected' : ''}>${escapeHtml(m.name)}</option>`)
      .join('');
  }

  updateLinks() {
    const slug = getSelectedSlug();
    this.querySelectorAll('a[data-href]').forEach((a) => {
      a.href = withKunta(a.dataset.href, slug);
    });
  }
}

customElements.define('site-header', SiteHeader);

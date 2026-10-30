// <share-button target="article-id"> — lets the reader copy a link to one
// article (current page + ?kunta= + #article-id).

import { getSelectedSlug } from '../functions/municipality.js';

const ICON = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M18 16.1c-.8 0-1.4.3-2 .8l-7.1-4.2c.1-.2.1-.5.1-.7s0-.5-.1-.7L16 7.2c.5.5 1.2.8 2 .8 1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3c0 .2 0 .5.1.7L8 9.8C7.5 9.3 6.8 9 6 9c-1.7 0-3 1.3-3 3s1.3 3 3 3c.8 0 1.5-.3 2-.8l7.1 4.2c-.1.2-.1.4-.1.6 0 1.6 1.3 2.9 2.9 2.9s2.9-1.3 2.9-2.9-1.2-2.9-2.8-2.9z" fill="currentColor"/></svg>';

class ShareButton extends HTMLElement {
  connectedCallback() {
    this.classList.add('share');
    this.innerHTML = `
      <button type="button" class="share__toggle" aria-expanded="false">${ICON}<span>Jaa artikkeli</span></button>
      <div class="share__panel" hidden>
        <label class="share__label" for="share-${this.target}">Linkki artikkeliin</label>
        <div class="share__row">
          <input id="share-${this.target}" class="share__url" type="text" readonly>
          <button type="button" class="share__copy">Kopioi</button>
        </div>
        <p class="share__status" role="status" aria-live="polite"></p>
      </div>`;

    this.toggle = this.querySelector('.share__toggle');
    this.panel = this.querySelector('.share__panel');
    this.input = this.querySelector('.share__url');
    this.status = this.querySelector('.share__status');

    this.toggle.addEventListener('click', () => this.setOpen(this.panel.hidden));
    this.querySelector('.share__copy').addEventListener('click', () => this.copy());
    this.input.addEventListener('focus', () => this.input.select());
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') this.setOpen(false); });
  }

  get target() {
    return this.getAttribute('target') || '';
  }

  url() {
    const url = new URL(location.href);
    // Include the municipality so the recipient sees the same data.
    url.searchParams.set('kunta', getSelectedSlug());
    url.hash = this.target;
    return url.toString();
  }

  setOpen(open) {
    this.panel.hidden = !open;
    this.toggle.setAttribute('aria-expanded', String(open));
    if (open) {
      this.input.value = this.url();
      this.status.textContent = '';
    }
  }

  async copy() {
    this.input.value = this.url();
    try {
      await navigator.clipboard.writeText(this.input.value);
    } catch {
      // Clipboard API unavailable (e.g. plain http): fall back to selection.
      this.input.select();
      document.execCommand('copy');
    }
    this.status.textContent = 'Linkki kopioitu leikepöydälle.';
  }
}

customElements.define('share-button', ShareButton);

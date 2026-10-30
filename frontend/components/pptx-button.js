// <pptx-button target="article-id"> — downloads the article, or every article
// of the page, as a PowerPoint deck in the brand layout (brand_overview.md,
// "Powerpoint"; slides built by functions/pptx-deck.js, which loads PptxGenJS
// from the CDN only when a deck is requested).

import { downloadDeck } from '../functions/pptx-deck.js';

const ICON = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 3h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-6v2h3v2H8v-2h3v-2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm0 2v10h14V5H5zm2 8 3-4 2 2 3-4 2 6H7z" fill="currentColor"/></svg>';

class PptxButton extends HTMLElement {
  connectedCallback() {
    if (this.toggle) return;
    this.classList.add('share', 'pptx');
    this.innerHTML = `
      <button type="button" class="share__toggle" aria-expanded="false">${ICON}<span>PowerPoint</span></button>
      <div class="share__panel" hidden>
        <p class="share__label">Lataa PowerPoint-esitys</p>
        <div class="pptx__choices">
          <button type="button" class="share__copy" data-scope="article">Tämä artikkeli</button>
          <button type="button" class="share__copy" data-scope="page">Koko sivu</button>
        </div>
        <p class="share__status" role="status" aria-live="polite"></p>
      </div>`;
    this.toggle = this.querySelector('.share__toggle');
    this.panel = this.querySelector('.share__panel');
    this.status = this.querySelector('.share__status');
    this.toggle.addEventListener('click', () => this.setOpen(this.panel.hidden));
    this.panel.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-scope]');
      if (btn) this.download(btn.dataset.scope === 'page');
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') this.setOpen(false); });
  }

  setOpen(open) {
    this.panel.hidden = !open;
    this.toggle.setAttribute('aria-expanded', String(open));
  }

  async download(whole) {
    const article = document.getElementById(this.getAttribute('target'));
    const articles = whole ? [...document.querySelectorAll('article[data-tab]')] : [article];
    this.status.textContent = 'Muodostetaan esitystä…';
    this.panel.querySelectorAll('button').forEach((b) => { b.disabled = true; });
    try {
      await downloadDeck({ articles, whole });
      this.status.textContent = 'Esitys ladattu.';
    } catch (err) {
      console.error(err);
      this.status.textContent = `Esityksen muodostus epäonnistui: ${err.message}`;
    } finally {
      this.panel.querySelectorAll('button').forEach((b) => { b.disabled = false; });
    }
  }
}

customElements.define('pptx-button', PptxButton);

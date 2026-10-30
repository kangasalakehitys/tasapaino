// <teaser-card> — Economist-style teaser: chart, kicker, headline, short text.
// Front page teasers use only data visualisations as media (backend/md/site/frontpage.md).
//
//   el.setData({ href, kicker, title, text, size?: 'lead' | 'normal' })
//   el.setMedia(chartElement)   e.g. <line-chart compact>

import { escapeHtml } from '../functions/format.js';

class TeaserCard extends HTMLElement {
  setData({ href, kicker, title, text, size = 'normal' }) {
    this.className = `teaser teaser--${size}`;
    this.innerHTML = `
      <a class="teaser__link" href="${href}">
        <div class="teaser__body">
          ${kicker ? `<p class="teaser__kicker">${escapeHtml(kicker)}</p>` : ''}
          <h3 class="teaser__title">${escapeHtml(title)}</h3>
          ${text ? `<p class="teaser__text">${escapeHtml(text)}</p>` : ''}
        </div>
      </a>
      <div class="teaser__media"></div>`;
    return this;
  }

  setMedia(node) {
    this.querySelector('.teaser__media').replaceChildren(node);
  }
}

customElements.define('teaser-card', TeaserCard);

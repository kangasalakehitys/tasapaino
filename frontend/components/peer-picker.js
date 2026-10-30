// <peer-picker> — choose the two peer municipalities (verrokkikunnat) and show
// the whole comparison group as a colour legend (spec: backend/md/site/header.md,
// "Vertailujoukko"). The choice is kept in ?verrokit= and localStorage
// (functions/compare.js), and every chart of the page follows it.

import { loadComparison } from '../functions/data.js';
import { comparisonGroup, setPeers, onPeersChange } from '../functions/compare.js';
import { onMunicipalityChange } from '../functions/municipality.js';
import { escapeHtml } from '../functions/format.js';

class PeerPicker extends HTMLElement {
  connectedCallback() {
    if (this.ready) return;
    this.ready = true;
    this.classList.add('peer-picker');
    this.innerHTML = '<p class="loading">Ladataan vertailujoukkoa…</p>';
    this.render();
    onMunicipalityChange(() => this.render());
    onPeersChange(() => this.render());
  }

  async render() {
    const [data, group] = await Promise.all([loadComparison(), comparisonGroup()]);
    const options = (selected) => data.municipalities
      .filter((m) => m.slug !== group.main.slug)
      .map((m) => `<option value="${m.slug}"${m.slug === selected ? ' selected' : ''}>${escapeHtml(m.name)}</option>`)
      .join('');
    const chip = (m, label = m.name) =>
      `<li><span class="peer-picker__dot" style="background:${m.color}"></span>${escapeHtml(label)}</li>`;
    this.innerHTML = `
      <div class="peer-picker__row">
        <span class="peer-picker__label">Verrokit</span>
        ${[0, 1].map((i) => `
          <label class="peer-picker__select">
            <span class="visually-hidden">Verrokkikunta ${i + 1}</span>
            <select data-index="${i}">${options(group.peers[i]?.slug)}</select>
          </label>`).join('')}
      </div>
      <ul class="peer-picker__legend" aria-label="Vertailujoukko">
        ${chip(group.main)}
        ${group.peers.map((p) => chip(p)).join('')}
        ${chip(group.classAvg, `Kokoluokan ka. (${group.data.municipalities.filter((m) => m.sizeClass === group.main.sizeClass).length} kuntaa)`)}
        ${chip(group.bestAvg, `Kokoluokan 3 parasta: ${group.best.map((b) => b.name).join(', ')}`)}
        ${chip(group.country)}
      </ul>`;
    this.querySelectorAll('select').forEach((select) => {
      select.addEventListener('change', () => {
        const peers = [...this.querySelectorAll('select')].map((s) => s.value);
        if (peers[0] === peers[1]) return;
        setPeers(peers);
      });
    });
  }
}

customElements.define('peer-picker', PeerPicker);

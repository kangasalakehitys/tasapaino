// <tax-simulator> — effect of tax-rate changes on the municipality's revenue
// (spec: backend/md/pages/verotus.md, "Veroprosenttisimulaattori").
//
//   Income tax:   Δ € = taxable earned income in municipal taxation × Δ %-points
//                 (Verohallinto 6.A, item 9.1; the usual Kuntaliitto rule of thumb)
//   Property tax: Δ € = taxable value of the property type × Δ rate
//                 (Verohallinto 2.1, latest final year), within the limits of
//                 the Property Tax Act (kiinteistöverolaki 654/1992, from 2024)
//
//   el.setData({ name, population, income: { year, taxableEarned, recipients, rate },
//                property: { year, uses: { residential: { value, rate }, ... } } })

import { escapeHtml } from '../functions/format.js';

const nf0 = new Intl.NumberFormat('fi-FI', { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtMe = (v) => `${v >= 0 ? '+' : '−'}${nf2.format(Math.abs(v) / 1e6)} M€`;

// Legal limits from 2024 (kiinteistöverolaki), %.
export const PROPERTY_LIMITS = {
  general: { label: 'Yleinen (rakennukset)', min: 0.93, max: 2.0 },
  land: { label: 'Maapohja', min: 1.3, max: 2.0 },
  residential: { label: 'Vakituinen asuinrakennus', min: 0.41, max: 1.0 },
  otherResidential: { label: 'Muu asuinrakennus', min: 0.93, max: 2.0 }
};

class TaxSimulator extends HTMLElement {
  setData(data) {
    this.data = data;
    this.classList.add('tax-sim');
    const { income, property } = data;
    const propertyRows = Object.entries(PROPERTY_LIMITS)
      .filter(([use]) => property?.uses?.[use]?.value)
      .map(([use, lim]) => {
        const u = property.uses[use];
        return `
          <div class="tax-sim__row" data-use="${use}">
            <label for="sim-${use}">${escapeHtml(lim.label)}
              <span class="tax-sim__hint">nyt ${nf2.format(u.rate)} %, laki ${nf2.format(lim.min)}–${nf2.format(lim.max)} %,
              verotusarvo ${nf0.format(u.value / 1e6)} M€</span></label>
            <input id="sim-${use}" type="range" min="${lim.min}" max="${lim.max}" step="0.01" value="${u.rate}">
            <output class="tax-sim__rate"></output>
            <output class="tax-sim__effect"></output>
          </div>`;
      }).join('');
    this.innerHTML = `
      <form class="tax-sim__form" onsubmit="return false">
        <fieldset>
          <legend>Kunnallisvero (tuloveroprosentti)</legend>
          <div class="tax-sim__row" data-use="income">
            <label for="sim-income">Tuloveroprosentti
              <span class="tax-sim__hint">nyt ${nf2.format(income.rate)} %, verotettava ansiotulo ${nf0.format(income.taxableEarned / 1e6)} M€ (verovuosi ${income.year})</span></label>
            <input id="sim-income" type="range" min="${(income.rate - 1.5).toFixed(2)}" max="${(income.rate + 1.5).toFixed(2)}" step="0.05" value="${income.rate}">
            <output class="tax-sim__rate"></output>
            <output class="tax-sim__effect"></output>
          </div>
        </fieldset>
        ${propertyRows ? `<fieldset><legend>Kiinteistöverot (verovuosi ${property.year})</legend>${propertyRows}</fieldset>` : ''}
        <button type="button" class="tax-sim__reset">Palauta nykyiset prosentit</button>
      </form>
      <div class="tax-sim__result" aria-live="polite"></div>`;
    this.querySelectorAll('input[type=range]').forEach((input) => input.addEventListener('input', () => this.update()));
    this.querySelector('.tax-sim__reset').addEventListener('click', () => this.setData(this.data));
    this.update();
    return this;
  }

  // Effects in euros by use.
  effects() {
    const { income, property } = this.data;
    const out = {};
    for (const row of this.querySelectorAll('.tax-sim__row')) {
      const use = row.dataset.use;
      const rate = Number(row.querySelector('input').value);
      const base = use === 'income' ? income.taxableEarned : property.uses[use].value;
      const now = use === 'income' ? income.rate : property.uses[use].rate;
      out[use] = { rate, delta: rate - now, euros: (base * (rate - now)) / 100 };
    }
    return out;
  }

  update() {
    const effects = this.effects();
    for (const row of this.querySelectorAll('.tax-sim__row')) {
      const e = effects[row.dataset.use];
      row.querySelector('.tax-sim__rate').textContent = `${nf2.format(e.rate)} % (${e.delta >= 0 ? '+' : '−'}${nf2.format(Math.abs(e.delta))})`;
      const out = row.querySelector('.tax-sim__effect');
      out.textContent = fmtMe(e.euros);
      out.className = `tax-sim__effect ${e.euros > 0 ? 'pos' : e.euros < 0 ? 'neg' : ''}`;
    }
    const total = Object.values(effects).reduce((s, e) => s + e.euros, 0);
    const { population, income } = this.data;
    const perPayer = income.recipients ? (effects.income.euros / income.recipients) : null;
    this.querySelector('.tax-sim__result').innerHTML = `
      <p class="tax-sim__total ${total > 0 ? 'pos' : total < 0 ? 'neg' : ''}">${fmtMe(total)} vuodessa</p>
      <p>${nf0.format(total / population)} € asukasta kohden.
      ${perPayer ? `Kunnallisveron muutos on keskimäärin ${nf0.format(perPayer)} € vuodessa verovelvollista kohden.` : ''}</p>
      <p class="tax-sim__note">Arvio on staattinen: veropohjan muutoksia, verotulojen tilitysviivettä ja valtionosuuksien verotuloihin perustuvaa tasausta ei ole huomioitu.</p>`;
    this.dispatchEvent(new CustomEvent('simulate', { detail: { effects, total } }));
  }
}

customElements.define('tax-simulator', TaxSimulator);

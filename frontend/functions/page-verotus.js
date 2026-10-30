// Verotus page (spec: backend/md/pages/verotus.md): the eight tax indicators of
// CLAUDE.md (generic indicator articles, pages-config.js) and the tax-rate simulator.

import '../components/tax-simulator.js';
import '../components/bar-chart.js';
import { setupPage } from './subpage.js';
import { loadIncomeTax, loadPropertyTax, loadTaxRates } from './data.js';
import { valueOf } from './compare.js';
import { byPrefix, figureHtml, paragraphs, fmtMe, fmtPct } from './article-common.js';
import { COLORS } from './compare.js';

const latestKey = (obj, below = Infinity) => Object.keys(obj || {}).filter((k) => Number(k) < below).sort().at(-1);

async function renderSimulator(a, group) {
  const el = byPrefix(a.id);
  const [income, property, rates] = await Promise.all([loadIncomeTax(), loadPropertyTax(), loadTaxRates()]);
  const code = group.main.code;
  const incomeYear = latestKey(income.municipalities[code]);
  const inc = income.municipalities[code][incomeYear];
  const rateYear = latestKey(rates.municipalities[code]);
  const r = rates.municipalities[code][rateYear];
  // Latest final property tax year (the newest is a preliminary figure).
  const propYear = latestKey(property.municipalities[code], property.preliminary);
  const p = property.municipalities[code][propYear];
  const pop = valueOf(group.main, 'population', group.year);
  // Kuntaliitto's file has no separate land rate for every year: land and
  // other residential buildings use the rate implied by tax / taxable value.
  const implied = (use) => (p[use]?.value ? Math.round((10000 * p[use].tax) / p[use].value) / 100 : null);
  const uses = {
    residential: { value: p.residential?.value, rate: r.propertyResidential ?? implied('residential') },
    general: { value: p.general?.value, rate: r.propertyGeneral ?? implied('general') },
    land: { value: p.land?.value, rate: implied('land') },
    otherResidential: { value: p.otherResidential?.value, rate: implied('otherResidential') }
  };
  const step = (inc.taxableEarned * 0.0025);
  el('title').textContent = `${group.main.name}: 0,25 %-yksikön tuloveron korotus tuottaisi noin ${fmtMe(step)} vuodessa, 0,1 %-yksikön vakituisen asunnon kiinteistöveron korotus ${fmtMe(uses.residential.value * 0.001)}`;
  el('content').innerHTML = `
    <div class="article__body">${paragraphs([
    `Simulaattori laskee veroprosenttien muutoksen staattisen vaikutuksen viimeisimmän veropohjan perusteella: tulovero verovuodelta ${incomeYear} (Verohallinto, verotettava ansiotulo kunnallisverotuksessa) ja kiinteistövero vuodelta ${propYear} (Verohallinto, verotusarvot käyttötarkoituksittain). Veroprosentit: Kuntaliitto ${rateYear}.`
  ])}</div>
    <tax-simulator id="${a.id}-sim"></tax-simulator>
    ${figureHtml(`${a.id}-fig`, { title: 'Muutoksen vaikutus veroittain', subtitle: 'M€ vuodessa', source: 'Verohallinto; Kuntaliitto', body: `<bar-chart id="${a.id}-chart"></bar-chart>` })}
    <div class="article__body" id="${a.id}-analysis"><h2>Huomioitavaa</h2>${paragraphs([
    'Tuloveron muutos näkyy verotilityksissä viiveellä ja vaikuttaa valtionosuuksien verotuloihin perustuvaan tasaukseen. Kiinteistövero ei vaikuta tasaukseen.',
    `Tuloveroprosentti on nyt ${fmtPct(r.income, 2)}. Kokoluokan keskiarvo on ${fmtPct(valueOf(group.classAvg, 'nominalTaxRate', group.year), 2)}.`
  ])}</div>`;
  const sim = el('sim');
  const labels = { income: 'Tulovero', residential: 'Vakituiset asunnot', general: 'Yleinen (rakennukset)', land: 'Maapohja', otherResidential: 'Muut asuinrakennukset' };
  sim.addEventListener('simulate', (e) => {
    const keys = Object.keys(e.detail.effects);
    el('chart').setData({
      categories: keys.map((k) => labels[k]),
      series: [{ name: 'Muutos', color: COLORS.main, values: keys.map((k) => e.detail.effects[k].euros) }],
      horizontal: true, signColors: true, valueFormat: (v) => fmtMe(v).replace(' M€', ''), filename: `simulaattori-${group.main.slug}`,
      csv: { header: ['Vero', 'Uusi prosentti', 'Muutos (€)'], rows: keys.map((k) => [labels[k], e.detail.effects[k].rate, e.detail.effects[k].euros]) }
    });
  });
  sim.setData({
    name: group.main.name, population: pop,
    income: { year: incomeYear, taxableEarned: inc.taxableEarned, recipients: inc.recipients, rate: r.income },
    property: { year: propYear, uses }
  });
}

setupPage('verotus', { simulaattori: renderSimulator });

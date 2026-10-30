// Toimenpiteet page (spec: backend/md/pages/toimenpiteet.md): the five areas of
// the balancing programme and their five most important items (recommendations.js).

import '../components/bar-chart.js';
import { setupPage } from './subpage.js';
import { buildRecommendations, AREAS, AI_ASSUMPTIONS } from './recommendations.js';
import { byPrefix, figureHtml, summaryHtml, paragraphs, fmtMe } from './article-common.js';
import { withKunta } from './municipality.js';
import { escapeHtml } from './format.js';

const BACKGROUND = {
  palveluverkko: 'Palveluverkon sopeutus tarkoittaa koulujen, päiväkotien ja muiden toimipisteiden yhdistämistä tai lakkauttamista palvelutarpeen muuttuessa. Säästöt syntyvät tilakustannuksista, ylläpidosta ja tehokkaammista ryhmäkoista; päätökset edellyttävät vaikutusten arviointia ja kuulemista.',
  toimintakulut: 'Toimintakulujen sopeutus: prosessien tehostaminen, henkilöstömenojen sopeuttaminen ja palvelujen uudelleenjärjestely (oma tuotanto, ostopalvelut, yhteistyö).',
  investoinnit: 'Investointien karsiminen, lykkääminen tai vaiheistaminen sekä kunnan omistamien kiinteistöjen, maa-alueiden ja metsien myynti. Investointien taso mitoitetaan tulorahoituksen mukaan.',
  tulot: 'Tulojen vahvistaminen: veroprosenttien tarkistaminen, maksujen ja taksojen korotukset sekä veropohjan kasvattaminen elinvoimapolitiikalla.',
  jokeri: 'Viides osa-alue: tekoäly, automaatio ja tietojohtaminen. Teknologia ei sellaisenaan vähennä menoja, mutta se mahdollistaa tuottavuuden kasvun, kun tehtäviä järjestetään uudelleen ja luonnollinen poistuma hyödynnetään. Arviot perustuvat oletuksiin, jotka on esitetty kunkin noston kohdalla.'
};

const TAGS = {
  statutory: 'Lakisääteinen', 'statutory-scope': 'Lakisääteinen, laajuus harkinnanvarainen',
  licensed: 'Luvanvarainen', voluntary: 'Vapaaehtoinen', support: 'Tukitoiminto'
};

function cardHtml(item, i) {
  const [page, hash] = item.href.split('#');
  return `
    <li class="rec-card">
      <p class="rec-card__rank">${i + 1}</p>
      <div class="rec-card__body">
        <h3>${escapeHtml(item.title)}</h3>
        ${item.tag ? `<p class="rec-card__tag">${escapeHtml(TAGS[item.tag] || item.tag)}</p>` : ''}
        <p>${escapeHtml(item.text)}</p>
        <dl class="rec-card__evidence">${item.evidence.map(([k, v]) => `<dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd>`).join('')}</dl>
        <p class="rec-card__impact">${item.impact ? `Potentiaali enintään <b>${escapeHtml(fmtMe(item.impact))}</b> vuodessa <span>(${escapeHtml(item.impactNote || '')})</span>` : 'Ei euromääräistä arviota'}</p>
        <a class="rec-card__link" href="${withKunta(page)}${hash ? `#${hash}` : ''}">Näytä perustelut</a>
      </div>
    </li>`;
}

let cache = null;

function renderArea(area) {
  return async (a, group) => {
    const el = byPrefix(a.id);
    // Built once per comparison group, shared by the five tabs.
    if (!cache || cache.group !== group) cache = { group, rec: buildRecommendations(group) };
    const items = (await cache.rec)[area.id];
    const total = items.reduce((s, x) => s + (x.impact || 0), 0);
    el('title').textContent = `${area.label}: ${items.length} nostoa${total ? `, potentiaali enintään ${fmtMe(total)} vuodessa` : ''}`;
    el('content').innerHTML = `
      <div class="article__body">${paragraphs([BACKGROUND[area.id]])}</div>
      <ol class="rec-cards" id="${a.id}-analysis">${items.map(cardHtml).join('')}</ol>
      ${items.some((x) => x.impact) ? figureHtml(`${a.id}-fig`, {
    title: 'Nostojen euromääräinen potentiaali', subtitle: 'M€ vuodessa, enimmäisarvio',
    source: 'Tasapaino-laskenta: Valtiokonttori, Verohallinto, Kuntaliitto, ostolaskut', body: `<bar-chart id="${a.id}-chart"></bar-chart>`
  }) : ''}
      ${area.id === 'jokeri' ? `<div class="article__body"><h2>Oletukset</h2>${paragraphs([
    `Ostolaskun käsittelykustannus ${AI_ASSUMPTIONS.invoiceCost} €/lasku, automaatio poistaa ${Math.round(AI_ASSUMPTIONS.invoiceAutomation * 100)} %.`,
    `Hallinnon ja tukipalvelujen tuottavuus +${Math.round(AI_ASSUMPTIONS.adminProductivity * 100)} %, kiinteistönhuollon säästö ${Math.round(AI_ASSUMPTIONS.facilityProductivity * 100)} %, varhaiskasvatuksen ja opetuksen työvuorosuunnittelu ${Math.round(AI_ASSUMPTIONS.educationAdmin * 100)} % henkilöstökuluista.`
  ])}</div>` : ''}
      ${summaryHtml(items[0] ? `Tärkein nosto: ${items[0].title}.` : 'Ei nostoja.')}`;
    const withImpact = items.filter((x) => x.impact);
    if (withImpact.length) {
      el('chart').setData({
        categories: withImpact.map((x) => x.title),
        series: [{ name: 'Potentiaali', values: withImpact.map((x) => x.impact) }],
        horizontal: true, valueFormat: (v) => fmtMe(v).replace(' M€', ''), filename: `${a.id}-${group.main.slug}`,
        csv: { header: ['Nosto', 'Potentiaali (€/v)', 'Peruste'], rows: withImpact.map((x) => [x.title, x.impact, x.impactNote]) }
      });
    }
  };
}

setupPage('toimenpiteet', Object.fromEntries(AREAS.map((area) => [area.id, renderArea(area)])));

// Rule-based recommendations of the balancing programme (spec:
// backend/md/pages/toimenpiteet.md). Five areas, at most five items each:
//   { title, text, evidence: [[label, value]], impact (€/year or null),
//     impactNote, href (evidence article), tag }
// Euro estimates are gaps to the size-class average or tax base × rate change;
// they are upper bounds of the potential, not budget decisions. The jokeri
// (AI) items rest on stated assumptions (AI_ASSUMPTIONS).

import {
  loadServiceComparison, loadFinancePL, loadStatutory, loadInvoices, loadInvoiceComparison,
  loadPropertyTax, loadTaxRates, loadIncomeTax, loadTasapaino, loadPyramid
} from './data.js';
import { valueOf } from './compare.js';
import { fmtEurPc, fmtMe, fmtPct, fmtEur } from './article-common.js';

export const AREAS = [
  { id: 'palveluverkko', label: 'Palveluverkko' },
  { id: 'toimintakulut', label: 'Toimintakulut ja tuotanto' },
  { id: 'investoinnit', label: 'Investoinnit ja kiinteistöt' },
  { id: 'tulot', label: 'Tulojen vahvistaminen' },
  { id: 'jokeri', label: 'Jokeri: tekoäly ja automaatio' }
];

// Assumptions of the AI estimates (shown on the page).
export const AI_ASSUMPTIONS = {
  invoiceCost: 15, // € per purchase invoice handled manually (range 10–30 €)
  invoiceAutomation: 0.6, // share of the handling cost removed by automation
  adminProductivity: 0.03, // productivity gain in administration and support services
  facilityProductivity: 0.04, // savings in property maintenance by predictive maintenance
  educationAdmin: 0.01 // share of personnel costs in early education and schools (scheduling, substitutes)
};

const PROPERTY_LABELS = { residential: 'vakituisen asunnon', general: 'yleinen (rakennusten)', land: 'maapohjan' };

function cohortOf(pyramid, from, to) {
  const y = pyramid?.years?.find((x) => x.kind === 'actual' && x.year === pyramid.actualYear);
  if (!y) return null;
  let n = 0;
  for (let a = from; a <= to; a++) n += (y.men[a] || 0) + (y.women[a] || 0);
  return n;
}

const top = (list, n = 5) => list.filter(Boolean).sort((a, b) => (b.impact ?? -1) - (a.impact ?? -1)).slice(0, n);

// Service classes of the main municipality vs the size-class average, € per resident.
export async function classGaps(group) {
  const [sc, own, statutory] = await Promise.all([loadServiceComparison(), loadFinancePL(group.main.slug), loadStatutory()]);
  const year = own?.years?.find((y) => y.year === sc.year);
  if (!year) return { list: [], sc, statutory };
  const avg = sc.averages.classes[group.main.sizeClass];
  const pop = year.population;
  const list = sc.classes.map((c) => {
    const v = year.classes[c.code];
    if (!v) return null;
    const ownCost = (v['operating-costs'] ?? 0) / pop;
    const ownIncome = (v['operating-income'] ?? 0) / pop;
    const a = avg[c.code] || {};
    const net = ownCost - ownIncome;
    const avgNet = (a['operating-costs'] ?? 0) - (a['operating-income'] ?? 0);
    return {
      code: c.code, name: c.name, status: statutory.classes[c.code]?.status ?? null,
      law: statutory.classes[c.code]?.law ?? '',
      ownCost, avgCost: a['operating-costs'] ?? 0, ownIncome, avgIncome: a['operating-income'] ?? 0,
      ownFees: (v.fees ?? 0) / pop, avgFees: a.fees ?? 0,
      ownPersonnel: (v.personnel ?? 0) / pop, avgPersonnel: a.personnel ?? 0,
      net, avgNet, gapNet: net - avgNet, gapEuros: (net - avgNet) * pop
    };
  }).filter(Boolean);
  return { list, sc, statutory, pop, year: sc.year };
}

export async function buildRecommendations(group) {
  const slug = group.main.slug;
  const y = group.year;
  const pop = valueOf(group.main, 'population', y);
  const [gaps, invoices, invoiceCmp, propertyTax, rates, incomeTax, tasapaino, pyramid] = await Promise.all([
    classGaps(group), loadInvoices(slug), loadInvoiceComparison(), loadPropertyTax(), loadTaxRates(),
    loadIncomeTax(), loadTasapaino(slug), loadPyramid(slug)
  ]);
  const v = (id, member = group.main, year = y) => valueOf(member, id, year);
  const avg = (id, year = y) => valueOf(group.classAvg, id, year);
  const bestAvg = (id, year = y) => valueOf(group.bestAvg, id, year);
  const byCode = Object.fromEntries(gaps.list.map((g) => [g.code, g]));
  const classItem = (code, title, text, href = 'palveluluokat.html#menot') => {
    const g = byCode[code];
    if (!g) return null;
    return {
      title, text,
      evidence: [[`${g.name}, nettomenot`, fmtEurPc(g.net)], ['Kokoluokan keskiarvo', fmtEurPc(g.avgNet)]],
      impact: g.gapEuros > 0 ? g.gapEuros : null,
      impactNote: g.gapEuros > 0 ? 'ero kokoluokan keskiarvoon' : 'alle keskiarvon',
      href, tag: g.status
    };
  };

  // ---------- Palveluverkko ----------
  const perPupil = (id, from, to, label, href, text) => {
    const own = v(id);
    const ref = avg(id);
    if (own == null || ref == null) return null;
    const n = cohortOf(pyramid, from, to);
    const gap = own - ref;
    return {
      title: `${label}: ${gap > 0 ? 'yksikkökustannus yli' : 'yksikkökustannus alle'} kokoluokan keskiarvon`,
      text,
      evidence: [[`${label} / ikäluokan asukas`, fmtEur(own)], ['Kokoluokan keskiarvo', fmtEur(ref)], ['Ikäluokka', `${n ?? '–'} asukasta`]],
      impact: gap > 0 && n ? gap * n : null,
      impactNote: gap > 0 ? 'ero keskiarvoon × ikäluokka' : 'tehokas tuotanto',
      href, tag: 'statutory'
    };
  };
  const networkClasses = gaps.list
    .filter((g) => ['statutory-scope', 'voluntary', 'licensed'].includes(g.status) && g.gapNet > 0 &&
      ['x3501', 'x3551', 'x3601', 'x3701', 'x3751', 'x3851', 'x3901', 'x3251', 'x3351', 'x3052', 'x3101'].includes(g.code))
    .sort((a, b) => b.gapEuros - a.gapEuros);
  const palveluverkko = top([
    perPupil('costPreschool', 6, 6, 'Esiopetus', 'palveluluokat.html#opetus',
      'Esiopetuksen kustannus 6-vuotiasta kohden on keskeinen palveluverkon mittari. Ryhmäkokojen, toimipisteiden käyttöasteen ja esiopetuksen sijoittumisen (koulu vs. päiväkoti) tarkastelu kertoo, voiko verkkoa tiivistää.'),
    perPupil('costBasic', 7, 15, 'Perusopetus', 'palveluluokat.html#opetus',
      'Perusopetuksen kustannus 7–15-vuotiasta kohden kuvaa kouluverkon tehokkuutta: pienet koulut, kuljetukset ja kiinteistöjen ylläpito nostavat yksikkökustannusta.'),
    classItem('x3021', 'Päiväkotitoiminta: verkon käyttöaste ja ryhmäkoot',
      'Päiväkotien nettomenot asukasta kohden verrattuna kokoluokkaan. Tarkastele toimipistekohtaista käyttöastetta, tilakustannuksia ja oman ja ostetun palvelun suhdetta.'),
    networkClasses[0] ? classItem(networkClasses[0].code, `${networkClasses[0].name}: toimipisteverkon tiivistäminen`,
      `Tehtävä on ${gaps.statutory.statuses[networkClasses[0].status].label.toLowerCase()}: palvelutaso ja toimipisteiden määrä ovat kunnan päätettävissä. Menot ylittävät kokoluokan keskiarvon.`) : null,
    classItem('x5352', 'Tilaverkko: tilavuokrauspalvelujen kustannukset',
      'Kunnan omistamien ja vuokraamien tilojen kustannukset asukasta kohden. Vajaakäyttöisten tilojen luopuminen ja yhteiskäyttö (koulu–kirjasto–nuorisotila) pienentävät palveluverkon kustannuksia.', 'palveluluokat.html#menot')
  ]);

  // ---------- Toimintakulut ja tuotanto ----------
  const biggest = gaps.list.filter((g) => g.gapEuros > 0 && g.status !== 'support').sort((a, b) => b.gapEuros - a.gapEuros).slice(0, 2);
  const inv = invoices?.years?.[Object.keys(invoices.years).sort().at(-1)];
  const toimintakulut = top([
    ...biggest.map((g) => classItem(g.code, `${g.name}: suurin euromääräinen ero keskiarvoon`,
      `Nettomenot asukasta kohden ylittävät kokoluokan keskiarvon eniten euroina mitattuna. ${g.status ? `Tehtävä: ${gaps.statutory.statuses[g.status].label.toLowerCase()}.` : ''} Selvitä tuotantotapa (oma/osto), henkilöstömitoitus ja palvelutaso.`)),
    v('services') != null && avg('services') != null ? {
      title: 'Palvelujen ostot: hankintojen ohjaus ja kilpailutus',
      text: 'Palvelujen ostot asukasta kohden verrattuna kokoluokkaan. Suurimpien toimittajien sopimukset, kilpailutusten kattavuus ja yhteishankinnat ovat nopeimpia säästökeinoja.',
      evidence: [['Palvelujen ostot', fmtEurPc(v('services'))], ['Kokoluokan keskiarvo', fmtEurPc(avg('services'))],
        ...(inv ? [['Kymmenen suurimman toimittajan osuus ostoista', fmtPct(100 * inv.top10Share)]] : [])],
      impact: v('services') > avg('services') ? (v('services') - avg('services')) * pop : null,
      impactNote: 'ero keskiarvoon', href: 'palveluluokat.html#kulurakenne'
    } : null,
    v('personnel') != null ? {
      title: 'Henkilöstökulut ja henkilöstömitoitus',
      text: 'Henkilöstökulut asukasta kohden. Luonnollinen poistuma, tehtävien uudelleenjärjestely ja esihenkilörakenteen keventäminen ovat keskeiset sopeuttamiskeinot ilman irtisanomisia.',
      evidence: [['Henkilöstökulut', fmtEurPc(v('personnel'))], ['Kokoluokan keskiarvo', fmtEurPc(avg('personnel'))],
        ['3 parhaan keskiarvo', fmtEurPc(bestAvg('personnel'))]],
      impact: v('personnel') > avg('personnel') ? (v('personnel') - avg('personnel')) * pop : null,
      impactNote: 'ero keskiarvoon', href: 'palveluluokat.html#henkilosto'
    } : null,
    classItem('x1101', 'Yleishallinto: hallinnon kevyempi rakenne',
      'Yleishallinnon nettomenot asukasta kohden verrattuna kokoluokkaan.', 'palveluluokat.html#menot'),
    invoiceCmp && slug === 'kangasala' ? {
      title: 'Yhteishankinnat Ylöjärven kanssa',
      text: `Kangasala ja Ylöjärvi ostavat ${invoiceCmp.sharedSuppliers} samalta toimittajalta (toimintakulutilit). Yhteiset kilpailutukset tai seudullinen hankintarengas voivat alentaa yksikköhintoja; 2–5 %:n hintaetu on tavanomainen tavoite.`,
      evidence: [['Ostot yhteisiltä toimittajilta 2023–2025, Kangasala', fmtMe(invoiceCmp.sharedSum.kangasala)]],
      impact: (invoiceCmp.sharedSum.kangasala / invoiceCmp.years.length) * 0.02,
      impactNote: 'oletus: 2 % vuotuisista yhteisostoista', href: 'palveluluokat.html#yhteiset'
    } : null
  ]);

  // ---------- Investoinnit ja kiinteistöt ----------
  const ktas = tasapaino?.tables?.KTAS?.['k-t05']?.values;
  const budgetYear = ktas ? Object.keys(ktas).sort().at(-1) : null;
  const plan = budgetYear ? ktas[budgetYear] : null;
  const cell = (row, col) => plan?.[row]?.[col] ?? null;
  const planCashflow = plan ? ['C0020', 'C0030', 'C0040'].map((c) => cell('R0380', c)).filter((x) => x != null) : [];
  const loansNow = v('loans') * pop;
  const loansPlan = cell('R0390', 'C0040');
  const disposals3 = group.years.slice(-3).map((yy) => v('disposals', group.main, yy) ?? 0);
  const ex3 = group.years.slice(-3).map((yy) => v('cashflowExDisposals', group.main, yy) ?? 0);
  const investoinnit = top([
    planCashflow.length ? {
      title: 'Investointiohjelma tulorahoituksen tasolle',
      text: `Talousarvion ja -suunnitelman mukaan toiminnan ja investointien rahavirta on ${planCashflow.map((x) => fmtMe(x)).join(', ')} vuosina ${budgetYear}–${Number(budgetYear) + 2}. Negatiivinen rahavirta katetaan lainalla. Investointikatto, joka vastaa vuosikatetta ja tavanomaisia luovutustuloja, pysäyttää velkaantumisen.`,
      evidence: [['Rahavirta yhteensä (TA+TS)', fmtMe(planCashflow.reduce((s, x) => s + x, 0))],
        ['Lainakanta nyt → suunnitelmakauden lopussa', `${fmtMe(loansNow)} → ${fmtMe(loansPlan)}`]],
      impact: -planCashflow.reduce((s, x) => s + Math.min(0, x), 0) / planCashflow.length,
      impactNote: 'keskimääräinen vuotuinen rahoitusvaje', href: 'kokonaistalous.html#talousarvio'
    } : null,
    {
      title: 'Riippuvuus kertaluonteisista luovutustuloista',
      text: 'Omaisuuden myynnit ovat parantaneet rahavirtaa, mutta toistuvaa tulorahoitusta ne eivät korvaa. Ilman luovutustuloja rahavirta on ollut selvästi negatiivinen.',
      evidence: [['Luovutustulot 3 v', fmtEurPc(disposals3.reduce((s, x) => s + x, 0))],
        ['Rahavirta ilman luovutustuloja 3 v', fmtEurPc(ex3.reduce((s, x) => s + x, 0))]],
      impact: null, href: 'kokonaistalous.html#rahavirta'
    },
    v('investments') != null ? {
      title: 'Investointitaso suhteessa kokoluokkaan',
      text: 'Investointimenot asukasta kohden. Korjausvelan hallinta edellyttää priorisointia: hankkeet, joilla on suurin vaikutus käyttötalouden kustannuksiin (tilojen yhdistäminen, energiatehokkuus), ensin.',
      evidence: [['Investoinnit', fmtEurPc(v('investments'))], ['Kokoluokan keskiarvo', fmtEurPc(avg('investments'))],
        ['Vuosikate/poistot', fmtPct(v('marginToDepreciation'))]],
      impact: v('investments') > avg('investments') ? (v('investments') - avg('investments')) * pop : null,
      impactNote: 'ero keskiarvoon', href: 'kokonaistalous.html#rahavirta'
    } : null,
    classItem('x5361', 'Maaomaisuus: tonttituotanto ja maan myynti',
      'Maaomaisuuden hallinnan nettomenot. Aktiivinen tonttituotanto ja raakamaan myynti tuovat luovutustuloja ja kasvattavat veropohjaa pitkällä aikavälillä.', 'palveluluokat.html#tulot'),
    v('groupLoans') != null ? {
      title: 'Konsernin velka ja omistajaohjaus',
      text: 'Konsernin lainakanta asukasta kohden kertoo tytäryhteisöjen ja kuntayhtymien investointien vaikutuksen. Omistajaohjauksella voi linjata yhtiöiden investointeja, osingonmaksua ja tarpeettomista omistuksista luopumista.',
      evidence: [['Konsernin lainakanta', fmtEurPc(v('groupLoans'))], ['Kokoluokan keskiarvo', fmtEurPc(avg('groupLoans'))],
        ['Kunnan oma lainakanta', fmtEurPc(v('loans'))]],
      impact: null, href: 'kokonaistalous.html#konserni'
    } : null
  ]);

  // ---------- Tulojen vahvistaminen ----------
  const code = group.main.code;
  const ptYears = Object.keys(propertyTax.municipalities[code] || {}).filter((yy) => Number(yy) < propertyTax.preliminary).sort();
  const pt = propertyTax.municipalities[code]?.[ptYears.at(-1)];
  const rateYear = String(Math.max(...Object.keys(rates.municipalities[code] || {}).map(Number)));
  const ownRates = rates.municipalities[code]?.[rateYear] || {};
  const classRate = (key) => {
    const xs = group.data.municipalities.filter((m) => m.sizeClass === group.main.sizeClass)
      .map((m) => rates.municipalities[m.code]?.[rateYear]?.[key]).filter((x) => x != null);
    return xs.reduce((s, x) => s + x, 0) / xs.length;
  };
  const propertyItem = (use, key) => {
    if (!pt?.[use]?.value || ownRates[key] == null) return null;
    const target = Math.max(ownRates[key], classRate(key));
    const gain = pt[use].value * (target - ownRates[key]) / 100;
    return {
      title: `Kiinteistövero: ${PROPERTY_LABELS[use]} veroprosentti kokoluokan tasolle`,
      text: `Nykyinen ${PROPERTY_LABELS[use]} kiinteistöveroprosentti on ${fmtPct(ownRates[key], 2)}, kokoluokan keskiarvo ${fmtPct(classRate(key), 2)}. Kiinteistövero ei vaikuta valtionosuuksien tasaukseen, joten korotus jää kokonaan kunnalle.`,
      evidence: [['Verotusarvo', fmtMe(pt[use].value)], [`Nykyinen tuotto (${ptYears.at(-1)})`, fmtMe(pt[use].tax)]],
      impact: gain > 0 ? gain : null, impactNote: 'verotusarvo × prosenttiero', href: 'verotus.html#simulaattori'
    };
  };
  const taxYear = String(Math.max(...Object.keys(incomeTax.municipalities[code] || {}).map(Number)));
  const taxable = incomeTax.municipalities[code]?.[taxYear]?.taxableEarned;
  const feeGap = gaps.list.reduce((s, g) => s + Math.max(0, g.avgFees - g.ownFees), 0);
  const tulot = top([
    propertyItem('residential', 'propertyResidential'),
    propertyItem('general', 'propertyGeneral'),
    feeGap > 0 ? {
      title: 'Maksutuotot: maksujen ja taksojen tarkistus',
      text: 'Maksutuotot palveluluokittain jäävät osin kokoluokan keskiarvosta. Tarkista asiakasmaksut, tilavuokrat ja lupamaksut sekä niiden indeksisidonnaisuus.',
      evidence: gaps.list.filter((g) => g.avgFees - g.ownFees > 0).sort((a, b) => (b.avgFees - b.ownFees) - (a.avgFees - a.ownFees))
        .slice(0, 3).map((g) => [g.name, `${fmtEurPc(g.ownFees)} vs. ${fmtEurPc(g.avgFees)}`]),
      impact: feeGap * pop, impactNote: 'ero keskiarvoon, luokat joissa alle', href: 'palveluluokat.html#tulot'
    } : null,
    taxable ? {
      title: 'Tuloveroprosentti',
      text: `Tuloveroprosentti on ${fmtPct(ownRates.income, 2)} (kokoluokan keskiarvo ${fmtPct(classRate('income'), 2)}). 0,25 %-yksikön muutos vastaa noin ${fmtMe(taxable * 0.0025)} vuodessa, mutta korkea veroprosentti heikentää muuttovetovoimaa ja on yksi arviointimenettelyn kriteereistä.`,
      evidence: [['Verotettava ansiotulo', fmtMe(taxable)], ['Efektiivinen veroaste', fmtPct(v('effectiveTaxRate', group.main, taxYear), 2)]],
      impact: ownRates.income > classRate('income') ? null : taxable * 0.0025,
      impactNote: '+0,25 %-yksikköä', href: 'verotus.html#simulaattori'
    } : null,
    v('corporateTax') != null ? {
      title: 'Elinvoima: yhteisöveropohjan kasvattaminen',
      text: 'Yhteisövero asukasta kohden kertoo yritystoiminnan veropohjasta. Yritystonttien tarjonta, nopea kaavoitus ja lupakäsittely sekä elinkeinopalvelut kasvattavat veropohjaa pitkällä aikavälillä.',
      evidence: [['Yhteisövero', fmtEurPc(v('corporateTax'))], ['Kokoluokan keskiarvo', fmtEurPc(avg('corporateTax'))]],
      impact: v('corporateTax') < avg('corporateTax') ? (avg('corporateTax') - v('corporateTax')) * pop : null,
      impactNote: 'ero keskiarvoon (pitkä aikaväli)', href: 'verotus.html#yhteisovero'
    } : null
  ]);

  // ---------- Jokeri ----------
  const A = AI_ASSUMPTIONS;
  const classPersonnel = (codes) => codes.reduce((s, c) => s + (byCode[c]?.ownPersonnel ?? 0), 0) * pop;
  const facilities = (byCode.x5352?.ownCost ?? 0) * pop;
  const jokeri = top([
    inv ? {
      title: 'Ostolaskujen käsittelyn automaatio',
      text: `Ostolaskuista ${fmtPct(100 * inv.smallInvoices.share)} on alle ${inv.smallInvoices.limit} euron laskuja. Tekoälyavusteinen tiliöinti, hankintakortit ja automaattinen täsmäytys poistavat käsityötä.`,
      evidence: [['Laskuja vuodessa', String(inv.invoices)], ['Pienlaskuja', String(inv.smallInvoices.count)],
        ['Oletus', `${A.invoiceCost} €/lasku, automaatio ${Math.round(A.invoiceAutomation * 100)} %`]],
      impact: inv.invoices * A.invoiceCost * A.invoiceAutomation, impactNote: 'oletuksiin perustuva', href: 'palveluluokat.html#ostolaskut'
    } : null,
    byCode.x1101 || byCode.x5501 ? {
      title: 'Tekoäly hallinnossa ja tukipalveluissa',
      text: 'Asiakirjojen valmistelu, tiedonhaku, neuvonta (chat) ja rutiinipäätösten esivalmistelu tekoälyllä. Tuottavuushyöty toteutuu luonnollisen poistuman kautta.',
      evidence: [['Henkilöstökulut, yleishallinto ja tukipalvelut', fmtMe(classPersonnel(['x1101', 'x5501']))],
        ['Oletus', `tuottavuus +${Math.round(A.adminProductivity * 100)} %`]],
      impact: classPersonnel(['x1101', 'x5501']) * A.adminProductivity, impactNote: 'oletuksiin perustuva', href: 'palveluluokat.html#menot'
    } : null,
    facilities ? {
      title: 'Ennakoiva kiinteistönhuolto ja energianhallinta',
      text: 'Anturidata ja tekoäly ennustavat huoltotarpeet ja ohjaavat lämmitystä ja ilmanvaihtoa käytön mukaan. Tämä pienentää energia- ja korjauskuluja.',
      evidence: [['Tilavuokrauspalvelujen ulkoiset kulut', fmtMe(facilities)], ['Oletus', `säästö ${Math.round(A.facilityProductivity * 100)} %`]],
      impact: facilities * A.facilityProductivity, impactNote: 'oletuksiin perustuva', href: 'palveluluokat.html#menot'
    } : null,
    byCode.x3021 || byCode.x3051 ? {
      title: 'Työvuorosuunnittelu ja sijaisvälitys varhaiskasvatuksessa ja opetuksessa',
      text: 'Algoritminen työvuoro- ja sijaissuunnittelu vähentää ylitöitä ja lyhytaikaisia sijaisuuksia sekä vapauttaa esihenkilöiden aikaa.',
      evidence: [['Henkilöstökulut, päiväkodit ja perusopetus', fmtMe(classPersonnel(['x3021', 'x3051']))], ['Oletus', `${Math.round(A.educationAdmin * 100)} % henkilöstökuluista`]],
      impact: classPersonnel(['x3021', 'x3051']) * A.educationAdmin, impactNote: 'oletuksiin perustuva', href: 'palveluluokat.html#opetus'
    } : null,
    {
      title: 'Tietojohtaminen: jatkuva tasapainoseuranta',
      text: 'Tämä palvelu yhdistää avoimen kuntatalousdatan, ostolaskut ja verrokit. Kuukausittainen seuranta ja poikkeamahälytykset (esim. tuplalaskut, hintapoikkeamat) tekevät tasapainotusohjelman toteutumisesta näkyvää.',
      evidence: [['Datalähteet', 'Valtiokonttori, Verohallinto, Kuntaliitto, ostolaskut']],
      impact: null, href: 'index.html'
    }
  ]);

  return { palveluverkko, toimintakulut, investoinnit, tulot, jokeri };
}

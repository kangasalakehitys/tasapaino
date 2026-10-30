# 3. Verotus (`verotus.html`, `page-verotus.js`)
CLAUDE.md:n kahdeksan näkökulmaa, kukin yleisenä tunnuslukuartikkelina (`compare-set.mjs`):

| Näkökulma | Tunnusluku | Lähde |
|---|---|---|
| Efektiivinen veroaste | `effectiveTaxRate` = maksuunpantu kunnallisvero / ansiotulot × 100 | Verohallinto 6.A |
| Efektiivisen ja nimellisen suhde | `effectiveToNominal` = efektiivinen / tuloveroprosentti × 100 | Verohallinto, Kuntaliitto |
| Kunnallisveron tuotto €/as | `municipalTax` | KKNR (tilinpäätös) |
| Verotettavat ansiotulot €/as | `earnedIncome` | Verohallinto 6.A |
| Kiinteistövero €/as | `propertyTax` | KKNR |
| Yhteisövero €/as | `corporateTax` | KKNR |
| Valtionosuudet €/as | `stateAid` | KKNR |
| Toimintatuotot / toimintakulut | `incomeToCosts` | KKNR |

Lisäksi tuloveroprosentti (Kuntaliitto). Verohallinnon tiedot ovat verovuodelta, joka on yhden vuoden tilinpäätöstä jäljessä.

## Veroprosenttisimulaattori (`<tax-simulator>`)
- Tulovero: Δ € = verotettava ansiotulo kunnallisverotuksessa (6.A, erä 9.1) × Δ %-yks.
- Kiinteistövero: Δ € = verotusarvo käyttötarkoituksittain (2.1, viimeisin lopullinen vuosi) × Δ %, kiinteistöverolain rajoissa (2024 alkaen: yleinen 0,93–2,00; maapohja 1,30–2,00; vakituinen asuinrakennus 0,41–1,00; muu asuinrakennus 0,93–2,00).
- Maapohjan ja muiden asuinrakennusten nykyinen prosentti johdetaan verosta ja verotusarvosta.
- Arvio on staattinen: veropohjan muutoksia, tilitysviivettä ja valtionosuuksien verotuloihin perustuvaa tasausta ei huomioida.

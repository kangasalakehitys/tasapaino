# Ostolaskut (`/backend/functions/ostolaskut.py`, `npm run ostolaskut`)
Lähde: `/aineisto/ostolaskut` (Kangasala 2023–2025, Ylöjärvi 2023–2025). Raakatiedostoja ei julkaista. Sivusto käyttää vain koostettua JSONia.

## Formaatit
| Tiedosto | Otsikkorivi | Summa | Tili |
|---|---|---|---|
| Kangasala 2023 | rivi 1 (`Kuntanumero…`) | `Summa (netto)` | 6-numeroinen sisäinen tili |
| Kangasala 2024 | rivi 1 (`Organisaation numero…`) | `Summa (netto)` | 6-numeroinen |
| Kangasala 2025 | rivi 1 (ei numerosaraketta) | `Summa (netto)` | 6-numeroinen |
| Ylöjärvi 2023–2025 | rivi 4 (otsikkolohko ennen) | `Tilitetty summa ALV0` | 4-numeroinen |

- Otsikkorivi tunnistetaan sarakkeesta "Toimittajan nimi", ja sarakkeet nimen osista (`COLUMNS`).
- Tili lyhennetään 4 numeroon (481001 → 4810) ja ryhmitellään Kunta-AURA-tililuettelon mukaan (`GROUPS`). Tilit 1000–2999 ovat tase- ja investointieriä (esim. lainojen lyhennykset ja Kevan maksut). Ne eivät ole ostoja, joten ne jätetään tiliryhmävertailun ja yhteisten toimittajien ulkopuolelle.
- Vuosi otetaan tiedoston tositepäivien moodista. Edellisen vuoden laskupäivät jäävät saman vuoden aineistoon.
- **Rajoitus:** Ylöjärven aineistosta on poistettu yksityishenkilöt ja toiminimet (Kuntaliiton suositus 2021), joten Ylöjärven summat ovat todellista pienemmät. Nokialta ei ole ostolaskuaineistoa.

## Tuotokset
- `/backend/output/<kunta>/ostolaskut.json` → `years.<v>.{ total, operating, invoices, suppliers, top10Share, smallInvoices, groups, monthly, topSuppliers, topAccounts, topCostCenters }` ja `supplierTrend`
- `/backend/data/ostolaskut/vertailu.json` → yhteiset toimittajat y-tunnuksen perusteella (vain toimintakulutilit)

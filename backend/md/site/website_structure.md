# Tasapaino – sivuston rakenne

Kuntatalouden tasapainotuspalvelu. Visuaalinen ilme: `brand_overview.md` ja `/frontend/brand`. Tekstien, kuvien ja grafiikoiden asettelu noudattaa Economist.com-tyyliä.

## Sivut
Sivujen ja artikkelien (välilehtien) lista on yhdessä paikassa: `/frontend/functions/pages-config.js`.
- `npm run build` kirjoittaa siitä alasivujen HTML-rungot hakemistoon `/frontend/pages` (`/backend/functions/build-pages.mjs`). Älä muokkaa sivuja käsin.
- Sivuskriptit `/frontend/functions/page-<sivu>.js` täyttävät artikkelit. Yhteinen käynnistys on tiedostossa `subpage.js`. Artikkeli piirretään vasta, kun sen välilehti avataan.
- Artikkeli, jolla on `indicator`, käyttää yleistä tunnuslukuartikkelia (`indicator-article.js`): aikasarja, viimeisin vuosi vertailujoukossa, analyysi ja taulukko. Otsikko kirjoitetaan datasta kokonaisena virkkeenä.

| Sivu | Tiedosto | Ohje |
|---|---|---|
| Etusivu | `/index.html`, `page-front.js` | `frontpage.md` |
| 1. Kokonaistalous | `kokonaistalous.html` | `pages/kokonaistalous.md` |
| 2. Palveluluokat | `palveluluokat.html` | `pages/palveluluokat.md` |
| 3. Verotus | `verotus.html` | `pages/verotus.md` |
| 4. Toimenpiteet | `toimenpiteet.html` | `pages/toimenpiteet.md` |

Kaikilla sivuilla on sama yläosa (`header.md`), alavalikko (`submenu.md`) ja alaosa (`footer.md`). Jokaisessa artikkelissa on jakonappi ja PowerPoint-nappi.

## Vertailujoukko
Jokainen kuvaaja vertaa samaa joukkoa (`/frontend/functions/compare.js`, `<peer-picker>`):
- valittu kunta (oletus Kangasala)
- kaksi valittavaa verrokkia (oletus Nokia ja Ylöjärvi; muille kunnille kaksi väkiluvultaan lähintä samasta kokoluokasta), URL-parametri `?verrokit=`
- kokoluokan keskiarvo (`brand_overview.md`, New municipality category)
- kokoluokan kolme parasta (pisteytys: `api/finance_compiler.md`); valittu kunta ja verrokit jätetään pois
- Manner-Suomen kuntien keskiarvo

## Data
Kaikki data on valmiiksi haettu hakemistoihin `/backend/data` ja `/backend/output/<kunta>` (`api/api.md`). Päivitys: `npm run update`. Raakavastaukset tallentuvat välimuistiin hakemistoon `/backend/data/raw`, joka on gitignoressa.

## GitHub Pages
Sivusto on staattinen. Etusivu on projektin juuressa, ja juuressa on `.nojekyll`. Polut muodostetaan tiedostossa `/frontend/functions/paths.js`, ja sivulinkit tehdään funktiolla `withKunta()`. Paikallisesti: `npm run serve` (http://localhost:8080/).

**Älä julkaise kansiota `/aineisto`.** Siinä on raakoja ostolaskuja ja salassa pidettäväksi merkitty asiakirja. Kansio on `.gitignore`-tiedostossa.

## Ennusteet
Palvelu ei käytä Kuukausiraportin ennustemalleja eikä niiden tuloksia. Kunnan omaa tilinpäätösennustetta (KTPE) ja talousarviota (KTAS) käytetään raportoituina lukuina.

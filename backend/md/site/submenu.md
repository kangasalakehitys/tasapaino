## Alavalikko
Create semantic Tabs Layout. Create submenu structure that behaves like tabs. To make a submenu look and act like tabs, you combine semantic HTML lists, modern CSS Grid/Flexbox, and ARIA attributes for accessibility.

### Toteutus
Komponentti `/frontend/components/site-submenu.js` (`<site-submenu label="…">`), tyylit `/frontend/styles/base.css` (`.submenu`). Käytössä alasivuilla, joilla on välilehtiä: Väestökehitys, Muuttoliike, Talous-Q ja Talous-PL. Etusivulla ei ole välilehtiä, joten siellä ei ole alavalikkoa.

- Jokainen alasivun artikkeli on `<site-submenu>`-elementin lapsi: `<article id="…" data-tab="Välilehden nimi">`. Md-tiedoston jokainen `##`-otsikko on yksi välilehti ja artikkeli.
- Ryhmät: jos artikkeleilla on `data-group="Ryhmä"`, alavalikko on kaksitasoinen. Ylärivillä ovat ryhmät ja alarivillä valitun ryhmän välilehdet. Ilman ryhmiä näytetään yksi rivi. Ryhmän valinta avaa ryhmässä viimeksi katsotun välilehden, oletuksena ensimmäisen.
- Rakenne: `<nav class="submenu">` ja sen sisällä `<ul role="tablist">`, `<li role="presentation">` ja `<a role="tab" href="#artikkeli" aria-controls aria-selected>`. Linkit toimivat myös ilman JavaScriptiä. Artikkeleilla on `role="tabpanel"` ja `aria-labelledby`.
- Näppäimistö: ←/→ siirtää saman rivin välilehtien välillä, ja Home/End siirtää rivin alkuun/loppuun (WAI-ARIA tabs). Vain valittu välilehti on sarkaimella saavutettavissa (roving tabindex).
- Osoite: välilehden valinta kirjoittaa `#artikkeli` osoitteeseen. Osoitteen `#id` voi viitata artikkeliin tai mihin tahansa sen sisällä olevaan elementtiin (esim. hakutulos `#lainakanta-taulukko`), jolloin oikea ryhmä ja välilehti valitaan.
- Mobiilissa rivit vierivät vaakasuunnassa, ja kosketusalue on vähintään 44 px.
- Paljon välilehtiä: jos valitussa ryhmässä (tai ryhmättömässä alavalikossa) on välilehtiä enemmän kuin `list-after` (oletus 8), välilehdet näytetään kahden sarakkeen linkkilistana yhden vierivän rivin sijaan. Lista täyttyy ylhäältä alas ensin vasemmassa sarakkeessa, valittu linkki merkitään vasemmalla reunaviivalla, ja ↑/↓ siirtävät myös listassa. Käytössä Talous-PL-sivun ryhmissä Palveluluokat 1–20 ja 21–40. Muilla sivuilla ryhmissä on korkeintaan viisi välilehteä, joten niissä näkyy rivi.

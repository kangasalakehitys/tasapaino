# 1. Kokonaistalous (`kokonaistalous.html`, `page-kokonaistalous.js`)
Kokonaistalouden tasapainotilanne kuntatalouden avainmittareilla ja kehitysehdotukset. Vertailu: verrokit, kokoluokka, kokoluokan kolme parasta ja maa.

## Tilannekuva
- **Tasapainon tila:** kuusi avainlukua (vuosikate/poistot, rahavirta, tilikauden tulos, kertynyt ylijäämä, lainakanta, konsernin lainakanta), hälytysmerkit (`signals()`) ja sija talouden vahvuuden pisteytyksessä.
- **Rahavirta:** CLAUDE.md:n kaava vesiputouskaaviona (`<waterfall-chart>`, KKTR):
  vuosikate + satunnaiset erät + tulorahoituksen korjauserät − investointimenot + rahoitusosuudet + luovutustulot = toiminnan ja investointien rahavirta. Tuloutukset rahastoista sisältyvät korjauseriin. Lisäksi vertailujoukon rahavirta **ilman luovutustuloja**, koska kertaluonteiset omaisuuden myynnit peittävät rakenteellisen vajeen.

## Tunnusluvut (yleinen tunnuslukuartikkeli)
Vuosikate, vuosikate/poistot, tilikauden tulos, kertynyt ylijäämä, lainakanta, toimintakate.

## Konserni ja TOLT
- **Kuntakonserni:** KKOTR-luvut ja erotus kuntaan (TOLT-vaikutus), konsernin lainakanta vertailujoukossa.
- **TOLT-yhteisöt:** tytäryhteisöosakkeet taseessa ja käsin täydennettävä yhteisötaulukko (`data/tolt.md`).

## Suunnitelma
- **Talousarvio ja ennuste:** toteuma, KTPE (kunnan oma tilinpäätösennuste) sekä KTAS (talousarvio ja kaksi suunnitelmavuotta). Rivit ovat samat KTAS:n taulukossa k-t05 ja KTPE:n taulukossa k-t25.
- **Kehitysehdotukset:** jokaisen viiden osa-alueen tärkein nosto (`recommendations.js`).

# Rajapintojen osoitekuvaukset
Tässä tiedostossa on kuvattu kaikki tietolähteet ja tarvittavat rajapintaosoitteet. Jos rajapintatieto vaatii erillistä kirjautumista ja salasanoja, toimi aina alla olevan ohjeen mukaisesti.

## Hae ensin ohjeet seuraavista paikoista, jotta osaat muodostaa rajapintayhteyden sekä maksulliseen että maksuttomaan Tilastokeskuksen aineistoon:
[Ohjeet Tilastokeskuksen rajapinnan käyttöön] (https://stat.fi/fi/palvelut/tilastodatapalvelut/avoin-data-ja-rajapinnat/tietokantojen-rajapintakaytto) Lue lisäksi ohje osoitteesta - `/backend/data/pxweb_api-ohje.pdf`

# Suomen kuntalista Tilastokeskukselta JSON-muodossa
- [Kunnat 2026](https://api.stat.fi/classificationservice/open/api/classifications/v2/classifications/kunta_1_20260101/classificationItems?content=data&meta=max&lang=fi&format=json)

# Tilastokeskuksen maksullisiin aineistoihin kirjautuminen
Hae ensin alla olevista linkeistä oikea URL-osoite. URL-osoitteet on määritelty alle. Käyttäjätunnus ja salasana syötetään tiedonhaun yhteydessä aina manuaalisesti verkkosivun kautta. Url-osoitteet maksullisiin Tilastokeskuksen aineistoihin löytyvät alla olevista linkeistä.

## Väestötilastopalvelu:

- [Väestörakenne-tietokanta](https://pxhopea2.stat.fi/PxWebLoginForm/login/ShowLogin?redirectAddress=https://pxhopea2.stat.fi:443/pxweb/pxweb/fi/&restUrl=&sessionId=80.220.239.173&dbid=Vaestorakenne&lang=fi)

- [Tulot-tietokanta](https://pxhopea2.stat.fi/PxWebLoginForm/login/ShowLogin?redirectAddress=https://pxhopea2.stat.fi:443/pxweb/pxweb/fi/&restUrl=&sessionId=80.220.239.173&dbid=Tulot&lang=fi)

- [Muuttoliike ja väestönmuutokset -tietokanta](https://pxhopea2.stat.fi/PxWebLoginForm/login/ShowLogin?redirectAddress=https://pxhopea2.stat.fi:443/pxweb/pxweb/fi/&restUrl=&sessionId=80.220.239.173&dbid=Muuttoliike_ja_vaestonmuutokset&lang=fi)

- [Kuntien ennakkotiedot -tietokanta](https://pxhopea2.stat.fi/PxWebLoginForm/login/ShowLogin?redirectAddress=https://pxhopea2.stat.fi:443/pxweb/pxweb/fi/&restUrl=/&sessionId=80.220.239.173&dbid=Kuntien_ennakkotiedot&lang=fi)

- [Elinkeinorakenne ja työssäkäynti -tietokanta](https://pxhopea2.stat.fi/PxWebLoginForm/login/ShowLogin?redirectAddress=https://pxhopea2.stat.fi:443/pxweb/pxweb/fi/&restUrl=&sessionId=80.220.239.173&dbid=Elinkeinorakenne_ja_tyossakaynti&lang=fi)

### Kuntien ennakkotiedot 2026
- [14c2 -- Väestö iän (1-v.), sukupuolen ja kielen mukaan kunnittain, 2026M01*-2026M08*](https://pxhopea2.stat.fi/PXWeb/api/v1/fi/Kuntien_ennakkotiedot/Kuntien_ennakkotiedot_2026/14c2_2026.px)

- [119e -- Väestönmuutosten ennakkotiedot tapahtumakuukauden mukaan alueittain, 2026M01*-2026M08*](https://pxhopea2.stat.fi/PXWeb/api/v1/fi/Kuntien_ennakkotiedot/Kuntien_ennakkotiedot_2026/119e_2026_vaestotilastopalvelu_8.px)

### Väestörakenne
- [12nh -- Väestö iän (1-v.), sukupuolen ja kielen mukaan kunnan osa-alueittain, 2025](https://pxhopea2.stat.fi/PXWeb/api/v1/fi/Vaestorakenne/Vaestorakenne/Vaesto_ian_ja_sukupuolen_mukaan/12nh.px)

### Muuttoliike ja väestönmuutokset
- [12pj -- Kuntaan muuttaneet iän, sukupuolen ja kielen mukaan kunnan osa-alueittain, 2010-2025](https://pxhopea2.stat.fi/PXWeb/api/v1/fi/Muuttoliike_ja_vaestonmuutokset/Muuttoliike_ja_vaestonmuutokset_aikasarja/Muuttoliike/12pj.px)

- [12pk -- Kunnasta muuttaneet iän, sukupuolen ja kielen mukaan kunnan osa-alueittain, 2010-2025](https://pxhopea2.stat.fi/PXWeb/api/v1/fi/Muuttoliike_ja_vaestonmuutokset/Muuttoliike_ja_vaestonmuutokset_aikasarja/Muuttoliike/12pk.px)

- [12pn -- Kuntien välisen muuttoliikkeen tulomuutto tulokunnan, muuttaneiden iän ja kielen mukaan lähtökunnittain, 2010-2025](https://pxhopea2.stat.fi/PXWeb/api/v1/fi/Muuttoliike_ja_vaestonmuutokset/Muuttoliike_ja_vaestonmuutokset_aikasarja/Muuttoliike/12pn.px)

- [12pr -- Maahan- ja maastamuutto muuttaneiden iän ja kielen mukaan kunnittain, 2010-2025](https://pxhopea2.stat.fi/PXWeb/api/v1/fi/Muuttoliike_ja_vaestonmuutokset/Muuttoliike_ja_vaestonmuutokset_aikasarja/Muuttoliike/12pr.px)

- [12pp -- Kuntien välisen muuttoliikkeen lähtömuutto lähtökunnan, muuttaneiden iän ja kielen mukaan tulokunnittain, 2010-2025](https://pxhopea2.stat.fi/PXWeb/api/v1/fi/Muuttoliike_ja_vaestonmuutokset/Muuttoliike_ja_vaestonmuutokset_aikasarja/Muuttoliike/12pp.px)

- [12pq -- Tulo-, lähtö- ja nettomuutto muuttaneiden iän (1-v.) mukaan kunnittain, 2010-2025](https://pxhopea2.stat.fi/PXWeb/api/v1/fi/Muuttoliike_ja_vaestonmuutokset/Muuttoliike_ja_vaestonmuutokset_aikasarja/Muuttoliike/12pq.px)

- [12pv -- Uudenmaan sisäinen muuttoliike osa-alueittain, 2010-2025](https://pxhopea2.stat.fi/PXWeb/api/v1/fi/Muuttoliike_ja_vaestonmuutokset/Muuttoliike_ja_vaestonmuutokset_aikasarja/Maakuntien sisäinen muuttoliike/12pv.px)

- [12pw -- Varsinais-Suomen sisäinen muuttoliike osa-alueittain, 2010-2025](https://pxhopea2.stat.fi/PXWeb/api/v1/fi/Muuttoliike_ja_vaestonmuutokset/Muuttoliike_ja_vaestonmuutokset_aikasarja/Maakuntien sisäinen muuttoliike/12pw.px)

- [12px -- Satakunnan sisäinen muuttoliike osa-alueittain, 2010-2025](https://pxhopea2.stat.fi/PXWeb/api/v1/fi/Muuttoliike_ja_vaestonmuutokset/Muuttoliike_ja_vaestonmuutokset_aikasarja/Maakuntien sisäinen muuttoliike/12px.px)

- [12py -- Kanta-Hämeen sisäinen muuttoliike osa-alueittain, 2010-2025](https://pxhopea2.stat.fi/PXWeb/api/v1/fi/Muuttoliike_ja_vaestonmuutokset/Muuttoliike_ja_vaestonmuutokset_aikasarja/Maakuntien sisäinen muuttoliike/12py.px)

- [12pz -- Pirkanmaan sisäinen muuttoliike osa-alueittain, 2010-2025](https://pxhopea2.stat.fi/PXWeb/api/v1/fi/Muuttoliike_ja_vaestonmuutokset/Muuttoliike_ja_vaestonmuutokset_aikasarja/Maakuntien sisäinen muuttoliike/12pz.px)

- [12q1 -- Päijät-Hämeen sisäinen muuttoliike osa-alueittain, 2010-2025](https://pxhopea2.stat.fi/PXWeb/api/v1/fi/Muuttoliike_ja_vaestonmuutokset/Muuttoliike_ja_vaestonmuutokset_aikasarja/Maakuntien sisäinen muuttoliike/12q1.px)

- [12q2 -- Kymenlaakson sisäinen muuttoliike osa-alueittain, 2010-2025](https://pxhopea2.stat.fi/PXWeb/api/v1/fi/Muuttoliike_ja_vaestonmuutokset/Muuttoliike_ja_vaestonmuutokset_aikasarja/Maakuntien sisäinen muuttoliike/12q2.px)

- [12q3 -- Etelä-Karjalan sisäinen muuttoliike osa-alueittain, 2010-2025](https://pxhopea2.stat.fi/PXWeb/api/v1/fi/Muuttoliike_ja_vaestonmuutokset/Muuttoliike_ja_vaestonmuutokset_aikasarja/Maakuntien sisäinen muuttoliike/12q3.px)

- [12q4 -- Etelä-Savon sisäinen muuttoliike osa-alueittain, 2010-2025](https://pxhopea2.stat.fi/PXWeb/api/v1/fi/Muuttoliike_ja_vaestonmuutokset/Muuttoliike_ja_vaestonmuutokset_aikasarja/Maakuntien sisäinen muuttoliike/12q4.px)

- [12q5 -- Pohjois-Savon sisäinen muuttoliike osa-alueittain, 2010-2025](https://pxhopea2.stat.fi/PXWeb/api/v1/fi/Muuttoliike_ja_vaestonmuutokset/Muuttoliike_ja_vaestonmuutokset_aikasarja/Maakuntien sisäinen muuttoliike/12q5.px)

- [12q6 -- Pohjois-Karjalan sisäinen muuttoliike osa-alueittain, 2010-2025](https://pxhopea2.stat.fi/PXWeb/api/v1/fi/Muuttoliike_ja_vaestonmuutokset/Muuttoliike_ja_vaestonmuutokset_aikasarja/Maakuntien sisäinen muuttoliike/12q6.px)

- [12q7 -- Keski-Suomen sisäinen muuttoliike osa-alueittain, 2010-2025](https://pxhopea2.stat.fi/PXWeb/api/v1/fi/Muuttoliike_ja_vaestonmuutokset/Muuttoliike_ja_vaestonmuutokset_aikasarja/Maakuntien sisäinen muuttoliike/12q7.px)

- [12q8 -- Etelä-Pohjanmaan sisäinen muuttoliike osa-alueittain, 2010-2025](https://pxhopea2.stat.fi/PXWeb/api/v1/fi/Muuttoliike_ja_vaestonmuutokset/Muuttoliike_ja_vaestonmuutokset_aikasarja/Maakuntien sisäinen muuttoliike/12q8.px)

- [12q9 -- Pohjanmaan sisäinen muuttoliike osa-alueittain, 2010-2025](https://pxhopea2.stat.fi/PXWeb/api/v1/fi/Muuttoliike_ja_vaestonmuutokset/Muuttoliike_ja_vaestonmuutokset_aikasarja/Maakuntien sisäinen muuttoliike/12q9.px)

- [12qa -- Keski-Pohjanmaan sisäinen muuttoliike osa-alueittain, 2010-2025](https://pxhopea2.stat.fi/PXWeb/api/v1/fi/Muuttoliike_ja_vaestonmuutokset/Muuttoliike_ja_vaestonmuutokset_aikasarja/Maakuntien sisäinen muuttoliike/12qa.px)

- [12qb -- Pohjois-Pohjanmaan sisäinen muuttoliike osa-alueittain, 2010-2025](https://pxhopea2.stat.fi/PXWeb/api/v1/fi/Muuttoliike_ja_vaestonmuutokset/Muuttoliike_ja_vaestonmuutokset_aikasarja/Maakuntien sisäinen muuttoliike/12qb.px)

- [12qc -- Kainuun sisäinen sisäinen muuttoliike osa-alueittain, 2010-2025](https://pxhopea2.stat.fi/PXWeb/api/v1/fi/Muuttoliike_ja_vaestonmuutokset/Muuttoliike_ja_vaestonmuutokset_aikasarja/Maakuntien sisäinen muuttoliike/12qc.px)

- [12qd -- Lapin sisäinen sisäinen muuttoliike osa-alueittain, 2010-2025](https://pxhopea2.stat.fi/PXWeb/api/v1/fi/Muuttoliike_ja_vaestonmuutokset/Muuttoliike_ja_vaestonmuutokset_aikasarja/Maakuntien sisäinen muuttoliike/12qd.px)

- [12qe -- Ahvenanmaan sisäinen sisäinen muuttoliike osa-alueittain, 2010-2025](https://pxhopea2.stat.fi/PXWeb/api/v1/fi/Muuttoliike_ja_vaestonmuutokset/Muuttoliike_ja_vaestonmuutokset_aikasarja/Maakuntien sisäinen muuttoliike/12qe.px)

# Verohallinto - vero.fi
- [Henkilöasiakkaiden tuloverotilastoja](https://www.vero.fi/tietoa-verohallinnosta/tilastot/henkiloasiakkaiden_tuloverotilastoj/)

# Tilastokeskuksen maksuttomiin aineistoihin kirjautuminen
Hae ensin alla olevista linkeistä oikea URL-osoite. URL-osoitteet on määritelty alle. 

## Syntyneet
- [12dq -- Elävänä syntyneet sukupuolen ja äidin iän (5-v.) mukaan alueittain, 1990-2025](https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/synt/12dq.px)

## Siviilisäädyn muutokset
- [121w -- Väestönmuutokset ja väkiluku alueittain, 1990-2025](https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/ssaaty/121w.px)

## Väestörakenne:
- [11re -- Väestö iän (1-v.) ja sukupuolen mukaan alueittain, 1972-2025](https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/vaerak/11re.px)

## Muuttoliike:
- [12w7 -- Väestönmuutokset kuukausittain ja alueittain, 1990M01-2025M12](https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/muutl/12w7.px)

## Väestön ennakkotilasto:
- [11lj -- Väestörakenteen ennakkotiedot alueittain](https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/vamuu/11lj.px)

- [11lk -- Väestönmuutosten ennakkotiedot alueittain, 2026Q1*-2026Q2*](https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/vamuu/11lk.px)

## Väestöennuste 2024
- [14wx -- Väestöennuste 2024: Väestö iän ja sukupuolen mukaan alueittain, 2024-2045](https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/vaenn/14wx.px)

Käytössä (`/backend/functions/fetch-pyramid.mjs`, `npm run pyramid`):
- Muuttujat: `alue_23_20240101` (kuntajako 2024, KU-koodit), `timeperiod_y`, `sukupuoli_9_20180101` (1 = miehet, 2 = naiset), `ikaryhma_10_20180101` (000–099, 100-), `contentscode` `vaesto_e24`.
- Uusin toteutunut vuosi haetaan 11re:stä samoilla sukupuoli- ja ikäluokilla, ja 14wx:stä vain sitä myöhäisemmät vuodet. Haku tehdään aluekohtaisissa osissa solurajan vuoksi.
- Tuotos: `/backend/output/<kunta>/pyramid.json` → `{ actualYear, years[{ year, kind: actual|forecast, men[101], women[101] }] }`.

# Työnvälitystilasto (KEHA-keskus)
## Työttömät tynhakijat:
[12r5 -- Työttömät työnhakijat eri ryhmissä, palveluissa olevat ja avoimet työpaikat kuukauden lopussa (1001), 2009M01-2026M08](https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/tyonv/12r5.px)

[12ti -- Työttömät työnhakijat ja avoimet työpaikat ammattiryhmän mukaan kk:n lopussa (1270), 2009M01-2026M08](https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/tyonv/12ti.px)

# Tilastokeskuksen luokitusavaimet
[Työllisyysalue](https://stat.fi/fi/luokitukset/tyollisyysalue/)

Käytössä (`/backend/functions/fetch-employment-areas.mjs`, `npm run employment-areas`; ajetaan myös `npm run flow-stock` -komennon lopuksi):
- Rajapinta: [kuntien ja työllisyysalueiden luokitusavain 2026](https://data.stat.fi/api/classifications/v2/correspondenceTables/kunta_1_20260101%23tyollisyysalue_1_20260101/maps?content=data&meta=max&lang=fi&format=json) → taulukko, jonka riveillä `sourceItem.code` = kuntakoodi ja `targetItem.code` + `targetItem.classificationItemNames[].name` = työllisyysalue (2026: 46 aluetta, 308 kuntaa).
- Tuotos: `/backend/data/employment/tyollisyysalueet.json` → `areas[{ code, name, slug, municipalities[{ code, name, slug }] }]`.
- Kuntien VVK1-virta-varantotiedot (`/backend/output/<kunta>/flow-stock.json`) summataan työllisyysalueittain → `/backend/output/tyollisyysalue-<slug>/flow-stock.json`, rakenne sama kuin kunnilla, lisäksi `municipalities` ja jaksoittain `coverage { municipalities, masked[], collapsed[] }`. Peitetyt arvot (null) jäävät summista pois; `masked` listaa kunnat, joilla jaksossa oli peitettyjä arvoja, ja `collapsed` pienet kunnat, joiden siirtymät yli 3 kk:n kestoluokkiin puuttuvat lähteestä.
- Tarkistus: alueiden alkaneiden työttömyysjaksojen summa on 99,8–100 % koko maan luvusta.

Käytössä (`/backend/functions/fetch-jobseekers.mjs`, `npm run jobseekers`):
- Muuttujat: `Alue` (KU-koodit ja SSS; ELY-alueita ei haeta), `timeperiod_m`, `contentscode`. 12r5: `TYOTTOMAT25` (alle 25-v. työttömät työnhakijat). 12ti: `Ammattiryhmä` = `SSS` (yhteensä), `TYOTTOMATLOPUSSA` ja `AVPAIKATLOPUSSA`.
- Tuotos: `/backend/output/<kunta>/jobseekers.json` → `series.{ youth, unemployed, vacancies }.monthly` (kuukausi muodossa `2026M08`).


## Virta-varanto: VVK1 Virta-varanto, työttömät työnhakijat
Lähde: https://www.tyonvalitystilasto.fi/ → Valmistilastot → Puolivuosi- ja vuositilastot → Virta-varanto -kuviot → VVK1. Sivusto on PX-Web 2008 (ASP.NET), eikä sille ole JSON-rajapintaa. Luvut luetaan Graphserverin SVG-kuvasta, jossa jokainen arvo on `<text>`-elementtinä.

Käytössä (`/backend/functions/fetch-flow-stock.mjs`, `npm run flow-stock`):
- Istunto: `GET /` → `GET /graph/style/TYO/menu.aspx` (evästeet) → `GET /graph/GraphList.aspx?Path=../REPORTS/2PUOLIVUOSI/9VIRTA-VARANTO/&...&ssid=<yymmddHHMMSS1>` → linkistä saadaan palvelimen `ssid`.
- Lomake: `GET /GRAPH/REPORT.ASPX?ma=VVK01&path=...&ssid=<ssid>&case=rt&vars=Kunta;Sukupuoli;...` (`vars` asettaa aluejaoksi Kunnan).
- Jakso: `POST` lomake `act=PRESEL`, `presel=<tlistbox1-arvo>`. Palvelin vaihtaa jakson ja palauttaa uuden lomakkeen, jonka `values1`-listan `title` on kuntakoodi (KOKO MAA = tyhjä title). Listan pituus vaihtelee jaksoittain, joten kunta haetaan aina koodilla.
- Haku: `POST` lomake `act=SETQR`, `values1=<kunta>`, `values2`–`values9` = 1 (yhteensä, käyttökieli Suomi), `pxkonv=svg` → `GET /Graph/Gserver.aspx?mimetype=svg&mtype=flow&ssid=<ssid>&ifile=../REPORTS/2PUOLIVUOSI/9VIRTA-VARANTO/VVK01&x=1500&y=800`.
- HUOM: Noden oletusotsake `Accept-Language: *` kaataa ASP.NET-sivut (HTTP 500), joten käytä `Accept-Language: fi`.
- SVG:n rakenne: alkaneet (x=140, y=448), päättyneet `yht:` sekä 5 kestoluokkaryhmää (alle 3 kk, 3–6, 6–12, 12–24, 24+). Jokainen ryhmä alkaa tekstillä "Työttömyyden kesto". Ryhmän sisällä keskim. varanto on kohdassa y=444, siirtymä seuraavaan luokkaan y=496, päättyneet y=552 ja poistumat y=660/680.8 (Palveluihin, Avoimille työmarkkinoille, Työvoiman ulkopuolelle, Muut syyt). Peitetty arvo (peittosääntö) näkyy merkkinä `...` → `null`. Pienissä kunnissa kaikki ryhmät piirretään samaan x-kohtaan, jolloin vain ensimmäisen ryhmän siirtymä on luotettava (`collapsed: true`).
- Tuotos: `/backend/output/<kunta>/flow-stock.json` → `periods[]` (`2026H1`, `2025Y`, …; H1 = tammi–kesäkuu, Y = tammi–joulukuu) → `started`, `ended`, `stages[]` (taulukko: `avgStock`, `toNext`, `ended`, `exits`) ja `links[]` (alluvial/sankey: `source`, `target`, `value`).

# Geoserver-Stat
- Käy lukemassa ohje kartta-aineistojen lataukseen url-osoitteesta https://stat.fi/media/uploads/org/avoindata/kartta-aineistojen_lataus_url-osoitteen_kautta_ohje.pdf

Kunta- ja maakuntarajat 2026 (käytössä kartoissa):
- WFS `https://geo.stat.fi/geoserver/tilastointialueet/wfs`, tasot `tilastointialueet:kunta1000k_2026` ja `tilastointialueet:maakunta1000k_2026` (GeoJSON, EPSG:4326)
- Haku: `npm run maps` (`/backend/functions/fetch-maps.mjs`) → `/backend/data/maps/kunnat2026_topo.json` (TopoJSON, objekti `Kunnat2026_geo`, ominaisuudet `kunta`, `nimi`, `maakunta`, `nimi_2`)
- Kuntatasolla ei ole maakuntakoodia, joten kunnan maakunta päätellään maakuntatasosta kunnan sisäpisteiden perusteella.

Rajapintaosoitteet, kansalliset aineistot
https://geo.stat.fi/geoserver/vaestoalue/wms
https://geo.stat.fi/geoserver/vaestoalue/wfs

Paavo – Postinumeroalueittainen avoin tieto
https://geo.stat.fi/geoserver/postialue/wms
https://geo.stat.fi/geoserver/postialue/wfs

Tilastoruudukko 1 km x 1 km
https://geo.stat.fi/geoserver/tilastointialueet/wms
https://geo.stat.fi/geoserver/tilastointialueet/wfs

Tilastoruudukko 5 km x 5 km
https://geo.stat.fi/geoserver/tilastointialueet/wms
https://geo.stat.fi/geoserver/tilastointialueet/wfs

Väestöruutuaineisto 1 km x 1 km
https://geo.stat.fi/geoserver/vaestoruutu/wms
https://geo.stat.fi/geoserver/vaestoruutu/wfs

Väestöruutuaineisto 5 km x 5 km
https://geo.stat.fi/geoserver/vaestoruutu/wms
https://geo.stat.fi/geoserver/vaestoruutu/wfs

Tieliikenneonnettomuudet
https://geo.stat.fi/geoserver/tieliikenne/wms
https://geo.stat.fi/geoserver/tieliikenne/wfs

Oppilaitokset
https://geo.stat.fi/geoserver/oppilaitokset/wms
https://geo.stat.fi/geoserver/oppilaitokset/wfs

# Avoin data
Suomi.fi-avoindata on vuonna 2014 perustettu Digi- ja väestötietoviraston tuottama avoimen datan (tiedon) portaali ja datakatalogi. Sen avulla Suomen julkinen hallinto voi avata ja julkaista avointa tietoa muiden hyödynnettäväksi keskitetysti yhden palvelun avulla.
Avoindata-palvelu muodostaa Suomessa saatavilla olevan, ensisijaisesti julkisen hallinnon avoimen datan hakemiston. Avoindata-palveluun kuvattujen avoimien tietoaineistojen kohderyhminä ovat muun muassa kansalaiset, yritykset ja viranomaiset. Palvelussa julkaistuja tietoaineistoja voi hakea rajapintojen kautta julkaistavaksi esimerkiksi digitaalisissa palveluissa, kuten verkkosivuilla ja sovelluksissa, taikka hyödyntää muutoin haluamallaan tavalla.

## Kelasto `https://avoindata.suomi.fi/data/fi/dataset/kunnan-osarahoittaman-tyottomyysturvan-saajat-ja-maksetut-etuudet-kunnittain`
Tämä tietoaineisto liittyy Kelan tilastotietokanta Kelaston dynaamiseen raporttiin Kunnan osarahoittaman työttömyysturvan saajat ja maksetut etuudet. Aineistossa on tiedot kuntien osarahoittamasta työttömyysturvasta kunnittain. Rahoittava kunta on työttömän asuinkunta työttömyysetuuden maksupäivänä, ja aluejako on laskutuskuukauden mukainen. Tiedot ovat 1.1.2025 alkaen. Tiedot päivittyvät kuukausittain 20. päivään mennessä.

Kunnat osallistuvat ansiopäivärahan, peruspäivärahan ja työmarkkinatuen rahoitukseen. Kuntien rahoitusosuus kasvaa portaittain työttömyyden pitkittyessä. Aineistossa on tiedot vain siitä työttömyysturvasta, jota kunnat ovat rahoittaneet.
Sama etuuden saaja on voinut saada etuutta useammasta kunnasta, joten koko Suomen saajamääriä ei voi summata tästä aineistosta. Koko Suomen luvut ovat aineistossa ”Kunnan osarahoittaman työttömyysturvan saajat ja maksetut etuudet koko maa”.
Sama saaja on voinut kuulua kuukauden aikana useampaan kertymäpäiväluokkaan. Jos halutaan saaja ja maksut yhden kerran, pitää aineisto rajata Yhteensä-arvolla.

Käytössä (`/backend/functions/fetch-employment.mjs`, `npm run employment`):
- Aineiston osoite haetaan joka kerta CKAN-rajapinnasta: `https://avoindata.suomi.fi/data/api/3/action/package_show?id=kunnan-osarahoittaman-tyottomyysturvan-saajat-ja-maksetut-etuudet-kunnittain` → resurssi `data.csv` (noin 180 Mt), joka luetaan virtana.
- Sarakkeet: `aikatyyppi` (Kuukausi | Vuosikertymä), `vuosikuukausi` (esim. 202608), `kunta_nro` (kolminumeroinen, sama kuin `/backend/data/kunnat.json`), `kunta_nimi`, `ikaryhma`, `sukupuoli`, `etuus`, `kertymaluokka` (101-200, 201-300, 301-400, 401-700, 701-, Yhteensä), `saaja_lkm`, `maksettu_eur`, `maksettu_kuntaosuus_eur`.
- Ikäryhmillä ja sukupuolella ei ole Yhteensä-riviä, joten ne summataan. Etuuksien sarjat rajataan kertymäluokkaan Yhteensä ja kertymäluokkien sarjat etuuteen Yhteensä.
- Etuudet: Ansiopäiväraha, Peruspäiväraha, Työmarkkinatuki ja 5/2026 alkaen Yleistuki työttömyyden perusteella, joka korvaa peruspäivärahan ja työmarkkinatuen. Siksi yleistuki on mukana omana sarjanaan, jotta etuudet summautuvat Yhteensä-arvoon.
- Tuotokset: `/backend/output/<kunta>/employment.json` → `series.<id>.{ monthly, ytd }` (id: `total`, `earnings`, `basic`, `labour-market`, `general`, `days-101-200` … `days-701`; kuukausi muodossa `2026M08`) ja `recipients` (saajat yhteensä kuukausittain). Lisäksi `/backend/data/employment/employment-latest.json` sisältää kaikkien kuntien viimeisimmän vuosikertymän ja väkiluvun edellisen vuoden lopussa vertailua varten.


# Y-tunnukset
- Käy hakemassa y-tunnukset yri­tys- ja yh­tei­sö­ha­ku https://www.ytj.fi/
- PRH:n avoin YTJ-rajapinta (avoindata.prh.fi) ei sisällä kuntia, joten kuntien y-tunnukset ylläpidetään käsin tiedostossa `/backend/data/finance/ytunnukset.json` (`code`, `name`, `slug`, `ytunnus`). Pohja on haettu Wikidatasta (kuntanumero P1203, y-tunnus P12980). Manner-Suomen tunnukset on tarkistettu Valtiokonttorin KKNR-aineistosta. Ahvenanmaan kunnat raportoivat omalla AKKNR-kokonaisuudellaan. Jos tunnus puuttuu (`"ytunnus": null`), kunta ohitetaan, ja hakuskripti varoittaa siitä.

# Tutkihallintoa
- Käy lukemassa Kunta-AURA ─ talousraportoinnin käsikirja sekä tililuettelot, palveluluokitukset, sanasto ja muut talousraportoinnin ohjeet osoitteesta https://www.valtiokonttori.fi/maaraykset-ja-ohjeet/kuntien-ja-kuntayhtymien-automaattisen-talousraportoinnin-kasikirja-aura/
- Käy lukemassa Kuntatalouden taksonomiat
- Käy lukemassa rajapintaohjeet: https://avoindata.tutkihallintoa.fi/info
- Tietojen haku rest-rajapinnasta: https://www.valtiokonttori.fi/maaraykset-ja-ohjeet/tietojen-haku-rest-rajapinnasta/#ff438712

- Taloustietojen haun osoite: https://prodkuntarest.westeurope.cloudapp.azure.com/

Käytössä (`/backend/functions/fetch-finance.mjs`, `npm run finance` → `/backend/output/<kunta>/finance.json`):
- Aineistolista: `https://prodkuntarest.westeurope.cloudapp.azure.com/rest/v1/json/aineistot` (ytunnus, raportointikokonaisuus, raportointikausi, hyvaksymisvaihe, tunnusluvut-URL)
- Dokumentti: `.../rest/v1/json/dokumentti/<vaihe>/<KKNR|KTAS>/<ytunnus>/<kausi>` → rivit `{ tunnusluku, arvo, osakokonaisuus }`
- Samasta kaudesta käytetään viimeisintä hyväksyntävaihetta: Alustava < Lopullinen < Jälkikorjattu.
- `tunnusluku` on taksonomian DatapointID. Selitteet ovat taksonomiapaketissa (avoindata.fi, KT27082021: `Kenttatunnukset`-tiedosto ja taulukkomallit).

Tilikauden ylijäämä (alijäämä), mittari md103 × pääkategoria MCY x77:
- KKNR `1447`: neljännesvuosiraportointi (k-t07, tili 8800), koko kunta ilman vastapuolijakoa. Kaudet `YYYYC03/C06/C09/C12` ovat kumulatiivisia vuoden alusta, ja ne tallennetaan muodossa `YYYYQ1–Q4`.
- KTAS `1098`: talousarvio raportointivuodelle (k-t05, sarake C0020). Muut sarakkeet: 954 = edellisen vuoden talousarvio, 1540 ja 1524 = taloussuunnitelmavuodet +1 ja +2.
- Huom! Kauden 2022C03 KKNR-taksonomian summahierarkiassa on virhe korkokuluissa, ja se vaikuttaa tilikauden ylijäämään.

Talous-Q:n muut tunnusluvut (`finance.json` → `series.<id>`, `{ quarterly, budget, stock? }`). Tunnukset on poimittu taulukkomalleista (avoindata.fi, `hkt20260602.zip`: `taulukkomalli-KKNR_2024-v15`, `taulukkomalli-KTAS_2019-v11`). KKNR-arvot ovat sarakkeesta x01 (Ulkoiset), joka vastaa tilinpäätöksen ulkoisia lukuja. Tunnukset ovat samat kaikissa taksonomiaversioissa vuodesta 2021, paitsi toimintakate, jota vuoden 2021 taksonomiassa ei ole.

| id | Tunnusluku | KKNR | KTAS (C0020) |
|---|---|---|---|
| `operating-income` | Toimintatuotot | 3319283 | 16 |
| `operating-costs` | Toimintakulut | 3418067 | 632 |
| `personnel` | 4000–4299 Henkilöstökulut | 1562 | 473 |
| `services` | 4300–4499 Palvelujen ostot | 699 | 15 |
| `materials` | 4500–4699 Aineet, tarvikkeet ja tavarat | 683 | 4 |
| `grants` | 4700–4799 Avustukset | 3432179 | 627 |
| `other-costs` | 4800–4995 Muut toimintakulut | 3446291 | 561 |
| `operating-margin` | Toimintakate (2021: toimintatuotot 3319283 + valmistevarastojen muutos 1139 + valmistus omaan käyttöön 1599 − toimintakulut 3418067) | 5752390 | 545 |
| `taxes` | 5000–5499 Verotulot | 3460403 | 584 |
| `municipal-tax` | 5000 Kunnan tulovero | 3474515 | – |
| `property-tax` | 5100 Kiinteistövero | 94279 | – |
| `corporate-tax` | 5200 Osuus yhteisöveron tuotosta | 3502739 | – |
| `state-aid` | 5500–5899 Valtionosuudet | 3530963 | 1157 |
| `interest` | 6200–6299 Korkokulut | 556 | – |
| `loans` | Lainakanta = pitkäaikainen korollinen vieras pääoma (2400–2439, k-t09) + lyhytaikainen korollinen vieras pääoma (2500–2539); tase-erä, `stock: true` | 4362557 + 4363646 | 1580 (lainakanta 31.12.) |
| `interest-rate` | Korkokulut per lainakanta, %: (korkokulut / neljännesten määrä × 4) / lainakanta; johdettu, `stock: true` | – | – |



## TalousPL: tilinpäätöstiedot palveluluokittain (KKTPP)
Käytössä (`/backend/functions/fetch-finance-pl.mjs`, `npm run finance-pl`):
- Dokumentti: `.../rest/v1/json/dokumentti/<vaihe>/KKTPP/<ytunnus>/<vuosi>`. Yksi dokumentti on noin 8 Mt. Haetaan kolme viimeisintä vuotta (`YEARS`), ja samasta vuodesta käytetään viimeisintä hyväksyntävaihetta.
- Tuloslaskelma palveluluokittain on osakokonaisuudessa `k-t08`. Arvot ovat sarakkeesta x01 (Ulkoiset), sillä sarake x0 (yhteensä) ei ole avoimessa datassa.
- DatapointID:t ovat palveluluokkakohtaisia. Ne on poimittu taulukkomallista `taulukkomalli-KKTPP_2026-v15` (avoindata, `hkt20260602.zip`) tiedostoon `/backend/data/finance/kktpp-datapoints.json` (`classes.<xKoodi>.items.<erä>`). Tunnukset ovat samat myös vuoden 2021 mallissa. Koko kunta on x0: toimintakulut 3418067 ja toimintatuotot 3319283, samat kuin KKNR:ssä.
- Osa alaluokista julkaistaan tietosuojan vuoksi vain summatasolla (esim. x5560 Lomitus- ja maaseutupalvelut yhteensä). Vertailussa käytetään siksi `finance_compiler.md`-listan julkaisutason luokkia (`COMPARISON_CLASSES`), joiden summa on kunnan toimintakulut yhteensä. Skripti varoittaa, jos ero on yli 1 %.
- Vuosien 2021–2022 sote-luokat kuuluvat vanhaan taksonomiaan, joten ne eivät ole vertailukelpoisia uusien luokkien kanssa.

Tuotokset:
- `/backend/data/finance/kktpp-classes.json` → 40 suurinta palveluluokkaa (`TOP_CLASSES`) kaikkien kuntien ulkoisten toimintakulujen mukaan viimeisimmältä vuodelta: `classes[{ code, rank, name, slug, total }]`. `slug` on välilehden id.
- `/backend/output/<kunta>/finance-pl.json` → `years[{ year, stage, population, classes: { x0, <40 luokkaa>: { <erä>: euroa } } }]`. Aiemmista vuosista puuttuu osa luokista (vanhemmat koodit), jolloin luokan arvot ovat `null`.
- `/backend/data/finance/kktpp-external-costs.json` → ulkoiset toimintakulut kaikista kunnista palveluluokittain viimeisimmältä vuodelta (`classes`, `municipalities[{ slug, name, population, values }]`). Väkiluku luetaan tiedostosta `/backend/output/<kunta>/population.json` (vuoden lopussa).

# Tasapaino: Valtiokonttorin raportointikokonaisuudet
Yhteinen asiakas: `/backend/functions/lib/tutkihallintoa.mjs`. Se hakee aineistolistan (välimuisti 24 h), valitsee viimeisimmän hyväksyntävaiheen ja tallentaa dokumentit muodossa `id → arvo` hakemistoon `/backend/data/raw/docs` (gitignore).

DatapointID-kartat: `npm run datapoints` lukee taulukkomallit paketista `hkt20260602.zip` (avoindata.fi, sbr-taksonomia → "Kuntien ja hyvinvointialueiden taloustietopalvelun raportointikokonaisuudet ja tietokenttien määritykset"). Pura paketti hakemistoon `/backend/data/raw/taxonomy/hkt/x`. Tuotos: `/backend/data/finance/datapoints/<SET>.json` → `tables.<taulukko>.rows[{ code, label, ids: { C0010|x0|x00|x01: DatapointID } }]`. DatapointID:t ovat yksilöllisiä koko taksonomiassa.

`npm run tasapaino` (`fetch-tasapaino.mjs`) → `/backend/output/<kunta>/tasapaino.json`:
| Kokonaisuus | Kaudet | Käyttö |
|---|---|---|
| KKNR | `YYYYC12` (tilinpäätös) + kuluvan vuoden viimeisin | tunnusluvut `lib/metrics.mjs` (sarake x01 = ulkoiset) |
| KKTR k-t02 | 2021– | rahoituslaskelma, toiminnan ja investointien rahavirta R0090 |
| KKOTR kk-t01–03 | 2021– | konsernin tuloslaskelma, rahoituslaskelma, tase |
| KTAS k-t05 | 2021– | talousarvio C0020, suunnitelma C0030/C0040 |
| KTPE k-t25 | 2021– | tilinpäätösennuste |
| TOTT k-t16.* | 3 viimeisintä | esi-, perus-, aamu- ja iltapäivä- sekä lukio-opetuksen kulut |

Saatavuus (aineistolista 10/2026): KKNR, KKTR, KKOTR, KKTPA, KTPE, TOTT, KKYTT ja KKTPP ovat saatavilla kaikilta Manner-Suomen kunnilta 2021–2025. TOLTA ja TOLTB eivät ole avoimessa listassa. KLTR/KLTPA raportoidaan vain kunnilta, joilla on liikelaitoksia (Kangasala, Nokia ja Ylöjärvi eivät raportoi). Ahvenanmaa raportoi AKKNR-kokonaisuutena, joten se puuttuu vertailusta. KTAS:n tuloveroprosenttirivi (R0410) on useimmilta kunnilta tyhjä, joten veroprosentit haetaan Kuntaliitosta.

# Verohallinto (PX-Web)
Rajapinta: `https://vero2.stat.fi/PXWeb/api/v1/fi/Vero/`. `npm run tax` (`fetch-tax.mjs`):
- `Henkiloasiakkaiden_tuloverot/lopulliset/alue/alue_999.px` (6.A, tuoreimman vuoden aluejako): erät HVT_TULOT_60 (veronalaiset tulot), HVT_TULOT_70 (ansiotulot), HVT_TULOT_1030 (verotettava ansiotulo kunnallisverotuksessa), HVT_VEROT_60 (kunnallisvero), HVT_TULOT_20 N (verovelvolliset) → `/backend/data/tax/tuloverot.json`
- `Kiinteistoverot/kive_201.px` (2.1): käyttötarkoitukset SSSSSS, 2 (vakituinen), 3 (muu asuin), 7 (yleinen rakennus), 11 (maapohja), 13 (rakentamaton), tiedot Arvo_vero ja Arvo_verotusarvo → `/backend/data/tax/kiinteistovero.json`. Viimeisin vuosi on ennakkotieto.

# Kuntaliitto: veroprosentit
Sivu https://www.kuntaliitto.fi/talous-ja-elinvoima/verotus/kuntien-veroprosentit. Kuntakohtaiset xlsx-tiedostot 2021–2026 ladataan hakemistoon `/backend/data/raw/kuntaliitto/<vuosi>.xlsx`. `npm run tax-rates` (`tax_rates.py`) → `/backend/data/tax/veroprosentit.json` (tulovero, yleinen ja vakituisen asunnon kiinteistövero). Tiedostojen sarakeasettelu vaihtelee vuosittain; jäsennin parittaa vuosisarakkeiden ryhmät otsikoihin järjestyksessä.

# Ostolaskut ja lakisääteiset tehtävät
`npm run ostolaskut` (`ostolaskut.py`, ohje `data/ostolaskut.md`) ja `/backend/data/lakisaateiset.json` (`data/lakisaateiset.md`).

# Vertailu
`npm run compare` (`compare-set.mjs`) → `/backend/data/tasapaino/vertailu.json` (tunnusluvut, kokoluokkien ja maan keskiarvot, pisteytys) ja `/backend/data/tasapaino/palveluluokat.json` (KKTPP-palveluluokat €/as ja keskiarvot). Laskentasäännöt: `finance_compiler.md`.

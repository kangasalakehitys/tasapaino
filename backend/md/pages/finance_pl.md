# TalousPL
TalousPL sivulla on kerätty tilinpäätöstiedot palveluluokkakohtaisesti. Palveluluokkakohtaisiin tunnuslukuihin vaikuttavat kunkin organisaation tavat järjestää ja tuottaa palveluita alueensa asukkaille ja yhteisöille. Tuottojen ja kustannusten kohdentamiseen palveluluokille voidaan käyttää myös useita eri menetelmiä, joka voi näkyä tilitasoisen tiedon eroina tietoja vertailtaessa.

Kuntien y-tunnukset ovat tiedostossa `/backend/data/finance/ytunnukset.json` (ohjeet `/backend/md/api/api.md`), ja niillä haetaan kunnan talousdata tutkihallintoa.fi-palvelusta. Rajapintahaut ja käytetyt tunnusluvut (DatapointID) on kuvattu tiedostossa `/backend/md/api/api.md`.

Käy lukemassa ohjeistus `/backend/md/api/finance_compiler.md` kuntatalouden yleistä ohjeistusta

Seuraavassa alla luodaan rakenne sivulle. Tee sivun rakenne seuraavasti. Alaotsikko merkintä-## kuvaa uuden artikkelin alkua ja uutta välilehteä (tabpanel) sisältöpaneeliin (tab-content). Numerot ovat aina artikkelin sisällä omia osioitaan. Lue alavalikon muodostamiseen ohjeet ja sisältöpaneelin muodostaminen `submenu.md`

Tarkista valitun kunnan kuntakategoria väestön koon suhteen `/backend/md/site/brand_overview.md` New municipality category

## Luo välilehti ja artikkeli - Ulkoiset toimintakulut

Näitä 40 suurinta palveluluokkaa kahdessa eri Cleveland dot plot - osiossa. Yhteen osioon tulee siis 20 palveluluokkaa.

1. Cleveland dot plot - osio
Data:
- Kunnan ja kuntayhtymien tilinpäätöstiedot palveluluokkakohtaisesti (KKTPP)

Muuttujat:
- x-akseli: Arvo
- y-akseli: Palveluluokat
- Kunta: oletuskunta lue `/backend/md/site/header.md`
- Tiedot: Ulkoiset toimintakulut vertailu palveluluokittain `/backend/md/api/finance_compiler.md` . Näytä arvot ja euroa per asukas
- Legenda: Muodosta neljä marker tyyppiä. Vertaa valittua kuntaa (main marker), saman kokoluokan kuntien keskiarvoon (New municipality category - main marker), Manner-Suomen kuntien keskiarvoon (main marker) ja muihin kuntiin (sub-markers) 

2. Luo analyysi tiedoista - osio
3. Luo taulukko luvuista.
4. Tee lyhyt yhteenveto kappaleeksi kokonaisuudesta viivadiagrammi, analyysi ja taulukko - osio.

## Luo välilehti ja artikkeli
Tee seuraavaksi erittely palveluluokittain (40 suurinta jaettuna kahteen osaan. Osassa aina 20) ja luo aina uusi välilehti jokaisesta palveluluokasta. Näytä palveluluokat alavalikossa linkkilistoina kahdessa sarakkeessa, koska linkkejä on paljon. Lue palveluluokat (KKTPP) osoitteesta`/backend/md/api/finance_compiler.md`

Tarkasteltavat tunnusluvut:

1. Vaaka pylväsdiagrammi Toimintatuotot - osio
Data:
- Kunnan ja kuntayhtymien tilinpäätöstiedot palveluluokkakohtaisesti (KKTPP)
- Toimintatuotot

Muuttujat:
- x-akseli: Arvot
- y-akseli: Toimintatuotot eriteltynä.
- Kunta: oletuskunta lue `/backend/md/site/header.md`
- Tiedot: 
- Toimintatuotot
    - Myyntituotot
    - Maksutuotot
    - Tuet ja avustukset
    - Muut toimintatuotot
    - Valmistevarastojen muutos + (-)
        - Valmiiden ja keskeneräisten tuotteiden varastojen lisäys (vähennys)
    - Valmistus omaan käyttöön

- Legenda: Tunnusluvut

2. Vertailu vuositasolla
3. Luo analyysi tiedoista - osio
4. Luo taulukko luvuista ja vertaile vain kahta viimeisintä vuotta.
5.  Tee lyhyt yhteenveto kappaleeksi kokonaisuudesta pylväsdiagrammi, analyysi ja taulukko - osio.


6. Vaaka pylväsdiagrammi Toimintakulut - osio
Data:
- Kunnan ja kuntayhtymien tilinpäätöstiedot palveluluokkakohtaisesti (KKTPP)
- Toimintakulut

Muuttujat:
- x-akseli: Arvot
- y-akseli: Toimintakulut eriteltynä.
- Kunta: oletuskunta lue `/backend/md/site/header.md`
- Tiedot: 
- Toimintakulut
    - Henkilöstökulut
    - Palvelujen ostot
        - Asiakaspalvelujen ostot
        - Muiden palvelujen ostot
    - Aineet, tarvikkeet ja tavarat
        - Varastojen lisäys/vähennys
    - Avustukset
        - Osittainen ja joustava hoitoraha
    - Muut toimintakulut

- Legenda: Tunnusluvut

7. Vertailu vuositasolla
8. Luo analyysi tiedoista - osio
9. Luo taulukko luvuista ja vertaile vain kahta viimeisintä vuotta.
10.  Tee lyhyt yhteenveto kappaleeksi kokonaisuudesta pylväsdiagrammi, analyysi ja taulukko - osio.

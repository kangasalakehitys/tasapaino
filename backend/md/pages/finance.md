# TalousQ
TalousQ sivulla on kerätty kuntatalouden neljännesvuosivertailua ja analysoidaan taloutta eri näkökulmista: tulos, toimintakate ja -kulut, kulurakenne, verotulot, valtionosuudet, toimintatuotot, lainakanta ja korkokulut.

Kuntien y-tunnukset ovat tiedostossa `/backend/data/finance/ytunnukset.json` (ohjeet `/backend/md/api/api.md`), ja niillä haetaan kunnan talousdata tutkihallintoa.fi-palvelusta. Rajapintahaut ja käytetyt tunnusluvut (DatapointID) on kuvattu tiedostossa `/backend/md/api/api.md`.

Käy lukemassa ohjeistus `/backend/md/api/finance_compiler.md` kuntatalouden yleistä ohjeistusta

Yhteiset säännöt kaikille välilehdille:
- KKNR:n tuloslaskelman erät ovat kertymiä vuoden alusta (Q1, Q1–Q2, ...), joten neljännestä verrataan edellisvuoden samaan neljännekseen. Tase-erät (lainakanta) ovat tilanne neljänneksen lopussa.
- Y-akselin yksikkö on valittavissa: milj. euroa tai euroa asukasta kohden (väkiluku edellisen vuoden lopussa).
- Vertailu: edellisvuoden sama neljännes sekä saman vuoden talousarvio (KTAS) katkoviivana, jos talousarviossa on vastaava rivi.
- Toimintakate esitetään sellaisenaan (yleensä negatiivinen, eli nettomenot, jotka rahoitetaan verotuloilla ja valtionosuuksilla).

Välilehdet ryhmitellään alavalikossa (`/backend/md/site/submenu.md`, artikkelin `data-group`):
- Tulos: Tilikauden ali- ja ylijäämä, Toimintakate
- Kulut: Toimintakulut, Kulurakenne, Henkilöstökulut, Palvelujen ostot
- Tulot: Verotulot, Kunnallisvero, Yhteisövero, Kiinteistövero, Valtionosuudet, Toimintatuotot
- Velka: Lainakanta, Korkokulut per lainakanta

Seuraavassa alla luodaan rakenne sivulle. Tee sivun rakenne seuraavasti. Alaotsikko merkintä-## kuvaa uuden artikkelin alkua ja uutta välilehteä (tabpanel) sisältöpaneeliin (tab-content). Numerot ovat aina artikkelin sisällä omia osioitaan. Lue alavalikon muodostamiseen ohjeet ja sisältöpaneelin muodostaminen `submenu.md`

## Luo välilehti ja artikkeli - Tilikauden ali- ja ylijäämä

1. Viivadiagrammi - osio
Data:
- talousarvio ja -suunnitelma (KTAS)
- neljännesvuosiraportointi (KKNR)

Muuttujat:
- x-akseli: Vuosi ja kvartaali
- y-akseli: Arvo
- Kunta: oletuskunta lue `/backend/md/site/header.md`
- Tiedot: Tilikauden yli- ja alijäämä
- Legenda: Vertaa saman vuoden talousarvioon

2. Lisää diagrammiin ennustemalli (Ennustemallin lisääminen) ja ennustemallin valinta `/backend/md/models/models.md`. Valitse dataan sopiva ennustemalli.
3. Luo analyysi tiedoista - osio
4. Luo taulukko luvuista.
5. Tee lyhyt yhteenveto kappaleeksi kokonaisuudesta viivadiagrammi, analyysi ja taulukko - osio.

## Luo välilehti ja artikkeli - Toimintakate

1. Viivadiagrammi - osio
Data:
- talousarvio ja -suunnitelma (KTAS)
- neljännesvuosiraportointi (KKNR)

Muuttujat:
- x-akseli: Vuosi ja kvartaali
- y-akseli: Arvo
- Kunta: oletuskunta lue `/backend/md/site/header.md`
- Tiedot: Toimintakate
- Legenda: Vertaa edellisvuoden tilanteeseen

2. Lisää diagrammiin ennustemalli (Ennustemallin lisääminen) ja ennustemallin valinta `/backend/md/models/models.md`. Valitse dataan sopiva ennustemalli.
3. Luo analyysi tiedoista - osio
4. Luo taulukko luvuista.
5. Tee lyhyt yhteenveto kappaleeksi kokonaisuudesta viivadiagrammi, analyysi ja taulukko - osio.

## Luo välilehti ja artikkeli - Toimintakulut

1. Viivadiagrammi - osio
Data:
- talousarvio ja -suunnitelma (KTAS)
- neljännesvuosiraportointi (KKNR)

Muuttujat:
- x-akseli: Vuosi ja kvartaali
- y-akseli: Arvo
- Kunta: oletuskunta lue `/backend/md/site/header.md`
- Tiedot: Toimintakulut
- Legenda: Vertaa edellisvuoden tilanteeseen

2. Lisää diagrammiin ennustemalli (Ennustemallin lisääminen) ja ennustemallin valinta `/backend/md/models/models.md`. Valitse dataan sopiva ennustemalli.
3. Luo analyysi tiedoista - osio
4. Luo taulukko luvuista.
5. Tee lyhyt yhteenveto kappaleeksi kokonaisuudesta viivadiagrammi, analyysi ja taulukko - osio.

## Luo välilehti ja artikkeli - Kulurakenne

1. Vaaka pylväsdiagrammi - osio
Data:
- talousarvio ja -suunnitelma (KTAS)
- neljännesvuosiraportointi (KKNR)

Muuttujat:
- x-akseli: 0-100%
- y-akseli: Vuodet ja kvartaalit
- Kunta: oletuskunta lue `/backend/md/site/header.md`
- Tiedot: Kulurakenne kvartaaleittain (prosenttiosuudet 100% alla olevista kuluista)
  - Henkilöstökulut
  - Palvelujen ostot
  - Aineet, tarvikkeet ja tavarat
  - Avustukset
  - Muut toimintakulut
- Legenda: Kululajit omina pinottuina osina 100 %:n vaakapylväässä: Henkilöstökulut, Palvelujen ostot, Aineet, tarvikkeet ja tavarat, Avustukset, Muut toimintakulut. Jokainen neljännes on oma pylväänsä, joten edellisvuoden sama neljännes on vertailtavissa.

2. Ei ennustemallia (osuuksien jakauma).
3. Luo analyysi tiedoista - osio
4. Luo taulukko luvuista.
5. Tee lyhyt yhteenveto kappaleeksi kokonaisuudesta pylväsdiagrammi, analyysi ja taulukko - osio.

## Luo välilehti ja artikkeli - Henkilöstökulut

1. Viivadiagrammi - osio
Data:
- talousarvio ja -suunnitelma (KTAS)
- neljännesvuosiraportointi (KKNR)

Muuttujat:
- x-akseli: Vuosi ja kvartaali
- y-akseli: Arvo
- Kunta: oletuskunta lue `/backend/md/site/header.md`
- Tiedot: Henkilöstökulut
- Legenda: Vertaa edellisvuoden tilanteeseen

2. Lisää diagrammiin ennustemalli (Ennustemallin lisääminen) ja ennustemallin valinta `/backend/md/models/models.md`. Valitse dataan sopiva ennustemalli.
3. Luo analyysi tiedoista - osio
4. Luo taulukko luvuista.
5. Tee lyhyt yhteenveto kappaleeksi kokonaisuudesta viivadiagrammi, analyysi ja taulukko - osio.

## Luo välilehti ja artikkeli - Palvelujen ostot

1. Viivadiagrammi - osio
Data:
- talousarvio ja -suunnitelma (KTAS)
- neljännesvuosiraportointi (KKNR)

Muuttujat:
- x-akseli: Vuosi ja kvartaali
- y-akseli: Arvo
- Kunta: oletuskunta lue `/backend/md/site/header.md`
- Tiedot: Palvelujen ostot
- Legenda: Vertaa edellisvuoden tilanteeseen

2. Lisää diagrammiin ennustemalli (Ennustemallin lisääminen) ja ennustemallin valinta `/backend/md/models/models.md`. Valitse dataan sopiva ennustemalli.
3. Luo analyysi tiedoista - osio
4. Luo taulukko luvuista.
5. Tee lyhyt yhteenveto kappaleeksi kokonaisuudesta viivadiagrammi, analyysi ja taulukko - osio.

## Luo välilehti ja artikkeli - Verotulot

1. Vaaka pylväsdiagrammi - osio
Data:
- talousarvio ja -suunnitelma (KTAS)
- neljännesvuosiraportointi (KKNR)

Muuttujat:
- x-akseli: Verotulot, milj. euroa tai euroa asukasta kohden (kertymä vuoden alusta), pinottuna verolajeittain
- y-akseli: Vuodet ja kvartaalit
- Kunta: oletuskunta lue `/backend/md/site/header.md`
- Tiedot: Verotulot: kunnallisvero, yhteisövero, kiinteistövero
- Legenda: Verolajit omina pinottuina osina: kunnallisvero, yhteisövero, kiinteistövero. Jokainen neljännes on oma pylväänsä, joten edellisvuoden sama neljännes on vertailtavissa.

2. Ei ennustemallia (verolajikohtaiset ennusteet ovat omilla välilehdillään).
3. Luo analyysi tiedoista - osio
4. Luo taulukko luvuista.
5. Tee lyhyt yhteenveto kappaleeksi kokonaisuudesta pylväsdiagrammi, analyysi ja taulukko - osio.

## Luo välilehti ja artikkeli - Kunnallisvero

1. Viivadiagrammi - osio
Data:
- talousarvio ja -suunnitelma (KTAS)
- neljännesvuosiraportointi (KKNR)

Muuttujat:
- x-akseli: Vuosi ja kvartaali
- y-akseli: Arvo
- Kunta: oletuskunta lue `/backend/md/site/header.md`
- Tiedot: Kunnallisvero
- Legenda: Vertaa edellisvuoden tilanteeseen

2. Lisää diagrammiin ennustemalli (Ennustemallin lisääminen) ja ennustemallin valinta `/backend/md/models/models.md`. Valitse dataan sopiva ennustemalli.
3. Luo analyysi tiedoista - osio
4. Luo taulukko luvuista.
5. Tee lyhyt yhteenveto kappaleeksi kokonaisuudesta viivadiagrammi, analyysi ja taulukko - osio.

## Luo välilehti ja artikkeli - Yhteisövero

1. Viivadiagrammi - osio
Data:
- talousarvio ja -suunnitelma (KTAS)
- neljännesvuosiraportointi (KKNR)

Muuttujat:
- x-akseli: Vuosi ja kvartaali
- y-akseli: Arvo
- Kunta: oletuskunta lue `/backend/md/site/header.md`
- Tiedot: Yhteisövero
- Legenda: Vertaa edellisvuoden tilanteeseen

2. Lisää diagrammiin ennustemalli (Ennustemallin lisääminen) ja ennustemallin valinta `/backend/md/models/models.md`. Valitse dataan sopiva ennustemalli.
3. Luo analyysi tiedoista - osio
4. Luo taulukko luvuista.
5. Tee lyhyt yhteenveto kappaleeksi kokonaisuudesta viivadiagrammi, analyysi ja taulukko - osio.

## Luo välilehti ja artikkeli - Kiinteistövero

1. Viivadiagrammi - osio
Data:
- talousarvio ja -suunnitelma (KTAS)
- neljännesvuosiraportointi (KKNR)

Muuttujat:
- x-akseli: Vuosi ja kvartaali
- y-akseli: Arvo
- Kunta: oletuskunta lue `/backend/md/site/header.md`
- Tiedot: Kiinteistövero
- Legenda: Vertaa edellisvuoden tilanteeseen

2. Lisää diagrammiin ennustemalli (Ennustemallin lisääminen) ja ennustemallin valinta `/backend/md/models/models.md`. Valitse dataan sopiva ennustemalli.
3. Luo analyysi tiedoista - osio
4. Luo taulukko luvuista.
5. Tee lyhyt yhteenveto kappaleeksi kokonaisuudesta viivadiagrammi, analyysi ja taulukko - osio.

## Luo välilehti ja artikkeli - Valtionosuudet

1. Viivadiagrammi - osio
Data:
- talousarvio ja -suunnitelma (KTAS)
- neljännesvuosiraportointi (KKNR)

Muuttujat:
- x-akseli: Vuosi ja kvartaali
- y-akseli: Arvo
- Kunta: oletuskunta lue `/backend/md/site/header.md`
- Tiedot: Valtionosuudet
- Legenda: Vertaa edellisvuoden tilanteeseen

2. Lisää diagrammiin ennustemalli (Ennustemallin lisääminen) ja ennustemallin valinta `/backend/md/models/models.md`. Valitse dataan sopiva ennustemalli.
3. Luo analyysi tiedoista - osio
4. Luo taulukko luvuista.
5. Tee lyhyt yhteenveto kappaleeksi kokonaisuudesta viivadiagrammi, analyysi ja taulukko - osio.

## Luo välilehti ja artikkeli - Toimintatuotot

1. Viivadiagrammi - osio
Data:
- talousarvio ja -suunnitelma (KTAS)
- neljännesvuosiraportointi (KKNR)

Muuttujat:
- x-akseli: Vuosi ja kvartaali
- y-akseli: Arvo
- Kunta: oletuskunta lue `/backend/md/site/header.md`
- Tiedot: Toimintatuotot
- Legenda: Vertaa edellisvuoden tilanteeseen

2. Lisää diagrammiin ennustemalli (Ennustemallin lisääminen) ja ennustemallin valinta `/backend/md/models/models.md`. Valitse dataan sopiva ennustemalli.
3. Luo analyysi tiedoista - osio
4. Luo taulukko luvuista.
5. Tee lyhyt yhteenveto kappaleeksi kokonaisuudesta viivadiagrammi, analyysi ja taulukko - osio.

## Luo välilehti ja artikkeli - Lainakanta

1. Viivadiagrammi - osio
Data:
- talousarvio ja -suunnitelma (KTAS)
- neljännesvuosiraportointi (KKNR)

Muuttujat:
- x-akseli: Vuosi ja kvartaali
- y-akseli: Arvo
- Kunta: oletuskunta lue `/backend/md/site/header.md`
- Tiedot: Lainakanta = Joukkovelkakirjalainat + Lainat rahoitus- ja vakuutuslaitoksilta + Lainat julkisyhteisöiltä + Lainat muilta luotonantajilta (tase-erä, tilanne neljänneksen lopussa, ei kertymä)
- Legenda: Vertaa edellisvuoden tilanteeseen

2. Lisää diagrammiin ennustemalli (Ennustemallin lisääminen) ja ennustemallin valinta `/backend/md/models/models.md`. Valitse dataan sopiva ennustemalli.
3. Luo analyysi tiedoista - osio
4. Luo taulukko luvuista.
5. Tee lyhyt yhteenveto kappaleeksi kokonaisuudesta viivadiagrammi, analyysi ja taulukko - osio.

## Luo välilehti ja artikkeli - Korkokulut per lainakanta

1. Viivadiagrammi - osio
Data:
- talousarvio ja -suunnitelma (KTAS)
- neljännesvuosiraportointi (KKNR)

Muuttujat:
- x-akseli: Vuosi ja kvartaali
- y-akseli: Arvo
- Kunta: oletuskunta lue `/backend/md/site/header.md`
- Tiedot: Korkokulut per lainakanta, % = vuositasolle muutetut korkokulut (kertymä vuoden alusta / neljännesten määrä × 4) / lainakanta neljänneksen lopussa. Kauden 2022Q1 KKNR-summauksessa on taksonomiavirhe korkokuluissa.
- y-akseli: prosenttia (ei yksikkövalintaa)
- Legenda: Vertaa edellisvuoden tilanteeseen

2. Lisää diagrammiin ennustemalli (Ennustemallin lisääminen) ja ennustemallin valinta `/backend/md/models/models.md`. Valitse dataan sopiva ennustemalli.
3. Luo analyysi tiedoista - osio
4. Luo taulukko luvuista.
5. Tee lyhyt yhteenveto kappaleeksi kokonaisuudesta viivadiagrammi, analyysi ja taulukko - osio.
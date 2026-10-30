# Yleiskatsaus projektista
Moderni verkkopalvelu joka skaalautuu mobiiliin ja web-verkkosivuksi. Kuntapäättäjät, johtajat ja kuntatiedosta kiinnostuneet voivat tasapainottaa ja tarkistella kuntataloutta sekä veroprosenttimuutoksen vaikutuksia kunnittain. Sivuja, alasivuja ja komponentteja tulee pystyä päivittämään erikseen, jottei päivitysten yhteydessä kaikkea tietoa tarvitse hakea uudestaan. Sivut on rakennettu tämän takia komponentteihin ja pienempiin moduuleihin.

Tarkistele kuntien taloutta ja talouden tasapainoa kokonaisuudessaan. Huomioi tarkistelussa myös tytäryhteisöt, osakkuusyhteisöt, liikelaitokset ja muut yksiköt, jotka liittyvät kuntaan. Tuo vertailu palveluun mukaan suhteessa kahteen valittavaan verrokkikuntaan ja saman kokoluokan kuntien keskiarvoon. Testaa kolmen kunnan avulla: Kangasala pääkunta ja Nokia sekä Ylöjärvi verrokkeja. Lisäksi tuo vertailu saman kokoluokan kolmeen talouden kannalta havaitsemaasi parhaimpaan kuntaan. Tavoitteenani on löytää uusia säästökohteita taloudesta tai uusia tulonlähteitä Kangasalan kaupungille sekä arvioida tulevaisuuden investointeja. 

Tutkihallintoa palvelusta saat vertailutietoa. Käytä hyödyksi @Claude\Kuukausiraportti taloustietoja tutkihallintoa.fi palvelusta. Tuo kuukausiraportista tarvittavat tiedot @tasapaino kansioon. Älä käytä kuukausiraportin ennustemalleja ja tietoja sekä lisäksi älä muuta mitään @Claude\Kuukausiraportti kansiossa. Hyödynnä tutkihallintoa.fi palvelusta kaikkea kuntataloustietoa rajapintojen kautta (KTAS,KKTPA,KKTPA,KKNR,KKTR, KKTOR,KKTPP,TOTT,KTPE) @api-osoitteet. Lisäksi tarkastele @aineisto kansion ostolaskudataa kolmelta eri vuodelta 2023-2025 Kangasalta ja Ylöjärveltä. Huomioi kuntien lakisääteiset tehtävät @aineisto/kuntien_lakisaateiset_tehtavat_vertailtu 1.xlsx ja VM:n sivuilta https://vm.fi/kuntien-tehtavat-ja-toiminta

Selitteet:
TOLT – Tytäryhteisöt, osakkuusyhteisöt, liikelaitokset ja muut yksiköt
TOLTA – Kunnan ja kuntayhtymän tytäryhteisöt, osakkuusyhteisöt ja muut omistusyhteysyhteisöt, kuntayhtymät sekä muut sidosyksiköt
TOLTB – Kunnan ja kuntayhtymän liikelaitokset ja vesihuollon taseyksiköt
KKTR – Kunnan ja kuntayhtymän tilinpäätöksen rahoituslaskelma
KTPE – Kunnan ja kuntayhtymän tilinpäätösennuste
KKTPP – Kunnan ja kuntayhtymien tilinpäätöstiedot palveluluokkakohtaisesti (käyttötalous, investoinnit)
KKTPA – Kunnan ja kuntayhtymän tilinpäätösarvio
KKOTR – Kunta- ja kuntayhtymäkonsernin tilinpäätösraportointi
KTAS – Kunnan ja kuntayhtymän talousarvio ja -suunnitelma
KKNR – Kunnan ja kuntayhtymän neljännesvuosiraportointi
TOTT – Tietoja esiopetuksen, perusopetuksen, perusopetuslain mukaisen koululaisten aamu- ja iltapäivätoiminnan ja lukiokoulutuksen taloudesta ja toiminnasta
KKYTT – Kunnan ja kuntayhtymän kalenterivuotta koskevat tilinpäätöstietoja täydentävät muut taloustiedot
KLTR – Kunnan ja kuntayhtymän liikelaitoksen ja vesihuollon taseyksikön toteumaraportointi
KLTPA – Kunnan ja kuntayhtymän liikelaitoksen ja vesihuollon taseyksikön tilinpäätösarvio
KKLMY – Kunnan ja kuntayhtymän kilpailutilanteessa markkinoilla tapahtuva taloudellinen toiminta


Vero.fi-tilastot laskennan pohjaksi

Efektiivisen veroasteen laskenta
Efektiivisessä veroasteessa verrataan maksuunpantua veroa suoraan ihmisten saamiin tuloihin. Efektiivisellä veroasteella tarkoitetaan tosiasiassa maksuunpantujen verojen suhdetta tuloihin. Erilaisten vähennysten johdosta kuntien tuloveroprosentti (nimellinen veroaste) ei vastaa todellista veroastetta kunnissa. Keskimääräinen kunnallisveroprosentti oli Suomessa vuonna 2015 lähes 20 prosenttia. Tosiasiassa suomalaiset maksavat tuloistaan vähennysten takia kuitenkin kunnallisveroa selvästi tätä vähemmän, noin 15 prosenttia. Kunnallisverotuksessa vähennyksiä voi tehdä tuloihin tai veroon. Tulosta tehtäviä vähennyksiä ovat muun muassa matkakustannukset, tulonhankkimiskulut, ansiotulovähennys ja perusvähennys.  Verosta tehtäviä vähennyksiä ovat muun muassa työtulovähennys, kotitalousvähennys sekä asuntolainan koron alijäämähyvitys. Kunnallisverotuksessa tehtävien vähennysten määrä riippuu veronmaksajan tulotasosta. Vähennykset painottuvat alemmille tulotasoille jolloin efektiivinen veroaste on alhaisempi. Mitä suuremmat tulot, sitä lähempänä nimellinen kunnallisveroprosentti ja veronmaksajan maksama todellinen veroprosentti ovat toisiaan.

\(\text{Efektiivinen\ veroaste\ (\%)}=\left(\frac{\text{Tosiasiassa\ maksettava\ kunnallisvero\ euroina}}{\text{Veronalaiset\ bruttotulot}}\right)\times 100\)

Vero.fi – Henkilöasiakkaiden tuloverotilastoja https://www.vero.fi/tietoa-verohallinnosta/tilastot/henkiloasiakkaiden_tuloverotilastoj/
Tilastotietokannasta otetaan kyseisen kunnan kohdalta kaksi lukua:
	1. Veronalaiset tulot (tai puhtaat ansiotulot) yhteensä.
	2. Kunnallisvero yhteensä (maksuunpantu kunnallisvero vähennysten jälkeen).
Jakamalla maksuunpannun kunnallisveron kokonaismäärän kunnan asukkaiden yhteenlasketuilla bruttotuloilla saadaan kyseisen kunnan keskimääräinen efektiivinen veroaste

Kuntien veroprosentit: https://www.kuntaliitto.fi/talous-ja-elinvoima/verotus/kuntien-veroprosentit

Mitä kunnan talouden tasapainotusohjelma tarkoittaa?
• Tarkoitus: Ohjelmalla pyritään saattamaan kunnan tulot ja menot tasapainoon sekä turvaamaan talouden kantokyky pitkällä aikavälillä.
• Päätösvalta: Kunnanvaltuusto päättää talouden keskeisistä tavoitteista ja hyväksyy tasapainotusohjelman osana taloussuunnittelua.
• Keinot: Sopeutustoimet jaetaan yleensä useille eri osa-alueille:
	• Palveluverkko: Esim. koulujen, päiväkotien tai muiden toimipisteiden yhdistämiset ja lakkautukset.
	• Toimintakulut ja tuotanto: Prosessien tehostaminen, henkilöstömenojen sopeuttaminen tai palveluiden uudelleenjärjestely.
	• Investoinnit ja kiinteistöt: Investointien karsiminen, lykkääminen tai kunnan omistamien kiinteistöjen ja metsien myynti.
	• Tulojen vahvistaminen: Esim. veroprosenttien tarkistaminen tai maksujen korotukset
	- Etsi lisäksi viides osa-alue, neljän lisäksi (jokeri). Onko esimerkiksi tekoälyn hyödyntäminen jokerikortti kunnille?

Kuntatalouden tasapainon kaava: Kun rakennat omaa seurantaa, FCG:n ja Kuntaliiton suosittelema paras mittari on toiminnan ja investointien rahavirta. Voit rakentaa kaavan seuraavalla logiikalla:
• + Vuosikate (Tulorahoitus korjausten ja korkojen jälkeen)
• + Satunnaiset erät
• + Tuloutukset rahastoista
• - Investoinnit (Käyttöomaisuuden hankintamenot)
• + Rahoitusosuudet investointeihin & käyttöomaisuuden luovutustulot
• = Toiminnan ja investointien rahavirta
(Jos tämä luku on negatiivinen useamman vuoden painelaskelmassa, kunnan on katettava vaje joko kassan varoja vähentämällä tai ottamalla uutta lainaa.)

Materiaalia:

Tasapainotusohjelman tarkastelunäkökulmia (vertailut mukaan):
1. Kokonaistalouden tasapainotilanne kunnassa kuntatalouden avainmittareilla tarkisteltuna ja kehitysehdotukset
2. Ulkoiset tulot ja menot per asukas-vertailu palveluluokittain ja tileittäin
3. Veroprosenttivertailu seuraavilla osa-alueilla:
	-- efektiivinen veroaste
	-- efektiivisen ja nimellisen veroasteen suhde
	-- kunnallisveron tuotto euroa asukasta kohti
	-- verotettavat ansiotulot asukasta kohti
	-- kiinteistövero euroa asukasta kohti
	-- yhteisövero euroa asukasta kohti
	-- valtionosuudet euroa asukasta kohti
	-- toimintatuotot suhteessa toimintakuluihin
4. Viiden näkökulman viisi tärkeintä nostoa kunnan kannalta (palveluverkko, toimintakulut ja tuotanto, Investoinnit ja kiinteistöt, Tulojen vahvistaminen, jokeri-viides - uusi osa-alue (esim. AI mahdollisuudet).

Tee jokaisesta näkökulmasta oma kokonaisuus.

## Arkkitehtuuri ja rakenne
Sivusto on jakautunut kahteen osaan:
- server-side `/backend` hakemistoihin ja tiedoistoihin
Pidä aina sivuston rakentamisessa käytetyt md-tiedostot hakemistossa `/backend/md` järjestyksessä ja omissa loogisissa hakemistoissaan.

- client-side `/frontend` hakemistoihin ja tiedoistoihin 

### Server-side `/backend`
- `/backend/md` - sivuston rakentamisessa käytetyt md-tiedostot
- `/backend/md/site` - koko sivuston ohjeet: `header.md`, `footer.md`, `frontpage.md`, `website_structure.md`, `brand_overview.md` (yrityksen visuaalinen ilme)
- `/backend/md/pages` - alasivujen ohjeet, esim. `population.md`
- `/backend/md/api` - `api.md` - Rajapintaosoitteet ja ohjeet tietojen hakuun maksullisista ja maksuttomista aineistoista
- `/backend/md/api/finance_compiler.md` - Talouslaskennan lisäohjeita
- `/backend/data` - hakemisto, johon tallennetaan data. Jos tarvitaan jotakin xlsx-tietoa datan voi tallentaan tänne. Lisäksi täältä löytyy ohjeita rajapintojen käyttöön.
- `/backend/data/maps` - jos tarvitaan karttavisualisointeja niin topo ja json kartat löytyvät täältä
- `/backend/output` - hakemisto, johon tallennetaan ajetut lopputulokset. Erottele kunnat omiin kansioihin. 
- `/backend/functions` - hakemisto, johon tallennetaan palvelimella ajettavat scriptit (datahaut, build, palvelin)

### Client-side `/frontend`
- `/frontend/brand` - yrityksen brändiin liittyvät tiedostot päähakemisto
- `/frontend/brand/fonts` - yrityksen fontin määrittelyt
- `/frontend/brand/logos` - yrityksen logojen määrittelyt
- `/frontend/brand/photos/powerpoint` - yrityksen powerpointin taustakuvat ja ohjeistus värien sekä taustakuvien käyttöön
- `/frontend/functions` - hakemisto, johon tallennetaan selaimessa ajettavat scriptit (käännetyt sivuskriptit kansiossa `dist`)
- `/frontend/components` - hakemisto, johon tallennetaan kaikki visualisoinnit komponentteina.
- `/frontend/pages` - hakemisto, johon tallennetaan kaikki verkkosivut etusivua lukuun ottamatta.
- `/index.html` - etusivu on projektin juuressa, jotta sivusto toimii GitHub Pages -sivuna (ks. `website_structure.md`).
- `/frontend/styles` - sivuston tyylit

## Code Style & Rules
- Use two-space indentation.




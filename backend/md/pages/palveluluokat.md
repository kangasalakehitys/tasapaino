# 2. Palveluluokat (`palveluluokat.html`, `page-palveluluokat.js`)
Ulkoiset tulot ja menot euroa asukasta kohden palveluluokittain ja tileittäin.

## Palveluluokat (KKTPP, viimeisin vuosi)
- **Menot / Tulot palveluluokittain:** Cleveland dot plot (`<dot-plot>`) kokoluokan 20 suurimmasta luokasta. Pääpisteinä ovat kunta, verrokit, kokoluokan keskiarvo (vinoneliö), kolmen parhaan keskiarvo (kolmio) ja maa (neliö); kokoluokan muut kunnat näkyvät pieninä pisteinä. Taulukko lajitellaan eron mukaan.
- **Lakisääteisyys:** nettomenojen (kulut − tuotot) ero kokoluokan keskiarvoon euroina ja lakisääteisyyden mukaan (`data/lakisaateiset.md`).

## Tileittäin (KKTPP x0 = koko kunta)
Kulut: henkilöstö, asiakaspalvelujen ostot, muiden palvelujen ostot, aineet, avustukset ja muut. Tuotot: myynti, maksut, tuet ja muut. Lisäksi henkilöstökulut tunnuslukuartikkelina.

## Opetus (TOTT)
Esi-, perus- ja lukio-opetuksen toimintakulut ikäluokan asukasta kohden (6 v, 7–15 v, 16–18 v; `pyramid.json`, viimeisin toteutunut vuosi). Perusopetus on rivillä R0380 (9-vuotinen perusopetus).

## Ostolaskut (`data/ostolaskut.md`)
Yleiskuva (tiliryhmät €/as, laskut, toimittajat, pienlaskut), suurimmat toimittajat ja yhteiset toimittajat Kangasala–Ylöjärvi.

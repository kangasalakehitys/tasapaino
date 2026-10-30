# Lakisääteiset tehtävät (`/backend/data/lakisaateiset.json`)
Lähteet: `/aineisto/kuntien_lakisaateiset_tehtavat_vertailtu 1.xlsx` (taulukko Tehtävät: 22 tehtäväaluetta säädösperustoineen) ja https://vm.fi/kuntien-tehtavat-ja-toiminta.

Palveluluokat (KKTPP, 40 suurinta) on luokiteltu käsin viiteen ryhmään:
- `statutory`: järjestämisvelvollisuus ja laajuus laissa (esim. perusopetus, varhaiskasvatus, kaavoitus)
- `statutory-scope`: lakisääteinen, mutta palvelutaso harkinnanvarainen (kirjastot, liikunta, nuoriso, kulttuuri, kadut)
- `licensed`: luvanvarainen tai "kunta voi järjestää" (lukio, kansalaisopisto, aamu- ja iltapäivätoiminta)
- `voluntary`: vapaaehtoinen (museot, teatteri, elinkeinot, maaomaisuus)
- `support`: sisäinen tukitoiminto (tilavuokraus, tukipalvelut)

**Luokittelu on arvio.** Tarkista se kunnan omista tehtävistä (esim. maakuntamuseotehtävä tai sopimusperusteiset tehtävät) ja päivitä JSON-tiedostoon.

# TOLT-yhteisöt (`/backend/data/tolt/tolt.json`)
Valtiokonttorin avoin rajapinta ei sisällä TOLTA- tai TOLTB-tietoja yhteisökohtaisesti. Taulukkomallit ovat olemassa (`datapoints/TOLTA.json`), mutta aineistolistassa niitä ei ole. Kunnilla ei ole myöskään KLTR-aineistoa. Palvelu näyttää siksi:
1. Konsernin ja kunnan erotuksen (KKOTR − KKNR/KKTR): TOLT-yhteisöjen yhteenlaskettu vaikutus vuosikatteeseen, investointeihin, lainakantaan ja kertyneeseen ylijäämään (Kokonaistalous → Kuntakonserni).
2. Kunnan taseen tytäryhteisöosakkeet (KKNR k-t09, tili 1204).
3. Käsin täydennettävät yhteisökohtaiset tiedot tilinpäätöksen konsernin liitetiedoista:

```json
"kangasala": { "source": "Tilinpäätös 2025, s. xx", "year": 2025, "entities": [
  { "name": "Esimerkki Oy", "type": "Tytäryhteisö", "ownership": 100, "revenue": 0, "result": 0, "loans": 0 }
]}
```
Tilinpäätösten osoitteet: `/aineisto/Rakenna verkkopalvelu, joka tarkist.txt`.

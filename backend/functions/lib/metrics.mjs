// Metrics of the Tasapaino service (spec: backend/md/api/finance_compiler.md).
// Ids are DatapointIDs of the Kuntatalous taxonomy; table models in
// backend/data/finance/datapoints/<SET>.json (row code in the comment).
// KKNR values are the external column x01, which equals the financial statement.

// KKNR (kunnan neljännesvuosiraportointi), the year-end period YYYYC12 is the
// financial statement year. Values: sum of the listed ids.
export const KKNR_METRICS = {
  // Tuloslaskelma k-t07
  operatingIncome: ['3319283'], // R0010 Toimintatuotot
  salesIncome: ['3333395'], // R0020 3000-3199 Myyntituotot
  feeIncome: ['3361619'], // R0040 3200-3299 Maksutuotot
  subsidyIncome: ['3375731'], // R0060 3300-3399 Tuet ja avustukset
  otherIncome: ['3389843'], // R0100 3400-3559 Muut toimintatuotot
  rentIncome: ['146820'], // R0110 3400-3499 Vuokratuotot
  operatingCosts: ['3418067'], // R0210 Toimintakulut
  personnel: ['1562'], // R0220 4000-4299 Henkilöstökulut
  services: ['699'], // R0380 4300-4499 Palvelujen ostot
  customerServices: ['2416115'], // R0390 4300-4339 Asiakaspalvelujen ostot
  otherServices: ['2458451'], // R0470 4340-4499 Muiden palvelujen ostot
  materials: ['683'], // R0680 4500-4699 Aineet, tarvikkeet ja tavarat
  grants: ['3432179'], // R0850 4700-4799 Avustukset
  otherCosts: ['3446291'], // R0990 4800-4995 Muut toimintakulut
  operatingMargin: ['5752390'], // R1175 Toimintakate
  taxes: ['3460403'], // R1180 5000-5499 Verotulot
  municipalTax: ['3474515'], // R1190 5000 Kunnan tulovero
  propertyTax: ['94279'], // R1200 5100 Kiinteistövero
  corporateTax: ['3502739'], // R1210 5200 Osuus yhteisöveron tuotosta
  stateAid: ['3530963'], // R1230 5500-5899 Valtionosuudet
  interestIncome: ['973'], // R1340 6000-6099 Korkotuotot
  interestCosts: ['556'], // R1510 6200-6299 Korkokulut
  annualMargin: ['1400'], // R1605 Vuosikate
  depreciation: ['1470'], // R1610 7000-7299 Poistot ja arvonalentumiset
  extraordinary: ['1164'], // R1690 8000-8199 Satunnaiset erät
  result: ['159456'], // R1805 Tilikauden tulos
  surplus: ['1447'], // R1900 Tilikauden ylijäämä (alijäämä)
  // Tase k-t09 (tilanne kauden lopussa)
  totalAssets: ['513'], // R0010 Vastaavaa
  equity: ['74'], // R1200 2000-2099 Oma pääoma
  // Kertynyt ylijäämä (alijäämä) = edellisten tilikausien + tilikauden yli-/alijäämä
  accumulatedSurplus: ['797', '394'], // R1330 + R1380
  loans: ['4362557', '4363646'], // R1610 + R1890 korollinen vieras pääoma = lainakanta
  cash: ['1003', '1137'], // R1170 rahat ja pankkisaamiset + R1040 rahoitusarvopaperit
  subsidiaryShares: ['691'], // R0370 1204 Osakkeet ja osuudet tytäryhteisöissä
  // Investointierittelyt k-t13
  investments: ['1374'], // R0010 Investointimenot
  investmentGrants: ['1362'], // R0190 Rahoitusosuudet investointimenoihin
  disposals: ['1001'], // R0370 Luovutustulot
  invNewBuildings: ['3787979'], // R0090 Muiden rakennusten uushankinta
  invRepairBuildings: ['3717923'], // R0100 Muut rakennukset, korjausinvestointi
  invNewResidential: ['3752951'], // R0070 Asuinrakennusten uushankinta
  invRepairResidential: ['3741275'], // R0080 Asuinrakennusten korjausinvestointi
  invLand: ['3764627', '3776303'], // R0050 + R0060 Maa- ja vesialueet
  invStructures: ['373'], // R0110 Kiinteät rakenteet ja laitteet
  invMachinery: ['3647867', '3706247', '3799655', '3659543'], // R0120-R0150 koneet ja kalusto
  invShares: ['833'], // R0170 Osakkeet ja osuudet
  invIntangible: ['3624515', '3729599'] // R0030 + R0040 aineettomat
};

// Metrics that are balance-sheet stocks (not flows).
export const STOCK_METRICS = new Set(['totalAssets', 'equity', 'accumulatedSurplus', 'loans', 'cash', 'subsidiaryShares']);

// Whole tables stored with their labels (small sets). Table ids from the table models.
export const TABLE_SETS = {
  KKTR: ['k-t02'], // Rahoituslaskelma
  KKOTR: ['kk-t01', 'kk-t02', 'kk-t03'], // Konsernin tuloslaskelma, rahoituslaskelma, tase
  KTAS: ['k-t05'], // Talousarvio ja -suunnitelma
  KTPE: ['k-t25'], // Tilinpäätösennuste
  TOTT: ['k-t16.011', 'k-t16.012', 'k-t16.02', 'k-t16.03'] // Esi-, perus-, aamu- ja iltapäivä-, lukio-opetus
};

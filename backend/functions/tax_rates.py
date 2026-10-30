"""Municipal tax rates from Kuntaliitto's yearly files (spec: backend/md/api/api.md "Kuntaliitto").

The files (downloaded by `npm run tax-rates` into backend/data/raw/kuntaliitto/<year>.xlsx)
have a slightly different layout every year, so the columns are found from the
header rows: a group title row ("Tuloveroprosentti", "Yleinen kiinteistö-/rakennuksen",
"Vakituisen asunnon") and a year row below it.

Writes backend/data/tax/veroprosentit.json:
  { years, municipalities: { <kuntakoodi>: { <year>: { income, propertyGeneral, propertyResidential } } } }

Usage (anaconda python): python -I backend/functions/tax_rates.py
"""
import glob, json, os, re
import openpyxl

HERE = os.path.dirname(os.path.abspath(__file__))
BACKEND = os.path.abspath(os.path.join(HERE, ".."))
RAW = os.path.join(BACKEND, "data", "raw", "kuntaliitto")
GROUPS = {
  "income": re.compile(r"tuloveroprosentti", re.I),
  "propertyGeneral": re.compile(r"yleinen (kiinteistö|rakennuksen)", re.I),
  "propertyResidential": re.compile(r"vakituisen asunnon", re.I),
}
# Any group title of the files.
TITLE = re.compile(r"veroprosentti|kiinteistö|rakennuksen|maapohjan|asunnon", re.I)


def norm(name):
  return re.sub(r"\s+", " ", str(name)).strip().lower()


def parse(path, names):
  ws = openpyxl.load_workbook(path, read_only=True, data_only=True).worksheets[0]
  rows = [list(r) for r in ws.iter_rows(values_only=True)]
  group_row = next(i for i, r in enumerate(rows[:12]) if any(isinstance(c, str) and GROUPS["income"].search(c) for c in r))
  year_row = next(i for i in range(group_row + 1, group_row + 4)
    if sum(1 for c in rows[i] if isinstance(c, (int, float)) and 2000 < c < 2100) >= 2)
  # Group titles in column order (all groups, also the unused ones, so the order matches).
  titles = [(j, c) for j, c in enumerate(rows[group_row]) if isinstance(c, str) and TITLE.search(c)]
  # Year columns form one run per group, separated by "Muutos" columns.
  runs, run = [], {}
  for j, c in enumerate(rows[year_row]):
    if isinstance(c, (int, float)) and 2000 < c < 2100:
      run[int(c)] = j
    elif run:
      runs.append(run)
      run = {}
  if run:
    runs.append(run)
  columns = {}
  for (j, title), years in zip(titles, runs):
    key = next((k for k, rx in GROUPS.items() if rx.search(title)), None)
    if key:
      columns[key] = years
  out = {}
  for r in rows[year_row + 1:]:
    label = next((c for c in r[:2] if isinstance(c, str) and c.strip()), None)
    code = names.get(norm(label)) if label else None
    if not code:
      continue
    for key, years in columns.items():
      for year, j in years.items():
        v = r[j] if j < len(r) else None
        if isinstance(v, (int, float)):
          out.setdefault(code, {}).setdefault(str(year), {})[key] = round(float(v), 2)
  return out


def main():
  with open(os.path.join(BACKEND, "data", "kunnat.json"), encoding="utf-8") as f:
    kunnat = json.load(f)
  names = {norm(k["name"]): k["code"] for k in kunnat}
  # Swedish / older names that appear in the files.
  names.update({"maarianhamina": "478", "mariehamn": "478", "maarianhamina - mariehamn": "478"})
  data = {}
  for path in sorted(glob.glob(os.path.join(RAW, "*.xlsx"))):
    part = parse(path, names)
    for code, years in part.items():
      for year, values in years.items():
        # A later file wins (corrected figures).
        data.setdefault(code, {}).setdefault(year, {}).update(values)
    print(os.path.basename(path), len(part), "kuntaa")
  years = sorted({y for v in data.values() for y in v})
  path = os.path.join(BACKEND, "data", "tax", "veroprosentit.json")
  payload = {"source": "Kuntaliitto / Verohallinto, kuntien veroprosentit", "years": [int(y) for y in years], "municipalities": data}
  with open(path, "w", encoding="utf-8") as f:
    json.dump(payload, f, ensure_ascii=False)
  with open(path[:-5] + ".js", "w", encoding="utf-8") as f:
    f.write("window.KUNTATIETO_DATA = window.KUNTATIETO_DATA || {};\n")
    f.write(f'window.KUNTATIETO_DATA["data/tax/veroprosentit.json"] = {json.dumps(payload, ensure_ascii=False)};\n')
  for c in ("211", "536", "980"):
    print(c, {y: data.get(c, {}).get(y, {}).get("income") for y in years})


if __name__ == "__main__":
  main()

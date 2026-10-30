"""Extract DatapointID maps from the State Treasury table models (taulukkomallit).

Reads every taulukkomalli-<SET>_*.xlsx in the given folder and writes
backend/data/finance/datapoints/<SET>.json:
  { set, source, tables: { <sheet>: { title, columns: { C0010: label },
    rows: [ { code: R0010, label, ids: { C0010: "1541" } } ] } } }

Usage (anaconda python, see backend/md/api/api.md):
  python -I backend/functions/tools/extract_datapoints.py <folder with taulukkomalli-*.xlsx>
"""
import json, os, re, sys
import openpyxl

COL = re.compile(r"^(C\d{4}|x0|x00|x01)$")
# Counterparty columns: x0 = all, x00 = internal, x01 = external (ulkoiset).
ANYCOL = re.compile(r"^(C\d{4}|x0\d*|S\d+)$")
ROW = re.compile(r"^R\d{4}$")
ID = re.compile(r"^\d+$")

here = os.path.dirname(os.path.abspath(__file__))
out_dir = os.path.join(here, "..", "..", "data", "finance", "datapoints")


def text(v):
  return str(v).strip() if v is not None else ""


def extract_sheet(ws):
  rows = [list(r) for r in ws.iter_rows(values_only=True)]
  title = ""
  for r in rows[:3]:
    cells = [text(c) for c in r if text(c)]
    if len(cells) >= 2:
      title = cells[-1]
      break
  columns, colmap, out = {}, {}, []
  for i, r in enumerate(rows):
    cells = [text(c) for c in r]
    heads = {j: c for j, c in enumerate(cells) if COL.match(c)}
    if heads and sum(1 for c in cells if ANYCOL.match(c)) >= len(heads) and not any(ROW.match(c) for c in cells):
      colmap = heads
      for j, code in heads.items():
        label = ""
        for k in range(i - 1, max(i - 4, -1), -1):
          if j < len(rows[k]) and text(rows[k][j]):
            label = text(rows[k][j])
            break
        columns.setdefault(code, label)
      continue
    rcode = next((c for c in cells if ROW.match(c)), None)
    if not rcode or not colmap:
      continue
    ri = cells.index(rcode)
    label = next((c for c in cells[:ri] if c and not ID.match(c)), "")
    ids = {code: cells[j] for j, code in colmap.items() if j < len(cells) and ID.match(cells[j])}
    if ids:
      out.append({"code": rcode, "label": label, "ids": ids})
  return {"title": title, "columns": columns, "rows": out}


def main(folder):
  os.makedirs(out_dir, exist_ok=True)
  for name in sorted(os.listdir(folder)):
    m = re.match(r"taulukkomalli-([A-Z]+)_(\S+?)-", name)
    if not m or not name.endswith(".xlsx"):
      continue
    wb = openpyxl.load_workbook(os.path.join(folder, name), read_only=True, data_only=True)
    tables = {}
    for ws in wb.worksheets:
      t = extract_sheet(ws)
      if t["rows"]:
        tables[ws.title] = t
    data = {"set": m.group(1), "source": name, "tables": tables}
    path = os.path.join(out_dir, f"{m.group(1)}.json")
    with open(path, "w", encoding="utf-8") as f:
      json.dump(data, f, ensure_ascii=False, indent=1)
    print(m.group(1), {k: len(v["rows"]) for k, v in tables.items()})


if __name__ == "__main__":
  main(sys.argv[1])

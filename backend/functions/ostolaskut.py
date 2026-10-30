"""Purchase invoice (ostolasku) aggregation for the Tasapaino service.

Spec: backend/md/data/ostolaskut.md. Reads the raw xlsx files in
/aineisto/ostolaskut (never published) and writes aggregated JSON only:
  backend/output/<kunta>/ostolaskut.json
  backend/data/ostolaskut/vertailu.json   suppliers shared by the municipalities

The files have three layouts (column names differ, Ylöjärvi files start with a
title block). Amounts are compared without VAT: Kangasala "Summa (netto)",
Ylöjärvi "Tilitetty summa ALV0". Accounts are cut to the 4-digit Kunta-AURA
account (Kangasala uses 6-digit internal accounts, e.g. 481001 -> 4810).

Usage (anaconda python): python -I backend/functions/ostolaskut.py
"""
import glob, json, os, re
import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT = os.path.abspath(os.path.join(HERE, "..", ".."))
SOURCE = os.path.join(PROJECT, "aineisto", "ostolaskut")
BACKEND = os.path.join(PROJECT, "backend")

MUNICIPALITIES = {
  "kangasala": {"name": "Kangasala", "code": "211", "pattern": "Kangasala*.xlsx"},
  "ylojarvi": {"name": "Ylöjärvi", "code": "980", "pattern": "Yl*.xlsx"},
}
TOP = 40
# Invoices under this (euros, VAT 0) count as small: candidates for automation
# and purchase cards (jokeri, toimenpiteet.md).
SMALL_INVOICE = 500

# Column keys -> header text fragments (lower case), first match wins.
COLUMNS = {
  "supplier": ["toimittajan nimi"],
  "supplier_id": ["toimittajan y-tunnus"],
  "date": ["tositepäivämäärä", "tositepvm"],
  "amount": ["summa (netto)", "alv0"],
  "account": ["kirjanpidon tili"],
  "account_name": ["tilin nimi", "kirjanpidon tilin nimi"],
  "cost_center": ["kustannuspaikka"],
  "cost_center_name": ["kustannuspaikan nimi"],
  "document": ["tositenumero"],
}

# Account groups (Kunta-AURA tililuettelo). Order matters: first match wins.
GROUPS = [
  ("Asiakaspalvelujen ostot", 4300, 4339),
  ("Muiden palvelujen ostot", 4340, 4499),
  ("Aineet, tarvikkeet ja tavarat", 4500, 4699),
  ("Avustukset", 4700, 4799),
  ("Vuokrat", 4800, 4859),
  ("Muut toimintakulut", 4860, 4999),
  ("Henkilöstökulut", 4000, 4299),
  ("Investoinnit ja tase-erät", 1000, 2999),
]


def group_of(account):
  for name, lo, hi in GROUPS:
    if lo <= account <= hi:
      return name
  return "Muut"


def find_header(path):
  """Row index of the real header (Ylöjärvi files start with a title block)."""
  preview = pd.read_excel(path, header=None, nrows=10)
  for i, row in preview.iterrows():
    texts = [str(v).lower() for v in row.values if isinstance(v, str)]
    if any("toimittajan nimi" in t for t in texts):
      return i
  raise ValueError(f"Otsikkoriviä ei löytynyt: {path}")


def pick_columns(df):
  lower = {c: str(c).strip().lower() for c in df.columns}
  out = {}
  for key, fragments in COLUMNS.items():
    for frag in fragments:
      match = [c for c, l in lower.items() if (l == frag if key in ("cost_center", "account") else frag in l)]
      if match:
        out[key] = match[0]
        break
  missing = [k for k in ("supplier", "amount", "account", "date") if k not in out]
  if missing:
    raise ValueError(f"Puuttuvat sarakkeet {missing}: {list(df.columns)}")
  return out


def load(path):
  df = pd.read_excel(path, header=find_header(path))
  cols = pick_columns(df)
  out = pd.DataFrame({k: df[c] for k, c in cols.items()})
  out["amount"] = pd.to_numeric(out["amount"], errors="coerce").fillna(0.0)
  out["date"] = pd.to_datetime(out["date"], errors="coerce")
  digits = out["account"].astype(str).str.extract(r"(\d{4})", expand=False)
  out["account4"] = pd.to_numeric(digits, errors="coerce").fillna(0).astype(int)
  out["group"] = out["account4"].map(group_of)
  for k in ("supplier", "supplier_id", "account_name", "cost_center_name"):
    if k in out:
      out[k] = out[k].astype(str).str.strip().replace({"nan": ""})
  out["supplier_key"] = out.get("supplier_id", out["supplier"]).where(lambda s: s != "", out["supplier"])
  out = out[out["date"].notna()]
  return out


def money(x):
  return round(float(x), 2)


def summarize(df):
  total = df["amount"].sum()
  operating = df[df["account4"] >= 3000]
  by_supplier = (df.groupby("supplier_key")
    .agg(name=("supplier", "first"), sum=("amount", "sum"), rows=("amount", "size"))
    .sort_values("sum", ascending=False))
  by_account = (df.groupby("account4")
    .agg(name=("account_name", "first"), group=("group", "first"), sum=("amount", "sum"), rows=("amount", "size"))
    .sort_values("sum", ascending=False))
  docs = df.groupby("document")["amount"].sum() if "document" in df else df["amount"]
  small = docs[(docs > 0) & (docs < SMALL_INVOICE)]
  cc = (df.groupby("cost_center_name")["amount"].sum().sort_values(ascending=False)
    if "cost_center_name" in df else pd.Series(dtype=float))
  top = by_supplier.head(10)["sum"].sum()
  return {
    "total": money(total),
    "operating": money(operating["amount"].sum()),
    "rows": int(len(df)),
    "invoices": int(len(docs)),
    "suppliers": int(by_supplier.shape[0]),
    "top10Share": round(float(top / total), 4) if total else None,
    "smallInvoices": {"limit": SMALL_INVOICE, "count": int(len(small)), "sum": money(small.sum()),
      "share": round(len(small) / max(len(docs), 1), 4)},
    "groups": {g: money(v) for g, v in df.groupby("group")["amount"].sum().sort_values(ascending=False).items()},
    "monthly": [money(df[df["date"].dt.month == m]["amount"].sum()) for m in range(1, 13)],
    "topSuppliers": [{"id": k, "name": r["name"], "sum": money(r["sum"]), "rows": int(r["rows"])}
      for k, r in by_supplier.head(TOP).iterrows()],
    "topAccounts": [{"account": int(k), "name": r["name"], "group": r["group"], "sum": money(r["sum"]), "rows": int(r["rows"])}
      for k, r in by_account.head(TOP).iterrows()],
    "topCostCenters": [{"name": k, "sum": money(v)} for k, v in cc.head(25).items()],
  }


def write(path, data):
  os.makedirs(os.path.dirname(path), exist_ok=True)
  with open(path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=1)
  key = os.path.relpath(path, BACKEND).replace(os.sep, "/")
  with open(path[:-5] + ".js", "w", encoding="utf-8") as f:
    f.write("window.KUNTATIETO_DATA = window.KUNTATIETO_DATA || {};\n")
    f.write(f"window.KUNTATIETO_DATA[{json.dumps(key)}] = {json.dumps(data, ensure_ascii=False)};\n")


def main():
  frames = {}
  for slug, m in MUNICIPALITIES.items():
    parts = []
    for path in sorted(glob.glob(os.path.join(SOURCE, m["pattern"]))):
      df = load(path)
      df["year"] = df["date"].dt.year
      # A file covers one year; stray dates (e.g. invoice dated last December) follow the file.
      year = int(df["year"].mode()[0])
      df["year"] = year
      print(f"{os.path.basename(path)}: {len(df)} riviä, vuosi {year}, {df['amount'].sum() / 1e6:.1f} M€ (ALV 0)")
      parts.append(df)
    data = pd.concat(parts, ignore_index=True)
    frames[slug] = data
    years = {}
    for year, df in data.groupby("year"):
      years[str(year)] = summarize(df)
    # Suppliers over the years: the largest of all years with a sum per year.
    pivot = data.pivot_table(index="supplier_key", columns="year", values="amount", aggfunc="sum").fillna(0)
    names = data.groupby("supplier_key")["supplier"].first()
    pivot["all"] = pivot.sum(axis=1)
    trend = [{"id": k, "name": names[k], "years": {str(y): money(r[y]) for y in pivot.columns if y != "all"}}
      for k, r in pivot.sort_values("all", ascending=False).head(TOP).iterrows()]
    write(os.path.join(BACKEND, "output", slug, "ostolaskut.json"), {
      "code": m["code"], "name": m["name"], "source": "Kunnan julkaisema ostolaskudata (aineisto/ostolaskut)",
      "note": "Summat ilman arvonlisäveroa. Ylöjärven aineistosta on poistettu yksityishenkilöt ja toiminimet.",
      "years": years, "supplierTrend": trend,
    })
  # Suppliers that both municipalities use: joint procurement candidates.
  # Operating accounts only: loans (Kuntarahoitus) and pensions (Keva) are not purchases.
  sums = {s: f[f["account4"] >= 3000].groupby("supplier_key")["amount"].sum() for s, f in frames.items()}
  names = pd.concat([f.groupby("supplier_key")["supplier"].first() for f in frames.values()])
  names = names[~names.index.duplicated()]
  common = sums["kangasala"].index.intersection(sums["ylojarvi"].index)
  common = [k for k in common if re.match(r"^\d{7}-\d$", str(k))]
  rows = sorted(({"id": k, "name": names[k], "kangasala": money(sums["kangasala"][k]), "ylojarvi": money(sums["ylojarvi"][k])}
    for k in common), key=lambda r: -(r["kangasala"] + r["ylojarvi"]))
  write(os.path.join(BACKEND, "data", "ostolaskut", "vertailu.json"), {
    "years": sorted({int(y) for f in frames.values() for y in f["year"].unique()}),
    "sharedSuppliers": len(rows), "sharedSum": {s: money(sum(r[s] for r in rows)) for s in frames},
    "top": rows[:60],
  })
  print(f"Yhteisiä toimittajia: {len(rows)}")


if __name__ == "__main__":
  main()

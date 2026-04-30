# _xbrl_fetch.py — Extraccion quirurgica de datos XBRL del SEC
# Uso: python3 _xbrl_fetch.py {CIK_SIN_CEROS} {TICKER}
# Devuelve JSON compacto con solo los 13 conceptos necesarios x ultimos 5 FY
import requests, json, sys
from collections import defaultdict

if len(sys.argv) < 3:
    print("Uso: python3 _xbrl_fetch.py CIK TICKER")
    sys.exit(1)

CIK    = sys.argv[1].zfill(10)
TICKER = sys.argv[2].upper()

url  = f"https://data.sec.gov/api/xbrl/companyfacts/CIK{CIK}.json"
data = requests.get(url, headers={"User-Agent": "Murza murra@murzainversiones.com"}).json()
facts = data.get("facts", {}).get("us-gaap", {})

CONCEPTS = {
    "rev":   ["Revenues", "RevenueFromContractWithCustomerExcludingAssessedTax",
              "SalesRevenueNet", "SalesRevenueGoodsNet", "RevenueFromContractWithCustomerIncludingAssessedTax"],
    "ni":    ["NetIncomeLoss", "NetIncomeLossAvailableToCommonStockholdersDiluted"],
    "eps":   ["EarningsPerShareDiluted"],
    "gp":    ["GrossProfit"],
    "oi":    ["OperatingIncomeLoss"],
    "da":    ["DepreciationDepletionAndAmortization", "DepreciationAndAmortization",
              "DepreciationAmortizationAndAccretionNet"],
    "ocf":   ["NetCashProvidedByUsedInOperatingActivities"],
    "capex": ["PaymentsToAcquirePropertyPlantAndEquipment",
              "PaymentsToAcquireProductiveAssets"],
    "cash":  ["CashAndCashEquivalentsAtCarryingValue",
              "CashCashEquivalentsAndShortTermInvestments",
              "CashAndCashEquivalentsAndRestrictedCash"],
    "ltd":   ["LongTermDebt", "LongTermDebtNoncurrent",
              "LongTermDebtAndCapitalLeaseObligations"],
    "sh":    ["CommonStockSharesOutstanding", "WeightedAverageNumberOfDilutedSharesOutstanding"],
    "repo":  ["PaymentsForRepurchaseOfCommonStock"],
    "div":   ["PaymentsOfDividends", "PaymentsOfDividendsCommonStock"],
}

results = defaultdict(dict)

def extract_annual(concept_name):
    """Devuelve dict {year: val} para un concepto XBRL, solo 10-K FY."""
    if concept_name not in facts:
        return {}
    units = facts[concept_name].get("units", {})
    vals  = units.get("USD", units.get("shares", []))
    annual = {}
    for v in vals:
        if v.get("form") == "10-K" and v.get("fp") == "FY":
            yr = v["end"][:4]
            if yr not in annual or v["filed"] > annual[yr]["filed"]:
                annual[yr] = v
    return {yr: v["val"] for yr, v in sorted(annual.items())[-5:]}

for short_key, names in CONCEPTS.items():
    for name in names:
        annual = extract_annual(name)
        if annual:
            for yr, val in annual.items():
                results[yr][short_key] = val
            break  # primer concepto que funcione
    else:
        # Caso especial AMZN: revenue = NetProductSales + NetServiceSales
        if short_key == "rev":
            prod  = extract_annual("NetProductSales")
            svc   = extract_annual("NetServiceSales")
            if prod or svc:
                all_years = set(prod.keys()) | set(svc.keys())
                for yr in all_years:
                    results[yr]["rev"] = prod.get(yr, 0) + svc.get(yr, 0)
            else:
                print(f"[WARN] Concepto '{short_key}' no encontrado — verificar manualmente", file=sys.stderr)
        else:
            print(f"[WARN] Concepto '{short_key}' no encontrado — verificar manualmente", file=sys.stderr)

# Calcular derivados y convertir unidades
for yr, d in results.items():
    if "ocf" in d and "capex" in d:
        d["fcf"]   = d["ocf"] - d["capex"]
    if "oi" in d and "da" in d:
        d["ebitda"] = d["oi"] + d["da"]
    if "ltd" in d and "cash" in d:
        d["nd"]    = d["ltd"] - d["cash"]
    # Convertir a $B (2 decimales)
    for m in ["rev","ni","gp","oi","ebitda","fcf","ocf","capex","ltd","cash","div","repo","nd","da"]:
        if m in d:
            d[m] = round(d[m] / 1e9, 2)
    if "eps" in d:
        d["eps"] = round(d["eps"], 2)
    if "sh" in d:
        d["sh"] = round(d["sh"] / 1e6, 1)  # millones

print(json.dumps(dict(results), indent=2))

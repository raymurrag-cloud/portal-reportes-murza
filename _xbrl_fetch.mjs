// _xbrl_fetch.mjs — Extraccion quirurgica de datos XBRL del SEC
// Uso: node _xbrl_fetch.mjs {CIK_SIN_CEROS} {TICKER}
// Requiere: Node.js 18+ (fetch nativo)

const [,, cikRaw, ticker] = process.argv;
if (!cikRaw || !ticker) {
  console.error("Uso: node _xbrl_fetch.mjs CIK TICKER");
  process.exit(1);
}

const CIK = cikRaw.padStart(10, '0');
const url = `https://data.sec.gov/api/xbrl/companyfacts/CIK${CIK}.json`;

const res = await fetch(url, { headers: { "User-Agent": "Murza murra@murzainversiones.com" } });
const data = await res.json();
const facts = data?.facts?.["us-gaap"] ?? {};

const CONCEPTS = {
  rev:   ["Revenues", "RevenueFromContractWithCustomerExcludingAssessedTax",
          "SalesRevenueNet", "RevenueFromContractWithCustomerIncludingAssessedTax"],
  ni:    ["NetIncomeLoss", "NetIncomeLossAvailableToCommonStockholdersDiluted"],
  eps:   ["EarningsPerShareDiluted", "EarningsPerShareBasic"],
  gp:    ["GrossProfit"],
  oi:    ["OperatingIncomeLoss"],
  da:    ["DepreciationDepletionAndAmortization", "DepreciationAndAmortization",
          "DepreciationAmortizationAndAccretionNet"],
  ocf:   ["NetCashProvidedByUsedInOperatingActivities"],
  capex: ["PaymentsToAcquirePropertyPlantAndEquipment", "PaymentsToAcquireProductiveAssets"],
  cash:  ["CashAndCashEquivalentsAtCarryingValue",
          "CashCashEquivalentsAndShortTermInvestments"],
  ltd:   ["LongTermDebt", "LongTermDebtNoncurrent", "LongTermDebtAndCapitalLeaseObligations"],
  sh:    ["CommonStockSharesOutstanding", "WeightedAverageNumberOfDilutedSharesOutstanding"],
  repo:  ["PaymentsForRepurchaseOfCommonStock"],
  div:   ["PaymentsOfDividends", "PaymentsOfDividendsCommonStock"],
};

function extractAnnual(conceptName) {
  const units = facts[conceptName]?.units ?? {};
  const vals  = units.USD ?? units.shares ?? [];
  const annual = {};
  for (const v of vals) {
    // Aceptar FY o cualquier fp de 10-K anual (empresas con FY no-Dec a veces usan fp vacio)
    if (v.form === "10-K" && (v.fp === "FY" || !v.fp)) {
      const yr = v.end.slice(0, 4);
      if (!annual[yr] || v.filed > annual[yr].filed) annual[yr] = v;
    }
  }
  // Ultimos 5 años
  const sorted = Object.entries(annual).sort(([a],[b]) => a.localeCompare(b)).slice(-5);
  return Object.fromEntries(sorted.map(([yr, v]) => [yr, v.val]));
}

const results = {};

for (const [key, names] of Object.entries(CONCEPTS)) {
  let found = false;
  for (const name of names) {
    if (!facts[name]) continue;
    const annual = extractAnnual(name);
    if (Object.keys(annual).length === 0) continue;
    for (const [yr, val] of Object.entries(annual)) {
      results[yr] ??= {};
      results[yr][key] = val;
    }
    found = true;
    break;
  }
  if (!found) {
    // Caso especial AMZN: revenue segmentado
    if (key === "rev") {
      const prod = extractAnnual("NetProductSales");
      const svc  = extractAnnual("NetServiceSales");
      const allYears = new Set([...Object.keys(prod), ...Object.keys(svc)]);
      if (allYears.size > 0) {
        for (const yr of allYears) {
          results[yr] ??= {};
          results[yr].rev = (prod[yr] ?? 0) + (svc[yr] ?? 0);
        }
      } else {
        console.error(`[WARN] Concepto 'rev' no encontrado — verificar manualmente`);
      }
    } else {
      console.error(`[WARN] Concepto '${key}' no encontrado — verificar manualmente`);
    }
  }
}

// Calcular derivados y convertir a $B
for (const [yr, d] of Object.entries(results)) {
  if (d.ocf != null && d.capex != null) d.fcf   = d.ocf - d.capex;
  if (d.oi  != null && d.da   != null) d.ebitda = d.oi  + d.da;
  if (d.ltd != null && d.cash != null) d.nd     = d.ltd - d.cash;

  for (const m of ["rev","ni","gp","oi","ebitda","fcf","ocf","capex","ltd","cash","div","repo","nd","da"]) {
    if (d[m] != null) d[m] = Math.round(d[m] / 1e9 * 100) / 100; // $B, 2 decimales
  }
  if (d.eps != null) d.eps = Math.round(d.eps * 100) / 100;
  if (d.sh  != null) d.sh  = Math.round(d.sh  / 1e6 * 10)  / 10;  // millones
}

// Filtrar: solo mostrar los años donde hay revenue (evita años viejos con datos parciales)
const revenueYears = new Set(Object.keys(results).filter(yr => results[yr].rev != null));
const finalYears   = revenueYears.size >= 3
  ? Object.fromEntries(Object.entries(results).filter(([yr]) => revenueYears.has(yr)))
  : results; // fallback: mostrar todo si no hay revenue

console.log(JSON.stringify(finalYears, null, 2));

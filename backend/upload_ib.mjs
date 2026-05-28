#!/usr/bin/env node
/**
 * Uso: node upload_ib.mjs <ruta-al-xml>
 * Ejemplo: node upload_ib.mjs "C:\Users\murra\Downloads\murza-portal.xml"
 */

import { readFileSync } from 'fs';
import { createRequire } from 'module';

const PORTAL_URL = 'https://portal-reportes-murza.onrender.com';
const ADMIN_USER = process.env.ADMIN_USER || 'raymurra';
const ADMIN_PASS = process.env.ADMIN_PASS || process.argv[3];

const xmlPath = process.argv[2];
if (!xmlPath || !ADMIN_PASS) {
  console.error('Uso: node upload_ib.mjs <ruta-al-xml> <password>');
  console.error('  o:  ADMIN_PASS=xxx node upload_ib.mjs <ruta-al-xml>');
  process.exit(1);
}

// ── Parsers ───────────────────────────────────────────────────────────────────
function num(v) { const n = parseFloat(v); return isNaN(n) ? null : n; }
function parseDate(s) {
  if (!s || s.length < 8) return null;
  return `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`;
}
function parseDateTime(s) {
  if (!s) return null;
  const [d, t] = s.split(';');
  const date = parseDate(d);
  if (!date) return null;
  return t?.length >= 6 ? `${date} ${t.slice(0,2)}:${t.slice(2,4)}:${t.slice(4,6)}` : date;
}
function parseElements(xml, tagName) {
  const results = [];
  const re = new RegExp(`<${tagName}\\b([^>]*)(?:\\s*/?>|>)`, 'g');
  let m;
  while ((m = re.exec(xml)) !== null) {
    const attrs = {};
    const attrRe = /(\w+)="([^"]*)"/g;
    let a;
    while ((a = attrRe.exec(m[1])) !== null) attrs[a[1]] = a[2];
    results.push(attrs);
  }
  return results;
}

function parseXml(xml) {
  const tradeEls = parseElements(xml, 'Trade')
    .filter(t => !t.levelOfDetail || t.levelOfDetail === 'EXECUTION');

  const trades = tradeEls.map(t => ({
    trade_id:    t.tradeID || null,
    symbol:      t.symbol,
    description: t.description || null,
    asset_cat:   t.assetCategory || null,
    trade_date:  parseDate(t.tradeDate),
    datetime:    parseDateTime(t.dateTime),
    buy_sell:    t.buySell,
    quantity:    num(t.quantity),
    price:       num(t.tradePrice),
    proceeds:    num(t.proceeds),
    commission:  num(t.ibCommission),
    net_cash:    num(t.netCash),
    cost_basis:  num(t.costBasis),
    realized_pl: num(t.realizedPL),
    open_close:  t.openCloseIndicator || null,
    currency:    t.currency || 'USD',
    exchange:    t.exchange || null,
  }));

  const positions = parseElements(xml, 'OpenPosition').map(p => ({
    symbol:         p.symbol,
    description:    p.description || null,
    asset_cat:      p.assetCategory || null,
    quantity:       num(p.quantity),
    mark_price:     num(p.markPrice),
    position_value: num(p.positionValue),
    open_price:     num(p.openPrice),
    cost_basis:     num(p.costBasisPrice),
    unrealized_pl:  num(p.unrealizedPnL),
    pct_nav:        num(p.percentOfNAV),
    side:           p.side || null,
    open_datetime:  parseDateTime(p.openDateTime),
    currency:       p.currency || 'USD',
    report_date:    parseDate(p.reportDate),
  }));

  const navEls = parseElements(xml, 'NetAssetValue');
  const total  = navEls.find(n => n.assetCategory === 'Total');
  const nav    = total ? {
    report_date: parseDate(total.reportDate) || new Date().toISOString().slice(0,10),
    total_nav:   num(total.total),
    cash:        num(total.cash),
    stock:       num(total.stock),
  } : null;

  // Historial diario de NAV desde EquitySummaryByReportDateInBase
  const navHistory = parseElements(xml, 'EquitySummaryByReportDateInBase')
    .map(e => ({
      report_date: parseDate(e.reportDate),
      total_nav:   num(e.total),
      cash:        num(e.cash),
      stock:       num(e.stock),
    }))
    .filter(e => e.report_date && e.total_nav !== null);

  return { trades, positions, nav, navHistory };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`Leyendo ${xmlPath}...`);
  const xml = readFileSync(xmlPath, 'utf8');

  const parsed = parseXml(xml);
  console.log(`Encontrado: ${parsed.trades.length} trades, ${parsed.positions.length} posiciones, NAV: ${parsed.nav ? 'si' : 'no'}`);

  if (!parsed.trades.length && !parsed.positions.length) {
    console.error('El XML no contiene trades ni posiciones. Verifica el archivo.');
    process.exit(1);
  }

  // Login para obtener token
  console.log('Autenticando...');
  const loginRes = await fetch(`${PORTAL_URL}/api/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: ADMIN_USER, password: ADMIN_PASS }),
  });
  const loginData = await loginRes.json();
  if (!loginData.token) {
    console.error('Error de autenticacion:', loginData.error || JSON.stringify(loginData));
    process.exit(1);
  }
  const token = loginData.token;
  console.log('Autenticado. Subiendo datos...');

  // Upload trades + positions (sin navHistory para no timeout)
  const { navHistory, ...mainData } = parsed;
  const res = await fetch(`${PORTAL_URL}/api/portafolio/upload-data`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(mainData),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { throw new Error(`HTTP ${res.status} — Respuesta inválida: ${text.slice(0,300)}`); }
  if (data.error) { console.error('Error:', data.error); process.exit(1); }
  console.log(`✓ ${data.message}`);

  // Upload NAV histórico en chunks de 20 para no saturar Turso
  if (navHistory?.length) {
    process.stdout.write(`Importando NAV histórico (${navHistory.length} días)... `);
    const CHUNK = 20;
    let imported = 0;
    for (let i = 0; i < navHistory.length; i += CHUNK) {
      const chunk = navHistory.slice(i, i + CHUNK);
      const r2 = await fetch(`${PORTAL_URL}/api/portafolio/upload-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ trades: [], positions: [], navHistory: chunk }),
      });
      const t2 = await r2.text();
      try { const d2 = JSON.parse(t2); imported += d2.nav_history || 0; } catch {}
    }
    console.log(`${imported} días nuevos importados`);
  }

  console.log(`Portal actualizado: https://reportes.murzainversiones.com/portafolio`);
}

main().catch(err => { console.error('Error:', err.message); process.exit(1); });

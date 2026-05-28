#!/usr/bin/env node
/**
 * Sync de posiciones y NAV desde IB Client Portal Gateway (CPG)
 * Uso: node sync_cpg.mjs
 * Requiere: ADMIN_PASS en variable de entorno o en .env.local
 */

// CPG usa certificado self-signed — necesario para localhost
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const CPG_URL    = 'https://localhost:5000';
const PORTAL_URL = 'https://portal-reportes-murza.onrender.com';
const ACCOUNT_ID = 'DUH274100';
const ADMIN_USER = 'raymurra';
const ADMIN_PASS = process.env.ADMIN_PASS;

if (!ADMIN_PASS) {
  console.error('Falta ADMIN_PASS. Agrega al archivo .env.local: ADMIN_PASS=tupassword');
  process.exit(1);
}

async function cpgGet(path) {
  const res = await fetch(`${CPG_URL}${path}`);
  if (!res.ok) throw new Error(`CPG ${path} → ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

async function main() {
  // ── 1. Verificar que CPG está corriendo y autenticado ────────────────────
  process.stdout.write('Verificando CPG... ');
  let status;
  try {
    status = await cpgGet('/v1/api/iserver/auth/status');
  } catch {
    console.error('\n❌ CPG no está corriendo.');
    console.error('   Abre https://localhost:5000 en tu browser y haz login con IB.');
    process.exit(1);
  }
  if (!status.authenticated) {
    console.error('\n❌ CPG no está autenticado. Abre https://localhost:5000 y haz login.');
    process.exit(1);
  }
  console.log('OK');

  // ── 2. Posiciones ────────────────────────────────────────────────────────
  process.stdout.write('Obteniendo posiciones... ');

  // Puede haber varias páginas — leemos hasta que devuelva array vacío
  let allPos = [];
  for (let page = 0; page < 10; page++) {
    const page_data = await cpgGet(`/v1/api/portfolio/${ACCOUNT_ID}/positions/${page}`);
    if (!Array.isArray(page_data) || page_data.length === 0) break;
    allPos = allPos.concat(page_data);
    if (page_data.length < 30) break; // último bloque
  }

  const positions = allPos.map(p => ({
    symbol:         p.ticker || p.contractDesc,
    description:    p.name   || p.fullName   || null,
    asset_cat:      p.assetClass || 'STK',
    quantity:       p.position,
    mark_price:     p.mktPrice,
    position_value: p.mktValue,
    open_price:     p.avgCost,
    cost_basis:     p.avgCost,
    unrealized_pl:  p.unrealizedPnl,
    pct_nav:        null,
    side:           p.position > 0 ? 'Long' : 'Short',
    open_datetime:  null,
    currency:       p.currency || 'USD',
    report_date:    new Date().toISOString().slice(0, 10),
  }));
  console.log(`${positions.length} posiciones`);

  // ── 3. NAV y cash ────────────────────────────────────────────────────────
  process.stdout.write('Obteniendo NAV... ');
  let nav = null;
  try {
    const summary = await cpgGet(`/v1/api/portfolio/${ACCOUNT_ID}/summary`);
    if (summary?.netliquidation?.amount != null) {
      nav = {
        report_date: new Date().toISOString().slice(0, 10),
        total_nav:   summary.netliquidation.amount,
        cash:        summary.totalcashvalue?.amount ?? null,
        stock:       summary.grosspositionvalue?.amount ?? null,
      };
      console.log(`$${nav.total_nav.toLocaleString('en-US', { maximumFractionDigits: 0 })}`);
    } else {
      console.log('no disponible');
    }
  } catch {
    console.log('no disponible');
  }

  // ── 4. Trades recientes (últimos ~7 días) ────────────────────────────────
  process.stdout.write('Obteniendo trades recientes... ');
  let trades = [];
  try {
    const rawTrades = await cpgGet('/v1/api/iserver/account/trades');
    if (Array.isArray(rawTrades)) {
      function parseIbDate(s) {
        if (!s) return null;
        // formato: "20260528-09:30:00" o "20260528;093000"
        const clean = s.replace(/[T;]/, '-').replace(/(\d{4})(\d{2})(\d{2})-(.*)/, '$1-$2-$3 $4');
        return clean.slice(0, 19);
      }
      trades = rawTrades.map(t => ({
        trade_id:    t.execution_id || null,
        symbol:      t.symbol,
        description: null,
        asset_cat:   'STK',
        trade_date:  t.trade_time ? t.trade_time.slice(0, 10).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') : null,
        datetime:    parseIbDate(t.trade_time),
        buy_sell:    t.side === 'B' ? 'BUY' : 'SELL',
        quantity:    parseFloat(t.size)  || null,
        price:       parseFloat(t.price) || null,
        proceeds:    t.net_amount ? -t.net_amount : null,
        commission:  null,
        net_cash:    t.net_amount ? -t.net_amount : null,
        cost_basis:  null,
        realized_pl: null,
        open_close:  null,
        currency:    t.currency || 'USD',
        exchange:    t.exchange || null,
      }));
      console.log(`${trades.length} trades`);
    } else {
      console.log('0 trades');
    }
  } catch {
    console.log('no disponible');
  }

  // ── 5. Login portal ──────────────────────────────────────────────────────
  process.stdout.write('Autenticando portal... ');
  const loginRes = await fetch(`${PORTAL_URL}/api/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: ADMIN_USER, password: ADMIN_PASS }),
  });
  const { token, error: loginErr } = await loginRes.json();
  if (!token) { console.error(`\nError: ${loginErr}`); process.exit(1); }
  console.log('OK');

  // ── 6. Subir al portal ───────────────────────────────────────────────────
  process.stdout.write('Actualizando portal... ');
  const res = await fetch(`${PORTAL_URL}/api/portafolio/upload-data`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ trades, positions, nav }),
  });
  const data = await res.json();
  if (data.error) { console.error(`\nError: ${data.error}`); process.exit(1); }
  console.log('OK');

  const hora = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  console.log(`\n✓ Portal actualizado a las ${hora}`);
  console.log(`  ${positions.length} posiciones · ${trades.length} trades nuevos · NAV ${nav ? '$' + nav.total_nav.toLocaleString('en-US', { maximumFractionDigits: 0 }) : 'N/A'}`);
  console.log(`  https://reportes.murzainversiones.com/portafolio`);
}

main().catch(err => { console.error('\n❌ Error:', err.message); process.exit(1); });

/**
 * sync_ib.mjs — Sincroniza datos del Flex Web Service de IB con Turso
 * Uso: node sync_ib.mjs
 * Variables de entorno: IB_FLEX_TOKEN, IB_FLEX_QUERY_ID, TURSO_URL, TURSO_TOKEN
 */
import { createClient } from '@libsql/client';

const IB_TOKEN    = process.env.IB_FLEX_TOKEN;
const IB_QUERY_ID = process.env.IB_FLEX_QUERY_ID;
const TURSO_URL   = process.env.TURSO_URL;
const TURSO_TOKEN = process.env.TURSO_TOKEN;

if (!IB_TOKEN || !IB_QUERY_ID || !TURSO_URL || !TURSO_TOKEN) {
  console.error('❌ Faltan variables de entorno: IB_FLEX_TOKEN, IB_FLEX_QUERY_ID, TURSO_URL, TURSO_TOKEN');
  process.exit(1);
}

const db = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Parsea todos los elementos de un tag XML y devuelve sus atributos
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

function parseDate(s) {
  if (!s || s.length < 8) return null;
  return `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`;
}

function parseDateTime(s) {
  if (!s) return null;
  const [datePart, timePart] = s.split(';');
  const d = parseDate(datePart);
  if (!d) return null;
  if (timePart && timePart.length >= 6) {
    return `${d} ${timePart.slice(0,2)}:${timePart.slice(2,4)}:${timePart.slice(4,6)}`;
  }
  return d;
}

function num(v) { const n = parseFloat(v); return isNaN(n) ? null : n; }

async function fetchFlexStatement() {
  const sendUrl = `https://gdcdyn.interactivebrokers.com/Universal/servlet/FlexStatementService.SendRequest?t=${IB_TOKEN}&q=${IB_QUERY_ID}&v=3`;

  // Reintenta SendRequest hasta 5 veces (IB a veces tarda en estar listo)
  let refCode = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    if (attempt > 0) {
      console.log(`  ⏳ Reintentando SendRequest en 15 segundos... (intento ${attempt + 1}/5)`);
      await sleep(15000);
    }
    console.log('📡 Solicitando statement a IB...');
    const r1 = await fetch(sendUrl);
    const xml1 = await r1.text();
    console.log(`  📥 SendRequest respuesta: ${xml1.slice(0, 300)}`);

    const refMatch   = xml1.match(/<ReferenceCode>(\d+)<\/ReferenceCode>/);
    const statusMatch = xml1.match(/<Status>(\w+)<\/Status>/);
    const errMsg     = xml1.match(/<ErrorMessage>([^<]+)<\/ErrorMessage>/)?.[1] || '';

    if (refMatch && statusMatch?.[1] === 'Success') {
      refCode = refMatch[1];
      break;
    }
    // "could not be generated" = transitorio, reintentar
    if (errMsg.toLowerCase().includes('try again') || errMsg.toLowerCase().includes('could not')) {
      console.log(`  ⚠️  IB no listo: ${errMsg}`);
      continue;
    }
    throw new Error(`IB SendRequest error: ${errMsg || xml1.slice(0, 200)}`);
  }
  if (!refCode) throw new Error('IB no pudo generar el statement después de 5 intentos');
  console.log(`✅ ReferenceCode: ${refCode} — esperando statement...`);

  const getBaseUrl = 'https://gdcdyn.interactivebrokers.com/Universal/servlet/FlexStatementService.GetStatement';
  for (let i = 0; i < 10; i++) {
    await sleep(i === 0 ? 8000 : 5000);
    const getUrl = `${getBaseUrl}?t=${IB_TOKEN}&v=3&q=${IB_QUERY_ID}&ReferenceCode=${refCode}`;
    console.log(`  ⏳ Intento ${i + 1}/10...`);
    const r2 = await fetch(getUrl);
    const xml2 = await r2.text();
    console.log(`  📥 Respuesta IB: ${xml2.slice(0, 300)}`);
    if (xml2.includes('<FlexQueryResponse')) return xml2;
    const errCode = xml2.match(/<ErrorCode>(\d+)<\/ErrorCode>/)?.[1] || '';
    const errMsg  = xml2.match(/<ErrorMessage>([^<]+)<\/ErrorMessage>/)?.[1] || '';
    // 1019 = generation in progress, reintentar siempre en errores transitorios
    if (errCode === '1019' || errMsg.toLowerCase().includes('progress') || errMsg.toLowerCase().includes('invalid')) {
      console.log(`  ⏳ No listo aún (${errCode}: ${errMsg}), reintentando...`);
      continue;
    }
    throw new Error(`IB error ${errCode}: ${errMsg || xml2.slice(0, 200)}`);
  }
  throw new Error('Timeout: IB no entregó el statement después de 10 intentos');
}

async function syncTrades(xml) {
  const trades = parseElements(xml, 'Trade');
  let inserted = 0, skipped = 0;
  for (const t of trades) {
    if (t.levelOfDetail !== 'EXECUTION' && t.levelOfDetail) continue;
    try {
      await db.execute({
        sql: `INSERT OR IGNORE INTO ib_trades
          (trade_id, symbol, description, asset_cat, trade_date, datetime,
           buy_sell, quantity, price, proceeds, commission, net_cash,
           cost_basis, realized_pl, open_close, currency, exchange)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        args: [
          t.tradeID || null,
          t.symbol, t.description || null, t.assetCategory || null,
          parseDate(t.tradeDate), parseDateTime(t.dateTime),
          t.buySell, num(t.quantity), num(t.tradePrice),
          num(t.proceeds), num(t.ibCommission), num(t.netCash),
          num(t.costBasis), num(t.realizedPL), t.openCloseIndicator || null,
          t.currency || 'USD', t.exchange || null,
        ],
      });
      inserted++;
    } catch { skipped++; }
  }
  console.log(`  Trades: ${inserted} insertados, ${skipped} ya existían`);
}

async function syncPositions(xml) {
  const positions = parseElements(xml, 'OpenPosition');
  const summaries = positions.filter(p => p.levelOfDetail === 'LOT' || !p.levelOfDetail);
  let upserted = 0;
  for (const p of summaries) {
    await db.execute({
      sql: `INSERT INTO ib_positions
          (symbol, description, asset_cat, quantity, mark_price, position_value,
           open_price, cost_basis, unrealized_pl, pct_nav, side, open_datetime,
           currency, report_date, updated_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?, strftime('%Y-%m-%d %H:%M:%S','now'))
          ON CONFLICT(symbol) DO UPDATE SET
            quantity=excluded.quantity, mark_price=excluded.mark_price,
            position_value=excluded.position_value, open_price=excluded.open_price,
            cost_basis=excluded.cost_basis, unrealized_pl=excluded.unrealized_pl,
            pct_nav=excluded.pct_nav, side=excluded.side,
            open_datetime=excluded.open_datetime, report_date=excluded.report_date,
            updated_at=strftime('%Y-%m-%d %H:%M:%S','now')`,
      args: [
        p.symbol, p.description || null, p.assetCategory || null,
        num(p.quantity), num(p.markPrice), num(p.positionValue),
        num(p.openPrice), num(p.costBasisPrice), num(p.unrealizedPnL),
        num(p.percentOfNAV), p.side || null, parseDateTime(p.openDateTime),
        p.currency || 'USD', parseDate(p.reportDate),
      ],
    });
    upserted++;
  }
  console.log(`  Posiciones: ${upserted} actualizadas`);
}

async function syncNAV(xml) {
  const navItems = parseElements(xml, 'NetAssetValue');
  const totals = navItems.filter(n => n.assetCategory === 'Total' || n.assetCategory === 'BASE_SUMMARY');
  if (totals.length === 0) {
    // Try CashReportCurrency for ending cash
    const cash = parseElements(xml, 'CashReportCurrency');
    const base = cash.find(c => c.currency === 'BASE_SUMMARY') || cash[0];
    if (base) {
      const today = new Date().toISOString().slice(0, 10);
      await db.execute({
        sql: `INSERT OR IGNORE INTO ib_nav (report_date, total_nav, cash, stock) VALUES (?,?,?,?)`,
        args: [today, num(base.endingCash), num(base.endingCash), null],
      });
      console.log(`  NAV: guardado ${today} — cash $${base.endingCash}`);
    }
    return;
  }
  for (const n of totals) {
    const date = parseDate(n.reportDate) || new Date().toISOString().slice(0, 10);
    await db.execute({
      sql: `INSERT OR IGNORE INTO ib_nav (report_date, total_nav, cash, stock) VALUES (?,?,?,?)`,
      args: [date, num(n.total), num(n.cash), num(n.stock)],
    });
  }
  console.log(`  NAV: ${totals.length} puntos guardados`);
}

async function main() {
  console.log('🔄 Iniciando sync IB Paper Trading → Turso');
  const xml = await fetchFlexStatement();
  console.log(`📄 XML recibido (${Math.round(xml.length / 1024)}KB)`);
  await syncTrades(xml);
  await syncPositions(xml);
  await syncNAV(xml);
  console.log('✅ Sync completado');
  process.exit(0);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });

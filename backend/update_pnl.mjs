#!/usr/bin/env node
/**
 * Actualiza realized_pl en ib_trades usando fifoPnlRealized del XML de IB.
 * Uso: node update_pnl.mjs <ruta-al-xml>
 */
import { readFileSync } from 'fs';
import { createClient } from '@libsql/client';

const TURSO_URL   = 'libsql://portal-murza-raymurrag-cloud.aws-us-east-1.turso.io';
const TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzQ0ODQzNjIsImlkIjoiMDE5ZDI3ODEtZmUwMS03OGNmLTg4Y2YtODk4NzViODc0N2FlIiwicmlkIjoiYmEzYjRmNmYtOWY5Ni00MjQ5LTlmOGMtZmZiNGI5NGNlNThlIn0.bOWEnoikCHiDlWrjvKjUk5l-PkUNKzJF4ema-3jLF_AClvSZUGL2it-lfBhrtUI20mBvPhD01dt0DqadgfY1Bg';

const xmlPath = process.argv[2];
if (!xmlPath) { console.error('Uso: node update_pnl.mjs <ruta-al-xml>'); process.exit(1); }

function num(v) { const n = parseFloat(v); return isNaN(n) ? null : n; }
function parseDate(s) {
  if (!s || s.length < 8) return null;
  return `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`;
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

async function main() {
  const xml = readFileSync(xmlPath, 'utf8');
  const db  = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

  const trades = parseElements(xml, 'Trade')
    .filter(t => !t.levelOfDetail || t.levelOfDetail === 'EXECUTION')
    .map(t => ({
      symbol:      t.symbol,
      trade_date:  parseDate(t.tradeDate),
      buy_sell:    t.buySell,
      quantity:    num(t.quantity),
      price:       num(t.tradePrice),
      realized_pl: num(t.fifoPnlRealized),  // campo correcto de IB
      cost_basis:  num(t.cost),             // 'cost' no 'costBasis' en trades
    }));

  console.log(`${trades.length} trades en XML`);

  let updated = 0;
  for (const t of trades) {
    if (t.realized_pl === null) continue;

    // Actualizar por símbolo + fecha + lado (cantidad puede ser negativa en BD para sells)
    const r = await db.execute({
      sql: `UPDATE ib_trades SET realized_pl = ?, cost_basis = ?
            WHERE symbol = ? AND trade_date = ? AND buy_sell = ?
              AND ABS(ABS(quantity) - ?) < 0.01 AND ABS(price - ?) < 0.01`,
      args: [t.realized_pl, t.cost_basis, t.symbol, t.trade_date, t.buy_sell, Math.abs(t.quantity), t.price],
    });
    if (r.rowsAffected > 0) {
      updated++;
      if (t.realized_pl !== 0) process.stdout.write(`  ${t.buy_sell} ${t.symbol} P&L: $${t.realized_pl.toFixed(2)}\n`);
    }
  }

  console.log(`\n✓ ${updated} trades actualizados`);

  // Resumen P&L
  const res = await db.execute({
    sql: `SELECT buy_sell, COUNT(*) as n, SUM(realized_pl) as total
          FROM ib_trades WHERE realized_pl IS NOT NULL AND realized_pl != 0
          GROUP BY buy_sell`,
    args: [],
  });
  res.rows.forEach(r => console.log(`  ${r.buy_sell}: ${r.n} trades, P&L total: $${r.total?.toFixed(2)}`));
}

main().catch(err => { console.error('Error:', err.message); process.exit(1); });

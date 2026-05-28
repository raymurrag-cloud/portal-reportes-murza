#!/usr/bin/env node
/**
 * Importa historial de NAV directamente a Turso desde XML de IB.
 * No requiere que el backend esté corriendo.
 * Uso: node import_nav.mjs <ruta-al-xml>
 */

import { readFileSync } from 'fs';
import { createClient } from '@libsql/client';

const TURSO_URL   = 'libsql://portal-murza-raymurrag-cloud.aws-us-east-1.turso.io';
const TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzQ0ODQzNjIsImlkIjoiMDE5ZDI3ODEtZmUwMS03OGNmLTg4Y2YtODk4NzViODc0N2FlIiwicmlkIjoiYmEzYjRmNmYtOWY5Ni00MjQ5LTlmOGMtZmZiNGI5NGNlNThlIn0.bOWEnoikCHiDlWrjvKjUk5l-PkUNKzJF4ema-3jLF_AClvSZUGL2it-lfBhrtUI20mBvPhD01dt0DqadgfY1Bg';

const xmlPath = process.argv[2];
if (!xmlPath) { console.error('Uso: node import_nav.mjs <ruta-al-xml>'); process.exit(1); }

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
  console.log('Parseando XML...');

  const summaries = parseElements(xml, 'EquitySummaryByReportDateInBase')
    .map(e => ({
      report_date: parseDate(e.reportDate),
      total_nav:   num(e.total),
      cash:        num(e.cash),
      stock:       num(e.stock),
    }))
    .filter(e => e.report_date && e.total_nav !== null);

  console.log(`Encontrados ${summaries.length} días de NAV histórico`);
  if (!summaries.length) { console.log('Nada que importar.'); return; }

  const db = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

  let imported = 0;
  for (const s of summaries) {
    const r = await db.execute({
      sql: `INSERT OR IGNORE INTO ib_nav (report_date, total_nav, cash, stock) VALUES (?,?,?,?)`,
      args: [s.report_date, s.total_nav, s.cash, s.stock],
    });
    if (r.rowsAffected > 0) imported++;
    process.stdout.write(`\r  Importados: ${imported} / ${summaries.length}`);
  }

  console.log(`\n✓ ${imported} días nuevos insertados en Turso`);

  // Verificar
  const count = await db.execute({ sql: `SELECT COUNT(*) as n FROM ib_nav`, args: [] });
  console.log(`✓ Total en BD: ${count.rows[0].n} días de NAV`);
}

main().catch(err => { console.error('Error:', err.message); process.exit(1); });

// Migración one-time: lee earningsData.js y lo vuelca a la tabla earnings en Turso
// Ejecutar: node migrate_earnings.mjs

import { createClient } from '@libsql/client';
import { EARNINGS_DATA } from '../frontend/src/components/portal/earningsData.js';

const db = createClient({
  url:       process.env.TURSO_URL,
  authToken: process.env.TURSO_TOKEN,
});

let inserted = 0, updated = 0, errors = 0;

for (const [ticker, e] of Object.entries(EARNINGS_DATA)) {
  try {
    const wtwJson = JSON.stringify(e.what_to_watch ?? []);
    const { rows } = await db.execute({ sql: 'SELECT ticker FROM earnings WHERE ticker = ?', args: [ticker] });

    if (rows.length > 0) {
      await db.execute({
        sql: `UPDATE earnings SET
                nombre=?, trimestre=?, fecha=?, cuando=?, fecha_confirmada=?,
                fecha_siguiente=?, trimestre_siguiente=?,
                eps_estimate=?, revenue_estimate_b=?, forward_pe=?, last_surprise_pct=?,
                what_to_watch=?, updated_at=strftime('%Y-%m-%d %H:%M:%S','now')
              WHERE ticker=?`,
        args: [
          e.nombre ?? null, e.trimestre ?? null, e.fecha ?? null, e.cuando ?? null,
          e.fecha_confirmada ? 1 : 0,
          e.fecha_siguiente ?? null, e.trimestre_siguiente ?? null,
          e.eps_estimate ?? null, e.revenue_estimate_b ?? null,
          e.forward_pe ?? null, e.last_surprise_pct ?? null,
          wtwJson, ticker,
        ],
      });
      updated++;
      console.log(`✓ Updated: ${ticker}`);
    } else {
      await db.execute({
        sql: `INSERT INTO earnings (ticker, nombre, trimestre, fecha, cuando, fecha_confirmada,
                fecha_siguiente, trimestre_siguiente,
                eps_estimate, revenue_estimate_b, forward_pe, last_surprise_pct, what_to_watch)
              VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        args: [
          ticker, e.nombre ?? null, e.trimestre ?? null, e.fecha ?? null, e.cuando ?? null,
          e.fecha_confirmada ? 1 : 0,
          e.fecha_siguiente ?? null, e.trimestre_siguiente ?? null,
          e.eps_estimate ?? null, e.revenue_estimate_b ?? null,
          e.forward_pe ?? null, e.last_surprise_pct ?? null,
          wtwJson,
        ],
      });
      inserted++;
      console.log(`✓ Inserted: ${ticker}`);
    }
  } catch(e2) {
    errors++;
    console.error(`✗ Error ${ticker}: ${e2.message}`);
  }
}

console.log(`\nMigración completa: ${inserted} insertados, ${updated} actualizados, ${errors} errores`);
process.exit(errors > 0 ? 1 : 0);

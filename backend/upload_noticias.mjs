/**
 * upload_noticias.mjs
 * Sube noticias a Turso directamente (sin pasar por el backend HTTP).
 *
 * Uso:
 *   node upload_noticias.mjs ../noticias.json
 *
 * El archivo JSON debe ser un array de objetos con esta forma:
 * [
 *   {
 *     "ticker":        "NVDA",
 *     "titulo":        "NVIDIA anuncia acuerdo con Microsoft para chips H200",
 *     "resumen":       "Descripcion de 2-4 oraciones con el impacto concreto...",
 *     "fuente":        "CNBC",          // opcional
 *     "url":           "https://...",   // opcional
 *     "fecha_noticia": "2026-05-27",    // YYYY-MM-DD
 *     "impacto":       "positivo"       // positivo | negativo | neutral
 *   },
 *   ...
 * ]
 */

import { createClient } from '@libsql/client';
import { readFileSync }  from 'fs';

const TURSO_URL   = process.env.TURSO_URL   || 'libsql://portal-murza-raymurrag-cloud.aws-us-east-1.turso.io';
const TURSO_TOKEN = process.env.TURSO_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzQ0ODQzNjIsImlkIjoiMDE5ZDI3ODEtZmUwMS03OGNmLTg4Y2YtODk4NzViODc0N2FlIiwicmlkIjoiYmEzYjRmNmYtOWY5Ni00MjQ5LTlmOGMtZmZiNGI5NGNlNThlIn0.bOWEnoikCHiDlWrjvKjUk5l-PkUNKzJF4ema-3jLF_AClvSZUGL2it-lfBhrtUI20mBvPhD01dt0DqadgfY1Bg';

const db = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

const archivo = process.argv[2] || '../noticias.json';
let noticias;
try {
  noticias = JSON.parse(readFileSync(archivo, 'utf8'));
} catch (e) {
  console.error(`❌ No se pudo leer ${archivo}: ${e.message}`);
  process.exit(1);
}

if (!Array.isArray(noticias) || noticias.length === 0) {
  console.error('❌ El archivo debe contener un array no vacío de noticias.');
  process.exit(1);
}

// Crear tabla si no existe (migración inline)
await db.execute({
  sql: `CREATE TABLE IF NOT EXISTS noticias (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker        TEXT NOT NULL,
    titulo        TEXT NOT NULL,
    resumen       TEXT NOT NULL,
    fuente        TEXT,
    url           TEXT,
    fecha_noticia TEXT NOT NULL,
    impacto       TEXT DEFAULT 'neutral',
    created_at    TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S','now')),
    updated_at    TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S','now'))
  )`,
  args: [],
});
try {
  await db.execute({ sql: `CREATE INDEX IF NOT EXISTS idx_noticias_ticker ON noticias(ticker)`, args: [] });
  await db.execute({ sql: `CREATE INDEX IF NOT EXISTS idx_noticias_fecha  ON noticias(fecha_noticia)`, args: [] });
} catch {}

// Tickers válidos en el portal
const { rows: reporteRows } = await db.execute({ sql: 'SELECT DISTINCT ticker FROM reportes', args: [] });
const tickersValidos = new Set(reporteRows.map(r => r.ticker.toUpperCase()));

const IMPACTOS_VALIDOS = new Set(['positivo', 'negativo', 'neutral']);

let insertados = 0, omitidos = 0, duplicados = 0;

for (const item of noticias) {
  const ticker = (item.ticker || '').toUpperCase();

  if (!ticker || !tickersValidos.has(ticker)) {
    console.log(`  ⚠  ${ticker || '(sin ticker)'} — no existe en el portal, omitido`);
    omitidos++;
    continue;
  }
  if (!item.titulo || !item.resumen || !item.fecha_noticia) {
    console.log(`  ⚠  ${ticker} — campos incompletos (titulo/resumen/fecha_noticia requeridos)`);
    omitidos++;
    continue;
  }

  const impacto = IMPACTOS_VALIDOS.has(item.impacto) ? item.impacto : 'neutral';

  // Verificar duplicado
  const { rows: dup } = await db.execute({
    sql:  `SELECT id FROM noticias WHERE ticker = ? AND titulo = ? AND date(fecha_noticia) = date(?)`,
    args: [ticker, item.titulo.slice(0, 300), item.fecha_noticia],
  });
  if (dup.length > 0) {
    console.log(`  ↩  ${ticker} — duplicado, omitido`);
    duplicados++;
    continue;
  }

  await db.execute({
    sql:  `INSERT INTO noticias (ticker, titulo, resumen, fuente, url, fecha_noticia, impacto)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      ticker,
      item.titulo.slice(0, 300),
      item.resumen.slice(0, 2000),
      (item.fuente || '').slice(0, 100),
      (item.url    || '').slice(0, 500),
      item.fecha_noticia,
      impacto,
    ],
  });

  console.log(`  ✅ ${ticker} — "${item.titulo.slice(0, 60)}…"`);
  insertados++;
}

console.log(`\n📰 Noticias: ${insertados} insertadas | ${duplicados} duplicadas | ${omitidos} omitidas`);

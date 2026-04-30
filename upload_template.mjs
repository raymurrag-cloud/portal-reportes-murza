// C:/Users/murra/portal-reportes/upload_template.mjs
// Plantilla permanente — NO regenerar. Solo editar las 4 variables de abajo.
import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';

// === EDITAR ESTAS 4 VARIABLES UNICAMENTE ===
const TICKER    = 'PLTR';
const EMPRESA   = 'Palantir Technologies Inc.';
const SLUG      = TICKER;
const META_DESC = `Analisis financiero de Palantir (PLTR) basado en 10-K FY2025. Revenue $4.48B +56% YoY, lider en IA operacional con AIP, FCF $2.1B, balance sin deuda. P/E 215x — negocio excepcional a valuacion extrema.`;
// ==========================================

const db = createClient({
  url: 'libsql://portal-murza-raymurrag-cloud.aws-us-east-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzQ0ODQzNjIsImlkIjoiMDE5ZDI3ODEtZmUwMS03OGNmLTg4Y2YtODk4NzViODc0N2FlIiwicmlkIjoiYmEzYjRmNmYtOWY5Ni00MjQ5LTlmOGMtZmZiNGI5NGNlNThlIn0.bOWEnoikCHiDlWrjvKjUk5l-PkUNKzJF4ema-3jLF_AClvSZUGL2it-lfBhrtUI20mBvPhD01dt0DqadgfY1Bg'
});

const json = readFileSync(`C:/Users/murra/portal-reportes/${TICKER}.json`, 'utf8');
JSON.parse(json); // validacion — lanza error si JSON invalido

await db.execute({
  sql: 'INSERT INTO reportes (ticker, empresa, contenido_md, contenido_json, parrafos_gratis, publicado, slug, meta_descripcion) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  args: [TICKER, EMPRESA, '', json, 14, 1, SLUG, META_DESC]
});

console.log('OK: https://reportes.murzainversiones.com/reporte/' + SLUG);

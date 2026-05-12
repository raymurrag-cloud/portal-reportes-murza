import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';
const db = createClient({
  url: 'libsql://portal-murza-raymurrag-cloud.aws-us-east-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzQ0ODQzNjIsImlkIjoiMDE5ZDI3ODEtZmUwMS03OGNmLTg4Y2YtODk4NzViODc0N2FlIiwicmlkIjoiYmEzYjRmNmYtOWY5Ni00MjQ5LTlmOGMtZmZiNGI5NGNlNThlIn0.bOWEnoikCHiDlWrjvKjUk5l-PkUNKzJF4ema-3jLF_AClvSZUGL2it-lfBhrtUI20mBvPhD01dt0DqadgfY1Bg'
});
const ticker = 'NOW';
const empresa = 'ServiceNow Inc.';
const json = readFileSync('../NOW.json', 'utf8');
JSON.parse(json);
const existing = await db.execute({ sql: 'SELECT id FROM reportes WHERE ticker = ?', args: [ticker] });
if (existing.rows.length > 0) {
  await db.execute({ sql: "UPDATE reportes SET contenido_json=?, meta_descripcion=?, updated_at=datetime('now') WHERE ticker=?", args: [json, 'Analisis financiero de ServiceNow (NOW): SaaS enterprise, revenue, FCF, margenes y veredicto de inversion.', ticker] });
  console.log('UPDATED NOW');
} else {
  await db.execute({ sql: 'INSERT INTO reportes (ticker, empresa, contenido_md, contenido_json, parrafos_gratis, publicado, slug, meta_descripcion) VALUES (?,?,?,?,?,?,?,?)', args: [ticker, empresa, '', json, 9, 1, ticker, 'Analisis financiero de ServiceNow (NOW): SaaS enterprise, revenue, FCF, margenes y veredicto de inversion.'] });
  console.log('INSERTED NOW');
}

import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';

const TICKER    = 'CEG';
const EMPRESA   = 'Constellation Energy Group';
const META_DESC = 'Analisis financiero de Constellation Energy (CEG): el mayor operador nuclear de EE.UU. con 21 reactores y contratos PPA con hiperescaladores de IA.';

const db = createClient({
  url: 'libsql://portal-murza-raymurrag-cloud.aws-us-east-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzQ0ODQzNjIsImlkIjoiMDE5ZDI3ODEtZmUwMS03OGNmLTg4Y2YtODk4NzViODc0N2FlIiwicmlkIjoiYmEzYjRmNmYtOWY5Ni00MjQ5LTlmOGMtZmZiNGI5NGNlNThlIn0.bOWEnoikCHiDlWrjvKjUk5l-PkUNKzJF4ema-3jLF_AClvSZUGL2it-lfBhrtUI20mBvPhD01dt0DqadgfY1Bg'
});

const json = readFileSync('C:/Users/murra/portal-reportes/CEG.json', 'utf8');
JSON.parse(json);

const existing = await db.execute({ sql: 'SELECT id FROM reportes WHERE ticker = ?', args: [TICKER] });

if (existing.rows.length > 0) {
  await db.execute({
    sql: 'UPDATE reportes SET contenido_json = ?, empresa = ?, meta_descripcion = ?, publicado = 1 WHERE ticker = ?',
    args: [json, EMPRESA, META_DESC, TICKER]
  });
  console.log('UPDATED: ' + TICKER);
} else {
  await db.execute({
    sql: 'INSERT INTO reportes (ticker, empresa, contenido_md, contenido_json, parrafos_gratis, publicado, slug, meta_descripcion) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    args: [TICKER, EMPRESA, '', json, 14, 1, TICKER, META_DESC]
  });
  console.log('INSERTED: ' + TICKER);
}

console.log('https://reportes.murzainversiones.com/reporte/' + TICKER);

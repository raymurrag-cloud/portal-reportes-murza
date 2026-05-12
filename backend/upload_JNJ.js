import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';

const db = createClient({
  url: 'libsql://portal-murza-raymurrag-cloud.aws-us-east-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzQ0ODQzNjIsImlkIjoiMDE5ZDI3ODEtZmUwMS03OGNmLTg4Y2YtODk4NzViODc0N2FlIiwicmlkIjoiYmEzYjRmNmYtOWY5Ni00MjQ5LTlmOGMtZmZiNGI5NGNlNThlIn0.bOWEnoikCHiDlWrjvKjUk5l-PkUNKzJF4ema-3jLF_AClvSZUGL2it-lfBhrtUI20mBvPhD01dt0DqadgfY1Bg'
});

const ticker = 'JNJ';
const empresa = 'Johnson & Johnson';
const json = readFileSync('../JNJ.json', 'utf8');

// Validate JSON before uploading
JSON.parse(json);
console.log('JSON validated OK, size:', json.length, 'bytes');

const existing = await db.execute({
  sql: 'SELECT id FROM reportes WHERE ticker = ?',
  args: [ticker]
});

if (existing.rows.length > 0) {
  await db.execute({
    sql: "UPDATE reportes SET contenido_json=?, meta_descripcion=?, updated_at=datetime('now') WHERE ticker=?",
    args: [
      json,
      'Analisis financiero de Johnson & Johnson (JNJ): pharma + medtech, Darzalex, FCF, dividendo y veredicto.',
      ticker
    ]
  });
  console.log('UPDATED JNJ -- id:', existing.rows[0].id);
} else {
  await db.execute({
    sql: 'INSERT INTO reportes (ticker, empresa, contenido_md, contenido_json, parrafos_gratis, publicado, slug, meta_descripcion) VALUES (?,?,?,?,?,?,?,?)',
    args: [
      ticker,
      empresa,
      '',
      json,
      9,
      1,
      ticker,
      'Analisis financiero de Johnson & Johnson (JNJ): pharma + medtech, Darzalex, FCF, dividendo y veredicto.'
    ]
  });
  console.log('INSERTED JNJ');
}

console.log('DONE');

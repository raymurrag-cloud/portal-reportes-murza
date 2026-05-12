import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';

const db = createClient({
  url: 'libsql://portal-murza-raymurrag-cloud.aws-us-east-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzQ0ODQzNjIsImlkIjoiMDE5ZDI3ODEtZmUwMS03OGNmLTg4Y2YtODk4NzViODc0N2FlIiwicmlkIjoiYmEzYjRmNmYtOWY5Ni00MjQ5LTlmOGMtZmZiNGI5NGNlNThlIn0.bOWEnoikCHiDlWrjvKjUk5l-PkUNKzJF4ema-3jLF_AClvSZUGL2it-lfBhrtUI20mBvPhD01dt0DqadgfY1Bg'
});

const json = readFileSync('C:/Users/murra/portal-reportes/NVO.json', 'utf8');
JSON.parse(json); // Validates JSON before uploading

const result = await db.execute({
  sql: 'UPDATE reportes SET contenido_json = ?, updated_at = CURRENT_TIMESTAMP, fecha_reporte = ? WHERE ticker = ?',
  args: [json, '2026-05-07', 'NVO']
});

console.log('Filas actualizadas:', result.rowsAffected);

// Verify the update
const verify = await db.execute({
  sql: 'SELECT ticker, updated_at, fecha_reporte FROM reportes WHERE ticker = ?',
  args: ['NVO']
});

console.log('Verificacion:');
console.table(verify.rows);

await db.close();

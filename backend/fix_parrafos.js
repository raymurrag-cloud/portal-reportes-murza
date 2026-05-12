import { createClient } from '@libsql/client';

const db = createClient({
  url: 'libsql://portal-murza-raymurrag-cloud.aws-us-east-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzQ0ODQzNjIsImlkIjoiMDE5ZDI3ODEtZmUwMS03OGNmLTg4Y2YtODk4NzViODc0N2FlIiwicmlkIjoiYmEzYjRmNmYtOWY5Ni00MjQ5LTlmOGMtZmZiNGI5NGNlNThlIn0.bOWEnoikCHiDlWrjvKjUk5l-PkUNKzJF4ema-3jLF_AClvSZUGL2it-lfBhrtUI20mBvPhD01dt0DqadgfY1Bg'
});

// Ver estado actual
const antes = await db.execute('SELECT ticker, parrafos_gratis FROM reportes ORDER BY ticker');
console.log(`\nTotal reportes: ${antes.rows.length}`);
const distintos = [...new Set(antes.rows.map(r => r.parrafos_gratis))];
console.log(`Valores actuales de parrafos_gratis: ${distintos.join(', ')}`);

// Actualizar todos a 14
const result = await db.execute("UPDATE reportes SET parrafos_gratis = 14");
console.log(`\nActualizados: ${result.rowsAffected} reportes → parrafos_gratis = 14`);

// Verificar
const despues = await db.execute('SELECT COUNT(*) as total FROM reportes WHERE parrafos_gratis = 14');
console.log(`Verificacion: ${despues.rows[0].total} reportes con parrafos_gratis = 14`);

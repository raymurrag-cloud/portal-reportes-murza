/**
 * Migración: agrega columna `tipo` a la tabla reportes
 * Corre una sola vez. Valores: 'accion' (default) | 'etf'
 *
 * Uso: node migrate_add_tipo.js
 */
import { createClient } from '@libsql/client';

const db = createClient({
  url:       'libsql://portal-murza-raymurrag-cloud.aws-us-east-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzQ0ODQzNjIsImlkIjoiMDE5ZDI3ODEtZmUwMS03OGNmLTg4Y2YtODk4NzViODc0N2FlIiwicmlkIjoiYmEzYjRmNmYtOWY5Ni00MjQ5LTlmOGMtZmZiNGI5NGNlNThlIn0.bOWEnoikCHiDlWrjvKjUk5l-PkUNKzJF4ema-3jLF_AClvSZUGL2it-lfBhrtUI20mBvPhD01dt0DqadgfY1Bg',
});

try {
  await db.execute(`ALTER TABLE reportes ADD COLUMN tipo TEXT DEFAULT 'accion'`);
  console.log('OK — columna tipo agregada con default accion');
} catch (e) {
  if (e.message.includes('duplicate column')) {
    console.log('La columna tipo ya existe — nada que hacer');
  } else {
    console.error('Error en migración:', e.message);
    process.exit(1);
  }
}

process.exit(0);

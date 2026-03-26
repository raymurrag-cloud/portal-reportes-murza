import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';

export const db = createClient({
  url:       process.env.TURSO_URL,
  authToken: process.env.TURSO_TOKEN,
});

export async function initDb() {
  await db.batch([
    `CREATE TABLE IF NOT EXISTS reportes (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      ticker           TEXT NOT NULL,
      empresa          TEXT NOT NULL,
      contenido_md     TEXT NOT NULL,
      parrafos_gratis  INTEGER NOT NULL DEFAULT 2,
      publicado        INTEGER NOT NULL DEFAULT 0,
      slug             TEXT UNIQUE,
      meta_descripcion TEXT,
      created_at       TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S','now')),
      updated_at       TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S','now'))
    )`,
    `CREATE TABLE IF NOT EXISTS usuarios_portal (
      id                 INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre             TEXT NOT NULL,
      correo             TEXT NOT NULL UNIQUE,
      telefono           TEXT,
      ciudad             TEXT,
      tiene_inversiones  INTEGER NOT NULL DEFAULT 0,
      capital_disponible TEXT NOT NULL,
      password_hash      TEXT NOT NULL,
      created_at         TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S','now'))
    )`,
    `CREATE TABLE IF NOT EXISTS admins (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at    TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S','now'))
    )`,
    `CREATE INDEX IF NOT EXISTS idx_reportes_ticker    ON reportes(ticker)`,
    `CREATE INDEX IF NOT EXISTS idx_reportes_publicado ON reportes(publicado)`,
    `CREATE INDEX IF NOT EXISTS idx_usuarios_correo    ON usuarios_portal(correo)`,
  ], 'write');

  // Seed admin si no existe
  const res = await db.execute({ sql: 'SELECT id FROM admins WHERE username = ?', args: ['raymurra'] });
  if (res.rows.length === 0) {
    const hash = bcrypt.hashSync('Portal2026', 10);
    await db.execute({ sql: 'INSERT INTO admins (username, password_hash) VALUES (?, ?)', args: ['raymurra', hash] });
    console.log('✅ Admin creado: raymurra / Portal2026');
  }

  // Migración: agregar contenido_json si no existe
  try {
    await db.execute({ sql: 'ALTER TABLE reportes ADD COLUMN contenido_json TEXT', args: [] });
    console.log('✅ Migración: columna contenido_json agregada');
  } catch { /* ya existe, ignorar */ }

  console.log('✅ Base de datos lista (Turso)');
}

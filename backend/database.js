import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import path from 'path';

const DB_PATH = process.env.RENDER
  ? '/data/portal.db'
  : path.join(process.cwd(), 'portal.db');

export const db = new DatabaseSync(DB_PATH);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS reportes (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker           TEXT NOT NULL,
    empresa          TEXT NOT NULL,
    contenido_md     TEXT NOT NULL,
    parrafos_gratis  INTEGER NOT NULL DEFAULT 2,
    publicado        INTEGER NOT NULL DEFAULT 0,
    slug             TEXT UNIQUE,
    meta_descripcion TEXT,
    created_at       TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S','now','localtime')),
    updated_at       TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S','now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS usuarios_portal (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre             TEXT NOT NULL,
    correo             TEXT NOT NULL UNIQUE,
    telefono           TEXT,
    ciudad             TEXT,
    tiene_inversiones  INTEGER NOT NULL DEFAULT 0,
    capital_disponible TEXT NOT NULL,
    password_hash      TEXT NOT NULL,
    created_at         TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S','now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS admins (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at    TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S','now','localtime'))
  );

  CREATE INDEX IF NOT EXISTS idx_reportes_ticker    ON reportes(ticker);
  CREATE INDEX IF NOT EXISTS idx_reportes_publicado ON reportes(publicado);
  CREATE INDEX IF NOT EXISTS idx_usuarios_correo    ON usuarios_portal(correo);
`);

// Seed admin si no existe
const adminExiste = db.prepare('SELECT id FROM admins WHERE username = ?').get('raymurra');
if (!adminExiste) {
  // password: Portal2026 — cámbiala después
  import('bcryptjs').then(({ default: bcrypt }) => {
    const hash = bcrypt.hashSync('Portal2026', 10);
    db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run('raymurra', hash);
    console.log('✅ Admin creado: raymurra / Portal2026');
  });
}

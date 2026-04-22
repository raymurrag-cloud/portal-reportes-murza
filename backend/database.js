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

  // Tabla de prospectos GBM
  await db.execute({
    sql: `CREATE TABLE IF NOT EXISTS prospectos_gbm (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre          TEXT NOT NULL,
      telefono        TEXT NOT NULL,
      correo          TEXT NOT NULL,
      valor_portafolio TEXT NOT NULL,
      created_at      TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S','now'))
    )`,
    args: [],
  });

  // Tabla de solicitudes de reportes
  await db.execute({
    sql: `CREATE TABLE IF NOT EXISTS solicitudes_reporte (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa    TEXT NOT NULL,
      ticker     TEXT,
      email      TEXT,
      created_at TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S','now'))
    )`,
    args: [],
  });

  // Tabla de visitantes (analytics de comportamiento)
  await db.execute({
    sql: `CREATE TABLE IF NOT EXISTS visitantes (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      visitor_id       TEXT NOT NULL,
      session_id       TEXT NOT NULL,
      pagina_url       TEXT NOT NULL,
      pagina_titulo    TEXT,
      tiempo_seg       INTEGER DEFAULT 0,
      scroll_max       INTEGER DEFAULT 0,
      fuente           TEXT,
      campana          TEXT,
      dispositivo      TEXT,
      sistema_os       TEXT,
      visita_recurrente INTEGER DEFAULT 0,
      ciudad           TEXT,
      estado           TEXT,
      navegador        TEXT,
      pais             TEXT,
      created_at       TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S','now'))
    )`,
    args: [],
  });

  // Tabla de búsquedas fallidas (tickers buscados que no existen)
  await db.execute({
    sql: `CREATE TABLE IF NOT EXISTS busquedas_fallidas (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      query      TEXT NOT NULL,
      visitor_id TEXT,
      session_id TEXT,
      created_at TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S','now'))
    )`,
    args: [],
  });

  // Migraciones: columnas nuevas en tablas existentes
  try { await db.execute({ sql: `ALTER TABLE visitantes ADD COLUMN navegador TEXT`, args: [] }); } catch {}
  try { await db.execute({ sql: `ALTER TABLE visitantes ADD COLUMN pais TEXT`, args: [] }); } catch {}
  try { await db.execute({ sql: `ALTER TABLE visitantes ADD COLUMN zona_horaria TEXT`, args: [] }); } catch {}
  try { await db.execute({ sql: `ALTER TABLE visitantes ADD COLUMN isp TEXT`, args: [] }); } catch {}
  try { await db.execute({ sql: `ALTER TABLE visitantes ADD COLUMN es_proxy INTEGER DEFAULT 0`, args: [] }); } catch {}
  try { await db.execute({ sql: `ALTER TABLE visitantes ADD COLUMN tiempo_primer_scroll INTEGER`, args: [] }); } catch {}
  try { await db.execute({ sql: `ALTER TABLE prospectos_gbm ADD COLUMN visitor_id TEXT`, args: [] }); } catch {}
  try { await db.execute({ sql: `ALTER TABLE prospectos_gbm ADD COLUMN primera_visita_at TEXT`, args: [] }); } catch {}

  // Índices para consultas de analytics
  try {
    await db.execute({ sql: `CREATE INDEX IF NOT EXISTS idx_visitantes_created ON visitantes(created_at)`, args: [] });
    await db.execute({ sql: `CREATE INDEX IF NOT EXISTS idx_visitantes_session ON visitantes(session_id)`, args: [] });
  } catch { /* ignorar si ya existen */ }

  // Tabla earnings (fechas dinámicas, reemplaza earningsData.js estático)
  await db.execute({
    sql: `CREATE TABLE IF NOT EXISTS earnings (
      ticker               TEXT PRIMARY KEY,
      nombre               TEXT,
      trimestre            TEXT,
      fecha                TEXT,
      cuando               TEXT,
      fecha_confirmada     INTEGER DEFAULT 0,
      fecha_siguiente      TEXT,
      trimestre_siguiente  TEXT,
      eps_estimate         REAL,
      revenue_estimate_b   REAL,
      forward_pe           REAL,
      last_surprise_pct    REAL,
      what_to_watch        TEXT,
      updated_at           TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S','now'))
    )`,
    args: [],
  });

  console.log('✅ Base de datos lista (Turso)');
}

import { Router } from 'express';
import { db }     from '../database.js';

const router = Router();

// ── GET /api/noticias — noticias recientes (publica) ──────────────────────────
// ?ticker=NVDA  → filtra por ticker
// ?dias=7       → ventana de días (default 30)
// ?limit=50     → max resultados (default 100)
router.get('/', async (req, res) => {
  try {
    const ticker = req.query.ticker?.toUpperCase() || null;
    const dias   = parseInt(req.query.dias)  || 30;
    const limit  = Math.min(parseInt(req.query.limit) || 100, 200);

    let sql, args;
    if (ticker) {
      sql  = `SELECT * FROM noticias WHERE ticker = ? AND fecha_noticia >= date('now', ?) ORDER BY fecha_noticia DESC LIMIT ?`;
      args = [ticker, `-${dias} days`, limit];
    } else {
      sql  = `SELECT * FROM noticias WHERE fecha_noticia >= date('now', ?) ORDER BY fecha_noticia DESC LIMIT ?`;
      args = [`-${dias} days`, limit];
    }

    const { rows } = await db.execute({ sql, args });
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/noticias/bulk — agente sube noticias en lote ────────────────────
// Header: Authorization: Bearer <NOTICIAS_SECRET>
// Body: [{ ticker, titulo, resumen, fuente, url, fecha_noticia, impacto }]
// Solo inserta si el ticker existe en la tabla reportes (portal conocido)
router.post('/bulk', async (req, res) => {
  const secret = process.env.NOTICIAS_SECRET;
  const auth   = (req.headers.authorization || '').replace('Bearer ', '');
  if (!secret || auth !== secret) return res.status(401).json({ error: 'No autorizado' });

  const items = req.body;
  if (!Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: 'Body debe ser array de noticias' });

  // Obtener tickers válidos del portal
  const { rows: reporteRows } = await db.execute({ sql: 'SELECT DISTINCT ticker FROM reportes', args: [] });
  const tickersValidos = new Set(reporteRows.map(r => r.ticker.toUpperCase()));

  const insertados = [];
  const omitidos   = [];

  for (const item of items) {
    const ticker = (item.ticker || '').toUpperCase();
    if (!ticker || !tickersValidos.has(ticker)) { omitidos.push(ticker || '(sin ticker)'); continue; }
    if (!item.titulo || !item.resumen || !item.fecha_noticia) { omitidos.push(`${ticker}: campos incompletos`); continue; }

    const impacto = ['positivo', 'negativo', 'neutral'].includes(item.impacto) ? item.impacto : 'neutral';

    // Evitar duplicados: mismo ticker + titulo en el mismo día
    const { rows: dup } = await db.execute({
      sql:  `SELECT id FROM noticias WHERE ticker = ? AND titulo = ? AND date(fecha_noticia) = date(?)`,
      args: [ticker, item.titulo.slice(0, 300), item.fecha_noticia],
    });
    if (dup.length > 0) { omitidos.push(`${ticker}: duplicado`); continue; }

    await db.execute({
      sql:  `INSERT INTO noticias (ticker, titulo, resumen, fuente, url, fecha_noticia, impacto)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        ticker,
        item.titulo.slice(0, 300),
        item.resumen.slice(0, 2000),
        (item.fuente || '').slice(0, 100),
        (item.url    || '').slice(0, 500),
        item.fecha_noticia,
        impacto,
      ],
    });
    insertados.push(ticker);
  }

  res.json({ insertados: insertados.length, omitidos, detalle_insertados: insertados });
});

// ── DELETE /api/noticias/limpiar — borra noticias viejas (>30 días) ─────────
router.delete('/limpiar', async (req, res) => {
  const secret = process.env.NOTICIAS_SECRET;
  const auth   = (req.headers.authorization || '').replace('Bearer ', '');
  if (!secret || auth !== secret) return res.status(401).json({ error: 'No autorizado' });

  const dias = parseInt(req.query.dias) || 30;
  const { rowsAffected } = await db.execute({
    sql:  `DELETE FROM noticias WHERE fecha_noticia < date('now', ?)`,
    args: [`-${dias} days`],
  });
  res.json({ eliminadas: rowsAffected });
});

export default router;

import { Router } from 'express';
import { db } from '../database.js';
import { authUser } from '../middleware/authUser.js';

const router = Router();

function generarSlug(empresa, ticker) {
  const base = `${empresa}-${ticker}`
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const fecha = new Date().toISOString().slice(0, 7);
  return `${base}-${fecha}`;
}

function cortarPorParrafos(md, n) {
  const parrafos = md.split(/\n\n+/).filter(p => p.trim());
  return parrafos.slice(0, n).join('\n\n');
}

// ── Buscar / listar reportes públicos ──────────────────────────────────────
router.get('/', async (req, res) => {
  const { ticker } = req.query;
  let result;
  if (ticker) {
    result = await db.execute({
      sql:  'SELECT id, ticker, empresa, slug, meta_descripcion, created_at FROM reportes WHERE publicado = 1 AND ticker LIKE ? ORDER BY created_at DESC',
      args: [`%${ticker.toUpperCase()}%`],
    });
  } else {
    result = await db.execute({
      sql:  'SELECT id, ticker, empresa, slug, meta_descripcion, created_at FROM reportes WHERE publicado = 1 ORDER BY created_at DESC LIMIT 20',
      args: [],
    });
  }
  res.json(result.rows);
});

// ── Leer reporte público (preview) ────────────────────────────────────────
router.get('/:slug', async (req, res) => {
  if (req.params.slug === 'sitemap.xml') return res.status(404).end();

  const { rows } = await db.execute({
    sql:  'SELECT id, ticker, empresa, contenido_md, parrafos_gratis, slug, meta_descripcion, created_at FROM reportes WHERE slug = ? AND publicado = 1',
    args: [req.params.slug],
  });
  const reporte = rows[0];
  if (!reporte) return res.status(404).json({ error: 'Reporte no encontrado' });

  const preview = cortarPorParrafos(reporte.contenido_md, reporte.parrafos_gratis);
  const total   = reporte.contenido_md.split(/\n\n+/).filter(p => p.trim()).length;

  res.json({
    id:               Number(reporte.id),
    ticker:           reporte.ticker,
    empresa:          reporte.empresa,
    slug:             reporte.slug,
    meta_descripcion: reporte.meta_descripcion,
    created_at:       reporte.created_at,
    contenido_preview: preview,
    parrafos_gratis:  reporte.parrafos_gratis,
    total_parrafos:   total,
    tiene_mas:        total > reporte.parrafos_gratis,
  });
});

// ── Leer reporte completo (requiere login de usuario) ─────────────────────
router.get('/:slug/completo', authUser, async (req, res) => {
  const { rows } = await db.execute({
    sql:  'SELECT id, ticker, empresa, contenido_md, slug, meta_descripcion, created_at FROM reportes WHERE slug = ? AND publicado = 1',
    args: [req.params.slug],
  });
  const reporte = rows[0];
  if (!reporte) return res.status(404).json({ error: 'Reporte no encontrado' });
  res.json({ ...reporte, id: Number(reporte.id) });
});

// ── Sitemap XML ───────────────────────────────────────────────────────────
router.get('/sitemap.xml', async (req, res) => {
  const { rows } = await db.execute({ sql: 'SELECT slug, updated_at FROM reportes WHERE publicado = 1', args: [] });

  const base = process.env.SITE_URL || 'https://reportes.murzainversiones.com';
  const urls = rows.map(r => `
  <url>
    <loc>${base}/reporte/${r.slug}</loc>
    <lastmod>${r.updated_at?.split(' ')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`).join('');

  res.header('Content-Type', 'application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${base}</loc><priority>1.0</priority></url>${urls}
</urlset>`);
});

export { generarSlug };
export default router;

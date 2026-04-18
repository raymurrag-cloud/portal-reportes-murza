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
      sql:  'SELECT id, ticker, empresa, slug, meta_descripcion, created_at, tipo FROM reportes WHERE publicado = 1 AND ticker LIKE ? ORDER BY updated_at DESC',
      args: [`%${ticker.toUpperCase()}%`],
    });
  } else {
    result = await db.execute({
      sql:  'SELECT id, ticker, empresa, slug, meta_descripcion, created_at, tipo FROM reportes WHERE publicado = 1 ORDER BY updated_at DESC',
      args: [],
    });
  }
  res.json(result.rows);
});

// ── Leer reporte público (preview) ────────────────────────────────────────
router.get('/:slug', async (req, res) => {
  if (req.params.slug === 'sitemap.xml') return res.status(404).end();

  const { rows } = await db.execute({
    sql:  'SELECT id, ticker, empresa, contenido_md, contenido_json, parrafos_gratis, slug, meta_descripcion, created_at, updated_at, fecha_reporte FROM reportes WHERE slug = ? AND publicado = 1',
    args: [req.params.slug],
  });
  const reporte = rows[0];
  if (!reporte) return res.status(404).json({ error: 'Reporte no encontrado' });

  // Reporte JSON: enviar parrafos_gratis para que el frontend controle el paywall
  if (reporte.contenido_json) {
    return res.json({
      id: Number(reporte.id), ticker: reporte.ticker, empresa: reporte.empresa,
      slug: reporte.slug, meta_descripcion: reporte.meta_descripcion, created_at: reporte.created_at,
      updated_at: reporte.updated_at, fecha_reporte: reporte.fecha_reporte,
      contenido_json: reporte.contenido_json,
      parrafos_gratis: Number(reporte.parrafos_gratis) || 2,
      es_json: true, tiene_mas: true,
    });
  }

  // Reporte markdown (legacy)
  const preview = cortarPorParrafos(reporte.contenido_md, reporte.parrafos_gratis);
  const total   = reporte.contenido_md.split(/\n\n+/).filter(p => p.trim()).length;
  res.json({
    id: Number(reporte.id), ticker: reporte.ticker, empresa: reporte.empresa,
    slug: reporte.slug, meta_descripcion: reporte.meta_descripcion, created_at: reporte.created_at,
    contenido_preview: preview, parrafos_gratis: reporte.parrafos_gratis,
    total_parrafos: total, tiene_mas: total > reporte.parrafos_gratis,
  });
});

// ── Leer reporte completo (requiere login de usuario) ─────────────────────
router.get('/:slug/completo', authUser, async (req, res) => {
  const { rows } = await db.execute({
    sql:  'SELECT id, ticker, empresa, contenido_md, contenido_json, slug, meta_descripcion, created_at, updated_at, fecha_reporte FROM reportes WHERE slug = ? AND publicado = 1',
    args: [req.params.slug],
  });
  const reporte = rows[0];
  if (!reporte) return res.status(404).json({ error: 'Reporte no encontrado' });
  res.json({ ...reporte, id: Number(reporte.id), es_json: !!reporte.contenido_json });
});

// ── Sitemap XML ───────────────────────────────────────────────────────────
router.get('/sitemap.xml', async (req, res) => {
  const { rows } = await db.execute({ sql: 'SELECT slug, ticker, empresa, updated_at, created_at FROM reportes WHERE publicado = 1 ORDER BY updated_at DESC', args: [] });

  const base = process.env.SITE_URL || 'https://reportes.murzainversiones.com';
  const today = new Date().toISOString().split('T')[0];

  const staticUrls = [
    { loc: base, priority: '1.0', changefreq: 'daily', lastmod: today },
    { loc: `${base}/earnings`, priority: '0.8', changefreq: 'weekly', lastmod: today },
    { loc: `${base}/registro`, priority: '0.5', changefreq: 'monthly', lastmod: today },
  ];

  const staticXml = staticUrls.map(u => `
  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('');

  const reportXml = rows.map(r => {
    const lastmod = (r.updated_at || r.created_at || today).split(' ')[0];
    return `
  <url>
    <loc>${base}/reporte/${r.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
  }).join('');

  res.header('Content-Type', 'application/xml');
  res.header('Cache-Control', 'public, max-age=3600');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${staticXml}${reportXml}
</urlset>`);
});

export { generarSlug };
export default router;

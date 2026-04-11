import { Router } from 'express';
import { db } from '../database.js';
import { authAdmin } from '../middleware/authAdmin.js';
import { generarSlug } from './reportes.js';

const router = Router();
router.use(authAdmin);

// ── Listar todos los reportes ─────────────────────────────────────────────
router.get('/reportes', async (req, res) => {
  const { rows } = await db.execute({
    sql:  'SELECT id, ticker, empresa, slug, publicado, parrafos_gratis, created_at, updated_at FROM reportes ORDER BY created_at DESC',
    args: [],
  });
  res.json(rows.map(r => ({ ...r, id: Number(r.id) })));
});

// ── Obtener reporte completo para edición ────────────────────────────────
router.get('/reportes/:id', async (req, res) => {
  const { rows } = await db.execute({ sql: 'SELECT * FROM reportes WHERE id = ?', args: [req.params.id] });
  const r = rows[0];
  if (!r) return res.status(404).json({ error: 'No encontrado' });
  res.json({ ...r, id: Number(r.id) });
});

// ── Crear reporte ─────────────────────────────────────────────────────────
router.post('/reportes', async (req, res) => {
  const { ticker, empresa, contenido_md, contenido_json, parrafos_gratis, publicado, slug, meta_descripcion } = req.body;

  if (!ticker || !empresa || (!contenido_md && !contenido_json))
    return res.status(400).json({ error: 'ticker, empresa y contenido son requeridos' });

  const slugFinal = slug?.trim() || generarSlug(empresa, ticker);
  const mdBase = contenido_md || '';
  const desc = meta_descripcion?.trim() ||
    mdBase.replace(/#+\s/g, '').replace(/\*\*/g, '').trim().slice(0, 160) ||
    `Análisis financiero de ${empresa} (${ticker})`;

  const result = await db.execute({
    sql:  'INSERT INTO reportes (ticker, empresa, contenido_md, contenido_json, parrafos_gratis, publicado, slug, meta_descripcion) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    args: [ticker.toUpperCase(), empresa, mdBase, contenido_json || null, parrafos_gratis || 2, publicado ? 1 : 0, slugFinal, desc],
  });

  res.status(201).json({ id: Number(result.lastInsertRowid), slug: slugFinal });
});

// ── Actualizar reporte ────────────────────────────────────────────────────
router.put('/reportes/:id', async (req, res) => {
  const { ticker, empresa, contenido_md, contenido_json, parrafos_gratis, slug, meta_descripcion } = req.body;
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  await db.execute({
    sql:  'UPDATE reportes SET ticker = ?, empresa = ?, contenido_md = ?, contenido_json = ?, parrafos_gratis = ?, slug = ?, meta_descripcion = ?, updated_at = ? WHERE id = ?',
    args: [ticker.toUpperCase(), empresa, contenido_md || '', contenido_json || null, parrafos_gratis || 2, slug, meta_descripcion, now, req.params.id],
  });

  res.json({ success: true });
});

// ── Toggle publicado ──────────────────────────────────────────────────────
router.patch('/reportes/:id/publicar', async (req, res) => {
  const { rows } = await db.execute({ sql: 'SELECT publicado FROM reportes WHERE id = ?', args: [req.params.id] });
  const r = rows[0];
  if (!r) return res.status(404).json({ error: 'No encontrado' });

  const nuevoEstado = r.publicado ? 0 : 1;
  await db.execute({
    sql:  'UPDATE reportes SET publicado = ?, updated_at = ? WHERE id = ?',
    args: [nuevoEstado, new Date().toISOString().replace('T', ' ').slice(0, 19), req.params.id],
  });

  res.json({ publicado: nuevoEstado });
});

// ── Eliminar reporte (solo borradores) ────────────────────────────────────
router.delete('/reportes/:id', async (req, res) => {
  const { rows } = await db.execute({ sql: 'SELECT publicado FROM reportes WHERE id = ?', args: [req.params.id] });
  const r = rows[0];
  if (!r) return res.status(404).json({ error: 'No encontrado' });
  if (r.publicado) return res.status(400).json({ error: 'Despublica el reporte antes de eliminarlo' });

  await db.execute({ sql: 'DELETE FROM reportes WHERE id = ?', args: [req.params.id] });
  res.json({ success: true });
});

// ── Lista de leads ────────────────────────────────────────────────────────
router.get('/leads', async (req, res) => {
  const { rows } = await db.execute({
    sql:  'SELECT id, nombre, correo, telefono, ciudad, tiene_inversiones, capital_disponible, created_at FROM usuarios_portal ORDER BY created_at DESC',
    args: [],
  });
  res.json(rows.map(r => ({ ...r, id: Number(r.id) })));
});

// ── Lista de prospectos GBM ───────────────────────────────────────────────
router.get('/prospectos', async (req, res) => {
  const { rows } = await db.execute({
    sql:  'SELECT id, nombre, telefono, correo, valor_portafolio, ciudad, estado, fuente, campana, dispositivo, sistema_os, visita_recurrente, dias_ultima_visita, tiempo_total_seg, paginas_json, created_at FROM prospectos_gbm ORDER BY created_at DESC',
    args: [],
  });
  res.json(rows.map(r => ({ ...r, id: Number(r.id) })));
});

// ── Lista de solicitudes de reportes ──────────────────────────────────────
router.get('/solicitudes', async (req, res) => {
  const { rows } = await db.execute({
    sql:  'SELECT id, empresa, ticker, email, created_at FROM solicitudes_reporte ORDER BY created_at DESC',
    args: [],
  });
  res.json(rows.map(r => ({ ...r, id: Number(r.id) })));
});

// ── Analytics ─────────────────────────────────────────────────────────────────
router.get('/analytics', async (req, res) => {
  const periodo = req.query.periodo || 'semana'; // hoy | semana | mes | total
  const diasMap = { hoy: 1, semana: 7, mes: 30, total: 3650 };
  const dias = diasMap[periodo] || 7;

  const [{ rows: visitas }, { rows: prospRows }] = await Promise.all([
    db.execute({
      sql: `SELECT visitor_id, session_id, pagina_url, pagina_titulo,
                   tiempo_seg, scroll_max, fuente, campana,
                   dispositivo, sistema_os, visita_recurrente, ciudad, estado, created_at
            FROM visitantes
            WHERE created_at >= datetime('now', ?)
            ORDER BY created_at DESC LIMIT 20000`,
      args: [`-${dias} days`],
    }),
    db.execute({ sql: 'SELECT COUNT(*) as total FROM prospectos_gbm', args: [] }),
  ]);

  const totalProspectos = Number(prospRows[0]?.total || 0);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const countBy = (arr, key) => {
    const m = {};
    arr.forEach(r => { const v = r[key] || 'Desconocido'; m[v] = (m[v] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ label: k, count: v }));
  };

  // ── Visitantes únicos y sesiones ──────────────────────────────────────────
  const visitantesUnicos = new Set(visitas.map(r => r.visitor_id)).size;
  const sesionesUnicas   = new Set(visitas.map(r => r.session_id)).size;
  const pageviews        = visitas.length;

  // ── Resumen por sub-periodos (siempre desde 0, independiente del periodo) ─
  const ahora = Date.now();
  const hace  = (d) => new Date(ahora - d * 86400000).toISOString();
  const { rows: all } = await db.execute({
    sql: `SELECT visitor_id, session_id, created_at FROM visitantes ORDER BY created_at DESC LIMIT 50000`,
    args: [],
  });
  const resumen = ['hoy', 'semana', 'mes', 'total'].reduce((acc, p) => {
    const d = { hoy: 1, semana: 7, mes: 30, total: 3650 }[p];
    const filtro = all.filter(r => new Date(r.created_at) >= new Date(ahora - d * 86400000));
    acc[p] = {
      visitantes: new Set(filtro.map(r => r.visitor_id)).size,
      sesiones:   new Set(filtro.map(r => r.session_id)).size,
      pageviews:  filtro.length,
    };
    return acc;
  }, {});

  // ── Fuentes ────────────────────────────────────────────────────────────────
  const fuentes = countBy(visitas, 'fuente');

  // ── Dispositivos ───────────────────────────────────────────────────────────
  const dispositivos = countBy(visitas, 'dispositivo');

  // ── Ciudades (ciudad + estado) ─────────────────────────────────────────────
  const ciudadesMap = {};
  visitas.forEach(r => {
    if (!r.ciudad) return;
    const key = r.estado ? `${r.ciudad}, ${r.estado}` : r.ciudad;
    ciudadesMap[key] = (ciudadesMap[key] || 0) + 1;
  });
  const ciudades = Object.entries(ciudadesMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([label, count]) => ({ label, count }));

  // ── Top páginas ────────────────────────────────────────────────────────────
  const paginasMap = {};
  visitas.forEach(r => {
    const key = r.pagina_url;
    if (!paginasMap[key]) paginasMap[key] = { url: key, titulo: r.pagina_titulo || key, vistas: 0, tiempo_total: 0, scroll_total: 0, con_scroll: 0, completos: 0 };
    const p = paginasMap[key];
    p.vistas++;
    p.tiempo_total += Number(r.tiempo_seg) || 0;
    if (r.scroll_max > 0) { p.scroll_total += Number(r.scroll_max); p.con_scroll++; }
    if (Number(r.scroll_max) >= 80) p.completos++;
  });
  const paginas = Object.values(paginasMap)
    .sort((a, b) => b.vistas - a.vistas)
    .slice(0, 15)
    .map(p => ({
      url:             p.url,
      titulo:          p.titulo,
      vistas:          p.vistas,
      tiempo_promedio: p.vistas > 0 ? Math.round(p.tiempo_total / p.vistas) : 0,
      scroll_promedio: p.con_scroll > 0 ? Math.round(p.scroll_total / p.con_scroll) : 0,
      completos:       p.completos,
    }));

  // ── Embudo ────────────────────────────────────────────────────────────────
  const sessionesSet = new Set(visitas.map(r => r.session_id));
  const leyeronReporte = new Set(visitas.filter(r => r.pagina_url?.startsWith('/reporte/')).map(r => r.session_id)).size;
  const leyeronCompleto = new Set(visitas.filter(r => r.pagina_url?.startsWith('/reporte/') && Number(r.scroll_max) >= 80).map(r => r.session_id)).size;
  const vieronEarnings  = new Set(visitas.filter(r => r.pagina_url === '/earnings').map(r => r.session_id)).size;

  // Nuevos vs recurrentes (por sesion unica)
  const sessionesArr = [...new Map(visitas.map(r => [r.session_id, r])).values()];
  const recurrentes = sessionesArr.filter(r => r.visita_recurrente).length;

  res.json({
    resumen,
    fuentes,
    dispositivos,
    ciudades,
    paginas,
    embudo: {
      total_sesiones:    sesionesUnicas,
      leyeron_reporte:   leyeronReporte,
      leyeron_completo:  leyeronCompleto,
      vieron_earnings:   vieronEarnings,
      llenaron_form:     totalProspectos,
    },
    nuevos_vs_recurrentes: {
      nuevos:      sesionesUnicas - recurrentes,
      recurrentes: recurrentes,
    },
    periodo,
  });
});

export default router;

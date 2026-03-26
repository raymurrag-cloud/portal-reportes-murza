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
  const { ticker, empresa, contenido_md, parrafos_gratis, publicado, slug, meta_descripcion } = req.body;

  if (!ticker || !empresa || !contenido_md)
    return res.status(400).json({ error: 'ticker, empresa y contenido_md son requeridos' });

  const slugFinal = slug?.trim() || generarSlug(empresa, ticker);
  const desc = meta_descripcion?.trim() ||
    contenido_md.replace(/#+\s/g, '').replace(/\*\*/g, '').trim().slice(0, 160);

  const result = await db.execute({
    sql:  'INSERT INTO reportes (ticker, empresa, contenido_md, parrafos_gratis, publicado, slug, meta_descripcion) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [ticker.toUpperCase(), empresa, contenido_md, parrafos_gratis || 2, publicado ? 1 : 0, slugFinal, desc],
  });

  res.status(201).json({ id: Number(result.lastInsertRowid), slug: slugFinal });
});

// ── Actualizar reporte ────────────────────────────────────────────────────
router.put('/reportes/:id', async (req, res) => {
  const { ticker, empresa, contenido_md, parrafos_gratis, slug, meta_descripcion } = req.body;
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  await db.execute({
    sql:  'UPDATE reportes SET ticker = ?, empresa = ?, contenido_md = ?, parrafos_gratis = ?, slug = ?, meta_descripcion = ?, updated_at = ? WHERE id = ?',
    args: [ticker.toUpperCase(), empresa, contenido_md, parrafos_gratis || 2, slug, meta_descripcion, now, req.params.id],
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

export default router;

import { Router } from 'express';
import { db } from '../database.js';
import { authAdmin } from '../middleware/authAdmin.js';
import { generarSlug } from './reportes.js';

const router = Router();

// Todos los endpoints requieren ser admin
router.use(authAdmin);

// ── Listar todos los reportes (incluye borradores) ────────────────────────
router.get('/reportes', (req, res) => {
  const rows = db.prepare(`
    SELECT id, ticker, empresa, slug, publicado, parrafos_gratis, created_at, updated_at
    FROM reportes ORDER BY created_at DESC
  `).all();
  res.json(rows);
});

// ── Obtener reporte completo para edición ─────────────────────────────────
router.get('/reportes/:id', (req, res) => {
  const r = db.prepare('SELECT * FROM reportes WHERE id = ?').get(req.params.id);
  if (!r) return res.status(404).json({ error: 'No encontrado' });
  res.json(r);
});

// ── Crear reporte ─────────────────────────────────────────────────────────
router.post('/reportes', (req, res) => {
  const { ticker, empresa, contenido_md, parrafos_gratis, publicado, slug, meta_descripcion } = req.body;

  if (!ticker || !empresa || !contenido_md)
    return res.status(400).json({ error: 'ticker, empresa y contenido_md son requeridos' });

  const slugFinal = slug?.trim() || generarSlug(empresa, ticker);
  const desc = meta_descripcion?.trim() ||
    contenido_md.replace(/#+\s/g, '').replace(/\*\*/g, '').trim().slice(0, 160);

  const result = db.prepare(`
    INSERT INTO reportes (ticker, empresa, contenido_md, parrafos_gratis, publicado, slug, meta_descripcion)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    ticker.toUpperCase(), empresa, contenido_md,
    parrafos_gratis || 2, publicado ? 1 : 0,
    slugFinal, desc
  );

  res.status(201).json({ id: result.lastInsertRowid, slug: slugFinal });
});

// ── Actualizar reporte ────────────────────────────────────────────────────
router.put('/reportes/:id', (req, res) => {
  const { ticker, empresa, contenido_md, parrafos_gratis, slug, meta_descripcion } = req.body;
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  db.prepare(`
    UPDATE reportes SET
      ticker = ?, empresa = ?, contenido_md = ?,
      parrafos_gratis = ?, slug = ?, meta_descripcion = ?, updated_at = ?
    WHERE id = ?
  `).run(
    ticker.toUpperCase(), empresa, contenido_md,
    parrafos_gratis || 2, slug, meta_descripcion, now,
    req.params.id
  );

  res.json({ success: true });
});

// ── Toggle publicado ──────────────────────────────────────────────────────
router.patch('/reportes/:id/publicar', (req, res) => {
  const r = db.prepare('SELECT publicado FROM reportes WHERE id = ?').get(req.params.id);
  if (!r) return res.status(404).json({ error: 'No encontrado' });

  const nuevoEstado = r.publicado ? 0 : 1;
  db.prepare('UPDATE reportes SET publicado = ?, updated_at = ? WHERE id = ?')
    .run(nuevoEstado, new Date().toISOString().replace('T', ' ').slice(0, 19), req.params.id);

  res.json({ publicado: nuevoEstado });
});

// ── Eliminar reporte (solo borradores) ────────────────────────────────────
router.delete('/reportes/:id', (req, res) => {
  const r = db.prepare('SELECT publicado FROM reportes WHERE id = ?').get(req.params.id);
  if (!r) return res.status(404).json({ error: 'No encontrado' });
  if (r.publicado) return res.status(400).json({ error: 'Despublica el reporte antes de eliminarlo' });

  db.prepare('DELETE FROM reportes WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ── Lista de leads ─────────────────────────────────────────────────────────
router.get('/leads', (req, res) => {
  const leads = db.prepare(`
    SELECT id, nombre, correo, telefono, ciudad,
           tiene_inversiones, capital_disponible, created_at
    FROM usuarios_portal ORDER BY created_at DESC
  `).all();
  res.json(leads);
});

export default router;

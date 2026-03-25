import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../database.js';
import { signAdmin } from '../middleware/authAdmin.js';
import { signUser } from '../middleware/authUser.js';

const router = Router();

// ── Login admin ────────────────────────────────────────────────────────────
router.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Faltan datos' });

  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
  if (!admin || !bcrypt.compareSync(password, admin.password_hash))
    return res.status(401).json({ error: 'Credenciales incorrectas' });

  res.json({ token: signAdmin(admin.id, admin.username), username: admin.username });
});

// ── Registro usuario público ───────────────────────────────────────────────
router.post('/registro', (req, res) => {
  const { nombre, correo, telefono, ciudad, tiene_inversiones, capital_disponible, password } = req.body;

  if (!nombre || !correo || !capital_disponible || !password)
    return res.status(400).json({ error: 'Faltan campos requeridos' });

  const existe = db.prepare('SELECT id FROM usuarios_portal WHERE correo = ?').get(correo);
  if (existe) return res.status(409).json({ error: 'Este correo ya está registrado' });

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(`
    INSERT INTO usuarios_portal (nombre, correo, telefono, ciudad, tiene_inversiones, capital_disponible, password_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(nombre, correo, telefono || null, ciudad || null, tiene_inversiones ? 1 : 0, capital_disponible, hash);

  res.status(201).json({
    token: signUser(result.lastInsertRowid, nombre, correo),
    nombre,
  });
});

// ── Login usuario público ──────────────────────────────────────────────────
router.post('/login', (req, res) => {
  const { correo, password } = req.body;
  if (!correo || !password) return res.status(400).json({ error: 'Faltan datos' });

  const user = db.prepare('SELECT * FROM usuarios_portal WHERE correo = ?').get(correo);
  if (!user || !bcrypt.compareSync(password, user.password_hash))
    return res.status(401).json({ error: 'Correo o contraseña incorrectos' });

  res.json({
    token: signUser(user.id, user.nombre, user.correo),
    nombre: user.nombre,
  });
});

export default router;

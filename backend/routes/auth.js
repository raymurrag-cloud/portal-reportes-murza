import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../database.js';
import { signAdmin } from '../middleware/authAdmin.js';
import { signUser } from '../middleware/authUser.js';

const router = Router();

// ── Login admin ─────────────────────────────────────────────────────────────
router.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Faltan datos' });

  const { rows } = await db.execute({ sql: 'SELECT * FROM admins WHERE username = ?', args: [username] });
  const admin = rows[0];
  if (!admin || !bcrypt.compareSync(password, admin.password_hash))
    return res.status(401).json({ error: 'Credenciales incorrectas' });

  res.json({ token: signAdmin(Number(admin.id), admin.username), username: admin.username });
});

// ── Registro usuario público ─────────────────────────────────────────────────
router.post('/registro', async (req, res) => {
  const { nombre, correo, telefono, ciudad, tiene_inversiones, capital_disponible, password } = req.body;

  if (!nombre || !correo || !capital_disponible || !password)
    return res.status(400).json({ error: 'Faltan campos requeridos' });

  const { rows: existe } = await db.execute({ sql: 'SELECT id FROM usuarios_portal WHERE correo = ?', args: [correo] });
  if (existe.length > 0) return res.status(409).json({ error: 'Este correo ya está registrado' });

  const hash = bcrypt.hashSync(password, 10);
  const result = await db.execute({
    sql:  'INSERT INTO usuarios_portal (nombre, correo, telefono, ciudad, tiene_inversiones, capital_disponible, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [nombre, correo, telefono || null, ciudad || null, tiene_inversiones ? 1 : 0, capital_disponible, hash],
  });

  res.status(201).json({
    token: signUser(Number(result.lastInsertRowid), nombre, correo),
    nombre,
  });
});

// ── Login usuario público ────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { correo, password } = req.body;
  if (!correo || !password) return res.status(400).json({ error: 'Faltan datos' });

  const { rows } = await db.execute({ sql: 'SELECT * FROM usuarios_portal WHERE correo = ?', args: [correo] });
  const user = rows[0];
  if (!user || !bcrypt.compareSync(password, user.password_hash))
    return res.status(401).json({ error: 'Correo o contraseña incorrectos' });

  res.json({
    token: signUser(Number(user.id), user.nombre, user.correo),
    nombre: user.nombre,
  });
});

export default router;

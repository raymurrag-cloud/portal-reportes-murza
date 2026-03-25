import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_USER_SECRET || 'portal_user_secret_2026';

export function authUser(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Sin token' });
  try {
    const payload = jwt.verify(header.slice(7), SECRET);
    if (payload.role !== 'user') return res.status(403).json({ error: 'Sin permiso' });
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}

export function signUser(id, nombre, correo) {
  return jwt.sign({ id, nombre, correo, role: 'user' }, SECRET, { expiresIn: '90d' });
}

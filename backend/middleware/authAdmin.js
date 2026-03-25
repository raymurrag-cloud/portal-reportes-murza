import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'portal_admin_secret_2026';

export function authAdmin(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Sin token' });
  try {
    const payload = jwt.verify(header.slice(7), SECRET);
    if (payload.role !== 'admin') return res.status(403).json({ error: 'Sin permiso' });
    req.admin = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}

export function signAdmin(id, username) {
  return jwt.sign({ id, username, role: 'admin' }, SECRET, { expiresIn: '30d' });
}

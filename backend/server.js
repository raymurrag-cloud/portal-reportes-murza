import express from 'express';
import cors from 'cors';
import { initDb } from './database.js';
import authRoutes from './routes/auth.js';
import reportesRoutes from './routes/reportes.js';
import adminRoutes from './routes/admin.js';

const app  = express();
const PORT = process.env.PORT || 3002;

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5174' }));
app.use(express.json({ limit: '5mb' }));

app.use('/api/auth',     authRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/admin',    adminRoutes);

app.get('/api/health', (_, res) => res.json({ ok: true }));

initDb().then(() => {
  app.listen(PORT, () => console.log(`Portal backend corriendo en puerto ${PORT}`));
}).catch(err => {
  console.error('Error iniciando DB:', err);
  process.exit(1);
});

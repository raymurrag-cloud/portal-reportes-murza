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

// ── Precio en vivo (Yahoo Finance, server-side para evitar CORS) ───────────
const precioCache = new Map(); // ticker → { precio, timestamp }
const CACHE_TTL = 15 * 60 * 1000; // 15 minutos

app.get('/api/precio/:ticker', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase().replace(/[^A-Z0-9.\-^]/g, '');
  if (!ticker || ticker.length > 12) return res.status(400).json({ error: 'Ticker invalido' });

  const cached = precioCache.get(ticker);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.json({ ...cached, cached: true });
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const data = await r.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta?.regularMarketPrice) throw new Error('Sin precio');
    const entry = { ticker, precio: meta.regularMarketPrice, moneda: meta.currency || 'USD', timestamp: Date.now() };
    precioCache.set(ticker, entry);
    res.json(entry);
  } catch {
    res.status(503).json({ error: 'No se pudo obtener el precio en este momento' });
  }
});

initDb().then(() => {
  app.listen(PORT, () => console.log(`Portal backend corriendo en puerto ${PORT}`));
}).catch(err => {
  console.error('Error iniciando DB:', err);
  process.exit(1);
});

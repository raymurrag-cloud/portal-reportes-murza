import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
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

// ── Mailer Gmail ───────────────────────────────────────────────────────────
const mailer = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  family: 4, // forzar IPv4
  auth: {
    user: process.env.GMAIL_USER,
    pass: (process.env.GMAIL_PASS || '').replace(/\s/g, ''),
  },
});

// ── Solicitudes de reportes (público) ─────────────────────────────────────
app.post('/api/solicitudes', async (req, res) => {
  const { empresa, ticker, email } = req.body || {};
  if (!empresa || typeof empresa !== 'string' || empresa.trim().length < 2)
    return res.status(400).json({ error: 'Nombre de empresa requerido' });
  const { db } = await import('./database.js');
  const empresaClean = empresa.trim().slice(0, 100);
  const tickerClean  = (ticker || '').trim().toUpperCase().slice(0, 10) || null;
  const emailClean   = (email || '').trim().slice(0, 100) || null;

  await db.execute({
    sql:  'INSERT INTO solicitudes_reporte (empresa, ticker, email) VALUES (?, ?, ?)',
    args: [empresaClean, tickerClean, emailClean],
  });

  // Notificacion por email (fire-and-forget)
  mailer.sendMail({
    from:    `"Portal Murza" <${process.env.GMAIL_USER}>`,
    to:      process.env.GMAIL_USER,
    subject: `Nueva solicitud de reporte: ${empresaClean}${tickerClean ? ` (${tickerClean})` : ''}`,
    text: [
      'Nueva solicitud de reporte en el portal:',
      '',
      `Empresa: ${empresaClean}`,
      tickerClean ? `Ticker:  ${tickerClean}` : '',
      emailClean  ? `Email:   ${emailClean}`  : '',
      '',
      'Ver todas las solicitudes: https://reportes.murzainversiones.com/admin/solicitudes',
    ].filter(l => l !== null).join('\n'),
  }).then(() => console.log('Email solicitud enviado OK'))
    .catch(err => console.error('Email solicitud error:', err.message, err.code));

  res.status(201).json({ ok: true });
});

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

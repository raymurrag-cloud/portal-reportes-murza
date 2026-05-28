import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '../database.js';
import { authAdmin } from '../middleware/authAdmin.js';

const router = express.Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// GET /api/portafolio/positions
router.get('/positions', async (req, res) => {
  try {
    const [posRows, navRows] = await Promise.all([
      db.execute({ sql: `SELECT * FROM ib_positions ORDER BY position_value DESC`, args: [] }),
      db.execute({ sql: `SELECT * FROM ib_nav ORDER BY report_date DESC LIMIT 1`, args: [] }),
    ]);
    const positions = posRows.rows;
    const latestNav = navRows.rows[0] || null;
    const totalUnrealized = positions.reduce((s, p) => s + (p.unrealized_pl || 0), 0);
    const totalValue     = positions.reduce((s, p) => s + (p.position_value || 0), 0);
    res.json({
      positions,
      summary: {
        total_nav:      latestNav?.total_nav || null,
        cash:           latestNav?.cash      || null,
        stocks_value:   totalValue,
        unrealized_pl:  totalUnrealized,
        updated_at:     positions[0]?.updated_at || null,
        report_date:    latestNav?.report_date || null,
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/portafolio/trades?limit=50&offset=0&symbol=NVDA
router.get('/trades', async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit  || '100'), 500);
    const offset = parseInt(req.query.offset || '0');
    const symbol = req.query.symbol?.toUpperCase() || null;

    let sql  = `SELECT * FROM ib_trades`;
    const args = [];
    if (symbol) { sql += ` WHERE symbol = ?`; args.push(symbol); }
    sql += ` ORDER BY trade_date DESC, datetime DESC LIMIT ? OFFSET ?`;
    args.push(limit, offset);

    const { rows } = await db.execute({ sql, args });
    const total = await db.execute({
      sql: symbol
        ? `SELECT COUNT(*) as n FROM ib_trades WHERE symbol = ?`
        : `SELECT COUNT(*) as n FROM ib_trades`,
      args: symbol ? [symbol] : [],
    });
    res.json({ trades: rows, total: total.rows[0].n, limit, offset });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/portafolio/nav
router.get('/nav', async (req, res) => {
  try {
    const { rows } = await db.execute({
      sql: `SELECT * FROM ib_nav ORDER BY report_date ASC`,
      args: [],
    });
    res.json({ nav: rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/portafolio/chat
router.post('/chat', async (req, res) => {
  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0)
    return res.status(400).json({ error: 'messages requerido' });

  try {
    const [posRows, tradeRows] = await Promise.all([
      db.execute({ sql: `SELECT * FROM ib_positions ORDER BY position_value DESC`, args: [] }),
      db.execute({ sql: `SELECT * FROM ib_trades ORDER BY trade_date DESC, datetime DESC LIMIT 200`, args: [] }),
    ]);

    const positions = posRows.rows;
    const trades    = tradeRows.rows;

    const fmtPos = positions.map(p =>
      `${p.symbol} (${p.description || ''}): ${p.quantity} acciones @ $${p.mark_price} | Entrada: $${p.open_price} | P&L: $${p.unrealized_pl?.toFixed(2)} | ${p.pct_nav?.toFixed(1)}% del portafolio`
    ).join('\n');

    const fmtTrades = trades.slice(0, 100).map(t =>
      `${t.trade_date} | ${t.buy_sell} ${Math.abs(t.quantity)} ${t.symbol} @ $${t.price} | P&L realizado: $${t.realized_pl?.toFixed(2) || '0'}${t.note ? ` | Tesis: ${t.note}` : ''}`
    ).join('\n');

    const systemPrompt = `Eres el asistente del portafolio de paper trading de Murza Inversiones (cuenta simulada en Interactive Brokers).

Este portafolio refleja las recomendaciones de inversion reales del equipo de Murza Inversiones — las mismas tesis que aplicariamos con dinero real, ejecutadas en cuenta paper trading para total transparencia.

POSICIONES ACTUALES:
${fmtPos || '(sin posiciones abiertas)'}

HISTORIAL DE OPERACIONES (mas recientes primero):
${fmtTrades || '(sin historial disponible)'}

Responde en espanol. Usa los datos reales del portafolio para responder preguntas. Si te preguntan por una operacion especifica, cita la fecha exacta y el precio. Si no tienes el dato, dilo claramente. No inventes informacion.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    });

    res.json({ reply: response.content[0].text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/portafolio/sync  (admin)
router.post('/sync', authAdmin, async (req, res) => {
  try {
    const { spawn } = await import('child_process');
    const backendDir = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
    const proc = spawn('node', ['sync_ib.mjs'], {
      cwd: backendDir,
      env: { ...process.env },
      detached: true, stdio: 'ignore',
    });
    proc.unref();
    res.json({ ok: true, message: 'Sync iniciado en background' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/portafolio/trades/:id/note  (admin)
router.patch('/trades/:id/note', authAdmin, async (req, res) => {
  const { note } = req.body || {};
  const { id }   = req.params;
  if (typeof note !== 'string') return res.status(400).json({ error: 'note requerido' });
  try {
    await db.execute({
      sql: `UPDATE ib_trades SET note = ? WHERE id = ?`,
      args: [note.slice(0, 500), parseInt(id)],
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;

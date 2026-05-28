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

// ── Helpers de sync IB ───────────────────────────────────────────────────────
function parseElements(xml, tagName) {
  const results = [];
  const re = new RegExp(`<${tagName}\\b([^>]*)(?:\\s*/?>|>)`, 'g');
  let m;
  while ((m = re.exec(xml)) !== null) {
    const attrs = {};
    const attrRe = /(\w+)="([^"]*)"/g;
    let a;
    while ((a = attrRe.exec(m[1])) !== null) attrs[a[1]] = a[2];
    results.push(attrs);
  }
  return results;
}
function parseDate(s) {
  if (!s || s.length < 8) return null;
  return `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`;
}
function parseDateTime(s) {
  if (!s) return null;
  const [d, t] = s.split(';');
  const date = parseDate(d);
  if (!date) return null;
  return t?.length >= 6 ? `${date} ${t.slice(0,2)}:${t.slice(2,4)}:${t.slice(4,6)}` : date;
}
function num(v) { const n = parseFloat(v); return isNaN(n) ? null : n; }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchFlexXML() {
  const token   = process.env.IB_FLEX_TOKEN;
  const queryId = process.env.IB_FLEX_QUERY_ID;
  if (!token || !queryId) throw new Error('IB_FLEX_TOKEN o IB_FLEX_QUERY_ID no configurados en Render');

  const r1  = await fetch(`https://gdcdyn.interactivebrokers.com/Universal/servlet/FlexStatementService.SendRequest?t=${token}&q=${queryId}&v=3`);
  const xml1 = await r1.text();
  const refCode = xml1.match(/<ReferenceCode>(\d+)<\/ReferenceCode>/)?.[1];
  const baseUrl = xml1.match(/<Url>([^<]+)<\/Url>/)?.[1] || 'https://gdcdyn.interactivebrokers.com/Universal/servlet/FlexStatementService.GetStatement';
  const status  = xml1.match(/<Status>(\w+)<\/Status>/)?.[1];
  if (!refCode || status !== 'Success') {
    const msg = xml1.match(/<ErrorMessage>([^<]+)<\/ErrorMessage>/)?.[1] || xml1.slice(0, 300);
    throw new Error(`IB error: ${msg}`);
  }

  for (let i = 0; i < 10; i++) {
    await sleep(i === 0 ? 6000 : 3000);
    const r2  = await fetch(`${baseUrl}?q=${queryId}&t=${token}&v=3&ReferenceCode=${refCode}`);
    const xml2 = await r2.text();
    if (xml2.includes('<FlexQueryResponse')) return xml2;
    const err = xml2.match(/<ErrorMessage>([^<]+)<\/ErrorMessage>/)?.[1] || '';
    if (!err.includes('generation in progress')) throw new Error(`IB error: ${err}`);
  }
  throw new Error('Timeout: IB no entregó el statement');
}

// POST /api/portafolio/sync  (admin)
router.post('/sync', authAdmin, async (req, res) => {
  try {
    const xml = await fetchFlexXML();

    // Trades
    const trades = parseElements(xml, 'Trade');
    let tradesIn = 0;
    for (const t of trades) {
      if (t.levelOfDetail && t.levelOfDetail !== 'EXECUTION') continue;
      try {
        const r = await db.execute({
          sql: `INSERT OR IGNORE INTO ib_trades
            (trade_id,symbol,description,asset_cat,trade_date,datetime,buy_sell,
             quantity,price,proceeds,commission,net_cash,cost_basis,realized_pl,
             open_close,currency,exchange)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          args: [
            t.tradeID||null, t.symbol, t.description||null, t.assetCategory||null,
            parseDate(t.tradeDate), parseDateTime(t.dateTime),
            t.buySell, num(t.quantity), num(t.tradePrice),
            num(t.proceeds), num(t.ibCommission), num(t.netCash),
            num(t.costBasis), num(t.realizedPL), t.openCloseIndicator||null,
            t.currency||'USD', t.exchange||null,
          ],
        });
        if (r.rowsAffected > 0) tradesIn++;
      } catch {}
    }

    // Posiciones
    const positions = parseElements(xml, 'OpenPosition');
    let posUp = 0;
    for (const p of positions) {
      await db.execute({
        sql: `INSERT INTO ib_positions
          (symbol,description,asset_cat,quantity,mark_price,position_value,
           open_price,cost_basis,unrealized_pl,pct_nav,side,open_datetime,
           currency,report_date,updated_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,strftime('%Y-%m-%d %H:%M:%S','now'))
          ON CONFLICT(symbol) DO UPDATE SET
            quantity=excluded.quantity, mark_price=excluded.mark_price,
            position_value=excluded.position_value, open_price=excluded.open_price,
            cost_basis=excluded.cost_basis, unrealized_pl=excluded.unrealized_pl,
            pct_nav=excluded.pct_nav, side=excluded.side,
            open_datetime=excluded.open_datetime, report_date=excluded.report_date,
            updated_at=strftime('%Y-%m-%d %H:%M:%S','now')`,
        args: [
          p.symbol, p.description||null, p.assetCategory||null,
          num(p.quantity), num(p.markPrice), num(p.positionValue),
          num(p.openPrice), num(p.costBasisPrice), num(p.unrealizedPnL),
          num(p.percentOfNAV), p.side||null, parseDateTime(p.openDateTime),
          p.currency||'USD', parseDate(p.reportDate),
        ],
      });
      posUp++;
    }

    // NAV
    const navItems = parseElements(xml, 'NetAssetValue');
    const total = navItems.find(n => n.assetCategory === 'Total');
    if (total) {
      const date = parseDate(total.reportDate) || new Date().toISOString().slice(0,10);
      await db.execute({
        sql: `INSERT OR IGNORE INTO ib_nav (report_date,total_nav,cash,stock) VALUES (?,?,?,?)`,
        args: [date, num(total.total), num(total.cash), num(total.stock)],
      });
    } else {
      const cashItems = parseElements(xml, 'CashReportCurrency');
      const base = cashItems.find(c => c.currency === 'BASE_SUMMARY') || cashItems[0];
      if (base) {
        const date = new Date().toISOString().slice(0,10);
        await db.execute({
          sql: `INSERT OR IGNORE INTO ib_nav (report_date,total_nav,cash,stock) VALUES (?,?,?,?)`,
          args: [date, num(base.endingCash), num(base.endingCash), null],
        });
      }
    }

    res.json({ ok: true, trades: tradesIn, positions: posUp, message: `${tradesIn} trades nuevos, ${posUp} posiciones actualizadas` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/portafolio/upload-xml  (admin) — procesa XML descargado manualmente de IB
router.post('/upload-xml', authAdmin, express.text({ limit: '30mb', type: '*/*' }), async (req, res) => {
  const xml = typeof req.body === 'string' ? req.body : (req.body?.xml || '');
  if (!xml || xml.length < 100)
    return res.status(400).json({ error: 'XML inválido o vacío' });
  if (!xml.includes('Flex') && !xml.includes('Trade') && !xml.includes('Position'))
    return res.status(400).json({ error: 'El archivo no parece ser un XML de IB Flex' });

  try {
    // Trades
    const trades = parseElements(xml, 'Trade');
    let tradesIn = 0;
    for (const t of trades) {
      if (t.levelOfDetail && t.levelOfDetail !== 'EXECUTION') continue;
      try {
        const r = await db.execute({
          sql: `INSERT OR IGNORE INTO ib_trades
            (trade_id,symbol,description,asset_cat,trade_date,datetime,buy_sell,
             quantity,price,proceeds,commission,net_cash,cost_basis,realized_pl,
             open_close,currency,exchange)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          args: [
            t.tradeID||null, t.symbol, t.description||null, t.assetCategory||null,
            parseDate(t.tradeDate), parseDateTime(t.dateTime),
            t.buySell, num(t.quantity), num(t.tradePrice),
            num(t.proceeds), num(t.ibCommission), num(t.netCash),
            num(t.costBasis), num(t.realizedPL), t.openCloseIndicator||null,
            t.currency||'USD', t.exchange||null,
          ],
        });
        if (r.rowsAffected > 0) tradesIn++;
      } catch {}
    }

    // Posiciones
    const positions = parseElements(xml, 'OpenPosition');
    let posUp = 0;
    for (const p of positions) {
      await db.execute({
        sql: `INSERT INTO ib_positions
          (symbol,description,asset_cat,quantity,mark_price,position_value,
           open_price,cost_basis,unrealized_pl,pct_nav,side,open_datetime,
           currency,report_date,updated_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,strftime('%Y-%m-%d %H:%M:%S','now'))
          ON CONFLICT(symbol) DO UPDATE SET
            quantity=excluded.quantity, mark_price=excluded.mark_price,
            position_value=excluded.position_value, open_price=excluded.open_price,
            cost_basis=excluded.cost_basis, unrealized_pl=excluded.unrealized_pl,
            pct_nav=excluded.pct_nav, side=excluded.side,
            open_datetime=excluded.open_datetime, report_date=excluded.report_date,
            updated_at=strftime('%Y-%m-%d %H:%M:%S','now')`,
        args: [
          p.symbol, p.description||null, p.assetCategory||null,
          num(p.quantity), num(p.markPrice), num(p.positionValue),
          num(p.openPrice), num(p.costBasisPrice), num(p.unrealizedPnL),
          num(p.percentOfNAV), p.side||null, parseDateTime(p.openDateTime),
          p.currency||'USD', parseDate(p.reportDate),
        ],
      });
      posUp++;
    }

    // NAV
    const navItems = parseElements(xml, 'NetAssetValue');
    const total = navItems.find(n => n.assetCategory === 'Total');
    if (total) {
      const date = parseDate(total.reportDate) || new Date().toISOString().slice(0,10);
      await db.execute({
        sql: `INSERT OR IGNORE INTO ib_nav (report_date,total_nav,cash,stock) VALUES (?,?,?,?)`,
        args: [date, num(total.total), num(total.cash), num(total.stock)],
      });
    }

    res.json({ ok: true, trades: tradesIn, positions: posUp,
      message: `${tradesIn} trades nuevos, ${posUp} posiciones actualizadas` });
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

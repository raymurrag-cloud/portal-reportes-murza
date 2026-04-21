import { Router } from 'express';
import { db }     from '../database.js';

const router = Router();
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

// ── GET /api/earnings — devuelve todos los registros de la tabla earnings ──
router.get('/', async (_req, res) => {
  try {
    const { rows } = await db.execute({
      sql:  'SELECT * FROM earnings ORDER BY fecha ASC',
      args: [],
    });
    const data = rows.map(r => ({
      ...r,
      fecha_confirmada: r.fecha_confirmada === 1,
      what_to_watch:    r.what_to_watch ? JSON.parse(r.what_to_watch) : [],
    }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/earnings/refresh — refresca fechas desde Yahoo Finance ───────
// Protegido con EARNINGS_REFRESH_SECRET en header Authorization: Bearer <secret>
router.post('/refresh', async (req, res) => {
  const secret = process.env.EARNINGS_REFRESH_SECRET;
  const auth   = (req.headers.authorization || '').replace('Bearer ', '');
  if (!secret || auth !== secret) return res.status(401).json({ error: 'No autorizado' });

  try {
    const { rows: tickers } = await db.execute({
      sql:  'SELECT DISTINCT ticker FROM earnings',
      args: [],
    });

    if (tickers.length === 0) return res.json({ updated: 0, tickers: [] });

    // ── Obtener cookie + crumb de Yahoo Finance (una sola vez) ──────────────
    const cookieJar = {};
    const mergeCookies = arr => {
      for (const c of (arr || [])) {
        const [kv] = c.split(';');
        const eq = kv.indexOf('=');
        if (eq > 0) cookieJar[kv.slice(0, eq).trim()] = kv.slice(eq + 1).trim();
      }
    };
    const cookieStr = () => Object.entries(cookieJar).map(([k, v]) => `${k}=${v}`).join('; ');

    let url = 'https://finance.yahoo.com/quote/AAPL';
    for (let i = 0; i < 6; i++) {
      const r = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'text/html', Cookie: cookieStr() },
        redirect: 'manual',
      });
      mergeCookies(r.headers.getSetCookie?.() ?? []);
      if (r.status >= 300 && r.status < 400) {
        const loc = r.headers.get('location');
        if (!loc) break;
        url = loc.startsWith('http') ? loc : new URL(loc, url).href;
      } else break;
    }

    const crumbRes = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
      headers: { 'User-Agent': UA, Cookie: cookieStr() },
    });
    const crumb = (await crumbRes.text()).trim();
    if (!crumb || crumb.startsWith('{')) {
      return res.status(502).json({ error: 'No se pudo obtener crumb de Yahoo Finance' });
    }

    // ── Refrescar cada ticker ───────────────────────────────────────────────
    const updated = [];
    const errors  = [];

    for (const { ticker } of tickers) {
      try {
        const summaryRes = await fetch(
          `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=calendarEvents,earningsTrend,financialData,earnings&crumb=${encodeURIComponent(crumb)}`,
          { headers: { 'User-Agent': UA, Cookie: cookieStr() } },
        );
        const summary = await summaryRes.json();
        const r = summary.quoteSummary?.result?.[0];
        if (!r) { errors.push(`${ticker}: sin result`); continue; }

        const earningsDates = r.calendarEvents?.earnings?.earningsDate;
        if (!earningsDates?.length) { errors.push(`${ticker}: sin earningsDate`); continue; }

        // Si YF devuelve 2 fechas → rango estimado → tomar la última (más conservadora)
        const tsRaw        = earningsDates[earningsDates.length - 1]?.raw;
        const confirmada   = earningsDates.length === 1;

        if (!tsRaw) { errors.push(`${ticker}: tsRaw null`); continue; }

        const d  = new Date(tsRaw * 1000);
        const yy = d.getUTCFullYear();
        const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(d.getUTCDate()).padStart(2, '0');

        // Recuperar el `cuando` actual para saber la hora
        const { rows: cur } = await db.execute({
          sql:  'SELECT cuando FROM earnings WHERE ticker = ?',
          args: [ticker],
        });
        const cuando  = cur[0]?.cuando ?? 'Despues del cierre';
        const timeStr = cuando === 'Antes de apertura' ? 'T11:00:00' : 'T20:30:00';
        const fecha   = `${yy}-${mm}-${dd}${timeStr}`;

        // Estimados actualizados
        const et     = r.earningsTrend?.trend?.find(t => t.period === '0q');
        const revRaw = et?.revenueEstimate?.avg?.raw;
        const epsRaw = et?.earningsEstimate?.avg?.raw;
        const fwdEps = r.financialData?.forwardEps?.raw;

        const { rows: priceRow } = await db.execute({
          sql:  "SELECT precio_base FROM reportes WHERE ticker = ? LIMIT 1",
          args: [ticker],
        }).catch(() => ({ rows: [] }));
        // precio_base may not exist; skip forward_pe recalc if not available
        const precio = null; // no recalculamos P/E aquí para no depender de precio en tiempo real

        const lastQ    = (r.earnings?.earningsChart?.quarterly || []).at(-1);
        let surprise   = null;
        if (lastQ?.actual?.raw != null && lastQ?.estimate?.raw && lastQ.estimate.raw !== 0)
          surprise = parseFloat(((lastQ.actual.raw - lastQ.estimate.raw) / Math.abs(lastQ.estimate.raw) * 100).toFixed(1));

        await db.execute({
          sql: `UPDATE earnings SET
                  fecha = ?, fecha_confirmada = ?,
                  eps_estimate = ?, revenue_estimate_b = ?,
                  last_surprise_pct = ?,
                  updated_at = strftime('%Y-%m-%d %H:%M:%S','now')
                WHERE ticker = ?`,
          args: [
            fecha, confirmada ? 1 : 0,
            epsRaw ? parseFloat(epsRaw.toFixed(2)) : null,
            revRaw ? parseFloat((revRaw / 1e9).toFixed(1)) : null,
            surprise,
            ticker,
          ],
        });

        updated.push({ ticker, fecha, confirmada });
        await new Promise(r => setTimeout(r, 300)); // pausa entre tickers
      } catch (e) {
        errors.push(`${ticker}: ${e.message}`);
      }
    }

    res.json({ updated: updated.length, tickers: updated, errors });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;

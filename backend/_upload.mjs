// node _upload.mjs  (run from backend/)
// Lee ../upload_config.json — campos: ticker, empresa, meta_desc, fecha_reporte,
//   precio, trimestre, cuando, fecha_fallback, mes_anio, nombre_empresa, wtw[5]
import { createClient }                    from '@libsql/client';
import { readFileSync, appendFileSync,
         writeFileSync, existsSync }        from 'fs';
import { execSync }                         from 'child_process';

const ROOT   = 'C:/Users/murra/portal-reportes';
const LOG    = `${ROOT}/ejecucion.log`;
const log    = s => appendFileSync(LOG, s + '\n');
const cfg    = JSON.parse(readFileSync(`${ROOT}/upload_config.json`, 'utf8'));
const { ticker, empresa, meta_desc, fecha_reporte,
        precio, trimestre, cuando, fecha_fallback,
        mes_anio, nombre_empresa, wtw } = cfg;

// ── 1. Turso ──────────────────────────────────────────────────────────────
const db = createClient({
  url:       'libsql://portal-murza-raymurrag-cloud.aws-us-east-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzQ0ODQzNjIsImlkIjoiMDE5ZDI3ODEtZmUwMS03OGNmLTg4Y2YtODk4NzViODc0N2FlIiwicmlkIjoiYmEzYjRmNmYtOWY5Ni00MjQ5LTlmOGMtZmZiNGI5NGNlNThlIn0.bOWEnoikCHiDlWrjvKjUk5l-PkUNKzJF4ema-3jLF_AClvSZUGL2it-lfBhrtUI20mBvPhD01dt0DqadgfY1Bg'
});

const json     = readFileSync(`${ROOT}/${ticker}.json`, 'utf8');
JSON.parse(json); // valida

const existing = await db.execute({ sql: 'SELECT id FROM reportes WHERE ticker = ?', args: [ticker] });

if (existing.rows.length > 0) {
  await db.execute({
    sql:  "UPDATE reportes SET contenido_json=?, empresa=?, meta_descripcion=?, publicado=1, updated_at=datetime('now'), fecha_reporte=? WHERE ticker=?",
    args: [json, empresa, meta_desc, fecha_reporte, ticker]
  });
  log('UPDATED: ' + ticker);
} else {
  await db.execute({
    sql:  "INSERT INTO reportes (ticker,empresa,contenido_md,contenido_json,parrafos_gratis,publicado,slug,meta_descripcion,updated_at,fecha_reporte) VALUES (?,?,?,?,?,?,?,?,datetime('now'),?)",
    args: [ticker, empresa, '', json, 14, 1, ticker, meta_desc, fecha_reporte]
  });
  log('INSERTED: ' + ticker);
}

// ── 2. Yahoo Finance — próximo earnings ───────────────────────────────────
const UA        = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
const timeStr   = cuando === 'Antes de apertura' ? 'T11:00:00' : 'T20:30:00';

let yfData = {};
try {
  // Recoger cookies siguiendo redirects manualmente
  const cookieJar = {};
  const mergeCookies = arr => {
    for (const c of (arr || [])) {
      const [kv] = c.split(';');
      const eq = kv.indexOf('=');
      if (eq > 0) cookieJar[kv.slice(0,eq).trim()] = kv.slice(eq+1).trim();
    }
  };
  const cookieStr = () => Object.entries(cookieJar).map(([k,v]) => `${k}=${v}`).join('; ');

  let url = `https://finance.yahoo.com/quote/${ticker}`;
  for (let i = 0; i < 6; i++) {
    const r = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept': 'text/html', 'Cookie': cookieStr() },
      redirect: 'manual'
    });
    mergeCookies(r.headers.getSetCookie?.() ?? []);
    if (r.status >= 300 && r.status < 400) {
      const loc = r.headers.get('location');
      if (!loc) break;
      url = loc.startsWith('http') ? loc : new URL(loc, url).href;
    } else break;
  }

  const crumbRes = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
    headers: { 'User-Agent': UA, 'Cookie': cookieStr() }
  });
  const crumb = (await crumbRes.text()).trim();
  if (!crumb || crumb.startsWith('{')) throw new Error('crumb invalido: ' + crumb.slice(0,50));

  const modules  = 'earningsTrend,financialData,calendarEvents,earnings';
  const summaryRes = await fetch(
    `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=${encodeURIComponent(modules)}&crumb=${encodeURIComponent(crumb)}`,
    { headers: { 'User-Agent': UA, 'Cookie': cookieStr() } }
  );
  const summary = await summaryRes.json();
  const r       = summary.quoteSummary?.result?.[0];
  if (!r) throw new Error('quoteSummary sin result: ' + JSON.stringify(summary.quoteSummary?.error));

  const et      = r.earningsTrend?.trend?.find(t => t.period === '0q');
  const revRaw  = et?.revenueEstimate?.avg?.raw;
  const epsRaw  = et?.earningsEstimate?.avg?.raw;
  const fwdEps  = r.financialData?.forwardEps?.raw;
  // Si YF devuelve 2 fechas → rango estimado → tomar la última (más conservadora)
  const earningsDates = r.calendarEvents?.earnings?.earningsDate;
  const tsRaw   = earningsDates?.length ? earningsDates[earningsDates.length - 1]?.raw : null;
  const _confirmada = earningsDates?.length === 1;
  const lastQ   = (r.earnings?.earningsChart?.quarterly || []).at(-1);

  let fecha = fecha_fallback, fechaConfirmada = _confirmada;
  if (tsRaw) {
    const d  = new Date(tsRaw * 1000);
    const yy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2,'0');
    const dd = String(d.getUTCDate()).padStart(2,'0');
    fecha = `${yy}-${mm}-${dd}${timeStr}`;
    fechaConfirmada = true;
  }

  let surprise = null;
  if (lastQ?.actual?.raw != null && lastQ?.estimate?.raw && lastQ.estimate.raw !== 0)
    surprise = parseFloat(((lastQ.actual.raw - lastQ.estimate.raw) / Math.abs(lastQ.estimate.raw) * 100).toFixed(1));

  yfData = {
    rev_b:            revRaw ? parseFloat((revRaw / 1e9).toFixed(1))   : null,
    eps:              epsRaw ? parseFloat(epsRaw.toFixed(2))            : null,
    fwd_pe:           fwdEps ? parseFloat((precio / fwdEps).toFixed(1)): null,
    fecha, fechaConfirmada, surprise
  };
  log(`YF_OK: rev=${yfData.rev_b}B eps=${yfData.eps} fwdPe=${yfData.fwd_pe} surprise=${yfData.surprise} fecha=${yfData.fecha} confirmada=${yfData.fechaConfirmada}`);
} catch(e) {
  log('YF_ERR: ' + e.message);
}

// ── 3. Turso earnings table ───────────────────────────────────────────────
try {
  const fechaFinal  = yfData.fecha ?? fecha_fallback;
  const confirmada  = yfData.fechaConfirmada ? 1 : 0;
  const wtwJson     = JSON.stringify(wtw);

  const { rows: existeE } = await db.execute({ sql: 'SELECT ticker FROM earnings WHERE ticker = ?', args: [ticker] });
  if (existeE.length > 0) {
    await db.execute({
      sql: `UPDATE earnings SET
              nombre=?, trimestre=?, fecha=?, cuando=?, fecha_confirmada=?,
              eps_estimate=?, revenue_estimate_b=?, forward_pe=?, last_surprise_pct=?,
              what_to_watch=?, updated_at=strftime('%Y-%m-%d %H:%M:%S','now')
            WHERE ticker=?`,
      args: [nombre_empresa, trimestre, fechaFinal, cuando, confirmada,
             yfData.eps ?? null, yfData.rev_b ?? null, yfData.fwd_pe ?? null, yfData.surprise ?? null,
             wtwJson, ticker],
    });
    log('EARNINGS_UPDATED: ' + ticker);
  } else {
    await db.execute({
      sql: `INSERT INTO earnings (ticker, nombre, trimestre, fecha, cuando, fecha_confirmada,
              eps_estimate, revenue_estimate_b, forward_pe, last_surprise_pct, what_to_watch)
            VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      args: [ticker, nombre_empresa, trimestre, fechaFinal, cuando, confirmada,
             yfData.eps ?? null, yfData.rev_b ?? null, yfData.fwd_pe ?? null, yfData.surprise ?? null,
             wtwJson],
    });
    log('EARNINGS_INSERTED: ' + ticker);
  }
} catch(e) {
  log('EARNINGS_ERR: ' + e.message);
}

// ── 4. llms.txt + git push ────────────────────────────────────────────────
try {
  execSync(`node --input-type=module < ${ROOT}/generate-llms.mjs`, { cwd: `${ROOT}/backend`, stdio: 'pipe' });
  log('LLMS_UPDATED');
} catch(e) { log('LLMS_WARN: ' + e.message); }

try {
  const gitRoot = ROOT;
  execSync(
    `git add frontend/public/llms.txt frontend/public/llms-full.txt && ` +
    `git diff --cached --quiet || git commit -m "Actualiza llms.txt para ${ticker}" && git push origin master`,
    { cwd: gitRoot, stdio: 'pipe', shell: true }
  );
  log('GIT_PUSHED: ' + ticker);
} catch(e) { log('GIT_WARN: ' + e.message); }

log(`https://reportes.murzainversiones.com/reporte/${ticker}`);

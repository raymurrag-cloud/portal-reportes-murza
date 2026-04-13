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

// ── Resend (email via HTTPS) ───────────────────────────────────────────────
async function enviarEmail({ to, subject, text }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Portal Murza <noreply@murzainversiones.com>',
      to: [to],
      subject,
      text,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
}

// ── Prospectos GBM (público) ───────────────────────────────────────────────
app.post('/api/prospectos-gbm', async (req, res) => {
  const {
    nombre, telefono, correo, valor_portafolio,
    fuente, campana, anuncio, dispositivo, sistema_os, navegador,
    visita_recurrente, dias_ultima_visita, tiempo_total_seg, paginas_json,
  } = req.body || {};

  if (!nombre?.trim() || !telefono?.trim() || !correo?.trim() || !valor_portafolio?.trim())
    return res.status(400).json({ error: 'Todos los campos son requeridos' });

  // Geolocalización silenciosa por IP
  let ciudad = null, estado = null;
  try {
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress;
    const geo = await fetch(`http://ip-api.com/json/${ip}?fields=city,regionName,status&lang=es`).then(r => r.json());
    if (geo.status === 'success') { ciudad = geo.city || null; estado = geo.regionName || null; }
  } catch (_) {}

  const { db } = await import('./database.js');
  await db.execute({
    sql: `INSERT INTO prospectos_gbm
      (nombre, telefono, correo, valor_portafolio, ciudad, estado,
       fuente, campana, anuncio, dispositivo, sistema_os, navegador,
       visita_recurrente, dias_ultima_visita, tiempo_total_seg, paginas_json)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [
      nombre.trim().slice(0, 100), telefono.trim().slice(0, 20),
      correo.trim().slice(0, 100), valor_portafolio.trim().slice(0, 50),
      ciudad, estado,
      fuente || null, campana || null, anuncio || null,
      dispositivo || null, sistema_os || null, navegador || null,
      visita_recurrente ? 1 : 0, dias_ultima_visita ?? null,
      tiempo_total_seg ?? null, paginas_json || null,
    ],
  });

  // Formatear paginas para el email
  let paginasTexto = '';
  try {
    const paginas = JSON.parse(paginas_json || '[]');
    paginasTexto = paginas.map((p, i) => {
      const scroll = p.scroll_max ? ` (scroll ${p.scroll_max}%)` : '';
      const t = p.tiempo_seg >= 60
        ? `${Math.floor(p.tiempo_seg / 60)} min ${p.tiempo_seg % 60} seg`
        : `${p.tiempo_seg || 0} seg`;
      return `  ${i + 1}. ${p.titulo.padEnd(22)} ${t}${scroll}`;
    }).join('\n');
  } catch (_) {}

  const ubicacion  = ciudad && estado ? `${ciudad}, ${estado}` : ciudad || estado || 'No disponible';
  const recurrente = visita_recurrente ? `Si (hace ${dias_ultima_visita ?? '?'} dias)` : 'No (primera visita)';
  const tiempoTotal = tiempo_total_seg >= 60
    ? `${Math.floor(tiempo_total_seg / 60)} min ${tiempo_total_seg % 60} seg`
    : `${tiempo_total_seg || 0} seg`;

  enviarEmail({
    to:      'rmurra@murzainversiones.com',
    subject: `Nuevo prospecto GBM: ${nombre.trim()}`,
    text: [
      'Nuevo prospecto interesado en asesoria GBM:',
      '',
      `Nombre:           ${nombre.trim()}`,
      `Telefono:         ${telefono.trim()}`,
      `Correo:           ${correo.trim()}`,
      `Valor portafolio: ${valor_portafolio.trim()}`,
      '',
      '── Ubicacion ──────────────────────────',
      `Ciudad:           ${ubicacion}`,
      '',
      '── Dispositivo ────────────────────────',
      `Dispositivo:      ${dispositivo || 'Desconocido'}`,
      `Sistema:          ${sistema_os || 'Desconocido'}`,
      `Navegador:        ${navegador || 'Desconocido'}`,
      '',
      '── Origen ─────────────────────────────',
      `Fuente:           ${fuente || 'Directo'}`,
      campana ? `Campana:          ${campana}` : null,
      anuncio ? `Anuncio:          ${anuncio}` : null,
      '',
      '── Comportamiento ─────────────────────',
      `Visita recurrente: ${recurrente}`,
      `Tiempo en sitio:  ${tiempoTotal}`,
      paginasTexto ? `Paginas vistas:\n${paginasTexto}` : null,
      '',
      'Ver todos los prospectos: https://reportes.murzainversiones.com/admin/prospectos',
    ].filter(l => l !== null).join('\n'),
  }).then(() => console.log('Email prospecto GBM enviado OK'))
    .catch(err => console.error('Email prospecto GBM error:', err.message));

  res.status(201).json({ ok: true });
});

// ── Track de visitantes (público, sin auth) ───────────────────────────────
app.post('/api/track', async (req, res) => {
  const { visitor_id, session_id, pagina_url, pagina_titulo, tiempo_seg, scroll_max,
          fuente, campana, dispositivo, sistema_os, visita_recurrente } = req.body || {};
  if (!visitor_id || !session_id || !pagina_url) return res.status(204).send();

  // Geo por IP
  let ciudad = null, estado = null;
  try {
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress;
    const geo = await fetch(`http://ip-api.com/json/${ip}?fields=city,regionName,status&lang=es`).then(r => r.json());
    if (geo.status === 'success') { ciudad = geo.city || null; estado = geo.regionName || null; }
  } catch (_) {}

  try {
    const { db } = await import('./database.js');
    await db.execute({
      sql: `INSERT INTO visitantes (visitor_id, session_id, pagina_url, pagina_titulo,
              tiempo_seg, scroll_max, fuente, campana, dispositivo, sistema_os,
              visita_recurrente, ciudad, estado)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [
        visitor_id.slice(0, 40), session_id.slice(0, 40),
        pagina_url.slice(0, 100), (pagina_titulo || '').slice(0, 100),
        tiempo_seg || 0, scroll_max || 0,
        fuente || null, campana || null,
        dispositivo || null, sistema_os || null,
        visita_recurrente ? 1 : 0, ciudad, estado,
      ],
    });
  } catch (_) {}
  res.status(204).send();
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
  enviarEmail({
    to:      'rmurra@murzainversiones.com',
    subject: `Nueva solicitud de reporte: ${empresaClean}${tickerClean ? ` (${tickerClean})` : ''}`,
    text: [
      'Nueva solicitud de reporte en el portal:',
      '',
      `Empresa: ${empresaClean}`,
      tickerClean ? `Ticker:  ${tickerClean}` : '',
      emailClean  ? `Email:   ${emailClean}`  : '',
      '',
      'Ver todas las solicitudes: https://reportes.murzainversiones.com/admin/solicitudes',
    ].filter(Boolean).join('\n'),
  }).then(() => console.log('Email solicitud enviado OK'))
    .catch(err => console.error('Email solicitud error:', err.message));

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

// ── /llms.txt — Guia de navegacion para agentes de IA ────────────────────
app.get('/llms.txt', async (req, res) => {
  const { db } = await import('./database.js');
  const { rows } = await db.execute({
    sql: `SELECT ticker, empresa, slug, meta_descripcion, contenido_json, tipo
          FROM reportes WHERE publicado = 1 ORDER BY created_at DESC`,
    args: [],
  });

  const acciones = rows.filter(r => r.tipo !== 'etf');
  const etfs     = rows.filter(r => r.tipo === 'etf');
  const base     = 'https://reportes.murzainversiones.com';

  const formatLinea = (r) => {
    let veredicto = '';
    try {
      const j = JSON.parse(r.contenido_json);
      if (j?.verdict?.status) veredicto = ` Veredicto: ${j.verdict.status}.`;
    } catch (_) {}
    return `- [${r.empresa} (${r.ticker})](${base}/reporte/${r.slug}): ${r.meta_descripcion || ''}${veredicto}`;
  };

  let md = `# Murza Inversiones — Portal de Analisis Financiero\n\n`;
  md += `> Portal independiente de analisis fundamental de empresas publicas de EE.UU. Reportes basados en datos reales de filings 10-K y 10-Q oficiales de la SEC (API XBRL de EDGAR). Cada reporte incluye tablas financieras de 5 anos, ratios de valuacion calculados en tiempo real, graficas de ingresos y margenes, deteccion de deterioro operativo, red flags, Quality Score 1-10 y veredicto de inversion. Acceso libre. En espanol para inversionistas de Mexico y Latinoamerica.\n\n`;

  if (acciones.length > 0) {
    md += `## Reportes de acciones (${acciones.length} empresas)\n\n`;
    md += acciones.map(formatLinea).join('\n') + '\n\n';
  }

  if (etfs.length > 0) {
    md += `## Reportes de ETFs (${etfs.length} fondos)\n\n`;
    md += etfs.map(formatLinea).join('\n') + '\n\n';
  }

  md += `## Calendario de Earnings\n\n`;
  md += `- [Calendario de Earnings](${base}/earnings): Proximas fechas de resultados trimestrales, estimados de EPS y revenue, porcentaje de sorpresa historica, P/E Forward y puntos clave a vigilar en cada empresa cubierta.\n\n`;

  md += `## Pagina principal\n\n`;
  md += `- [Inicio](${base}): Directorio completo de reportes, buscador por ticker, y formulario para solicitar analisis de nuevas empresas.\n\n`;

  md += `## Recursos para sistemas de IA\n\n`;
  md += `- [llms-full.txt](${base}/llms-full.txt): Contenido completo del portal en un solo archivo — metodologia, glosario y resumen financiero de cada empresa.\n`;
  md += `- [Sitemap XML](${base}/api/reportes/sitemap.xml): Todas las URLs publicadas con fechas de actualizacion.\n\n`;

  md += `## Metodologia\n\n`;
  md += `Fuente: API XBRL de SEC EDGAR (companyfacts). Metricas: Revenue, Utilidad Neta, EBITDA, FCF (=FCO-Capex), EPS diluido, Deuda Neta (=Deuda LP - Efectivo), Margen Neto, ROE, ROIC. Ratios de valuacion (P/E, P/FCF, EV/EBITDA) se recalculan en tiempo real con el precio actual de la accion via Yahoo Finance. Estimados forward provienen de consenso de analistas.\n\n`;
  md += `Escala de veredictos: Comprar con Conviccion > Comprar > Mantener > Reducir > Evitar.\n\n`;

  md += `## Sobre Murza Inversiones\n\n`;
  md += `Firma de asesoria financiera con sede en Mexico. Fundador: Ray Murra, asesor de inversiones afiliado a GBM (Grupo Bursatil Mexicano). Cobertura: Mexico y Latinoamerica.\n`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(md);
});

// ── /llms-full.txt — Contenido completo para ingesta directa por IA ───────
app.get('/llms-full.txt', async (req, res) => {
  const { db } = await import('./database.js');
  const { rows } = await db.execute({
    sql: `SELECT ticker, empresa, slug, meta_descripcion, contenido_json, tipo, created_at
          FROM reportes WHERE publicado = 1 ORDER BY created_at DESC`,
    args: [],
  });

  const base = 'https://reportes.murzainversiones.com';
  const today = new Date().toISOString().split('T')[0];

  let md = `# Murza Inversiones — Portal de Analisis Financiero\n`;
  md += `## Guia completa para sistemas de IA\n\n`;
  md += `**URL**: ${base}\n`;
  md += `**Actualizado**: ${today}\n`;
  md += `**Idioma**: Espanol\n`;
  md += `**Cobertura**: Mexico y Latinoamerica\n\n---\n\n`;

  md += `## Que es este portal\n\n`;
  md += `Portal independiente de analisis fundamental de empresas publicas de EE.UU. Reportes basados en datos reales del 10-K/10-Q presentados ante la SEC via EDGAR. Diseñado para inversionistas hispanohablantes. Acceso libre con registro gratuito. Fundador: Ray Murra, asesor de inversiones afiliado a GBM (Grupo Bursatil Mexicano).\n\n`;

  md += `## Metodologia\n\n`;
  md += `**Fuente primaria**: API XBRL de SEC EDGAR — https://data.sec.gov/api/xbrl/companyfacts/CIK{CIK}.json\n\n`;
  md += `**Metricas calculadas**:\n`;
  md += `- FCF = Flujo de caja operativo - Capex\n`;
  md += `- EBITDA = Utilidad operativa + Depreciacion y amortizacion\n`;
  md += `- Deuda Neta = Deuda LP - Efectivo\n`;
  md += `- ROE = Utilidad Neta / Patrimonio Neto\n`;
  md += `- ROIC = NOPAT / Capital invertido\n\n`;
  md += `**Ratios de valuacion**: P/E Trailing, P/E Forward, EV/EBITDA, P/FCF — recalculados en tiempo real con precio de Yahoo Finance.\n\n`;
  md += `**Estimados forward** (EPS/Revenue): consenso de analistas de Wall Street.\n\n`;
  md += `**Escala de veredictos**: Comprar con Conviccion | Comprar | Mantener | Reducir | Evitar\n\n`;
  md += `**Estructura de cada reporte**: Resumen ejecutivo, tabla financiera 5 anos, KPIs de valuacion, graficas de ingresos y margenes, deteccion de deterioro operativo (semaforo ok/warn/bad), red flags y fortalezas (verde/amarillo/rojo), Quality Score 1-10, analisis cualitativo, comparacion sectorial, capital allocation, veredicto final.\n\n---\n\n`;

  // Seccion por cada reporte
  const acciones = rows.filter(r => r.tipo !== 'etf');
  const etfs     = rows.filter(r => r.tipo === 'etf');

  const renderReporte = (r) => {
    let section = `### ${r.ticker} — ${r.empresa}\n`;
    section += `**URL**: ${base}/reporte/${r.slug}\n`;
    if (r.created_at) section += `**Publicado**: ${r.created_at.split(' ')[0]}\n`;

    try {
      const j = JSON.parse(r.contenido_json);

      if (j?.resumen)      section += `\n${j.resumen}\n`;
      if (j?.descripcion)  section += `\n${j.descripcion}\n`;

      // Tabla financiera resumida
      if (j?.tabla?.headers && j?.tabla?.rows?.length) {
        const hdrs = j.tabla.headers;
        const rows = j.tabla.rows;
        section += `\n**Tabla financiera**:\n`;
        rows.forEach(row => {
          const metrica = row[0];
          const ultimo  = row[row.length - 2]; // penultimo = ultimo año completo
          const yoy     = row[row.length - 1]; // ultimo = var YoY
          section += `- ${metrica}: ${ultimo} (${yoy} YoY)\n`;
        });
      }

      // KPIs de valuacion
      if (j?.kpis?.length) {
        section += `\n**KPIs de valuacion**: `;
        section += j.kpis.map(k => `${k.label} ${k.value}`).join(', ') + '\n';
      }

      // Veredicto
      if (j?.verdict) {
        section += `\n**Veredicto**: ${j.verdict.status || ''} (Score: ${j.verdict.score || ''})\n`;
        if (j.verdict.bullets?.length) {
          j.verdict.bullets.forEach(b => {
            const tipo = b.type === 'pro' ? '+' : '-';
            section += `${tipo} ${b.text.replace(/\*\*/g, '')}\n`;
          });
        }
      }
    } catch (_) {
      if (r.meta_descripcion) section += `\n${r.meta_descripcion}\n`;
    }

    section += `\n`;
    return section;
  };

  if (acciones.length > 0) {
    md += `## Reportes de acciones (${acciones.length} empresas)\n\n`;
    md += acciones.map(renderReporte).join('---\n\n');
  }

  if (etfs.length > 0) {
    md += `## Reportes de ETFs (${etfs.length} fondos)\n\n`;
    md += etfs.map(renderReporte).join('---\n\n');
  }

  md += `---\n\n## Glosario\n\n`;
  md += `- **Revenue**: Ingresos totales del periodo\n`;
  md += `- **Utilidad Neta**: Revenue menos todos los costos, impuestos e intereses\n`;
  md += `- **EBITDA**: Earnings Before Interest, Taxes, Depreciation & Amortization\n`;
  md += `- **FCF**: Free Cash Flow — efectivo real generado por el negocio\n`;
  md += `- **EPS**: Earnings Per Share — utilidad por accion diluida\n`;
  md += `- **Deuda Neta**: Deuda financiera menos efectivo (negativa = caja neta)\n`;
  md += `- **P/E**: Price-to-Earnings — precio / EPS\n`;
  md += `- **P/E Forward**: Precio / EPS estimado siguiente ejercicio fiscal\n`;
  md += `- **EV/EBITDA**: Enterprise Value / EBITDA — metrica de adquisicion\n`;
  md += `- **P/FCF**: Market Cap / FCF anual\n`;
  md += `- **ROE**: Return on Equity — eficiencia del capital propio\n`;
  md += `- **ROIC**: Return on Invested Capital — eficiencia del capital total\n`;
  md += `- **YoY**: Year-over-Year — variacion vs. mismo periodo del ano anterior\n`;
  md += `- **TTM**: Trailing Twelve Months — ultimos 12 meses acumulados\n\n`;

  md += `---\n\n## Nota legal\n\n`;
  md += `Los reportes son con fines informativos y educativos. No constituyen recomendaciones de inversion personalizadas. Cada inversionista debe evaluar su perfil de riesgo antes de tomar decisiones.\n`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(md);
});

initDb().then(() => {
  app.listen(PORT, () => console.log(`Portal backend corriendo en puerto ${PORT}`));
}).catch(err => {
  console.error('Error iniciando DB:', err);
  process.exit(1);
});

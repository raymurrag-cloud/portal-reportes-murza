import { Router } from 'express';
import { db } from '../database.js';
import { authAdmin } from '../middleware/authAdmin.js';
import { generarSlug } from './reportes.js';

const router = Router();
router.use(authAdmin);

// ── Listar todos los reportes ─────────────────────────────────────────────
router.get('/reportes', async (req, res) => {
  const { rows } = await db.execute({
    sql:  'SELECT id, ticker, empresa, slug, publicado, parrafos_gratis, created_at, updated_at FROM reportes ORDER BY created_at DESC',
    args: [],
  });
  res.json(rows.map(r => ({ ...r, id: Number(r.id) })));
});

// ── Obtener reporte completo para edición ────────────────────────────────
router.get('/reportes/:id', async (req, res) => {
  const { rows } = await db.execute({ sql: 'SELECT * FROM reportes WHERE id = ?', args: [req.params.id] });
  const r = rows[0];
  if (!r) return res.status(404).json({ error: 'No encontrado' });
  res.json({ ...r, id: Number(r.id) });
});

// ── Crear reporte ─────────────────────────────────────────────────────────
router.post('/reportes', async (req, res) => {
  const { ticker, empresa, contenido_md, contenido_json, parrafos_gratis, publicado, slug, meta_descripcion } = req.body;

  if (!ticker || !empresa || (!contenido_md && !contenido_json))
    return res.status(400).json({ error: 'ticker, empresa y contenido son requeridos' });

  const slugFinal = slug?.trim() || generarSlug(empresa, ticker);
  const mdBase = contenido_md || '';
  const desc = meta_descripcion?.trim() ||
    mdBase.replace(/#+\s/g, '').replace(/\*\*/g, '').trim().slice(0, 160) ||
    `Análisis financiero de ${empresa} (${ticker})`;

  const result = await db.execute({
    sql:  'INSERT INTO reportes (ticker, empresa, contenido_md, contenido_json, parrafos_gratis, publicado, slug, meta_descripcion) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    args: [ticker.toUpperCase(), empresa, mdBase, contenido_json || null, parrafos_gratis || 2, publicado ? 1 : 0, slugFinal, desc],
  });

  res.status(201).json({ id: Number(result.lastInsertRowid), slug: slugFinal });
});

// ── Actualizar reporte ────────────────────────────────────────────────────
router.put('/reportes/:id', async (req, res) => {
  const { ticker, empresa, contenido_md, contenido_json, parrafos_gratis, slug, meta_descripcion } = req.body;
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  await db.execute({
    sql:  'UPDATE reportes SET ticker = ?, empresa = ?, contenido_md = ?, contenido_json = ?, parrafos_gratis = ?, slug = ?, meta_descripcion = ?, updated_at = ? WHERE id = ?',
    args: [ticker.toUpperCase(), empresa, contenido_md || '', contenido_json || null, parrafos_gratis || 2, slug, meta_descripcion, now, req.params.id],
  });

  res.json({ success: true });
});

// ── Toggle publicado ──────────────────────────────────────────────────────
router.patch('/reportes/:id/publicar', async (req, res) => {
  const { rows } = await db.execute({ sql: 'SELECT publicado FROM reportes WHERE id = ?', args: [req.params.id] });
  const r = rows[0];
  if (!r) return res.status(404).json({ error: 'No encontrado' });

  const nuevoEstado = r.publicado ? 0 : 1;
  await db.execute({
    sql:  'UPDATE reportes SET publicado = ?, updated_at = ? WHERE id = ?',
    args: [nuevoEstado, new Date().toISOString().replace('T', ' ').slice(0, 19), req.params.id],
  });

  res.json({ publicado: nuevoEstado });
});

// ── Eliminar reporte (solo borradores) ────────────────────────────────────
router.delete('/reportes/:id', async (req, res) => {
  const { rows } = await db.execute({ sql: 'SELECT publicado FROM reportes WHERE id = ?', args: [req.params.id] });
  const r = rows[0];
  if (!r) return res.status(404).json({ error: 'No encontrado' });
  if (r.publicado) return res.status(400).json({ error: 'Despublica el reporte antes de eliminarlo' });

  await db.execute({ sql: 'DELETE FROM reportes WHERE id = ?', args: [req.params.id] });
  res.json({ success: true });
});

// ── Lista de leads ────────────────────────────────────────────────────────
router.get('/leads', async (req, res) => {
  const { rows } = await db.execute({
    sql:  'SELECT id, nombre, correo, telefono, ciudad, tiene_inversiones, capital_disponible, created_at FROM usuarios_portal ORDER BY created_at DESC',
    args: [],
  });
  res.json(rows.map(r => ({ ...r, id: Number(r.id) })));
});

// ── Lista de prospectos GBM ───────────────────────────────────────────────
router.get('/prospectos', async (req, res) => {
  const { rows } = await db.execute({
    sql:  'SELECT id, nombre, telefono, correo, valor_portafolio, ciudad, estado, fuente, campana, dispositivo, sistema_os, visita_recurrente, dias_ultima_visita, tiempo_total_seg, paginas_json, created_at FROM prospectos_gbm ORDER BY created_at DESC',
    args: [],
  });
  res.json(rows.map(r => ({ ...r, id: Number(r.id) })));
});

// ── Lista de solicitudes de reportes ──────────────────────────────────────
router.get('/solicitudes', async (req, res) => {
  const { rows } = await db.execute({
    sql:  'SELECT id, empresa, ticker, email, created_at FROM solicitudes_reporte ORDER BY created_at DESC',
    args: [],
  });
  res.json(rows.map(r => ({ ...r, id: Number(r.id) })));
});

// ── Analytics ─────────────────────────────────────────────────────────────────
router.get('/analytics', async (req, res) => {
  const periodo = req.query.periodo || 'semana'; // hoy | semana | mes | total
  const diasMap = { hoy: 1, semana: 7, mes: 30, total: 3650 };
  const dias = diasMap[periodo] || 7;

  const [{ rows: visitas }, { rows: prospectos }, { rows: busquedas }] = await Promise.all([
    db.execute({
      sql: `SELECT visitor_id, session_id, pagina_url, pagina_titulo,
                   tiempo_seg, scroll_max, fuente, campana,
                   dispositivo, sistema_os, visita_recurrente, ciudad, estado,
                   navegador, pais, zona_horaria, isp, es_proxy,
                   tiempo_primer_scroll, created_at
            FROM visitantes
            WHERE created_at >= datetime('now', ?)
            ORDER BY created_at DESC LIMIT 20000`,
      args: [`-${dias} days`],
    }),
    db.execute({
      sql: `SELECT fuente, valor_portafolio, paginas_json, primera_visita_at, created_at
            FROM prospectos_gbm WHERE created_at >= datetime('now', ?)
            ORDER BY created_at DESC`,
      args: [`-${dias} days`],
    }),
    db.execute({
      sql: `SELECT query, COUNT(*) as count FROM busquedas_fallidas
            WHERE created_at >= datetime('now', ?) GROUP BY query ORDER BY count DESC LIMIT 20`,
      args: [`-${dias} days`],
    }),
  ]);

  const totalProspectos = prospectos.length;

  // ── Helpers ────────────────────────────────────────────────────────────────
  const countBy = (arr, key) => {
    const m = {};
    arr.forEach(r => { const v = r[key] || 'Desconocido'; m[v] = (m[v] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ label: k, count: v }));
  };

  // ── Dedup: cada visita genera 2 filas (ping entrada + beacon salida)
  // Mergear por (session_id, pagina_url) conservando max scroll, tiempo y primer_scroll real
  const pageVisitMap = new Map();
  visitas.forEach(r => {
    const key = `${r.session_id}::${r.pagina_url}`;
    const ex = pageVisitMap.get(key);
    if (!ex) {
      pageVisitMap.set(key, {
        ...r,
        scroll_max:           Number(r.scroll_max) || 0,
        tiempo_seg:           Number(r.tiempo_seg) || 0,
        tiempo_primer_scroll: r.tiempo_primer_scroll != null ? Number(r.tiempo_primer_scroll) : null,
      });
    } else {
      ex.scroll_max = Math.max(ex.scroll_max, Number(r.scroll_max) || 0);
      ex.tiempo_seg = Math.max(ex.tiempo_seg, Number(r.tiempo_seg) || 0);
      // primer scroll: tomar el valor no-nulo
      if (r.tiempo_primer_scroll != null && ex.tiempo_primer_scroll == null)
        ex.tiempo_primer_scroll = Number(r.tiempo_primer_scroll);
    }
  });
  const visitasDedup = [...pageVisitMap.values()];
  const visitasDedupClean = visitasDedup.filter(r => !r.pagina_url?.startsWith('__'));

  // Una fila por sesion (para fuente, dispositivo, nuevos/recurrentes)
  const sessionFirstMap = new Map();
  visitas.forEach(r => { if (!sessionFirstMap.has(r.session_id)) sessionFirstMap.set(r.session_id, r); });
  const visitasPorSesion = [...sessionFirstMap.values()];

  // Una fila por visitor (para ciudades)
  const visitorFirstMap = new Map();
  visitas.forEach(r => { if (!visitorFirstMap.has(r.visitor_id)) visitorFirstMap.set(r.visitor_id, r); });
  const visitasPorVisitor = [...visitorFirstMap.values()];

  // ── Visitantes únicos y sesiones ──────────────────────────────────────────
  const visitantesUnicos = visitasPorVisitor.length;
  const sesionesUnicas   = visitasPorSesion.length;
  const pageviews        = visitasDedupClean.length;

  // ── Resumen por sub-periodos (siempre desde 0, independiente del periodo) ─
  const ahora = Date.now();
  const { rows: all } = await db.execute({
    sql: `SELECT visitor_id, session_id, pagina_url, created_at, visita_recurrente FROM visitantes ORDER BY created_at DESC LIMIT 50000`,
    args: [],
  });
  const resumen = ['hoy', 'semana', 'mes', 'total'].reduce((acc, p) => {
    const d = { hoy: 1, semana: 7, mes: 30, total: 3650 }[p];
    const filtro = all.filter(r => new Date(r.created_at) >= new Date(ahora - d * 86400000));
    const pvSet = new Set(filtro.filter(r => !r.pagina_url?.startsWith('__')).map(r => `${r.session_id}::${r.pagina_url}`));
    const vMap = new Map();
    filtro.forEach(r => { if (!vMap.has(r.visitor_id)) vMap.set(r.visitor_id, r); });
    const visitantesCnt  = vMap.size;
    const recurrentesCnt = [...vMap.values()].filter(r => r.visita_recurrente).length;
    acc[p] = {
      visitantes:  visitantesCnt,
      sesiones:    new Set(filtro.map(r => r.session_id)).size,
      pageviews:   pvSet.size,
      nuevos:      visitantesCnt - recurrentesCnt,
      recurrentes: recurrentesCnt,
    };
    return acc;
  }, {});

  // ── Exit intents (registrados como pagina_url='__exit_intent__') ──────────
  const exitIntentSessions = new Set(visitas.filter(r => r.pagina_url === '__exit_intent__').map(r => r.session_id));
  const exitIntents = exitIntentSessions.size;

  // ── Fuentes (1 por sesion) ─────────────────────────────────────────────────
  const fuentes = countBy(visitasPorSesion, 'fuente');

  // ── Dispositivos (1 por sesion) ────────────────────────────────────────────
  const dispositivos = countBy(visitasPorSesion, 'dispositivo');

  // ── Navegadores (1 por sesion) ─────────────────────────────────────────────
  const navegadores = countBy(visitasPorSesion, 'navegador');

  // ── Ciudades (1 por visitor) ───────────────────────────────────────────────
  const ciudadesMap = {};
  visitasPorVisitor.forEach(r => {
    if (!r.ciudad) return;
    const key = r.estado ? `${r.ciudad}, ${r.estado}` : r.ciudad;
    ciudadesMap[key] = (ciudadesMap[key] || 0) + 1;
  });
  const ciudades = Object.entries(ciudadesMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([label, count]) => ({ label, count }));

  // ── Paises (1 por visitor) ─────────────────────────────────────────────────
  const paises = countBy(visitasPorVisitor, 'pais');

  // ── Top páginas ────────────────────────────────────────────────────────────
  const paginasMap = {};
  visitasDedupClean.forEach(r => {
    const key = r.pagina_url;
    if (!paginasMap[key]) paginasMap[key] = { url: key, titulo: r.pagina_titulo || key, vistas: 0, tiempo_total: 0, scroll_total: 0, con_scroll: 0, completos: 0 };
    const p = paginasMap[key];
    p.vistas++;
    p.tiempo_total += r.tiempo_seg;
    if (r.scroll_max > 0) { p.scroll_total += r.scroll_max; p.con_scroll++; }
    if (r.scroll_max >= 80) p.completos++;
  });
  const paginas = Object.values(paginasMap)
    .sort((a, b) => b.vistas - a.vistas)
    .slice(0, 15)
    .map(p => ({
      url:             p.url,
      titulo:          p.titulo,
      vistas:          p.vistas,
      tiempo_promedio: p.vistas > 0 ? Math.round(p.tiempo_total / p.vistas) : 0,
      scroll_promedio: p.con_scroll > 0 ? Math.round(p.scroll_total / p.con_scroll) : 0,
      completos:       p.completos,
    }));

  // ── Engagement por reporte ────────────────────────────────────────────────
  const reporteEngMap = {};
  visitasDedupClean.filter(r => r.pagina_url?.startsWith('/reporte/')).forEach(r => {
    const key = r.pagina_url;
    if (!reporteEngMap[key]) reporteEngMap[key] = { url: key, titulo: r.pagina_titulo || key, vistas: 0, scroll_total: 0, con_scroll: 0, tiempo_total: 0, completos: 0, primer_scroll_total: 0, con_primer_scroll: 0 };
    const re = reporteEngMap[key];
    re.vistas++;
    re.tiempo_total += r.tiempo_seg;
    if (r.scroll_max > 0) { re.scroll_total += r.scroll_max; re.con_scroll++; }
    if (r.scroll_max >= 80) re.completos++;
    if (r.tiempo_primer_scroll > 0) { re.primer_scroll_total += r.tiempo_primer_scroll; re.con_primer_scroll++; }
  });
  const reportes_engagement = Object.values(reporteEngMap)
    .sort((a, b) => b.vistas - a.vistas)
    .map(r => ({
      url:              r.url,
      titulo:           r.titulo,
      vistas:           r.vistas,
      scroll_promedio:  r.con_scroll > 0 ? Math.round(r.scroll_total / r.con_scroll) : 0,
      tiempo_promedio:  r.vistas > 0 ? Math.round(r.tiempo_total / r.vistas) : 0,
      primer_scroll:    r.con_primer_scroll > 0 ? Math.round(r.primer_scroll_total / r.con_primer_scroll) : null,
      completos:        r.completos,
      tasa_completado:  r.vistas > 0 ? Math.round((r.completos / r.vistas) * 100) : 0,
    }));

  // ── Embudo ────────────────────────────────────────────────────────────────
  const leyeronReporte  = new Set(visitasDedupClean.filter(r => r.pagina_url?.startsWith('/reporte/')).map(r => r.session_id)).size;
  const leyeronCompleto = new Set(visitasDedupClean.filter(r => r.pagina_url?.startsWith('/reporte/') && r.scroll_max >= 80).map(r => r.session_id)).size;
  const vieronEarnings  = new Set(visitasDedupClean.filter(r => r.pagina_url === '/earnings').map(r => r.session_id)).size;

  // ── Nuevos vs recurrentes (por visitante único, no por sesión) ─────────────
  const recurrentes = visitasPorVisitor.filter(r => r.visita_recurrente).length;

  // ── Comportamiento de sesion ───────────────────────────────────────────────
  const paginasPorSesionMap = {};
  visitasDedupClean.forEach(r => { paginasPorSesionMap[r.session_id] = (paginasPorSesionMap[r.session_id] || 0) + 1; });
  const conteosPorSesion   = Object.values(paginasPorSesionMap);
  const sesionesRebote     = conteosPorSesion.filter(n => n === 1).length;
  const tasaRebote         = sesionesUnicas > 0 ? Math.round((sesionesRebote / sesionesUnicas) * 100) : 0;
  const paginasPromSesion  = sesionesUnicas > 0 ? Math.round((visitasDedupClean.length / sesionesUnicas) * 10) / 10 : 0;

  const tiempoPorSesion = {};
  visitasDedupClean.forEach(r => { tiempoPorSesion[r.session_id] = (tiempoPorSesion[r.session_id] || 0) + r.tiempo_seg; });
  const tiemposSesionArr   = Object.values(tiempoPorSesion);
  const duracionPromSesion = tiemposSesionArr.length > 0
    ? Math.round(tiemposSesionArr.reduce((a, b) => a + b, 0) / tiemposSesionArr.length)
    : 0;

  // ── Primer scroll promedio en reportes ────────────────────────────────────
  const primerScrollArr = visitasDedupClean
    .filter(r => r.pagina_url?.startsWith('/reporte/') && r.tiempo_primer_scroll > 0)
    .map(r => r.tiempo_primer_scroll);
  const primerScrollProm = primerScrollArr.length > 0
    ? Math.round(primerScrollArr.reduce((a, b) => a + b, 0) / primerScrollArr.length)
    : null;

  // ── ISP (1 por visitor) ────────────────────────────────────────────────────
  const isps = countBy(visitasPorVisitor.filter(r => r.isp), 'isp').slice(0, 10);

  // ── Zona horaria (1 por visitor) ──────────────────────────────────────────
  const zonas_horarias = countBy(visitasPorVisitor.filter(r => r.zona_horaria), 'zona_horaria').slice(0, 10);

  // ── Proxies/VPN ───────────────────────────────────────────────────────────
  const proxies_count = visitasPorVisitor.filter(r => r.es_proxy).length;

  // ── Distribución horaria ──────────────────────────────────────────────────
  const horasMap = {};
  for (let h = 0; h < 24; h++) horasMap[h] = 0;
  visitasDedupClean.forEach(r => {
    if (!r.created_at) return;
    const utcH = new Date(r.created_at.replace(' ', 'T') + 'Z').getUTCHours();
    const mxH  = (utcH - 6 + 24) % 24;
    horasMap[mxH] = (horasMap[mxH] || 0) + 1;
  });
  const horas = Object.entries(horasMap).map(([h, count]) => ({ hora: Number(h), count }));

  // ── Inteligencia de conversión (desde prospectos_gbm) ─────────────────────
  const PORTAFOLIO_VALORES = {
    'Menos de $500K': 250000,
    '$500K - $1M':    750000,
    '$1M - $3M':      2000000,
    'Mas de $3M':     4000000,
  };

  // Qué reporte genera más leads
  const reporteLeadsMap = {};
  prospectos.forEach(p => {
    try {
      const pags = JSON.parse(p.paginas_json || '[]');
      const tickers = [...new Set(pags
        .filter(pg => pg.url?.startsWith('/reporte/'))
        .map(pg => pg.url.split('/reporte/')[1]?.toUpperCase())
        .filter(Boolean)
      )];
      tickers.forEach(t => { reporteLeadsMap[t] = (reporteLeadsMap[t] || 0) + 1; });
    } catch {}
  });
  const conversion_por_reporte = Object.entries(reporteLeadsMap)
    .sort((a, b) => b[1] - a[1])
    .map(([ticker, leads]) => ({ ticker, leads }));

  // Portafolio promedio por fuente
  const fuentePortMap = {};
  prospectos.forEach(p => {
    const fuente = p.fuente || 'Directo';
    const valor  = PORTAFOLIO_VALORES[p.valor_portafolio] || 0;
    if (!fuentePortMap[fuente]) fuentePortMap[fuente] = { total: 0, count: 0, breakdown: {} };
    fuentePortMap[fuente].total += valor;
    fuentePortMap[fuente].count++;
    fuentePortMap[fuente].breakdown[p.valor_portafolio] = (fuentePortMap[fuente].breakdown[p.valor_portafolio] || 0) + 1;
  });
  const portafolio_por_fuente = Object.entries(fuentePortMap)
    .map(([fuente, d]) => ({
      fuente,
      leads:           d.count,
      promedio:        d.count > 0 ? Math.round(d.total / d.count) : 0,
      breakdown:       d.breakdown,
    }))
    .sort((a, b) => b.leads - a.leads);

  // Tiempo hasta conversión (primera_visita_at → created_at del prospecto)
  const tiemposConvArr = prospectos
    .filter(p => p.primera_visita_at)
    .map(p => {
      const primera    = parseInt(p.primera_visita_at);
      const convertido = new Date(p.created_at.replace(' ', 'T') + 'Z').getTime();
      const dias       = Math.round((convertido - primera) / 86400000);
      return dias >= 0 ? dias : null;
    })
    .filter(d => d !== null);
  const tiempo_hasta_conversion = tiemposConvArr.length > 0 ? {
    promedio_dias:  Math.round((tiemposConvArr.reduce((a, b) => a + b, 0) / tiemposConvArr.length) * 10) / 10,
    mismo_dia:      tiemposConvArr.filter(d => d === 0).length,
    uno_a_tres:     tiemposConvArr.filter(d => d >= 1 && d <= 3).length,
    mas_de_tres:    tiemposConvArr.filter(d => d > 3).length,
    total:          tiemposConvArr.length,
  } : null;

  res.json({
    resumen,
    fuentes,
    dispositivos,
    navegadores,
    ciudades,
    paises,
    isps,
    zonas_horarias,
    proxies_count,
    paginas,
    reportes_engagement,
    embudo: {
      total_sesiones:    sesionesUnicas,
      leyeron_reporte:   leyeronReporte,
      leyeron_completo:  leyeronCompleto,
      vieron_earnings:   vieronEarnings,
      llenaron_form:     totalProspectos,
    },
    nuevos_vs_recurrentes: {
      nuevos:      resumen[periodo].nuevos,
      recurrentes: resumen[periodo].recurrentes,
    },
    comportamiento: {
      tasa_rebote:          tasaRebote,
      paginas_por_sesion:   paginasPromSesion,
      duracion_sesion:      duracionPromSesion,
      exit_intents:         exitIntents,
      exit_intent_rate:     sesionesUnicas > 0 ? Math.round((exitIntents / sesionesUnicas) * 100) : 0,
      primer_scroll_seg:    primerScrollProm,
    },
    horas,
    busquedas_fallidas:    busquedas.map(r => ({ query: r.query, count: Number(r.count) })),
    conversion_por_reporte,
    portafolio_por_fuente,
    tiempo_hasta_conversion,
    periodo,
  });
});

// ── Lista de visitantes con engagement score ──────────────────────────────────
router.get('/visitantes', async (req, res) => {
  const limit   = parseInt(req.query.limit)  || 100;
  const offset  = parseInt(req.query.offset) || 0;
  const periodo = req.query.periodo || 'total';
  const diasMap = { hoy: 1, semana: 7, mes: 30, total: 3650 };
  const dias    = diasMap[periodo] || 3650;

  const [{ rows: visitas }, { rows: prospectos }] = await Promise.all([
    db.execute({
      sql: `SELECT visitor_id, session_id, pagina_url, tiempo_seg, scroll_max,
                   fuente, dispositivo, ciudad, pais, isp, es_proxy, navegador, created_at
            FROM visitantes WHERE created_at >= datetime('now', ?)
            ORDER BY created_at DESC LIMIT 80000`,
      args: [`-${dias} days`],
    }),
    db.execute({
      sql: `SELECT visitor_id, nombre, valor_portafolio, created_at FROM prospectos_gbm WHERE visitor_id IS NOT NULL`,
      args: [],
    }),
  ]);

  const prospectosMap = new Map();
  prospectos.forEach(p => { if (p.visitor_id) prospectosMap.set(p.visitor_id, p); });

  // Dedup pages
  const pvMap = new Map();
  visitas.forEach(r => {
    const key = `${r.session_id}::${r.pagina_url}`;
    const ex = pvMap.get(key);
    if (!ex) {
      pvMap.set(key, { ...r, scroll_max: Number(r.scroll_max) || 0, tiempo_seg: Number(r.tiempo_seg) || 0 });
    } else {
      ex.scroll_max = Math.max(ex.scroll_max, Number(r.scroll_max) || 0);
      ex.tiempo_seg = Math.max(ex.tiempo_seg, Number(r.tiempo_seg) || 0);
    }
  });
  const dedup = [...pvMap.values()].filter(r => !r.pagina_url?.startsWith('__'));

  // Aggregate per visitor
  const vMap = new Map();
  dedup.forEach(r => {
    const vid = r.visitor_id;
    if (!vMap.has(vid)) {
      vMap.set(vid, {
        visitor_id:    vid,
        sesiones:      new Set(),
        dias:          new Set(),
        reportes:      new Set(),
        scroll_rep:    [],
        tiempo_total:  0,
        primera:       r.created_at,
        ultima:        r.created_at,
        ciudad:        r.ciudad,
        pais:          r.pais,
        fuente:        r.fuente,
        dispositivo:   r.dispositivo,
        isp:           r.isp,
        es_proxy:      r.es_proxy,
        navegador:     r.navegador,
      });
    }
    const v = vMap.get(vid);
    v.sesiones.add(r.session_id);
    const fecha = r.created_at?.slice(0, 10);
    if (fecha) v.dias.add(fecha);
    v.tiempo_total += Number(r.tiempo_seg) || 0;
    if (r.pagina_url?.startsWith('/reporte/')) {
      v.reportes.add(r.pagina_url);
      if (r.scroll_max > 0) v.scroll_rep.push(r.scroll_max);
    }
    if (r.created_at < v.primera) v.primera = r.created_at;
    if (r.created_at > v.ultima)  v.ultima  = r.created_at;
  });

  const visitantes = [...vMap.values()].map(v => {
    const reportes_leidos = v.reportes.size;
    const total_sesiones  = v.sesiones.size;
    const total_dias      = v.dias.size;
    const scroll_prom     = v.scroll_rep.length > 0
      ? Math.round(v.scroll_rep.reduce((a, b) => a + b, 0) / v.scroll_rep.length) : 0;
    const tiempo_min = v.tiempo_total / 60;

    const score = Math.min(reportes_leidos * 10, 30)
                + Math.min(Math.round(scroll_prom * 0.25), 25)
                + Math.min((total_dias - 1) * 10, 20)
                + Math.min(Math.round(tiempo_min), 15)
                + Math.min(total_sesiones * 2, 10);

    return {
      visitor_id:       v.visitor_id,
      score,
      reportes_leidos,
      total_sesiones,
      total_dias,
      scroll_promedio:  scroll_prom,
      tiempo_total_seg: v.tiempo_total,
      primera_visita:   v.primera,
      ultima_visita:    v.ultima,
      ciudad:           v.ciudad,
      pais:             v.pais,
      fuente:           v.fuente,
      dispositivo:      v.dispositivo,
      isp:              v.isp,
      es_proxy:         v.es_proxy,
      navegador:        v.navegador,
      es_prospecto:     prospectosMap.has(v.visitor_id),
      prospecto:        prospectosMap.get(v.visitor_id) || null,
    };
  });

  visitantes.sort((a, b) => b.score - a.score || b.ultima_visita.localeCompare(a.ultima_visita));

  res.json({ total: visitantes.length, visitantes: visitantes.slice(offset, offset + limit), periodo });
});

// ── Perfil individual de visitante ────────────────────────────────────────────
router.get('/visitantes/:visitorId', async (req, res) => {
  const { visitorId } = req.params;

  const [{ rows: visitas }, { rows: prospectos }] = await Promise.all([
    db.execute({
      sql: `SELECT visitor_id, session_id, pagina_url, pagina_titulo,
                   tiempo_seg, scroll_max, fuente, campana, dispositivo, sistema_os,
                   ciudad, estado, pais, isp, es_proxy, zona_horaria, navegador,
                   visita_recurrente, created_at
            FROM visitantes WHERE visitor_id = ? ORDER BY created_at ASC`,
      args: [visitorId],
    }),
    db.execute({
      sql: `SELECT id, nombre, telefono, correo, valor_portafolio, fuente, campana,
                   dispositivo, tiempo_total_seg, paginas_json, primera_visita_at, created_at
            FROM prospectos_gbm WHERE visitor_id = ?`,
      args: [visitorId],
    }),
  ]);

  if (visitas.length === 0) return res.status(404).json({ error: 'Visitante no encontrado' });

  // Dedup pages
  const pvMap = new Map();
  visitas.forEach(r => {
    const key = `${r.session_id}::${r.pagina_url}`;
    const ex = pvMap.get(key);
    if (!ex) {
      pvMap.set(key, { ...r, scroll_max: Number(r.scroll_max) || 0, tiempo_seg: Number(r.tiempo_seg) || 0 });
    } else {
      ex.scroll_max = Math.max(ex.scroll_max, Number(r.scroll_max) || 0);
      ex.tiempo_seg = Math.max(ex.tiempo_seg, Number(r.tiempo_seg) || 0);
    }
  });
  const dedup = [...pvMap.values()].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const dedupClean = dedup.filter(r => !r.pagina_url?.startsWith('__'));

  // Group by session
  const sMap = new Map();
  dedupClean.forEach(r => {
    if (!sMap.has(r.session_id)) {
      sMap.set(r.session_id, {
        session_id:  r.session_id,
        fecha:       r.created_at?.slice(0, 10),
        inicio:      r.created_at,
        fin:         r.created_at,
        fuente:      r.fuente,
        campana:     r.campana,
        dispositivo: r.dispositivo,
        paginas:     [],
      });
    }
    const s = sMap.get(r.session_id);
    s.paginas.push({ url: r.pagina_url, titulo: r.pagina_titulo, tiempo_seg: r.tiempo_seg, scroll_max: r.scroll_max, created_at: r.created_at });
    if (r.created_at > s.fin) s.fin = r.created_at;
  });

  const sesiones = [...sMap.values()].sort((a, b) => a.inicio.localeCompare(b.inicio));

  // Group sessions by day
  const diasMap = new Map();
  sesiones.forEach(s => {
    const f = s.fecha;
    if (!diasMap.has(f)) diasMap.set(f, []);
    diasMap.get(f).push(s);
  });
  const dias = [...diasMap.entries()].map(([fecha, sessDia]) => ({
    fecha,
    sesiones:    sessDia,
    visitas_dia: sessDia.reduce((acc, s) => acc + s.paginas.length, 0),
    tiempo_dia:  sessDia.reduce((acc, s) => acc + s.paginas.reduce((a, p) => a + p.tiempo_seg, 0), 0),
  }));

  // Reportes vistos
  const repMap = {};
  dedupClean.filter(r => r.pagina_url?.startsWith('/reporte/')).forEach(r => {
    const url = r.pagina_url;
    if (!repMap[url]) repMap[url] = { url, titulo: r.pagina_titulo, vistas: 0, scroll_max: 0, tiempo_total: 0 };
    repMap[url].vistas++;
    repMap[url].scroll_max   = Math.max(repMap[url].scroll_max, r.scroll_max);
    repMap[url].tiempo_total += r.tiempo_seg;
  });
  const reportes = Object.values(repMap).sort((a, b) => b.vistas - a.vistas);

  // Engagement score
  const reportes_leidos = reportes.length;
  const total_sesiones  = sesiones.length;
  const total_dias      = dias.length;
  const scroll_rep      = reportes.map(r => r.scroll_max).filter(s => s > 0);
  const scroll_prom     = scroll_rep.length > 0
    ? Math.round(scroll_rep.reduce((a, b) => a + b, 0) / scroll_rep.length) : 0;
  const tiempo_total    = dedupClean.reduce((acc, r) => acc + r.tiempo_seg, 0);
  const tiempo_min      = tiempo_total / 60;

  const s_reportes = Math.min(reportes_leidos * 10, 30);
  const s_scroll   = Math.min(Math.round(scroll_prom * 0.25), 25);
  const s_dias     = Math.min((total_dias - 1) * 10, 20);
  const s_tiempo   = Math.min(Math.round(tiempo_min), 15);
  const s_sesiones = Math.min(total_sesiones * 2, 10);
  const score      = s_reportes + s_scroll + s_dias + s_tiempo + s_sesiones;

  const primer = visitas[0];
  const ultimo = visitas[visitas.length - 1];

  res.json({
    visitor_id:      visitorId,
    score,
    score_detalle:   { reportes: s_reportes, scroll: s_scroll, dias: s_dias, tiempo: s_tiempo, sesiones: s_sesiones },
    primera_visita:  primer.created_at,
    ultima_visita:   ultimo.created_at,
    ciudad:          primer.ciudad,
    estado:          primer.estado,
    pais:            primer.pais,
    isp:             primer.isp,
    es_proxy:        primer.es_proxy,
    zona_horaria:    primer.zona_horaria,
    navegador:       primer.navegador,
    dispositivo:     primer.dispositivo,
    sistema_os:      primer.sistema_os,
    fuente:          primer.fuente,
    campana:         primer.campana,
    visita_recurrente: primer.visita_recurrente,
    total_sesiones,
    total_dias,
    tiempo_total_seg: tiempo_total,
    reportes_leidos,
    scroll_promedio:  scroll_prom,
    dias,
    reportes,
    prospectos: prospectos.map(p => ({ ...p, id: Number(p.id) })),
  });
});

export default router;

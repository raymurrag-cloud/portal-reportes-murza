// tracker.js — analytics silencioso de comportamiento
// Cada page view se registra en la BD via sendBeacon al desmontar el componente

const VISITOR_KEY      = 'mz_vid';      // UUID permanente por navegador
const SESSION_KEY      = 'mz_sid';      // UUID por pestaña/sesion (sessionStorage)
const META_KEY         = 'mz_smeta';    // metadata de sesion (fuente, dispositivo...)
const LAST_VISIT_KEY   = 'mz_lv';      // timestamp ultima visita
const FIRST_VISIT_KEY  = 'mz_fvt';     // timestamp primera visita ever
const SESSION_FORM_KEY = 'mz_session'; // para getTrackingData() del form (mantener)

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// ── UUID simple ───────────────────────────────────────────────────────────────
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

// ── Parsear User Agent ────────────────────────────────────────────────────────
function parseUA(ua) {
  let dispositivo = 'Desktop';
  if (/iPhone/i.test(ua))               dispositivo = 'iPhone';
  else if (/iPad/i.test(ua))            dispositivo = 'iPad';
  else if (/Android.*Mobile/i.test(ua)) dispositivo = 'Android Phone';
  else if (/Android/i.test(ua))         dispositivo = 'Android Tablet';

  let sistema = 'Desconocido';
  const ios     = ua.match(/OS (\d+[_\d]*) like Mac/);
  const android = ua.match(/Android (\d+[\.\d]*)/);
  const win     = ua.match(/Windows NT (\d+\.\d+)/);
  const mac     = ua.match(/Mac OS X (\d+[_\d]*)/);
  if (ios)          sistema = `iOS ${ios[1].replace(/_/g, '.')}`;
  else if (android) sistema = `Android ${android[1]}`;
  else if (win) {
    const m = { '10.0': '10/11', '6.3': '8.1', '6.2': '8', '6.1': '7' };
    sistema = `Windows ${m[win[1]] || win[1]}`;
  }
  else if (mac)     sistema = `macOS ${mac[1].replace(/_/g, '.')}`;

  let navegador = 'Desconocido';
  if (/CriOS/i.test(ua))           navegador = 'Chrome iOS';
  else if (/FxiOS/i.test(ua))      navegador = 'Firefox iOS';
  else if (/SamsungBrowser/i.test(ua)) navegador = 'Samsung Browser';
  else if (/OPR|Opera/i.test(ua))  navegador = 'Opera';
  else if (/Edg\//i.test(ua))      navegador = 'Edge';
  else if (/Chrome/i.test(ua))     navegador = 'Chrome';
  else if (/Safari/i.test(ua))     navegador = 'Safari';
  else if (/Firefox/i.test(ua))    navegador = 'Firefox';

  return { dispositivo, sistema, navegador };
}

// ── Parsear fuente de origen ──────────────────────────────────────────────────
function parseFuente() {
  const params   = new URLSearchParams(window.location.search);
  const referrer = document.referrer || '';

  let fuente = 'Directo';
  if (params.get('utm_source')) {
    fuente = params.get('utm_source');
  } else if (/instagram\.com|facebook\.com|fb\.com/i.test(referrer)) {
    fuente = 'Meta / Social';
  } else if (/google\./i.test(referrer)) {
    fuente = 'Google';
  } else if (/t\.co|twitter\.com|x\.com/i.test(referrer)) {
    fuente = 'Twitter/X';
  } else if (/whatsapp/i.test(referrer)) {
    fuente = 'WhatsApp';
  } else if (referrer) {
    try { fuente = new URL(referrer).hostname; } catch { fuente = referrer.slice(0, 60); }
  }

  return {
    fuente,
    campana: params.get('utm_campaign') || null,
    anuncio: params.get('utm_content') || params.get('utm_ad') || null,
  };
}

// ── IDs persistentes ──────────────────────────────────────────────────────────
function getVisitorId() {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) { id = uuid(); localStorage.setItem(VISITOR_KEY, id); }
  return id;
}

function getSessionId() {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) { id = uuid(); sessionStorage.setItem(SESSION_KEY, id); }
  return id;
}

// ── Metadata de sesion (se captura una vez por session) ───────────────────────
function getSessionMeta() {
  try {
    const raw = sessionStorage.getItem(META_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}

  // Primera pagina de esta sesion: capturar todo
  const ua = navigator.userAgent;
  const { dispositivo, sistema, navegador } = parseUA(ua);
  const { fuente, campana, anuncio } = parseFuente();
  const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
  const ahora = Date.now();
  const esRecurrente = !!lastVisit;
  const diasDesde = lastVisit ? Math.floor((ahora - parseInt(lastVisit)) / 86400000) : null;
  localStorage.setItem(LAST_VISIT_KEY, String(ahora));
  if (!localStorage.getItem(FIRST_VISIT_KEY)) localStorage.setItem(FIRST_VISIT_KEY, String(ahora));

  let zonaHoraria = null;
  try { zonaHoraria = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch {}

  const meta = { dispositivo, sistema, navegador, fuente, campana, anuncio, esRecurrente, diasDesde, zonaHoraria };
  try { sessionStorage.setItem(META_KEY, JSON.stringify(meta)); } catch {}
  return meta;
}

// ── Enviar beacon ─────────────────────────────────────────────────────────────
function sendBeacon(payload) {
  try {
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    navigator.sendBeacon(`${API_BASE}/track`, blob);
  } catch {}
}

// ── Enviar via fetch (para el ping de entrada — beacon no garantiza en load) ──
function sendPing(payload) {
  try {
    fetch(`${API_BASE}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

// ── initTracker — llamar en useEffect de cada pagina ─────────────────────────
// nombrePagina: string legible, ej. "Home", "Reporte NVDA"
// Devuelve cleanup() para el return del useEffect
export function initTracker(nombrePagina) {
  if (localStorage.getItem('portal_admin_token')) return () => {};

  const now        = Date.now();
  const paginaUrl  = window.location.pathname; // capturar AHORA — en cleanup ya es la nueva ruta
  const visitorId  = getVisitorId();
  const sessionId  = getSessionId();
  const meta       = getSessionMeta();
  let scrollMax    = 0;

  // Ping de entrada — registra la visita inmediatamente al cargar la pagina
  sendPing({
    visitor_id:        visitorId,
    session_id:        sessionId,
    pagina_url:        paginaUrl,
    pagina_titulo:     nombrePagina,
    tiempo_seg:        0,
    scroll_max:        0,
    fuente:            meta.fuente,
    campana:           meta.campana,
    dispositivo:       meta.dispositivo,
    sistema_os:        meta.sistema,
    navegador:         meta.navegador,
    zona_horaria:      meta.zonaHoraria,
    visita_recurrente: meta.esRecurrente ? 1 : 0,
  });

  // Tambien actualizar el mz_session (para getTrackingData del form)
  try {
    const SESSION_TIMEOUT = 30 * 60 * 1000;
    let s = {};
    try { s = JSON.parse(localStorage.getItem(SESSION_FORM_KEY) || '{}'); } catch {}
    const sesionActiva = s.inicio && (now - (s.ultima_actividad || 0) < SESSION_TIMEOUT);
    if (!sesionActiva) {
      s = {
        inicio: now, ultima_actividad: now,
        fuente: meta.fuente, campana: meta.campana, anuncio: meta.anuncio,
        dispositivo: meta.dispositivo, sistema: meta.sistema, navegador: meta.navegador,
        recurrente: meta.esRecurrente, dias_ultima_visita: meta.diasDesde, paginas: [],
      };
    }
    const idx = s.paginas.length;
    s.paginas.push({ url: window.location.pathname, titulo: nombrePagina, entrada: now, tiempo_seg: 0, scroll_max: 0 });
    s.ultima_actividad = now;
    localStorage.setItem(SESSION_FORM_KEY, JSON.stringify(s));

    // Scroll tracker para el form
    const onScrollForm = () => {
      const pct = Math.round(((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100);
      try {
        const fs = JSON.parse(localStorage.getItem(SESSION_FORM_KEY) || '{}');
        if (fs.paginas?.[idx]) {
          fs.paginas[idx].scroll_max = Math.max(fs.paginas[idx].scroll_max || 0, Math.min(pct, 100));
          fs.paginas[idx].tiempo_seg = Math.round((Date.now() - now) / 1000);
          fs.ultima_actividad = Date.now();
          localStorage.setItem(SESSION_FORM_KEY, JSON.stringify(fs));
        }
      } catch {}
    };
    window.addEventListener('scroll', onScrollForm, { passive: true });
    // Cleanup form scroll en return (guardado abajo junto con beacon cleanup)
  } catch {}

  // Tiempo hasta primer scroll
  let primerScrollSeg = null;
  const onPrimerScroll = () => {
    if (primerScrollSeg === null) primerScrollSeg = Math.round((Date.now() - now) / 1000);
  };
  window.addEventListener('scroll', onPrimerScroll, { once: true, passive: true });

  // Exit intent — solo desktop, solo una vez por sesion
  const exitIntentKey = `mz_exit_${sessionId}`;
  const onExitIntent = (e) => {
    if (e.clientY > 5) return; // solo si el mouse sale por arriba
    if (sessionStorage.getItem(exitIntentKey)) return; // ya se registro
    sessionStorage.setItem(exitIntentKey, '1');
    sendBeacon({
      visitor_id: visitorId, session_id: sessionId,
      pagina_url: '__exit_intent__', pagina_titulo: nombrePagina,
      tiempo_seg: Math.round((Date.now() - now) / 1000),
      scroll_max: scrollMax, fuente: meta.fuente, campana: meta.campana,
      dispositivo: meta.dispositivo, sistema_os: meta.sistema,
      navegador: meta.navegador, zona_horaria: meta.zonaHoraria,
      visita_recurrente: meta.esRecurrente ? 1 : 0,
    });
  };
  if (!/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
    document.addEventListener('mouseleave', onExitIntent);
  }

  // Scroll tracker para beacon
  const onScroll = () => {
    const pct = Math.round(((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100);
    scrollMax = Math.max(scrollMax, Math.min(pct, 100));
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  // Enviar en beforeunload (cierre de tab/navegador)
  const onUnload = () => {
    sendBeacon({
      visitor_id:           visitorId,
      session_id:           sessionId,
      pagina_url:           paginaUrl,   // URL capturada al inicio (correcta)
      pagina_titulo:        nombrePagina,
      tiempo_seg:           Math.round((Date.now() - now) / 1000),
      scroll_max:           scrollMax,
      fuente:               meta.fuente,
      campana:              meta.campana,
      dispositivo:          meta.dispositivo,
      sistema_os:           meta.sistema,
      navegador:            meta.navegador,
      zona_horaria:         meta.zonaHoraria,
      tiempo_primer_scroll: primerScrollSeg,
      visita_recurrente:    meta.esRecurrente ? 1 : 0,
    });
  };
  window.addEventListener('beforeunload', onUnload);

  // Cleanup: se llama en React al desmontar (navegacion SPA) y en beforeunload
  return () => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('beforeunload', onUnload);
    document.removeEventListener('mouseleave', onExitIntent);

    // Actualizar form session
    try {
      const fs = JSON.parse(localStorage.getItem(SESSION_FORM_KEY) || '{}');
      if (fs.paginas?.length > 0) {
        const last = fs.paginas[fs.paginas.length - 1];
        last.tiempo_seg = Math.round((Date.now() - now) / 1000);
        localStorage.setItem(SESSION_FORM_KEY, JSON.stringify(fs));
      }
    } catch {}

    // sendPing (fetch + keepalive) — más confiable que sendBeacon para navegación SPA.
    // sendBeacon con Blob application/json no siempre es parseado por Express.
    sendPing({
      visitor_id:           visitorId,
      session_id:           sessionId,
      pagina_url:           paginaUrl,   // URL capturada al inicio (correcta)
      pagina_titulo:        nombrePagina,
      tiempo_seg:           Math.round((Date.now() - now) / 1000),
      scroll_max:           scrollMax,
      fuente:               meta.fuente,
      campana:              meta.campana,
      dispositivo:          meta.dispositivo,
      sistema_os:           meta.sistema,
      navegador:            meta.navegador,
      zona_horaria:         meta.zonaHoraria,
      tiempo_primer_scroll: primerScrollSeg,
      visita_recurrente:    meta.esRecurrente ? 1 : 0,
    });
  };
}

// ── getVisitorSession — para búsquedas fallidas y otros eventos públicos ──────
export function getVisitorSession() {
  return {
    visitor_id: localStorage.getItem(VISITOR_KEY) || null,
    session_id: sessionStorage.getItem(SESSION_KEY) || null,
  };
}

// ── getTrackingData — para enviar con el formulario de prospecto ──────────────
export function getTrackingData() {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_FORM_KEY) || 'null');
    if (!s) return {};
    if (s.paginas?.length > 0) {
      const last = s.paginas[s.paginas.length - 1];
      last.tiempo_seg = Math.round((Date.now() - last.entrada) / 1000);
    }
    return {
      fuente:             s.fuente || 'Directo',
      campana:            s.campana || null,
      anuncio:            s.anuncio || null,
      dispositivo:        s.dispositivo || null,
      sistema_os:         s.sistema || null,
      navegador:          s.navegador || null,
      visita_recurrente:  s.recurrente ? 1 : 0,
      dias_ultima_visita: s.dias_ultima_visita ?? null,
      tiempo_total_seg:   Math.round((Date.now() - s.inicio) / 1000),
      paginas_json:       JSON.stringify(s.paginas || []),
      visitor_id:         localStorage.getItem(VISITOR_KEY) || null,
      primera_visita_at:  localStorage.getItem(FIRST_VISIT_KEY) || null,
    };
  } catch {
    return {};
  }
}

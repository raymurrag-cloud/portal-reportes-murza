// tracker.js — captura silenciosa de comportamiento del visitante
// Almacena sesion en localStorage y la envia al registrarse

const SESSION_KEY  = 'mz_session';
const LAST_VISIT_KEY = 'mz_last_visit';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 min sin actividad = nueva sesion

// ── Parsear User Agent ────────────────────────────────────────────────────────
function parseUA(ua) {
  let dispositivo = 'Desktop';
  if (/iPhone/i.test(ua))              dispositivo = 'iPhone';
  else if (/iPad/i.test(ua))           dispositivo = 'iPad';
  else if (/Android.*Mobile/i.test(ua)) dispositivo = 'Android Phone';
  else if (/Android/i.test(ua))        dispositivo = 'Android Tablet';

  let sistema = 'Desconocido';
  const ios     = ua.match(/OS (\d+[_\d]*) like Mac/);
  const android = ua.match(/Android (\d+[\.\d]*)/);
  const win     = ua.match(/Windows NT (\d+\.\d+)/);
  const mac     = ua.match(/Mac OS X (\d+[_\d]*)/);
  if (ios)     sistema = `iOS ${ios[1].replace(/_/g, '.')}`;
  else if (android) sistema = `Android ${android[1]}`;
  else if (win) {
    const map = { '10.0': '10/11', '6.3': '8.1', '6.2': '8', '6.1': '7' };
    sistema = `Windows ${map[win[1]] || win[1]}`;
  }
  else if (mac) sistema = `macOS ${mac[1].replace(/_/g, '.')}`;

  let navegador = 'Desconocido';
  if (/CriOS/i.test(ua))          navegador = 'Chrome iOS';
  else if (/FxiOS/i.test(ua))     navegador = 'Firefox iOS';
  else if (/SamsungBrowser/i.test(ua)) navegador = 'Samsung Browser';
  else if (/OPR|Opera/i.test(ua)) navegador = 'Opera';
  else if (/Edg\//i.test(ua))     navegador = 'Edge';
  else if (/Chrome/i.test(ua))    navegador = 'Chrome';
  else if (/Safari/i.test(ua))    navegador = 'Safari';
  else if (/Firefox/i.test(ua))   navegador = 'Firefox';

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
    try { fuente = new URL(referrer).hostname; } catch { fuente = referrer; }
  }

  return {
    fuente,
    campana: params.get('utm_campaign') || null,
    anuncio: params.get('utm_content') || params.get('utm_ad') || null,
    referrer_raw: referrer || null,
  };
}

// ── Leer / guardar sesion ─────────────────────────────────────────────────────
function leerSesion() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
}
function guardarSesion(s) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch {}
}

// ── initTracker — llamar en cada pagina al montar ─────────────────────────────
// nombrePagina: string legible, ej. "Home", "Reporte NVDA"
// Devuelve cleanup() para llamar en el useEffect return
export function initTracker(nombrePagina) {
  const now = Date.now();
  const ua  = navigator.userAgent;

  // Visita recurrente
  const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
  const esRecurrente = !!lastVisit;
  const diasDesde = lastVisit ? Math.floor((now - parseInt(lastVisit)) / 86400000) : null;
  localStorage.setItem(LAST_VISIT_KEY, String(now));

  // Sesion activa o nueva
  let session = leerSesion();
  const sesionActiva = session && (now - (session.ultima_actividad || 0) < SESSION_TIMEOUT);

  if (!sesionActiva) {
    const f = parseFuente();
    const d = parseUA(ua);
    session = {
      inicio: now,
      ultima_actividad: now,
      fuente: f.fuente,
      campana: f.campana,
      anuncio: f.anuncio,
      referrer: f.referrer_raw,
      dispositivo: d.dispositivo,
      sistema: d.sistema,
      navegador: d.navegador,
      recurrente: esRecurrente,
      dias_ultima_visita: diasDesde,
      paginas: [],
    };
  }

  // Registrar entrada a esta pagina
  const idx = session.paginas.length;
  session.paginas.push({
    url:       window.location.pathname,
    titulo:    nombrePagina,
    entrada:   now,
    tiempo_seg: 0,
    scroll_max: 0,
  });
  session.ultima_actividad = now;
  guardarSesion(session);

  // Trackear scroll en tiempo real
  const onScroll = () => {
    const pct = Math.round(((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100);
    const s = leerSesion();
    if (s?.paginas?.[idx]) {
      s.paginas[idx].scroll_max  = Math.max(s.paginas[idx].scroll_max || 0, Math.min(pct, 100));
      s.paginas[idx].tiempo_seg  = Math.round((Date.now() - now) / 1000);
      s.ultima_actividad = Date.now();
      guardarSesion(s);
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  // Actualizar tiempo al desmontar
  return () => {
    window.removeEventListener('scroll', onScroll);
    const s = leerSesion();
    if (s?.paginas?.[idx]) {
      s.paginas[idx].tiempo_seg = Math.round((Date.now() - now) / 1000);
      guardarSesion(s);
    }
  };
}

// ── getTrackingData — llamar al enviar el formulario ─────────────────────────
export function getTrackingData() {
  try {
    const s = leerSesion();
    if (!s) return {};
    // Actualizar tiempo de la ultima pagina antes de enviar
    if (s.paginas?.length > 0) {
      const last = s.paginas[s.paginas.length - 1];
      last.tiempo_seg = Math.round((Date.now() - last.entrada) / 1000);
    }
    return {
      fuente:              s.fuente || 'Directo',
      campana:             s.campana || null,
      anuncio:             s.anuncio || null,
      dispositivo:         s.dispositivo || null,
      sistema_os:          s.sistema || null,
      navegador:           s.navegador || null,
      visita_recurrente:   s.recurrente ? 1 : 0,
      dias_ultima_visita:  s.dias_ultima_visita ?? null,
      tiempo_total_seg:    Math.round((Date.now() - s.inicio) / 1000),
      paginas_json:        JSON.stringify(s.paginas || []),
    };
  } catch {
    return {};
  }
}

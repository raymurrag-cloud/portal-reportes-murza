import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { api } from '../../api.js';
import { EARNINGS_DATA, getMesNumero, MESES } from './earningsData.js';
import { initTracker } from '../../utils/tracker.js';

// ─────────────────────────────────────────────────────────────────────────────
// Hook: actualiza cada segundo para los countdowns
// ─────────────────────────────────────────────────────────────────────────────
function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function getCountdown(fechaStr, now) {
  const target = new Date(fechaStr);
  const diff = target - now;
  if (diff <= 0) return null;
  const days  = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins  = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs  = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, mins, secs, diff };
}

function formatFecha(fechaStr) {
  const d = new Date(fechaStr);
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatHora(fechaStr) {
  const d = new Date(fechaStr);
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
}

function isToday(fechaStr, now) {
  const d = new Date(fechaStr);
  return d.toDateString() === now.toDateString();
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componente: Countdown display
// ─────────────────────────────────────────────────────────────────────────────
function CountdownBlock({ countdown }) {
  const pad = (n) => String(n).padStart(2, '0');
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
      {[
        { val: countdown.days,  label: 'd' },
        { val: countdown.hours, label: 'h' },
        { val: countdown.mins,  label: 'm' },
        { val: countdown.secs,  label: 's' },
      ].map(({ val, label }) => (
        <div key={label} style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: "'Georgia', serif",
            fontSize: label === 'd' ? 28 : 22,
            fontWeight: 700,
            color: 'var(--gold)',
            lineHeight: 1,
            minWidth: label === 'd' ? 36 : 30,
          }}>
            {label === 'd' ? val : pad(val)}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em', marginTop: 2 }}>
            {label.toUpperCase()}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componente: Badge de EPS Surprise
// ─────────────────────────────────────────────────────────────────────────────
function SurpriseBadge({ pct }) {
  const positive = pct > 0;
  const color = positive ? '#16A34A' : '#DC2626';
  const bg    = positive ? 'rgba(22,163,74,0.10)' : 'rgba(220,38,38,0.10)';
  const border = positive ? 'rgba(22,163,74,0.25)' : 'rgba(220,38,38,0.25)';
  return (
    <span style={{
      background: bg, border: `1px solid ${border}`, color,
      borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 700,
    }}>
      {positive ? '+' : ''}{pct.toFixed(1)}% vs est.
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componente: Tarjeta de empresa
// ─────────────────────────────────────────────────────────────────────────────
function EarningsCard({ ticker, empresa, earnings, reporteSlug, now, expanded, onToggle }) {
  const countdown     = earnings ? getCountdown(earnings.fecha, now) : null;
  const yaReporto     = earnings ? (countdown === null) : false;
  const esHoy         = earnings ? isToday(earnings.fecha, now) : false;
  const countdownNext = yaReporto && earnings?.fecha_siguiente
    ? getCountdown(earnings.fecha_siguiente, now)
    : null;

  // Formatear EPS estimate
  const epsStr = earnings?.eps_estimate != null
    ? `$${earnings.eps_estimate.toFixed(2)}`
    : '—';
  const revStr = earnings?.revenue_estimate_b != null
    ? `$${earnings.revenue_estimate_b.toFixed(1)}B`
    : '—';
  const fwdPeStr = earnings?.forward_pe != null
    ? `${earnings.forward_pe.toFixed(1)}x`
    : '—';

  return (
    <div style={{
      background: 'var(--surface-pure)',
      border: `1px solid ${esHoy ? 'var(--gold)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      boxShadow: esHoy ? '0 0 0 2px rgba(181,135,42,0.25), var(--shadow)' : 'var(--shadow-sm)',
      transition: 'box-shadow 0.15s',
    }}>

      {/* ── Header de la tarjeta ── */}
      <div style={{ padding: '20px 24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>

          {/* Empresa */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              <span style={{
                fontFamily: "'Georgia', serif",
                fontSize: 18, fontWeight: 700,
                background: 'var(--gold-pale)',
                border: '1px solid var(--border-warm)',
                borderRadius: 6, padding: '1px 8px',
                color: 'var(--gold-dark)',
                letterSpacing: '0.04em',
              }}>
                {ticker}
              </span>
              {esHoy && (
                <span style={{
                  background: 'var(--gold)', color: '#fff',
                  borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700,
                  letterSpacing: '0.08em', animation: 'none',
                }}>
                  REPORTA HOY
                </span>
              )}
              {yaReporto && !esHoy && (
                <span style={{
                  background: 'rgba(120,110,100,0.08)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                  borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600,
                }}>
                  YA REPORTO
                </span>
              )}
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
              {empresa}
            </div>
            {earnings && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {countdownNext && earnings.trimestre_siguiente
                  ? earnings.trimestre_siguiente
                  : earnings.trimestre}
                {!earnings.fecha_confirmada && (
                  <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--amber)', fontStyle: 'italic' }}>
                    (fecha estimada)
                  </span>
                )}
              </div>
            )}
            {!earnings && (
              <div style={{ fontSize: 12, color: 'var(--text-faint)', fontStyle: 'italic' }}>
                Fecha por confirmar
              </div>
            )}
          </div>

          {/* Countdown o Ya reporto */}
          <div style={{ flexShrink: 0, textAlign: 'right' }}>
            {/* Próxima a reportar: countdown normal */}
            {earnings && countdown && (
              <CountdownBlock countdown={countdown} />
            )}
            {/* Ya reportó con siguiente fecha: countdown al próximo + último reporte abajo */}
            {earnings && yaReporto && countdownNext && (
              <div style={{ textAlign: 'right' }}>
                <CountdownBlock countdown={countdownNext} />
                {earnings.trimestre_siguiente && (
                  <div style={{ fontSize: 10, color: 'var(--gold-dark)', fontWeight: 600, marginTop: 3 }}>
                    {earnings.trimestre_siguiente}
                    {!earnings.fecha_confirmada && (
                      <span style={{ fontStyle: 'italic', fontWeight: 400, color: 'var(--text-faint)', marginLeft: 4 }}>(est.)</span>
                    )}
                  </div>
                )}
                <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 4, borderTop: '1px solid var(--border)', paddingTop: 4 }}>
                  Ultimo reporte el {formatFecha(earnings.fecha)}
                </div>
              </div>
            )}
            {/* Ya reportó sin siguiente fecha: mostrar fecha del último reporte */}
            {earnings && yaReporto && !countdownNext && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 1 }}>Reportado el</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                  {formatFecha(earnings.fecha)}
                </div>
              </div>
            )}
            {!earnings && (
              <span style={{
                background: 'rgba(120,110,100,0.06)',
                border: '1px solid var(--border)',
                color: 'var(--text-faint)',
                borderRadius: 8, padding: '6px 12px', fontSize: 12,
              }}>
                Sin datos
              </span>
            )}
          </div>
        </div>

        {/* Fecha y hora */}
        {earnings && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 12, color: 'var(--text-muted)',
            background: 'var(--bg-alt)', borderRadius: 6, padding: '5px 10px',
            marginBottom: 14, width: 'fit-content',
          }}>
            <span>📅</span>
            {/* Si hay countdown al siguiente, mostrar fecha_siguiente; si no, la fecha actual */}
            <span>{countdownNext ? formatFecha(earnings.fecha_siguiente) : formatFecha(earnings.fecha)}</span>
            <span style={{ color: 'var(--border-warm)' }}>·</span>
            <span>{countdownNext ? formatHora(earnings.fecha_siguiente) : formatHora(earnings.fecha)}</span>
            <span style={{ color: 'var(--border-warm)' }}>·</span>
            <span>{earnings.cuando}</span>
          </div>
        )}

        {/* Estimados del consenso */}
        {earnings && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <EstimadoPill label="EPS Est." value={epsStr} />
            <EstimadoPill label="Rev. Est." value={revStr} />
            <EstimadoPill label="Forward P/E" value={fwdPeStr} />
            {earnings.last_surprise_pct != null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Sorpresa anterior</span>
                <SurpriseBadge pct={earnings.last_surprise_pct} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Footer: acciones y expandible ── */}
      <div style={{
        borderTop: '1px solid var(--border)',
        padding: '10px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        background: 'var(--bg)',
      }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {reporteSlug && (
            <Link
              to={`/reporte/${reporteSlug}`}
              style={{
                fontSize: 13, fontWeight: 600,
                color: 'var(--gold-dark)',
                border: '1px solid rgba(181,135,42,0.3)',
                borderRadius: 7, padding: '5px 12px',
                background: 'rgba(181,135,42,0.06)',
                textDecoration: 'none',
              }}
            >
              Ver reporte completo →
            </Link>
          )}
        </div>
        {earnings?.what_to_watch?.length > 0 && (
          <button
            onClick={onToggle}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, color: 'var(--text-muted)', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '5px 8px', borderRadius: 7,
              transition: 'color 0.15s, background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--gold-dark)'; e.currentTarget.style.background = 'rgba(181,135,42,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}
          >
            {expanded ? 'Ocultar' : 'What to Watch'}
            <span style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>▾</span>
          </button>
        )}
      </div>

      {/* ── What to Watch expandible ── */}
      {expanded && earnings?.what_to_watch?.length > 0 && (
        <div style={{
          padding: '16px 24px 20px',
          borderTop: '1px solid var(--border)',
          background: 'var(--surface)',
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
            color: 'var(--gold-dark)', marginBottom: 10, textTransform: 'uppercase',
          }}>
            What to Watch — Catalizadores y Riesgos
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {earnings.what_to_watch.map((item, i) => (
              <li key={i} style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                fontSize: 13, color: 'var(--text-warm)', lineHeight: 1.55,
              }}>
                <span style={{
                  flexShrink: 0, width: 20, height: 20, borderRadius: '50%',
                  background: 'var(--gold-pale)', border: '1px solid var(--border-warm)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: 'var(--gold-dark)', marginTop: 1,
                }}>
                  {i + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function EstimadoPill({ label, value }) {
  return (
    <div style={{
      background: 'var(--bg-alt)',
      border: '1px solid var(--border)',
      borderRadius: 7, padding: '4px 10px',
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
    }}>
      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, lineHeight: 1 }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', fontFamily: "'Georgia', serif" }}>{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Página principal: EarningsCalendar
// ─────────────────────────────────────────────────────────────────────────────
export default function EarningsCalendar() {
  const [reportes, setReportes]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [earningsMap, setEarningsMap] = useState(EARNINGS_DATA); // inicia con estático, se actualiza desde API
  const [mesFiltro, setMesFiltro]     = useState(null);   // null = todos
  const [diasFiltro, setDiasFiltro]   = useState(null);   // null | 7 | 14 | 30
  const [expanded, setExpanded]       = useState(new Set());
  const now = useNow();

  useEffect(() => initTracker('Earnings'), []);

  useEffect(() => {
    api.getReportes()
      .then(setReportes)
      .finally(() => setLoading(false));
  }, []);

  // Cargar fechas dinámicas desde Turso vía API (sobrescribe el estático si hay datos)
  useEffect(() => {
    api.getEarnings()
      .then(rows => {
        if (!rows?.length) return;
        const map = { ...EARNINGS_DATA };
        rows.forEach(e => { map[e.ticker.toUpperCase()] = e; });
        setEarningsMap(map);
      })
      .catch(() => { /* mantiene EARNINGS_DATA como fallback */ });
  }, []);

  // ── Construir lista enriquecida ───────────────────────────────────────────
  const empresas = reportes.map(r => ({
    ticker:      r.ticker,
    empresa:     r.empresa,
    slug:        r.slug,
    earnings:    earningsMap[r.ticker.toUpperCase()] || null,
  }));

  // ── Meses disponibles para el filtro ─────────────────────────────────────
  const mesesDisponibles = [...new Set(
    empresas
      .filter(e => e.earnings?.fecha)
      .map(e => getMesNumero(e.earnings.fecha))
  )].sort((a, b) => a - b);

  // ── Filtrar por mes o por días recientes ─────────────────────────────────
  const filtradas = diasFiltro !== null
    ? empresas.filter(e => {
        if (!e.earnings?.fecha) return false;
        const fechaReporte = new Date(e.earnings.fecha);
        if (fechaReporte > now) return false;
        const diffDias = (now - fechaReporte) / (1000 * 60 * 60 * 24);
        return diffDias <= diasFiltro;
      })
    : mesFiltro === null
      ? empresas
      : empresas.filter(e => {
          if (!e.earnings?.fecha) return false;
          return getMesNumero(e.earnings.fecha) === mesFiltro;
        });

  // ── Ordenar ──────────────────────────────────────────────────────────────
  // tipo 0: próximas a reportar (countdown a fecha)
  // tipo 1: ya reportaron con fecha_siguiente futura (countdown al próximo)
  // tipo 2: ya reportaron sin fecha_siguiente (ordenadas por recencia, más reciente primero)
  // tipo 3: sin datos
  const getSortKey = (e) => {
    if (!e.earnings) return { tipo: 3, val: 0 };
    const cd = getCountdown(e.earnings.fecha, now);
    if (cd !== null) return { tipo: 0, val: cd.diff };
    if (e.earnings.fecha_siguiente) {
      const cdNext = getCountdown(e.earnings.fecha_siguiente, now);
      if (cdNext !== null) return { tipo: 1, val: cdNext.diff };
    }
    return { tipo: 2, val: -new Date(e.earnings.fecha).getTime() };
  };
  const ordenadas = [...filtradas].sort((a, b) => {
    const kA = getSortKey(a);
    const kB = getSortKey(b);
    if (kA.tipo !== kB.tipo) return kA.tipo - kB.tipo;
    return kA.val - kB.val;
  });

  // ── Toggle expandible ─────────────────────────────────────────────────────
  const toggleExpanded = (ticker) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(ticker) ? next.delete(ticker) : next.add(ticker);
      return next;
    });
  };

  // ── Contadores resumen ────────────────────────────────────────────────────
  const totalProximas = empresas.filter(e => {
    if (!e.earnings) return false;
    if (getCountdown(e.earnings.fecha, now) !== null) return true; // aún no reporta
    if (e.earnings.fecha_siguiente && getCountdown(e.earnings.fecha_siguiente, now) !== null) return true; // ya reportó, próximo confirmado
    return false;
  }).length;
  const totalReportaron = empresas.filter(e => {
    if (!e.earnings) return false;
    const yaReporto = getCountdown(e.earnings.fecha, now) === null;
    if (!yaReporto) return false;
    // Solo cuentan como "ya reportaron" las que no tienen siguiente fecha futura
    if (e.earnings.fecha_siguiente && getCountdown(e.earnings.fecha_siguiente, now) !== null) return false;
    return true;
  }).length;

  return (
    <>
      <Helmet>
        <title>Calendario de Earnings | Murza Inversiones</title>
        <meta name="description" content="Fechas de earnings, estimados de EPS y revenue, y analisis previo al reporte de las principales empresas del mercado." />
        <meta property="og:title" content="Calendario de Earnings | Murza Inversiones" />
        <meta property="og:description" content="Proximas fechas de resultados trimestrales, estimados de EPS y revenue, sorpresa historica y puntos clave a vigilar por empresa." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://reportes.murzainversiones.com/earnings" />
        <meta property="og:image" content="https://reportes.murzainversiones.com/murza-logo.png" />
        <meta property="og:site_name" content="Murza Inversiones" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Calendario de Earnings | Murza Inversiones" />
        <meta name="twitter:description" content="Proximas fechas de resultados trimestrales, estimados y puntos clave por empresa." />
        <meta name="twitter:image" content="https://reportes.murzainversiones.com/murza-logo.png" />
        <link rel="canonical" href="https://reportes.murzainversiones.com/earnings" />
      </Helmet>

      <div className="portal-page">

        {/* ── Header ── */}
        <header className="portal-header">
          <Link to="/" className="portal-logo-link">
            <img src="/murza-logo.png" alt="Murza Inversiones" className="portal-logo" />
          </Link>
          <nav style={{ display: 'flex', gap: 2 }}>
            <Link
              to="/"
              style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 14,
                color: 'var(--text-muted)', fontWeight: 500,
                textDecoration: 'none', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--gold-pale)'; e.currentTarget.style.color = 'var(--gold-dark)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              Reportes
            </Link>
            <Link
              to="/earnings"
              style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 14,
                color: 'var(--gold-dark)', fontWeight: 600,
                background: 'var(--gold-pale)',
                textDecoration: 'none',
              }}
            >
              Earnings
            </Link>
            <Link
              to="/noticias"
              style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 14,
                color: 'var(--text-muted)', fontWeight: 500,
                textDecoration: 'none', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--gold-pale)'; e.currentTarget.style.color = 'var(--gold-dark)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              Noticias
            </Link>
            <Link
              to="/comparar"
              style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 14,
                color: 'var(--text-muted)', fontWeight: 500,
                textDecoration: 'none', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--gold-pale)'; e.currentTarget.style.color = 'var(--gold-dark)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              Comparar
            </Link>
            <Link
              to="/blog"
              style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 14,
                color: 'var(--text-muted)', fontWeight: 500,
                textDecoration: 'none', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--gold-pale)'; e.currentTarget.style.color = 'var(--gold-dark)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              Blog
            </Link>
          </nav>
          <div className="portal-header-right">
            <Link to="/login" className="btn-ghost-sm">Iniciar sesion</Link>
            <Link to="/registro" className="btn-primary-sm">Registro gratis</Link>
          </div>
        </header>

        {/* ── Hero ── */}
        <section style={{ padding: '40px 48px 32px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
          <div style={{ marginBottom: 6 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
              color: 'var(--gold-dark)', textTransform: 'uppercase',
            }}>
              Temporada de Resultados
            </span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>
            Calendario de Earnings
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-muted)', maxWidth: 580, lineHeight: 1.6 }}>
            Fechas de reporte, estimados de consenso y catalizadores clave para las empresas analizadas en el portal.
          </p>

          {/* Resumen rápido */}
          {!loading && (
            <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
              <ResumenPill
                valor={totalProximas}
                label="Proximas a reportar"
                color="var(--gold)"
                bg="rgba(181,135,42,0.08)"
                border="rgba(181,135,42,0.25)"
              />
              <ResumenPill
                valor={totalReportaron}
                label="Ya reportaron"
                color="var(--text-muted)"
                bg="rgba(120,110,100,0.06)"
                border="var(--border)"
              />
              <ResumenPill
                valor={empresas.length}
                label="Empresas en el portal"
                color="var(--green)"
                bg="rgba(22,163,74,0.07)"
                border="rgba(22,163,74,0.2)"
              />
            </div>
          )}
        </section>

        {/* ── Filtros ── */}
        <section style={{ padding: '0 48px 24px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
          {/* Fila 1: por mes */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
            <FiltroTab
              label="Todos"
              activo={mesFiltro === null && diasFiltro === null}
              onClick={() => { setMesFiltro(null); setDiasFiltro(null); }}
            />
            {mesesDisponibles.map(mes => (
              <FiltroTab
                key={mes}
                label={MESES[mes] || `Mes ${mes}`}
                activo={mesFiltro === mes && diasFiltro === null}
                onClick={() => { setMesFiltro(mes); setDiasFiltro(null); }}
              />
            ))}
          </div>
          {/* Fila 2: reportes recientes */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', letterSpacing: '0.06em', textTransform: 'uppercase', marginRight: 2 }}>
              Reportaron en:
            </span>
            {[7, 14, 30].map(dias => (
              <FiltroTab
                key={dias}
                label={`Ultimos ${dias} dias`}
                activo={diasFiltro === dias}
                onClick={() => {
                  setDiasFiltro(diasFiltro === dias ? null : dias);
                  setMesFiltro(null);
                }}
                color="blue"
              />
            ))}
          </div>
        </section>

        {/* ── Grid de tarjetas ── */}
        <section style={{ padding: '0 48px 60px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
          {loading && (
            <div className="loading-state">Cargando empresas...</div>
          )}

          {!loading && ordenadas.length === 0 && (
            <div className="empty-state">
              {diasFiltro
                ? `Ninguna empresa reporto en los ultimos ${diasFiltro} dias.`
                : mesFiltro
                  ? `No hay reportes en ${MESES[mesFiltro]} para las empresas del portal.`
                  : 'No hay empresas en el portal aun.'}
            </div>
          )}

          {!loading && ordenadas.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))',
              gap: 16,
            }}>
              {ordenadas.map(({ ticker, empresa, slug, earnings }) => (
                <EarningsCard
                  key={ticker}
                  ticker={ticker}
                  empresa={empresa}
                  earnings={earnings}
                  reporteSlug={slug}
                  now={now}
                  expanded={expanded.has(ticker)}
                  onToggle={() => toggleExpanded(ticker)}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Nota al pie ── */}
        <div style={{ textAlign: 'center', padding: '0 48px 20px', color: 'var(--text-faint)', fontSize: 12 }}>
          Los estimados de EPS y revenue son consenso de analistas de mercado. Las fechas marcadas como "estimada" son aproximadas hasta confirmacion oficial.
        </div>

        <footer className="portal-footer">
          <p>© {new Date().getFullYear()} Murza Inversiones</p>
        </footer>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Micro-componentes internos
// ─────────────────────────────────────────────────────────────────────────────
function FiltroTab({ label, activo, onClick, color = 'gold' }) {
  const isBlue = color === 'blue';
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 14px',
        borderRadius: 8,
        border: activo
          ? (isBlue ? '1px solid rgba(59,130,246,0.45)' : '1px solid rgba(181,135,42,0.5)')
          : '1px solid var(--border)',
        background: activo
          ? (isBlue ? 'rgba(59,130,246,0.09)' : 'var(--gold-pale)')
          : 'var(--surface-pure)',
        color: activo
          ? (isBlue ? '#3B82F6' : 'var(--gold-dark)')
          : 'var(--text-muted)',
        fontWeight: activo ? 700 : 500,
        fontSize: 13,
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );
}

function ResumenPill({ valor, label, color, bg, border }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: bg, border: `1px solid ${border}`,
      borderRadius: 8, padding: '6px 14px',
    }}>
      <span style={{ fontFamily: "'Georgia', serif", fontSize: 20, fontWeight: 700, color, lineHeight: 1 }}>
        {valor}
      </span>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
        {label}
      </span>
    </div>
  );
}

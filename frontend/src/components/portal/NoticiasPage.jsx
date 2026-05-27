import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { api } from '../../api.js';
import { initTracker } from '../../utils/tracker.js';

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatFecha(fechaStr) {
  const d = new Date(fechaStr + 'T12:00:00');
  return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatFechaCorta(fechaStr) {
  const d = new Date(fechaStr + 'T12:00:00');
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

function esHoy(fechaStr) {
  const hoy  = new Date().toISOString().slice(0, 10);
  return fechaStr.slice(0, 10) === hoy;
}

function esAyer(fechaStr) {
  const ayer = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  return fechaStr.slice(0, 10) === ayer;
}

function etiquetaFecha(fechaStr) {
  if (esHoy(fechaStr))  return 'Hoy';
  if (esAyer(fechaStr)) return 'Ayer';
  return formatFecha(fechaStr);
}

const COLOR_IMPACTO = {
  positivo: { dot: '#16A34A', bg: 'rgba(22,163,74,0.10)', border: 'rgba(22,163,74,0.25)', label: 'Positivo' },
  negativo: { dot: '#DC2626', bg: 'rgba(220,38,38,0.10)', border: 'rgba(220,38,38,0.25)', label: 'Negativo' },
  neutral:  { dot: '#A08040', bg: 'rgba(160,128,64,0.10)', border: 'rgba(160,128,64,0.20)', label: 'Neutral'  },
};

// ── Componente: Badge de impacto ──────────────────────────────────────────────
function ImpactoBadge({ impacto }) {
  const c = COLOR_IMPACTO[impacto] || COLOR_IMPACTO.neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '2px 8px', borderRadius: 20,
      background: c.bg, border: `1px solid ${c.border}`,
      fontSize: 11, fontWeight: 700, color: c.dot, letterSpacing: '0.03em',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
      {c.label}
    </span>
  );
}

// ── Componente: Tarjeta de noticia ────────────────────────────────────────────
function NoticiaCard({ noticia }) {
  return (
    <div style={{
      background: 'var(--card-bg)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '16px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      transition: 'border-color 0.15s',
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold-dim)'}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      {/* Fila superior: ticker + impacto */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <Link
          to={`/reporte/${noticia.ticker}`}
          style={{
            fontSize: 11, fontWeight: 800, letterSpacing: '0.06em',
            color: 'var(--gold)', background: 'rgba(160,128,64,0.12)',
            border: '1px solid rgba(160,128,64,0.25)', borderRadius: 6,
            padding: '2px 8px', textDecoration: 'none',
          }}
        >
          {noticia.ticker}
        </Link>
        <ImpactoBadge impacto={noticia.impacto} />
      </div>

      {/* Título */}
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', lineHeight: 1.4 }}>
        {noticia.titulo}
      </div>

      {/* Resumen */}
      <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
        {noticia.resumen}
      </div>

      {/* Fuentes — solo cita, nunca link externo */}
      {noticia.fuente && (
        <div style={{ fontSize: 11, color: 'var(--text-faint)', fontStyle: 'italic', marginTop: 2 }}>
          Fuente: {noticia.fuente}
        </div>
      )}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
const NAV_LINK = { padding: '6px 14px', borderRadius: 8, fontSize: 14, color: 'var(--text-muted)', fontWeight: 500, textDecoration: 'none' };

export default function NoticiasPage() {
  const [noticias, setNoticias] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [filtro,   setFiltro]   = useState('');        // ticker o texto libre
  const [impactoF, setImpactoF] = useState('todos');   // todos | positivo | negativo | neutral
  const [dias,     setDias]     = useState(7);

  useEffect(() => {
    initTracker?.({ pagina: 'noticias' });
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.getNoticias({ dias })
      .then(setNoticias)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [dias]);

  // Filtrado client-side
  const filtradas = useMemo(() => {
    let list = noticias;
    if (impactoF !== 'todos') list = list.filter(n => n.impacto === impactoF);
    if (filtro.trim()) {
      const q = filtro.trim().toUpperCase();
      list = list.filter(n =>
        n.ticker.toUpperCase().includes(q) ||
        n.titulo.toUpperCase().includes(q)  ||
        (n.resumen || '').toUpperCase().includes(q)
      );
    }
    return list;
  }, [noticias, filtro, impactoF]);

  // Agrupar por fecha
  const porFecha = useMemo(() => {
    const grupos = {};
    for (const n of filtradas) {
      const dia = (n.fecha_noticia || '').slice(0, 10);
      if (!grupos[dia]) grupos[dia] = [];
      grupos[dia].push(n);
    }
    return Object.entries(grupos).sort(([a], [b]) => b.localeCompare(a));
  }, [filtradas]);

  // Conteos para filtros de impacto
  const conteos = useMemo(() => {
    const c = { positivo: 0, negativo: 0, neutral: 0 };
    for (const n of noticias) c[n.impacto] = (c[n.impacto] || 0) + 1;
    return c;
  }, [noticias]);

  return (
    <div className="portal-root">
      <Helmet>
        <title>Noticias del Mercado | Murza Inversiones</title>
        <meta name="description" content="Noticias e impactos recientes de las empresas del portafolio Murza Inversiones — actualizado diariamente." />
      </Helmet>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="portal-header">
        <Link to="/" className="portal-logo-link">
          <img src="/murza-logo.png" alt="Murza Inversiones" className="portal-logo" />
        </Link>
        <nav style={{ display: 'flex', gap: 2 }}>
          <Link to="/" style={NAV_LINK}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--gold-pale)'; e.currentTarget.style.color = 'var(--gold-dark)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
            Reportes
          </Link>
          <Link to="/earnings" style={NAV_LINK}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--gold-pale)'; e.currentTarget.style.color = 'var(--gold-dark)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
            Earnings
          </Link>
          <Link to="/noticias" style={{ ...NAV_LINK, color: 'var(--gold)', fontWeight: 700 }}>
            Noticias
          </Link>
          <Link to="/blog" style={NAV_LINK}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--gold-pale)'; e.currentTarget.style.color = 'var(--gold-dark)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
            Blog
          </Link>
        </nav>
        <div className="portal-header-right">
          <Link to="/login" className="btn-ghost-sm">Iniciar sesion</Link>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px 0' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 10 }}>
            Mercado en tiempo real
          </div>
          <h1 style={{ fontFamily: "'Georgia', serif", fontSize: 32, fontWeight: 700, color: 'var(--text)', margin: 0, marginBottom: 8, lineHeight: 1.2 }}>
            Noticias del Portafolio
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-muted)', margin: 0 }}>
            Impactos relevantes de las empresas del portal — actualizado diariamente por el analista.
          </p>
        </div>

        {/* ── Filtros ────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28, alignItems: 'center' }}>
          {/* Buscador */}
          <input
            type="text"
            placeholder="Buscar ticker o palabra clave…"
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
            style={{
              flex: '1 1 200px', minWidth: 180, maxWidth: 280,
              padding: '8px 14px', borderRadius: 8,
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              color: 'var(--text)', fontSize: 14, outline: 'none',
            }}
          />

          {/* Filtro impacto */}
          {['todos', 'positivo', 'negativo', 'neutral'].map(op => {
            const activo = impactoF === op;
            const c = op !== 'todos' ? COLOR_IMPACTO[op] : null;
            return (
              <button key={op} onClick={() => setImpactoF(op)} style={{
                padding: '6px 14px', borderRadius: 20,
                border: activo ? `1px solid ${c ? c.dot : 'var(--gold)'}` : '1px solid var(--border)',
                background: activo ? (c ? c.bg : 'rgba(160,128,64,0.10)') : 'var(--card-bg)',
                color: activo ? (c ? c.dot : 'var(--gold)') : 'var(--text-muted)',
                fontSize: 12, fontWeight: activo ? 700 : 500, cursor: 'pointer',
                textTransform: 'capitalize',
              }}>
                {op === 'todos' ? `Todos (${noticias.length})` : `${op} (${conteos[op] || 0})`}
              </button>
            );
          })}

          {/* Ventana de tiempo */}
          <select value={dias} onChange={e => setDias(Number(e.target.value))} style={{
            padding: '6px 12px', borderRadius: 8,
            background: 'var(--card-bg)', border: '1px solid var(--border)',
            color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer',
          }}>
            <option value={3}>Últimos 3 días</option>
            <option value={7}>Últimos 7 días</option>
            <option value={14}>Últimas 2 semanas</option>
            <option value={30}>Último mes</option>
          </select>
        </div>

        {/* ── Contenido ─────────────────────────────────────────────────── */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
            Cargando noticias…
          </div>
        )}

        {error && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#DC2626' }}>
            Error al cargar: {error}
          </div>
        )}

        {!loading && !error && porFecha.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '80px 24px',
            color: 'var(--text-muted)', fontSize: 15,
            border: '1px dashed var(--border)', borderRadius: 12,
          }}>
            {noticias.length === 0
              ? 'Aún no hay noticias cargadas. El analista actualiza diariamente.'
              : 'Sin resultados para los filtros seleccionados.'}
          </div>
        )}

        {!loading && porFecha.map(([fecha, items]) => (
          <div key={fecha} style={{ marginBottom: 40 }}>
            {/* Encabezado de fecha */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
            }}>
              <div style={{
                fontFamily: "'Georgia', serif", fontSize: 13, fontWeight: 700,
                color: esHoy(fecha) ? 'var(--gold)' : 'var(--text-muted)',
                textTransform: 'capitalize', letterSpacing: '0.02em',
              }}>
                {etiquetaFecha(fecha)}
              </div>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <div style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 600 }}>
                {items.length} {items.length === 1 ? 'noticia' : 'noticias'}
              </div>
            </div>

            {/* Grid de tarjetas */}
            <div style={{ display: 'grid', gap: 12 }}>
              {items.map(n => <NoticiaCard key={n.id} noticia={n} />)}
            </div>
          </div>
        ))}

        <div style={{ height: 80 }} />
      </div>
    </div>
  );
}

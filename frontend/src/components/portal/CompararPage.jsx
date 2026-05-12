import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { api } from '../../api.js';

/* ── Paleta ─────────────────────────────────────────────────────────────── */
const GREEN = '#16A34A';
const RED   = '#DC2626';
const AMBER = '#B5722A';

const sigColor = s => s === 'green' ? GREEN : s === 'red' ? RED : s === 'yellow' ? AMBER : '#9A8E82';
const sigBg    = s =>
  s === 'green'  ? 'rgba(22,163,74,.10)'  :
  s === 'red'    ? 'rgba(220,38,38,.10)'  :
  s === 'yellow' ? 'rgba(181,114,42,.10)' : 'rgba(168,153,138,.10)';

/* ── Helpers de extraccion de datos ─────────────────────────────────────── */
function getKpi(kpis, fragment) {
  return kpis?.find(k => k.label.toLowerCase().includes(fragment.toLowerCase()));
}

function getLastVal(rows, idx) {
  const row = rows?.[idx];
  if (!row) return 'N/D';
  return row[row.length - 2] ?? 'N/D';
}

function getYoY(rows, idx) {
  const row = rows?.[idx];
  if (!row) return null;
  return row[row.length - 1] ?? null;
}

function getLastPeriod(headers) {
  return headers?.[headers.length - 2] ?? '';
}

function getLastMargenBruto(cm) {
  const last = cm?.data?.[cm.data.length - 1];
  return last?.bruto != null ? `${last.bruto}%` : 'N/D';
}

/* ── NavLink ─────────────────────────────────────────────────────────────── */
function NavLink({ to, active, children }) {
  const [hover, setHover] = useState(false);
  return (
    <Link
      to={to}
      style={{
        padding: '6px 14px', borderRadius: 8, fontSize: 14,
        color: active || hover ? 'var(--gold-dark)' : 'var(--text-muted)',
        fontWeight: active ? 600 : 500,
        background: active || hover ? 'var(--gold-pale)' : 'none',
        textDecoration: 'none', transition: 'all 0.15s',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
    </Link>
  );
}

/* ── MetricRow — fila de metrica con valor + variacion ───────────────────── */
function MetricRow({ label, value, yoy, signal }) {
  const col = signal ? sigColor(signal) : null;
  const yoyPositive = yoy && (yoy.startsWith('+'));
  const yoyNegative = yoy && (yoy.startsWith('-') || (yoy.includes('pp') && yoy.startsWith('-')));
  const yoyCol = yoyPositive ? GREEN : yoyNegative ? RED : AMBER;

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: '9px 0', borderBottom: '1px solid var(--border)',
      gap: 8,
    }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1, lineHeight: 1.3 }}>{label}</span>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: col || 'var(--text)', lineHeight: 1.2 }}>{value}</div>
        {yoy && (
          <div style={{ fontSize: 11, color: yoyCol, fontWeight: 600, marginTop: 1 }}>{yoy}</div>
        )}
      </div>
    </div>
  );
}

/* ── FlagMini — version compacta de una flag ─────────────────────────────── */
function FlagMini({ flag }) {
  const icon = { green: '●', yellow: '●', red: '●' };
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 8,
      padding: '8px 10px', borderRadius: 8,
      background: sigBg(flag.level),
      marginBottom: 6,
    }}>
      <span style={{ color: sigColor(flag.level), fontSize: 9, marginTop: 3, flexShrink: 0 }}>
        {icon[flag.level] || '●'}
      </span>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', lineHeight: 1.35 }}>{flag.title}</div>
        {flag.impact && (
          <div style={{ fontSize: 10, color: sigColor(flag.level), fontWeight: 600, marginTop: 2 }}>
            Impacto: {flag.impact}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── ScoreBarMini ────────────────────────────────────────────────────────── */
function ScoreBarMini({ score, max = 10 }) {
  const pct = (score / max) * 100;
  const col = pct >= 80 ? GREEN : pct >= 60 ? AMBER : RED;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
      <div style={{
        flex: 1, height: 5, background: 'var(--border)', borderRadius: 999, overflow: 'hidden',
      }}>
        <div style={{ width: `${pct}%`, height: '100%', background: col, borderRadius: 999 }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: col, width: 28, textAlign: 'right' }}>
        {score}/{max}
      </span>
    </div>
  );
}

/* ── SectionTitle ────────────────────────────────────────────────────────── */
function SectionTitle({ label }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 800, letterSpacing: '0.13em',
      textTransform: 'uppercase', color: 'var(--gold-dark)',
      padding: '20px 0 12px',
      borderBottom: '2px solid var(--gold-pale)',
      marginBottom: 12,
    }}>
      {label}
    </div>
  );
}

/* ── CompanyCard — columna completa de una empresa ───────────────────────── */
function CompanyCard({ reporte, json, section, tabActivo, nEmp }) {
  if (!json) return null;

  const verde = verdictColor(json.verdict?.color);
  const kpis  = json.kpis || [];
  const tabla = json.tabla || {};
  const rows  = tabla.rows || [];
  const hdrs  = tabla.headers || [];

  if (section === 'header') {
    return (
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderTop: `3px solid ${verde}`,
        borderRadius: 12,
        padding: '20px',
      }}>
        <a
          href={`/reporte/${reporte.slug || reporte.ticker}`}
          style={{ textDecoration: 'none' }}
          target="_blank" rel="noreferrer"
        >
          <div style={{
            fontSize: 28, fontWeight: 800, color: 'var(--gold-dark)',
            letterSpacing: '-0.5px', lineHeight: 1,
          }}>
            {reporte.ticker}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500, marginTop: 4, marginBottom: 14 }}>
            {reporte.empresa}
          </div>
        </a>
        {json.verdict && (
          <>
            <div style={{
              display: 'inline-flex', alignItems: 'center',
              background: sigBg(json.verdict.color),
              color: verde,
              border: `1px solid ${verde}33`,
              borderRadius: 20, padding: '4px 12px',
              fontSize: 11, fontWeight: 700, letterSpacing: '0.03em',
              marginBottom: 12, lineHeight: 1.3,
            }}>
              {json.verdict.status}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: verde, lineHeight: 1 }}>
                {json.verdict.score}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Quality Score</div>
            </div>
          </>
        )}
      </div>
    );
  }

  if (section === 'descripcion') {
    const desc = json.descripcion || json.resumen || '';
    return (
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '14px 16px',
        fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6,
      }}>
        {desc.length > 220 ? desc.slice(0, 220) + '...' : desc}
      </div>
    );
  }

  if (section === 'financieros') {
    const periodo = getLastPeriod(hdrs);
    return (
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '12px 14px',
      }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 4 }}>
          PERIODO: {periodo}
        </div>
        <MetricRow label="Revenue" value={getLastVal(rows, 0)} yoy={getYoY(rows, 0)} />
        <MetricRow label="Margen Bruto" value={getLastMargenBruto(json.chart_margenes)} />
        <MetricRow label="Margen Neto" value={getLastVal(rows, 2)} yoy={getYoY(rows, 2)} />
        <MetricRow label="EBITDA" value={getLastVal(rows, 3)} yoy={getYoY(rows, 3)} />
        <MetricRow label="FCF" value={getLastVal(rows, 4)} yoy={getYoY(rows, 4)} />
        <MetricRow label="EPS Diluido" value={getLastVal(rows, 5)} yoy={getYoY(rows, 5)} />
        <MetricRow label="Deuda Neta" value={getLastVal(rows, 6)} />
      </div>
    );
  }

  if (section === 'valuacion') {
    const forward  = getKpi(kpis, 'forward');
    const pfcf     = getKpi(kpis, 'p/fcf');
    const evebitda = getKpi(kpis, 'ev/ebitda');
    const deuda    = getKpi(kpis, 'deuda');
    const roe      = getKpi(kpis, 'roe');
    const roic     = getKpi(kpis, 'roic');
    const trailing = getKpi(kpis, 'trailing');

    const KpiLine = ({ kpi, label }) => {
      if (!kpi) return null;
      return (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '8px 0', borderBottom: '1px solid var(--border)',
        }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label || kpi.label}</span>
          <div style={{ textAlign: 'right' }}>
            <span style={{
              fontSize: 15, fontWeight: 800, color: sigColor(kpi.signal),
            }}>{kpi.value}</span>
          </div>
        </div>
      );
    };

    return (
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '12px 14px',
      }}>
        <KpiLine kpi={forward}  label="P/E Forward" />
        <KpiLine kpi={trailing} label="P/E Trailing" />
        <KpiLine kpi={pfcf}     label="P/FCF" />
        <KpiLine kpi={evebitda} label="EV/EBITDA" />
        <KpiLine kpi={deuda}    label="Deuda/EBITDA" />
        <KpiLine kpi={roe}      label="ROE" />
        <KpiLine kpi={roic}     label="ROIC" />
      </div>
    );
  }

  if (section === 'score') {
    if (!json.score) return null;
    const { score, max, items } = json.score;
    const pct = (score / max) * 100;
    const col = pct >= 80 ? GREEN : pct >= 60 ? AMBER : RED;
    return (
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '14px 16px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Score General</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: col }}>{score}<span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)' }}>/{max}</span></span>
        </div>
        <div style={{ height: 6, background: 'var(--border)', borderRadius: 999, marginBottom: 14, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: col, borderRadius: 999 }} />
        </div>
        {items?.map((it, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>{it.label}</div>
            <ScoreBarMini score={it.score} max={it.max} />
          </div>
        ))}
      </div>
    );
  }

  if (section === 'fortalezas') {
    const greens = (json.flags || []).filter(f => f.level === 'green');
    if (!greens.length) return <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0' }}>Sin fortalezas registradas.</div>;
    return (
      <div>
        {greens.map((f, i) => <FlagMini key={i} flag={f} />)}
      </div>
    );
  }

  if (section === 'riesgos') {
    const reds    = (json.flags || []).filter(f => f.level === 'red');
    const yellows = (json.flags || []).filter(f => f.level === 'yellow');
    if (!reds.length && !yellows.length) return (
      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0' }}>Sin riesgos registrados.</div>
    );
    return (
      <div>
        {reds.map((f, i)    => <FlagMini key={`r${i}`} flag={f} />)}
        {yellows.map((f, i) => <FlagMini key={`y${i}`} flag={f} />)}
      </div>
    );
  }

  if (section === 'tesis') {
    const bullets = json.verdict?.bullets || [];
    if (!bullets.length) return null;
    return (
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '14px 16px',
      }}>
        {bullets.map((b, i) => {
          const tipo = b.type || 'neutral';
          const col2 = tipo === 'pro' ? GREEN : tipo === 'con' ? RED : AMBER;
          const parts = b.text.split(/\*\*(.*?)\*\*/);
          return (
            <div key={i} style={{
              display: 'flex', gap: 8, paddingBottom: 10,
              borderBottom: i < bullets.length - 1 ? '1px solid var(--border)' : 'none',
              marginBottom: i < bullets.length - 1 ? 10 : 0,
            }}>
              <span style={{ color: col2, fontSize: 10, marginTop: 3, flexShrink: 0 }}>◆</span>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {parts.map((p, j) => j % 2 === 1 ? <strong key={j} style={{ color: 'var(--text)' }}>{p}</strong> : p)}
              </p>
            </div>
          );
        })}
      </div>
    );
  }

  return null;
}

function verdictColor(c) {
  return c === 'green' ? GREEN : c === 'red' ? RED : AMBER;
}

/* ── Selector de empresa con búsqueda ───────────────────────────────────── */
function TickerSelect({ value, onChange, opciones, label, excludes }) {
  const [query, setQuery]   = useState('');
  const [open, setOpen]     = useState(false);
  const [focused, setFocused] = useState(false);
  const wrapRef = useRef(null);

  const seleccionada = opciones.find(o => o.ticker === value);

  const disponibles = opciones.filter(o => {
    if (excludes.includes(o.ticker) && o.ticker !== value) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return o.ticker.toLowerCase().includes(q) || o.empresa.toLowerCase().includes(q);
  });

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handler = e => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const seleccionar = (ticker) => {
    onChange(ticker);
    setOpen(false);
    setQuery('');
  };

  const limpiar = (e) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
    setOpen(false);
  };

  const borderColor = focused ? 'var(--gold-dark)' : 'var(--border)';

  return (
    <div ref={wrapRef} style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, position: 'relative' }}>
      <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
        {label}
      </label>

      {/* Input / chip de seleccionada */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'var(--surface)',
          border: `1px solid ${borderColor}`,
          borderRadius: 8, padding: '7px 10px',
          cursor: 'text', transition: 'border-color 0.15s',
          minHeight: 38,
        }}
        onClick={() => { setOpen(true); }}
      >
        {seleccionada && !open ? (
          <>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold-dark)', flexShrink: 0 }}>
              {seleccionada.ticker}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {seleccionada.empresa}
            </span>
            <button
              onClick={limpiar}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', fontSize: 16, lineHeight: 1,
                padding: '0 2px', flexShrink: 0, fontFamily: 'inherit',
              }}
              title="Quitar empresa"
            >
              ×
            </button>
          </>
        ) : (
          <input
            autoFocus={open}
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => { setFocused(true); setOpen(true); }}
            onBlur={() => setFocused(false)}
            placeholder={seleccionada ? seleccionada.ticker : 'Busca ticker o empresa...'}
            style={{
              border: 'none', outline: 'none', background: 'transparent',
              fontSize: 13, color: 'var(--text)', fontFamily: 'inherit',
              flex: 1, minWidth: 0,
            }}
          />
        )}
      </div>

      {/* Dropdown de resultados */}
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          boxShadow: '0 8px 24px rgba(28,20,16,.15)',
          maxHeight: 260, overflowY: 'auto',
          marginTop: 4,
        }}>
          {disponibles.length === 0 ? (
            <div style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-muted)' }}>
              Sin resultados para "{query}"
            </div>
          ) : (
            disponibles.map(o => {
              const estaSeleccionada = o.ticker === value;
              return (
                <div
                  key={o.ticker}
                  onMouseDown={e => { e.preventDefault(); seleccionar(o.ticker); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 14px', cursor: 'pointer',
                    background: estaSeleccionada ? 'var(--gold-pale)' : 'transparent',
                    borderBottom: '1px solid var(--border)',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (!estaSeleccionada) e.currentTarget.style.background = 'rgba(181,135,42,.06)'; }}
                  onMouseLeave={e => { if (!estaSeleccionada) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold-dark)', width: 52, flexShrink: 0 }}>
                    {o.ticker}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {o.empresa}
                  </span>
                  {estaSeleccionada && (
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--gold-dark)', flexShrink: 0 }}>✓</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

/* ── Pagina principal ────────────────────────────────────────────────────── */
const MAX_EMPRESAS = 3;

export default function CompararPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [todosReportes, setTodosReportes] = useState([]);
  const [seleccionados, setSeleccionados] = useState(['', '', '']);
  const [datos, setDatos] = useState([null, null, null]);
  const [loading, setLoading] = useState([false, false, false]);
  const [tabMobile, setTabMobile] = useState(0);
  const userToken = localStorage.getItem('portal_user_token');

  // Cargar lista de tickers disponibles
  useEffect(() => {
    api.getReportes().then(list => {
      const filtered = (Array.isArray(list) ? list : []).filter(r => r.tipo !== 'etf');
      setTodosReportes(filtered);
    }).catch(() => {});
  }, []);

  // Leer tickers de la URL al cargar
  useEffect(() => {
    const t = searchParams.get('t');
    if (t) {
      const tickers = t.split(',').slice(0, MAX_EMPRESAS).map(s => s.trim().toUpperCase());
      const nuevos = ['', '', ''];
      tickers.forEach((tk, i) => { nuevos[i] = tk; });
      setSeleccionados(nuevos);
    }
  }, []);

  // Actualizar URL cuando cambian los seleccionados
  useEffect(() => {
    const activos = seleccionados.filter(Boolean);
    if (activos.length > 0) {
      setSearchParams({ t: activos.join(',') }, { replace: true });
    }
  }, [seleccionados]);

  // Cargar datos de cada empresa seleccionada
  useEffect(() => {
    const token = localStorage.getItem('portal_user_token');
    seleccionados.forEach(async (ticker, i) => {
      if (!ticker) {
        setDatos(prev => { const n = [...prev]; n[i] = null; return n; });
        return;
      }
      setLoading(prev => { const n = [...prev]; n[i] = true; return n; });
      try {
        // slug va en mayúsculas tal como está en la BD (QCOM, MU, SNDK)
        const r = token
          ? await api.getReporteCompleto(ticker)
          : await api.getReporte(ticker);
        const jsonData = r.contenido_json
          ? (typeof r.contenido_json === 'string' ? JSON.parse(r.contenido_json) : r.contenido_json)
          : null;
        setDatos(prev => { const n = [...prev]; n[i] = { reporte: r, json: jsonData }; return n; });
      } catch {
        setDatos(prev => { const n = [...prev]; n[i] = null; return n; });
      } finally {
        setLoading(prev => { const n = [...prev]; n[i] = false; return n; });
      }
    });
  }, [seleccionados.join(',')]);

  const cambiarSeleccion = (idx, ticker) => {
    setSeleccionados(prev => {
      const n = [...prev];
      n[idx] = ticker;
      return n;
    });
    if (idx === 0) setTabMobile(0);
    else if (idx === 1) setTabMobile(0);
  };

  const activos = seleccionados.map((tk, i) => ({ ticker: tk, idx: i, data: datos[i], loading: loading[i] }))
    .filter(e => e.ticker);

  const nColumnas = activos.length || 1;

  /* ── Secciones del comparador ── */
  const SECCIONES = [
    { key: 'financieros', label: 'Financieros Clave' },
    { key: 'valuacion',   label: 'Valuacion y Multiples' },
    { key: 'score',       label: 'Quality Score' },
    { key: 'fortalezas',  label: 'Fortalezas' },
    { key: 'riesgos',     label: 'Riesgos y Cautelas' },
    { key: 'tesis',       label: 'Tesis de Inversion' },
  ];

  const empresasActivas = activos.filter(e => e.data);

  return (
    <>
      <Helmet>
        <title>Comparar Empresas | Murza Inversiones</title>
        <meta name="description" content="Compara empresas lado a lado: financieros, valuacion, fortalezas y riesgos." />
      </Helmet>

      <div className="portal-page">

        {/* ── Header ── */}
        <header className="portal-header">
          <Link to="/" className="portal-logo-link">
            <img src="/murza-logo.png" alt="Murza Inversiones" className="portal-logo" />
          </Link>
          <nav style={{ display: 'flex', gap: 2 }}>
            <NavLink to="/">Reportes</NavLink>
            <NavLink to="/earnings">Earnings</NavLink>
            <NavLink to="/comparar" active>Comparar</NavLink>
          </nav>
          <div className="portal-header-right">
            {userToken
              ? <button className="btn-ghost-sm" onClick={() => { localStorage.removeItem('portal_user_token'); window.location.reload(); }}>Cerrar sesion</button>
              : <>
                  <Link to="/login" className="btn-ghost-sm">Iniciar sesion</Link>
                  <Link to="/registro" className="btn-primary-sm">Registro gratis</Link>
                </>
            }
          </div>
        </header>

        {/* ── Hero ── */}
        <section style={{ padding: '36px 48px 24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
          <div style={{ marginBottom: 6 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
              color: 'var(--gold-dark)', textTransform: 'uppercase',
            }}>
              Herramienta de Analisis
            </span>
          </div>
          <h1 style={{
            fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 800,
            color: 'var(--text)', letterSpacing: '-0.5px',
            margin: '0 0 8px',
          }}>
            Comparador de Empresas
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0, maxWidth: 520 }}>
            Selecciona hasta 3 empresas para comparar sus financieros, valuacion, fortalezas y riesgos lado a lado.
          </p>
        </section>

        {/* ── Selectores ── */}
        <section style={{ padding: '0 48px 28px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: '20px 24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
          }}>
            {[0, 1, 2].map(i => (
              <TickerSelect
                key={i}
                label={`Empresa ${i + 1}${i === 0 ? ' (obligatoria)' : ' (opcional)'}`}
                value={seleccionados[i]}
                onChange={ticker => cambiarSeleccion(i, ticker)}
                opciones={todosReportes}
                excludes={seleccionados.filter((_, j) => j !== i)}
              />
            ))}
          </div>

          {activos.length > 0 && (
            <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', alignSelf: 'center' }}>Comparte esta comparacion:</span>
              <button
                onClick={() => { navigator.clipboard?.writeText(window.location.href); }}
                style={{
                  fontSize: 11, padding: '4px 12px', borderRadius: 6,
                  background: 'var(--gold-pale)', color: 'var(--gold-dark)',
                  border: '1px solid var(--gold-pale)', cursor: 'pointer', fontFamily: 'inherit',
                  fontWeight: 600,
                }}
              >
                Copiar enlace
              </button>
            </div>
          )}
        </section>

        {/* ── Estado vacío ── */}
        {activos.length === 0 && (
          <section style={{ padding: '40px 48px', maxWidth: 1200, margin: '0 auto', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚖</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
              Selecciona al menos 2 empresas para comparar
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Usa los selectores de arriba para elegir las empresas que quieres analizar lado a lado.
            </div>
          </section>
        )}

        {/* ── Cuerpo de comparacion ── */}
        {activos.length > 0 && (
          <section style={{ padding: '0 48px 60px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>

            {/* ── Tabs mobile ── */}
            {empresasActivas.length > 1 && (
              <div style={{
                display: 'none',
                '@media (maxWidth: 640px)': { display: 'flex' },
              }} className="comparar-tabs-mobile">
                {empresasActivas.map((e, i) => (
                  <button
                    key={e.ticker}
                    onClick={() => setTabMobile(i)}
                    style={{
                      flex: 1, padding: '10px 8px', fontSize: 13, fontWeight: tabMobile === i ? 700 : 500,
                      background: tabMobile === i ? 'var(--gold-pale)' : 'var(--surface)',
                      color: tabMobile === i ? 'var(--gold-dark)' : 'var(--text-muted)',
                      border: '1px solid var(--border)',
                      borderBottom: tabMobile === i ? '2px solid var(--gold-dark)' : '1px solid var(--border)',
                      cursor: 'pointer', fontFamily: 'inherit',
                      borderRadius: i === 0 ? '8px 0 0 0' : i === empresasActivas.length - 1 ? '0 8px 0 0' : 0,
                    }}
                  >
                    {e.ticker}
                  </button>
                ))}
              </div>
            )}

            {/* ── Headers de empresa ── */}
            {empresasActivas.some(e => e.data) && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${empresasActivas.filter(e => e.data).length}, 1fr)`,
                gap: 12,
                marginBottom: 4,
              }}>
                {empresasActivas.map(e => {
                  if (!e.data) return null;
                  return (
                    <CompanyCard
                      key={e.ticker}
                      reporte={e.data.reporte}
                      json={e.data.json}
                      section="header"
                      nEmp={nColumnas}
                    />
                  );
                })}
              </div>
            )}

            {/* Descripcion */}
            {empresasActivas.some(e => e.data?.json?.descripcion) && (
              <>
                <SectionTitle label="Descripcion del Negocio" />
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${empresasActivas.filter(e => e.data).length}, 1fr)`,
                  gap: 12, marginBottom: 4,
                }}>
                  {empresasActivas.map(e => {
                    if (!e.data) return null;
                    return (
                      <CompanyCard key={e.ticker} reporte={e.data.reporte} json={e.data.json} section="descripcion" />
                    );
                  })}
                </div>
              </>
            )}

            {/* Secciones genericas */}
            {SECCIONES.map(sec => {
              const tieneData = empresasActivas.some(e => e.data?.json);
              if (!tieneData) return null;
              return (
                <div key={sec.key}>
                  <SectionTitle label={sec.label} />
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${empresasActivas.filter(e => e.data).length}, 1fr)`,
                    gap: 12, marginBottom: 4,
                  }}>
                    {empresasActivas.map(e => {
                      if (!e.data) return null;
                      if (loading[e.idx]) return (
                        <div key={e.ticker} style={{
                          background: 'var(--surface)', border: '1px solid var(--border)',
                          borderRadius: 10, padding: '20px 16px',
                          color: 'var(--text-muted)', fontSize: 12,
                        }}>
                          Cargando...
                        </div>
                      );
                      return (
                        <CompanyCard
                          key={e.ticker}
                          reporte={e.data.reporte}
                          json={e.data.json}
                          section={sec.key}
                          nEmp={empresasActivas.length}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Loading inicial */}
            {activos.some(e => e.loading && !e.data) && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                Cargando datos...
              </div>
            )}

            {/* CTA ver reportes completos */}
            {empresasActivas.length > 0 && (
              <div style={{
                marginTop: 32, background: 'var(--gold-pale)',
                border: '1px solid var(--border)', borderRadius: 12,
                padding: '18px 24px', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
                    Ver analisis completo por empresa
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Cada reporte incluye graficas, analisis cualitativo, capital allocation y conclusion detallada.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {empresasActivas.map(e => (
                    <Link
                      key={e.ticker}
                      to={`/reporte/${(e.data?.reporte?.slug || e.ticker).toLowerCase()}`}
                      style={{
                        padding: '8px 16px', borderRadius: 8,
                        background: 'var(--surface)', border: '1px solid var(--border)',
                        color: 'var(--gold-dark)', fontWeight: 700, fontSize: 13,
                        textDecoration: 'none',
                      }}
                    >
                      {e.ticker} →
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── Footer ── */}
        <footer style={{
          padding: '24px 48px', borderTop: '1px solid var(--border)',
          textAlign: 'center', fontSize: 12, color: 'var(--text-muted)',
        }}>
          Murza Inversiones — Analisis financiero profesional basado en filings oficiales (10-K / 10-Q)
        </footer>

      </div>

      <style>{`
        @media (max-width: 640px) {
          .comparar-tabs-mobile { display: flex !important; margin-bottom: 12px; }
        }
      `}</style>
    </>
  );
}

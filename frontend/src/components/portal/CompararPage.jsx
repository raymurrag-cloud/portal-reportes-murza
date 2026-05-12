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

/* ── Etiqueta de empresa dentro de cada card ─────────────────────────────── */
function TickerLabel({ reporte }) {
  const col = '#B5872A';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      paddingBottom: 9, marginBottom: 9,
      borderBottom: '1px solid var(--border)',
    }}>
      <span style={{
        fontSize: 11, fontWeight: 800, color: col,
        background: 'rgba(181,135,42,.10)', borderRadius: 5,
        padding: '2px 7px', letterSpacing: '0.05em',
      }}>
        {reporte?.ticker}
      </span>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {reporte?.empresa}
      </span>
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
        <TickerLabel reporte={reporte} />
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
        <TickerLabel reporte={reporte} />
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 4 }}>
          PERIODO: {periodo}
        </div>
        <MetricRow label={rows[0]?.[0] || 'Revenue'} value={getLastVal(rows, 0)} yoy={getYoY(rows, 0)} />
        <MetricRow label="Margen Bruto (%)" value={getLastMargenBruto(json.chart_margenes)} />
        <MetricRow label={rows[2]?.[0] || 'Margen Neto'} value={getLastVal(rows, 2)} yoy={getYoY(rows, 2)} />
        <MetricRow label={rows[3]?.[0] || 'EBITDA'} value={getLastVal(rows, 3)} yoy={getYoY(rows, 3)} />
        <MetricRow label={rows[4]?.[0] || 'FCF'} value={getLastVal(rows, 4)} yoy={getYoY(rows, 4)} />
        <MetricRow label={rows[5]?.[0] || 'EPS Diluido'} value={getLastVal(rows, 5)} yoy={getYoY(rows, 5)} />
        <MetricRow label={rows[6]?.[0] || 'Deuda Neta'} value={getLastVal(rows, 6)} />
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
        <TickerLabel reporte={reporte} />
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
        <TickerLabel reporte={reporte} />
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
    return (
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
        <TickerLabel reporte={reporte} />
        {greens.length === 0
          ? <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin fortalezas registradas.</div>
          : greens.map((f, i) => <FlagMini key={i} flag={f} />)
        }
      </div>
    );
  }

  if (section === 'riesgos') {
    const reds    = (json.flags || []).filter(f => f.level === 'red');
    const yellows = (json.flags || []).filter(f => f.level === 'yellow');
    return (
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
        <TickerLabel reporte={reporte} />
        {reds.length === 0 && yellows.length === 0
          ? <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin riesgos registrados.</div>
          : <>
              {reds.map((f, i)    => <FlagMini key={`r${i}`} flag={f} />)}
              {yellows.map((f, i) => <FlagMini key={`y${i}`} flag={f} />)}
            </>
        }
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
        <TickerLabel reporte={reporte} />
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

const SECCIONES = [
  { key: 'financieros', label: 'Financieros Clave' },
  { key: 'valuacion',   label: 'Valuacion y Multiples' },
  { key: 'score',       label: 'Quality Score' },
  { key: 'fortalezas',  label: 'Fortalezas' },
  { key: 'riesgos',     label: 'Riesgos y Cautelas' },
  { key: 'tesis',       label: 'Tesis de Inversion' },
];

export default function CompararPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [todosReportes, setTodosReportes] = useState([]);
  const [seleccionados, setSeleccionados] = useState(['', '', '']);
  const [resultado, setResultado] = useState([]); // [{ ticker, reporte, json }]
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const userToken = localStorage.getItem('portal_user_token');

  // Cargar lista de tickers disponibles
  useEffect(() => {
    api.getReportes().then(list => {
      const filtered = (Array.isArray(list) ? list : []).filter(r => r.tipo !== 'etf');
      setTodosReportes(filtered);
    }).catch(() => {});
  }, []);

  // Leer tickers de la URL al cargar y disparar comparacion
  useEffect(() => {
    const t = searchParams.get('t');
    if (t) {
      const tickers = t.split(',').slice(0, MAX_EMPRESAS).map(s => s.trim().toUpperCase()).filter(Boolean);
      const nuevos = ['', '', ''];
      tickers.forEach((tk, i) => { nuevos[i] = tk; });
      setSeleccionados(nuevos);
      // Auto-cargar si vienen por URL
      ejecutarComparacion(tickers);
    }
  }, []);

  const cambiarSeleccion = (idx, ticker) => {
    setSeleccionados(prev => {
      const n = [...prev]; n[idx] = ticker; return n;
    });
    // Limpiar resultado previo al cambiar seleccion
    setResultado([]);
    setError('');
  };

  const ejecutarComparacion = async (tickersParam) => {
    const tickers = (tickersParam || seleccionados).filter(Boolean);
    if (tickers.length < 2) {
      setError('Selecciona al menos 2 empresas para comparar.');
      return;
    }
    setError('');
    setCargando(true);
    setResultado([]);

    // Actualizar URL
    setSearchParams({ t: tickers.join(',') }, { replace: true });

    try {
      const token = localStorage.getItem('portal_user_token');
      const promesas = tickers.map(ticker =>
        (token ? api.getReporteCompleto(ticker) : api.getReporte(ticker))
          .then(r => {
            let json = null;
            if (r.contenido_json) {
              json = typeof r.contenido_json === 'string'
                ? JSON.parse(r.contenido_json)
                : r.contenido_json;
            }
            return { ticker, reporte: r, json };
          })
          .catch(() => ({ ticker, reporte: null, json: null }))
      );

      const resultados = await Promise.all(promesas);
      const validos = resultados.filter(r => r.json !== null);

      if (validos.length === 0) {
        setError('No se pudieron cargar los datos. Intenta de nuevo.');
      } else {
        setResultado(validos);
      }
    } catch {
      setError('Error al cargar los datos. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  const empresasActivas = resultado;

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

          {/* ── Boton Comparar ── */}
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={() => ejecutarComparacion()}
              disabled={cargando || seleccionados.filter(Boolean).length < 2}
              style={{
                padding: '11px 28px', borderRadius: 9, fontSize: 14, fontWeight: 700,
                background: seleccionados.filter(Boolean).length < 2 ? 'var(--border)' : 'var(--gold-dark)',
                color: seleccionados.filter(Boolean).length < 2 ? 'var(--text-muted)' : '#fff',
                border: 'none', cursor: seleccionados.filter(Boolean).length < 2 ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', transition: 'opacity 0.15s',
                opacity: cargando ? 0.7 : 1,
              }}
            >
              {cargando ? 'Cargando...' : 'Comparar empresas'}
            </button>

            {empresasActivas.length > 0 && (
              <button
                onClick={() => { navigator.clipboard?.writeText(window.location.href); }}
                style={{
                  fontSize: 12, padding: '8px 16px', borderRadius: 8,
                  background: 'var(--surface)', color: 'var(--gold-dark)',
                  border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'inherit',
                  fontWeight: 600,
                }}
              >
                Copiar enlace
              </button>
            )}
          </div>

          {error && (
            <div style={{ marginTop: 12, padding: '10px 16px', borderRadius: 8, background: 'rgba(220,38,38,.08)', border: '1px solid rgba(220,38,38,.2)', color: RED, fontSize: 13 }}>
              {error}
            </div>
          )}
        </section>

        {/* ── Estado vacío ── */}
        {!cargando && empresasActivas.length === 0 && !error && (
          <section style={{ padding: '40px 48px', maxWidth: 1200, margin: '0 auto', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚖</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
              Selecciona al menos 2 empresas y presiona "Comparar"
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Puedes buscar por ticker (AAPL, NVDA) o por nombre de empresa.
            </div>
          </section>
        )}

        {/* ── Cargando ── */}
        {cargando && (
          <section style={{ padding: '60px 48px', maxWidth: 1200, margin: '0 auto', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Cargando datos de {seleccionados.filter(Boolean).join(', ')}...</div>
          </section>
        )}

        {/* ── Cuerpo de comparacion ── */}
        {empresasActivas.length > 0 && (
          <section style={{ padding: '0 48px 60px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>

            {/* ── Headers de empresa ── */}
            {empresasActivas.length > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${empresasActivas.length}, 1fr)`,
                gap: 12,
                marginBottom: 4,
              }}>
                {empresasActivas.map(e => (
                  <CompanyCard
                    key={e.ticker}
                    reporte={e.reporte}
                    json={e.json}
                    section="header"
                    nEmp={empresasActivas.length}
                  />
                ))}
              </div>
            )}

            {/* Descripcion */}
            {empresasActivas.some(e => e.json?.descripcion) && (
              <>
                <SectionTitle label="Descripcion del Negocio" />
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${empresasActivas.length}, 1fr)`,
                  gap: 12, marginBottom: 4,
                }}>
                  {empresasActivas.map(e => (
                    <CompanyCard key={e.ticker} reporte={e.reporte} json={e.json} section="descripcion" />
                  ))}
                </div>
              </>
            )}

            {/* Secciones genericas */}
            {SECCIONES.map(sec => (
              <div key={sec.key}>
                <SectionTitle label={sec.label} />
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${empresasActivas.length}, 1fr)`,
                  gap: 12, marginBottom: 4,
                }}>
                  {empresasActivas.map(e => (
                    <CompanyCard
                      key={e.ticker}
                      reporte={e.reporte}
                      json={e.json}
                      section={sec.key}
                      nEmp={empresasActivas.length}
                    />
                  ))}
                </div>
              </div>
            ))}

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
                      to={`/reporte/${e.reporte?.slug || e.ticker}`}
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

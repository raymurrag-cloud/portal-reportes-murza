import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { api } from '../../api.js';

const CLASIFICACION = {
  AAPL:  { sector: 'Information Technology',  industria: 'Technology Hardware & Peripherals' },
  ADBE:  { sector: 'Information Technology',  industria: 'Software' },
  AMD:   { sector: 'Information Technology',  industria: 'Semiconductors' },
  AMZN:  { sector: 'Consumer Discretionary',  industria: 'Broadline Retail' },
  ASML:  { sector: 'Information Technology',  industria: 'Semiconductors' },
  AVGO:  { sector: 'Information Technology',  industria: 'Semiconductors' },
  BABA:  { sector: 'Consumer Discretionary',  industria: 'Broadline Retail' },
  CEG:   { sector: 'Utilities',               industria: 'Independent Power Producers' },
  COST:  { sector: 'Consumer Staples',        industria: 'Consumer Staples Distribution & Retail' },
  CPNG:  { sector: 'Consumer Discretionary',  industria: 'Broadline Retail' },
  CRM:   { sector: 'Information Technology',  industria: 'Software' },
  CVNA:  { sector: 'Consumer Discretionary',  industria: 'Specialty Retail' },
  CVX:   { sector: 'Energy',                  industria: 'Integrated Oil & Gas' },
  GOOGL: { sector: 'Communication Services',  industria: 'Interactive Media & Services' },
  LLY:   { sector: 'Health Care',             industria: 'Pharmaceuticals' },
  MELI:  { sector: 'Consumer Discretionary',  industria: 'Broadline Retail' },
  META:  { sector: 'Communication Services',  industria: 'Interactive Media & Services' },
  MRVL:  { sector: 'Information Technology',  industria: 'Semiconductors' },
  MSFT:  { sector: 'Information Technology',  industria: 'Software' },
  MU:    { sector: 'Information Technology',  industria: 'Semiconductors' },
  NFLX:  { sector: 'Communication Services',  industria: 'Entertainment' },
  NVDA:  { sector: 'Information Technology',  industria: 'Semiconductors' },
  NVO:   { sector: 'Health Care',             industria: 'Pharmaceuticals' },
  ORCL:  { sector: 'Information Technology',  industria: 'Software' },
  PLTR:  { sector: 'Information Technology',  industria: 'Software' },
  PYPL:  { sector: 'Financials',              industria: 'Payment Processing Services' },
  SE:    { sector: 'Consumer Discretionary',  industria: 'Broadline Retail' },
  SNDK:  { sector: 'Information Technology',  industria: 'Technology Hardware & Peripherals' },
  TSLA:  { sector: 'Consumer Discretionary',  industria: 'Automobile Manufacturers' },
  UBER:  { sector: 'Industrials',             industria: 'Ground Transportation' },
};

const POR_PAGINA = 20;

function formatMes(dateStr) {
  const d = new Date(dateStr);
  const mes = d.toLocaleDateString('es-MX', { month: 'long' });
  return mes.charAt(0).toUpperCase() + mes.slice(1) + ' ' + d.getFullYear();
}

export default function HomePage() {
  const [todosReportes, setTodosReportes] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [busqueda, setBusqueda]           = useState('');
  const [resultados, setResultados]       = useState(null); // null = sin busqueda
  const navigate = useNavigate();
  const solicitudRef = useRef(null);

  // Prospecto GBM
  const [gbm, setGbm]           = useState({ nombre: '', telefono: '', correo: '', valor_portafolio: '' });
  const [gbmEnviado, setGbmEnviado] = useState(false);
  const [gbmEnviando, setGbmEnviando] = useState(false);
  const [gbmError, setGbmError] = useState('');
  const [gbmStarted, setGbmStarted] = useState(false);
  const [gbmFiltro, setGbmFiltro] = useState(null); // null | 'califica' | 'no_califica'
  const [solStarted, setSolStarted] = useState(false);

  const enviarGBM = async (e) => {
    e.preventDefault();
    if (!gbm.nombre || !gbm.telefono || !gbm.correo || !gbm.valor_portafolio) {
      setGbmError('Completa todos los campos.'); return;
    }
    setGbmEnviando(true); setGbmError('');
    try {
      await api.enviarProspectoGBM(gbm);
      setGbmEnviado(true);
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'form_submit_gbm' });
    } catch {
      setGbmError('Hubo un error, intenta de nuevo.');
    } finally {
      setGbmEnviando(false);
    }
  };

  // Solicitar reporte
  const [empresa, setEmpresa]   = useState('');
  const [tickerSol, setTickerSol] = useState('');
  const [emailSol, setEmailSol]   = useState('');
  const [enviado, setEnviado]     = useState(false);
  const [enviando, setEnviando]   = useState(false);
  const [errorSol, setErrorSol]   = useState('');

  useEffect(() => {
    api.getReportes().then(setTodosReportes).finally(() => setLoading(false));
  }, []);

  const [sectoresFiltro, setSectoresFiltro]   = useState(new Set());
  const [industriaFiltro, setIndustriaFiltro] = useState('');
  const [sectorAbierto, setSectorAbierto]     = useState(false);
  const sectorRef = useRef(null);
  const [pagina, setPagina] = useState(0);

  const recientes = todosReportes.slice(0, 6);
  const todosAlfabeticos = [...todosReportes].sort((a, b) =>
    a.empresa.localeCompare(b.empresa, 'es')
  );

  // Sectores presentes en el portal
  const sectoresDisponibles = [...new Set(
    todosAlfabeticos.map(r => CLASIFICACION[r.ticker]?.sector).filter(Boolean)
  )].sort();

  // Industrias del sector seleccionado (solo cuando hay exactamente 1 sector)
  const industriasDisponibles = sectoresFiltro.size === 1
    ? [...new Set(
        todosAlfabeticos
          .filter(r => sectoresFiltro.has(CLASIFICACION[r.ticker]?.sector))
          .map(r => CLASIFICACION[r.ticker]?.industria)
          .filter(Boolean)
      )].sort()
    : [];

  // Cerrar dropdown al click fuera
  useEffect(() => {
    const handler = (e) => {
      if (sectorRef.current && !sectorRef.current.contains(e.target))
        setSectorAbierto(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleSector = (s) => {
    setSectoresFiltro(prev => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
    setIndustriaFiltro('');
    setPagina(0);
  };

  // Industrias solo cuando hay exactamente 1 sector seleccionado
  const industriasDisponiblesActual = sectoresFiltro.size === 1
    ? industriasDisponibles
    : [];

  const reportesFiltrados = todosAlfabeticos.filter(r => {
    const c = CLASIFICACION[r.ticker];
    if (sectoresFiltro.size > 0 && !sectoresFiltro.has(c?.sector)) return false;
    if (industriaFiltro && c?.industria !== industriaFiltro) return false;
    return true;
  });

  const totalPaginas = Math.ceil(reportesFiltrados.length / POR_PAGINA);
  const reportesPagina = reportesFiltrados.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA);

  const buscar = (e) => {
    e.preventDefault();
    const q = busqueda.trim().toUpperCase();
    if (!q) { setResultados(null); return; }
    const filtrados = todosReportes.filter(
      r => r.ticker.toUpperCase().includes(q) || r.empresa.toUpperCase().includes(q)
    );
    if (filtrados.length === 1) {
      navigate(`/reporte/${filtrados[0].slug}`);
      return;
    }
    setResultados(filtrados);
    if (filtrados.length === 0) {
      setTimeout(() => solicitudRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    }
  };

  const limpiarBusqueda = () => {
    setBusqueda('');
    setResultados(null);
  };

  const enviarSolicitud = async (e) => {
    e.preventDefault();
    if (!empresa.trim()) { setErrorSol('Escribe el nombre de la empresa.'); return; }
    setEnviando(true);
    setErrorSol('');
    try {
      await api.solicitarReporte({ empresa: empresa.trim(), ticker: tickerSol.trim(), email: emailSol.trim() });
      setEnviado(true);
      setEmpresa(''); setTickerSol(''); setEmailSol('');
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'form_submit_solicitud' });
    } catch {
      setErrorSol('Hubo un error, intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Analisis Financiero de Empresas | Murza Inversiones</title>
        <meta name="description" content="Reportes de analisis financiero de empresas publicas. Busca por ticker y accede a analisis fundamentales detallados." />
      </Helmet>

      <div className="portal-page">
        <header className="portal-header">
          <Link to="/" className="portal-logo-link">
            <img src="/murza-logo.png" alt="Murza Inversiones" className="portal-logo" />
          </Link>
          <nav style={{ display: 'flex', gap: 2 }}>
            <Link
              to="/"
              style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 14,
                color: 'var(--gold-dark)', fontWeight: 600,
                background: 'var(--gold-pale)',
                textDecoration: 'none',
              }}
            >
              Reportes
            </Link>
            <Link
              to="/earnings"
              style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 14,
                color: 'var(--text-muted)', fontWeight: 500,
                textDecoration: 'none', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--gold-pale)'; e.currentTarget.style.color = 'var(--gold-dark)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              Earnings
            </Link>
          </nav>
          <div className="portal-header-right">
            <Link to="/login" className="btn-ghost-sm">Iniciar sesion</Link>
            <Link to="/registro" className="btn-primary-sm">Registro gratis</Link>
          </div>
        </header>

        {/* Hero + buscador */}
        <section className="hero">
          <h1>Analisis financiero profesional</h1>
          <p>Resumen de reportes fundamentales de empresas publicas.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
            <form className="buscador" onSubmit={buscar} style={{ margin: 0 }}>
              <input
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Busca por ticker o empresa: AAPL, Tesla, AMZN..."
                className="buscador-input"
              />
              <button type="submit" className="btn-primary">Buscar</button>
            </form>
            <button
              type="button"
              onClick={() => solicitudRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
              style={{
                background: 'rgba(160,128,64,0.10)',
                border: '1px solid rgba(160,128,64,0.35)',
                borderRadius: 8,
                color: '#C8A84B',
                fontSize: 13,
                padding: '8px 14px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontWeight: 500,
                lineHeight: 1.3,
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(160,128,64,0.18)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(160,128,64,0.10)'}
            >
              No encuentras la empresa?<br />
              <span style={{ fontWeight: 400, opacity: 0.8 }}>Solicita el analisis aqui</span>
            </button>
          </div>
        </section>

        {/* Resultados de busqueda */}
        {resultados !== null && (
          <section className="reportes-grid-section">
            <div className="admin-section-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h2>{resultados.length > 0 ? `Resultados para "${busqueda}"` : `Sin resultados para "${busqueda}"`}</h2>
              <button className="btn-ghost-sm" onClick={limpiarBusqueda}>Ver todos</button>
            </div>
            {resultados.length > 0 ? (
              <div className="reportes-grid">
                {resultados.map(r => (
                  <Link to={`/reporte/${r.slug}`} key={r.id} className="reporte-card">
                    <span className="reporte-ticker">{r.ticker}</span>
                    <h3 className="reporte-empresa">{r.empresa}</h3>
                    <p className="reporte-desc">{r.meta_descripcion}</p>
                    <span className="reporte-fecha">{formatMes(r.created_at)}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', marginBottom: 8 }}>
                No tenemos un reporte de esa empresa todavia. Solicitalos abajo y lo agregamos pronto.
              </p>
            )}
          </section>
        )}

        {/* Reportes recientes (ultimos 6) — solo cuando no hay busqueda activa */}
        {resultados === null && (
          <section className="reportes-grid-section">
            <h2>Reportes recientes</h2>
            {loading && <div className="loading-state">Cargando...</div>}
            {!loading && recientes.length === 0 && (
              <div className="empty-state">No hay reportes publicados aun.</div>
            )}
            <div className="reportes-grid">
              {recientes.map(r => (
                <Link to={`/reporte/${r.slug}`} key={r.id} className="reporte-card">
                  <span className="reporte-ticker">{r.ticker}</span>
                  <h3 className="reporte-empresa">{r.empresa}</h3>
                  <p className="reporte-desc">{r.meta_descripcion}</p>
                  <span className="reporte-fecha">{formatMes(r.created_at)}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Lista completa con filtro por sector y paginacion */}
        {!loading && todosAlfabeticos.length > 0 && (
          <section className="reportes-grid-section" style={{ marginTop: 32 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
              <h2 style={{ margin: 0 }}>Todos los reportes</h2>
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                {reportesFiltrados.length} empresa{reportesFiltrados.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Filtros */}
            <div style={{ maxWidth: 640, marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start' }}>

                {/* Sector — multi-select desplegable */}
                <div ref={sectorRef} style={{ position: 'relative', flex: '1 1 200px' }}>
                  <button
                    onClick={() => setSectorAbierto(o => !o)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      width: '100%', padding: '9px 14px', borderRadius: 8, cursor: 'pointer',
                      fontSize: 13, fontWeight: 600, gap: 8, boxSizing: 'border-box',
                      background: sectoresFiltro.size > 0 ? '#F5EDD8' : '#fff',
                      border: '1.5px solid ' + (sectoresFiltro.size > 0 ? '#B5872A' : '#D4C4A8'),
                      color: sectoresFiltro.size > 0 ? '#8A6520' : '#7A6D5E',
                      boxShadow: '0 1px 4px rgba(181,135,42,0.08)',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.6, flexShrink: 0 }}>
                        <path d="M1 3h14M3.5 8h9M6 13h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                      </svg>
                      {sectoresFiltro.size === 0 && 'Filtrar por sector'}
                      {sectoresFiltro.size === 1 && [...sectoresFiltro][0]}
                      {sectoresFiltro.size > 1 && sectoresFiltro.size + ' sectores seleccionados'}
                    </span>
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ flexShrink: 0, opacity: 0.5 }}>
                      <path d={sectorAbierto ? 'M1 5l4-4 4 4' : 'M1 1l4 4 4-4'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                    </svg>
                  </button>

                  {sectorAbierto && (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 6px)', left: 0, minWidth: '260px',
                      zIndex: 50, borderRadius: 10, overflow: 'hidden',
                      border: '1px solid #E0D0B0',
                      boxShadow: '0 8px 28px rgba(140,100,30,0.15)',
                      background: '#FFFCF5',
                    }}>
                      <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid #EDE0C8' }}>
                        <span style={{ fontSize: 11, color: '#A8906A', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                          Sector GICS
                        </span>
                      </div>
                      {sectoresDisponibles.map(s => {
                        const sel = sectoresFiltro.has(s);
                        return (
                          <div
                            key={s}
                            onClick={() => toggleSector(s)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10,
                              padding: '9px 14px', cursor: 'pointer',
                              background: sel ? '#F5EDD8' : 'transparent',
                              borderLeft: '3px solid ' + (sel ? '#B5872A' : 'transparent'),
                              transition: 'background 0.1s',
                            }}
                            onMouseEnter={e => { if (!sel) e.currentTarget.style.background = '#FBF6EE'; }}
                            onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'transparent'; }}
                          >
                            <div style={{
                              width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                              border: '1.5px solid ' + (sel ? '#B5872A' : '#C8B898'),
                              background: sel ? '#B5872A' : '#fff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              {sel && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5l2.5 2.5 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/></svg>}
                            </div>
                            <span style={{ fontSize: 13, color: sel ? '#7A5010' : '#2E2318', fontWeight: sel ? 600 : 400 }}>
                              {s}
                            </span>
                          </div>
                        );
                      })}
                      {sectoresFiltro.size > 0 && (
                        <div
                          onClick={() => { setSectoresFiltro(new Set()); setIndustriaFiltro(''); setPagina(0); }}
                          style={{
                            padding: '9px 14px', borderTop: '1px solid #EDE0C8', cursor: 'pointer',
                            fontSize: 12, color: '#A8906A', textAlign: 'center', fontWeight: 500,
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#FBF6EE'; e.currentTarget.style.color = '#8A6520'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#A8906A'; }}
                        >
                          Limpiar selección
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Industria — dropdown nativo, solo si 1 sector con varias industrias */}
                {sectoresFiltro.size === 1 && industriasDisponiblesActual.length > 1 && (
                  <div style={{ flex: '1 1 200px' }}>
                    <select
                      value={industriaFiltro}
                      onChange={e => { setIndustriaFiltro(e.target.value); setPagina(0); }}
                      style={{
                        width: '100%', padding: '9px 14px', borderRadius: 8, fontSize: 13,
                        fontWeight: industriaFiltro ? 600 : 400, boxSizing: 'border-box',
                        background: industriaFiltro ? '#F5EDD8' : '#fff',
                        border: '1.5px solid ' + (industriaFiltro ? '#B5872A' : '#D4C4A8'),
                        color: industriaFiltro ? '#8A6520' : '#7A6D5E',
                        cursor: 'pointer', outline: 'none',
                        boxShadow: '0 1px 4px rgba(181,135,42,0.08)',
                      }}
                    >
                      <option value="">Todas las industrias</option>
                      {industriasDisponiblesActual.map(i => (
                        <option key={i} value={i}>{i}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Limpiar todo */}
                {(sectoresFiltro.size > 0 || industriaFiltro) && (
                  <button
                    onClick={() => { setSectoresFiltro(new Set()); setIndustriaFiltro(''); setPagina(0); setSectorAbierto(false); }}
                    style={{
                      padding: '9px 13px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                      border: '1.5px solid #D4C4A8', background: '#fff',
                      color: '#7A6D5E', whiteSpace: 'nowrap', alignSelf: 'stretch',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#B5872A'; e.currentTarget.style.color = '#8A6520'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#D4C4A8'; e.currentTarget.style.color = '#7A6D5E'; }}
                  >
                    ✕ Limpiar
                  </button>
                )}
              </div>
            </div>

            {/* Lista */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxWidth: 640 }}>
              {reportesPagina.map((r) => (
                <Link
                  to={`/reporte/${r.slug}`}
                  key={r.id}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '11px 4px',
                    borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.07))',
                    textDecoration: 'none', color: 'inherit', gap: 12,
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: 15 }}>
                    {r.empresa}
                    <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8, fontSize: 13 }}>
                      ({r.ticker})
                    </span>
                    {CLASIFICACION[r.ticker] && (
                      <span style={{
                        marginLeft: 10, fontSize: 11, fontWeight: 500,
                        color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 10, padding: '1px 7px',
                      }}>
                        {CLASIFICACION[r.ticker].industria}
                      </span>
                    )}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 13, whiteSpace: 'nowrap' }}>
                    {formatMes(r.created_at)}
                  </span>
                </Link>
              ))}
            </div>

            {/* Paginacion */}
            {totalPaginas > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
                <button
                  onClick={() => setPagina(p => p - 1)}
                  disabled={pagina === 0}
                  style={{
                    padding: '7px 18px', borderRadius: 8, fontSize: 14, cursor: pagina === 0 ? 'default' : 'pointer',
                    border: '1px solid rgba(255,255,255,0.15)', background: 'transparent',
                    color: pagina === 0 ? 'var(--text-muted)' : 'var(--text)',
                    opacity: pagina === 0 ? 0.4 : 1, transition: 'all 0.15s',
                  }}
                >
                  Anterior
                </button>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Página {pagina + 1} de {totalPaginas}
                </span>
                <button
                  onClick={() => setPagina(p => p + 1)}
                  disabled={pagina >= totalPaginas - 1}
                  style={{
                    padding: '7px 18px', borderRadius: 8, fontSize: 14,
                    cursor: pagina >= totalPaginas - 1 ? 'default' : 'pointer',
                    border: '1px solid rgba(255,255,255,0.15)', background: 'transparent',
                    color: pagina >= totalPaginas - 1 ? 'var(--text-muted)' : 'var(--text)',
                    opacity: pagina >= totalPaginas - 1 ? 0.4 : 1, transition: 'all 0.15s',
                  }}
                >
                  Siguiente
                </button>
              </div>
            )}
          </section>
        )}

        {/* Prospecto GBM */}
        <section style={{
          margin: '48px auto', maxWidth: 700, padding: '40px 36px',
          background: 'linear-gradient(135deg, rgba(160,128,64,0.12) 0%, rgba(160,128,64,0.04) 100%)',
          border: '1px solid rgba(160,128,64,0.3)', borderRadius: 16,
        }}>
          <h2 style={{ marginTop: 0, fontSize: 22 }}>
            ¿Quieres que Murza Inversiones sea el asesor de tu portafolio?
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: 15, lineHeight: 1.6 }}>
            Te daremos atencion 24/7 para revisar, discutir y decidir sobre tu portafolio.
          </p>
          {gbmEnviado ? (
            <div style={{
              background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)',
              borderRadius: 10, padding: '18px 24px', color: '#16A34A', fontWeight: 600,
            }}>
              Recibimos tu informacion. Te contactaremos pronto.
            </div>
          ) : gbmFiltro === null ? (
            <div>
              <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 14, color: 'var(--text)' }}>
                ¿Cual es tu situacion actual?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Ya tengo mas de $1,000,000 invertido', value: 'califica' },
                  { label: 'Quiero invertir mas de $1,000,000', value: 'califica' },
                  { label: 'Tengo menos de $1,000,000 actualmente', value: 'no_califica' },
                ].map((op, i) => (
                  <button
                    key={i}
                    onClick={() => setGbmFiltro(op.value)}
                    style={{
                      background: 'rgba(160,128,64,0.08)',
                      border: '1px solid rgba(160,128,64,0.3)',
                      borderRadius: 10, padding: '14px 20px',
                      color: 'var(--text)', fontSize: 15, fontWeight: 500,
                      cursor: 'pointer', textAlign: 'left',
                      transition: 'background 0.15s, border-color 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(160,128,64,0.18)'; e.currentTarget.style.borderColor = 'rgba(160,128,64,0.6)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(160,128,64,0.08)'; e.currentTarget.style.borderColor = 'rgba(160,128,64,0.3)'; }}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
            </div>
          ) : gbmFiltro === 'no_califica' ? (
            <div style={{
              background: 'rgba(160,128,64,0.07)', border: '1px solid rgba(160,128,64,0.25)',
              borderRadius: 10, padding: '20px 24px',
            }}>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: 'var(--text-muted)' }}>
                En este momento trabajamos con portafolios de <strong style={{ color: 'var(--text)' }}>$1,000,000 o mas</strong>.
                Si en el futuro tu portafolio llega a ese nivel, con mucho gusto te asesoramos.
              </p>
              <button
                onClick={() => setGbmFiltro(null)}
                style={{ marginTop: 14, background: 'none', border: 'none', color: 'var(--gold)', fontSize: 13, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
              >
                Volver
              </button>
            </div>
          ) : (
            <form id="form-gbm" onSubmit={enviarGBM} onFocus={() => { if (!gbmStarted) { setGbmStarted(true); window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event: 'form_start_gbm' }); } }} style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <input
                value={gbm.nombre}
                onChange={e => setGbm(g => ({ ...g, nombre: e.target.value }))}
                placeholder="Nombre completo *"
                className="buscador-input"
                style={{ flex: '1 1 200px' }}
              />
              <input
                value={gbm.telefono}
                onChange={e => setGbm(g => ({ ...g, telefono: e.target.value }))}
                placeholder="Telefono *"
                className="buscador-input"
                style={{ flex: '1 1 160px' }}
                type="tel"
              />
              <input
                value={gbm.correo}
                onChange={e => setGbm(g => ({ ...g, correo: e.target.value }))}
                placeholder="Correo electronico *"
                className="buscador-input"
                style={{ flex: '1 1 200px' }}
                type="email"
              />
              <select
                value={gbm.valor_portafolio}
                onChange={e => setGbm(g => ({ ...g, valor_portafolio: e.target.value }))}
                className="buscador-input"
                style={{ flex: '1 1 200px' }}
              >
                <option value="">Valor de portafolio *</option>
                <option value="Menos de $500K">Menos de $500,000</option>
                <option value="$500K - $1M">$500,000 — $1,000,000</option>
                <option value="$1M - $3M">$1,000,000 — $3,000,000</option>
                <option value="Mas de $3M">Mas de $3,000,000</option>
              </select>
              <button type="submit" className="btn-primary" disabled={gbmEnviando} style={{ flex: '1 1 100%' }}>
                {gbmEnviando ? 'Enviando...' : 'Quiero que Murza sea mi asesor'}
              </button>
              {gbmError && <p style={{ color: '#DC2626', fontSize: 13, width: '100%', margin: 0 }}>{gbmError}</p>}
            </form>
          )}
        </section>

        {/* Solicitar reporte — al final */}
        <section className="reportes-grid-section" ref={solicitudRef} style={{ marginTop: 32 }}>
          <h2>Solicita el analisis de una empresa</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: 15 }}>
            Si la empresa que buscas no esta en el portal, dinos cual es y la agregamos pronto.
          </p>
          {enviado ? (
            <div style={{
              background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)',
              borderRadius: 10, padding: '18px 24px', color: '#16A34A', fontWeight: 600, maxWidth: 480
            }}>
              Solicitud enviada. Revisaremos y publicaremos el reporte pronto.
              <button
                className="btn-ghost-sm"
                style={{ marginLeft: 16 }}
                onClick={() => setEnviado(false)}
              >Solicitar otra</button>
            </div>
          ) : (
            <form id="form-solicitud" onSubmit={enviarSolicitud} onFocus={() => { if (!solStarted) { setSolStarted(true); window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event: 'form_start_solicitud' }); } }} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, maxWidth: 620 }}>
              <input
                value={empresa}
                onChange={e => setEmpresa(e.target.value)}
                placeholder="Nombre de la empresa *"
                className="buscador-input"
                style={{ flex: '1 1 220px' }}
              />
              <input
                value={tickerSol}
                onChange={e => setTickerSol(e.target.value.toUpperCase())}
                placeholder="Ticker (opcional)"
                className="buscador-input"
                style={{ flex: '0 1 130px' }}
                maxLength={10}
              />
              <input
                value={emailSol}
                onChange={e => setEmailSol(e.target.value)}
                placeholder="Tu email para notificarte (opcional)"
                className="buscador-input"
                type="email"
                style={{ flex: '1 1 220px' }}
              />
              <button type="submit" className="btn-primary" disabled={enviando} style={{ flex: '0 0 auto' }}>
                {enviando ? 'Enviando...' : 'Solicitar reporte'}
              </button>
              {errorSol && <p style={{ color: '#DC2626', fontSize: 13, width: '100%', margin: 0 }}>{errorSol}</p>}
            </form>
          )}
        </section>

        <footer className="portal-footer">
          <p>© {new Date().getFullYear()} Murza Inversiones</p>
        </footer>
      </div>
    </>
  );
}

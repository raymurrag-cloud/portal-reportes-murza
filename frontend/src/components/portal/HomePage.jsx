import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { api } from '../../api.js';

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

  const recientes = todosReportes.slice(0, 6);
  const todosAlfabeticos = [...todosReportes].sort((a, b) =>
    a.empresa.localeCompare(b.empresa, 'es')
  );

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
          <img src="/murza-logo.png" alt="Murza Inversiones" className="portal-logo" />
          <div className="portal-header-right">
            <Link to="/login" className="btn-ghost-sm">Iniciar sesion</Link>
            <Link to="/registro" className="btn-primary-sm">Registro gratis</Link>
          </div>
        </header>

        {/* Hero + buscador */}
        <section className="hero">
          <h1>Analisis financiero profesional</h1>
          <p>Resumen de reportes fundamentales de empresas publicas.</p>
          <form className="buscador" onSubmit={buscar}>
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Busca por ticker o empresa: AAPL, Tesla, AMZN..."
              className="buscador-input"
            />
            <button type="submit" className="btn-primary">Buscar</button>
          </form>
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

        {/* Lista completa alfabetica */}
        {!loading && todosAlfabeticos.length > 0 && (
          <section className="reportes-grid-section" style={{ marginTop: 32 }}>
            <h2>Todos los reportes</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxWidth: 640 }}>
              {todosAlfabeticos.map((r) => (
                <Link
                  to={`/reporte/${r.slug}`}
                  key={r.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '11px 4px',
                    borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.07))',
                    textDecoration: 'none',
                    color: 'inherit',
                    gap: 12,
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: 15 }}>
                    {r.empresa}
                    <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8, fontSize: 13 }}>
                      ({r.ticker})
                    </span>
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 13, whiteSpace: 'nowrap' }}>
                    {formatMes(r.created_at)}
                  </span>
                </Link>
              ))}
            </div>
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
          <h2>No encuentras la empresa que buscas?</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: 15 }}>
            Escribenos cual empresa quieres que analicemos y la agregamos al portal.
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

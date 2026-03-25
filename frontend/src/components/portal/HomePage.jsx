import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { api } from '../../api.js';

export default function HomePage() {
  const [ticker, setTicker]     = useState('');
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading]   = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.getReportes().then(setReportes).finally(() => setLoading(false));
  }, []);

  const buscar = async (e) => {
    e.preventDefault();
    if (!ticker.trim()) return;
    setLoading(true);
    const res = await api.getReportes(ticker.trim()).catch(() => []);
    setReportes(res);
    setLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>Análisis Financiero de Empresas | Murza Inversiones</title>
        <meta name="description" content="Reportes de análisis financiero de empresas públicas. Busca por ticker y accede a análisis fundamentales detallados." />
      </Helmet>

      <div className="portal-page">
        <header className="portal-header">
          <img src="/murza-logo.png" alt="Murza Inversiones" className="portal-logo" />
          <div className="portal-header-right">
            <Link to="/login" className="btn-ghost-sm">Iniciar sesión</Link>
            <Link to="/registro" className="btn-primary-sm">Registro gratis</Link>
          </div>
        </header>

        <section className="hero">
          <h1>Análisis financiero profesional</h1>
          <p>Reportes fundamentales de empresas públicas elaborados por expertos en inversiones.</p>

          <form className="buscador" onSubmit={buscar}>
            <input
              value={ticker}
              onChange={e => setTicker(e.target.value.toUpperCase())}
              placeholder="Busca por ticker: AAPL, TSLA, AMZN..."
              className="buscador-input"
            />
            <button type="submit" className="btn-primary">Buscar</button>
          </form>
        </section>

        <section className="reportes-grid-section">
          <h2>Reportes recientes</h2>
          {loading && <div className="loading-state">Cargando...</div>}
          {!loading && reportes.length === 0 && (
            <div className="empty-state">No se encontraron reportes.</div>
          )}
          <div className="reportes-grid">
            {reportes.map(r => (
              <Link to={`/reporte/${r.slug}`} key={r.id} className="reporte-card">
                <span className="reporte-ticker">{r.ticker}</span>
                <h3 className="reporte-empresa">{r.empresa}</h3>
                <p className="reporte-desc">{r.meta_descripcion}</p>
                <span className="reporte-fecha">
                  {new Date(r.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <footer className="portal-footer">
          <p>© {new Date().getFullYear()} Murza Inversiones — Empresa afiliada a GBM</p>
        </footer>
      </div>
    </>
  );
}

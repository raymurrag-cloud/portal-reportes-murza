import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../../api.js';

export default function ReportePage() {
  const { slug } = useParams();
  const navigate  = useNavigate();
  const [reporte, setReporte]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const userToken = localStorage.getItem('portal_user_token');

  useEffect(() => {
    const cargar = async () => {
      try {
        if (userToken) {
          const completo = await api.getReporteCompleto(slug);
          setReporte({ ...completo, completo: true });
        } else {
          const preview = await api.getReporte(slug);
          setReporte(preview);
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [slug, userToken]);

  if (loading) return <div className="portal-page"><div className="loading-state">Cargando reporte...</div></div>;
  if (error)   return <div className="portal-page"><div className="error-state">Reporte no encontrado.</div></div>;

  const contenido = reporte.completo ? reporte.contenido_md : reporte.contenido_preview;

  return (
    <>
      <Helmet>
        <title>{reporte.empresa} ({reporte.ticker}) — Análisis Financiero | Murza Inversiones</title>
        <meta name="description" content={reporte.meta_descripcion} />
        <meta property="og:title" content={`${reporte.empresa} (${reporte.ticker}) — Análisis Financiero`} />
        <meta property="og:description" content={reporte.meta_descripcion} />
        <meta property="og:type" content="article" />
        <link rel="canonical" href={`${window.location.origin}/reporte/${reporte.slug}`} />
      </Helmet>

      <div className="portal-page">
        <header className="portal-header">
          <Link to="/" className="portal-logo-link">
            <img src="/murza-logo.png" alt="Murza Inversiones" className="portal-logo" />
          </Link>
          <div className="portal-header-right">
            {userToken
              ? <button className="btn-ghost-sm" onClick={() => { localStorage.removeItem('portal_user_token'); window.location.reload(); }}>Cerrar sesión</button>
              : <>
                  <Link to="/login" className="btn-ghost-sm">Iniciar sesión</Link>
                  <Link to="/registro" className="btn-primary-sm">Registro gratis</Link>
                </>
            }
          </div>
        </header>

        <article className="reporte-article">
          <div className="reporte-meta">
            <span className="reporte-ticker-grande">{reporte.ticker}</span>
            <h1>{reporte.empresa}</h1>
            <time>{new Date(reporte.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
          </div>

          <div className="reporte-contenido">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{contenido}</ReactMarkdown>
          </div>

          {/* Paywall */}
          {!reporte.completo && reporte.tiene_mas && (
            <div className="paywall">
              <div className="paywall-blur" />
              <div className="paywall-cta">
                <h3>Continúa leyendo el análisis completo</h3>
                <p>Regístrate gratis para acceder a todos los reportes sin límite.</p>
                <Link to={`/registro?redirect=/reporte/${slug}`} className="btn-primary btn-lg">
                  Crear cuenta gratis
                </Link>
                <p className="paywall-login">
                  ¿Ya tienes cuenta? <Link to={`/login?redirect=/reporte/${slug}`}>Inicia sesión</Link>
                </p>
              </div>
            </div>
          )}
        </article>

        <footer className="portal-footer">
          <p>© {new Date().getFullYear()} Murza Inversiones — Empresa afiliada a GBM</p>
        </footer>
      </div>
    </>
  );
}

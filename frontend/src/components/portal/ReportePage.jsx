import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../../api.js';
import { ChartBlock, KpiBlock, ScoreBar, FlagsBlock, VerdictBlock } from './ChartBlocks.jsx';
import ReporteRenderer from './ReporteRenderer.jsx';

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

  const esJson    = reporte.es_json && reporte.contenido_json;
  const jsonData  = esJson ? JSON.parse(reporte.contenido_json) : null;
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
          <div className="reporte-hero">
            <div className="reporte-hero-inner">
              <div className="reporte-hero-left">
                <div className="reporte-ticker-hero">{reporte.ticker}</div>
                <div className="reporte-empresa-hero">{reporte.empresa}</div>
                <div className="reporte-hero-meta">
                  <span>Análisis Financiero</span>
                  <span className="hero-sep">·</span>
                  <time>{new Date(reporte.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
                </div>
              </div>
              <div className="reporte-hero-right">
                <img src="/murza-logo.png" alt="Murza Inversiones" className="hero-logo" />
                <div className="hero-brand">Murza Inversiones</div>
              </div>
            </div>
          </div>

          <div className="reporte-contenido-wrap">

          {/* ── Reporte JSON estructurado ── */}
          {esJson ? (
            <>
              <ReporteRenderer data={jsonData} ticker={reporte.ticker} soloPreview={!reporte.completo} seccionesGratis={reporte.parrafos_gratis ?? 2} />
              {!reporte.completo && (
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
            </>
          ) : (

          /* ── Reporte Markdown (legacy) ── */
          <><div className="reporte-contenido">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                /* ── Colores en celdas con porcentajes (Var. YoY) ── */
                td({ children, ...props }) {
                  const text = React.Children.toArray(children)
                    .map(c => typeof c === 'string' ? c : '')
                    .join('').trim();
                  if (text.includes('%')) {
                    const num = parseFloat(text.replace(/[^\-\d.]/g, ''));
                    if (!isNaN(num) && num !== 0) {
                      const pos = num > 0 && !text.startsWith('-');
                      return (
                        <td {...props}>
                          <span style={{
                            color: pos ? '#16A34A' : '#DC2626',
                            fontWeight: 700,
                            background: pos ? 'rgba(22,163,74,.10)' : 'rgba(220,38,38,.10)',
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: '12px',
                            fontFamily: 'sans-serif',
                            letterSpacing: '0.3px',
                          }}>
                            {pos ? '▲ ' : '▼ '}{pos && !text.startsWith('+') ? `+${text}` : text}
                          </span>
                        </td>
                      );
                    }
                  }
                  return <td {...props}>{children}</td>;
                },

                /* ── Tabla con scroll horizontal ── */
                table({ children, ...props }) {
                  return (
                    <div style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
                      <table {...props}>{children}</table>
                    </div>
                  );
                },

                /* ── Bloques de código personalizados ── */
                code({ node, inline, className, children, ...props }) {
                  const lang = /language-(\w+)/.exec(className || '')?.[1];
                  const raw  = String(children).replace(/\n$/, '');
                  if (!inline && lang === 'chart') {
                    try { return <ChartBlock config={JSON.parse(raw)} />; } catch {}
                  }
                  if (!inline && lang === 'kpi') {
                    try { return <KpiBlock items={JSON.parse(raw)} />; } catch {}
                  }
                  if (!inline && lang === 'score') {
                    try { return <ScoreBar {...JSON.parse(raw)} />; } catch {}
                  }
                  if (!inline && lang === 'flags') {
                    try { return <FlagsBlock items={JSON.parse(raw)} />; } catch {}
                  }
                  if (!inline && lang === 'verdict') {
                    try { return <VerdictBlock {...JSON.parse(raw)} />; } catch {}
                  }
                  if (inline) return <code className={className} {...props}>{children}</code>;
                  return <pre className="code-block"><code>{raw}</code></pre>;
                }
              }}
            >{contenido}</ReactMarkdown>
          </div>
          {!reporte.completo && reporte.tiene_mas && (
            <div className="paywall">
              <div className="paywall-blur" />
              <div className="paywall-cta">
                <h3>Continúa leyendo el análisis completo</h3>
                <p>Regístrate gratis para acceder a todos los reportes sin límite.</p>
                <Link to={`/registro?redirect=/reporte/${slug}`} className="btn-primary btn-lg">Crear cuenta gratis</Link>
                <p className="paywall-login">¿Ya tienes cuenta? <Link to={`/login?redirect=/reporte/${slug}`}>Inicia sesión</Link></p>
              </div>
            </div>
          )}
          </>

          )}{/* fin ternario JSON/Markdown */}
          </div>{/* /reporte-contenido-wrap */}
        </article>

        <footer className="portal-footer">
          <p>© {new Date().getFullYear()} Murza Inversiones — Empresa afiliada a GBM</p>
        </footer>
      </div>
    </>
  );
}

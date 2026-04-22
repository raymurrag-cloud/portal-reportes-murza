import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AdminModeToggle } from './AdminModeToggle.jsx';

const BASE = import.meta.env.VITE_API_URL || '/api';

function authHeaders() {
  const token = localStorage.getItem('portal_admin_token');
  return { Authorization: `Bearer ${token}` };
}

function scoreColor(score) {
  if (score >= 60) return { bg: 'rgba(22,163,74,.15)', color: 'var(--green)', border: 'rgba(22,163,74,.3)', label: 'Alto' };
  if (score >= 30) return { bg: 'rgba(202,138,4,.15)',  color: 'var(--amber)', border: 'rgba(202,138,4,.3)', label: 'Medio' };
  if (score >= 10) return { bg: 'rgba(99,149,210,.12)', color: '#6395D2',      border: 'rgba(99,149,210,.25)', label: 'Bajo' };
  return               { bg: 'var(--bg-alt)',            color: 'var(--text-faint)', border: 'var(--border)', label: 'Mínimo' };
}

function fmtTiempo(seg) {
  if (!seg || seg < 1) return '—';
  if (seg < 60) return `${seg}s`;
  return `${Math.floor(seg / 60)}m ${seg % 60}s`;
}

function fmtFechaLarga(str) {
  if (!str) return '—';
  const d = new Date(str.replace(' ', 'T') + 'Z');
  return d.toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Mexico_City' });
}

function fmtHora(str) {
  if (!str) return '';
  const d = new Date(str.replace(' ', 'T') + 'Z');
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Mexico_City' });
}

function fmtFechaDia(str) {
  if (!str) return '';
  const d = new Date(str + 'T00:00:00');
  return d.toLocaleDateString('es-MX', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
}

function ScoreBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
        <span style={{ color: 'var(--text-muted)' }}>{label}</span>
        <span style={{ fontWeight: 700, color }}>{value}<span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>/{max}</span></span>
      </div>
      <div style={{ height: 6, background: 'var(--bg-alt)', borderRadius: 3, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width .5s' }} />
      </div>
    </div>
  );
}

function ScrollBadge({ pct }) {
  if (!pct && pct !== 0) return <span style={{ color: 'var(--text-faint)' }}>—</span>;
  const color = pct >= 80 ? 'var(--green)' : pct >= 40 ? 'var(--amber)' : 'var(--text-muted)';
  return <span style={{ color, fontWeight: 600 }}>{pct}%</span>;
}

export default function AdminVisitanteDetalle() {
  const { visitorId }   = useParams();
  const navigate        = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [diasExpanded, setDiasExpanded] = useState({});

  useEffect(() => {
    setLoading(true);
    fetch(`${BASE}/admin/visitantes/${visitorId}`, { headers: authHeaders() })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => {
        setData(d);
        // Expand the most recent day by default
        if (d.dias?.length > 0) {
          const ultimaFecha = d.dias[d.dias.length - 1].fecha;
          setDiasExpanded({ [ultimaFecha]: true });
        }
      })
      .catch(() => navigate('/admin/login'))
      .finally(() => setLoading(false));
  }, [visitorId]);

  if (loading) return (
    <div className="admin-page">
      <div className="loading-state">Cargando perfil...</div>
    </div>
  );

  if (!data) return null;

  const sc = scoreColor(data.score);

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="admin-header-left">
          <img src="/murza-logo.png" alt="Murza" className="admin-logo" />
          <nav className="admin-nav">
            <Link to="/admin/reportes"    className="admin-nav-link">Reportes</Link>
            <Link to="/admin/leads"       className="admin-nav-link">Leads</Link>
            <Link to="/admin/prospectos"  className="admin-nav-link">Prospectos GBM</Link>
            <Link to="/admin/solicitudes" className="admin-nav-link">Solicitudes</Link>
            <Link to="/admin/analytics"   className="admin-nav-link">Analytics</Link>
            <Link to="/admin/visitantes"  className="admin-nav-link active">Visitantes</Link>
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <AdminModeToggle />
          <button className="btn-ghost-sm" onClick={() => { localStorage.removeItem('portal_admin_token'); navigate('/admin/login'); }}>Salir</button>
        </div>
      </header>

      <main className="admin-main">
        {/* Breadcrumb */}
        <div style={{ marginBottom: 20 }}>
          <Link to="/admin/visitantes" style={{ color: 'var(--gold-dark)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            ← Todos los visitantes
          </Link>
        </div>

        {/* ── Header del perfil ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 20, marginBottom: 20, alignItems: 'start' }}>
          <div style={{ background: 'var(--surface-pure)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
              {/* Score circle */}
              <div style={{
                width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
                background: sc.bg, border: `2px solid ${sc.border}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 22, fontWeight: 900, color: sc.color, lineHeight: 1 }}>{data.score}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: sc.color, textTransform: 'uppercase', letterSpacing: 1 }}>{sc.label}</span>
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--text-muted)', background: 'var(--bg-alt)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: 4 }}
                        title={data.visitor_id}>{data.visitor_id}</span>
                  {data.prospectos?.length > 0 && (
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', background: 'rgba(22,163,74,.12)', border: '1px solid rgba(22,163,74,.25)', padding: '3px 10px', borderRadius: 6 }}>
                      LEAD CONVERTIDO
                    </span>
                  )}
                  {data.es_proxy ? <span style={{ fontSize: 11, color: '#888', background: 'var(--bg-alt)', border: '1px solid var(--border)', padding: '2px 7px', borderRadius: 4 }}>VPN/Proxy</span> : null}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 24px', fontSize: 13 }}>
                  {data.ciudad && <span style={{ color: 'var(--text-warm)' }}>📍 {data.ciudad}{data.estado ? `, ${data.estado}` : ''}{data.pais ? ` · ${data.pais}` : ''}</span>}
                  {data.isp && <span style={{ color: 'var(--text-muted)' }}>🌐 {data.isp}</span>}
                  {data.fuente && <span style={{ color: 'var(--text-muted)' }}>↗ {data.fuente}{data.campana ? ` / ${data.campana}` : ''}</span>}
                  {data.dispositivo && <span style={{ color: 'var(--text-muted)' }}>💻 {data.dispositivo}</span>}
                  {data.navegador && <span style={{ color: 'var(--text-muted)' }}>{data.navegador}</span>}
                  {data.zona_horaria && <span style={{ color: 'var(--text-muted)' }}>🕐 {data.zona_horaria}</span>}
                </div>

                <div style={{ display: 'flex', gap: 24, marginTop: 10, fontSize: 12, color: 'var(--text-faint)' }}>
                  <span>Primera visita: <strong style={{ color: 'var(--text-muted)' }}>{fmtFechaLarga(data.primera_visita)}</strong></span>
                  <span>Última visita: <strong style={{ color: 'var(--text-muted)' }}>{fmtFechaLarga(data.ultima_visita)}</strong></span>
                </div>
              </div>
            </div>

            {/* Stat pills */}
            <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
              {[
                { label: 'Días visitados', value: data.total_dias, accent: 'var(--gold)' },
                { label: 'Sesiones',       value: data.total_sesiones, accent: 'var(--amber)' },
                { label: 'Reportes leídos',value: data.reportes_leidos, accent: 'var(--green)' },
                { label: 'Tiempo total',   value: fmtTiempo(data.tiempo_total_seg), accent: '#6395D2' },
                { label: 'Scroll prom.',   value: data.scroll_promedio > 0 ? `${data.scroll_promedio}%` : '—', accent: 'var(--amber)' },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)', borderTop: `2px solid ${s.accent}`, borderRadius: 8, padding: '8px 14px', minWidth: 80 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-faint)', marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Score breakdown */}
          <div style={{ background: 'var(--surface-pure)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px', boxShadow: 'var(--shadow-sm)', minWidth: 240 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--text-faint)', marginBottom: 14 }}>Engagement Score</div>
            <ScoreBar label="Reportes leídos"  value={data.score_detalle.reportes} max={30} color="var(--gold)" />
            <ScoreBar label="Scroll en reportes" value={data.score_detalle.scroll}  max={25} color="var(--amber)" />
            <ScoreBar label="Días visitados"   value={data.score_detalle.dias}     max={20} color="var(--green)" />
            <ScoreBar label="Tiempo en sitio"  value={data.score_detalle.tiempo}   max={15} color="#6395D2" />
            <ScoreBar label="Sesiones"         value={data.score_detalle.sesiones} max={10} color="#A08040" />
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>Total</span>
              <span style={{ fontSize: 24, fontWeight: 900, color: sc.color }}>{data.score}<span style={{ fontSize: 13, color: 'var(--text-faint)', fontWeight: 400 }}>/100</span></span>
            </div>
          </div>
        </div>

        {/* ── Si convirtió a lead ── */}
        {data.prospectos?.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            {data.prospectos.map(p => (
              <div key={p.id} style={{ background: 'rgba(22,163,74,.06)', border: '1px solid rgba(22,163,74,.25)', borderRadius: 12, padding: '16px 20px', display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--green)' }}>Lead Convertido</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{p.nombre}</span>
                {p.correo && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{p.correo}</span>}
                {p.telefono && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{p.telefono}</span>}
                {p.valor_portafolio && <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gold-dark)' }}>{p.valor_portafolio}</span>}
                <span style={{ fontSize: 12, color: 'var(--text-faint)', marginLeft: 'auto' }}>{fmtFechaLarga(p.created_at)}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
          {/* ── Timeline por día ── */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--text-faint)', marginBottom: 14 }}>
              Actividad por día — {data.total_dias} día{data.total_dias !== 1 ? 's' : ''} visitado{data.total_dias !== 1 ? 's' : ''}
            </div>

            {[...data.dias].reverse().map(dia => {
              const expanded = !!diasExpanded[dia.fecha];
              const toggle = () => setDiasExpanded(prev => ({ ...prev, [dia.fecha]: !prev[dia.fecha] }));
              return (
                <div key={dia.fecha} style={{ marginBottom: 12, background: 'var(--surface-pure)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                  {/* Día header */}
                  <button onClick={toggle} style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 20px', background: 'none', border: 'none', cursor: 'pointer',
                    borderBottom: expanded ? '1px solid var(--border)' : 'none',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', textTransform: 'capitalize' }}>{fmtFechaDia(dia.fecha)}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-faint)', background: 'var(--bg-alt)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 7px' }}>
                        {dia.sesiones.length} sesión{dia.sesiones.length !== 1 ? 'es' : ''} · {dia.visitas_dia} páginas · {fmtTiempo(dia.tiempo_dia)}
                      </span>
                    </div>
                    <span style={{ color: 'var(--text-faint)', fontSize: 16 }}>{expanded ? '▲' : '▼'}</span>
                  </button>

                  {expanded && (
                    <div style={{ padding: '12px 20px' }}>
                      {dia.sesiones.map((ses, si) => (
                        <div key={ses.session_id} style={{ marginBottom: si < dia.sesiones.length - 1 ? 16 : 0 }}>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 1 }}>
                              Sesión {si + 1}
                            </span>
                            <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                              {fmtHora(ses.inicio)} – {fmtHora(ses.fin)}
                            </span>
                            {ses.fuente && <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-alt)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px' }}>{ses.fuente}</span>}
                            {ses.dispositivo && <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-alt)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px' }}>{ses.dispositivo}</span>}
                          </div>

                          {ses.paginas.map((pg, pi) => {
                            const esReporte = pg.url?.startsWith('/reporte/');
                            return (
                              <div key={pi} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: pi < ses.paginas.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                <span style={{ fontSize: 11, color: 'var(--text-faint)', width: 20, textAlign: 'right', flexShrink: 0 }}>{pi + 1}</span>
                                <span style={{ fontSize: 12, color: 'var(--text-faint)', flexShrink: 0 }}>{fmtHora(pg.created_at)}</span>
                                <span style={{ flex: 1, fontSize: 13, fontWeight: esReporte ? 600 : 400, color: esReporte ? 'var(--text)' : 'var(--text-warm)' }}>
                                  {pg.titulo || pg.url}
                                  {!esReporte && <span style={{ fontSize: 11, color: 'var(--text-faint)', marginLeft: 6 }}>{pg.url}</span>}
                                </span>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>{fmtTiempo(pg.tiempo_seg)}</span>
                                {esReporte && (
                                  <span style={{ fontSize: 12, flexShrink: 0 }}>
                                    <ScrollBadge pct={pg.scroll_max} />
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Panel derecho: reportes + días ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Reportes vistos */}
            <div style={{ background: 'var(--surface-pure)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--text-faint)', marginBottom: 14 }}>
                Reportes vistos ({data.reportes.length})
              </div>
              {data.reportes.length === 0 ? (
                <p style={{ color: 'var(--text-faint)', fontSize: 13, margin: 0 }}>No vio ningún reporte</p>
              ) : data.reportes.map(r => (
                <div key={r.url} style={{ paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                    {r.titulo || r.url}
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                    <span style={{ color: 'var(--text-muted)' }}>{r.vistas}x vista{r.vistas !== 1 ? 's' : ''}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{fmtTiempo(r.tiempo_total)}</span>
                    <span><ScrollBadge pct={r.scroll_max} /> scroll</span>
                  </div>
                  {/* Scroll bar */}
                  <div style={{ height: 4, background: 'var(--bg-alt)', borderRadius: 2, border: '1px solid var(--border)', overflow: 'hidden', marginTop: 6 }}>
                    <div style={{ width: `${r.scroll_max}%`, height: '100%', background: r.scroll_max >= 80 ? 'var(--green)' : r.scroll_max >= 40 ? 'var(--amber)' : 'var(--border)', borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Calendario de días */}
            <div style={{ background: 'var(--surface-pure)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--text-faint)', marginBottom: 14 }}>
                Días visitados
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {data.dias.map(dia => (
                  <div key={dia.fecha} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', background: 'var(--bg-alt)', border: '1px solid var(--border)', borderRadius: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', flex: 1 }}>
                      {new Date(dia.fecha + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: '2-digit', month: 'short' })}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{dia.sesiones.length} ses.</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{dia.visitas_dia} págs.</span>
                    <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{fmtTiempo(dia.tiempo_dia)}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

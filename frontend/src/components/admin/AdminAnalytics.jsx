import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const BASE = import.meta.env.VITE_API_URL || '/api';

async function fetchAnalytics(periodo) {
  const token = localStorage.getItem('portal_admin_token');
  const res = await fetch(`${BASE}/admin/analytics?periodo=${periodo}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Error');
  return res.json();
}

function Bar({ count, max, color }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, background: 'var(--bg-alt)', borderRadius: 4, height: 7, overflow: 'hidden', border: '1px solid var(--border)' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color || 'var(--gold)', borderRadius: 4, transition: 'width .5s cubic-bezier(.22,1,.36,1)' }} />
      </div>
      <span style={{ fontSize: 12, color: 'var(--text-faint)', width: 34, textAlign: 'right' }}>{pct}%</span>
    </div>
  );
}

function MetricCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: 'var(--surface-pure)', border: '1px solid var(--border)',
      borderTop: `3px solid ${accent || 'var(--gold)'}`,
      borderRadius: 12, padding: '18px 20px', boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--text-faint)', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function Card({ title, children, style }) {
  return (
    <div style={{ background: 'var(--surface-pure)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px', boxShadow: 'var(--shadow-sm)', ...style }}>
      {title && (
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--text-faint)', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

function ListaBar({ items, color }) {
  if (!items || items.length === 0) return <p style={{ color: 'var(--text-faint)', fontSize: 13, margin: 0 }}>Sin datos aún</p>;
  const max = items[0]?.count || 1;
  return items.map(f => (
    <div key={f.label} style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5, color: 'var(--text-warm)' }}>
        <span style={{ fontWeight: 500 }}>{f.label}</span>
        <span style={{ color: 'var(--text-muted)' }}>{f.count}</span>
      </div>
      <Bar count={f.count} max={max} color={color} />
    </div>
  ));
}

function fmtTiempo(seg) {
  if (!seg || seg < 1) return '—';
  if (seg < 60) return `${seg}s`;
  return `${Math.floor(seg / 60)}m ${seg % 60}s`;
}

function pct(n, t) {
  return t > 0 ? `${Math.round(((n || 0) / t) * 100)}%` : '0%';
}

const PERIODOS = [
  { key: 'hoy',    label: 'Hoy' },
  { key: 'semana', label: '7 días' },
  { key: 'mes',    label: '30 días' },
  { key: 'total',  label: 'Total' },
];

const EMBUDO_COLORS = ['var(--gold)', '#B57A2A', '#8A6520', 'var(--green)', '#0E7B38'];

// Gráfica de barras horarias
function HorasChart({ horas }) {
  if (!horas || horas.length === 0) return <p style={{ color: 'var(--text-faint)', fontSize: 13, margin: 0 }}>Sin datos</p>;
  const max = Math.max(...horas.map(h => h.count), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 60, width: '100%' }}>
      {horas.map(h => {
        const altura = max > 0 ? Math.round((h.count / max) * 100) : 0;
        const esPico = h.count === max && max > 0;
        return (
          <div key={h.hora} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{
              width: '100%', height: `${Math.max(altura, 2)}%`,
              background: esPico ? 'var(--gold)' : 'var(--border)',
              borderRadius: '2px 2px 0 0', minHeight: 2,
              transition: 'height .4s ease',
            }} title={`${h.hora}:00 — ${h.count} visitas`} />
            {(h.hora % 6 === 0) && (
              <span style={{ fontSize: 9, color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>{h.hora}h</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState('semana');
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchAnalytics(periodo)
      .then(setData)
      .catch(() => navigate('/admin/login'))
      .finally(() => setLoading(false));
  }, [periodo]);

  const logout = () => { localStorage.removeItem('portal_admin_token'); navigate('/admin/login'); };

  const d   = data;
  const rp  = d?.resumen?.[periodo] || {};
  const emb = d?.embudo || {};
  const nvr = d?.nuevos_vs_recurrentes || {};
  const com = d?.comportamiento || {};
  const nvrTotal = (nvr.nuevos || 0) + (nvr.recurrentes || 0);

  const convPct = rp.sesiones > 0
    ? ((emb.llenaron_form / rp.sesiones) * 100).toFixed(1) + '%'
    : '—';

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
            <Link to="/admin/analytics"  className="admin-nav-link active">Analytics</Link>
          </nav>
        </div>
        <button className="btn-ghost-sm" onClick={logout}>Salir</button>
      </header>

      <main className="admin-main">
        <div className="admin-section-header" style={{ marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>Analytics del Portal</h2>
          <div style={{ display: 'flex', gap: 6 }}>
            {PERIODOS.map(p => (
              <button key={p.key} className={`btn-filtro${periodo === p.key ? ' active' : ''}`} onClick={() => setPeriodo(p.key)}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {loading && <div className="loading-state">Cargando analytics...</div>}

        {!loading && d && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* ── Métricas principales ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
              <MetricCard label="Visitantes únicos"   value={rp.visitantes?.toLocaleString()} />
              <MetricCard label="Sesiones"            value={rp.sesiones?.toLocaleString()} />
              <MetricCard label="Page Views"          value={rp.pageviews?.toLocaleString()} />
              <MetricCard label="Conversión"          value={convPct} sub={`${emb.llenaron_form} prospectos`} accent="var(--green)" />
              <MetricCard label="Visitantes nuevos"   value={nvr.nuevos?.toLocaleString()} sub={pct(nvr.nuevos, nvrTotal)} />
              <MetricCard label="Recurrentes"         value={nvr.recurrentes?.toLocaleString()} sub={pct(nvr.recurrentes, nvrTotal)} accent="var(--amber)" />
            </div>

            {/* ── Comportamiento de sesión ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
              <MetricCard label="Tasa de rebote"      value={`${com.tasa_rebote ?? '—'}%`} sub="Sesiones de 1 sola página" accent="#888" />
              <MetricCard label="Páginas / sesión"    value={com.paginas_por_sesion ?? '—'} sub="Promedio de páginas vistas" accent="var(--gold)" />
              <MetricCard label="Duración sesión"     value={fmtTiempo(com.duracion_sesion)} sub="Tiempo promedio en el sitio" accent="var(--amber)" />
            </div>

            {/* ── Fuentes + Dispositivos ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Card title="Fuente de origen">
                <ListaBar items={d.fuentes} color="var(--gold)" />
              </Card>
              <Card title="Dispositivos">
                <ListaBar items={d.dispositivos} color="var(--amber)" />
              </Card>
            </div>

            {/* ── Navegadores + Países ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Card title="Navegadores">
                <ListaBar items={d.navegadores} color="#6B84C8" />
              </Card>
              <Card title="Países">
                <ListaBar items={d.paises} color="var(--green)" />
              </Card>
            </div>

            {/* ── Ciudades ── */}
            <Card title="Top Ciudades">
              {d.ciudades.length === 0 ? (
                <p style={{ color: 'var(--text-faint)', fontSize: 13, margin: 0 }}>Sin datos aún</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px 32px' }}>
                  {d.ciudades.map(c => (
                    <div key={c.label} style={{ marginBottom: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5, color: 'var(--text-warm)' }}>
                        <span style={{ fontWeight: 500 }}>{c.label}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{c.count}</span>
                      </div>
                      <Bar count={c.count} max={d.ciudades[0]?.count || 1} color="var(--green)" />
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* ── Horario de visitas ── */}
            <Card title="Horario de visitas (hora MX)">
              {d.horas && <HorasChart horas={d.horas} />}
              {d.horas && (() => {
                const pico = d.horas.reduce((a, b) => b.count > a.count ? b : a, { hora: 0, count: 0 });
                const valle = d.horas.reduce((a, b) => b.count < a.count && b.count > 0 ? b : a, { hora: 0, count: Infinity });
                return pico.count > 0 ? (
                  <div style={{ display: 'flex', gap: 24, marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>Hora pico: <strong style={{ color: 'var(--gold-dark)' }}>{pico.hora}:00–{pico.hora + 1}:00</strong> ({pico.count} visitas)</span>
                    {valle.count < Infinity && <span>Hora valle: {valle.hora}:00–{valle.hora + 1}:00 ({valle.count} visitas)</span>}
                  </div>
                ) : null;
              })()}
            </Card>

            {/* ── Páginas más vistas ── */}
            <Card title="Páginas más vistas">
              {d.paginas.length === 0 ? (
                <p style={{ color: 'var(--text-faint)', fontSize: 13, margin: 0 }}>Sin datos aún</p>
              ) : (
                <div className="admin-table-wrapper" style={{ border: 'none', boxShadow: 'none', borderRadius: 0 }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Página</th>
                        <th style={{ textAlign: 'right' }}>Vistas</th>
                        <th style={{ textAlign: 'right' }}>T. promedio</th>
                        <th style={{ textAlign: 'right' }}>Scroll prom.</th>
                        <th style={{ textAlign: 'right' }}>Leyeron ≥80%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.paginas.map(p => {
                        const esReporte = p.url.startsWith('/reporte/');
                        return (
                          <tr key={p.url}>
                            <td>
                              <span style={{ fontWeight: 600, color: 'var(--text)' }}>{p.titulo}</span>
                              <span style={{ fontSize: 11, color: 'var(--text-faint)', marginLeft: 8 }}>{p.url}</span>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>{p.vistas}</td>
                            <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{fmtTiempo(p.tiempo_promedio)}</td>
                            <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{esReporte ? `${p.scroll_promedio}%` : '—'}</td>
                            <td style={{ textAlign: 'right' }}>
                              {esReporte ? (
                                <span style={{ color: p.completos > 0 ? 'var(--green)' : 'var(--text-faint)', fontWeight: p.completos > 0 ? 600 : 400 }}>
                                  {p.completos} <span style={{ fontWeight: 400, color: 'var(--text-faint)' }}>({pct(p.completos, p.vistas)})</span>
                                </span>
                              ) : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* ── Engagement por reporte ── */}
            {d.reportes_engagement && d.reportes_engagement.length > 0 && (
              <Card title="Engagement por reporte">
                <div className="admin-table-wrapper" style={{ border: 'none', boxShadow: 'none', borderRadius: 0 }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Reporte</th>
                        <th style={{ textAlign: 'right' }}>Visitas</th>
                        <th style={{ textAlign: 'right' }}>Tiempo prom.</th>
                        <th style={{ textAlign: 'right' }}>Scroll prom.</th>
                        <th style={{ textAlign: 'right' }}>Completados</th>
                        <th style={{ textAlign: 'right' }}>% completado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.reportes_engagement.map(r => (
                        <tr key={r.url}>
                          <td style={{ fontWeight: 600, color: 'var(--text)' }}>
                            {r.titulo}
                            <span style={{ fontSize: 11, color: 'var(--text-faint)', marginLeft: 8 }}>{r.url}</span>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>{r.vistas}</td>
                          <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{fmtTiempo(r.tiempo_promedio)}</td>
                          <td style={{ textAlign: 'right' }}>
                            <span style={{ color: r.scroll_promedio >= 50 ? 'var(--green)' : r.scroll_promedio >= 25 ? 'var(--amber)' : 'var(--text-muted)' }}>
                              {r.scroll_promedio > 0 ? `${r.scroll_promedio}%` : '—'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', color: r.completos > 0 ? 'var(--green)' : 'var(--text-faint)', fontWeight: r.completos > 0 ? 600 : 400 }}>
                            {r.completos}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <span style={{
                              background: r.tasa_completado >= 20 ? 'rgba(22,163,74,.12)' : r.tasa_completado >= 5 ? 'rgba(202,138,4,.12)' : 'var(--bg-alt)',
                              color:      r.tasa_completado >= 20 ? 'var(--green)'         : r.tasa_completado >= 5 ? 'var(--amber)'         : 'var(--text-faint)',
                              padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600,
                            }}>
                              {r.tasa_completado}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* ── Embudo de conversión ── */}
            <Card title="Embudo de conversión">
              {[
                { label: 'Entran al sitio',          value: emb.total_sesiones },
                { label: 'Leen al menos 1 reporte',  value: emb.leyeron_reporte },
                { label: 'Leen reporte completo',     value: emb.leyeron_completo },
                { label: 'Visitan Earnings',          value: emb.vieron_earnings },
                { label: 'Llenan el formulario GBM', value: emb.llenaron_form },
              ].map((step, i) => (
                <div key={i} style={{ marginBottom: i < 4 ? 14 : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: i === 4 ? 700 : 500, color: i === 4 ? 'var(--gold-dark)' : 'var(--text-warm)' }}>
                      {step.label}
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      <strong style={{ color: 'var(--text)', marginRight: 6 }}>{step.value ?? 0}</strong>
                      {pct(step.value || 0, emb.total_sesiones || 1)}
                    </span>
                  </div>
                  <Bar count={step.value || 0} max={emb.total_sesiones || 1} color={EMBUDO_COLORS[i]} />
                </div>
              ))}
            </Card>

          </div>
        )}
      </main>
    </div>
  );
}

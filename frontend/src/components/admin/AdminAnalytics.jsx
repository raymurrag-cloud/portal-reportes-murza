import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api.js';

const BASE = import.meta.env.VITE_API_URL || '/api';

async function fetchAnalytics(periodo) {
  const token = localStorage.getItem('portal_admin_token');
  const res = await fetch(`${BASE}/admin/analytics?periodo=${periodo}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Error');
  return res.json();
}

// ── Barra horizontal simple ───────────────────────────────────────────────────
function Bar({ count, max, color = '#A08040' }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, background: 'var(--bg-card, #1a1a1a)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width .4s' }} />
      </div>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 36, textAlign: 'right' }}>{pct}%</span>
    </div>
  );
}

// ── Tarjeta de número ─────────────────────────────────────────────────────────
function StatCard({ label, value, sub }) {
  return (
    <div style={{ background: 'var(--bg-card, #111)', border: '1px solid var(--border, #2a2a2a)', borderRadius: 10, padding: '18px 22px' }}>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--gold, #A08040)', lineHeight: 1 }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function fmtTiempo(seg) {
  if (!seg || seg < 1) return '0s';
  if (seg < 60) return `${seg}s`;
  return `${Math.floor(seg / 60)}m ${seg % 60}s`;
}

const PERIODOS = [
  { key: 'hoy',    label: 'Hoy' },
  { key: 'semana', label: '7 días' },
  { key: 'mes',    label: '30 días' },
  { key: 'total',  label: 'Total' },
];

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState('semana');
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    setLoading(true); setError('');
    fetchAnalytics(periodo)
      .then(setData)
      .catch(() => { setError('Error cargando datos'); navigate('/admin/login'); })
      .finally(() => setLoading(false));
  }, [periodo]);

  const logout = () => { localStorage.removeItem('portal_admin_token'); navigate('/admin/login'); };

  const d = data;
  const resumenPeriodo = d?.resumen?.[periodo] || {};
  const maxFuente      = d?.fuentes?.[0]?.count || 1;
  const maxDispositivo = d?.dispositivos?.[0]?.count || 1;
  const maxCiudad      = d?.ciudades?.[0]?.count || 1;
  const embudo         = d?.embudo || {};
  const nvr            = d?.nuevos_vs_recurrentes || {};

  const pct = (n, t) => t > 0 ? `${Math.round((n / t) * 100)}%` : '0%';

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="admin-header-left">
          <img src="/murza-logo.png" alt="Murza" className="admin-logo" />
          <nav className="admin-nav">
            <Link to="/admin/reportes"   className="admin-nav-link">Reportes</Link>
            <Link to="/admin/leads"      className="admin-nav-link">Leads</Link>
            <Link to="/admin/prospectos" className="admin-nav-link">Prospectos GBM</Link>
            <Link to="/admin/solicitudes" className="admin-nav-link">Solicitudes</Link>
            <Link to="/admin/analytics"  className="admin-nav-link active">Analytics</Link>
          </nav>
        </div>
        <button className="btn-ghost-sm" onClick={logout}>Salir</button>
      </header>

      <main className="admin-main">
        <div className="admin-section-header" style={{ marginBottom: 20 }}>
          <h1 className="admin-title">Analytics del Portal</h1>
          <div style={{ display: 'flex', gap: 6 }}>
            {PERIODOS.map(p => (
              <button
                key={p.key}
                onClick={() => setPeriodo(p.key)}
                style={{
                  padding: '5px 14px', borderRadius: 6, border: '1px solid var(--border, #2a2a2a)',
                  cursor: 'pointer', fontSize: 13, fontWeight: periodo === p.key ? 700 : 400,
                  background: periodo === p.key ? 'var(--gold, #A08040)' : 'transparent',
                  color: periodo === p.key ? '#000' : 'var(--text-muted)',
                  transition: 'all .15s',
                }}
              >{p.label}</button>
            ))}
          </div>
        </div>

        {loading && <div className="loading-state">Cargando analytics...</div>}
        {error   && <div className="empty-state">{error}</div>}

        {!loading && d && (
          <>
            {/* ── Tarjetas resumen ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 24 }}>
              <StatCard label="Visitantes únicos"  value={resumenPeriodo.visitantes} />
              <StatCard label="Sesiones"            value={resumenPeriodo.sesiones} />
              <StatCard label="Page Views"          value={resumenPeriodo.pageviews} />
              <StatCard
                label="Tasa de conversión"
                value={resumenPeriodo.sesiones > 0 ? `${((embudo.llenaron_form / resumenPeriodo.sesiones) * 100).toFixed(1)}%` : '—'}
                sub={`${embudo.llenaron_form} prospectos total`}
              />
              <StatCard label="Nuevos" value={nvr.nuevos} sub={`${pct(nvr.nuevos, (nvr.nuevos || 0) + (nvr.recurrentes || 0))} del total`} />
              <StatCard label="Recurrentes" value={nvr.recurrentes} sub={`${pct(nvr.recurrentes, (nvr.nuevos || 0) + (nvr.recurrentes || 0))} del total`} />
            </div>

            {/* ── Grid fuentes + dispositivos ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              {/* Fuentes */}
              <div style={{ background: 'var(--bg-card, #111)', border: '1px solid var(--border, #2a2a2a)', borderRadius: 10, padding: 20 }}>
                <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600 }}>Fuente de origen</h3>
                {d.fuentes.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sin datos aún</p>}
                {d.fuentes.map(f => (
                  <div key={f.label} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span>{f.label}</span><span style={{ color: 'var(--text-muted)' }}>{f.count}</span>
                    </div>
                    <Bar count={f.count} max={maxFuente} />
                  </div>
                ))}
              </div>

              {/* Dispositivos */}
              <div style={{ background: 'var(--bg-card, #111)', border: '1px solid var(--border, #2a2a2a)', borderRadius: 10, padding: 20 }}>
                <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600 }}>Dispositivos</h3>
                {d.dispositivos.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sin datos aún</p>}
                {d.dispositivos.map(f => (
                  <div key={f.label} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span>{f.label}</span><span style={{ color: 'var(--text-muted)' }}>{f.count}</span>
                    </div>
                    <Bar count={f.count} max={maxDispositivo} color="#5b8dd9" />
                  </div>
                ))}
              </div>
            </div>

            {/* ── Ciudades ── */}
            <div style={{ background: 'var(--bg-card, #111)', border: '1px solid var(--border, #2a2a2a)', borderRadius: 10, padding: 20, marginBottom: 16 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600 }}>Top Ciudades</h3>
              {d.ciudades.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sin datos aún — los datos de ciudad se acumulan con el tiempo.</p>}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px 24px' }}>
                {d.ciudades.map(c => (
                  <div key={c.label} style={{ marginBottom: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 3 }}>
                      <span>{c.label}</span><span style={{ color: 'var(--text-muted)' }}>{c.count}</span>
                    </div>
                    <Bar count={c.count} max={maxCiudad} color="#16a34a" />
                  </div>
                ))}
              </div>
            </div>

            {/* ── Páginas más vistas ── */}
            <div style={{ background: 'var(--bg-card, #111)', border: '1px solid var(--border, #2a2a2a)', borderRadius: 10, padding: 20, marginBottom: 16 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600 }}>Páginas más vistas</h3>
              {d.paginas.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sin datos aún</p>}
              {d.paginas.length > 0 && (
                <div className="leads-table-wrap">
                  <table className="leads-table">
                    <thead>
                      <tr>
                        <th>Página</th>
                        <th style={{ textAlign: 'right' }}>Vistas</th>
                        <th style={{ textAlign: 'right' }}>T. promedio</th>
                        <th style={{ textAlign: 'right' }}>Scroll prom.</th>
                        <th style={{ textAlign: 'right' }}>Leyeron completo (≥80%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.paginas.map(p => (
                        <tr key={p.url}>
                          <td>
                            <span style={{ fontWeight: 600 }}>{p.titulo}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>{p.url}</span>
                          </td>
                          <td style={{ textAlign: 'right' }}>{p.vistas}</td>
                          <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{fmtTiempo(p.tiempo_promedio)}</td>
                          <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                            {p.url.startsWith('/reporte/') ? `${p.scroll_promedio}%` : '—'}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {p.url.startsWith('/reporte/') ? (
                              <span style={{ color: p.completos > 0 ? '#16a34a' : 'var(--text-muted)' }}>
                                {p.completos} ({pct(p.completos, p.vistas)})
                              </span>
                            ) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ── Embudo ── */}
            <div style={{ background: 'var(--bg-card, #111)', border: '1px solid var(--border, #2a2a2a)', borderRadius: 10, padding: 20 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600 }}>Embudo de conversión</h3>
              {[
                { label: 'Entran al sitio',          value: embudo.total_sesiones,   base: embudo.total_sesiones },
                { label: 'Leen al menos 1 reporte',  value: embudo.leyeron_reporte,  base: embudo.total_sesiones },
                { label: 'Leen reporte completo',    value: embudo.leyeron_completo, base: embudo.total_sesiones },
                { label: 'Ven Earnings',             value: embudo.vieron_earnings,  base: embudo.total_sesiones },
                { label: 'Llenan form GBM',          value: embudo.llenaron_form,    base: embudo.total_sesiones },
              ].map((step, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                    <span style={{ color: i === 4 ? '#A08040' : 'inherit', fontWeight: i === 4 ? 600 : 400 }}>{step.label}</span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {step.value ?? 0} <span style={{ marginLeft: 6 }}>({pct(step.value || 0, step.base || 1)})</span>
                    </span>
                  </div>
                  <Bar
                    count={step.value || 0}
                    max={step.base || 1}
                    color={i === 4 ? '#A08040' : `hsl(${200 - i * 30}, 60%, 55%)`}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

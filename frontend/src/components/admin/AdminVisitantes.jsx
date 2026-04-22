import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const BASE = import.meta.env.VITE_API_URL || '/api';

function authHeaders() {
  const token = localStorage.getItem('portal_admin_token');
  return { Authorization: `Bearer ${token}` };
}

function scoreColor(score) {
  if (score >= 60) return { bg: 'rgba(22,163,74,.15)', color: 'var(--green)', border: 'rgba(22,163,74,.3)' };
  if (score >= 30) return { bg: 'rgba(202,138,4,.15)',  color: 'var(--amber)', border: 'rgba(202,138,4,.3)' };
  if (score >= 10) return { bg: 'rgba(99,149,210,.12)', color: '#6395D2',      border: 'rgba(99,149,210,.25)' };
  return               { bg: 'var(--bg-alt)',            color: 'var(--text-faint)', border: 'var(--border)' };
}

function fmtTiempo(seg) {
  if (!seg || seg < 1) return '—';
  if (seg < 60) return `${seg}s`;
  return `${Math.floor(seg / 60)}m ${seg % 60}s`;
}

function fmtFecha(str) {
  if (!str) return '—';
  const d = new Date(str.replace(' ', 'T') + 'Z');
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diff === 0) return 'hoy';
  if (diff === 1) return 'ayer';
  if (diff < 7)  return `hace ${diff} días`;
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
}

function shortId(id) {
  if (!id) return '—';
  return id.slice(0, 8) + '…';
}

function NavAdmin({ active }) {
  const navigate = useNavigate();
  const logout = () => { localStorage.removeItem('portal_admin_token'); navigate('/admin/login'); };
  return (
    <header className="admin-header">
      <div className="admin-header-left">
        <img src="/murza-logo.png" alt="Murza" className="admin-logo" />
        <nav className="admin-nav">
          <Link to="/admin/reportes"    className="admin-nav-link">Reportes</Link>
          <Link to="/admin/leads"       className="admin-nav-link">Leads</Link>
          <Link to="/admin/prospectos"  className="admin-nav-link">Prospectos GBM</Link>
          <Link to="/admin/solicitudes" className="admin-nav-link">Solicitudes</Link>
          <Link to="/admin/analytics"   className="admin-nav-link">Analytics</Link>
          <Link to="/admin/visitantes"  className={`admin-nav-link${active === 'visitantes' ? ' active' : ''}`}>Visitantes</Link>
        </nav>
      </div>
      <button className="btn-ghost-sm" onClick={logout}>Salir</button>
    </header>
  );
}

const PERIODOS = [
  { key: 'hoy',    label: 'Hoy' },
  { key: 'semana', label: '7 días' },
  { key: 'mes',    label: '30 días' },
  { key: 'total',  label: 'Total' },
];

export default function AdminVisitantes() {
  const navigate    = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(0);
  const [periodo, setPeriodo] = useState('total');
  const PER_PAGE = 50;

  useEffect(() => {
    setLoading(true);
    setPage(0);
    fetch(`${BASE}/admin/visitantes?limit=500&periodo=${periodo}`, { headers: authHeaders() })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setData)
      .catch(() => navigate('/admin/login'))
      .finally(() => setLoading(false));
  }, [periodo]);

  const visitantes  = data?.visitantes || [];
  const total       = visitantes.length;
  const start       = page * PER_PAGE;
  const slice       = visitantes.slice(start, start + PER_PAGE);
  const totalPages  = Math.ceil(total / PER_PAGE);

  const prospectos  = visitantes.filter(v => v.es_prospecto).length;
  const scoreAlto   = visitantes.filter(v => v.score >= 60).length;

  return (
    <div className="admin-page">
      <NavAdmin active="visitantes" />

      <main className="admin-main">
        <div className="admin-section-header" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Visitantes</h2>
            {data && (
              <div style={{ display: 'flex', gap: 12, fontSize: 13, color: 'var(--text-muted)', alignItems: 'center' }}>
                <span><strong style={{ color: 'var(--text)' }}>{total}</strong> únicos</span>
                <span><strong style={{ color: 'var(--green)' }}>{prospectos}</strong> leads</span>
                <span><strong style={{ color: 'var(--gold)' }}>{scoreAlto}</strong> score ≥ 60</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {PERIODOS.map(p => (
              <button key={p.key} className={`btn-filtro${periodo === p.key ? ' active' : ''}`} onClick={() => setPeriodo(p.key)}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {loading && <div className="loading-state">Cargando visitantes...</div>}

        {!loading && data && (
          <>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Score</th>
                    <th>Visitor ID</th>
                    <th>Ciudad / País</th>
                    <th>Fuente</th>
                    <th>Dispositivo</th>
                    <th style={{ textAlign: 'right' }}>Reportes</th>
                    <th style={{ textAlign: 'right' }}>Sesiones</th>
                    <th style={{ textAlign: 'right' }}>Días</th>
                    <th style={{ textAlign: 'right' }}>Tiempo</th>
                    <th>Última visita</th>
                    <th>Lead</th>
                  </tr>
                </thead>
                <tbody>
                  {slice.map(v => {
                    const sc = scoreColor(v.score);
                    return (
                      <tr key={v.visitor_id} style={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/admin/visitantes/${v.visitor_id}`)}>
                        <td>
                          <span style={{
                            display: 'inline-block', minWidth: 38, textAlign: 'center',
                            padding: '3px 8px', borderRadius: 6, fontWeight: 800, fontSize: 14,
                            background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                          }}>{v.score}</span>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}
                                title={v.visitor_id}>{shortId(v.visitor_id)}</span>
                        </td>
                        <td style={{ fontSize: 13 }}>
                          {v.ciudad ? (
                            <span>{v.ciudad}{v.pais && v.pais !== 'México' ? `, ${v.pais}` : ''}</span>
                          ) : (
                            <span style={{ color: 'var(--text-faint)' }}>{v.pais || '—'}</span>
                          )}
                          {v.es_proxy ? <span style={{ fontSize: 10, color: '#888', marginLeft: 4 }}>VPN</span> : null}
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--text-warm)' }}>{v.fuente || '—'}</td>
                        <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{v.dispositivo || '—'}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: v.reportes_leidos > 0 ? 'var(--gold-dark)' : 'var(--text-faint)' }}>
                          {v.reportes_leidos}
                        </td>
                        <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{v.total_sesiones}</td>
                        <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{v.total_dias}</td>
                        <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{fmtTiempo(v.tiempo_total_seg)}</td>
                        <td style={{ fontSize: 12, color: 'var(--text-faint)' }}>{fmtFecha(v.ultima_visita)}</td>
                        <td>
                          {v.es_prospecto ? (
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)',
                              background: 'rgba(22,163,74,.12)', border: '1px solid rgba(22,163,74,.25)',
                              padding: '2px 7px', borderRadius: 4 }}>LEAD</span>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, justifyContent: 'center' }}>
                <button className="btn-ghost-sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                  ← Anterior
                </button>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {page + 1} / {totalPages}
                </span>
                <button className="btn-ghost-sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}>
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

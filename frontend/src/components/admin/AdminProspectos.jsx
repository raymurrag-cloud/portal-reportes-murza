import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api.js';

export default function AdminProspectos() {
  const navigate = useNavigate();
  const [prospectos, setProspectos] = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    api.adminGetProspectos()
      .then(setProspectos)
      .catch(() => navigate('/admin/login'))
      .finally(() => setLoading(false));
  }, []);

  const logout = () => {
    localStorage.removeItem('portal_admin_token');
    navigate('/admin/login');
  };

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="admin-header-left">
          <img src="/murza-logo.png" alt="Murza" className="admin-logo" />
          <nav className="admin-nav">
            <Link to="/admin/reportes"    className="admin-nav-link">Reportes</Link>
            <Link to="/admin/leads"       className="admin-nav-link">Leads</Link>
            <Link to="/admin/prospectos"  className="admin-nav-link active">Prospectos GBM</Link>
            <Link to="/admin/solicitudes" className="admin-nav-link">Solicitudes</Link>
          </nav>
        </div>
        <button className="btn-ghost-sm" onClick={logout}>Salir</button>
      </header>

      <main className="admin-main">
        <div className="admin-section-header">
          <h1 className="admin-title">Prospectos GBM</h1>
          <span className="admin-badge">{prospectos.length} prospectos</span>
        </div>

        {loading && <div className="loading-state">Cargando...</div>}
        {!loading && prospectos.length === 0 && (
          <div className="empty-state">No hay prospectos todavia.</div>
        )}

        {!loading && prospectos.length > 0 && (
          <div className="leads-table-wrap">
            <table className="leads-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Telefono</th>
                  <th>Portafolio</th>
                  <th>Ubicacion</th>
                  <th>Dispositivo</th>
                  <th>Origen</th>
                  <th>Comportamiento</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {prospectos.map(p => {
                  // Formatear paginas visitadas
                  let paginasResumen = '—';
                  try {
                    const pags = JSON.parse(p.paginas_json || '[]');
                    if (pags.length > 0) {
                      paginasResumen = pags.map(pg => {
                        const t = pg.tiempo_seg >= 60
                          ? `${Math.floor(pg.tiempo_seg/60)}m${pg.tiempo_seg%60}s`
                          : `${pg.tiempo_seg||0}s`;
                        const scroll = pg.scroll_max ? ` ${pg.scroll_max}%` : '';
                        return `${pg.titulo} (${t}${scroll})`;
                      }).join(' → ');
                    }
                  } catch (_) {}

                  const tiempoTotal = p.tiempo_total_seg >= 60
                    ? `${Math.floor(p.tiempo_total_seg/60)}m ${p.tiempo_total_seg%60}s`
                    : `${p.tiempo_total_seg||0}s`;

                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>
                        {p.nombre}
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>{p.correo}</div>
                      </td>
                      <td>{p.telefono}</td>
                      <td>{p.valor_portafolio}</td>
                      <td style={{ fontSize: 13 }}>
                        {p.ciudad && p.estado ? `${p.ciudad}, ${p.estado}` : p.ciudad || p.estado || '—'}
                      </td>
                      <td style={{ fontSize: 13 }}>
                        {p.dispositivo || '—'}
                        {p.sistema_os && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.sistema_os}</div>}
                      </td>
                      <td style={{ fontSize: 13 }}>
                        {p.fuente || '—'}
                        {p.campana && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.campana}</div>}
                      </td>
                      <td style={{ fontSize: 12, maxWidth: 280 }}>
                        <div style={{ color: p.visita_recurrente ? '#16A34A' : 'var(--text-muted)' }}>
                          {p.visita_recurrente ? `Recurrente (hace ${p.dias_ultima_visita ?? '?'} dias)` : 'Primera visita'}
                        </div>
                        <div style={{ color: 'var(--text-muted)' }}>Tiempo: {tiempoTotal}</div>
                        <div style={{ color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>{paginasResumen}</div>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                        {new Date(p.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api.js';

export default function AdminSolicitudes() {
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    api.adminGetSolicitudes()
      .then(setSolicitudes)
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
            <Link to="/admin/reportes"     className="admin-nav-link">Reportes</Link>
            <Link to="/admin/leads"        className="admin-nav-link">Leads</Link>
            <Link to="/admin/prospectos"  className="admin-nav-link">Prospectos GBM</Link>
            <Link to="/admin/solicitudes"  className="admin-nav-link active">Solicitudes</Link>
          </nav>
        </div>
        <button className="btn-ghost-sm" onClick={logout}>Salir</button>
      </header>

      <main className="admin-main">
        <div className="admin-section-header">
          <h1 className="admin-title">Solicitudes de reportes</h1>
          <span className="admin-badge">{solicitudes.length} solicitudes</span>
        </div>

        {loading && <div className="loading-state">Cargando...</div>}
        {!loading && solicitudes.length === 0 && (
          <div className="empty-state">No hay solicitudes todavia.</div>
        )}

        {!loading && solicitudes.length > 0 && (
          <div className="leads-table-wrap">
            <table className="leads-table">
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Ticker</th>
                  <th>Email</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {solicitudes.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.empresa}</td>
                    <td>{s.ticker || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td>{s.email || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                      {new Date(s.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

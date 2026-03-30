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
                  <th>Correo</th>
                  <th>Portafolio</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {prospectos.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.nombre}</td>
                    <td>{p.telefono}</td>
                    <td>{p.correo}</td>
                    <td>{p.valor_portafolio}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                      {new Date(p.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}
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

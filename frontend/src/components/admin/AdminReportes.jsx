import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api.js';

export default function AdminReportes() {
  const navigate = useNavigate();
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading]   = useState(true);

  const cargar = () => {
    setLoading(true);
    api.adminGetReportes()
      .then(setReportes)
      .catch(() => navigate('/admin/login'))
      .finally(() => setLoading(false));
  };

  useEffect(cargar, []);

  const togglePublicar = async (id) => {
    const { publicado } = await api.adminTogglePublicar(id);
    setReportes(prev => prev.map(r => r.id === id ? { ...r, publicado } : r));
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar este borrador?')) return;
    await api.adminEliminarReporte(id);
    setReportes(prev => prev.filter(r => r.id !== id));
  };

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
            <Link to="/admin/reportes"    className="admin-nav-link active">Reportes</Link>
            <Link to="/admin/leads"       className="admin-nav-link">Leads</Link>
            <Link to="/admin/prospectos"  className="admin-nav-link">Prospectos GBM</Link>
            <Link to="/admin/solicitudes" className="admin-nav-link">Solicitudes</Link>
          </nav>
        </div>
        <button className="btn-ghost-sm" onClick={logout}>Salir</button>
      </header>

      <main className="admin-main">
        <div className="admin-section-header">
          <h2>Reportes</h2>
          <Link to="/admin/reportes/nuevo" className="btn-primary">+ Nuevo reporte</Link>
        </div>

        {loading && <div className="loading-state">Cargando...</div>}

        {!loading && (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th>Empresa</th>
                  <th>Párrafos gratis</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reportes.map(r => (
                  <tr key={r.id}>
                    <td><span className="ticker-badge">{r.ticker}</span></td>
                    <td>{r.empresa}</td>
                    <td className="center">{r.parrafos_gratis}</td>
                    <td>
                      <span className={`status-badge ${r.publicado ? 'published' : 'draft'}`}>
                        {r.publicado ? 'Publicado' : 'Borrador'}
                      </span>
                    </td>
                    <td>{r.created_at?.slice(0, 10)}</td>
                    <td className="actions-cell">
                      <Link to={`/admin/reportes/${r.id}`} className="btn-table">Editar</Link>
                      <button
                        className={`btn-table ${r.publicado ? 'warning' : 'success'}`}
                        onClick={() => togglePublicar(r.id)}
                      >
                        {r.publicado ? 'Despublicar' : 'Publicar'}
                      </button>
                      {!r.publicado && (
                        <button className="btn-table danger" onClick={() => eliminar(r.id)}>Eliminar</button>
                      )}
                    </td>
                  </tr>
                ))}
                {reportes.length === 0 && (
                  <tr><td colSpan={6} className="empty-row">Sin reportes aún. Crea el primero.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

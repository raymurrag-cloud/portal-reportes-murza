import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api.js';

const CAPITAL_LABELS = {
  menos_500k: '< $500K',
  '500k_1m':  '$500K — $1M',
  '1m_3m':    '$1M — $3M',
  mas_3m:     '> $3M',
};

export default function AdminLeads() {
  const navigate = useNavigate();
  const [leads, setLeads]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todos');

  useEffect(() => {
    api.adminGetLeads()
      .then(setLeads)
      .catch(() => navigate('/admin/login'))
      .finally(() => setLoading(false));
  }, []);

  const leadsFiltrados = leads.filter(l => {
    if (filtro === 'calificados') return ['1m_3m', 'mas_3m'].includes(l.capital_disponible);
    if (filtro === 'con_inversiones') return l.tiene_inversiones === 1;
    return true;
  });

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="admin-header-left">
          <img src="/murza-logo.png" alt="Murza" className="admin-logo" />
          <nav className="admin-nav">
            <Link to="/admin/reportes"    className="admin-nav-link">Reportes</Link>
            <Link to="/admin/leads"       className="admin-nav-link active">Leads</Link>
            <Link to="/admin/solicitudes" className="admin-nav-link">Solicitudes</Link>
          </nav>
        </div>
        <button className="btn-ghost-sm" onClick={() => { localStorage.removeItem('portal_admin_token'); navigate('/admin/login'); }}>Salir</button>
      </header>

      <main className="admin-main">
        <div className="admin-section-header">
          <h2>Leads registrados <span className="count-badge">{leads.length}</span></h2>
          <div className="filtros">
            {['todos', 'calificados', 'con_inversiones'].map(f => (
              <button
                key={f}
                className={`btn-filtro ${filtro === f ? 'active' : ''}`}
                onClick={() => setFiltro(f)}
              >
                {f === 'todos' ? 'Todos' : f === 'calificados' ? '+$1M' : 'Con inversiones'}
              </button>
            ))}
          </div>
        </div>

        {loading && <div className="loading-state">Cargando...</div>}

        {!loading && (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Teléfono</th>
                  <th>Ciudad</th>
                  <th>¿Invierte?</th>
                  <th>Capital disponible</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {leadsFiltrados.map(l => (
                  <tr key={l.id} className={['1m_3m','mas_3m'].includes(l.capital_disponible) ? 'row-qualified' : ''}>
                    <td>{l.nombre}</td>
                    <td><a href={`mailto:${l.correo}`}>{l.correo}</a></td>
                    <td>{l.telefono || '—'}</td>
                    <td>{l.ciudad || '—'}</td>
                    <td className="center">{l.tiene_inversiones ? '✅' : '—'}</td>
                    <td>
                      <span className={`capital-badge cap-${l.capital_disponible}`}>
                        {CAPITAL_LABELS[l.capital_disponible] || l.capital_disponible}
                      </span>
                    </td>
                    <td>{l.created_at?.slice(0, 10)}</td>
                  </tr>
                ))}
                {leadsFiltrados.length === 0 && (
                  <tr><td colSpan={7} className="empty-row">Sin leads aún.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

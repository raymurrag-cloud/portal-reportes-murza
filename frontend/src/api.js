const BASE = import.meta.env.VITE_API_URL || '/api';

function getToken(type = 'user') {
  return localStorage.getItem(type === 'admin' ? 'portal_admin_token' : 'portal_user_token');
}

async function req(method, path, body, tokenType = 'user') {
  const token = getToken(tokenType);
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Error en la solicitud');
  return data;
}

// ── Auth ───────────────────────────────────────────────────────────────────
export const api = {
  // Admin
  adminLogin: (body)      => req('POST', '/auth/admin/login', body, 'admin'),

  // Usuarios
  registro:   (body)      => req('POST', '/auth/registro', body),
  login:      (body)      => req('POST', '/auth/login', body),

  // Reportes públicos
  getReportes:    (ticker) => req('GET', `/reportes${ticker ? `?ticker=${ticker}` : ''}`),
  getReporte:     (slug)   => req('GET', `/reportes/${slug}`),
  getReporteCompleto: (slug) => req('GET', `/reportes/${slug}/completo`),

  // Admin — reportes
  adminGetReportes:   ()     => req('GET',    '/admin/reportes', null, 'admin'),
  adminGetReporte:    (id)   => req('GET',    `/admin/reportes/${id}`, null, 'admin'),
  adminCrearReporte:  (body) => req('POST',   '/admin/reportes', body, 'admin'),
  adminEditarReporte: (id, body) => req('PUT', `/admin/reportes/${id}`, body, 'admin'),
  adminTogglePublicar:(id)   => req('PATCH',  `/admin/reportes/${id}/publicar`, {}, 'admin'),
  adminEliminarReporte:(id)  => req('DELETE', `/admin/reportes/${id}`, null, 'admin'),

  // Admin — leads
  adminGetLeads: () => req('GET', '/admin/leads', null, 'admin'),
};

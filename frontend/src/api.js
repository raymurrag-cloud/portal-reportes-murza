const BASE = import.meta.env.VITE_API_URL || '/api';

function getToken(type = 'user') {
  return localStorage.getItem(type === 'admin' ? 'portal_admin_token' : 'portal_user_token');
}

const wait = (ms) => new Promise(r => setTimeout(r, ms));

async function req(method, path, body, tokenType = 'user', { retries = 0, retryDelay = 8000 } = {}) {
  const token = getToken(tokenType);
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
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
    } catch (err) {
      if (attempt < retries) {
        await wait(retryDelay);
      } else {
        throw err;
      }
    }
  }
}

// ── Auth ───────────────────────────────────────────────────────────────────
export const api = {
  // Admin
  adminLogin: (body)      => req('POST', '/auth/admin/login', body, 'admin'),

  // Usuarios
  registro:   (body)      => req('POST', '/auth/registro', body),
  login:      (body)      => req('POST', '/auth/login', body),

  // Reportes públicos
  getReportes:    (ticker) => req('GET', `/reportes${ticker ? `?ticker=${ticker}` : ''}`, null, 'user', { retries: 4, retryDelay: 8000 }),
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

  // Solicitudes de reportes
  solicitarReporte: (body) => req('POST', '/solicitudes', body),
  adminGetSolicitudes: () => req('GET', '/admin/solicitudes', null, 'admin'),

  // Prospectos GBM
  enviarProspectoGBM: (body) => req('POST', '/prospectos-gbm', body),
  adminGetProspectos: () => req('GET', '/admin/prospectos', null, 'admin'),
};

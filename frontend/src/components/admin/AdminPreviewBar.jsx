import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ADMIN_MODE_KEY = 'mz_admin_mode';
const BAR_H = 40;

export default function AdminPreviewBar() {
  const location = useLocation();
  const navigate  = useNavigate();
  const [trackOff, setTrackOff] = useState(() => localStorage.getItem(ADMIN_MODE_KEY) === '1');

  // Solo visible en páginas públicas del portal, no en admin
  if (location.pathname.startsWith('/admin')) return null;

  // Solo visible si hay sesión admin activa
  const token = localStorage.getItem('portal_admin_token');
  if (!token) return null;

  const toggleTrack = () => {
    const next = !trackOff;
    if (next) localStorage.setItem(ADMIN_MODE_KEY, '1');
    else localStorage.removeItem(ADMIN_MODE_KEY);
    setTrackOff(next);
  };

  return (
    <>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
        height: BAR_H,
        background: '#0D0900',
        borderBottom: '2px solid #A08040',
        display: 'flex', alignItems: 'center',
        padding: '0 20px', gap: 12,
      }}>
        {/* Badge */}
        <span style={{
          fontSize: 10, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase',
          color: '#A08040', background: 'rgba(160,128,64,.15)',
          border: '1px solid rgba(160,128,64,.35)', padding: '3px 9px', borderRadius: 4,
          flexShrink: 0,
        }}>
          Vista Admin
        </span>

        {/* Página actual */}
        <span style={{ fontSize: 12, color: '#4A4030', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {location.pathname}
        </span>

        {/* Toggle tracking */}
        <button
          onClick={toggleTrack}
          title={trackOff ? 'Tu visita NO se está registrando — click para activar' : 'Tu visita SÍ se está registrando — click para silenciar'}
          style={{
            fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 5, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
            background: trackOff ? 'rgba(202,138,4,.12)' : 'rgba(255,255,255,.04)',
            border: `1px solid ${trackOff ? 'rgba(202,138,4,.35)' : 'rgba(255,255,255,.08)'}`,
            color: trackOff ? '#CA8A04' : '#555',
          }}
        >
          <span style={{
            width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
            background: trackOff ? '#CA8A04' : '#333',
            boxShadow: trackOff ? '0 0 5px #CA8A04' : 'none',
          }} />
          {trackOff ? 'Visita no registrada' : 'Registrando visita'}
        </button>

        {/* Volver al panel */}
        <button
          onClick={() => navigate('/admin/analytics')}
          style={{
            fontSize: 12, fontWeight: 700, padding: '5px 16px', borderRadius: 5, cursor: 'pointer',
            flexShrink: 0,
            background: 'rgba(160,128,64,.15)', border: '1px solid rgba(160,128,64,.35)',
            color: '#A08040',
          }}
        >
          ← Panel Admin
        </button>
      </div>

      {/* Espaciador para que el contenido no quede tapado */}
      <div style={{ height: BAR_H }} />
    </>
  );
}

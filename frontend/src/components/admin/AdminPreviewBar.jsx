import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const BAR_H = 36;

export default function AdminPreviewBar() {
  const location = useLocation();
  const navigate  = useNavigate();

  if (location.pathname.startsWith('/admin')) return null;
  if (!localStorage.getItem('portal_admin_token')) return null;

  return (
    <>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
        height: BAR_H,
        background: '#0D0900',
        borderBottom: '2px solid #A08040',
        display: 'flex', alignItems: 'center',
        padding: '0 20px', gap: 14,
      }}>
        <span style={{
          fontSize: 10, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase',
          color: '#A08040', background: 'rgba(160,128,64,.15)',
          border: '1px solid rgba(160,128,64,.35)', padding: '3px 9px', borderRadius: 4,
          flexShrink: 0,
        }}>
          Vista Admin
        </span>

        <span style={{ fontSize: 12, color: '#4A4030', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {location.pathname}
        </span>

        <button
          onClick={() => navigate('/admin/analytics')}
          style={{
            fontSize: 12, fontWeight: 700, padding: '4px 16px', borderRadius: 5, cursor: 'pointer',
            flexShrink: 0,
            background: 'rgba(160,128,64,.15)', border: '1px solid rgba(160,128,64,.35)',
            color: '#A08040',
          }}
        >
          ← Panel Admin
        </button>
      </div>

      <div style={{ height: BAR_H }} />
    </>
  );
}

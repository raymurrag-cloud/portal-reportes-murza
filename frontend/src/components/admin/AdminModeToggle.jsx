import React, { useState } from 'react';

const KEY = 'mz_admin_mode';

export function AdminModeToggle() {
  const [on, setOn] = useState(() => localStorage.getItem(KEY) === '1');

  const toggle = () => {
    const next = !on;
    if (next) localStorage.setItem(KEY, '1');
    else localStorage.removeItem(KEY);
    setOn(next);
  };

  return (
    <button
      onClick={toggle}
      title={on ? 'Modo admin activo — tus visitas al portal NO se registran' : 'Modo admin inactivo — tus visitas al portal SÍ se registran'}
      style={{
        fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 6, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 6, border: 'none',
        background: on ? 'rgba(202,138,4,.15)' : 'var(--bg-alt)',
        outline: `1px solid ${on ? 'rgba(202,138,4,.4)' : 'var(--border)'}`,
        color: on ? 'var(--amber)' : 'var(--text-faint)',
        transition: 'all .2s',
      }}
    >
      <span style={{
        width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
        background: on ? 'var(--amber)' : 'var(--border)',
        boxShadow: on ? '0 0 4px var(--amber)' : 'none',
        transition: 'all .2s',
      }} />
      Admin {on ? 'ON' : 'OFF'}
    </button>
  );
}

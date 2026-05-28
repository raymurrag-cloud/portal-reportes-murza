import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '../../api.js';

const BASE = import.meta.env.VITE_API_URL || 'https://portal-reportes-murza.onrender.com';

function parseIbXml(xmlText) {
  function num(v) { const n = parseFloat(v); return isNaN(n) ? null : n; }
  function parseDate(s) {
    if (!s || s.length < 8) return null;
    return `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`;
  }
  function parseDateTime(s) {
    if (!s) return null;
    const [d, t] = s.split(';');
    const date = parseDate(d);
    if (!date) return null;
    return t?.length >= 6 ? `${date} ${t.slice(0,2)}:${t.slice(2,4)}:${t.slice(4,6)}` : date;
  }

  const doc = new DOMParser().parseFromString(xmlText, 'text/xml');

  const trades = Array.from(doc.querySelectorAll('Trade'))
    .filter(t => !t.getAttribute('levelOfDetail') || t.getAttribute('levelOfDetail') === 'EXECUTION')
    .map(t => ({
      trade_id:    t.getAttribute('tradeID'),
      symbol:      t.getAttribute('symbol'),
      description: t.getAttribute('description'),
      asset_cat:   t.getAttribute('assetCategory'),
      trade_date:  parseDate(t.getAttribute('tradeDate')),
      datetime:    parseDateTime(t.getAttribute('dateTime')),
      buy_sell:    t.getAttribute('buySell'),
      quantity:    num(t.getAttribute('quantity')),
      price:       num(t.getAttribute('tradePrice')),
      proceeds:    num(t.getAttribute('proceeds')),
      commission:  num(t.getAttribute('ibCommission')),
      net_cash:    num(t.getAttribute('netCash')),
      cost_basis:  num(t.getAttribute('costBasis')),
      realized_pl: num(t.getAttribute('realizedPL')),
      open_close:  t.getAttribute('openCloseIndicator'),
      currency:    t.getAttribute('currency') || 'USD',
      exchange:    t.getAttribute('exchange'),
    }));

  const positions = Array.from(doc.querySelectorAll('OpenPosition')).map(p => ({
    symbol:         p.getAttribute('symbol'),
    description:    p.getAttribute('description'),
    asset_cat:      p.getAttribute('assetCategory'),
    quantity:       num(p.getAttribute('quantity')),
    mark_price:     num(p.getAttribute('markPrice')),
    position_value: num(p.getAttribute('positionValue')),
    open_price:     num(p.getAttribute('openPrice')),
    cost_basis:     num(p.getAttribute('costBasisPrice')),
    unrealized_pl:  num(p.getAttribute('unrealizedPnL')),
    pct_nav:        num(p.getAttribute('percentOfNAV')),
    side:           p.getAttribute('side'),
    open_datetime:  parseDateTime(p.getAttribute('openDateTime')),
    currency:       p.getAttribute('currency') || 'USD',
    report_date:    parseDate(p.getAttribute('reportDate')),
  }));

  const totalEl = Array.from(doc.querySelectorAll('NetAssetValue'))
    .find(n => n.getAttribute('assetCategory') === 'Total');
  const nav = totalEl ? {
    report_date: parseDate(totalEl.getAttribute('reportDate')) || new Date().toISOString().slice(0,10),
    total_nav:   num(totalEl.getAttribute('total')),
    cash:        num(totalEl.getAttribute('cash')),
    stock:       num(totalEl.getAttribute('stock')),
  } : null;

  return { trades, positions, nav };
}

const NAV_LINK = {
  padding: '6px 14px', borderRadius: 8, fontSize: 14, fontWeight: 500,
  color: 'var(--text-muted)', textDecoration: 'none', background: 'none',
  transition: 'all 0.15s',
};

function fmt$(n, decimals = 0) {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: decimals }).format(n);
}
function fmtPct(n) {
  if (n == null) return '—';
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}
function fmtDate(s) {
  if (!s) return '—';
  const d = new Date(s + (s.length === 10 ? 'T12:00:00' : ''));
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Summary card ────────────────────────────────────────────────────────────
function SummaryCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: 'var(--card-bg)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '18px 22px', flex: '1 1 180px', minWidth: 160,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-faint)', textTransform: 'uppercase', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || 'var(--text)', fontFamily: "'Georgia', serif", letterSpacing: '-0.02em' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ─── Tabla de posiciones ─────────────────────────────────────────────────────
function PositionsTab({ positions, summary, navData }) {
  const initial = summary?.total_nav && summary?.stocks_value
    ? summary.total_nav - summary.unrealized_pl
    : null;
  const totalPctGain = initial && initial > 0
    ? ((summary.unrealized_pl / initial) * 100)
    : null;

  const chartData = navData.map(n => ({
    fecha: n.report_date?.slice(5),
    nav:   n.total_nav ? Math.round(n.total_nav) : null,
  })).filter(n => n.nav);

  return (
    <div>
      {/* Mini gráfica NAV */}
      {chartData.length >= 2 && (
        <div style={{
          background: 'var(--card-bg)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '20px 20px 10px', marginBottom: 24,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 16, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Valor de la cuenta (NAV)
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={chartData}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="fecha" tick={{ fill: 'var(--text-faint)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-faint)', fontSize: 11 }} axisLine={false} tickLine={false} width={72}
                tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
              <Tooltip
                contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }}
                formatter={v => [fmt$(v), 'NAV']} />
              <Line type="monotone" dataKey="nav" stroke="#A08040" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tabla */}
      {positions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)', fontSize: 15 }}>
          Sin posiciones abiertas actualmente.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Ticker', 'Nombre', 'Acciones', 'Entrada', 'Precio actual', 'P&L $', 'P&L %', '% Portafolio'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: h === 'Ticker' || h === 'Nombre' ? 'left' : 'right', fontWeight: 700, fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {positions.map(p => {
                const pl = p.unrealized_pl || 0;
                const plPct = p.cost_basis && p.cost_basis > 0 ? (pl / (p.cost_basis * Math.abs(p.quantity))) * 100 : null;
                const color = pl > 0 ? '#16A34A' : pl < 0 ? '#DC2626' : 'var(--text-muted)';
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-alt)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 12px', fontWeight: 700, color: 'var(--text)', fontFamily: 'monospace', fontSize: 13 }}>
                      {p.symbol}
                    </td>
                    <td style={{ padding: '12px 12px', color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.description || '—'}
                    </td>
                    <td style={{ padding: '12px 12px', textAlign: 'right', color: 'var(--text)' }}>
                      {p.quantity}
                    </td>
                    <td style={{ padding: '12px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>
                      {fmt$(p.open_price, 2)}
                    </td>
                    <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--text)' }}>
                      {fmt$(p.mark_price, 2)}
                    </td>
                    <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: 700, color }}>
                      {pl >= 0 ? '+' : ''}{fmt$(pl, 2)}
                    </td>
                    <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: 700, color }}>
                      {plPct != null ? fmtPct(plPct) : '—'}
                    </td>
                    <td style={{ padding: '12px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>
                      {p.pct_nav ? `${p.pct_nav.toFixed(1)}%` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Historial de trades ──────────────────────────────────────────────────────
function TradesTab({ trades, total, adminToken, onRefresh }) {
  const [editingId, setEditingId] = useState(null);
  const [noteVal, setNoteVal]     = useState('');
  const [saving, setSaving]       = useState(false);

  async function saveNote(id) {
    setSaving(true);
    await fetch(`${BASE}/api/portafolio/trades/${id}/note`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({ note: noteVal }),
    });
    setSaving(false);
    setEditingId(null);
    onRefresh();
  }

  if (trades.length === 0) return (
    <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)', fontSize: 15 }}>
      Sin historial de operaciones. Corre el sync para importar trades de IB.
    </div>
  );

  return (
    <div>
      <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 16 }}>
        {total} operaciones en total
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {trades.map(t => {
          const isBuy = t.buy_sell === 'BUY';
          const pl    = t.realized_pl;
          const plColor = pl > 0 ? '#16A34A' : pl < 0 ? '#DC2626' : 'var(--text-faint)';
          return (
            <div key={t.id} style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '14px 18px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                {/* Badge compra/venta */}
                <span style={{
                  padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                  background: isBuy ? 'rgba(22,163,74,0.12)' : 'rgba(220,38,38,0.10)',
                  color: isBuy ? '#16A34A' : '#DC2626',
                  border: `1px solid ${isBuy ? 'rgba(22,163,74,0.25)' : 'rgba(220,38,38,0.20)'}`,
                }}>
                  {t.buy_sell}
                </span>

                {/* Ticker */}
                <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
                  {t.symbol}
                </span>

                {/* Detalles */}
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  {Math.abs(t.quantity)} acciones
                </span>
                <span style={{ color: 'var(--text)', fontWeight: 600, fontSize: 13 }}>
                  @ {fmt$(t.price, 2)}
                </span>

                {/* P&L realizado */}
                {pl != null && (
                  <span style={{ marginLeft: 'auto', fontWeight: 700, fontSize: 13, color: plColor }}>
                    {pl >= 0 ? '+' : ''}{fmt$(pl, 2)}
                  </span>
                )}

                {/* Fecha */}
                <span style={{ color: 'var(--text-faint)', fontSize: 12, whiteSpace: 'nowrap' }}>
                  {fmtDate(t.trade_date)}
                </span>
              </div>

              {/* Nota de tesis */}
              {editingId === t.id ? (
                <div style={{ marginTop: 10 }}>
                  <textarea
                    value={noteVal}
                    onChange={e => setNoteVal(e.target.value)}
                    rows={2}
                    placeholder="Ej: Compramos por earnings beat Q1 + momentum alcista en IA..."
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: 8,
                      background: 'var(--bg-alt)', border: '1px solid var(--border)',
                      color: 'var(--text)', fontSize: 13, resize: 'none', outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <button onClick={() => saveNote(t.id)} disabled={saving} style={{
                      padding: '5px 14px', borderRadius: 6, border: 'none',
                      background: 'var(--gold)', color: '#1a1510', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    }}>
                      {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button onClick={() => setEditingId(null)} style={{
                      padding: '5px 12px', borderRadius: 6, background: 'transparent',
                      border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer',
                    }}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: t.note ? 8 : 0, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  {t.note ? (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', flex: 1 }}>
                      Tesis: {t.note}
                    </div>
                  ) : null}
                  {adminToken && (
                    <button
                      onClick={() => { setEditingId(t.id); setNoteVal(t.note || ''); }}
                      style={{
                        fontSize: 11, color: 'var(--gold)', background: 'none', border: 'none',
                        cursor: 'pointer', padding: '2px 0', marginTop: t.note ? 2 : 6, flexShrink: 0,
                      }}>
                      {t.note ? 'Editar tesis' : '+ Agregar tesis'}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Chat ─────────────────────────────────────────────────────────────────────
function ChatTab() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hola. Tengo acceso completo al portafolio de paper trading: posiciones actuales, historial de operaciones y las tesis de cada trade. ¿Qué quieres saber?' }
  ]);
  const [input, setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/api/portafolio/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages.filter(m => m.role !== 'assistant' || newMessages.indexOf(m) > 0) }),
      });
      const data = await r.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'Error al responder.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error de conexión. Intenta de nuevo.' }]);
    }
    setLoading(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 520 }}>
      {/* Mensajes */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 8 }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
          }}>
            <div style={{
              maxWidth: '78%', padding: '12px 16px', borderRadius: 12, fontSize: 14, lineHeight: 1.6,
              background: m.role === 'user' ? 'rgba(160,128,64,0.15)' : 'var(--card-bg)',
              border: `1px solid ${m.role === 'user' ? 'rgba(160,128,64,0.30)' : 'var(--border)'}`,
              color: 'var(--text)',
              borderBottomRightRadius: m.role === 'user' ? 4 : 12,
              borderBottomLeftRadius:  m.role === 'user' ? 12 : 4,
            }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              padding: '12px 16px', borderRadius: 12, background: 'var(--card-bg)',
              border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 14,
            }}>
              Consultando el portafolio...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="¿Por qué compraron NVDA? ¿Cuánto llevan de ganancia en AAPL?..."
          style={{
            flex: 1, padding: '10px 16px', borderRadius: 10,
            background: 'var(--bg-alt)', border: '1px solid var(--border)',
            color: 'var(--text)', fontSize: 14, outline: 'none',
          }}
        />
        <button onClick={send} disabled={loading || !input.trim()} style={{
          padding: '10px 20px', borderRadius: 10, border: 'none',
          background: 'var(--gold)', color: '#1a1510', fontSize: 14, fontWeight: 700,
          cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
          opacity: loading || !input.trim() ? 0.6 : 1,
        }}>
          Enviar
        </button>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function PortafolioPage() {
  const [tab, setTab]           = useState('posiciones');
  const [positions, setPositions] = useState([]);
  const [summary, setSummary]   = useState(null);
  const [trades, setTrades]     = useState([]);
  const [totalTrades, setTotalTrades] = useState(0);
  const [navData, setNavData]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [syncing, setSyncing]   = useState(false);
  const [syncMsg, setSyncMsg]   = useState('');
  const adminToken = localStorage.getItem('portal_admin_token');

  async function loadData() {
    setLoading(true);
    try {
      const [posR, tradeR, navR] = await Promise.all([
        fetch(`${BASE}/api/portafolio/positions`).then(r => r.json()),
        fetch(`${BASE}/api/portafolio/trades?limit=100`).then(r => r.json()),
        fetch(`${BASE}/api/portafolio/nav`).then(r => r.json()),
      ]);
      setPositions(posR.positions || []);
      setSummary(posR.summary || null);
      setTrades(tradeR.trades || []);
      setTotalTrades(tradeR.total || 0);
      setNavData(navR.nav || []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  const plColor = (n) => n == null ? 'var(--text)' : n >= 0 ? '#16A34A' : '#DC2626';

  return (
    <div className="portal-root">
      <Helmet>
        <title>Portafolio Paper Trading | Murza Inversiones</title>
        <meta name="description" content="Portafolio real de paper trading de Murza Inversiones — operaciones, posiciones y rendimiento en tiempo real. Cuenta simulada en Interactive Brokers." />
      </Helmet>

      {/* Header */}
      <header className="portal-header">
        <Link to="/" className="portal-logo-link">
          <img src="/murza-logo.png" alt="Murza Inversiones" className="portal-logo" />
        </Link>
        <nav style={{ display: 'flex', gap: 2 }}>
          {[
            { to: '/',          label: 'Reportes'   },
            { to: '/earnings',  label: 'Earnings'   },
            { to: '/noticias',  label: 'Noticias'   },
            { to: '/comparar',  label: 'Comparar'   },
            { to: '/blog',      label: 'Blog'       },
          ].map(({ to, label }) => (
            <Link key={to} to={to} style={NAV_LINK}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--gold-pale)'; e.currentTarget.style.color = 'var(--gold-dark)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
              {label}
            </Link>
          ))}
          <Link to="/portafolio" style={{ ...NAV_LINK, color: 'var(--gold)', fontWeight: 700 }}>
            Portafolio
          </Link>
        </nav>
        <div className="portal-header-right">
          <Link to="/login" className="btn-ghost-sm">Iniciar sesion</Link>
        </div>
      </header>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Hero */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--gold)', textTransform: 'uppercase' }}>
              Transparencia total
            </div>
            <span style={{
              padding: '2px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700,
              background: 'rgba(160,128,64,0.12)', border: '1px solid rgba(160,128,64,0.30)',
              color: 'var(--gold)', letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>
              PAPER TRADING · IB
            </span>
          </div>
          <h1 style={{ fontFamily: "'Georgia', serif", fontSize: 32, fontWeight: 700, color: 'var(--text)', margin: 0, marginBottom: 10, lineHeight: 1.2 }}>
            Portafolio de Inversiones
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-muted)', margin: 0, maxWidth: 600 }}>
            Cuenta simulada en Interactive Brokers que refleja nuestras recomendaciones reales.
            Cada operacion tiene fecha, precio y tesis documentada — sin editar, sin inventar.
          </p>
        </div>

        {/* Summary cards */}
        {!loading && summary && (
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 36 }}>
            <SummaryCard
              label="Valor de la cuenta"
              value={fmt$(summary.total_nav)}
              sub={summary.report_date ? `Al ${fmtDate(summary.report_date)}` : null}
            />
            <SummaryCard
              label="Efectivo"
              value={fmt$(summary.cash)}
              sub="Disponible"
            />
            <SummaryCard
              label="P&L No Realizado"
              value={fmt$(summary.unrealized_pl, 2)}
              color={plColor(summary.unrealized_pl)}
              sub="Posiciones abiertas"
            />
            <SummaryCard
              label="Posiciones"
              value={positions.length}
              sub={`${totalTrades} operaciones historicas`}
            />
          </div>
        )}
        {loading && (
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 36 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ flex: '1 1 180px', minWidth: 160, height: 90, background: 'var(--card-bg)', borderRadius: 12, border: '1px solid var(--border)', animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        )}

        {/* Nota de paper trading */}
        <div style={{
          background: 'rgba(160,128,64,0.06)', border: '1px solid rgba(160,128,64,0.20)',
          borderRadius: 10, padding: '12px 18px', marginBottom: 28, fontSize: 13,
          color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 16 }}>ℹ️</span>
          <span>
            Este es un portafolio de <strong style={{ color: 'var(--text)' }}>paper trading</strong> (dinero simulado) en Interactive Brokers.
            Las operaciones reflejan nuestras recomendaciones reales pero no involucran capital de clientes.
          </span>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 28 }}>
          {[
            { key: 'posiciones', label: `Posiciones (${positions.length})` },
            { key: 'historial',  label: `Historial (${totalTrades})` },
            { key: 'chat',       label: 'Chat IA' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)} style={{
              padding: '10px 20px', background: 'none', border: 'none',
              borderBottom: tab === key ? '2px solid var(--gold)' : '2px solid transparent',
              color: tab === key ? 'var(--gold)' : 'var(--text-muted)',
              fontSize: 14, fontWeight: tab === key ? 700 : 500,
              cursor: 'pointer', transition: 'all 0.15s', marginBottom: -1,
            }}>
              {label}
            </button>
          ))}

          {/* Botón sync (admin) */}
          {adminToken && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
              {syncMsg && (
                <span style={{ fontSize: 12, color: syncMsg.startsWith('Error') ? '#DC2626' : '#16A34A' }}>
                  {syncMsg}
                </span>
              )}
              {/* Upload XML de IB */}
              <label style={{
                padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)',
                background: 'var(--card-bg)', color: syncing ? 'var(--text-faint)' : 'var(--gold)',
                fontSize: 12, fontWeight: 600, cursor: syncing ? 'not-allowed' : 'pointer',
              }}>
                {syncing ? 'Importando...' : 'Subir XML de IB'}
                <input type="file" accept=".xml" style={{ display: 'none' }} disabled={syncing}
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    setSyncing(true);
                    setSyncMsg('Procesando XML...');
                    try {
                      const xmlText = await file.text();
                      const parsed = parseIbXml(xmlText);
                      if (!parsed.trades.length && !parsed.positions.length)
                        throw new Error('El archivo no contiene trades ni posiciones de IB');
                      const r = await fetch(`${BASE}/api/portafolio/upload-data`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
                        body: JSON.stringify(parsed),
                      });
                      const data = await r.json();
                      if (data.error) setSyncMsg(`Error: ${data.error}`);
                      else { setSyncMsg(data.message); await loadData(); }
                    } catch (err) {
                      setSyncMsg(`Error: ${err.message}`);
                    }
                    setSyncing(false);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
          )}
        </div>

        {/* Contenido del tab */}
        {tab === 'posiciones' && (
          <PositionsTab positions={positions} summary={summary} navData={navData} />
        )}
        {tab === 'historial' && (
          <TradesTab trades={trades} total={totalTrades} adminToken={adminToken} onRefresh={loadData} />
        )}
        {tab === 'chat' && <ChatTab />}
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Cell, Legend } from 'recharts';
import { api } from '../../api.js';

const BASE = import.meta.env.VITE_API_URL || '/api';

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

const CAPITAL_INICIAL = 1_000_000;

const SECTOR_MAP = {
  AAPL:'Tecnología', MSFT:'Tecnología', NVDA:'Tecnología', META:'Tecnología',
  MU:'Tecnología', AMD:'Tecnología', GOOGL:'Tecnología', GOOG:'Tecnología',
  TSM:'Tecnología', AVGO:'Tecnología', ORCL:'Tecnología', CRM:'Tecnología',
  ADBE:'Tecnología', QCOM:'Tecnología', INTC:'Tecnología', NOW:'Tecnología',
  AMZN:'Consumo discrecional', TSLA:'Consumo discrecional', MELI:'Consumo discrecional',
  SHOP:'Consumo discrecional', BABA:'Consumo discrecional', ABNB:'Consumo discrecional',
  COST:'Consumo básico', WMT:'Consumo básico', KO:'Consumo básico', MCD:'Consumo básico',
  JPM:'Financiero', BAC:'Financiero', V:'Financiero', MA:'Financiero',
  GS:'Financiero', BRK:'Financiero', AXP:'Financiero', BLK:'Financiero',
  LLY:'Salud', JNJ:'Salud', UNH:'Salud', NVO:'Salud',
  XOM:'Energía', CVX:'Energía', CEG:'Energía',
  NFLX:'Comunicación', SPOT:'Comunicación',
  PLTR:'Tecnología', CRWD:'Tecnología', SNOW:'Tecnología',
};
const SECTOR_COLORS = {
  'Tecnología':'#6366f1','Consumo discrecional':'#f59e0b','Consumo básico':'#10b981',
  'Financiero':'#3b82f6','Salud':'#ec4899','Energía':'#f97316',
  'Comunicación':'#8b5cf6','Otros':'#6b7280',
};

function fmtPct2(n, showSign = true) {
  if (n == null) return '—';
  const sign = showSign && n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
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

      {/* Tabla — sin scroll horizontal, todo en pantalla */}
      {positions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)', fontSize: 15 }}>
          Sin posiciones abiertas actualmente.
        </div>
      ) : (
        <div>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '18%' }} /> {/* Empresa */}
              <col style={{ width: '10%' }} /> {/* Acciones */}
              <col style={{ width: '12%' }} /> {/* Entrada */}
              <col style={{ width: '12%' }} /> {/* Precio */}
              <col style={{ width: '14%' }} /> {/* Valor total */}
              <col style={{ width: '14%' }} /> {/* P&L $ */}
              <col style={{ width: '10%' }} /> {/* P&L % */}
              <col style={{ width: '10%' }} /> {/* % Port. */}
            </colgroup>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Empresa', 'Acciones', 'Entrada', 'Precio', 'Valor total', 'P&L $', 'P&L %', '% Port.'].map((h, i) => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: i === 0 ? 'left' : 'right', fontWeight: 700, fontSize: 10, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
                    {/* Ticker + Nombre juntos */}
                    <td style={{ padding: '10px 10px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text)', fontFamily: 'monospace', fontSize: 13 }}>{p.symbol}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description || ''}</div>
                    </td>
                    <td style={{ padding: '10px 10px', textAlign: 'right', fontSize: 13, color: 'var(--text)' }}>
                      {Math.abs(p.quantity).toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 10px', textAlign: 'right', fontSize: 13, color: 'var(--text-muted)' }}>
                      {fmt$(p.open_price, 2)}
                    </td>
                    <td style={{ padding: '10px 10px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                      {fmt$(p.mark_price, 2)}
                    </td>
                    <td style={{ padding: '10px 10px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                      {fmt$(p.position_value, 0)}
                    </td>
                    <td style={{ padding: '10px 10px', textAlign: 'right', fontSize: 13, fontWeight: 700, color }}>
                      {pl >= 0 ? '+' : ''}{fmt$(pl, 0)}
                    </td>
                    <td style={{ padding: '10px 10px', textAlign: 'right', fontSize: 13, fontWeight: 700, color }}>
                      {plPct != null ? fmtPct(plPct) : '—'}
                    </td>
                    <td style={{ padding: '10px 10px', textAlign: 'right', fontSize: 13, color: 'var(--text-muted)' }}>
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
    await fetch(`${BASE}/portafolio/trades/${id}/note`, {
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

// ─── Análisis tab ────────────────────────────────────────────────────────────
function AnalisisTab({ positions, stats }) {
  if (!stats) return (
    <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
      Cargando estadísticas...
    </div>
  );

  // Sector allocation
  const sectorMap = {};
  positions.forEach(p => {
    const s = SECTOR_MAP[p.symbol] || 'Otros';
    sectorMap[s] = (sectorMap[s] || 0) + (p.position_value || 0);
  });
  const totalVal = Object.values(sectorMap).reduce((a, b) => a + b, 0);
  const sectorData = Object.entries(sectorMap)
    .map(([s, v]) => ({ sector: s, pct: totalVal > 0 ? (v / totalVal * 100) : 0, valor: v }))
    .sort((a, b) => b.pct - a.pct);

  const plColor = n => n == null ? 'var(--text)' : n >= 0 ? '#16A34A' : '#DC2626';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        {[
          { label: 'Total operaciones', value: stats.total_trades },
          { label: 'Con P&L registrado', value: stats.trades_con_pl },
          { label: 'Win rate', value: stats.win_rate != null ? `${stats.win_rate.toFixed(1)}%` : '—' },
          { label: 'Ganancia promedio', value: stats.avg_ganancia_usd != null ? fmt$(stats.avg_ganancia_usd, 0) : '—', color: '#16A34A' },
          { label: 'Pérdida promedio', value: stats.avg_perdida_usd != null ? fmt$(stats.avg_perdida_usd, 0) : '—', color: '#DC2626' },
          { label: 'P&L realizado total', value: fmt$(stats.total_realizado_usd, 0), color: plColor(stats.total_realizado_usd) },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-faint)', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: color || 'var(--text)', fontFamily: "'Georgia', serif" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Sector allocation */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 14, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Concentración por sector
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sectorData.map(({ sector, pct, valor }) => (
            <div key={sector}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                <span style={{ color: 'var(--text)', fontWeight: 500 }}>{sector}</span>
                <span style={{ color: 'var(--text-muted)' }}>{fmt$(valor, 0)} · {pct.toFixed(1)}%</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, borderRadius: 4, background: SECTOR_COLORS[sector] || SECTOR_COLORS['Otros'], transition: 'width 0.6s ease' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Best & worst trades */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {[
          { title: 'Mejores trades', trades: stats.best_trades, color: '#16A34A' },
          { title: 'Peores trades', trades: stats.worst_trades, color: '#DC2626' },
        ].map(({ title, trades, color }) => (
          <div key={title}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{title}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(trades || []).map((t, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px' }}>
                  <div>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{t.symbol}</span>
                    <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-faint)' }}>{t.trade_date}</span>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 14, color }}>{t.realized_pl >= 0 ? '+' : ''}{fmt$(t.realized_pl, 0)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
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
      const r = await fetch(`${BASE}/portafolio/chat`, {
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
  const [tab, setTab]             = useState('posiciones');
  const [positions, setPositions] = useState([]);
  const [summary, setSummary]     = useState(null);
  const [trades, setTrades]       = useState([]);
  const [totalTrades, setTotalTrades] = useState(0);
  const [navData, setNavData]     = useState([]);
  const [stats, setStats]         = useState(null);
  const [chartData, setChartData]   = useState([]);
  const [allChartData, setAllChartData] = useState([]);
  const [spyMap, setSpyMap]         = useState({});
  const [spyInicial, setSpyInicial] = useState(null);
  const [chartPeriod, setChartPeriod] = useState('Todo');
  const [loading, setLoading]       = useState(true);
  const [syncing, setSyncing]     = useState(false);
  const [syncMsg, setSyncMsg]     = useState('');
  const adminToken = localStorage.getItem('portal_admin_token');

  async function loadData() {
    setLoading(true);
    try {
      const [posR, tradeR, navR, statsR] = await Promise.all([
        fetch(`${BASE}/portafolio/positions`).then(r => r.json()),
        fetch(`${BASE}/portafolio/trades?limit=200`).then(r => r.json()),
        fetch(`${BASE}/portafolio/nav`).then(r => r.json()),
        fetch(`${BASE}/portafolio/stats`).then(r => r.json()).catch(() => null),
      ]);

      const rawPositions = posR.positions || [];

      // Precios en tiempo real de Yahoo Finance para acciones
      const stocks = rawPositions.filter(p => p.asset_cat === 'STK' || !p.asset_cat);
      const priceResults = await Promise.allSettled(
        stocks.map(p => fetch(`${BASE}/precio/${p.symbol}`).then(r => r.json()))
      );
      const infoMap = {};
      stocks.forEach((p, i) => {
        const r = priceResults[i];
        if (r.status === 'fulfilled' && r.value?.precio) infoMap[p.symbol] = r.value;
      });

      // Enriquecer con precio y nombre de Yahoo Finance, filtrar posiciones cerradas
      const enriched = rawPositions
        .filter(p => Math.abs(p.quantity || 0) > 0)
        .map(p => {
          const info = infoMap[p.symbol];
          if (!info) return p;
          const qty = Math.abs(p.quantity || 0);
          const unrealized = (info.precio - (p.open_price || 0)) * qty;
          return {
            ...p,
            mark_price:     info.precio,
            position_value: info.precio * qty,
            unrealized_pl:  unrealized,
            description:    info.nombre || p.description,
          };
        });

      // Calcular % de portafolio con precios en vivo
      const totalVal = enriched.reduce((s, p) => s + (p.position_value || 0), 0);
      const withPct = enriched.map(p => ({
        ...p,
        pct_nav: totalVal > 0 ? (p.position_value / totalVal) * 100 : null,
      }));

      setPositions(withPct);
      setSummary(posR.summary || null);
      setTrades(tradeR.trades || []);
      setTotalTrades(tradeR.total || 0);
      setNavData(navR.nav || []);
      if (statsR && !statsR.error) setStats(statsR);

      // Gráfica NAV vs S&P 500
      const navRows = navR.nav || [];
      if (navRows.length >= 2) {
        const desde = navRows[0].report_date;
        const spyR = await fetch(`/api/historico/SPY?desde=${desde}`).then(r => r.json()).catch(() => null);
        const newSpyMap = {};
        (spyR?.series || []).forEach(d => { newSpyMap[d.fecha] = d.precio; });
        const newSpyInicial = spyR?.series?.[0]?.precio;
        setSpyMap(newSpyMap);
        setSpyInicial(newSpyInicial);

        // Normalizar ambas líneas desde el primer día → ambas arrancan en 0%
        const buildChart = (rows, spMap, spInit, navInit) => rows.map(n => {
          const portPct   = navInit ? ((n.total_nav - navInit) / navInit * 100) : 0;
          const spyPrecio = spMap[n.report_date];
          const spyPct    = spInit && spyPrecio ? ((spyPrecio - spInit) / spInit * 100) : null;
          return { fecha: n.report_date, portafolio: parseFloat(portPct.toFixed(2)), sp500: spyPct != null ? parseFloat(spyPct.toFixed(2)) : null };
        });

        const navInit = navRows[0]?.total_nav;
        const all = buildChart(navRows, newSpyMap, newSpyInicial, navInit);
        setAllChartData(all);
        setChartData(all);
      }
    } catch {}
    setLoading(false);
  }

  function applyPeriod(period, all, spMap, spInit, navRows) {
    const hoy = new Date();
    const cuts = { '1S': 7, '1M': 30, '3M': 90, '6M': 180, '1A': 365 };
    const days = cuts[period];
    if (!days || !all?.length) { setChartData(all || []); return; }

    const cutDate = new Date(hoy); cutDate.setDate(cutDate.getDate() - days);
    const cutStr  = cutDate.toISOString().slice(0, 10);
    const filteredNav = (navRows || []).filter(n => n.report_date >= cutStr);
    if (!filteredNav.length) { setChartData(all); return; }

    // Re-normalizar ambas líneas desde el primer punto del período → ambas en 0%
    const firstDate  = filteredNav[0].report_date;
    const navInit    = filteredNav[0].total_nav;
    const newSpyInit = spMap[firstDate] || spInit;
    const filtered = filteredNav.map(n => {
      const portPct   = navInit ? ((n.total_nav - navInit) / navInit * 100) : 0;
      const spyPrecio = spMap[n.report_date];
      const spyPct    = newSpyInit && spyPrecio ? ((spyPrecio - newSpyInit) / newSpyInit * 100) : null;
      return { fecha: n.report_date, portafolio: parseFloat(portPct.toFixed(2)), sp500: spyPct != null ? parseFloat(spyPct.toFixed(2)) : null };
    });
    setChartData(filtered);
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

        {/* ── Cards de rendimiento ──────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
          {[
            {
              label: 'Retorno total',
              value: stats?.retorno_total_pct != null ? fmtPct2(stats.retorno_total_pct) : '—',
              sub: stats?.retorno_total_usd != null ? `${fmt$(stats.retorno_total_usd, 0)} desde $1M` : 'Capital inicial: $1,000,000',
              color: stats?.retorno_total_pct >= 0 ? '#16A34A' : '#DC2626',
              big: true,
            },
            {
              label: 'YTD',
              value: stats?.ytd_pct != null ? fmtPct2(stats.ytd_pct) : '—',
              sub: 'Este año',
              color: stats?.ytd_pct >= 0 ? '#16A34A' : '#DC2626',
            },
            {
              label: 'Último mes',
              value: stats?.mensual_pct != null ? fmtPct2(stats.mensual_pct) : '—',
              sub: '30 días',
              color: stats?.mensual_pct >= 0 ? '#16A34A' : '#DC2626',
            },
            {
              label: 'Win rate',
              value: stats?.win_rate != null ? `${stats.win_rate.toFixed(1)}%` : '—',
              sub: `${stats?.trades_con_pl || 0} trades con P&L`,
              color: 'var(--text)',
            },
            {
              label: 'NAV actual',
              value: stats?.nav_actual != null ? fmt$(stats.nav_actual, 0) : (summary?.total_nav ? fmt$(summary.total_nav, 0) : '—'),
              sub: 'Valor de la cuenta',
              color: 'var(--text)',
            },
            {
              label: 'P&L realizado',
              value: stats?.total_realizado_usd != null ? fmt$(stats.total_realizado_usd, 0) : '—',
              sub: 'Ganancias cerradas',
              color: stats?.total_realizado_usd >= 0 ? '#16A34A' : '#DC2626',
            },
          ].map(({ label, value, sub, color, big }) => (
            <div key={label} style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '16px 20px', flex: big ? '2 1 220px' : '1 1 150px', minWidth: 140,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-faint)', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: big ? 28 : 22, fontWeight: 700, color, fontFamily: "'Georgia', serif", letterSpacing: '-0.02em' }}>{value}</div>
              {sub && <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>{sub}</div>}
            </div>
          ))}
        </div>

        {/* ── Gráfica NAV vs S&P 500 ───────────────────────────────────────── */}
        {chartData.length >= 2 && (
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 20px 10px', marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Rendimiento vs S&P 500
                </div>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 10, height: 3, background: '#A08040', display: 'inline-block', borderRadius: 2 }} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Murza</span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 10, height: 3, background: '#6366f1', display: 'inline-block', borderRadius: 2, borderTop: '2px dashed #6366f1' }} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>S&P 500</span>
                </span>
              </div>
              {/* Botones de período */}
              <div style={{ display: 'flex', gap: 4 }}>
                {['1S', '1M', '3M', '6M', '1A', 'Todo'].map(p => (
                  <button key={p} onClick={() => {
                    setChartPeriod(p);
                    applyPeriod(p, allChartData, spyMap, spyInicial, navData);
                  }} style={{
                    padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                    border: `1px solid ${chartPeriod === p ? 'var(--gold)' : 'var(--border)'}`,
                    background: chartPeriod === p ? 'rgba(160,128,64,0.12)' : 'transparent',
                    color: chartPeriod === p ? 'var(--gold)' : 'var(--text-muted)',
                    cursor: 'pointer',
                  }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="fecha"
                  tick={{ fill: 'var(--text-faint)', fontSize: 10 }}
                  axisLine={false} tickLine={false}
                  interval={Math.max(1, Math.floor(chartData.length / 6))}
                  tickFormatter={v => {
                    const d = new Date(v + 'T12:00:00');
                    const mes = d.toLocaleDateString('es-MX', { month: 'short' });
                    const anio = String(d.getFullYear()).slice(2);
                    return `${mes.charAt(0).toUpperCase() + mes.slice(1, 3)} '${anio}`;
                  }}
                />
                <YAxis tick={{ fill: 'var(--text-faint)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v >= 0 ? '+' : ''}${v.toFixed(0)}%`} />
                <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="4 4" />
                <Tooltip
                  contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  labelFormatter={v => { const d = new Date(v + 'T12:00:00'); return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }); }}
                  formatter={(v, name) => [`${v >= 0 ? '+' : ''}${v.toFixed(2)}%`, name === 'portafolio' ? 'Murza' : 'S&P 500']}
                />
                <Line type="monotone" dataKey="portafolio" stroke="#A08040" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="sp500" stroke="#6366f1" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
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
            { key: 'analisis',   label: 'Análisis' },
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
          {!adminToken && (
            <a href="/admin" style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-faint)', textDecoration: 'none' }}>
              Admin
            </a>
          )}
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
                      const r = await fetch(`${BASE}/portafolio/upload-data`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
                        body: JSON.stringify(parsed),
                      });
                      const rawText = await r.text();
                      let data;
                      try { data = JSON.parse(rawText); }
                      catch { throw new Error(`HTTP ${r.status} — respuesta no-JSON: ${rawText.slice(0, 300)}`); }
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
        {tab === 'analisis' && <AnalisisTab positions={positions} stats={stats} />}
        {tab === 'chat' && <ChatTab />}
      </div>
    </div>
  );
}

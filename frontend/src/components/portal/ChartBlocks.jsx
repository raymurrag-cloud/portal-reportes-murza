import React from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const GOLD   = '#A08040';
const GOLD2  = '#C9A84C';
const GRAY   = '#64748b';
const GREEN  = '#16a34a';
const RED    = '#dc2626';
const YELLOW = '#d97706';

const COLORS = [GOLD, '#C9A84C', '#e8c97a', '#f5dfa0', '#64748b'];

// ── Colores de señal ────────────────────────────────────────────────────────
function signalColor(signal) {
  if (signal === 'green')  return GREEN;
  if (signal === 'red')    return RED;
  if (signal === 'yellow') return YELLOW;
  return GRAY;
}

function signalBg(signal) {
  if (signal === 'green')  return '#f0fdf4';
  if (signal === 'red')    return '#fef2f2';
  if (signal === 'yellow') return '#fffbeb';
  return '#f8fafc';
}

// ── Tooltip personalizado ───────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, unit }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,.1)' }}>
        <p style={{ margin: 0, fontWeight: 700, color: '#1e293b', fontSize: 13 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ margin: '4px 0 0', color: p.color, fontSize: 13 }}>
            {p.name}: <strong>{p.value?.toLocaleString()}{unit ? ` ${unit}` : ''}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ── Bloque de gráfica ───────────────────────────────────────────────────────
export function ChartBlock({ config }) {
  const { type, title, data, unit, color, compare } = config;

  return (
    <div className="chart-block">
      {title && <h4 className="chart-title">{title}</h4>}
      <ResponsiveContainer width="100%" height={280}>
        {type === 'bar' ? (
          <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
            <Tooltip content={<CustomTooltip unit={unit} />} />
            {compare ? (
              <>
                <Legend />
                <Bar dataKey="fy2024" name="FY2024" fill={GRAY}    radius={[4,4,0,0]} />
                <Bar dataKey="fy2025" name="FY2025" fill={color || GOLD} radius={[4,4,0,0]} />
              </>
            ) : (
              <Bar dataKey="value" name={unit || 'Valor'} fill={color || GOLD} radius={[4,4,0,0]} />
            )}
          </BarChart>
        ) : type === 'line' ? (
          <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
            <Tooltip content={<CustomTooltip unit={unit} />} />
            <Line type="monotone" dataKey="value" stroke={color || GOLD} strokeWidth={2.5} dot={{ fill: color || GOLD, r: 4 }} />
          </LineChart>
        ) : type === 'donut' ? (
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={70} outerRadius={110} dataKey="value" nameKey="label" paddingAngle={3}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(v, n) => [`${v}${unit || ''}`, n]} />
            <Legend />
          </PieChart>
        ) : null}
      </ResponsiveContainer>
    </div>
  );
}

// ── Tarjetas KPI ────────────────────────────────────────────────────────────
export function KpiBlock({ items }) {
  return (
    <div className="kpi-grid">
      {items.map((item, i) => (
        <div key={i} className="kpi-card" style={{ borderTopColor: signalColor(item.signal) }}>
          <div className="kpi-label">{item.label}</div>
          <div className="kpi-value">{item.value}</div>
          {item.change && (
            <div className="kpi-change" style={{ color: signalColor(item.signal), background: signalBg(item.signal) }}>
              {item.change}
            </div>
          )}
          {item.note && <div className="kpi-note">{item.note}</div>}
        </div>
      ))}
    </div>
  );
}

// ── Barra de progreso visual ────────────────────────────────────────────────
export function ScoreBar({ score, max = 10, label }) {
  const pct = (score / max) * 100;
  const color = pct >= 80 ? GREEN : pct >= 60 ? YELLOW : RED;
  return (
    <div className="score-bar-block">
      <div className="score-bar-header">
        <span className="score-bar-label">{label || 'Quality Score'}</span>
        <span className="score-bar-value" style={{ color }}>{score} / {max}</span>
      </div>
      <div className="score-bar-track">
        <div className="score-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

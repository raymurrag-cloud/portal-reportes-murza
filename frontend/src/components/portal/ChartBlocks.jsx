import React from 'react';
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer
} from 'recharts';

/* ── Paleta cálida — zero blue ─────────────────────────────────────────── */
const GOLD   = '#B5872A';
const GOLD2  = '#D4A035';
const COPPER = '#C07040';
const SAGE   = '#6A8C6A';
const SIENNA = '#9C5A3C';
const CLAY   = '#8A7060';
const GRAY   = '#9A8E82';
const GREEN  = '#16A34A';
const RED    = '#DC2626';
const AMBER  = '#B5722A';

const PALETTE = [GOLD, COPPER, SAGE, SIENNA, GOLD2, CLAY];

function sigColor(s) {
  return s === 'green' ? GREEN : s === 'red' ? RED : s === 'yellow' ? AMBER : GRAY;
}
function sigBg(s) {
  return s === 'green' ? 'rgba(22,163,74,.10)' : s === 'red' ? 'rgba(220,38,38,.10)' : s === 'yellow' ? 'rgba(181,114,42,.10)' : 'rgba(168,153,138,.10)';
}

/* ── Tooltip premium — parchment warm ──────────────────────────────────── */
const Tip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#FAF6EF',
      border: '1px solid #C9BDA8',
      borderRadius: 8,
      padding: '11px 16px',
      boxShadow: '0 8px 32px rgba(28,20,16,.2)',
      fontSize: 13,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      minWidth: 140,
    }}>
      <p style={{ margin: 0, fontWeight: 800, color: '#1C1410', marginBottom: 6, fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: '3px 0', color: p.color || p.stroke, fontWeight: 600, fontSize: 13 }}>
          {p.name}: <strong style={{ color: '#1C1410' }}>
            {typeof p.value === 'number' ? p.value.toLocaleString('es-MX') : p.value}
            {unit ? ` ${unit}` : ''}
          </strong>
        </p>
      ))}
    </div>
  );
};

/* ── ChartBlock ─────────────────────────────────────────────────────────── */
export function ChartBlock({ config }) {
  const { type, title, subtitle, data, unit, color, series, valueFormat, refLine } = config;
  const c = color || GOLD;
  const isPct = valueFormat === '%' || unit === '%';
  const yFmt = isPct ? v => `${v}%` : v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v;

  return (
    <div className="chart-block">
      {(title || subtitle) && (
        <div className="chart-header">
          <div>
            {title    && <div className="chart-title">{title}</div>}
            {subtitle && <div className="chart-subtitle">{subtitle}</div>}
          </div>
        </div>
      )}

      <ResponsiveContainer width="100%" height={320}>

        {/* ── Bar chart ─────────────────────────────────────────────────── */}
        {type === 'bar' ? (
          <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={c} stopOpacity={1} />
                <stop offset="100%" stopColor={c} stopOpacity={0.5} />
              </linearGradient>
              {PALETTE.map((col, i) => (
                <linearGradient key={i} id={`barG${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={col} stopOpacity={1} />
                  <stop offset="100%" stopColor={col} stopOpacity={0.5} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="2 4" stroke="#DDD4C0" vertical={false} strokeOpacity={0.7} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#A8998A', fontFamily: 'sans-serif' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#A8998A', fontFamily: 'sans-serif' }} axisLine={false} tickLine={false} tickFormatter={yFmt} />
            <Tooltip content={<Tip unit={unit} />} cursor={{ fill: 'rgba(181,135,42,.06)' }} />
            {series ? (
              <>
                <Legend wrapperStyle={{ fontSize: 12, color: '#7A6D5E', fontFamily: 'sans-serif', paddingTop: 8 }} />
                {series.map((s, i) => (
                  <Bar key={s.key} dataKey={s.key} name={s.name || s.label}
                    fill={`url(#barG${i})`} radius={[5, 5, 0, 0]} maxBarSize={44} />
                ))}
              </>
            ) : (
              <Bar dataKey="value" name={unit || 'Valor'}
                radius={[5, 5, 0, 0]} maxBarSize={54} fill={`url(#barGrad)`} />
            )}
          </BarChart>

        /* ── Area / Line chart ────────────────────────────────────────── */
        ) : type === 'line' ? (
          <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
            <defs>
              <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={c} stopOpacity={0.22} />
                <stop offset="70%"  stopColor={c} stopOpacity={0.05} />
                <stop offset="100%" stopColor={c} stopOpacity={0} />
              </linearGradient>
              {PALETTE.map((col, i) => (
                <linearGradient key={i} id={`areaF${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={col} stopOpacity={0.18} />
                  <stop offset="75%"  stopColor={col} stopOpacity={0.03} />
                  <stop offset="100%" stopColor={col} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="2 4" stroke="#DDD4C0" vertical={false} strokeOpacity={0.7} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#A8998A', fontFamily: 'sans-serif' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#A8998A', fontFamily: 'sans-serif' }} axisLine={false} tickLine={false} tickFormatter={yFmt} />
            <Tooltip content={<Tip unit={unit} />} />
            {(isPct || refLine != null) && (
              <ReferenceLine y={refLine ?? 0} stroke="#C9BDA8" strokeDasharray="4 3" strokeWidth={1.5} label={{ value: isPct ? '0%' : '0', fill: '#A8998A', fontSize: 10 }} />
            )}
            {series ? (
              /* Multi-series: solo líneas, sin relleno (evita superposición) */
              <>
                <Legend wrapperStyle={{ fontSize: 12, color: '#7A6D5E', fontFamily: 'sans-serif', paddingTop: 8 }} />
                {series.map((s, i) => (
                  <Area key={s.key} type="monotone" dataKey={s.key} name={s.name || s.label}
                    stroke={PALETTE[i]} strokeWidth={2}
                    fill="none"
                    dot={false}
                    activeDot={{ r: 5, fill: PALETTE[i], stroke: '#FAF6EF', strokeWidth: 2 }} />
                ))}
              </>
            ) : (
              /* Serie única: línea con relleno degradado */
              <Area type="monotone" dataKey="value"
                stroke={c} strokeWidth={2.5}
                fill="url(#areaFill)"
                dot={false}
                activeDot={{ r: 7, fill: c, stroke: '#FAF6EF', strokeWidth: 2.5 }} />
            )}
          </AreaChart>

        /* ── Donut chart ──────────────────────────────────────────────── */
        ) : type === 'donut' ? (
          <PieChart>
            <defs>
              {PALETTE.map((col, i) => (
                <radialGradient key={i} id={`pieG${i}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%"   stopColor={col} stopOpacity={1} />
                  <stop offset="100%" stopColor={col} stopOpacity={0.72} />
                </radialGradient>
              ))}
            </defs>
            <Pie data={data} cx="50%" cy="50%"
              innerRadius={82} outerRadius={120}
              dataKey="value" nameKey="label"
              paddingAngle={2} strokeWidth={0}>
              {data.map((_, i) => (
                <Cell key={i} fill={`url(#pieG${i % PALETTE.length})`} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v, n) => [`${v}${unit || ''}`, n]}
              contentStyle={{
                background: '#FAF6EF', border: '1px solid #C9BDA8',
                borderRadius: 8, fontSize: 13,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: '#7A6D5E', fontFamily: 'sans-serif' }} />
          </PieChart>

        ) : null}

      </ResponsiveContainer>
    </div>
  );
}

/* ── KpiBlock ───────────────────────────────────────────────────────────── */
export function KpiBlock({ items }) {
  return (
    <div className="kpi-grid">
      {items.map((it, i) => (
        <div key={i} className="kpi-card" style={{ borderTopColor: sigColor(it.signal) }}>
          <div className="kpi-label">{it.label}</div>
          <div className="kpi-value">{it.value}</div>
          {it.change && (
            <div className="kpi-change" style={{ color: sigColor(it.signal), background: sigBg(it.signal) }}>
              {it.signal === 'green' ? '▲ ' : it.signal === 'red' ? '▼ ' : ''}{it.change}
            </div>
          )}
          {it.note && <div className="kpi-note">{it.note}</div>}
        </div>
      ))}
    </div>
  );
}

/* ── ScoreBar ───────────────────────────────────────────────────────────── */
export function ScoreBar({ score, max = 10, label, items }) {
  const pct = (score / max) * 100;
  const col = pct >= 80 ? GREEN : pct >= 60 ? AMBER : RED;
  return (
    <div className="score-block">
      <div className="score-header">
        <span className="score-label">{label || 'Quality Score'}</span>
        <span className="score-num" style={{ color: col }}>
          {score} <span style={{ fontSize: '1rem', fontWeight: 400, color: '#A8998A' }}>/ {max}</span>
        </span>
      </div>
      <div className="score-track">
        <div className="score-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${col}cc, ${col})` }} />
      </div>
      {items && (
        <div className="score-items">
          {items.map((it, i) => {
            const p2 = (it.score / it.max) * 100;
            const c2 = p2 >= 80 ? GREEN : p2 >= 60 ? AMBER : RED;
            return (
              <div key={i} className="score-item">
                <span className="score-item-label">{it.label}</span>
                <div className="score-item-bar">
                  <div style={{ width: `${p2}%`, background: c2, height: '100%', borderRadius: 999 }} />
                </div>
                <span className="score-item-val">{it.score}/{it.max}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── FlagsBlock ─────────────────────────────────────────────────────────── */
export function FlagsBlock({ items }) {
  const icon = { red: '🔴', yellow: '🟡', green: '🟢' };
  return (
    <div className="flags-block">
      {items.map((it, i) => (
        <div key={i} className="flag-card" style={{ borderLeftColor: sigColor(it.level) }}>
          <div className="flag-header">
            <span className="flag-icon">{icon[it.level] || '⚪'}</span>
            <span className="flag-title">{it.title}</span>
            {it.impact && (
              <span className="flag-badge" style={{ background: sigBg(it.level), color: sigColor(it.level) }}>
                Impacto: {it.impact}
              </span>
            )}
          </div>
          {it.evidence && <div className="flag-row"><strong>Evidencia:</strong> {it.evidence}</div>}
          {it.context  && <div className="flag-row"><strong>Contexto:</strong> {it.context}</div>}
        </div>
      ))}
    </div>
  );
}

/* ── VerdictBlock ───────────────────────────────────────────────────────── */
export function VerdictBlock({ status, score, color, summary, metrics }) {
  const col = color === 'green' ? GREEN : color === 'red' ? RED : AMBER;
  const bg  = color === 'green' ? 'rgba(22,163,74,.06)' : color === 'red' ? 'rgba(220,38,38,.06)' : 'rgba(181,114,42,.06)';
  return (
    <div className="verdict-block" style={{ borderColor: col, background: bg }}>

      {/* Eyebrow + veredicto en una línea */}
      <div className="verdict-header">
        <span className="verdict-eyebrow">Veredicto del Analista</span>
        {score && <span className="verdict-pill" style={{ background: col }}>{score}</span>}
      </div>
      <div className="verdict-status" style={{ color: col }}>{status}</div>

      {/* Métricas clave */}
      {metrics && metrics.length > 0 && (
        <div className="verdict-metrics">
          {metrics.map((m, i) => (
            <div key={i} className="verdict-metric">
              <div className="verdict-metric-label">{m.label}</div>
              <div className="verdict-metric-value">{m.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Resumen */}
      {summary && (
        <div className="verdict-summary-wrap">
          <p className="verdict-summary">{summary}</p>
        </div>
      )}
    </div>
  );
}

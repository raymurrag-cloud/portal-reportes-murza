import React from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';

const GOLD   = '#A08040';
const GRAY   = '#94a3b8';
const GREEN  = '#16a34a';
const RED    = '#dc2626';
const YELLOW = '#d97706';
const BLUE   = '#2563eb';

const PALETTE = [GOLD, '#C9A84C', '#e8c97a', BLUE, GRAY];

function sigColor(s) {
  return s === 'green' ? GREEN : s === 'red' ? RED : s === 'yellow' ? YELLOW : GRAY;
}
function sigBg(s) {
  return s === 'green' ? '#f0fdf4' : s === 'red' ? '#fef2f2' : s === 'yellow' ? '#fffbeb' : '#f8fafc';
}

// ── Tooltip ─────────────────────────────────────────────────────────────────
const Tip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:8, padding:'10px 14px', boxShadow:'0 4px 16px rgba(0,0,0,.12)', fontSize:13 }}>
      <p style={{ margin:0, fontWeight:700, color:'#1e293b', marginBottom:4 }}>{label}</p>
      {payload.map((p,i) => (
        <p key={i} style={{ margin:'2px 0', color:p.color }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}{unit ? ` ${unit}` : ''}</strong>
        </p>
      ))}
    </div>
  );
};

// ── ChartBlock ───────────────────────────────────────────────────────────────
export function ChartBlock({ config }) {
  const { type, title, subtitle, data, unit, color, series } = config;
  const c = color || GOLD;

  return (
    <div className="chart-block">
      {title    && <div className="chart-title">{title}</div>}
      {subtitle && <div className="chart-subtitle">{subtitle}</div>}
      <ResponsiveContainer width="100%" height={260}>
        {type === 'bar' ? (
          <BarChart data={data} margin={{ top:8, right:20, left:0, bottom:4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize:12, fill:'#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false}
              tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
            <Tooltip content={<Tip unit={unit} />} cursor={{ fill:'rgba(160,128,64,.06)' }} />
            {series ? (
              <>
                <Legend wrapperStyle={{ fontSize:12 }} />
                {series.map((s,i) => (
                  <Bar key={s.key} dataKey={s.key} name={s.name} fill={PALETTE[i]} radius={[4,4,0,0]} maxBarSize={48} />
                ))}
              </>
            ) : (
              <Bar dataKey="value" name={unit||'Valor'} radius={[4,4,0,0]} maxBarSize={56}
                fill="url(#barGrad)">
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={c} stopOpacity={1} />
                    <stop offset="100%" stopColor={c} stopOpacity={0.7} />
                  </linearGradient>
                </defs>
              </Bar>
            )}
          </BarChart>
        ) : type === 'line' ? (
          <LineChart data={data} margin={{ top:8, right:20, left:0, bottom:4 }}>
            <defs>
              <linearGradient id="lineArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={c} stopOpacity={0.15} />
                <stop offset="95%" stopColor={c} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize:12, fill:'#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip content={<Tip unit={unit} />} />
            {series ? series.map((s,i) => (
              <Line key={s.key} type="monotone" dataKey={s.key} name={s.name}
                stroke={PALETTE[i]} strokeWidth={2.5} dot={{ r:4, fill:PALETTE[i] }} />
            )) : (
              <Line type="monotone" dataKey="value" stroke={c} strokeWidth={2.5}
                dot={{ r:5, fill:c, strokeWidth:2, stroke:'#fff' }} activeDot={{ r:7 }} />
            )}
          </LineChart>
        ) : type === 'donut' ? (
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={75} outerRadius={115}
              dataKey="value" nameKey="label" paddingAngle={3}>
              {data.map((_,i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
            </Pie>
            <Tooltip formatter={(v,n) => [`${v}${unit||''}`, n]} />
            <Legend wrapperStyle={{ fontSize:12 }} />
          </PieChart>
        ) : null}
      </ResponsiveContainer>
    </div>
  );
}

// ── KpiBlock ─────────────────────────────────────────────────────────────────
export function KpiBlock({ items }) {
  return (
    <div className="kpi-grid">
      {items.map((it, i) => (
        <div key={i} className="kpi-card" style={{ borderTopColor: sigColor(it.signal) }}>
          <div className="kpi-label">{it.label}</div>
          <div className="kpi-value">{it.value}</div>
          {it.change && (
            <div className="kpi-change" style={{ color: sigColor(it.signal), background: sigBg(it.signal) }}>
              {it.change}
            </div>
          )}
          {it.note && <div className="kpi-note">{it.note}</div>}
        </div>
      ))}
    </div>
  );
}

// ── ScoreBar ──────────────────────────────────────────────────────────────────
export function ScoreBar({ score, max = 10, label, items }) {
  const pct = (score / max) * 100;
  const col  = pct >= 80 ? GREEN : pct >= 60 ? YELLOW : RED;
  return (
    <div className="score-block">
      <div className="score-header">
        <span className="score-label">{label || 'Quality Score'}</span>
        <span className="score-num" style={{ color: col }}>{score} <span style={{ fontSize:'1rem', fontWeight:400, color:'#94a3b8' }}>/ {max}</span></span>
      </div>
      <div className="score-track">
        <div className="score-fill" style={{ width:`${pct}%`, background:`linear-gradient(90deg, ${col}cc, ${col})` }} />
      </div>
      {items && (
        <div className="score-items">
          {items.map((it,i) => {
            const p2 = (it.score / it.max) * 100;
            return (
              <div key={i} className="score-item">
                <span className="score-item-label">{it.label}</span>
                <div className="score-item-bar">
                  <div style={{ width:`${p2}%`, background: p2>=80?GREEN:p2>=60?YELLOW:RED, height:'100%', borderRadius:999 }} />
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

// ── FlagsBlock ────────────────────────────────────────────────────────────────
export function FlagsBlock({ items }) {
  const icon = { red:'🔴', yellow:'🟡', green:'🟢' };
  return (
    <div className="flags-block">
      {items.map((it,i) => (
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
          {it.evidence    && <div className="flag-row"><strong>Evidencia:</strong> {it.evidence}</div>}
          {it.context     && <div className="flag-row"><strong>Contexto:</strong> {it.context}</div>}
        </div>
      ))}
    </div>
  );
}

// ── VerdictBlock ──────────────────────────────────────────────────────────────
export function VerdictBlock({ status, score, color, summary, metrics }) {
  const col = color === 'green' ? GREEN : color === 'red' ? RED : YELLOW;
  return (
    <div className="verdict-block" style={{ borderColor: col }}>
      <div className="verdict-top">
        <div>
          <div className="verdict-label">Veredicto</div>
          <div className="verdict-status" style={{ color: col }}>{status}</div>
        </div>
        {score && (
          <div className="verdict-score" style={{ background: col }}>
            {score}
          </div>
        )}
      </div>
      {metrics && (
        <div className="verdict-metrics">
          {metrics.map((m,i) => (
            <div key={i} className="verdict-metric">
              <span className="verdict-metric-label">{m.label}</span>
              <span className="verdict-metric-value">{m.value}</span>
            </div>
          ))}
        </div>
      )}
      {summary && <p className="verdict-summary">{summary}</p>}
    </div>
  );
}

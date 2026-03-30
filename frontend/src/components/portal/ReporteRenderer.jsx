import React from 'react';
import { ChartBlock, KpiBlock, ScoreBar, FlagsBlock, VerdictBlock } from './ChartBlocks.jsx';

/* ── Tabla financiera con colores YoY automáticos ───────────────────────── */
function TablaFinanciera({ headers, rows }) {
  if (!headers || !rows) return null;
  return (
    <div style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch', margin: '24px 0 40px', borderRadius: 12, boxShadow: '0 4px 20px rgba(28,20,16,.10)', border: '1px solid #C9BDA8' }}>
      <table style={{ display: 'table', width: '100%', minWidth: 560, borderCollapse: 'separate', borderSpacing: 0, fontSize: 13, borderRadius: 12, fontVariantNumeric: 'lining-nums tabular-nums' }}>
        <thead>
          <tr style={{ background: '#F5EDD8' }}>
            {headers.map((h, i) => (
              <th key={i} style={{
                padding: '11px 18px', textAlign: i === 0 ? 'left' : 'right',
                fontWeight: 700, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase',
                color: i === 0 ? '#1C1410' : '#7A6D5E',
                borderRight: i < headers.length - 1 ? '1px solid #DDD4C0' : 'none',
                borderLeft: i === 0 ? '3px solid #B5872A' : 'none',
                whiteSpace: 'nowrap',
                position: i === 0 ? 'sticky' : 'static', left: 0,
                background: '#F5EDD8', zIndex: i === 0 ? 2 : 'auto',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ borderBottom: ri < rows.length - 1 ? '1px solid #DDD4C0' : 'none' }}>
              {row.map((cell, ci) => {
                if (ci === 0) return (
                  <td key={ci} style={{ padding: '12px 18px', fontWeight: 600, color: '#1C1410', background: '#FFFDF8', position: 'sticky', left: 0, zIndex: 1, whiteSpace: 'normal', minWidth: 140, maxWidth: 220, borderRight: '1px solid #DDD4C0' }}>
                    {cell}
                  </td>
                );
                const text = String(cell).trim();
                if (text.includes('%')) {
                  const num = parseFloat(text.replace(/[^\-\d.]/g, ''));
                  if (!isNaN(num) && num !== 0) {
                    const pos = num > 0 && !text.startsWith('-');
                    return (
                      <td key={ci} style={{ padding: '12px 18px', textAlign: 'right', borderRight: ci < row.length - 1 ? '1px solid #DDD4C0' : 'none', whiteSpace: 'nowrap' }}>
                        <span style={{ color: pos ? '#16A34A' : '#DC2626', fontWeight: 700, background: pos ? 'rgba(22,163,74,.10)' : 'rgba(220,38,38,.10)', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>
                          {pos ? '▲ ' : '▼ '}{pos && !text.startsWith('+') ? `+${text}` : text}
                        </span>
                      </td>
                    );
                  }
                }
                return (
                  <td key={ci} style={{ padding: '12px 18px', textAlign: 'right', color: '#2E2318', borderRight: ci < row.length - 1 ? '1px solid #DDD4C0' : 'none', whiteSpace: 'nowrap' }}>
                    {cell}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Sección de texto con h2 ─────────────────────────────────────────────── */
function SeccionTexto({ titulo, contenido }) {
  return (
    <div>
      {titulo && <h2 className="rr-h2">{titulo}</h2>}
      {contenido && <p className="rr-p">{contenido}</p>}
    </div>
  );
}

/* ── Capital Allocation ──────────────────────────────────────────────────── */
function CapitalAllocation({ items }) {
  if (!items) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, margin: '8px 0 32px' }}>
      {items.map((item, i) => (
        <div key={i} style={{ background: '#FFFDF8', border: '1px solid #DDD4C0', borderRadius: 10, padding: '14px 18px' }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#7A6D5E', fontWeight: 600, marginBottom: 6 }}>{item.label}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1C1410', lineHeight: 1.4 }}>{item.value}</div>
          {item.nota && <div style={{ fontSize: 12, color: '#7A6D5E', marginTop: 4 }}>{item.nota}</div>}
        </div>
      ))}
    </div>
  );
}

/* ── Comparación con el Sector ───────────────────────────────────────────── */
function ComparacionSector({ headers, rows }) {
  if (!headers || !rows) return null;
  const posStyle = (text) => {
    const t = text.toLowerCase();
    if (t.includes('encima') || t.includes('excepcional') || t.includes('descuento')) return { color: '#16A34A', background: 'rgba(22,163,74,.10)' };
    if (t.includes('debajo') || t.includes('presion')) return { color: '#DC2626', background: 'rgba(220,38,38,.10)' };
    return { color: '#B5872A', background: 'rgba(181,135,42,.10)' };
  };
  return (
    <div style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch', margin: '24px 0 40px', borderRadius: 12, boxShadow: '0 4px 20px rgba(28,20,16,.10)', border: '1px solid #C9BDA8' }}>
      <table style={{ display: 'table', width: '100%', minWidth: 520, borderCollapse: 'separate', borderSpacing: 0, fontSize: 13, borderRadius: 12 }}>
        <thead>
          <tr style={{ background: '#F5EDD8' }}>
            {headers.map((h, i) => (
              <th key={i} style={{ padding: '11px 18px', textAlign: i === 0 ? 'left' : 'center', fontWeight: 700, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: i === 0 ? '#1C1410' : '#7A6D5E', borderRight: i < headers.length - 1 ? '1px solid #DDD4C0' : 'none', borderLeft: i === 0 ? '3px solid #B5872A' : 'none', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ borderBottom: ri < rows.length - 1 ? '1px solid #DDD4C0' : 'none' }}>
              {row.map((cell, ci) => {
                if (ci === 0) return <td key={ci} style={{ padding: '12px 18px', fontWeight: 600, color: '#1C1410', background: '#FFFDF8', minWidth: 140, borderRight: '1px solid #DDD4C0' }}>{cell}</td>;
                if (ci === row.length - 1) {
                  const st = posStyle(String(cell));
                  return <td key={ci} style={{ padding: '12px 18px', textAlign: 'center' }}><span style={{ ...st, padding: '3px 10px', borderRadius: 4, fontSize: 12, fontWeight: 700 }}>{cell}</span></td>;
                }
                return <td key={ci} style={{ padding: '12px 18px', textAlign: 'center', color: '#2E2318', borderRight: ci < row.length - 1 ? '1px solid #DDD4C0' : 'none', whiteSpace: 'nowrap' }}>{cell}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Detección de Deterioro Financiero ───────────────────────────────────── */
function DeteriorizacionFinanciera({ veredicto, analisis, items }) {
  if (!veredicto && !items) return null;
  const statusCfg = {
    ok:   { icon: '✓', color: '#16A34A', border: '#BBF7D0', bg: 'rgba(22,163,74,.06)'  },
    warn: { icon: '⚠', color: '#B5872A', border: '#FDE68A', bg: 'rgba(181,135,42,.07)' },
    bad:  { icon: '✗', color: '#DC2626', border: '#FECACA', bg: 'rgba(220,38,38,.06)'  },
  };
  return (
    <div>
      {(veredicto || analisis) && (
        <div style={{ background: 'rgba(22,163,74,.07)', border: '1px solid #BBF7D0', borderRadius: 10, padding: '16px 20px', marginBottom: 20 }}>
          {veredicto && <div style={{ fontWeight: 700, color: '#15803D', marginBottom: analisis ? 6 : 0 }}>Veredicto: {veredicto}</div>}
          {analisis  && <p style={{ margin: 0, color: '#166534', lineHeight: 1.65, fontSize: 14 }}>{analisis}</p>}
        </div>
      )}
      {items && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((item, i) => {
            const cfg = statusCfg[item.status] || statusCfg.ok;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 8, padding: '11px 16px' }}>
                <span style={{ fontWeight: 800, color: cfg.color, fontSize: 15, lineHeight: 1.3, flexShrink: 0 }}>{cfg.icon}</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 700, color: '#1C1410', fontSize: 13 }}>{item.metrica}</span>
                  <span style={{ color: '#3D3229', fontSize: 13 }}> — {item.valor}</span>
                  {item.nota && <div style={{ color: '#7A6D5E', fontSize: 12, marginTop: 3 }}>{item.nota}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Análisis Cualitativo ────────────────────────────────────────────────── */
function AnalisisCualitativo({ estrategia, ventajas, debilidades, riesgos, inversiones_estrategicas }) {
  const secciones = [
    { titulo: 'Estrategia',             contenido: estrategia,             acento: '#B5872A' },
    { titulo: 'Ventajas competitivas',  contenido: ventajas,               acento: '#16A34A' },
    { titulo: 'Debilidades',            contenido: debilidades,            acento: '#B5872A' },
    { titulo: 'Inversiones estratégicas', contenido: inversiones_estrategicas, acento: '#16A34A' },
  ].filter(s => s.contenido);
  return (
    <div>
      {secciones.map((s, i) => (
        <div key={i} style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1C1410', margin: '0 0 10px', paddingLeft: 12, borderLeft: `3px solid ${s.acento}` }}>{s.titulo}</h3>
          <p style={{ color: '#3D3229', lineHeight: 1.75, margin: 0 }}>{s.contenido}</p>
        </div>
      ))}
      {riesgos && riesgos.length > 0 && (
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1C1410', margin: '0 0 12px', paddingLeft: 12, borderLeft: '3px solid #DC2626' }}>Riesgos principales</h3>
          <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {riesgos.map((r, i) => (
              <li key={i} style={{ color: '#3D3229', lineHeight: 1.7 }}>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ── Conclusión detallada ────────────────────────────────────────────────── */
function Conclusion({ items }) {
  if (!items) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {items.map((item, i) => (
        <div key={i} style={{ padding: '20px 0', borderBottom: i < items.length - 1 ? '1px solid #DDD4C0' : 'none' }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: '#B5872A', marginBottom: 8 }}>{item.label}</div>
          <p style={{ color: '#3D3229', lineHeight: 1.75, margin: 0 }}>{item.texto}</p>
        </div>
      ))}
    </div>
  );
}

/* ── Renderer principal ──────────────────────────────────────────────────── */
export default function ReporteRenderer({ data, ticker, soloPreview, seccionesGratis = 2 }) {
  if (!data) return null;

  const secciones = [];

  if (data.resumen)              secciones.push({ tipo: 'texto',             titulo: 'Resumen Ejecutivo',          contenido: data.resumen });
  if (data.descripcion)          secciones.push({ tipo: 'texto',             titulo: 'Descripción del Negocio',   contenido: data.descripcion });
  if (data.tabla)                secciones.push({ tipo: 'tabla' });
  if (data.kpis)                 secciones.push({ tipo: 'kpis' });
  if (data.chart_ingresos)       secciones.push({ tipo: 'chart_ingresos' });
  if (data.chart_margenes)       secciones.push({ tipo: 'chart_margenes' });
  if (data.capital_allocation)   secciones.push({ tipo: 'capital_allocation' });
  if (data.comparacion_sector)   secciones.push({ tipo: 'comparacion_sector' });
  if (data.deterioro)            secciones.push({ tipo: 'deterioro' });
  if (data.secciones_extra)      data.secciones_extra.forEach(s => secciones.push({ tipo: 'texto_extra', ...s }));
  if (data.flags)                secciones.push({ tipo: 'flags' });
  if (data.score)                secciones.push({ tipo: 'score' });
  if (data.analisis_cualitativo) secciones.push({ tipo: 'analisis_cualitativo' });
  if (data.verdict)              secciones.push({ tipo: 'verdict' });
  if (data.conclusion)           secciones.push({ tipo: 'conclusion' });

  const visibles = soloPreview ? secciones.slice(0, seccionesGratis) : secciones;

  return (
    <div className="reporte-contenido">
      {visibles.map((sec, i) => {
        switch (sec.tipo) {
          case 'texto':
            return <SeccionTexto key={i} titulo={sec.titulo} contenido={sec.contenido} />;

          case 'tabla':
            return (
              <div key={i}>
                <h2 className="rr-h2">Resultados Financieros</h2>
                <TablaFinanciera headers={data.tabla.headers} rows={data.tabla.rows} />
              </div>
            );

          case 'kpis':
            return (
              <div key={i}>
                <h2 className="rr-h2">Métricas Clave de Valuación</h2>
                <KpiBlock items={data.kpis} ticker={ticker || data.ticker} />
              </div>
            );

          case 'chart_ingresos':
            return (
              <div key={i}>
                <h2 className="rr-h2">Tendencia de Ingresos</h2>
                <ChartBlock config={{
                  type: 'line', title: 'EVOLUCIÓN FINANCIERA', subtitle: 'Revenue y Utilidad Neta',
                  unit: data.chart_ingresos.unit || 'B USD', ...data.chart_ingresos,
                }} />
              </div>
            );

          case 'chart_margenes':
            return (
              <div key={i}>
                <h2 className="rr-h2">Márgenes — Tendencia</h2>
                <ChartBlock config={{
                  type: 'line', title: 'MÁRGENES', subtitle: 'Bruto, Operativo y Neto (%)',
                  valueFormat: '%', refLine: 0, ...data.chart_margenes,
                }} />
              </div>
            );

          case 'capital_allocation':
            return (
              <div key={i}>
                <h2 className="rr-h2">Capital Allocation</h2>
                <CapitalAllocation items={data.capital_allocation.items} />
              </div>
            );

          case 'comparacion_sector':
            return (
              <div key={i}>
                <h2 className="rr-h2">Comparación con el Sector</h2>
                <ComparacionSector headers={data.comparacion_sector.headers} rows={data.comparacion_sector.rows} />
              </div>
            );

          case 'deterioro':
            return (
              <div key={i}>
                <h2 className="rr-h2">Detección de Deterioro Financiero</h2>
                <DeteriorizacionFinanciera {...data.deterioro} />
              </div>
            );

          case 'texto_extra':
            return <SeccionTexto key={i} titulo={sec.titulo} contenido={sec.contenido} />;

          case 'flags':
            return (
              <div key={i}>
                <h2 className="rr-h2">Fortalezas y Riesgos</h2>
                <FlagsBlock items={data.flags} />
              </div>
            );

          case 'score':
            return (
              <div key={i}>
                <h2 className="rr-h2">Score de Calidad del Negocio</h2>
                <ScoreBar {...data.score} />
              </div>
            );

          case 'analisis_cualitativo':
            return (
              <div key={i}>
                <h2 className="rr-h2">Análisis Cualitativo</h2>
                <AnalisisCualitativo {...data.analisis_cualitativo} />
              </div>
            );

          case 'verdict':
            return (
              <div key={i}>
                <h2 className="rr-h2">Veredicto de Inversión</h2>
                <VerdictBlock {...data.verdict} />
              </div>
            );

          case 'conclusion':
            return (
              <div key={i}>
                <h2 className="rr-h2">Conclusión del Analista</h2>
                <Conclusion items={data.conclusion.items} />
              </div>
            );

          default: return null;
        }
      })}
    </div>
  );
}

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
                // Colorear celdas con porcentaje
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

/* ── Renderer principal ──────────────────────────────────────────────────── */
export default function ReporteRenderer({ data, soloPreview }) {
  if (!data) return null;

  const secciones = [];

  if (data.resumen) secciones.push({ tipo: 'texto', titulo: 'Resumen Ejecutivo', contenido: data.resumen });
  if (data.descripcion) secciones.push({ tipo: 'texto', titulo: 'Descripción del Negocio', contenido: data.descripcion });
  if (data.tabla) secciones.push({ tipo: 'tabla' });
  if (data.kpis) secciones.push({ tipo: 'kpis' });
  if (data.chart_ingresos) secciones.push({ tipo: 'chart_ingresos' });
  if (data.chart_margenes) secciones.push({ tipo: 'chart_margenes' });
  if (data.secciones_extra) data.secciones_extra.forEach(s => secciones.push({ tipo: 'texto_extra', ...s }));
  if (data.flags) secciones.push({ tipo: 'flags' });
  if (data.score) secciones.push({ tipo: 'score' });
  if (data.verdict) secciones.push({ tipo: 'verdict' });

  // Preview: solo las primeras 2 secciones de texto
  const visibles = soloPreview ? secciones.filter(s => s.tipo === 'texto').slice(0, 2) : secciones;

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
                <KpiBlock items={data.kpis} />
              </div>
            );

          case 'chart_ingresos':
            return (
              <div key={i}>
                <h2 className="rr-h2">Tendencia de Ingresos</h2>
                <ChartBlock config={{
                  type: 'line',
                  title: 'EVOLUCIÓN FINANCIERA',
                  subtitle: 'Revenue y Utilidad Neta',
                  unit: data.chart_ingresos.unit || 'B USD',
                  ...data.chart_ingresos,
                }} />
              </div>
            );

          case 'chart_margenes':
            return (
              <div key={i}>
                <h2 className="rr-h2">Márgenes — Tendencia</h2>
                <ChartBlock config={{
                  type: 'line',
                  title: 'MÁRGENES',
                  subtitle: 'Bruto, Operativo y Neto (%)',
                  valueFormat: '%',
                  refLine: 0,
                  ...data.chart_margenes,
                }} />
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

          case 'verdict':
            return (
              <div key={i}>
                <h2 className="rr-h2">Conclusión</h2>
                <VerdictBlock {...data.verdict} />
              </div>
            );

          default: return null;
        }
      })}
    </div>
  );
}

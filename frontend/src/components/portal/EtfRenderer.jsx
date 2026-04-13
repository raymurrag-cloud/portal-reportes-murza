import React from 'react';
import { ChartBlock, ScoreBar, FlagsBlock, VerdictBlock } from './ChartBlocks.jsx';

/* ── Ficha Técnica ─────────────────────────────────────────────────────────── */
function FichaTecnica({ items }) {
  if (!items) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: 12, margin: '8px 0 32px' }}>
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

/* ── KPIs ETF ──────────────────────────────────────────────────────────────── */
function KpisEtf({ items }) {
  if (!items) return null;
  const sigColor = (s) => s === 'green' ? '#16A34A' : s === 'red' ? '#DC2626' : s === 'yellow' ? '#B5722A' : '#9A8E82';
  return (
    <div className="kpi-grid">
      {items.map((it, i) => (
        <div key={i} className="kpi-card" style={{ borderTopColor: sigColor(it.signal) }}>
          <div className="kpi-label">{it.label}</div>
          <div className="kpi-value">{it.value}</div>
          {it.note && <div className="kpi-note">{it.note}</div>}
          {it.benchmark && (
            <div style={{ fontSize: 11, color: '#A8998A', marginTop: 3 }}>
              Benchmark: {it.benchmark}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Top Holdings ──────────────────────────────────────────────────────────── */
function TopHoldings({ items, fecha, porcentaje_total }) {
  if (!items || !items.length) return null;
  return (
    <div>
      {(fecha || porcentaje_total) && (
        <div style={{ display: 'flex', gap: 20, marginBottom: 16, fontSize: 13, color: '#7A6D5E', flexWrap: 'wrap' }}>
          {fecha && <span>Datos al: <strong style={{ color: '#1C1410' }}>{fecha}</strong></span>}
          {porcentaje_total && (
            <span>
              Peso combinado top 10:{' '}
              <strong style={{ color: '#B5872A' }}>{porcentaje_total}</strong>
            </span>
          )}
        </div>
      )}
      <div style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch', borderRadius: 12, boxShadow: '0 4px 20px rgba(28,20,16,.10)', border: '1px solid #C9BDA8', margin: '8px 0 32px' }}>
        <table style={{ display: 'table', width: '100%', minWidth: 500, borderCollapse: 'separate', borderSpacing: 0, fontSize: 13, borderRadius: 12 }}>
          <thead>
            <tr style={{ background: '#F5EDD8' }}>
              {['#', 'Ticker', 'Empresa', 'Sector', 'Peso'].map((h, i) => (
                <th key={i} style={{
                  padding: '11px 16px',
                  textAlign: i === 0 ? 'center' : i === 4 ? 'right' : 'left',
                  fontWeight: 700, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase',
                  color: i === 0 ? '#7A6D5E' : '#1C1410',
                  borderRight: i < 4 ? '1px solid #DDD4C0' : 'none',
                  borderLeft: i === 0 ? '3px solid #B5872A' : 'none',
                  whiteSpace: 'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} style={{ borderBottom: i < items.length - 1 ? '1px solid #DDD4C0' : 'none' }}>
                <td style={{ padding: '11px 16px', textAlign: 'center', color: '#A8998A', fontWeight: 600, fontSize: 12, background: '#FFFDF8', borderRight: '1px solid #DDD4C0', borderLeft: '3px solid #E8D8B0' }}>
                  {item.rank}
                </td>
                <td style={{ padding: '11px 16px', fontWeight: 700, color: '#B5872A', background: '#FFFDF8', borderRight: '1px solid #DDD4C0', whiteSpace: 'nowrap' }}>
                  {item.ticker}
                </td>
                <td style={{ padding: '11px 16px', color: '#1C1410', background: '#FFFDF8', borderRight: '1px solid #DDD4C0' }}>
                  {item.nombre}
                </td>
                <td style={{ padding: '11px 16px', color: '#7A6D5E', fontSize: 12, background: '#FFFDF8', borderRight: '1px solid #DDD4C0', whiteSpace: 'nowrap' }}>
                  {item.sector}
                </td>
                <td style={{ padding: '11px 16px', textAlign: 'right', fontWeight: 700, color: '#1C1410', background: '#FFFDF8' }}>
                  <span style={{ background: 'rgba(181,135,42,.12)', color: '#B5872A', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>
                    {item.peso}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Diversificación Sectorial — barras horizontales ──────────────────────── */
function DiversificacionSectorial({ data }) {
  if (!data || !data.length) return null;
  const max = Math.max(...data.map(d => d.pct));
  const COLORS = ['#B5872A', '#C07040', '#6A8C6A', '#9C5A3C', '#D4A035', '#8A7060', '#7A6D5E', '#A8998A', '#5A7A5A', '#9A8E82', '#C9BDA8', '#B5722A'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '8px 0 32px' }}>
      {data.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 148, fontSize: 12, color: '#3D3229', fontWeight: 500, flexShrink: 0, textAlign: 'right', lineHeight: 1.3 }}>
            {item.label}
          </div>
          <div style={{ flex: 1, background: '#F5EDD8', borderRadius: 999, height: 20, overflow: 'hidden', minWidth: 60 }}>
            <div style={{
              width: `${(item.pct / max) * 100}%`,
              background: COLORS[i % COLORS.length],
              height: '100%',
              borderRadius: 999,
              minWidth: 8,
              transition: 'width 0.4s ease',
            }} />
          </div>
          <div style={{ width: 46, fontSize: 12, fontWeight: 700, color: '#1C1410', textAlign: 'right', flexShrink: 0 }}>
            {item.pct}%
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Tabla genérica con colores opcionales en última columna ──────────────── */
function TablaSimple({ headers, rows, colorUltimaCol = false }) {
  if (!headers || !rows) return null;
  return (
    <div style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch', borderRadius: 12, boxShadow: '0 4px 20px rgba(28,20,16,.10)', border: '1px solid #C9BDA8', margin: '8px 0 32px' }}>
      <table style={{ display: 'table', width: '100%', minWidth: 380, borderCollapse: 'separate', borderSpacing: 0, fontSize: 13, borderRadius: 12 }}>
        <thead>
          <tr style={{ background: '#F5EDD8' }}>
            {headers.map((h, i) => (
              <th key={i} style={{
                padding: '11px 16px', textAlign: i === 0 ? 'left' : 'center',
                fontWeight: 700, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase',
                color: i === 0 ? '#1C1410' : '#7A6D5E',
                borderRight: i < headers.length - 1 ? '1px solid #DDD4C0' : 'none',
                borderLeft: i === 0 ? '3px solid #B5872A' : 'none',
                whiteSpace: 'nowrap',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ borderBottom: ri < rows.length - 1 ? '1px solid #DDD4C0' : 'none' }}>
              {row.map((cell, ci) => {
                if (ci === 0) return (
                  <td key={ci} style={{ padding: '12px 16px', fontWeight: 600, color: '#1C1410', background: '#FFFDF8', borderRight: '1px solid #DDD4C0', borderLeft: '3px solid #E8D8B0' }}>
                    {cell}
                  </td>
                );
                const text = String(cell).trim();
                if (colorUltimaCol && ci === row.length - 1 && text.includes('%')) {
                  const num = parseFloat(text.replace(/[^\-\d.]/g, ''));
                  if (!isNaN(num) && num !== 0) {
                    const pos = num > 0 && !text.startsWith('-');
                    return (
                      <td key={ci} style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{ color: pos ? '#16A34A' : '#DC2626', fontWeight: 700, background: pos ? 'rgba(22,163,74,.10)' : 'rgba(220,38,38,.10)', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>
                          {pos ? '▲ ' : '▼ '}{text}
                        </span>
                      </td>
                    );
                  }
                }
                return (
                  <td key={ci} style={{ padding: '12px 16px', textAlign: 'center', color: '#2E2318', borderRight: ci < row.length - 1 ? '1px solid #DDD4C0' : 'none', whiteSpace: 'nowrap' }}>
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

/* ── Entorno Macroeconómico ───────────────────────────────────────────────── */
function EntornoMacro({ items }) {
  if (!items || !items.length) return null;
  const impactoCfg = {
    'Positivo': { color: '#16A34A', bg: 'rgba(22,163,74,.08)',   border: '#BBF7D0' },
    'Neutral':  { color: '#B5872A', bg: 'rgba(181,135,42,.07)', border: '#FDE68A' },
    'Negativo': { color: '#DC2626', bg: 'rgba(220,38,38,.07)',  border: '#FECACA' },
    'Mixto':    { color: '#7A6D5E', bg: 'rgba(122,109,94,.07)', border: '#DDD4C0' },
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: '8px 0 32px' }}>
      {items.map((item, i) => {
        const cfg = impactoCfg[item.impacto] || impactoCfg['Neutral'];
        return (
          <div key={i} style={{ display: 'flex', gap: 16, background: '#FFFDF8', border: '1px solid #DDD4C0', borderRadius: 10, padding: '14px 18px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flexShrink: 0, minWidth: 140 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1C1410', marginBottom: 6 }}>{item.factor}</div>
              <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, padding: '2px 8px', borderRadius: 4 }}>
                {item.impacto}
              </span>
            </div>
            <p style={{ margin: 0, color: '#3D3229', fontSize: 13, lineHeight: 1.7, flex: '1 1 200px' }}>{item.descripcion}</p>
          </div>
        );
      })}
    </div>
  );
}

/* ── Calendario de Eventos ────────────────────────────────────────────────── */
function CalendarioEventos({ items }) {
  if (!items || !items.length) return null;
  const tipoCfg = {
    dividendo:   { icon: '💰', color: '#16A34A', bg: 'rgba(22,163,74,.07)'   },
    earnings:    { icon: '📊', color: '#B5872A', bg: 'rgba(181,135,42,.07)'  },
    rebalance:   { icon: '🔄', color: '#6A8C6A', bg: 'rgba(106,140,106,.07)' },
    vencimiento: { icon: '📅', color: '#9C5A3C', bg: 'rgba(156,90,60,.07)'   },
    otro:        { icon: '📌', color: '#7A6D5E', bg: 'rgba(122,109,94,.07)'  },
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '8px 0 32px' }}>
      {items.map((item, i) => {
        const cfg = tipoCfg[item.tipo] || tipoCfg.otro;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, background: cfg.bg, border: '1px solid #DDD4C0', borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ fontSize: 20, flexShrink: 0 }}>{cfg.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1C1410' }}>{item.evento}</div>
              {item.nota && <div style={{ fontSize: 12, color: '#7A6D5E', marginTop: 2 }}>{item.nota}</div>}
            </div>
            <div style={{ flexShrink: 0, textAlign: 'right' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: cfg.color, whiteSpace: 'nowrap' }}>{item.fecha}</div>
            </div>
          </div>
        );
      })}
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

/* ── ETF Renderer principal ───────────────────────────────────────────────── */
export default function EtfRenderer({ data, soloPreview, seccionesGratis = 2 }) {
  if (!data) return null;

  const secciones = [];

  if (data.resumen)                   secciones.push({ tipo: 'texto', titulo: 'Resumen Ejecutivo', contenido: data.resumen });
  if (data.descripcion)               secciones.push({ tipo: 'texto', titulo: 'Descripcion del ETF', contenido: data.descripcion });
  if (data.ficha_tecnica)             secciones.push({ tipo: 'ficha_tecnica' });
  if (data.kpis_etf)                  secciones.push({ tipo: 'kpis_etf' });
  if (data.top_holdings)              secciones.push({ tipo: 'top_holdings' });
  if (data.diversificacion_sectorial) secciones.push({ tipo: 'diversificacion_sectorial' });
  if (data.retorno_historico)         secciones.push({ tipo: 'retorno_historico' });
  if (data.chart_retorno)             secciones.push({ tipo: 'chart_retorno' });
  if (data.valuacion)                 secciones.push({ tipo: 'valuacion' });
  if (data.entorno_macro)             secciones.push({ tipo: 'entorno_macro' });
  if (data.calendario_eventos)        secciones.push({ tipo: 'calendario_eventos' });
  if (data.flags)                     secciones.push({ tipo: 'flags' });
  if (data.score)                     secciones.push({ tipo: 'score' });
  if (data.verdict)                   secciones.push({ tipo: 'verdict' });
  if (data.conclusion)                secciones.push({ tipo: 'conclusion' });

  const visibles = soloPreview ? secciones.slice(0, seccionesGratis) : secciones;

  return (
    <div className="reporte-contenido">
      {/* Badge ETF */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 24,
        background: 'rgba(106,140,106,.10)', border: '1px solid rgba(106,140,106,.28)',
        borderRadius: 8, padding: '5px 12px',
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#3D6B3D', textTransform: 'uppercase', letterSpacing: '0.09em' }}>
          Exchange-Traded Fund
        </span>
      </div>

      {visibles.map((sec, i) => {
        switch (sec.tipo) {
          case 'texto':
            return <SeccionTexto key={i} titulo={sec.titulo} contenido={sec.contenido} />;

          case 'ficha_tecnica':
            return (
              <div key={i}>
                <h2 className="rr-h2">Ficha Tecnica</h2>
                <FichaTecnica items={data.ficha_tecnica.items} />
              </div>
            );

          case 'kpis_etf':
            return (
              <div key={i}>
                <h2 className="rr-h2">Metricas Clave del ETF</h2>
                <KpisEtf items={data.kpis_etf} />
              </div>
            );

          case 'top_holdings':
            return (
              <div key={i}>
                <h2 className="rr-h2">Top 10 Holdings</h2>
                <TopHoldings {...data.top_holdings} />
              </div>
            );

          case 'diversificacion_sectorial':
            return (
              <div key={i}>
                <h2 className="rr-h2">Diversificacion Sectorial</h2>
                <DiversificacionSectorial data={data.diversificacion_sectorial.data} />
              </div>
            );

          case 'retorno_historico':
            return (
              <div key={i}>
                <h2 className="rr-h2">Retorno Historico vs Benchmark</h2>
                <TablaSimple
                  headers={data.retorno_historico.headers}
                  rows={data.retorno_historico.rows}
                  colorUltimaCol={true}
                />
              </div>
            );

          case 'chart_retorno':
            return (
              <div key={i}>
                <h2 className="rr-h2">Retorno Anual Historico</h2>
                <ChartBlock config={{
                  type: 'bar', title: 'RETORNO ANUAL', subtitle: 'ETF vs Benchmark (%)',
                  unit: '%', valueFormat: '%', ...data.chart_retorno,
                }} />
              </div>
            );

          case 'valuacion':
            return (
              <div key={i}>
                <h2 className="rr-h2">Valuacion del ETF</h2>
                <TablaSimple headers={data.valuacion.headers} rows={data.valuacion.rows} />
              </div>
            );

          case 'entorno_macro':
            return (
              <div key={i}>
                <h2 className="rr-h2">Entorno Macroeconomico</h2>
                <EntornoMacro items={data.entorno_macro.items} />
              </div>
            );

          case 'calendario_eventos':
            return (
              <div key={i}>
                <h2 className="rr-h2">Calendario de Eventos</h2>
                <CalendarioEventos items={data.calendario_eventos.items} />
              </div>
            );

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
                <h2 className="rr-h2">Score de Calidad del ETF</h2>
                <ScoreBar {...data.score} />
              </div>
            );

          case 'verdict':
            return (
              <div key={i}>
                <h2 className="rr-h2">Veredicto de Inversion</h2>
                <VerdictBlock {...data.verdict} />
              </div>
            );

          case 'conclusion':
            return (
              <div key={i}>
                <h2 className="rr-h2">Conclusion del Analista</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {data.conclusion.items.map((item, j) => (
                    <div key={j} style={{ padding: '20px 0', borderBottom: j < data.conclusion.items.length - 1 ? '1px solid #DDD4C0' : 'none' }}>
                      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: '#B5872A', marginBottom: 8 }}>{item.label}</div>
                      <p style={{ color: '#3D3229', lineHeight: 1.75, margin: 0 }}>{item.texto}</p>
                    </div>
                  ))}
                </div>
              </div>
            );

          default: return null;
        }
      })}
    </div>
  );
}

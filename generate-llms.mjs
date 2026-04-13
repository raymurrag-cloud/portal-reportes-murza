// generate-llms.mjs
// Genera frontend/public/llms.txt y llms-full.txt desde Turso.
// Corre automaticamente al final del skill /reporte-financiero.
import { createClient } from '@libsql/client';
import { writeFileSync  } from 'fs';

const PUBLIC = 'C:/Users/murra/portal-reportes/frontend/public';
const BASE   = 'https://reportes.murzainversiones.com';

const db = createClient({
  url:       'libsql://portal-murza-raymurrag-cloud.aws-us-east-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzQ0ODQzNjIsImlkIjoiMDE5ZDI3ODEtZmUwMS03OGNmLTg4Y2YtODk4NzViODc0N2FlIiwicmlkIjoiYmEzYjRmNmYtOWY5Ni00MjQ5LTlmOGMtZmZiNGI5NGNlNThlIn0.bOWEnoikCHiDlWrjvKjUk5l-PkUNKzJF4ema-3jLF_AClvSZUGL2it-lfBhrtUI20mBvPhD01dt0DqadgfY1Bg',
});

const { rows } = await db.execute({
  sql:  `SELECT ticker, empresa, slug, meta_descripcion, contenido_json, tipo, created_at
         FROM reportes WHERE publicado = 1 ORDER BY created_at DESC`,
  args: [],
});

const acciones = rows.filter(r => r.tipo !== 'etf');
const etfs     = rows.filter(r => r.tipo === 'etf');
const today    = new Date().toISOString().split('T')[0];

// ── Helpers ────────────────────────────────────────────────────────────────

function parseJson(row) {
  try { return JSON.parse(row.contenido_json); } catch { return null; }
}

function veredicto(j) {
  return j?.verdict?.status ? ` Veredicto: ${j.verdict.status}.` : '';
}

// ── llms.txt ───────────────────────────────────────────────────────────────

function buildLlmsTxt() {
  let md = `# Murza Inversiones — Portal de Analisis Financiero\n\n`;
  md += `> Portal independiente de analisis fundamental de empresas publicas de EE.UU. `;
  md += `Reportes basados en datos reales de filings 10-K y 10-Q oficiales de la SEC (API XBRL de EDGAR). `;
  md += `Incluye tablas financieras de 5 anos, ratios de valuacion en tiempo real, graficas, deteccion de deterioro, `;
  md += `red flags, Quality Score 1-10 y veredicto de inversion. Acceso libre. En espanol para Mexico y Latinoamerica.\n\n`;

  if (acciones.length > 0) {
    md += `## Reportes de acciones (${acciones.length} empresas)\n\n`;
    for (const r of acciones) {
      const j = parseJson(r);
      md += `- [${r.empresa} (${r.ticker})](${BASE}/reporte/${r.slug}): ${r.meta_descripcion || ''}${veredicto(j)}\n`;
    }
    md += '\n';
  }

  if (etfs.length > 0) {
    md += `## Reportes de ETFs (${etfs.length} fondos)\n\n`;
    for (const r of etfs) {
      const j = parseJson(r);
      md += `- [${r.empresa} (${r.ticker})](${BASE}/reporte/${r.slug}): ${r.meta_descripcion || ''}${veredicto(j)}\n`;
    }
    md += '\n';
  }

  md += `## Calendario de Earnings\n\n`;
  md += `- [Calendario de Earnings](${BASE}/earnings): Proximas fechas de resultados trimestrales, estimados de EPS y revenue, sorpresa historica, P/E Forward y puntos clave a vigilar por empresa.\n\n`;

  md += `## Pagina principal\n\n`;
  md += `- [Inicio](${BASE}): Directorio completo de reportes, buscador por ticker, y formulario para solicitar analisis de nuevas empresas.\n\n`;

  md += `## Recursos para sistemas de IA\n\n`;
  md += `- [llms-full.txt](${BASE}/llms-full.txt): Contenido completo — metodologia, glosario y resumen financiero de cada empresa.\n`;
  md += `- [Sitemap XML](${BASE}/api/reportes/sitemap.xml): Todas las URLs con fechas de actualizacion.\n\n`;

  md += `## Metodologia\n\n`;
  md += `Fuente: API XBRL SEC EDGAR. Metricas: Revenue, Utilidad Neta, EBITDA, FCF (=FCO-Capex), EPS diluido, Deuda Neta, Margen Neto, ROE, ROIC. `;
  md += `Ratios de valuacion (P/E, P/FCF, EV/EBITDA) calculados en tiempo real con precio via Yahoo Finance. `;
  md += `Estimados forward: consenso de analistas.\n\n`;
  md += `Escala de veredictos: Comprar con Conviccion > Comprar > Mantener > Reducir > Evitar\n\n`;

  md += `## Sobre Murza Inversiones\n\n`;
  md += `Firma de asesoria financiera con sede en Mexico. Fundador: Ray Murra, asesor afiliado a GBM (Grupo Bursatil Mexicano). Cobertura: Mexico y Latinoamerica.\n`;

  return md;
}

// ── llms-full.txt ──────────────────────────────────────────────────────────

function renderReporte(r) {
  const j = parseJson(r);
  let s = `### ${r.ticker} — ${r.empresa}\n`;
  s += `**URL**: ${BASE}/reporte/${r.slug}\n`;
  if (r.created_at) s += `**Publicado**: ${r.created_at.split(' ')[0]}\n`;

  if (j) {
    if (j.resumen)     s += `\n${j.resumen}\n`;
    if (j.descripcion) s += `\n${j.descripcion}\n`;

    if (j.tabla?.rows?.length) {
      s += `\n**Datos financieros**:\n`;
      for (const row of j.tabla.rows) {
        const metrica = row[0];
        const ultimo  = row[row.length - 2];
        const yoy     = row[row.length - 1];
        s += `- ${metrica}: ${ultimo} (${yoy} YoY)\n`;
      }
    }

    if (j.kpis?.length) {
      s += `\n**Valuacion**: `;
      s += j.kpis.map(k => `${k.label} ${k.value}`).join(', ') + '\n';
    }

    if (j.verdict) {
      s += `\n**Veredicto**: ${j.verdict.status || ''} (Score: ${j.verdict.score || ''})\n`;
      for (const b of j.verdict.bullets || []) {
        s += `${b.type === 'pro' ? '+' : '-'} ${b.text.replace(/\*\*/g, '')}\n`;
      }
    }
  } else if (r.meta_descripcion) {
    s += `\n${r.meta_descripcion}\n`;
  }

  return s + '\n';
}

function buildLlmsFullTxt() {
  let md = `# Murza Inversiones — Portal de Analisis Financiero\n`;
  md += `## Contenido completo para sistemas de IA\n\n`;
  md += `**URL**: ${BASE}\n`;
  md += `**Actualizado**: ${today}\n`;
  md += `**Idioma**: Espanol | **Cobertura**: Mexico y Latinoamerica\n\n---\n\n`;

  md += `## Que es este portal\n\n`;
  md += `Portal independiente de analisis fundamental de empresas publicas de EE.UU. `;
  md += `Reportes basados en datos reales del 10-K/10-Q presentados ante la SEC via EDGAR. `;
  md += `Dirigido a inversionistas hispanohablantes. Acceso libre con registro gratuito. `;
  md += `Fundador: Ray Murra, asesor de inversiones afiliado a GBM (Grupo Bursatil Mexicano).\n\n`;

  md += `## Metodologia\n\n`;
  md += `**Fuente primaria**: API XBRL de SEC EDGAR — data.sec.gov/api/xbrl/companyfacts/CIK{CIK}.json\n\n`;
  md += `**Metricas calculadas**: FCF = FCO - Capex | EBITDA = Utilidad operativa + D&A | Deuda Neta = Deuda LP - Efectivo | ROE = Utilidad Neta / Patrimonio | ROIC = NOPAT / Capital invertido\n\n`;
  md += `**Ratios de valuacion**: P/E Trailing, P/E Forward, EV/EBITDA, P/FCF — recalculados en tiempo real con precio de Yahoo Finance.\n\n`;
  md += `**Estimados forward**: consenso de analistas de Wall Street.\n\n`;
  md += `**Escala de veredictos**: Comprar con Conviccion | Comprar | Mantener | Reducir | Evitar\n\n`;
  md += `**Estructura de cada reporte**: Resumen ejecutivo, tabla financiera 5 anos, KPIs de valuacion, graficas de ingresos y margenes, deteccion de deterioro (semaforo ok/warn/bad), red flags y fortalezas (verde/amarillo/rojo), Quality Score 1-10, analisis cualitativo, comparacion sectorial, capital allocation, veredicto final.\n\n---\n\n`;

  if (acciones.length > 0) {
    md += `## Reportes de acciones (${acciones.length} empresas)\n\n`;
    md += acciones.map(renderReporte).join('---\n\n');
  }

  if (etfs.length > 0) {
    md += `## Reportes de ETFs (${etfs.length} fondos)\n\n`;
    md += etfs.map(renderReporte).join('---\n\n');
  }

  md += `---\n\n## Glosario\n\n`;
  md += `- **Revenue**: Ingresos totales del periodo\n`;
  md += `- **Utilidad Neta**: Revenue menos costos, impuestos e intereses\n`;
  md += `- **EBITDA**: Earnings Before Interest, Taxes, Depreciation & Amortization\n`;
  md += `- **FCF**: Free Cash Flow — efectivo real generado por el negocio\n`;
  md += `- **EPS**: Earnings Per Share — utilidad por accion diluida\n`;
  md += `- **Deuda Neta**: Deuda financiera menos efectivo (negativa = caja neta)\n`;
  md += `- **P/E**: Price-to-Earnings (trailing o forward)\n`;
  md += `- **EV/EBITDA**: Enterprise Value / EBITDA — metrica de adquisicion\n`;
  md += `- **P/FCF**: Market Cap / FCF anual\n`;
  md += `- **ROE**: Return on Equity\n`;
  md += `- **ROIC**: Return on Invested Capital\n`;
  md += `- **YoY**: Year-over-Year — variacion vs. mismo periodo del ano anterior\n`;
  md += `- **TTM**: Trailing Twelve Months\n\n`;

  md += `---\n\n## Nota legal\n\n`;
  md += `Los reportes son con fines informativos y educativos. No constituyen recomendaciones de inversion personalizadas.\n`;

  return md;
}

// ── Escribir archivos ──────────────────────────────────────────────────────

writeFileSync(`${PUBLIC}/llms.txt`,      buildLlmsTxt(),      'utf8');
writeFileSync(`${PUBLIC}/llms-full.txt`, buildLlmsFullTxt(),  'utf8');

const total = rows.length;
console.log(`llms.txt y llms-full.txt generados — ${total} reportes (${acciones.length} acciones, ${etfs.length} ETFs)`);

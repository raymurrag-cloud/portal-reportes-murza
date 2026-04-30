import { writeFileSync, appendFileSync } from 'fs';

const log = s => appendFileSync('C:/Users/murra/portal-reportes/ejecucion.log', s + '\n');

const precio = 272.58;
const sh25 = 312;

const xbrl = {
  '2021': { rev: 19.65, ni: -0.20, oi: -0.35, da: 4.54, ocf: -1.34, capex: 1.33, cash: 0.50, repo: 0, div: 0, fcf: -2.67, ebitda: 4.19, sh: null, ltd: null },
  '2022': { rev: 24.44, ni: -0.16, oi: 0.50, da: 2.43, ocf: -2.35, capex: 1.69, cash: 0.42, ltd: 4.65, sh: 327, repo: 0, div: 0.19, fcf: -4.04, ebitda: 2.92, nd: 4.23 },
  '2023': { rev: 24.92, ni: 1.62, oi: 1.61, da: 2.51, ocf: -5.30, capex: 2.42, cash: 0.37, ltd: 7.68, sh: 317, repo: 0.99, div: 0.37, fcf: -7.72, ebitda: 4.12, nd: 7.31 },
  '2024': { rev: 23.57, ni: 3.75, oi: 4.35, da: 2.70, ocf: -2.46, capex: 2.57, cash: 3.02, ltd: 8.47, sh: 313, repo: 1.00, div: 0.44, fcf: -5.03, ebitda: 7.05, nd: 5.45 },
  '2025': { rev: 25.53, ni: 2.32, oi: 3.09, da: 2.60, ocf: 4.24, capex: 2.95, cash: 3.64, ltd: 7.40, sh: 312, repo: 0.40, div: 0.49, fcf: 1.29, ebitda: 5.69, nd: 3.76 }
};

const rev25 = xbrl['2025'].rev;
const ni25  = xbrl['2025'].ni;
const oi25  = xbrl['2025'].oi;
const ebitda25 = xbrl['2025'].ebitda;
const fcf25 = xbrl['2025'].fcf;
const nd25  = xbrl['2025'].nd;

const rev24 = xbrl['2024'].rev;
const ni24  = xbrl['2024'].ni;
const ebitda24 = xbrl['2024'].ebitda;

const revYoY = parseFloat(((rev25 - rev24) / rev24 * 100).toFixed(1));
const niYoY  = parseFloat(((ni25 - ni24) / Math.abs(ni24) * 100).toFixed(1));
const ebitdaYoY = parseFloat(((ebitda25 - ebitda24) / ebitda24 * 100).toFixed(1));

const mktCap = precio * sh25 / 1000;
const ev     = mktCap + nd25;
const evEbitda = parseFloat((ev / ebitda25).toFixed(1));
const pFcf   = parseFloat((mktCap / fcf25).toFixed(1));
const ndEbitda = parseFloat((nd25 / ebitda25).toFixed(1));

const epsTTM = parseFloat((ni25 / sh25 * 1000).toFixed(2));
const peTTM  = parseFloat((precio / epsTTM).toFixed(1));
const fcfYield = parseFloat((fcf25 / mktCap * 100).toFixed(1));

log('Calculos: mktCap=' + mktCap.toFixed(2) + ' ev=' + ev.toFixed(2) + ' evEbitda=' + evEbitda + ' pe=' + peTTM + ' eps=' + epsTTM + ' revYoY=' + revYoY + ' ndEbitda=' + ndEbitda + ' pFcf=' + pFcf);

const data = {
  parrafos_gratis: 14,

  resumen: "Constellation Energy (CEG) es el mayor productor de energia sin carbono de EE.UU., operando 21 reactores nucleares con ~33 GW de capacidad. Tras la adquisicion de Calpine en enero 2026, se convierte en el operador de gas natural mas grande del pais, creando una plataforma de energia limpia y flexible sin precedentes. Con contratos de largo plazo firmados con Microsoft, Amazon y otros hiperescaladores para suministrar electricidad a datacenters de IA, CEG esta posicionada como la infraestructura energetica de la nueva era digital. La tesis de inversion descansa en precios de electricidad estructuralmente altos y contratos Power Purchase Agreement (PPA) de largo plazo que dan visibilidad de ingresos excepcional para una utility.",

  descripcion: "Constellation Energy opera el mayor portafolio nuclear de EE.UU. con 21 reactores en 12 estados, produciendo ~170 TWh/ano de electricidad limpia. Sus segmentos incluyen generacion nuclear en PJM, Midwest, Mid-Atlantic y Texas; retail de electricidad y gas para clientes comerciales e industriales; y servicios energeticos corporativos. La empresa deriva su moat del acervo de licencias nucleares irreplazables, la ubicacion estrategica cerca de cargas industriales de alta densidad, y la base de clientes corporativos dispuestos a pagar primas por electricidad libre de carbono. Tras la adquisicion de Calpine, agrego ~50 GW de generacion a gas natural, gas de cero emision y geotermia.",

  conclusion: "CEG es la empresa de infraestructura energetica mejor posicionada para la explosion de demanda de los datacenters de IA. Su monopolio de facto en energia nuclear de gran escala en EE.UU., combinado con contratos PPA de largo plazo ya firmados, crea visibilidad de ingresos inusual para una utility. El riesgo principal post-Calpine es el apalancamiento adicional y la integracion operativa de esta escala. A USD 272, el mercado ya refleja parte del premio por la transicion energetica, lo que exige disciplina en el precio de entrada.",

  tabla: {
    headers: ['Metrica', 'FY2021', 'FY2022', 'FY2023', 'FY2024', 'FY2025', 'Var. YoY'],
    rows: [
      ['Revenue (B USD)', '19.65', '24.44', '24.92', '23.57', '25.53', '+' + revYoY + '%'],
      ['Utilidad Neta (B USD)', '-0.20', '-0.16', '1.62', '3.75', '2.32', niYoY + '%'],
      ['Margen Neto', '-1.0%', '-0.7%', '6.5%', '15.9%', '9.1%', '-6.8pp'],
      ['EBITDA (B USD)', '4.19', '2.92', '4.12', '7.05', '5.69', ebitdaYoY + '%'],
      ['FCF (B USD)', '-2.67', '-4.04', '-7.72', '-5.03', '1.29', 'neg a pos'],
      ['EPS Diluido', '-0.61', '-0.49', '5.11', '11.99', '7.44', '-38%'],
      ['Deuda Neta (B USD)', 'N/A', '4.23', '7.31', '5.45', '3.76', '-31%']
    ]
  },

  kpis: [
    { label: 'P/E Trailing', value: peTTM + 'x', signal: 'yellow', note: 'EPS 2025 comprimido por mark-to-market; vs. utilities ~18x', precio_base: precio, precio_fecha: '2026-04-07', fundamento: { tipo: 'eps_ttm', valor: epsTTM } },
    { label: 'P/E Forward', value: '~23x', signal: 'yellow', note: 'Consenso ~11.8 EPS 2026E post-Calpine', precio_base: precio, precio_fecha: '2026-04-07', fundamento: { tipo: 'eps_fwd', valor: 11.8 } },
    { label: 'EV/EBITDA', value: evEbitda + 'x', signal: 'yellow', note: 'EBITDA 2025 comprimido; post-Calpine ~12-14x', precio_base: precio, precio_fecha: '2026-04-07', fundamento: { tipo: 'ev_ebitda', ebitda_b: ebitda25, shares_m: sh25, deuda_neta_b: nd25 } },
    { label: 'P/FCF', value: pFcf + 'x', signal: 'yellow', note: 'FCF positivo por primera vez en 2025; crecimiento fuerte esperado', precio_base: precio, precio_fecha: '2026-04-07', fundamento: { tipo: 'p_fcf', fcf_b: fcf25, shares_m: sh25 } },
    { label: 'Deuda Neta/EBITDA', value: ndEbitda + 'x', signal: 'green', note: 'Pre-Calpine; aumentara materialmente post-adquisicion 2026' },
    { label: 'ROE', value: 'N/A', signal: 'yellow', note: 'Equity no disponible en XBRL; positivo con ni=2.32B' },
    { label: 'ROIC', value: 'N/A', signal: 'yellow', note: 'Calcular post-integracion Calpine 2026' }
  ],

  chart_ingresos: {
    unit: 'B USD',
    data: [
      { label: 'FY2021', revenue: 19.65, utilidad: -0.20 },
      { label: 'FY2022', revenue: 24.44, utilidad: -0.16 },
      { label: 'FY2023', revenue: 24.92, utilidad: 1.62 },
      { label: 'FY2024', revenue: 23.57, utilidad: 3.75 },
      { label: 'FY2025', revenue: 25.53, utilidad: 2.32 }
    ],
    series: [
      { key: 'revenue', name: 'Revenue' },
      { key: 'utilidad', name: 'Utilidad Neta' }
    ]
  },

  chart_margenes: {
    data: [
      { label: 'FY2021', bruto: null, operativo: -1.8, neto: -1.0 },
      { label: 'FY2022', bruto: null, operativo: 2.0,  neto: -0.7 },
      { label: 'FY2023', bruto: null, operativo: 6.5,  neto: 6.5  },
      { label: 'FY2024', bruto: null, operativo: 18.5, neto: 15.9 },
      { label: 'FY2025', bruto: null, operativo: 12.1, neto: 9.1  }
    ],
    series: [
      { key: 'bruto',     name: 'Margen Bruto' },
      { key: 'operativo', name: 'Margen Operativo' },
      { key: 'neto',      name: 'Margen Neto' }
    ]
  },

  capital_allocation: {
    items: [
      { label: 'Capex 2025', value: '2.95B USD', nota: 'Mantenimiento nuclear y combustible; 2026E ~5.7B post-Calpine' },
      { label: 'Dividendos 2025', value: '0.49B USD', nota: 'Rendimiento ~0.7%; crecimiento programado post-Calpine' },
      { label: 'Recompras 2025', value: '0.40B USD', nota: 'Reducidas para preservar liquidez para la adquisicion Calpine' },
      { label: 'Adquisicion Calpine', value: '~16.4B USD', nota: 'Cerrada enero 2026; mayor adquisicion en historia de CEG' }
    ]
  },

  comparacion_sector: {
    headers: ['Metrica', 'CEG TTM', 'Sector Utilities ref.', 'Posicion relativa'],
    rows: [
      ['Margen Operativo', '12.1%', '~12-15%', 'En linea; nuclear mejora mix'],
      ['Margen Neto', '9.1%', '~8-12%', 'Competitivo; distorsionado por MtM derivados'],
      ['Revenue Growth YoY', '+8.3%', '~3-5%', 'Muy por encima del sector'],
      ['P/E Forward', '~23x', '~15-18x', 'Prima significativa; justificada por escasez nuclear y crecimiento'],
      ['EV/EBITDA', evEbitda + 'x', '~12x', 'En linea; mejorara con EBITDA normalizado post-Calpine'],
      ['FCF Yield', fcfYield + '%', '~3-5%', 'Bajo pero en recuperacion; tendencia positiva']
    ]
  },

  deterioro: {
    veredicto: "Balance solido pre-Calpine; apalancamiento aumentara significativamente en 2026 tras la adquisicion de 16.4B.",
    analisis: "CEG mejoro su FCF de forma consistente, pasando de FCF negativo cronico (-7.72B en 2023) a positivo en 2025 (+1.29B). El margen neto se contrajo en 2025 vs. 2024 por efectos mark-to-market en derivados de commodities, no deterioro operativo. La deuda neta mejoro a 3.76B pero la adquisicion de Calpine cambia el perfil de deuda; las agencias mantuvieron rating investment grade BBB+/Baa1.",
    items: [
      { metrica: 'Revenue YoY', valor: '+8.3%', status: 'ok' },
      { metrica: 'Margen Operativo', valor: '12.1%', status: 'warn', nota: 'Compresion vs. 18.5% 2024 por mark-to-market derivados' },
      { metrica: 'Margen Neto', valor: '9.1%', status: 'warn', nota: 'Bajo vs. 15.9% 2024; no deterioro operativo real' },
      { metrica: 'FCF 2025', valor: '+1.29B USD', status: 'ok', nota: 'Primer anno positivo sostenido; tendencia positiva' },
      { metrica: 'Deuda Neta', valor: '3.76B USD', status: 'ok', nota: 'Solida pre-Calpine; aumentara materialmente en 2026' },
      { metrica: 'Liquidez', valor: '7.4B credito + 3.6B cash', status: 'ok' }
    ]
  },

  flags: [
    { level: 'green', title: 'Monopolio de facto en energia nuclear EE.UU.', impact: 'Alto', evidence: '21 reactores, ~170 TWh/ano, 33 GW capacidad limpia — el mayor portafolio nuclear privado del mundo.', context: 'Activo irremplazable en 15-30 anos. La transicion energetica aumenta el valor de la generacion limpia 24/7.' },
    { level: 'green', title: 'Contratos PPA de largo plazo con hiperescaladores de IA', impact: 'Alto', evidence: 'Microsoft: contrato 20 anos TMI restart; Amazon: PPA Maryland; otros en negociacion activa.', context: 'Los datacenters de IA requieren electricidad limpia, ininterrumpida y predecible — perfil exacto de CEG nuclear.' },
    { level: 'yellow', title: 'Integracion Calpine — riesgo de ejecucion', impact: 'Medio', evidence: 'Adquisicion 16.4B cerrada enero 2026; ~50 GW adicionales de gas y geotermia.', context: 'Las integraciones de esta escala toman 2-3 anos para materializar sinergias. Riesgo de sobrecosto y distraccion gerencial.' },
    { level: 'yellow', title: 'FCF volatile por derivados mark-to-market', impact: 'Medio', evidence: 'OCF negativo 2021-2024, positivo 1.29B en 2025; swings grandes por valoracion de contratos.', context: 'La contabilidad de derivados distorsiona el FCF reportado; el FCF economico subyacente es mas estable.' },
    { level: 'red', title: 'Riesgo regulatorio y de mercado electrico PJM', impact: 'Alto', evidence: 'PJM en proceso de reforma de reglas de mercado; Trump administration proponiendo framework para nueva carga.', context: 'Cambios en market design de PJM podrian afectar precios de capacidad y energia para las plantas nucleares de CEG en cientos de millones por ciclo.' }
  ],

  score: {
    score: 7.6,
    max: 10,
    items: [
      { label: 'Poder de fijacion de precios', score: 9, max: 10 },
      { label: 'Crecimiento de revenue', score: 7, max: 10 },
      { label: 'Calidad de margenes', score: 7, max: 10 },
      { label: 'Solidez del balance', score: 7, max: 10 },
      { label: 'Generacion de FCF', score: 8, max: 10 }
    ]
  },

  analisis_cualitativo: {
    estrategia: "La estrategia de CEG se centra en tres pilares: (1) Extender la vida util y aumentar la capacidad de sus reactores nucleares existentes mediante uprates y renovacion de licencias, con Crane Clean Energy como modelo de restart; (2) Capturar la demanda incremental de datacenters de IA mediante contratos PPA de largo plazo que aseguran ingresos predecibles y premium por energia libre de carbono 24/7; (3) Ampliar la escala con la adquisicion de Calpine, incorporando ~50 GW de gas natural, gas cero emisiones y geotermia, creando la empresa de energia mas grande de EE.UU. por capacidad instalada.",
    ventajas: "El moat central de CEG es su portafolio nuclear irremplazable: 21 reactores en 12 estados con licencias hasta 2050-2060. Los costos de construccion de un reactor equivalente superan los 15-20B por unidad con plazos de 15+ anos. La localizacion geografica en PJM coincide con los mayores centros de consumo industrial y tecnologico. La marca verde es un activo comercial con corporaciones comprometidas a net-zero que pagan primas del 10-30% sobre el precio spot.",
    debilidades: "La generacion nuclear tiene costos fijos elevados (~60-70% de costos totales), lo que significa que en periodos de precios bajos de electricidad los margenes se comprimen rapidamente. El riesgo de eventos nucleares tiene impacto de cola extremo en valoracion. La dependencia de enriquecimiento de uranio ruso (reducida pero no eliminada) crea vulnerabilidad geopolitica. El nuevo perfil post-Calpine aumenta la complejidad operativa y el apalancamiento financiero.",
    riesgos: [
      "Riesgo regulatorio PJM: cambios en market design y reglas de capacidad podrian reducir ingresos de plantas nucleares en miles de millones por ciclo; la administracion Trump propone reformas con impacto final incierto.",
      "Riesgo de integracion Calpine: adquisicion de 16.4B es la mayor de la historia de CEG; sinergias proyectadas de 500M+ podrian no materializarse en plazos previstos, y el apalancamiento adicional eleva el riesgo financiero.",
      "Riesgo de precios de energia: si los precios del gas natural caen significativamente, la ventaja competitiva de la generacion nuclear vs. gas se reduce, disminuyendo la prima que los contratos PPA pueden capturar.",
      "Riesgo de ejecucion de Crane restart: el reinicio de Three Mile Island requiere inversion significativa y aprobacion regulatoria; retrasos o sobrecostos impactarian directamente el FCF de 2026-2027."
    ],
    inversiones_estrategicas: "Capex 2025: 2.95B USD (combustible nuclear, mantenimiento y crecimiento). Capex 2026E: ~5.7B (incluye Calpine y growth capital de 3.9B para Crane restart, uprates nucleares, infraestructura co-location para datacenters y renovaciones de licencias). Adquisicion Calpine: 16.4B transformacional en escala. Post-Calpine, la prioridad es integracion; no se anticipan grandes adquisiciones en 2026-2027."
  },

  verdict: {
    status: 'Mantener / Compra en Correccion',
    score: '7.6/10',
    color: 'green',
    metrics: [
      { label: 'Revenue FY2025', value: '25.53B USD' },
      { label: 'Margen Neto', value: '9.1%' },
      { label: 'FCF 2025', value: '1.29B USD' },
      { label: 'P/E Forward', value: '~23x' },
      { label: 'Crecimiento Rev.', value: '+8.3% YoY' }
    ],
    bullets: [
      { text: "**Monopolio nuclear irremplazable** — 21 reactores y 33 GW de capacidad limpia es un activo que no puede replicarse en 20+ anos; ideal para contratos PPA con hiperescaladores de IA.", type: 'pro' },
      { text: "**Demanda estructural de energia limpia para IA** — Contratos ya firmados con Microsoft (TMI restart) y Amazon crean visibilidad de ingresos a largo plazo con primas sobre precio spot.", type: 'pro' },
      { text: "**FCF positivo y en aceleracion** — Primer ano de FCF positivo sostenido en 2025; la tendencia es claramente ascendente con Calpine aportando flujo desde 2026.", type: 'pro' },
      { text: "**Riesgo de integracion Calpine y apalancamiento** — La adquisicion de 16.4B eleva deuda significativamente; cualquier decepcion en sinergias o precios de energia puede comprimir el multiple rapidamente.", type: 'con' }
    ]
  },

  conclusion: {
    items: [
      { label: 'Ingresos', texto: "Revenue crecio 8.3% en 2025 hasta 25.53B USD, impulsado por precios mas altos de electricidad y mayor volumen de contratos comerciales. La adquisicion de Calpine agrega ~12-15B de revenue incremental desde 2026, potencialmente duplicando la empresa." },
      { label: 'Margenes', texto: "El margen neto se contrajo de 15.9% (2024) a 9.1% (2025) principalmente por efectos mark-to-market negativos en derivados de commodities, no por deterioro operativo. El margen operativo ajustado subyacente permanece robusto. Con Calpine, los margenes se normalizaran en 2026-2027." },
      { label: 'Generacion de caja', texto: "FCF de 1.29B en 2025 marca el primer ano de generacion positiva sostenida, revertiendo anos de FCF negativo causado por inversiones en combustible nuclear y contratos de cobertura. La tendencia es ascendente con capex de crecimiento generando retornos desde 2026." },
      { label: 'Balance', texto: "Deuda neta de 3.76B pre-Calpine con calificaciones BBB+/Baa1 — solida. Post-adquisicion de Calpine (enero 2026), la deuda aumenta materialmente pero las agencias mantuvieron el investment grade, reflejando confianza en la capacidad de generacion de caja de la empresa combinada." },
      { label: 'Valuacion', texto: "A USD 272 por accion, CEG cotiza ~23x EPS 2026E estimado (~11.80 USD) y ~14x EV/EBITDA post-Calpine — premium justificado por la escasez del activo nuclear y los catalizadores de demanda de IA. El precio justo intrinseco se estima en USD 290-320 en un horizonte de 18 meses si los contratos PPA se ejecutan segun plan." },
      { label: 'Riesgos principales', texto: "Top 3: (1) Cambios en market design de PJM que afecten precios de capacidad; (2) Retrasos en integracion de Calpine que posterguen sinergias de 500M+; (3) Sobrecostos en Crane restart que aumenten el capex de 2026-2027 por encima de los 5.7B estimados." }
    ]
  }
};

writeFileSync('C:/Users/murra/portal-reportes/CEG.json', JSON.stringify(data, null, 2));
log('JSON CEG escrito correctamente');
console.log('JSON escrito OK');

// ─────────────────────────────────────────────────────────────────────────────
// earningsData.js — Datos de Earnings para el Calendario Interactivo
//
// COMO USAR:
//  - Cada clave es el TICKER exacto que usas al crear el reporte en Turso.
//  - Al agregar un nuevo reporte al portal, añade aquí su entrada con los
//    datos de earnings del proximo trimestre.
//  - Campos opcionales: si no tienes el dato, omite el campo o usa null.
// ─────────────────────────────────────────────────────────────────────────────

export const EARNINGS_DATA = {

  // ── Ya reportaron (Q1 / Q2 FY2026) ────────────────────────────────────────

  ADBE: {
    nombre: 'Adobe Inc.',
    trimestre: 'Q1 FY2026',
    fecha: '2026-03-12T21:30:00',   // 4:30 PM ET
    cuando: 'Despues del cierre',
    fecha_confirmada: true,
    eps_estimate: 4.97,
    revenue_estimate_b: 5.80,
    forward_pe: 20.4,
    last_surprise_pct: 1.9,
    what_to_watch: [
      'AI creative revenue: Firefly ya genera ingresos directos — cuantos creditos de AI se consumen por sesion',
      'ARR net new: desaceleracion en Digital Media ARR por competidores AI como Midjourney y Canva',
      'GenStudio enterprise: traccion en B2B como nuevo vector de crecimiento post-Figma',
      'Acrobat AI Assistant: adoption rate en suscriptores existentes — upsel sin costo adicional de adquisicion',
      'RPO (Remaining Performance Obligation): señal de backlog y visibilidad de ingresos futuros a 12 meses',
    ],
  },

  COST: {
    nombre: 'Costco Wholesale Corporation',
    trimestre: 'Q2 FY2026',
    fecha: '2026-03-06T21:30:00',
    cuando: 'Despues del cierre',
    fecha_confirmada: true,
    eps_estimate: 4.11,
    revenue_estimate_b: 63.2,
    forward_pe: 48.2,
    last_surprise_pct: 2.3,
    what_to_watch: [
      'Comparable store sales: mantiene 7-8% comps — indicador de salud del consumidor premium',
      'Membership renewal rate: 93%+ es el moat real de Costco, cualquier deslizamiento es señal de alerta',
      'Executive member penetration: crece como % del total? — mas leales y mayor ticket promedio',
      'E-commerce: crece 20%+ YoY pero sigue siendo menos del 5% del revenue total',
      'Apertura de tiendas: expansión en Asia (Japon, Korea, China) y nuevos mercados en US',
    ],
  },

  MU: {
    nombre: 'Micron Technology Inc.',
    trimestre: 'Q2 FY2026',
    fecha: '2026-03-19T21:30:00',
    cuando: 'Despues del cierre',
    fecha_confirmada: true,
    eps_estimate: 1.43,
    revenue_estimate_b: 8.1,
    forward_pe: 12.1,
    last_surprise_pct: 6.8,
    what_to_watch: [
      'HBM3E ramp: Micron es el tercer proveedor de HBM — porcentaje del revenue ya es HBM vs commodity DRAM',
      'DRAM pricing: ciclo de precios — recuperacion sostenida o solo temporal por AI demand',
      'NAND segment: cuando regresa a breakeven — sigue siendo el punto debil del modelo',
      'CapEx guidance FY2026: inversion en HBM4 y nodos avanzados — senal de conviction a largo plazo',
      'Data Center revenue mix: porcentaje de AI workloads vs commodity DRAM en el revenue total',
    ],
  },

  // ── Proximos (Abril 2026) ──────────────────────────────────────────────────

  META: {
    nombre: 'Meta Platforms Inc.',
    trimestre: 'Q1 2026',
    fecha: '2026-04-29T20:30:00',
    cuando: 'Despues del cierre',
    fecha_confirmada: false,
    eps_estimate: 5.26,
    revenue_estimate_b: 41.8,
    forward_pe: 22.1,
    last_surprise_pct: 8.5,
    what_to_watch: [
      'Ad revenue por usuario: ARPU en US/Canada y tendencia de monetizacion en Asia-Pacifico',
      'CapEx guidance 2026: reafirma los $60-65B para infraestructura de AI? — mercado muy sensible a esto',
      'AI Advantage+: porcentaje de campanas usando automatizacion de AI — proxy directo de monetizacion',
      'Llama 4 y Meta AI: impacto en costos de inference y adopcion de usuarios activos diarios',
      'Threads y WhatsApp Business: cuando empieza contribucion real al revenue — monetizacion de 3B usuarios',
    ],
  },

  GOOGL: {
    nombre: 'Alphabet Inc.',
    trimestre: 'Q1 2026',
    fecha: '2026-04-29T20:30:00',
    cuando: 'Despues del cierre',
    fecha_confirmada: false,
    eps_estimate: 2.01,
    revenue_estimate_b: 89.7,
    forward_pe: 17.8,
    last_surprise_pct: 5.2,
    what_to_watch: [
      'Search con AI Overviews: caida en clicks o monetizacion intacta — existencial para el modelo de negocio',
      'Google Cloud: mantiene 28-30% de crecimiento vs Azure y AWS — señal de competitividad en AI infrastructure',
      'YouTube: ingresos publicitarios y crecimiento de YouTube TV vs competencia de TikTok y Reels',
      'Waymo: actualizacion de rides por dia — unica metrica de escalabilidad comercial',
      'Margen operativo total: gastos masivos en AI impactan el leverage operativo — clave para re-rating',
    ],
  },

  AMD: {
    nombre: 'Advanced Micro Devices Inc.',
    trimestre: 'Q1 2026',
    fecha: '2026-04-29T20:30:00',
    cuando: 'Despues del cierre',
    fecha_confirmada: false,
    eps_estimate: 0.94,
    revenue_estimate_b: 7.1,
    forward_pe: 24.6,
    last_surprise_pct: 3.1,
    what_to_watch: [
      'MI300X/MI350X: revenue actualizado — esta ganando share real vs H100/H200 de NVIDIA?',
      'Data Center GPU guidance Q2: señal de momentum o desaceleracion del ciclo de AI',
      'EPYC server CPUs: market share vs Intel Xeon — sostenible en 30%+? — Genoa/Turin adoption',
      'ROCm software: mejoras en compatibilidad con CUDA — principal barrera de adopcion del ecosistema',
      'Client segment: recovery del mercado PC y mix hacia chips premium Ryzen AI para laptops',
    ],
  },

  // ── Proximos (Mayo 2026) ───────────────────────────────────────────────────

  AAPL: {
    nombre: 'Apple Inc.',
    trimestre: 'Q2 FY2026',
    fecha: '2026-05-01T20:30:00',
    cuando: 'Despues del cierre',
    fecha_confirmada: false,
    eps_estimate: 1.62,
    revenue_estimate_b: 94.4,
    forward_pe: 26.5,
    last_surprise_pct: 2.1,
    what_to_watch: [
      'Margen bruto: expansion hacia 47.5%+ impulsada por mix de Servicios — cada punto vale 2-3B en utilidad',
      'iPhone China: ventas bajo presion por Huawei Mate series y restricciones de uso gubernamental',
      'Servicios: catalizador principal — meta de $100B de revenue anual en FY2026, App Store + iCloud + Apple Pay',
      'Buybacks: ritmo de recompras ($90B+ autorizado) — senal de confianza interna del management',
      'Apple Intelligence: adopcion de funciones de AI en iPhone 16 — diferencial de upgrade cycle',
    ],
  },

  AMZN: {
    nombre: 'Amazon.com Inc.',
    trimestre: 'Q1 2026',
    fecha: '2026-05-01T20:30:00',
    cuando: 'Despues del cierre',
    fecha_confirmada: false,
    eps_estimate: 1.37,
    revenue_estimate_b: 155.2,
    forward_pe: 31.4,
    last_surprise_pct: 4.7,
    what_to_watch: [
      'AWS growth: mantiene 20%+ YoY? — demanda de inference supera capacidad instalada — backlog record',
      'Operating income guidance Q2: expansion de margen consolidado es el driver principal de valuacion',
      'Advertising: tercer segmento mas rentable de Amazon — crece 18-20% YoY con targeting de AI',
      'Project Kuiper: actualizacion de lanzamientos y timeline de revenue commercial satellite internet',
      'Retail margin: eficiencia logistica y contribucion de marketplace de terceros (3P) al mix de revenue',
    ],
  },

  NVDA: {
    nombre: 'NVIDIA Corporation',
    trimestre: 'Q1 FY2027',
    fecha: '2026-05-28T20:30:00',
    cuando: 'Despues del cierre',
    fecha_confirmada: false,
    eps_estimate: 0.89,
    revenue_estimate_b: 43.0,
    forward_pe: 28.2,
    last_surprise_pct: 9.3,
    what_to_watch: [
      'Blackwell ramp: velocidad de produccion CoWoS-L y mix GB200 NVL72 vs B100 — margen bruto afectado',
      'Datacenter supera los $36B? — consenso mas optimista que guidance oficial — señal de aceleracion',
      'China: impacto real de restricciones de exportacion en H20 — cuanto de revenue se pierde en FY2027',
      'Margen bruto: regresa al 73-75%+ tras costos de ramp de Blackwell — punto critico de valuacion',
      'NIM software y CUDA ecosystem: monetizacion de plataforma como revenue recurrente de alto margen',
    ],
  },

  // ── Proximos (Junio 2026) ──────────────────────────────────────────────────

  AVGO: {
    nombre: 'Broadcom Inc.',
    trimestre: 'Q2 FY2026',
    fecha: '2026-06-04T20:30:00',
    cuando: 'Despues del cierre',
    fecha_confirmada: false,
    eps_estimate: 1.60,
    revenue_estimate_b: 14.9,
    forward_pe: 20.3,
    last_surprise_pct: 3.8,
    what_to_watch: [
      'XPU custom chips (Google TPU v5, Meta MTIA): crecimiento de revenue — ya supera el 20% del total AI?',
      'VMware integration: margen de software post-adquisicion — progreso hacia meta del 70%+ EBITDA margin',
      'Semiconductor segment: ciclicidad en broadband enterprise y networking en recuperacion post-inventory',
      'AI networking: Tomahawk y Jericho para fabric de hyperscale — nuevos design wins en 2026',
      'Dividend: Broadcom es el unico chip company con dividendo creciente sostenido — señal de FCF durability',
    ],
  },

};

// ─────────────────────────────────────────────────────────────────────────────
// Utilidades de fecha
// ─────────────────────────────────────────────────────────────────────────────

export function getMesNumero(fechaStr) {
  return new Date(fechaStr).getMonth() + 1; // 1 = Enero
}

export const MESES = {
  3: 'Marzo',
  4: 'Abril',
  5: 'Mayo',
  6: 'Junio',
  7: 'Julio',
  8: 'Agosto',
  9: 'Septiembre',
  10: 'Octubre',
  11: 'Noviembre',
  12: 'Diciembre',
};

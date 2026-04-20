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
    fecha_siguiente: '2026-06-17T20:30:00',
    trimestre_siguiente: 'Q2 FY2026',
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
    fecha_siguiente: '2026-06-03T20:30:00',
    trimestre_siguiente: 'Q3 FY2026',
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
    fecha_siguiente: '2026-06-24T20:30:00',
    trimestre_siguiente: 'Q3 FY2026',
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

  // ── Proximos (Abril 2026) — continuacion ──────────────────────────────────

  NFLX: {
    nombre: 'Netflix Inc.',
    trimestre: 'Q1 2026',
    fecha: '2026-04-15T20:15:00',
    cuando: 'Despues del cierre',
    fecha_confirmada: true,
    fecha_siguiente: '2026-07-15T20:30:00',
    trimestre_siguiente: 'Q2 2026',
    eps_estimate: 6.25,
    revenue_estimate_b: 11.0,
    forward_pe: 29.5,
    last_surprise_pct: 5.8,
    what_to_watch: [
      'Revenue Q2 vs guidance: confirma rango $10.9-11.1B? — aceleracion o desaceleracion vs Q1',
      'Ad-supported tier: ingresos publicitarios — ya es linea de negocio material al P&L?',
      'ARM (Average Revenue per Membership): expansion por subidas de precio y mix de planes',
      'Contenido live — NFL Thursday Night y eventos: impacto en margenes y retencion de suscriptores',
      'Margen operativo Q2 y guidance FY2026: consolida por encima del 29% o hay presion de costos',
    ],
  },

  ASML: {
    nombre: 'ASML Holding N.V.',
    trimestre: 'Q1 2026',
    fecha: '2026-04-15T06:00:00',
    cuando: 'Antes de apertura',
    fecha_confirmada: true,
    fecha_siguiente: '2026-07-16T06:00:00',
    trimestre_siguiente: 'Q2 2026',
    eps_estimate: 6.10,
    revenue_estimate_b: 8.0,
    forward_pe: 25.5,
    last_surprise_pct: 4.3,
    what_to_watch: [
      'Bookings Q2: recuperacion o continua debilidad? — señal del proximo ciclo de inversion en fabs',
      'High-NA EUV (EXE:5000): cuantos sistemas reconocidos en revenue — precio unitario 380M euros',
      'Guidance FY2026: reafirma 30-35B euros? — revision al alza si TSMC acelera pedidos 2nm/A16',
      'China revenue como % del total: riesgo de nuevas restricciones EU/US de exportacion',
      'Gross margin Q2: sostenibilidad por encima del 51-52% con mix de sistemas High-NA',
    ],
  },

  TSLA: {
    nombre: 'Tesla Inc.',
    trimestre: 'Q1 2026',
    fecha: '2026-04-22T20:30:00',
    cuando: 'Despues del cierre',
    fecha_confirmada: false,
    eps_estimate: 0.48,
    revenue_estimate_b: 21.4,
    forward_pe: 82.5,
    last_surprise_pct: -11.2,
    what_to_watch: [
      'Deliveries Q1: ya conocidas (~360K) — foco en margen bruto automotriz — recupera el 18%?',
      'Energy storage: Megapack revenue y backlog — el segmento mas rentable y con mayor crecimiento',
      'FSD supervisado: adoption rate de licencias y timeline de aprobacion de robotaxi en Texas/California',
      'Optimus: actualizacion de produccion en Fremont — cuantas unidades para FY2026 y precio de venta',
      'Competencia China: cuota de mercado de Tesla vs BYD, Xiaomi EV y NIO en el mercado local',
    ],
  },

  LLY: {
    nombre: 'Eli Lilly and Company',
    trimestre: 'Q1 2026',
    fecha: '2026-04-29T11:00:00',
    cuando: 'Antes de apertura',
    fecha_confirmada: false,
    eps_estimate: 3.46,
    revenue_estimate_b: 12.8,
    forward_pe: 30.1,
    last_surprise_pct: 12.4,
    what_to_watch: [
      'Tirzepatide (Mounjaro/Zepbound): revenue total vs consenso — capacidad de manufactura como cuello de botella',
      'Guidance 2026 revenue: mantiene o eleva el rango de $58-61B — señal de demanda de GLP-1',
      'Orforglipron oral: datos clinicos de Phase 3 — pill de GLP-1 seria disruption masiva del mercado',
      'Donanemab (Alzheimer): adoption en hospitales — primer tratamiento modificador de la enfermedad aprobado',
      'Manufacturing capacity: nuevas plantas en Indiana y Alemania — timeline de produccion para satisfacer demanda',
    ],
  },

  MSFT: {
    nombre: 'Microsoft Corporation',
    trimestre: 'Q3 FY2026',
    fecha: '2026-04-29T20:30:00',
    cuando: 'Despues del cierre',
    fecha_confirmada: false,
    eps_estimate: 3.22,
    revenue_estimate_b: 68.4,
    forward_pe: 28.4,
    last_surprise_pct: 3.6,
    what_to_watch: [
      'Azure growth: mantiene 31-33% YoY — crecimiento de AI services dentro de Azure como nuevo catalizador',
      'Copilot seats: cuantos M365 Copilot licenses vendidas — $30/user/mes es el driver de ARPU mas grande',
      'CapEx guidance: reafirma $80B para FY2026 — señal de conviction en AI infrastructure',
      'LinkedIn y Search: cuota de mercado con Bing AI y revenue de publicidad programatica',
      'Gaming: Game Pass subscribers y contribucion de Activision Blizzard al margen de la division',
    ],
  },

  PYPL: {
    nombre: 'PayPal Holdings Inc.',
    trimestre: 'Q1 2026',
    fecha: '2026-04-29T20:30:00',
    cuando: 'Despues del cierre',
    fecha_confirmada: false,
    eps_estimate: 1.16,
    revenue_estimate_b: 7.8,
    forward_pe: 14.2,
    last_surprise_pct: 4.1,
    what_to_watch: [
      'Transaction margin dollars: la metrica clave del turnaround — crece con mejora de mix y pricing',
      'Branded checkout: recuperacion de take rate vs competencia de Apple Pay y Shop Pay de Shopify',
      'Venmo monetization: conversion de usuarios activos a servicios de mayor margen — debit card adoption',
      'Fastlane: adoption de checkout como guest en merchants — diferenciacion vs Link de Stripe',
      'Buybacks: ritmo de recompras en el contexto del free cash flow — señal de conviction del CFO nuevo',
    ],
  },

  // ── Proximos (Mayo 2026) — continuacion ───────────────────────────────────

  PLTR: {
    nombre: 'Palantir Technologies Inc.',
    trimestre: 'Q1 2026',
    fecha: '2026-05-05T06:30:00',
    cuando: 'Antes de apertura',
    fecha_confirmada: false,
    eps_estimate: 0.13,
    revenue_estimate_b: 0.86,
    forward_pe: 148.0,
    last_surprise_pct: 7.7,
    what_to_watch: [
      'US Commercial revenue: crece 50%+ YoY? — AIP bootcamps convirtiendose en contratos enterprise',
      'US Government revenue: contratos de defensa y intelligence — impacto de presupuesto DOGE',
      'Rule of 40 score: Palantir se comprometio a mantenerlo 40+ de forma sostenida',
      'Nuevos clientes comerciales US: numero de nuevos logos trimestrales — señal de velocidad de adopcion',
      'International commercial: expansion en Europa y Asia — barrera regulatoria vs oportunidad de AI',
    ],
  },

  UBER: {
    nombre: 'Uber Technologies Inc.',
    trimestre: 'Q1 2026',
    fecha: '2026-05-07T06:30:00',
    cuando: 'Antes de apertura',
    fecha_confirmada: false,
    eps_estimate: 0.50,
    revenue_estimate_b: 11.7,
    forward_pe: 22.8,
    last_surprise_pct: 13.5,
    what_to_watch: [
      'Gross bookings: mantiene 18-20% YoY — señal de elasticidad de demanda en mobility y delivery',
      'EBITDA margin: expansion sostenida — primera vez en historia que Uber genera FCF consistente',
      'Waymo partnership: rides de robotaxi en la plataforma de Uber — volumen y take rate en Austin/SF',
      'Advertising: Uber Journey Ads como revenue incremental de alto margen — timeline para ser material',
      'Delivery profitability: Uber Eats EBITDA positivo en todos los mercados? — competencia con DoorDash',
    ],
  },

  CPNG: {
    nombre: 'Coupang Inc.',
    trimestre: 'Q1 2026',
    fecha: '2026-05-07T06:30:00',
    cuando: 'Antes de apertura',
    fecha_confirmada: false,
    eps_estimate: 0.10,
    revenue_estimate_b: 8.1,
    forward_pe: 24.3,
    last_surprise_pct: 31.0,
    what_to_watch: [
      'Korea active customers: penetracion Wow membership vs total de usuarios de e-commerce en Korea',
      'Developing offerings segment: Farfetch turnaround y Taiwan — cuando deja de ser drag al EBITDA',
      'Rocket Wow subscribers: crecimiento de memberships de pago — modelo de lealtad similar a Amazon Prime',
      'Margen bruto consolidado: expansion por mix de publicidad y Wow memberships vs costos de logistica',
      'Taiwan launch: velocidad de adoption del modelo Rocket Delivery en mercado nuevo',
    ],
  },

  MELI: {
    nombre: 'MercadoLibre Inc.',
    trimestre: 'Q1 2026',
    fecha: '2026-05-07T06:30:00',
    cuando: 'Antes de apertura',
    fecha_confirmada: false,
    eps_estimate: 10.87,
    revenue_estimate_b: 6.0,
    forward_pe: 26.4,
    last_surprise_pct: 28.2,
    what_to_watch: [
      'Fintech: cartera de credito y NPLs — Mercado Credito es el segmento de mayor crecimiento y riesgo',
      'GMV Brazil y Mexico: crecimiento de volumen en los dos mercados mas grandes — elasticidad cambiaria',
      'Managed network logistics (MELI Air): eficiencia de entrega en mismo dia — ventaja competitiva vs Amazon',
      'Margen EBIT consolidado: expansion sostenida o re-inversion agresiva en nuevos mercados',
      'Chile y Colombia: madurez de operaciones — cuando contribuyen positivamente al margen regional',
    ],
  },

  NVO: {
    nombre: 'Novo Nordisk A/S',
    trimestre: 'Q1 2026',
    fecha: '2026-05-07T06:00:00',
    cuando: 'Antes de apertura',
    fecha_confirmada: false,
    eps_estimate: 1.24,
    revenue_estimate_b: 10.1,
    forward_pe: 18.3,
    last_surprise_pct: -8.5,
    what_to_watch: [
      'Ozempic y Wegovy revenue: volumen de unidades vs precio — impacto de competencia con Lilly Zepbound',
      'CagriSema Phase 3: resultados de reduccion de peso vs tirzepatide — existencial para la tesis de largo plazo',
      'US market share GLP-1: Novo pierde share vs Lilly? — Ozempic shortage resuelto o sigue limitando',
      'Guidance 2026: rebaja o mantiene estimados tras decepcion de CagriSema en diciembre 2025',
      'Pipeline beyond obesity: NASH, Alzheimer con semaglutide — diversificacion de la franquicia GLP-1',
    ],
  },

  SE: {
    nombre: 'Sea Limited',
    trimestre: 'Q1 2026',
    fecha: '2026-05-13T06:30:00',
    cuando: 'Antes de apertura',
    fecha_confirmada: false,
    eps_estimate: 0.52,
    revenue_estimate_b: 4.8,
    forward_pe: 19.1,
    last_surprise_pct: 24.6,
    what_to_watch: [
      'Shopee GMV: crecimiento en Indonesia, Vietnam, Tailandia — competencia directa con TikTok Shop',
      'SeaMoney (Fintech): TPV y loan book growth — monetizacion de base de usuarios de Shopee',
      'Garena (Gaming): estabilizacion de usuarios activos tras caida post-Covid — Free Fire retention',
      'Margen EBITDA ajustado: sustentabilidad de la rentabilidad alcanzada en 2025 mientras crece',
      'Indonesia regulations: riesgo de restricciones adicionales a plataformas extranjeras de e-commerce',
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

  MRVL: {
    nombre: 'Marvell Technology Inc.',
    trimestre: 'Q1 FY2027',
    fecha: '2026-06-03T20:30:00',
    cuando: 'Despues del cierre',
    fecha_confirmada: false,
    eps_estimate: 0.62,
    revenue_estimate_b: 2.0,
    forward_pe: 22.7,
    last_surprise_pct: 5.2,
    what_to_watch: [
      'Custom AI silicon (XPU): revenue de chips personalizados para Amazon Trainium y Google — rampa de produccion',
      'Data Center revenue mix: ya es 70%+ del total? — transformacion del perfil de margen',
      'Optical interconnect (PAM4/coherent DSPs): crecimiento de revenue en redes de AI a 800G y 1.6T',
      '5G: estabilizacion del segmento carrier tras anos de declive — bottom del ciclo',
      'Guidance Q2 FY2027: momentum en AI accelerators confirma posicion como el #2 detras de NVDA en custom',
    ],
  },

  // ── Ya reportaron — adicionales ────────────────────────────────────────────

  ORCL: {
    nombre: 'Oracle Corporation',
    trimestre: 'Q3 FY2026',
    fecha: '2026-03-11T21:30:00',
    cuando: 'Despues del cierre',
    fecha_confirmada: true,
    fecha_siguiente: '2026-06-10T20:30:00',
    trimestre_siguiente: 'Q4 FY2026',
    eps_estimate: 1.47,
    revenue_estimate_b: 14.4,
    forward_pe: 22.6,
    last_surprise_pct: 2.1,
    what_to_watch: [
      'Cloud Infrastructure (OCI): crecimiento YoY vs AWS/Azure — backlog de contratos AI como señal forward',
      'Remaining Performance Obligation (RPO): supera $130B? — contratos firmados con hyperscalers y gobiernos',
      'Database cloud migration: conversion de clientes Exadata on-prem a OCI — velocidad del transition',
      'Fusion ERP cloud: adoption en enterprise — competencia con SAP S/4HANA en modernizacion de ERP',
      'CapEx guidance: inversion en datacenters para soportar la demanda de OCI — cuello de botella de capacidad',
    ],
  },

  SNDK: {
    nombre: 'SanDisk Corporation',
    trimestre: 'Q1 2026',
    fecha: '2026-05-08T20:30:00',
    cuando: 'Despues del cierre',
    fecha_confirmada: false,
    eps_estimate: null,
    revenue_estimate_b: 1.8,
    forward_pe: null,
    last_surprise_pct: null,
    what_to_watch: [
      'NAND pricing environment: recovery del ciclo — ASP por GB en client SSD y enterprise NVMe',
      'QLC NAND adoption: ventaja de densidad vs competidores — design wins en AI storage appliances',
      'Separacion de WD: sinergias perdidas vs agilidad como pure-play NAND — impacto en estructura de costos',
      'Enterprise SSD mix: contribucion a revenue total — mayor margen vs NAND commodity',
      'Balance sheet post-spin: deuda asignada y capacidad de CapEx para nodos avanzados',
    ],
  },

  CVX: {
    nombre: 'Chevron Corporation',
    trimestre: 'Q1 2026',
    fecha: '2026-05-02T11:00:00',
    cuando: 'Antes de apertura',
    fecha_confirmada: false,
    eps_estimate: 2.18,
    revenue_estimate_b: 47.3,
    forward_pe: 13.8,
    last_surprise_pct: -5.3,
    what_to_watch: [
      'Free cash flow vs precio del petroleo: sensibilidad al Brent — breakeven de FCF a que precio de WTI',
      'Hess acquisition: cierre definitivo y sinergias de Guyana assets — timeline post-arbitraje con Exxon',
      'Permian Basin production: guidance de output en bbl/dia para 2026 — eficiencia de pozos DUC',
      'Buybacks y dividendo: sostenibilidad del capital return con WTI en $65-75 — prioridad de capital allocation',
      'Downstream margins: impacto de crack spreads en refinacion — contribucion al earnings total',
    ],
  },

  // ── Mayo 2026 ──────────────────────────────────────────────────────────────
  CRM: {
    nombre: 'Salesforce, Inc.',
    trimestre: 'Q1 FY2027',
    fecha: "2026-05-27T20:30:00",
    cuando: 'Despues del cierre',
    fecha_confirmada: true,
    eps_estimate: 3.13,
    revenue_estimate_b: 11.1,
    forward_pe: null,
    last_surprise_pct: 24.9,
    what_to_watch: [
      'Adopcion de Agentforce: numero de clientes pagados, deals cerrados y ARR incremental — el KPI clave para justificar la tesis de IA agentica.',
      'Crecimiento de Data Cloud + Informatica: ingresos combinados y progreso de integracion post-adquisicion de 9.6B USD.',
      'Expansion de margen operativo: guia de management apunta a 21-22% en FY2027 vs. 20.1% en FY2026 — cualquier desvio es senal de alerta.',
      'Crecimiento de RPO corriente (cRPO): indicador adelantado de ingresos futuros — en FY2026 crecio +16% YoY, se espera mantenimiento de ese ritmo.',
      'Presion competitiva de Microsoft Copilot: tasas de renovacion y expansion en segmentos donde Dynamics 365 compite directamente con Sales Cloud y Service Cloud.'
    ],
  },
  // -- Abril 2026 -------------------------------------------------------------------
  CVNA: {
    nombre: 'Carvana Co.',
    trimestre: 'Q1 FY2026',
    fecha: "2026-04-29T20:30:00",
    cuando: 'Despues del cierre',
    fecha_confirmada: true,
    eps_estimate: 1.47,
    revenue_estimate_b: 6,
    forward_pe: null,
    last_surprise_pct: 259,
    what_to_watch: [
      'GPU (Ganancia por Unidad): meta de superar 7,000 USD por unidad — indicador central de la rentabilidad del turnaround.',
      'Unidades retail vendidas: el crecimiento YoY confirma si el modelo recupera escala sin sacrificar margen.',
      'EBITDA ajustado: seguimiento del record FY2025; cualquier compresion seria senal de alerta.',
      'Comentarios sobre tasas: impacto en demanda financiada y gain-on-sale del portafolio de prestamos.',
      'Reduccion de deuda: pagos anticipados o refinanciamiento que mejoren el perfil de vencimientos.',
    ],
  },

  // ── Mayo 2026 ─────────────────────────────────────────────────────────────

  BABA: {
    nombre: 'Alibaba Group Holding Ltd',
    trimestre: 'Q4 FY2026',
    fecha: '2026-05-14T20:30:00',
    cuando: 'Despues del cierre',
    fecha_confirmada: true,
    eps_estimate: 7.54,
    revenue_estimate_b: 248.3,
    forward_pe: null,
    last_surprise_pct: -35.2,
    what_to_watch: [
      'Crecimiento Alibaba Cloud: target >15% YoY y expansion de margen operativo del segmento hacia 8%+',
      'Market share Taobao/Tmall vs PDD/Pinduoduo: estabilizacion o perdida acelerada de GMV domestico',
      'Ritmo de recompras: capital restante del programa 35.3B USD y velocidad de reduccion del float',
      'Novedades Ant Group: re-listado en HK o levantamiento de restricciones regulatorias al fintech',
      'Revenue AIDC internacional: sostenimiento del +22% YoY y camino a rentabilidad de AliExpress/Trendyol',
    ],
  },

  CEG: {
    nombre: 'Constellation Energy Corp',
    trimestre: 'Q1 2026',
    fecha: '2026-05-11T20:30:00',
    cuando: 'Despues del cierre',
    fecha_confirmada: true,
    eps_estimate: 2.68,
    revenue_estimate_b: 9.3,
    forward_pe: 20.6,
    last_surprise_pct: null,
    what_to_watch: [
      'Actualizacion contrato Microsoft/AI datacenters: renovaciones o nuevos acuerdos de energia nuclear a largo plazo.',
      'Generacion nuclear: factor de capacidad y disponibilidad de la flota — cualquier outage no programado impacta guidance.',
      'Progreso Calpine acquisition: aprobaciones regulatorias y timeline de cierre del deal de 16.4B USD.',
      'Guidance FY2026: confirmacion o ajuste del EPS guidance ante volatilidad en precios del mercado electrico.',
      'Politica energetica federal: cambios en creditos fiscales IRA para energia nuclear y su impacto en unit economics.',
    ],
  },

  // ── Abril 2026 ──────────────────────────────────────────────────────────────
  V: {
    nombre: 'Visa Inc.',
    trimestre: 'Q2 FY2026',
    fecha: "2026-04-28T20:30:00",
    cuando: 'Despues del cierre',
    fecha_confirmada: true,
    eps_estimate: 3.1,
    revenue_estimate_b: 10.7,
    forward_pe: null,
    last_surprise_pct: 0.9,
    what_to_watch: [
      'Volumen de pagos globales y crecimiento cross-border vs. estimados — señal de salud del consumo global',
      'Actualizacion del caso DOJ sobre monopolio en debito — cualquier development o fecha de juicio es critico',
      'Guidance de revenue y EPS para Q3 FY2026 — momentum en transacciones y expansion de margenes',
      'Crecimiento de Visa Direct en pagos B2B y remesas — penetracion de nuevos flujos de pago fuera del consumer',
      'Impacto de tipo de cambio en ingresos internacionales — el dolar fuerte reduce fees cross-border reportados',
    ],
  },

  // -- Mayo 2026 -----------------------------------------------------------------------
  SNOW: {
    nombre: 'Snowflake Inc.',
    trimestre: 'Q1 FY2027',
    fecha: "2026-05-27T20:30:00",
    cuando: 'Despues del cierre',
    fecha_confirmada: true,
    eps_estimate: 0.32,
    revenue_estimate_b: 1.32,
    forward_pe: null,
    last_surprise_pct: 17.8,
    what_to_watch: [
      'Aceleracion de ingresos por productos Cortex AI — primer indicador de traccion real en IA nativa.',
      'Net Revenue Retention (NRR): mantener por encima de 125% es critico para la tesis de expansion organica.',
      'Remaining Performance Obligation (RPO): crecimiento del backlog indica visibilidad de ingresos futuros.',
      'Margen operativo no-GAAP: progreso hacia punto de equilibrio es el catalista de revaluacion.',
      'Guidance FY2027: el mercado premia guidance conservador que se supera — vigilar el tono sobre Cortex AI.',
    ],
  },

  // ── Abril 2026 ──────────────────────────────────────────────────────────────
  AXP: {
    nombre: 'American Express',
    trimestre: 'Q1 2026',
    fecha: "2026-04-17T08:30:00",
    cuando: 'Antes de apertura',
    fecha_confirmada: false,
    eps_estimate: null,
    revenue_estimate_b: null,
    forward_pe: null,
    last_surprise_pct: null,
    what_to_watch: [
      'Billed business crecimiento YoY — indicador adelantado de discount revenue y salud del gasto premium',
      'Tasa de write-offs y delinquency — normalizacion post-pandemia; umbral critico >2.5% de la cartera',
      'Net card fees YoY — refleja poder de premiumizacion y disposicion a pagar del Card Member',
      'Nuevas adquisiciones de Card Members Millennial/Gen Z — clave para crecimiento a largo plazo',
      'Guidance de EPS para FY2026 — management guio 5.00-5.50 en Q4 2025; revisar revision al alza',
    ],
  },

  // ── Mayo 2026 ──────────────────────────────────────────────────────────────
  OSCR: {
    nombre: 'Oscar Health',
    trimestre: 'Q1 2026',
    fecha: "2026-05-08T07:00:00",
    cuando: 'Antes de apertura',
    fecha_confirmada: false,
    eps_estimate: null,
    revenue_estimate_b: null,
    forward_pe: null,
    last_surprise_pct: null,
    what_to_watch: [
      'MLR Q1 2026: si supera 88% la perdida se profundiza; si baja a 84% senaliza recuperacion del modelo',
      'Membership 2026: impacto real de expiracion de eAPTCs en enrollment y desercion de miembros',
      'Ajuste de riesgo federal: actualizacion del accrual de risk adjustment podria generar cargo o beneficio material',
      'Capital estatutario: exceso de solo 315M sobre minimo — vigilar inyecciones de capital a subsidiarias',
      'Revenue +Oscar: monetizacion B2B y traccion de nuevas adquisiciones ICHRA (Lucie, IHC, Healthinsurance.org)',
    ],
  },

  // ── Abril 2026 ──────────────────────────────────────────────────────────────
  CMG: {
    nombre: 'Chipotle Mexican Grill',
    trimestre: 'Q1 2026',
    fecha: "2026-04-22T16:00:00",
    cuando: 'Despues del cierre',
    fecha_confirmada: false,
    eps_estimate: null,
    revenue_estimate_b: null,
    forward_pe: null,
    last_surprise_pct: null,
    what_to_watch: [
      'Ventas comparables Q1 2026: management guia planas vs -1.7% de FY2025 -- clave para saber si el trafico se recupera',
      'Costos de alimentos: seguimiento del impacto de aranceles estimado en 15bps -- riesgo si politica arancelaria se endurece',
      'Aperturas 2026: plan de 350-370 restaurantes con 80% Chipotlane -- execution risk en mercados internacionales',
      'Costos laborales: inflacion salarial en California y NY presiona el 25.1% de labor como % de revenue',
      'Expansion internacional: 11 restaurantes abiertos en Medio Oriente via socios -- modelo replicable o concentrado en EE.UU.',
    ],
  },

  // ── Mayo 2026 ──────────────────────────────────────────────────────────────
  TBBB: {
    nombre: 'BBB Foods Inc.',
    trimestre: 'Q1 2026',
    fecha: "2026-05-15T17:00:00",
    cuando: 'Despues del cierre',
    fecha_confirmada: false,
    eps_estimate: null,
    revenue_estimate_b: null,
    forward_pe: null,
    last_surprise_pct: null,
    what_to_watch: [
      'RSUs: el plan Liquidity Event reconoce Ps.2,930M/ano en gradiente inverso -- seguir el gasto SBC en Q1 2026',
      'SSS 2026: la tasa de 18.3% en 2025 debe mantenerse sobre 15% para justificar la valuacion actual',
      'Apertura de tiendas: ritmo de 500+ por ano requiere flawless execution -- monitorear capex vs guidance',
      'Competencia: expansion de Bodega Aurrera en segmento popular y posibles nuevos entrantes de hard discount',
      'Tipo de cambio MXN/USD: empresa mantiene dolares del IPO en balance -- variaciones impactan resultado financiero',
    ],
  },

  // ── Abril 2026 ──────────────────────────────────────────────────────────────
  CB: {
    nombre: 'Chubb Limited',
    trimestre: 'Q1 2026',
    fecha: "2026-04-22T08:00:00",
    cuando: 'Antes de apertura',
    fecha_confirmada: false,
    eps_estimate: null,
    revenue_estimate_b: null,
    forward_pe: null,
    last_surprise_pct: null,
    what_to_watch: [
      'Combined ratio: mantener por debajo de 90% en entorno de mayor frecuencia de catastrofes',
      'Crecimiento de primas escritas netas en segmento comercial de Norteamerica',
      'Impacto de social inflation en reservas de liability lines y ajuste de pricing',
      'Expansion en Asia-Pacifico: crecimiento de primas y rentabilidad en China y SE Asia',
      'Retorno de capital: nivel de buybacks y aumento de dividendo en 2026',
    ],
  },

// __EARNINGS_DATA_END__
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

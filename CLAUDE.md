# Portal de Reportes — Murza Inversiones

## Contexto del proyecto

Este es el portal de análisis financiero de Murza Inversiones. Cuando el usuario pide un reporte de una empresa, debes generar un JSON con los datos financieros reales. El portal convierte ese JSON automáticamente en gráficas, tablas y diseño profesional.

**Tu trabajo es únicamente proveer los datos. El diseño lo hace el portal.**

---

## Regla de fuentes para noticias — OBLIGATORIA

Al actualizar `/noticias`, solo usar fuentes con score de confiabilidad **7 o mayor**:

| Score | Fuentes |
|---|---|
| 10 | SEC EDGAR (8-K, 10-K, 10-Q — siempre preferir para datos de earnings) |
| 9 | Reuters, Bloomberg |
| 8 | CNBC |
| 7 | Yahoo Finance, TheStreet, GuruFocus, TipRanks |

**Prohibido usar:** TradingKey, Intellectia.ai, CoinCentral, Stocktwits, StartupHub, Simply Wall St, Money Morning, Wikipedia, MEXC, Benzinga como fuente unica.

- Datos numericos (EPS, revenue, precio objetivo) → verificar contra SEC EDGAR o Reuters antes de subir
- Si no hay fuente ≥7 que confirme la noticia → no subir
- Script: `node backend/upload_noticias.mjs noticias.json` (desde raiz del proyecto)

---

## Cómo generar un reporte

Cuando el usuario pida un análisis financiero de una empresa, responde ÚNICAMENTE con el JSON completo en el siguiente formato. No agregues texto antes ni después del JSON, solo el bloque de código.

### Formato obligatorio

```json
{
  "resumen": "Párrafo ejecutivo de 3-5 líneas. Qué hace la empresa, su posición competitiva y el veredicto en una frase.",

  "descripcion": "Párrafo de descripción del negocio: segmentos de ingresos, modelo de negocio, geografías principales, ventaja competitiva central.",

  "tabla": {
    "headers": ["Métrica", "2020", "2021", "2022", "2023", "2024", "Var. YoY"],
    "rows": [
      ["Revenue ($B)", "X", "X", "X", "X", "X", "+X%"],
      ["Utilidad Neta ($B)", "X", "X", "X", "X", "X", "+X%"],
      ["Margen Neto (%)", "X%", "X%", "X%", "X%", "X%", "+Xpp"],
      ["EBITDA ($B)", "X", "X", "X", "X", "X", "+X%"],
      ["FCF ($B)", "X", "X", "X", "X", "X", "+X%"],
      ["EPS", "$X", "$X", "$X", "$X", "$X", "+X%"],
      ["Deuda Neta ($B)", "X", "X", "X", "X", "X", "+X%"]
    ]
  },

  "kpis": [
    {
      "label": "P/E Trailing", "value": "28x", "signal": "yellow", "note": "vs. sector 22x",
      "precio_base": 152.50, "precio_fecha": "2026-03-20",
      "fundamento": { "tipo": "eps_ttm", "valor": 5.44 }
    },
    {
      "label": "P/E Forward", "value": "25x", "signal": "yellow",
      "precio_base": 152.50, "precio_fecha": "2026-03-20",
      "fundamento": { "tipo": "eps_fwd", "valor": 6.10 }
    },
    {
      "label": "EV/EBITDA", "value": "20x", "signal": "yellow",
      "precio_base": 152.50, "precio_fecha": "2026-03-20",
      "fundamento": { "tipo": "ev_ebitda", "ebitda_b": 130.0, "shares_m": 15400, "deuda_neta_b": 67.0 }
    },
    {
      "label": "P/FCF", "value": "30x", "signal": "yellow",
      "precio_base": 152.50, "precio_fecha": "2026-03-20",
      "fundamento": { "tipo": "p_fcf", "fcf_b": 100.0, "shares_m": 15400 }
    },
    { "label": "Deuda Neta/EBITDA", "value": "X.Xx", "signal": "green" },
    { "label": "ROE", "value": "X%", "signal": "green" },
    { "label": "ROIC", "value": "X%", "signal": "green" }
  ],

  "chart_ingresos": {
    "unit": "B USD",
    "data": [
      { "label": "2020", "revenue": 0, "utilidad": 0 },
      { "label": "2021", "revenue": 0, "utilidad": 0 },
      { "label": "2022", "revenue": 0, "utilidad": 0 },
      { "label": "2023", "revenue": 0, "utilidad": 0 },
      { "label": "2024", "revenue": 0, "utilidad": 0 }
    ],
    "series": [
      { "key": "revenue", "name": "Revenue" },
      { "key": "utilidad", "name": "Utilidad Neta" }
    ]
  },

  "chart_margenes": {
    "data": [
      { "label": "2020", "bruto": 0, "operativo": 0, "neto": 0 },
      { "label": "2021", "bruto": 0, "operativo": 0, "neto": 0 },
      { "label": "2022", "bruto": 0, "operativo": 0, "neto": 0 },
      { "label": "2023", "bruto": 0, "operativo": 0, "neto": 0 },
      { "label": "2024", "bruto": 0, "operativo": 0, "neto": 0 }
    ],
    "series": [
      { "key": "bruto", "name": "Margen Bruto" },
      { "key": "operativo", "name": "Margen Operativo" },
      { "key": "neto", "name": "Margen Neto" }
    ]
  },

  "flags": [
    { "level": "green", "title": "Fortaleza principal", "impact": "Alto", "evidence": "Dato concreto que la respalda.", "context": "Por qué importa para el inversionista." },
    { "level": "green", "title": "Segunda fortaleza", "impact": "Alto", "evidence": "...", "context": "..." },
    { "level": "yellow", "title": "Factor a monitorear", "impact": "Medio", "evidence": "...", "context": "..." },
    { "level": "red", "title": "Riesgo principal", "impact": "Alto", "evidence": "...", "context": "..." }
  ],

  "score": {
    "score": 0,
    "max": 10,
    "items": [
      { "label": "Poder de fijación de precios", "score": 0, "max": 10 },
      { "label": "Crecimiento de revenue", "score": 0, "max": 10 },
      { "label": "Calidad de márgenes", "score": 0, "max": 10 },
      { "label": "Solidez del balance", "score": 0, "max": 10 },
      { "label": "Generación de FCF", "score": 0, "max": 10 }
    ]
  },

  "verdict": {
    "status": "Comprar con Convicción / Mantener / Reducir / Evitar",
    "score": "X.X/10",
    "color": "green",
    "metrics": [
      { "label": "Revenue TTM", "value": "$XB" },
      { "label": "Margen Neto", "value": "X%" },
      { "label": "FCF Yield", "value": "X%" },
      { "label": "P/E Forward", "value": "Xx" },
      { "label": "Crecimiento Rev.", "value": "+X% YoY" }
    ],
    "bullets": [
      { "text": "**Razón principal →** Explicación directa basada en los datos del análisis.", "type": "pro" },
      { "text": "**Segunda razón →** Catalizador o ventaja competitiva estructural identificada.", "type": "pro" },
      { "text": "**Tercera razón →** Tercer punto de convicción.", "type": "pro" },
      { "text": "**Riesgo clave →** El riesgo más relevante que el inversionista debe monitorear.", "type": "con" }
    ]
  }
}
```

---

## Reglas estrictas

### Datos
- Usa únicamente datos reales de reportes públicos (10-K, 10-Q, earnings releases)
- Los números en `chart_ingresos` y `chart_margenes` deben ser valores numéricos puros — sin "$", sin "%", sin texto
- Los porcentajes en `chart_margenes` van como número entero o decimal: `27.4` no `"27.4%"`
- La columna `Var. YoY` en la tabla sí puede tener "%" o "pp" como texto: `"+16%"`, `"+2.3pp"`
- Si un dato no está disponible, usa `null` en charts o `"N/D"` en la tabla

### Señales de KPIs y flags
- `signal`: `"green"` (positivo), `"yellow"` (neutral/monitorear), `"red"` (negativo/riesgo)
- `level` en flags: `"green"`, `"yellow"`, `"red"`
- `color` en verdict: `"green"`, `"yellow"`, `"red"`

### Bullets de conclusión
- Máximo 4 bullets: idealmente 3 "pro" y 1 "con", o 2 y 2 según el caso
- `type`: `"pro"` o `"con"`
- Formato del texto: `"**Título corto →** Explicación en una o dos frases."` — el título va en negritas con `**`
- El título debe ser de 2-4 palabras, directo y específico

### JSON
- El JSON debe ser válido — sin comas finales, sin comentarios
- No incluyas texto antes ni después del bloque JSON
- No uses comillas simples, solo dobles

---

## Reportes de ETFs

Cuando el reporte sea de un ETF (SPY, QQQ, VOO, VTI, IVV, etc.), el JSON tiene un campo `"tipo": "etf"` y un schema diferente al de acciones. El portal detecta el campo y usa el renderer especializado `EtfRenderer.jsx`.

### Secciones de un reporte ETF

| Campo | Descripcion |
|---|---|
| `tipo` | Siempre `"etf"` |
| `resumen` | Parrafo ejecutivo del ETF |
| `descripcion` | Que indice sigue, estrategia, emisor |
| `ficha_tecnica` | Items clave: emisor, benchmark, AUM, inception, distribucion |
| `kpis_etf` | Expense ratio, tracking error, volumen, dividend yield, beta, sharpe |
| `top_holdings` | Top 10 posiciones con ticker, nombre, sector y peso |
| `diversificacion_sectorial` | Breakdown sectorial en % |
| `retorno_historico` | Tabla: periodo / ETF / benchmark / diferencia |
| `chart_retorno` | Grafica de barras retorno anual ETF vs benchmark |
| `valuacion` | Tabla P/E, P/B, P/FCF vs benchmark vs historico |
| `entorno_macro` | Factores macro con impacto positivo/neutral/negativo |
| `calendario_eventos` | Eventos proximos: dividendo, earnings holdings, rebalanceo |
| `flags` | Fortalezas y riesgos (mismo formato que acciones) |
| `score` | Score con criterios ETF (costo, liquidez, tracking, diversificacion, retornos) |
| `verdict` | Veredicto final (mismo formato que acciones) |
| `conclusion` | Items de conclusion (mismo formato que acciones) |

### Formato JSON completo para ETFs

```json
{
  "tipo": "etf",
  "resumen": "Parrafo ejecutivo de 3-4 lineas sobre el ETF y veredicto.",
  "descripcion": "Que indice replica, metodologia, emisor, quien deberia considerarlo.",

  "ficha_tecnica": {
    "items": [
      { "label": "Emisor", "value": "BlackRock / Vanguard / State Street" },
      { "label": "Indice benchmark", "value": "S&P 500" },
      { "label": "AUM", "value": "$X.XB" },
      { "label": "Expense Ratio", "value": "0.03%" },
      { "label": "Fecha inception", "value": "Ene-1993" },
      { "label": "Distribucion", "value": "Trimestral", "nota": "Dividend yield ~1.3%" },
      { "label": "Numero de holdings", "value": "503" },
      { "label": "Estructura", "value": "ETF fisico — replicacion completa" }
    ]
  },

  "kpis_etf": [
    { "label": "Expense Ratio", "value": "0.03%", "signal": "green", "note": "Muy bajo vs categoria 0.5%" },
    { "label": "Tracking Error (1a)", "value": "0.02%", "signal": "green", "note": "vs S&P 500" },
    { "label": "Volumen Diario Prom.", "value": "$25B", "signal": "green", "note": "Alta liquidez" },
    { "label": "Dividend Yield", "value": "1.3%", "signal": "yellow" },
    { "label": "Beta (3a)", "value": "1.00", "signal": "yellow", "benchmark": "S&P 500 = 1.0" },
    { "label": "Sharpe Ratio (3a)", "value": "0.85", "signal": "green" }
  ],

  "top_holdings": {
    "fecha": "Abr-2026",
    "porcentaje_total": "35.2%",
    "items": [
      { "rank": 1, "ticker": "AAPL", "nombre": "Apple Inc.", "sector": "Technology", "peso": "7.2%" },
      { "rank": 2, "ticker": "MSFT", "nombre": "Microsoft Corp.", "sector": "Technology", "peso": "6.8%" },
      { "rank": 3, "ticker": "NVDA", "nombre": "NVIDIA Corp.", "sector": "Technology", "peso": "5.1%" }
    ]
  },

  "diversificacion_sectorial": {
    "data": [
      { "label": "Information Technology", "pct": 31.5 },
      { "label": "Health Care", "pct": 12.3 },
      { "label": "Financials", "pct": 12.8 },
      { "label": "Consumer Discretionary", "pct": 10.1 },
      { "label": "Communication Services", "pct": 8.7 },
      { "label": "Industrials", "pct": 8.4 },
      { "label": "Consumer Staples", "pct": 6.0 },
      { "label": "Energy", "pct": 3.3 },
      { "label": "Utilities", "pct": 2.5 },
      { "label": "Real Estate", "pct": 2.2 },
      { "label": "Materials", "pct": 2.2 }
    ]
  },

  "retorno_historico": {
    "headers": ["Periodo", "ETF", "Benchmark", "Diferencia"],
    "rows": [
      ["1 mes", "+3.2%", "+3.1%", "+0.1%"],
      ["YTD", "+8.5%", "+8.3%", "+0.2%"],
      ["1 ano", "+24.1%", "+23.9%", "+0.2%"],
      ["3 anos (anual)", "+12.4%", "+12.2%", "+0.2%"],
      ["5 anos (anual)", "+16.8%", "+16.5%", "+0.3%"],
      ["10 anos (anual)", "+13.2%", "+13.0%", "+0.2%"]
    ]
  },

  "chart_retorno": {
    "unit": "%",
    "data": [
      { "label": "2019", "etf": 31.5, "benchmark": 31.5 },
      { "label": "2020", "etf": 18.4, "benchmark": 18.4 },
      { "label": "2021", "etf": 28.7, "benchmark": 28.7 },
      { "label": "2022", "etf": -18.1, "benchmark": -18.1 },
      { "label": "2023", "etf": 26.3, "benchmark": 26.3 },
      { "label": "2024", "etf": 25.0, "benchmark": 25.0 }
    ],
    "series": [
      { "key": "etf", "name": "SPY" },
      { "key": "benchmark", "name": "S&P 500" }
    ]
  },

  "valuacion": {
    "headers": ["Metrica", "ETF Actual", "Benchmark", "Promedio 10 anos"],
    "rows": [
      ["P/E", "21.5x", "21.2x", "18.3x"],
      ["P/B", "4.1x", "4.0x", "3.2x"],
      ["P/FCF", "18.2x", "—", "—"],
      ["Dividend Yield", "1.3%", "1.3%", "1.9%"]
    ]
  },

  "entorno_macro": {
    "items": [
      { "factor": "Tasas de interes", "impacto": "Negativo", "descripcion": "Tasas altas elevan el costo de oportunidad vs bonos y comprimen multiples de valuacion del indice." },
      { "factor": "Inflacion", "impacto": "Neutral", "descripcion": "La inflacion moderada beneficia a empresas con poder de precios, pero presiona margenes en sectores sin pricing power." },
      { "factor": "Crecimiento PIB EE.UU.", "impacto": "Positivo", "descripcion": "Expectativas de soft landing favorecen el consumo y los ingresos corporativos del S&P 500." }
    ]
  },

  "calendario_eventos": {
    "items": [
      { "fecha": "30-Jun-2026", "evento": "Distribucion de dividendo trimestral (estimado ~$1.65/accion)", "tipo": "dividendo" },
      { "fecha": "01-May-2026", "evento": "Earnings AAPL — Top holding (7.2% del ETF)", "tipo": "earnings", "nota": "Alta sensibilidad por peso" },
      { "fecha": "15-Jun-2026", "evento": "Rebalanceo trimestral del indice", "tipo": "rebalance" }
    ]
  },

  "flags": [
    { "level": "green", "title": "Costo minimo", "impact": "Alto", "evidence": "Expense ratio 0.03% — entre los mas bajos del mercado.", "context": "A 30 anos, la diferencia en costo vs un ETF de 0.50% puede representar decenas de miles de dolares en retornos compuestos." },
    { "level": "yellow", "title": "Concentracion sectorial", "impact": "Medio", "evidence": "31.5% en Information Technology.", "context": "Una caida en el sector tech impacta desproporcionadamente al fondo." },
    { "level": "red", "title": "Valuacion por encima de promedio historico", "impact": "Medio", "evidence": "P/E de 21.5x vs historico de 18.3x.", "context": "Precio de entrada elevado implica menor margen de seguridad para nuevos compradores." }
  ],

  "score": {
    "score": 8.5,
    "max": 10,
    "items": [
      { "label": "Costo (Expense Ratio)", "score": 10, "max": 10 },
      { "label": "Liquidez y volumen", "score": 10, "max": 10 },
      { "label": "Tracking error", "score": 9, "max": 10 },
      { "label": "Diversificacion sectorial", "score": 7, "max": 10 },
      { "label": "Consistencia de retornos", "score": 9, "max": 10 }
    ]
  },

  "verdict": {
    "status": "Acumular / Mantener / Reducir / Evitar",
    "score": "X.X/10",
    "color": "green",
    "metrics": [
      { "label": "AUM", "value": "$X.XB" },
      { "label": "Expense Ratio", "value": "0.03%" },
      { "label": "Dividend Yield", "value": "1.3%" },
      { "label": "Retorno 10a (anual)", "value": "+13.2%" },
      { "label": "Tracking Error", "value": "0.02%" }
    ],
    "bullets": [
      { "text": "**Titulo razon 1 ->** Explicacion.", "type": "pro" },
      { "text": "**Titulo razon 2 ->** Explicacion.", "type": "pro" },
      { "text": "**Titulo razon 3 ->** Explicacion.", "type": "pro" },
      { "text": "**Riesgo clave ->** El riesgo principal del ETF.", "type": "con" }
    ]
  },

  "conclusion": {
    "items": [
      { "label": "Costo y eficiencia", "texto": "..." },
      { "label": "Tracking y estructura", "texto": "..." },
      { "label": "Diversificacion", "texto": "..." },
      { "label": "Valuacion actual", "texto": "..." },
      { "label": "Para quien es adecuado", "texto": "..." },
      { "label": "Riesgos principales", "texto": "..." }
    ]
  }
}
```

### Reglas especificas para ETFs

- El campo `"tipo": "etf"` es OBLIGATORIO — sin el no se activa el renderer correcto
- `kpis_etf` NO tiene campo `fundamento` ni calculo en vivo — son estaticos (expense ratio no cambia)
- `diversificacion_sectorial.data[].pct` va como numero puro sin signo %
- `retorno_historico` — la ultima columna (Diferencia) se colorea automaticamente verde/rojo segun el valor
- `chart_retorno.data[]` — los valores van como numeros puros (positivos o negativos), sin %
- `calendario_eventos[].tipo` acepta: `"dividendo"`, `"earnings"`, `"rebalance"`, `"vencimiento"`, `"otro"`
- `entorno_macro[].impacto` acepta: `"Positivo"`, `"Neutral"`, `"Negativo"`, `"Mixto"`
- El score usa criterios de ETF: costo, liquidez, tracking error, diversificacion, consistencia de retornos
- Para el INSERT en Turso, agregar el campo `tipo` en el SQL: INSERT INTO reportes (..., tipo) VALUES (..., 'etf')

### INSERT en Turso para ETFs

```js
await db.execute({
  sql: 'INSERT INTO reportes (ticker, empresa, contenido_md, contenido_json, parrafos_gratis, publicado, slug, meta_descripcion, tipo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
  args: [ticker, empresa, '', json, 9, 1, slug, metaDesc, 'etf'],
});
```

---

## Comando: "actualiza los ETFs"

Cuando el usuario diga "actualiza los ETFs" o "actualiza [TICKER]", seguir este proceso exacto:

### Que se actualiza (y solo esto)

| Campo | Fuente |
|---|---|
| `top_holdings` | Pagina del emisor: iShares/Vanguard/SSGA — holdings diarios |
| `diversificacion_sectorial` | Se recalcula a partir de los nuevos holdings |
| `retorno_historico` | ETF.com o Morningstar — retornos YTD, 1a, 3a, 5a, 10a actuales |
| `chart_retorno` | Mismo origen — agrega o corrige el ano mas reciente completo |

### Que NO se toca

- `resumen`, `descripcion`, `ficha_tecnica` — estaticos
- `kpis_etf` — expense ratio, tracking error, beta, sharpe cambian minimo
- `entorno_macro` — solo si Ray pide actualizarlo explicitamente
- `flags`, `score`, `verdict`, `conclusion` — solo si los holdings cambiaron drasticamente
- `valuacion` — el precio en vivo ya lo maneja el endpoint `/api/precio`

### Proceso paso a paso

1. Consultar la BD para ver que ETFs existen con `tipo = 'etf'`
2. Por cada ETF, obtener datos frescos (1 llamada web por ETF maximo)
3. Tomar el `contenido_json` actual de la BD
4. Parsear el JSON, reemplazar SOLO los 4 campos indicados arriba
5. Subir con UPDATE (no INSERT) usando el id del reporte:

```js
await db.execute({
  sql: 'UPDATE reportes SET contenido_json = ?, updated_at = datetime("now") WHERE id = ?',
  args: [JSON.stringify(jsonActualizado), id],
});
```

6. Reportar al usuario: que ETFs se actualizaron, que cambio en holdings y retornos

### Fuentes de datos por emisor

- **iShares (BlackRock):** `ishares.com` — pagina del ETF, tab Holdings, CSV descargable
- **Vanguard:** `investor.vanguard.com` — pagina del fondo, Portfolio tab
- **State Street (SPDR):** `ssga.com` — pagina del ETF, Holdings tab
- **ETF.com o Morningstar:** para retornos historicos estandarizados

---

## Comando para pedir un reporte

Cuando el usuario escriba algo como:

> "Genera el reporte de Apple" / "Analiza MSFT" / "Dame el JSON de Tesla"

Responde directamente con el bloque JSON completo, listo para pegar en el portal.

Cuando sea un ETF:

> "Genera el reporte de SPY" / "Analiza QQQ" / "Dame el JSON del VOO"

Responde con el bloque JSON del schema ETF completo.

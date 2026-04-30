// _10k_extract.mjs — Extraccion quirurgica de Items 1, 1A y 7 del 10-K
// Maneja automaticamente 10-K de un solo archivo Y filings multi-archivo del SEC
// Uso: node _10k_extract.mjs "{URL_DEL_DOCUMENTO_PRINCIPAL_10K}"
// Requiere: Node.js 18+ (fetch nativo)

const [,, docUrl] = process.argv;
if (!docUrl) {
  console.error("Uso: node _10k_extract.mjs URL_10K");
  process.exit(1);
}

const HEADERS  = { "User-Agent": "Murza murra@murzainversiones.com" };
const MAX_CHARS = 4000;

function cleanHtml(raw) {
  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&#\d+;/g, ' ').replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractSections(text) {
  const PATTERNS = {
    "Item 1 — Business":      /Item\s+1[^A-Z\d].*?(?=Item\s+1A|Item\s+2\b)/is,
    "Item 1A — Risk Factors": /Item\s+1A.*?(?=Item\s+1B|Item\s+2\b)/is,
    "Item 7 — MDA":           /Item\s+7[^A-Z\d].*?(?=Item\s+7A|Item\s+8\b)/is,
  };
  const found = {};
  for (const [name, re] of Object.entries(PATTERNS)) {
    const m = text.match(re);
    if (m && m[0].trim().length > 200) found[name] = m[0].slice(0, MAX_CHARS).trim();
  }
  return found;
}

function getIndexUrl(url) {
  // Extraer el numero de accession (18 digitos) de la URL
  const m = url.match(/\/(\d{18})\//);
  if (!m) return null;
  const acc = m[1];
  const base = url.slice(0, url.indexOf(acc) + acc.length + 1);
  const accDashed = `${acc.slice(0,10)}-${acc.slice(10,12)}-${acc.slice(12)}`;
  return base + accDashed + '-index.json';
}

async function findItemUrlsInIndex(indexUrl) {
  let idx;
  try {
    const r = await fetch(indexUrl, { headers: HEADERS });
    idx = await r.json();
  } catch (e) {
    console.error(`[WARN] No se pudo obtener el indice: ${e.message}`);
    return {};
  }

  const items = idx?.directory?.item ?? idx?.items ?? [];
  const base  = indexUrl.slice(0, indexUrl.lastIndexOf('/') + 1);

  const KEYWORDS = {
    "Item 1 — Business":      ["business", "item 1 ", "item1 "],
    "Item 1A — Risk Factors": ["risk factor", "item 1a", "item1a"],
    "Item 7 — MDA":           ["management", "mda", "item 7 ", "item7 "],
  };

  const found = {};
  for (const doc of items) {
    const name = doc.name ?? '';
    if (!/\.(htm|html)$/i.test(name)) continue;
    const desc = (doc.description ?? doc.type ?? '').toLowerCase();
    for (const [section, kws] of Object.entries(KEYWORDS)) {
      if (!found[section] && kws.some(kw => desc.includes(kw))) {
        found[section] = base + name;
        break;
      }
    }
  }
  return found;
}

// ─── MAIN ──────────────────────────────────────────────────────────────────

console.error("[INFO] Descargando documento principal...");
const raw  = await (await fetch(docUrl, { headers: HEADERS })).text();
const text = cleanHtml(raw);
let sections = extractSections(text);

// Imprimir las que encontramos en el doc principal
for (const [name, chunk] of Object.entries(sections)) {
  console.log(`\n=== ${name} (${chunk.length} chars) ===\n${chunk}`);
}

// Detectar secciones faltantes
const ALL = ["Item 1 — Business", "Item 1A — Risk Factors", "Item 7 — MDA"];
const missing = ALL.filter(n => !sections[n]);

if (missing.length > 0) {
  console.error(`[INFO] ${missing.length} seccion(es) no encontradas en doc principal. Buscando en indice del filing...`);

  const indexUrl = getIndexUrl(docUrl);
  if (!indexUrl) {
    console.error("[ERROR] No se pudo derivar la URL del indice. Verificar que la URL contiene el numero de accession (18 digitos).");
    process.exit(1);
  }

  console.error(`[INFO] Indice: ${indexUrl}`);
  const itemUrls = await findItemUrlsInIndex(indexUrl);

  for (const section of missing) {
    if (itemUrls[section]) {
      console.error(`[INFO] Descargando ${section}...`);
      const subRaw  = await (await fetch(itemUrls[section], { headers: HEADERS })).text();
      const subText = cleanHtml(subRaw).slice(0, MAX_CHARS);
      if (subText.length > 200) {
        console.log(`\n=== ${section} (${subText.length} chars, sub-doc) ===\n${subText}`);
      } else {
        console.log(`\n=== ${section} === [sub-doc vacio o muy corto]`);
      }
    } else {
      console.log(`\n=== ${section} === [no encontrado en indice — revisar EDGAR manualmente]`);
    }
  }
}

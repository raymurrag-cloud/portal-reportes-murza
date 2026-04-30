# _10k_extract.py — Extraccion quirurgica de Items 1, 1A y 7 del 10-K
# Maneja automaticamente documentos de un solo archivo Y filings multi-archivo del SEC
# Uso: python3 _10k_extract.py "{URL_DEL_DOCUMENTO_PRINCIPAL_10K}"
import requests, re, sys, html as html_lib
from urllib.parse import urljoin

HEADERS = {"User-Agent": "Murza murra@murzainversiones.com"}
MAX_CHARS = 4000  # ~1000 tokens por seccion

def clean_html(raw):
    text = re.sub(r'<[^>]+>', ' ', raw)
    text = html_lib.unescape(text)
    return re.sub(r'\s+', ' ', text)

def extract_sections(text):
    """Intenta extraer Items 1, 1A y 7 de un bloque de texto limpio."""
    SECTIONS = {
        "Item 1 — Business":      r'Item\s+1[^A-Z\d].*?(?=Item\s+1A|Item\s+2\b)',
        "Item 1A — Risk Factors": r'Item\s+1A.*?(?=Item\s+1B|Item\s+2\b)',
        "Item 7 — MDA":           r'Item\s+7[^A-Z\d].*?(?=Item\s+7A|Item\s+8\b)',
    }
    found = {}
    for name, pattern in SECTIONS.items():
        m = re.search(pattern, text, re.S | re.I)
        if m and len(m.group(0).strip()) > 200:  # descartar matches triviales
            found[name] = m.group(0)[:MAX_CHARS].strip()
    return found

def get_index_url(doc_url):
    """Deriva la URL del indice JSON del filing a partir de la URL del documento."""
    # Ejemplo: .../edgar/data/320193/000032019324000123/aapl-20240928.htm
    # -> base: .../edgar/data/320193/000032019324000123/
    # -> accession raw: 000032019324000123
    # -> accession dashed: 0000320193-24-000123
    # -> index: .../000032019324000123/0000320193-24-000123-index.json
    parts = doc_url.rstrip('/').split('/')
    # Encontrar el segmento que parece un numero de accession (18 digitos)
    accession_raw = None
    base_parts = []
    for i, p in enumerate(parts):
        if re.match(r'^\d{18}$', p):
            accession_raw = p
            base_parts = parts[:i+1]
            break
    if not accession_raw:
        return None
    # Formatear: 0000320193-24-000123
    acc_dashed = f"{accession_raw[:10]}-{accession_raw[10:12]}-{accession_raw[12:]}"
    base_url = '/'.join(base_parts) + '/'
    return base_url + acc_dashed + '-index.json'

def find_item_urls_in_index(index_url):
    """
    Descarga el indice JSON del filing (3-8KB) y busca URLs de Items 1, 1A y 7.
    Devuelve dict {nombre_item: url}.
    """
    try:
        idx = requests.get(index_url, headers=HEADERS, timeout=15).json()
    except Exception as e:
        print(f"[WARN] No se pudo obtener el indice: {e}", file=sys.stderr)
        return {}

    # El indice puede tener diferentes estructuras segun la version del EDGAR
    items_list = (
        idx.get('directory', {}).get('item', [])  # formato clasico
        or idx.get('items', [])                    # formato alternativo
    )

    base_url = index_url.rsplit('/', 1)[0] + '/'
    keywords = {
        "Item 1 — Business":      ["business", "item 1 ", "item1 "],
        "Item 1A — Risk Factors": ["risk factor", "item 1a", "item1a"],
        "Item 7 — MDA":           ["management", "mda", "item 7 ", "item7 "],
    }

    found_urls = {}
    for doc in items_list:
        name = doc.get('name', '')
        desc = (doc.get('description', '') or doc.get('type', '')).lower()
        if not name.endswith(('.htm', '.html')):
            continue
        for section_name, kws in keywords.items():
            if section_name not in found_urls and any(kw in desc for kw in kws):
                found_urls[section_name] = urljoin(base_url, name)
                break

    return found_urls

# ─── MAIN ───────────────────────────────────────────────────────────────────

if len(sys.argv) < 2:
    print("Uso: python3 _10k_extract.py URL_10K")
    sys.exit(1)

doc_url = sys.argv[1]

# INTENTO 1: documento principal (funciona para 10-K de un solo archivo)
print(f"[INFO] Descargando documento principal...", file=sys.stderr)
raw  = requests.get(doc_url, headers=HEADERS, timeout=30).text
text = clean_html(raw)
sections = extract_sections(text)

if sections:
    # Exito con el documento principal
    for name, chunk in sections.items():
        print(f"\n=== {name} ({len(chunk)} chars) ===\n{chunk}")
    missing = [n for n in ["Item 1 — Business","Item 1A — Risk Factors","Item 7 — MDA"] if n not in sections]
    if missing:
        print(f"\n[WARN] Secciones no encontradas en doc principal: {missing}", file=sys.stderr)
        print("[INFO] Intentando con indice del filing...", file=sys.stderr)
else:
    print("[INFO] Documento principal no contiene Items. Buscando en indice del filing...", file=sys.stderr)

# INTENTO 2 (automatico): filing multi-archivo — sin costo de tokens para Claude
missing_sections = [n for n in ["Item 1 — Business","Item 1A — Risk Factors","Item 7 — MDA"] if n not in sections]

if missing_sections:
    index_url = get_index_url(doc_url)
    if not index_url:
        print("[ERROR] No se pudo derivar la URL del indice. Verificar que la URL contiene el numero de accession.", file=sys.stderr)
        sys.exit(1)

    print(f"[INFO] Indice: {index_url}", file=sys.stderr)
    item_urls = find_item_urls_in_index(index_url)

    for section_name in missing_sections:
        if section_name in item_urls:
            url = item_urls[section_name]
            print(f"[INFO] Descargando {section_name} desde {url}", file=sys.stderr)
            sub_raw  = requests.get(url, headers=HEADERS, timeout=30).text
            sub_text = clean_html(sub_raw)
            # Para sub-documentos, tomar directamente los primeros MAX_CHARS del contenido util
            chunk = sub_text.strip()[:MAX_CHARS]
            if len(chunk) > 200:
                print(f"\n=== {section_name} ({len(chunk)} chars, sub-doc) ===\n{chunk}")
            else:
                print(f"\n=== {section_name} === [sub-doc vacio o muy corto]")
        else:
            print(f"\n=== {section_name} === [no encontrado en indice — revisar EDGAR manualmente]")

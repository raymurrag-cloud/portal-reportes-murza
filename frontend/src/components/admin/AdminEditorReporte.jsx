import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api.js';

const JSON_TEMPLATE = `{
  "resumen": "Escribe aquí el resumen ejecutivo...",
  "descripcion": "Descripción del negocio, segmentos y modelo de ingresos...",
  "tabla": {
    "headers": ["Métrica", "2020", "2021", "2022", "2023", "2024", "Var. YoY"],
    "rows": [
      ["Revenue ($B)", "0", "0", "0", "0", "0", "+0%"],
      ["Utilidad Neta ($B)", "0", "0", "0", "0", "0", "+0%"],
      ["Margen Neto (%)", "0%", "0%", "0%", "0%", "0%", "+0pp"],
      ["EPS", "$0", "$0", "$0", "$0", "$0", "+0%"],
      ["FCF ($B)", "0", "0", "0", "0", "0", "+0%"]
    ]
  },
  "kpis": [
    { "label": "P/E Ratio", "value": "0x", "change": "+0% YoY", "signal": "yellow", "note": "vs. sector 0x" },
    { "label": "EV/EBITDA", "value": "0x", "signal": "yellow" },
    { "label": "P/FCF", "value": "0x", "signal": "yellow" },
    { "label": "Deuda Neta/EBITDA", "value": "0x", "signal": "green" },
    { "label": "ROE", "value": "0%", "signal": "green" },
    { "label": "ROIC", "value": "0%", "signal": "green" }
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
    { "level": "green", "title": "Fortaleza 1", "impact": "Alto", "evidence": "...", "context": "..." },
    { "level": "green", "title": "Fortaleza 2", "impact": "Alto", "evidence": "...", "context": "..." },
    { "level": "yellow", "title": "Punto a monitorear", "impact": "Medio", "evidence": "...", "context": "..." },
    { "level": "red", "title": "Riesgo principal", "impact": "Alto", "evidence": "...", "context": "..." }
  ],
  "score": {
    "score": 0, "max": 10,
    "items": [
      { "label": "Poder de fijación de precios", "score": 0, "max": 10 },
      { "label": "Crecimiento de revenue", "score": 0, "max": 10 },
      { "label": "Calidad de márgenes", "score": 0, "max": 10 },
      { "label": "Solidez del balance", "score": 0, "max": 10 },
      { "label": "Generación de FCF", "score": 0, "max": 10 }
    ]
  },
  "verdict": {
    "status": "Comprar con Convicción",
    "score": "0/10",
    "color": "green",
    "metrics": [
      { "label": "Revenue TTM", "value": "$0B" },
      { "label": "Margen Neto", "value": "0%" },
      { "label": "FCF Yield", "value": "0%" },
      { "label": "P/E Forward", "value": "0x" }
    ],
    "bullets": [
      { "text": "**Tesis principal →** explicación de la razón de inversión.", "type": "pro" },
      { "text": "**Segunda tesis →** catalizador o ventaja competitiva.", "type": "pro" },
      { "text": "**Riesgo clave →** el principal riesgo a monitorear.", "type": "con" }
    ]
  }
}`;


const VACIO = { ticker: '', empresa: '', contenido_md: '', contenido_json: '', parrafos_gratis: 2, slug: '', meta_descripcion: '' };

export default function AdminEditorReporte() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const esNuevo  = !id;

  const [form, setForm]     = useState(VACIO);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [ok, setOk]         = useState('');
  const [modo, setModo]     = useState('json'); // 'json' | 'markdown'

  useEffect(() => {
    if (!esNuevo) {
      api.adminGetReporte(id)
        .then(r => {
          setForm({
            ticker: r.ticker, empresa: r.empresa,
            contenido_md: r.contenido_md || '',
            contenido_json: r.contenido_json || '',
            parrafos_gratis: r.parrafos_gratis, slug: r.slug || '', meta_descripcion: r.meta_descripcion || '',
          });
          setModo(r.contenido_json ? 'json' : 'markdown');
        })
        .catch(() => navigate('/admin/login'));
    }
  }, [id]);

  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const guardar = async (publicar = false) => {
    if (!form.ticker || !form.empresa)
      return setError('Ticker y empresa son requeridos.');
    if (modo === 'json' && !form.contenido_json)
      return setError('Pega el JSON del reporte.');
    if (modo === 'markdown' && !form.contenido_md)
      return setError('El contenido Markdown es requerido.');
    if (modo === 'json') {
      try { JSON.parse(form.contenido_json); }
      catch { return setError('El JSON tiene un error de sintaxis. Verifica comillas y comas.'); }
    }

    setSaving(true); setError(''); setOk('');
    try {
      const payload = modo === 'json'
        ? { ...form, contenido_json: form.contenido_json, contenido_md: '', publicado: publicar }
        : { ...form, contenido_json: '', publicado: publicar };

      if (esNuevo) {
        const { id: newId, slug } = await api.adminCrearReporte(payload);
        if (publicar) {
          setOk(`✅ Publicado. URL: /reporte/${slug}`);
          setTimeout(() => navigate('/admin/reportes'), 1500);
        } else {
          navigate(`/admin/reportes/${newId}`);
        }
      } else {
        await api.adminEditarReporte(id, payload);
        if (publicar) await api.adminTogglePublicar(id);
        setOk('✅ Guardado correctamente.');
        setTimeout(() => navigate('/admin/reportes'), 1200);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const totalParrafos = form.contenido_md
    ? form.contenido_md.split(/\n\n+/).filter(p => p.trim()).length
    : 0;

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="admin-header-left">
          <img src="/murza-logo.png" alt="Murza" className="admin-logo" />
          <nav className="admin-nav">
            <Link to="/admin/reportes"    className="admin-nav-link">Reportes</Link>
            <Link to="/admin/leads"       className="admin-nav-link">Leads</Link>
            <Link to="/admin/prospectos"  className="admin-nav-link">Prospectos GBM</Link>
            <Link to="/admin/solicitudes" className="admin-nav-link">Solicitudes</Link>
            <Link to="/admin/analytics"  className="admin-nav-link">Analytics</Link>
            <Link to="/admin/visitantes" className="admin-nav-link">Visitantes</Link>
          </nav>
        </div>
        <Link to="/admin/reportes" className="btn-ghost-sm">← Volver</Link>
      </header>

      <main className="admin-main">
        <h2>{esNuevo ? 'Nuevo reporte' : 'Editar reporte'}</h2>

        {error && <div className="error-banner">{error}</div>}
        {ok    && <div className="success-banner">{ok}</div>}

        <div className="editor-grid">
          {/* Columna izquierda — metadatos */}
          <div className="editor-meta">
            <div className="form-group">
              <label>Ticker *</label>
              <input name="ticker" value={form.ticker} onChange={set}
                placeholder="AAPL" className="input-ticker" />
            </div>
            <div className="form-group">
              <label>Empresa *</label>
              <input name="empresa" value={form.empresa} onChange={set} placeholder="Apple Inc." />
            </div>
            <div className="form-group">
              <label>
                {modo === 'json' ? 'Secciones gratis' : 'Párrafos gratis'}
                {modo === 'markdown' && <span className="hint"> ({totalParrafos} totales)</span>}
              </label>
              <input name="parrafos_gratis" type="number" min="1" max={modo === 'json' ? 14 : (totalParrafos || 99)}
                value={form.parrafos_gratis} onChange={set} />
              <span className="field-hint">
                {modo === 'json'
                  ? 'Secciones sin login: 1=Resumen · 2=+Descripción · 3=+Tabla · 4=+KPIs · 5=+Gráfica ingresos · 6=+Gráfica márgenes · 7=+Capital Allocation · 8=+Comparación sector · 9=+Flags · 10=+Score · 11=+Análisis cualitativo · 12=+Veredicto · 13=+Conclusión · 14=Todo'
                  : 'Los primeros N párrafos se muestran sin login'}
              </span>
            </div>
            <div className="form-group">
              <label>Slug (URL)</label>
              <input name="slug" value={form.slug} onChange={set}
                placeholder="apple-aapl-2026-03 (auto si lo dejas vacío)" />
            </div>
            <div className="form-group">
              <label>Meta descripción SEO</label>
              <textarea name="meta_descripcion" value={form.meta_descripcion} onChange={set}
                rows={3} placeholder="Descripción para Google (160 chars). Auto si lo dejas vacío." maxLength={160} />
            </div>

            <div className="editor-actions">
              <button className="btn-ghost" onClick={() => guardar(false)} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar borrador'}
              </button>
              <button className="btn-primary" onClick={() => guardar(true)} disabled={saving}>
                {saving ? 'Publicando...' : 'Publicar'}
              </button>
            </div>
          </div>

          {/* Columna derecha — editor */}
          <div className="editor-contenido">
            {/* Tabs */}
            <div className="editor-tabs">
              <button
                className={`editor-tab ${modo === 'json' ? 'active' : ''}`}
                onClick={() => setModo('json')} type="button">
                ✦ JSON (recomendado)
              </button>
              <button
                className={`editor-tab ${modo === 'markdown' ? 'active' : ''}`}
                onClick={() => setModo('markdown')} type="button">
                Markdown (legacy)
              </button>
            </div>

            {modo === 'json' ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="editor-contenido-label">
                    JSON del reporte *
                    <span className="hint"> — pega el JSON que te dio Claude</span>
                  </label>
                  <button type="button" className="btn-ghost-sm"
                    onClick={() => setForm(f => ({ ...f, contenido_json: JSON_TEMPLATE }))}>
                    Cargar plantilla vacía
                  </button>
                </div>
                <textarea
                  name="contenido_json"
                  value={form.contenido_json}
                  onChange={set}
                  placeholder={'Pega aquí el JSON generado por Claude...\n\nO haz clic en "Cargar plantilla vacía" para ver la estructura.'}
                  className="editor-textarea"
                  style={{ fontFamily: 'Courier New, monospace', fontSize: 13 }}
                />
              </>
            ) : (
              <>
                <label className="editor-contenido-label">
                  Contenido Markdown
                  <span className="hint"> — formato anterior</span>
                </label>
                <textarea
                  name="contenido_md"
                  value={form.contenido_md}
                  onChange={set}
                  placeholder="Pega aquí el análisis en Markdown..."
                  className="editor-textarea"
                />
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

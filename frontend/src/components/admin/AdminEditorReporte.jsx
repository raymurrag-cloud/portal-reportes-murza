import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api.js';

const VACIO = { ticker: '', empresa: '', contenido_md: '', parrafos_gratis: 2, slug: '', meta_descripcion: '' };

export default function AdminEditorReporte() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const esNuevo  = !id;

  const [form, setForm]     = useState(VACIO);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [ok, setOk]         = useState('');

  useEffect(() => {
    if (!esNuevo) {
      api.adminGetReporte(id)
        .then(r => setForm({
          ticker: r.ticker, empresa: r.empresa, contenido_md: r.contenido_md,
          parrafos_gratis: r.parrafos_gratis, slug: r.slug || '', meta_descripcion: r.meta_descripcion || '',
        }))
        .catch(() => navigate('/admin/login'));
    }
  }, [id]);

  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const guardar = async (publicar = false) => {
    if (!form.ticker || !form.empresa || !form.contenido_md)
      return setError('Ticker, empresa y contenido son requeridos.');

    setSaving(true); setError(''); setOk('');
    try {
      if (esNuevo) {
        const { id: newId, slug } = await api.adminCrearReporte({ ...form, publicado: publicar });
        if (publicar) {
          setOk(`✅ Publicado. URL: /reporte/${slug}`);
          setTimeout(() => navigate('/admin/reportes'), 1500);
        } else {
          navigate(`/admin/reportes/${newId}`);
        }
      } else {
        await api.adminEditarReporte(id, form);
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
            <Link to="/admin/reportes" className="admin-nav-link">Reportes</Link>
            <Link to="/admin/leads"    className="admin-nav-link">Leads</Link>
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
              <label>Párrafos gratis <span className="hint">({totalParrafos} totales)</span></label>
              <input name="parrafos_gratis" type="number" min="1" max={totalParrafos || 99}
                value={form.parrafos_gratis} onChange={set} />
              <span className="field-hint">Los primeros N párrafos se muestran sin login</span>
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

          {/* Columna derecha — contenido Markdown */}
          <div className="editor-contenido">
            <label className="editor-contenido-label">
              Contenido del reporte (Markdown) *
              <span className="hint"> — pega el texto generado por Claude</span>
            </label>
            <textarea
              name="contenido_md"
              value={form.contenido_md}
              onChange={set}
              placeholder="Pega aquí el análisis financiero generado por Claude..."
              className="editor-textarea"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

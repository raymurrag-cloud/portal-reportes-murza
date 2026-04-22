import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { api } from '../../api.js';

export default function RegistroPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect') || '/';

  const [form, setForm] = useState({
    nombre: '', correo: '', telefono: '', ciudad: '',
    tiene_inversiones: '', capital_disponible: '', password: '',
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.correo || !form.capital_disponible || !form.password || form.tiene_inversiones === '')
      return setError('Por favor completa todos los campos.');

    setLoading(true);
    setError('');
    try {
      const { token, nombre } = await api.registro({ ...form, tiene_inversiones: form.tiene_inversiones === 'si' });
      localStorage.setItem('portal_user_token', token);
      localStorage.setItem('portal_user_nombre', nombre);
      navigate(redirect, { replace: true });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Registro gratis | Murza Inversiones</title>
        <meta name="description" content="Crea tu cuenta gratis en Murza Inversiones y accede a todos los reportes de analisis financiero de empresas publicas de EE.UU." />
        <link rel="canonical" href="https://reportes.murzainversiones.com/registro" />
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <div className="auth-page">
        <div className="auth-card">
          <Link to="/"><img src="/murza-logo.png" alt="Murza" className="auth-logo" /></Link>
          <h2>Crea tu cuenta gratis</h2>
          <p className="auth-sub">Accede a todos los reportes de análisis financiero.</p>

          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-row">
              <div className="form-group">
                <label>Nombre completo *</label>
                <input name="nombre" value={form.nombre} onChange={set} placeholder="Juan Pérez" required />
              </div>
              <div className="form-group">
                <label>Correo electrónico *</label>
                <input name="correo" type="email" value={form.correo} onChange={set} placeholder="juan@empresa.com" required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Teléfono</label>
                <input name="telefono" value={form.telefono} onChange={set} placeholder="+52 81 1234 5678" />
              </div>
              <div className="form-group">
                <label>Ciudad</label>
                <input name="ciudad" value={form.ciudad} onChange={set} placeholder="Monterrey" />
              </div>
            </div>

            <div className="form-group">
              <label>¿Actualmente tienes inversiones? *</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input type="radio" name="tiene_inversiones" value="si" checked={form.tiene_inversiones === 'si'} onChange={set} />
                  Sí
                </label>
                <label className="radio-label">
                  <input type="radio" name="tiene_inversiones" value="no" checked={form.tiene_inversiones === 'no'} onChange={set} />
                  No
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>¿Cuánto capital tienes disponible para invertir? *</label>
              <select name="capital_disponible" value={form.capital_disponible} onChange={set} required>
                <option value="">Selecciona una opción...</option>
                <option value="menos_500k">Menos de $500,000</option>
                <option value="500k_1m">$500,000 — $1,000,000</option>
                <option value="1m_3m">$1,000,000 — $3,000,000</option>
                <option value="mas_3m">Más de $3,000,000</option>
              </select>
            </div>

            <div className="form-group">
              <label>Contraseña *</label>
              <input name="password" type="password" value={form.password} onChange={set} placeholder="Mínimo 6 caracteres" minLength={6} required />
            </div>

            <button type="submit" className="btn-primary btn-full" disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta gratis'}
            </button>
          </form>

          <p className="auth-footer">
            ¿Ya tienes cuenta? <Link to={`/login?redirect=${redirect}`}>Inicia sesión</Link>
          </p>
        </div>
      </div>
    </>
  );
}

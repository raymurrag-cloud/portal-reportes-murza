import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { api } from '../../api.js';

export default function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect  = params.get('redirect') || '/';

  const [form, setForm]     = useState({ correo: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { token, nombre } = await api.login(form);
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
      <Helmet><title>Iniciar sesión | Murza Inversiones</title></Helmet>
      <div className="auth-page">
        <div className="auth-card">
          <Link to="/"><img src="/murza-logo.png" alt="Murza" className="auth-logo" /></Link>
          <h2>Iniciar sesión</h2>
          <p className="auth-sub">Accede a todos los reportes de análisis financiero.</p>

          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Correo electrónico</label>
              <input name="correo" type="email" value={form.correo} onChange={set} placeholder="juan@empresa.com" required />
            </div>
            <div className="form-group">
              <label>Contraseña</label>
              <input name="password" type="password" value={form.password} onChange={set} required />
            </div>
            <button type="submit" className="btn-primary btn-full" disabled={loading}>
              {loading ? 'Entrando...' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="auth-footer">
            ¿No tienes cuenta? <Link to={`/registro?redirect=${redirect}`}>Regístrate gratis</Link>
          </p>
        </div>
      </div>
    </>
  );
}

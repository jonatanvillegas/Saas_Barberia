import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import toast from 'react-hot-toast';
import './Login.css';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '', slug: '', isSuper: false });
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password || (!form.isSuper && !form.slug)) {
      toast.error('Todos los campos son requeridos');
      return;
    }
    setLoading(true);
    try {
      await login(form.email, form.password, form.slug);
      toast.success('¡Bienvenido!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-bg-pattern"></div>
      </div>

      <div className="login-card">
        <div className="login-logo">💈</div>
        <h1 className="login-title">Barbería Pro</h1>
        <p className="login-subtitle">Sistema de Gestión</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <input type="checkbox" id="isSuper" checked={form.isSuper} onChange={e => setForm({...form, isSuper: e.target.checked, slug: ''})} />
            <label htmlFor="isSuper" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Soy Super Administrador</label>
          </div>

          {!form.isSuper && (
            <div className="form-group">
              <label className="form-label">Nombre de Barbería (slug)</label>
              <input
                id="slug"
                name="slug"
                type="text"
                className="form-control"
                placeholder="ej: mi-barberia"
                value={form.slug}
                onChange={handleChange}
                autoComplete="off"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              className="form-control"
              placeholder="admin@barberia.com"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
            />
          </div>

          <button id="login-btn" type="submit" className="btn btn-primary btn-lg login-btn" disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span> : null}
            {loading ? 'Entrando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <p className="login-footer">
          ¿Barbería nueva? Contacta al administrador del sistema.
        </p>
      </div>
    </div>
  );
}

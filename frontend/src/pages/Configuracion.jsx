import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import useAuthStore from '../stores/authStore';

export default function Configuracion() {
  const { refreshMe } = useAuthStore();
  const [form, setForm] = useState({ nombre: '', slug: '', direccion: '', telefono: '', logo: '' });
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    api.get('/barberias/info')
      .then(r => {
        const b = r.data.data;
        setForm({ nombre: b.nombre || '', slug: b.slug || '', direccion: b.direccion || '', telefono: b.telefono || '', logo: b.logo || '' });
      })
      .catch(() => toast.error('Error cargando información'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      await api.put('/barberias/info', { nombre: form.nombre, direccion: form.direccion, telefono: form.telefono, logo: form.logo });
      await refreshMe();
      toast.success('✅ Información actualizada');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error guardando');
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) return <div className="loading-full"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1>⚙️ Configuración</h1>
        <p>Información de tu barbería</p>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre del Negocio *</label>
            <input type="text" className="form-control" placeholder="Mi Barbería"
              value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Slug (identificador)</label>
            <input type="text" className="form-control" value={form.slug} disabled
              style={{ opacity: 0.5, cursor: 'not-allowed' }} />
            <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>El slug no se puede cambiar</small>
          </div>
          <div className="form-group">
            <label className="form-label">Dirección</label>
            <input type="text" className="form-control" placeholder="Barrio, Calle, Ciudad"
              value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Teléfono</label>
            <input type="text" className="form-control" placeholder="8888-8888"
              value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">URL del Logo (opcional)</label>
            <input type="text" className="form-control" placeholder="https://..."
              value={form.logo} onChange={e => setForm({ ...form, logo: e.target.value })} />
          </div>

          {form.logo && (
            <div style={{ marginBottom: 20 }}>
              <img src={form.logo} alt="Logo" style={{ height: 80, borderRadius: 8, border: '1px solid var(--border)' }}
                onError={e => { e.target.style.display = 'none'; }} />
            </div>
          )}

          <button id="btn-guardar-config" type="submit" className="btn btn-primary" disabled={saveLoading}>
            {saveLoading ? '⏳ Guardando...' : '💾 Guardar Cambios'}
          </button>
        </form>
      </div>
    </div>
  );
}

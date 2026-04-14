import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const emptyForm = { nombre: '', slug: '', adminName: '', adminEmail: '', adminPassword: '' };

export default function AdminBarberias() {
  const [barberias, setBarberias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saveLoading, setSaveLoading] = useState(false);

  const cargar = useCallback(() => {
    setLoading(true);
    // Asumimos un endpoint para el superadmin
    api.get('/superadmin/barberias')
      .then(r => setBarberias(r.data.data))
      .catch(() => toast.error('Error cargando barberías'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const abrirNuevo = () => { setForm(emptyForm); setModal(true); };

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.slug || !form.adminEmail || !form.adminPassword) {
      toast.error('Todos los campos obligatorios son requeridos');
      return;
    }
    setSaveLoading(true);
    try {
      await api.post('/superadmin/barberias', form);
      toast.success('Barbería creada exitosamente');
      setModal(false);
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al crear barbería');
    } finally {
      setSaveLoading(false);
    }
  };

  const toggleEstado = async (b) => {
    try {
      await api.put(`/superadmin/barberias/${b._id}`, { activo: !b.activo });
      toast.success(`Barbería ${!b.activo ? 'activada' : 'inactivada'}`);
      cargar();
    } catch {
      toast.error('Error actualizando estado');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>🏢 Inquilinos (Barberías)</h1>
        <p>Panel de Control para Superusuario</p>
      </div>

      <div className="action-bar">
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{barberias.length} inquilinos</span>
        <button id="btn-nueva-barberia" className="btn btn-primary" onClick={abrirNuevo}>+ Nuevo Inquilino</button>
      </div>

      {loading ? (
        <div className="loading-full"><div className="spinner"></div></div>
      ) : barberias.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">🏢</div><p>No hay barberías registradas</p></div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr><th>Nombre</th><th>Slug</th><th>Admin Principal</th><th>Fecha Reg.</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {barberias.map(b => (
                <tr key={b.barberia._id}>
                  <td><strong>{b.barberia.nombre}</strong></td>
                  <td style={{ color: 'var(--accent)' }}>@{b.barberia.slug}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{b.admin?.email || 'N/A'}</td>
                  <td>{new Date(b.barberia.createdAt).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${b.barberia.activo ? 'badge-success' : 'badge-danger'}`}>
                      {b.barberia.activo ? 'Activa' : 'Desactivada'}
                    </span>
                  </td>
                  <td>
                    <button className={`btn btn-sm ${b.barberia.activo ? 'btn-danger' : 'btn-success'}`}
                      onClick={() => toggleEstado(b.barberia)}>
                      {b.barberia.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>+ Nuevo Inquilino</h2>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={guardar}>
              <div className="section-label" style={{ marginBottom: '12px' }}>Datos de Barbería</div>
              <div className="form-group">
                <label className="form-label">Nombre *</label>
                <input type="text" className="form-control" placeholder="Barbería Express"
                  value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Identificador (slug) *</label>
                <input type="text" className="form-control" placeholder="ej: barb-express"
                  value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} required />
              </div>

              <div className="section-label" style={{ margin: '20px 0 12px' }}>Datos del Administrador</div>
              <div className="form-group">
                <label className="form-label">Nombre del Dueño</label>
                <input type="text" className="form-control" placeholder="Juan Pérez"
                  value={form.adminName} onChange={e => setForm({ ...form, adminName: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Email Acceso Admin *</label>
                <input type="email" className="form-control" placeholder="admin@barberia.com"
                  value={form.adminEmail} onChange={e => setForm({ ...form, adminEmail: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Contraseña inicial *</label>
                <input type="password" className="form-control" placeholder="••••••••"
                  value={form.adminPassword} onChange={e => setForm({ ...form, adminPassword: e.target.value })} required />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saveLoading}>
                  {saveLoading ? 'Registrando...' : '🚀 Crear Inquilino'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const emptyForm = { nombre: '', email: '', password: '', rol: 'caja', colaborador: '' };
const ROLES = ['admin', 'barbero', 'caja'];

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saveLoading, setSaveLoading] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [resUsers, resCols] = await Promise.all([
        api.get('/usuarios'),
        api.get('/colaboradores')
      ]);
      setUsuarios(resUsers.data.data);
      setColaboradores(resCols.data.data.filter(c => c.estado));
    } catch {
      toast.error('Error cargando datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const abrirNuevo = () => { setEditando(null); setForm(emptyForm); setModal(true); };
  const abrirEdicion = (u) => {
    setEditando(u._id);
    setForm({ 
      nombre: u.nombre, 
      email: u.email, 
      password: '', 
      rol: u.rol, 
      colaborador: u.colaborador?._id || '' 
    });
    setModal(true);
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.email) { toast.error('Nombre y email son requeridos'); return; }
    if (!editando && !form.password) { toast.error('La contraseña es requerida para nuevos usuarios'); return; }
    
    // Validar que si es barbero, tenga colaborador vinculado
    if (form.rol === 'barbero' && !form.colaborador) {
       toast.error('Debes asociar un colaborador para el usuario barbero');
       return;
    }

    setSaveLoading(true);
    try {
      const payload = { 
        nombre: form.nombre, 
        email: form.email, 
        rol: form.rol,
        colaborador: form.rol === 'barbero' ? form.colaborador : null 
      };
      if (form.password) payload.password = form.password;
      
      if (editando) {
        await api.put(`/usuarios/${editando}`, payload);
        toast.success('Usuario actualizado');
      } else {
        await api.post('/usuarios', payload);
        toast.success('Usuario creado');
      }
      setModal(false);
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error guardando');
    } finally {
      setSaveLoading(false);
    }
  };

  const toggleActivo = async (u) => {
    try {
      await api.put(`/usuarios/${u._id}`, { activo: !u.activo });
      toast.success(`Usuario ${!u.activo ? 'activado' : 'inactivado'}`);
      cargar();
    } catch {
      toast.error('Error actualizando estado');
    }
  };

  const rolColor = { admin: 'badge-warning', barbero: 'badge-accent', caja: 'badge-info' };

  return (
    <div>
      <div className="page-header">
        <h1>👥 Usuarios</h1>
        <p>Gestión de acceso al sistema</p>
      </div>

      <div className="action-bar">
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{usuarios.length} usuarios</span>
        <button id="btn-nuevo-usuario" className="btn btn-primary" onClick={abrirNuevo}>+ Nuevo Usuario</button>
      </div>

      {loading ? (
        <div className="loading-full"><div className="spinner"></div></div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u._id}>
                  <td><strong>{u.nombre}</strong></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td><span className={`badge ${rolColor[u.rol] || 'badge-muted'}`}>{u.rol}</span></td>
                  <td><span className={`badge ${u.activo ? 'badge-success' : 'badge-danger'}`}>{u.activo ? 'Activo' : 'Inactivo'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => abrirEdicion(u)}>✏️</button>
                      <button className={`btn btn-sm ${u.activo ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => toggleActivo(u)}>
                        {u.activo ? 'Inactivar' : 'Activar'}
                      </button>
                    </div>
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
              <h2>{editando ? '✏️ Editar' : '+ Nuevo'} Usuario</h2>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={guardar}>
              <div className="form-group">
                <label className="form-label">Nombre *</label>
                <input type="text" className="form-control" placeholder="Nombre completo"
                  value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input type="email" className="form-control" placeholder="correo@ejemplo.com"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Contraseña {editando ? '(dejar vacío para no cambiar)' : '*'}</label>
                <input type="password" className="form-control" placeholder="••••••••"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Rol *</label>
                <select className="form-control" value={form.rol}
                  onChange={e => setForm({ ...form, rol: e.target.value })}>
                  {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>

              {form.rol === 'barbero' && (
                <div className="form-group">
                  <label className="form-label">Colaborador Asociado *</label>
                  <select className="form-control" value={form.colaborador}
                    onChange={e => setForm({ ...form, colaborador: e.target.value })} required>
                    <option value="">-- Seleccionar Colaborador --</option>
                    {colaboradores.map(c => (
                      <option key={c._id} value={c._id}>{c.nombre}</option>
                    ))}
                  </select>
                  <small style={{ color: 'var(--text-secondary)' }}>
                    Vincula este usuario con su ficha de rendimiento.
                  </small>
                </div>
              )}

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saveLoading}>
                  {saveLoading ? 'Guardando...' : '💾 Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

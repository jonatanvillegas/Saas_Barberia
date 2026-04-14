import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const fmt = (n) => `C$ ${Number(n || 0).toLocaleString('es-NI', { minimumFractionDigits: 2 })}`;

const emptyForm = { nombre: '', telefono: '', tipoPago: 'porcentaje', porcentaje: 50, salarioFijo: 0 };

export default function Colaboradores() {
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saveLoading, setSaveLoading] = useState(false);

  const cargar = useCallback(() => {
    setLoading(true);
    api.get('/colaboradores')
      .then(r => setColaboradores(r.data.data))
      .catch(() => toast.error('Error cargando colaboradores'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const abrirNuevo = () => { setEditando(null); setForm(emptyForm); setModal(true); };
  const abrirEdicion = (c) => {
    setEditando(c._id);
    setForm({ nombre: c.nombre, telefono: c.telefono || '', tipoPago: c.tipoPago, porcentaje: c.porcentaje, salarioFijo: c.salarioFijo });
    setModal(true);
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.nombre) { toast.error('El nombre es requerido'); return; }
    setSaveLoading(true);
    try {
      if (editando) {
        await api.put(`/colaboradores/${editando}`, form);
        toast.success('Colaborador actualizado');
      } else {
        await api.post('/colaboradores', form);
        toast.success('Colaborador creado');
      }
      setModal(false);
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error guardando');
    } finally {
      setSaveLoading(false);
    }
  };

  const toggleEstado = async (c) => {
    try {
      await api.put(`/colaboradores/${c._id}`, { estado: !c.estado });
      toast.success(`Colaborador ${!c.estado ? 'activado' : 'inactivado'}`);
      cargar();
    } catch {
      toast.error('Error actualizando estado');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>💇 Colaboradores</h1>
        <p>Gestión de barberos y su configuración de pago</p>
      </div>

      <div className="action-bar">
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{colaboradores.length} colaboradores</span>
        <button id="btn-nuevo-colaborador" className="btn btn-primary" onClick={abrirNuevo}>+ Nuevo Colaborador</button>
      </div>

      {loading ? (
        <div className="loading-full"><div className="spinner"></div></div>
      ) : colaboradores.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">💇</div><p>No hay colaboradores registrados</p></div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr><th>Nombre</th><th>Teléfono</th><th>Tipo de Pago</th><th>Configuración</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {colaboradores.map(c => (
                <tr key={c._id}>
                  <td><strong>{c.nombre}</strong></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{c.telefono || '—'}</td>
                  <td>
                    <span className={`badge ${c.tipoPago === 'porcentaje' ? 'badge-accent' : 'badge-info'}`}>
                      {c.tipoPago === 'porcentaje' ? '% Porcentaje' : '💵 Fijo'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {c.tipoPago === 'porcentaje' ? `${c.porcentaje}% por corte` : fmt(c.salarioFijo) + '/mes'}
                  </td>
                  <td>
                    <span className={`badge ${c.estado ? 'badge-success' : 'badge-danger'}`}>
                      {c.estado ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => abrirEdicion(c)}>✏️</button>
                      <button className={`btn btn-sm ${c.estado ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => toggleEstado(c)}>
                        {c.estado ? 'Inactivar' : 'Activar'}
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
              <h2>{editando ? '✏️ Editar' : '+ Nuevo'} Colaborador</h2>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={guardar}>
              <div className="form-group">
                <label className="form-label">Nombre *</label>
                <input type="text" className="form-control" placeholder="Nombre del barbero"
                  value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input type="text" className="form-control" placeholder="8888-8888"
                  value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Tipo de Pago *</label>
                <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: form.tipoPago === 'porcentaje' ? 'var(--accent)' : 'var(--text-secondary)' }}>
                    <input type="radio" name="tipoPago" value="porcentaje"
                      checked={form.tipoPago === 'porcentaje'} onChange={e => setForm({ ...form, tipoPago: e.target.value })} />
                    % Porcentaje
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: form.tipoPago === 'fijo' ? 'var(--accent)' : 'var(--text-secondary)' }}>
                    <input type="radio" name="tipoPago" value="fijo"
                      checked={form.tipoPago === 'fijo'} onChange={e => setForm({ ...form, tipoPago: e.target.value })} />
                    Salario Fijo
                  </label>
                </div>
              </div>
              {form.tipoPago === 'porcentaje' ? (
                <div className="form-group">
                  <label className="form-label">Porcentaje por Corte (%)</label>
                  <input type="number" min="0" max="100" className="form-control"
                    value={form.porcentaje} onChange={e => setForm({ ...form, porcentaje: parseFloat(e.target.value) })} />
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Salario Fijo Mensual (C$)</label>
                  <input type="number" min="0" step="0.01" className="form-control"
                    value={form.salarioFijo} onChange={e => setForm({ ...form, salarioFijo: parseFloat(e.target.value) })} />
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

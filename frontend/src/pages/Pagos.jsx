import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';

const fmt = (n) => `C$ ${Number(n || 0).toLocaleString('es-NI', { minimumFractionDigits: 2 })}`;
const fmtDate = (d) => new Date(d).toLocaleDateString('es-NI', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const METODOS = ['efectivo', 'transferencia', 'tarjeta', 'otro'];

export default function Pagos() {
  const navigate = useNavigate();
  const [pagos, setPagos] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({ desde: '', hasta: '', colaborador: '' });
  const [editando, setEditando] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);

  const cargarColaboradores = () =>
    api.get('/colaboradores').then(r => setColaboradores(r.data.data));

  const cargarPagos = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filtros.desde) params.append('desde', filtros.desde);
    if (filtros.hasta) params.append('hasta', filtros.hasta);
    if (filtros.colaborador) params.append('colaborador', filtros.colaborador);
    api.get(`/pagos?${params}`)
      .then(r => setPagos(r.data.data))
      .catch(() => toast.error('Error cargando pagos'))
      .finally(() => setLoading(false));
  }, [filtros]);

  useEffect(() => { cargarColaboradores(); }, []);
  useEffect(() => { cargarPagos(); }, [cargarPagos]);

  const abrirEdicion = (pago) => {
    setEditando(pago._id);
    setEditForm({
      colaborador: pago.colaborador?._id || '',
      tipoServicio: pago.tipoServicio,
      montoServicio: pago.montoServicio,
      montoPagado: pago.montoPagado,
      metodoPago: pago.metodoPago,
      fecha: pago.fecha?.slice(0, 10),
    });
  };

  const guardarEdicion = async () => {
    setSaveLoading(true);
    try {
      await api.put(`/pagos/${editando}`, {
        ...editForm,
        montoServicio: parseFloat(editForm.montoServicio),
        montoPagado: parseFloat(editForm.montoPagado),
      });
      toast.success('Pago actualizado');
      setEditando(null);
      cargarPagos();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error actualizando');
    } finally {
      setSaveLoading(false);
    }
  };

  const eliminarPago = async (id) => {
    if (!confirm('¿Eliminar este pago? También se eliminará del movimiento de caja.')) return;
    try {
      await api.delete(`/pagos/${id}`);
      toast.success('Pago eliminado');
      cargarPagos();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error eliminando');
    }
  };

  const totalGeneral = pagos.reduce((s, p) => s + p.montoServicio, 0);

  return (
    <div>
      <div className="page-header">
        <h1>🧾 Registro de Pagos</h1>
        <p>{pagos.length} registros encontrados — Total: {fmt(totalGeneral)}</p>
      </div>

      {/* Filtros */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="action-bar" style={{ margin: 0 }}>
          <div className="action-bar-left">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Desde</label>
              <input type="date" className="form-control" value={filtros.desde}
                onChange={e => setFiltros({ ...filtros, desde: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Hasta</label>
              <input type="date" className="form-control" value={filtros.hasta}
                onChange={e => setFiltros({ ...filtros, hasta: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Barbero</label>
              <select className="form-control" value={filtros.colaborador}
                onChange={e => setFiltros({ ...filtros, colaborador: e.target.value })}>
                <option value="">Todos</option>
                {colaboradores.map(c => <option key={c._id} value={c._id}>{c.nombre}</option>)}
              </select>
            </div>
          </div>
          <button id="btn-nuevo-pago" className="btn btn-primary" onClick={() => navigate('/pagos/nuevo')}>
            + Nuevo Pago
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-full"><div className="spinner"></div></div>
      ) : pagos.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">🧾</div><p>No hay pagos registrados</p></div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th><th>Barbero</th><th>Servicio</th>
                <th>Monto</th><th>Pagado</th><th>Vuelto</th>
                <th>Método</th><th>Registró</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pagos.map(p => (
                <tr key={p._id}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>{fmtDate(p.fecha)}</td>
                  <td><strong>{p.colaborador?.nombre}</strong></td>
                  <td>{p.tipoServicio}</td>
                  <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{fmt(p.montoServicio)}</td>
                  <td>{fmt(p.montoPagado)}</td>
                  <td style={{ color: 'var(--success)' }}>{fmt(p.vuelto)}</td>
                  <td><span className="badge badge-info">{p.metodoPago}</span></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{p.usuarioRegistro?.nombre}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => abrirEdicion(p)}>✏️</button>
                      <button className="btn btn-danger btn-sm" onClick={() => eliminarPago(p._id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Edición */}
      {editando && (
        <div className="modal-overlay" onClick={() => setEditando(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✏️ Editar Pago</h2>
              <button className="modal-close" onClick={() => setEditando(null)}>✕</button>
            </div>
            <div className="form-group">
              <label className="form-label">Barbero</label>
              <select className="form-control" value={editForm.colaborador}
                onChange={e => setEditForm({ ...editForm, colaborador: e.target.value })}>
                {colaboradores.map(c => <option key={c._id} value={c._id}>{c.nombre}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Tipo Servicio</label>
                <input className="form-control" value={editForm.tipoServicio}
                  onChange={e => setEditForm({ ...editForm, tipoServicio: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Método Pago</label>
                <select className="form-control" value={editForm.metodoPago}
                  onChange={e => setEditForm({ ...editForm, metodoPago: e.target.value })}>
                  {METODOS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Monto Servicio</label>
                <input type="number" step="0.01" className="form-control" value={editForm.montoServicio}
                  onChange={e => setEditForm({ ...editForm, montoServicio: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Monto Pagado</label>
                <input type="number" step="0.01" className="form-control" value={editForm.montoPagado}
                  onChange={e => setEditForm({ ...editForm, montoPagado: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Fecha</label>
              <input type="date" className="form-control" value={editForm.fecha}
                onChange={e => setEditForm({ ...editForm, fecha: e.target.value })} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setEditando(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardarEdicion} disabled={saveLoading}>
                {saveLoading ? 'Guardando...' : '💾 Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

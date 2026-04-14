import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import useAuthStore from '../stores/authStore';

const fmt = (n) => `C$ ${Number(n || 0).toLocaleString('es-NI', { minimumFractionDigits: 2 })}`;
const fmtDate = (d) => new Date(d).toLocaleDateString('es-NI', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const CATEGORIAS_EGRESO = ['Productos', 'Servicios', 'Alquiler', 'Salarios', 'Equipos', 'Otros'];

export default function Caja() {
  const { usuario } = useAuthStore();
  const [movimientos, setMovimientos] = useState([]);
  const [totales, setTotales] = useState({ ingresos: 0, egresos: 0, balance: 0 });
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({ desde: '', hasta: '', tipo: '' });
  
  // Estado de Sesión (Arqueo)
  const [sesionActiva, setSesionActiva] = useState(null);
  const [modalApertura, setModalApertura] = useState(false);
  const [modalCierre, setModalCierre] = useState(false);
  const [montoSesion, setMontoSesion] = useState('');

  const [modalEgreso, setModalEgreso] = useState(false);
  const [form, setForm] = useState({ tipo: 'egreso', categoria: 'Productos', monto: '', descripcion: '', fecha: new Date().toISOString().slice(0, 10) });
  const [saveLoading, setSaveLoading] = useState(false);

  const cargarCaja = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Cargar estado de sesión
      const resSesion = await api.get('/caja/sesion');
      setSesionActiva(resSesion.data.data);

      // 2. Cargar movimientos
      const params = new URLSearchParams();
      if (filtros.desde) params.append('desde', filtros.desde);
      if (filtros.hasta) params.append('hasta', filtros.hasta);
      if (filtros.tipo) params.append('tipo', filtros.tipo);
      
      const resMov = await api.get(`/caja?${params}`);
      setMovimientos(resMov.data.data);
      setTotales(resMov.data.totales);
    } catch {
      toast.error('Error cargando datos de caja');
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => { cargarCaja(); }, [cargarCaja]);

  const abrirCaja = async (e) => {
    e.preventDefault();
    if (montoSesion === '' || parseFloat(montoSesion) < 0) {
      toast.error('Monto de apertura inválido');
      return;
    }
    setSaveLoading(true);
    try {
      await api.post('/caja/abrir', { montoApertura: parseFloat(montoSesion) });
      toast.success('Caja Aperturada');
      setModalApertura(false);
      setMontoSesion('');
      cargarCaja();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al abrir');
    } finally {
      setSaveLoading(false);
    }
  };

  const cerrarCaja = async (e) => {
    e.preventDefault();
    if (montoSesion === '' || parseFloat(montoSesion) < 0) {
      toast.error('Monto de cierre inválido');
      return;
    }
    setSaveLoading(true);
    try {
      await api.post('/caja/cerrar', { montoCierre: parseFloat(montoSesion) });
      toast.success('Caja Cerrada Exitosamente');
      setModalCierre(false);
      setMontoSesion('');
      cargarCaja();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al cerrar');
    } finally {
      setSaveLoading(false);
    }
  };

  const registrarMovimiento = async (e) => {
    e.preventDefault();
    if (!sesionActiva) {
      toast.error('Debe abrir la caja primero');
      return;
    }
    if (!form.monto || parseFloat(form.monto) <= 0) { toast.error('Monto inválido'); return; }
    setSaveLoading(true);
    try {
      await api.post('/caja', { ...form, monto: parseFloat(form.monto) });
      toast.success('Movimiento registrado');
      setModalEgreso(false);
      setForm({ tipo: 'egreso', categoria: 'Productos', monto: '', descripcion: '', fecha: new Date().toISOString().slice(0, 10) });
      cargarCaja();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setSaveLoading(false);
    }
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este movimiento?')) return;
    try {
      await api.delete(`/caja/${id}`);
      toast.success('Movimiento eliminado');
      cargarCaja();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error eliminando');
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>💰 Caja y Arqueo</h1>
          <p>Gestión financiera y control de turnos</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span className={`badge ${sesionActiva ? 'badge-success' : 'badge-danger'}`} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
            {sesionActiva ? '● CAJA ABIERTA' : '○ CAJA CERRADA'}
          </span>
          {sesionActiva && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 6 }}>
              Apertura: {fmtDate(sesionActiva.fechaApertura)} por {sesionActiva.usuarioApertura?.nombre}
            </div>
          )}
        </div>
      </div>

      {/* Acciones de Sesión */}
      <div className="card" style={{ marginBottom: 24, borderLeft: `4px solid ${sesionActiva ? 'var(--success)' : 'var(--danger)'}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: 4 }}>
              {sesionActiva ? 'Finalizar Turno Actual' : 'Iniciar Nuevo Turno'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {sesionActiva 
                ? 'Al cerrar caja se realizará el arqueo contra los ingresos registrados.' 
                : 'Es obligatorio ingresar un fondo inicial para habilitar el sistema.'}
            </p>
          </div>
          <div>
            {sesionActiva ? (
              <button className="btn btn-danger" onClick={() => setModalCierre(true)}>🔒 Cerrar Caja</button>
            ) : (
              (usuario?.rol === 'admin' || usuario?.rol === 'caja') && (
                <button className="btn btn-success" onClick={() => setModalApertura(true)}>🔑 Abrir Caja</button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="stats-grid">
        <div className="stat-card" style={{ borderColor: 'rgba(34,197,94,0.3)' }}>
          <div className="stat-label">Total Ingresos</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{fmt(totales.ingresos)}</div>
          <div className="stat-icon">📥</div>
        </div>
        <div className="stat-card" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
          <div className="stat-label">Total Egresos</div>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>{fmt(totales.egresos)}</div>
          <div className="stat-icon">📤</div>
        </div>
        <div className={`stat-card ${totales.balance >= 0 ? 'accent' : ''}`}>
          <div className="stat-label">Balance en Efectivo</div>
          <div className="stat-value" style={{ color: totales.balance >= 0 ? 'var(--accent)' : 'var(--danger)' }}>
            {fmt(totales.balance)}
          </div>
          <div className="stat-icon">💎</div>
        </div>
      </div>

      {/* Filtros + Acción Movimiento */}
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
          </div>
          <button className="btn btn-ghost" onClick={() => setModalEgreso(true)} disabled={!sesionActiva}>
            + Registrar Gasto/Ingreso Manual
          </button>
        </div>
      </div>

      {/* Tabla Movimientos */}
      {loading ? (
        <div className="loading-full"><div className="spinner"></div></div>
      ) : movimientos.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">💰</div><p>Sin movimientos en este periodo</p></div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr><th>Fecha</th><th>Tipo</th><th>Categoría</th><th>Descripción</th><th>Monto</th><th>Usuario</th><th></th></tr>
            </thead>
            <tbody>
              {movimientos.map(m => (
                <tr key={m._id}>
                  <td style={{ fontSize: '0.8rem' }}>{new Date(m.fecha).toLocaleString()}</td>
                  <td>
                    <span className={`badge ${m.tipo === 'ingreso' ? 'badge-success' : 'badge-danger'}`}>
                      {m.tipo === 'ingreso' ? '📥 Ingreso' : '📤 Egreso'}
                    </span>
                  </td>
                  <td>{m.categoria}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{m.descripcion || '—'}</td>
                  <td style={{ fontWeight: 600, color: m.tipo === 'ingreso' ? 'var(--success)' : 'var(--danger)' }}>
                    {m.tipo === 'ingreso' ? '+' : '-'}{fmt(m.monto)}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{m.usuario?.nombre}</td>
                  <td>
                    {!m.pago && (
                      <button className="btn btn-danger btn-sm" onClick={() => eliminar(m._id)}>🗑️</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modales: Apertura / Cierre / Egreso */}
      
      {/* 1. APERTURA */}
      {modalApertura && (
        <div className="modal-overlay" onClick={() => setModalApertura(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🔑 Apertura de Caja</h2>
              <button className="modal-close" onClick={() => setModalApertura(false)}>✕</button>
            </div>
            <form onSubmit={abrirCaja}>
              <div className="form-group">
                <label className="form-label">Monto Inicial (Fondo) *</label>
                <input type="number" step="0.01" min="0" className="form-control" placeholder="0.00"
                  value={montoSesion} onChange={e => setMontoSesion(e.target.value)} required />
                <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: 8 }}>
                  Ingresa el efectivo disponible en caja física al iniciar el turno.
                </small>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModalApertura(false)}>Cancelar</button>
                <button type="submit" className="btn btn-success" disabled={saveLoading}>
                  {saveLoading ? 'Procesando...' : 'Iniciar Turno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. CIERRE */}
      {modalCierre && (
        <div className="modal-overlay" onClick={() => setModalCierre(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🔒 Cierre de Caja (Arqueo)</h2>
              <button className="modal-close" onClick={() => setModalCierre(false)}>✕</button>
            </div>
            <form onSubmit={cerrarCaja}>
              <div style={{ background: 'var(--bg-surface)', padding: 16, borderRadius: 'var(--radius-sm)', marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>Fondo Inicial:</span>
                  <span style={{ fontWeight: 600 }}>{fmt(sesionActiva?.montoApertura)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>Ingresos (Sistema):</span>
                  <span style={{ fontWeight: 600, color: 'var(--success)' }}>+{fmt(totales.ingresos)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>Egresos (Sistema):</span>
                  <span style={{ fontWeight: 600, color: 'var(--danger)' }}>-{fmt(totales.egresos)}</span>
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '12px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 700 }}>
                  <span>Total Esperado:</span>
                  <span>{fmt(sesionActiva?.montoApertura + totales.balance)}</span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Efectivo Real en Caja *</label>
                <input type="number" step="0.01" min="0" className="form-control" placeholder="0.00"
                  value={montoSesion} onChange={e => setMontoSesion(e.target.value)} required />
                <small style={{ color: 'var(--warning)', display: 'block', marginTop: 8 }}>
                  Cuenta el dinero físico antes de cerrar.
                </small>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModalCierre(false)}>Cancelar</button>
                <button type="submit" className="btn btn-danger" disabled={saveLoading}>
                  Finalizar Arqueo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. MOVIMIENTO EGRESO */}
      {modalEgreso && (
        <div className="modal-overlay" onClick={() => setModalEgreso(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>➕ Registrar Movimiento</h2>
              <button className="modal-close" onClick={() => setModalEgreso(false)}>✕</button>
            </div>
            <form onSubmit={registrarMovimiento}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Tipo</label>
                  <select className="form-control" value={form.tipo}
                    onChange={e => setForm({ ...form, tipo: e.target.value })}>
                    <option value="ingreso">Ingreso</option>
                    <option value="egreso">Egreso</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Categoría</label>
                  <select className="form-control" value={form.categoria}
                    onChange={e => setForm({ ...form, categoria: e.target.value })}>
                    {CATEGORIAS_EGRESO.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Monto (C$) *</label>
                <input type="number" step="0.01" min="0.01" className="form-control" placeholder="0.00"
                  value={form.monto} onChange={e => setForm({ ...form, monto: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <input type="text" className="form-control" placeholder="¿En qué se gastó?"
                  value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModalEgreso(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saveLoading}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';

const fmt = (n) => `C$ ${Number(n || 0).toLocaleString('es-NI', { minimumFractionDigits: 2 })}`;

const METODOS = ['efectivo', 'transferencia', 'tarjeta', 'otro'];

export default function NuevoPago() {
  const navigate = useNavigate();
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    colaborador: '',
    tipoServicio: 'Corte',
    montoServicio: '',
    montoPagado: '',
    metodoPago: 'efectivo',
    fecha: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    api.get('/colaboradores?activo=true')
      .then(r => setColaboradores(r.data.data))
      .catch(() => toast.error('Error cargando colaboradores'));
  }, []);

  const vuelto = (parseFloat(form.montoPagado) || 0) - (parseFloat(form.montoServicio) || 0);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.colaborador || !form.montoServicio || !form.montoPagado) {
      toast.error('Barbero, monto del servicio y monto pagado son requeridos');
      return;
    }
    if (parseFloat(form.montoPagado) < parseFloat(form.montoServicio)) {
      toast.error('El monto pagado no puede ser menor al monto del servicio');
      return;
    }
    setLoading(true);
    try {
      await api.post('/pagos', {
        ...form,
        montoServicio: parseFloat(form.montoServicio),
        montoPagado: parseFloat(form.montoPagado),
      });
      toast.success('✅ Pago registrado correctamente');
      navigate('/pagos');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error registrando pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>✂️ Registrar Pago</h1>
        <p>Registra un nuevo servicio realizado</p>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Barbero *</label>
            <select id="colaborador" name="colaborador" className="form-control" value={form.colaborador} onChange={handleChange} required>
              <option value="">Seleccionar barbero...</option>
              {colaboradores.map(c => (
                <option key={c._id} value={c._id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tipo de Servicio</label>
              <input id="tipoServicio" name="tipoServicio" type="text" className="form-control"
                placeholder="Corte, Barba, Combo..."
                value={form.tipoServicio} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Método de Pago</label>
              <select id="metodoPago" name="metodoPago" className="form-control" value={form.metodoPago} onChange={handleChange}>
                {METODOS.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Monto del Servicio (C$) *</label>
              <input id="montoServicio" name="montoServicio" type="number" step="0.01" min="0"
                className="form-control" placeholder="0.00"
                value={form.montoServicio} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Monto Pagado (C$) *</label>
              <input id="montoPagado" name="montoPagado" type="number" step="0.01" min="0"
                className="form-control" placeholder="0.00"
                value={form.montoPagado} onChange={handleChange} required />
            </div>
          </div>

          {/* Vuelto automático */}
          <div className="vuelto-display">
            <span className="vuelto-label">Vuelto</span>
            <span className={`vuelto-value ${vuelto < 0 ? 'negative' : ''}`}>
              {fmt(vuelto < 0 ? 0 : vuelto)}
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Fecha</label>
            <input id="fecha" name="fecha" type="date" className="form-control" value={form.fecha} onChange={handleChange} />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>Cancelar</button>
            <button id="submit-pago" type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={loading}>
              {loading ? '⏳ Guardando...' : '💾 Registrar Pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

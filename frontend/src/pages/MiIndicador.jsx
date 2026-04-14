import { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import useAuthStore from '../stores/authStore';

const fmt = (n) => `C$ ${Number(n || 0).toLocaleString('es-NI', { minimumFractionDigits: 2 })}`;
const fmtDateTime = (d) => new Date(d).toLocaleString('es-NI', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function toDateInputValue(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function MiIndicador() {
  const { barberia, usuario } = useAuthStore();
  const hoy = useMemo(() => new Date(), []);
  const inicioMes = useMemo(() => new Date(hoy.getFullYear(), hoy.getMonth(), 1), [hoy]);

  const [filtros, setFiltros] = useState({
    // Por defecto: hoy, para que vea el progreso del día
    desde: toDateInputValue(hoy),
    hasta: toDateInputValue(hoy),
  });
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [mensajeVacio, setMensajeVacio] = useState('Sin datos en este rango');

  const setFiltrosConCarga = (next) => {
    setLoading(true);
    setFiltros(next);
  };

  useEffect(() => {
    let cancelado = false;

    const params = new URLSearchParams();
    if (filtros.desde) params.append('desde', filtros.desde);
    if (filtros.hasta) params.append('hasta', filtros.hasta);

    api.get(`/mi-indicador?${params.toString()}`)
      .then((r) => {
        if (cancelado) return;
        setMensajeVacio(r.data?.message || 'Sin datos en este rango');
        setData(r.data?.data || null);
      })
      .catch(() => {
        if (cancelado) return;
        toast.error('Error cargando tu indicador');
        setMensajeVacio('Sin datos en este rango');
        setData(null);
      })
      .finally(() => {
        if (cancelado) return;
        setLoading(false);
      });

    return () => { cancelado = true; };
  }, [filtros]);

  return (
    <div>
      <div className="page-header">
        <h1>📈 Mi Indicador</h1>
        <p>
          {barberia?.nombre ? `Barbería: ${barberia.nombre} · ` : ''}
          {usuario?.nombre ? `${usuario.nombre} · ` : ''}
          Tu rendimiento en el periodo seleccionado
        </p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="action-bar" style={{ margin: 0 }}>
          <div className="action-bar-left">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Desde</label>
              <input
                type="date"
                className="form-control"
                value={filtros.desde}
                onChange={(e) => setFiltrosConCarga((f) => ({ ...f, desde: e.target.value }))}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Hasta</label>
              <input
                type="date"
                className="form-control"
                value={filtros.hasta}
                onChange={(e) => setFiltrosConCarga((f) => ({ ...f, hasta: e.target.value }))}
              />
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setFiltrosConCarga({ desde: toDateInputValue(hoy), hasta: toDateInputValue(hoy) })}
            >
              Hoy
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setFiltrosConCarga({ desde: toDateInputValue(inicioMes), hasta: toDateInputValue(hoy) })}
            >
              Este mes
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-full"><div className="spinner"></div></div>
      ) : !data || !data?.resumen ? (
        <div className="empty-state">
          <div className="empty-icon">📈</div>
          <p>{mensajeVacio}</p>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card accent">
              <div className="stat-label">Total Generado</div>
              <div className="stat-value">{fmt(data.resumen.totalGenerado)}</div>
              <div className="stat-sub">Ingresos brutos</div>
              <div className="stat-icon">💰</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Cortes Realizados</div>
              <div className="stat-value">{data.resumen.totalCortes}</div>
              <div className="stat-sub">Servicios en el periodo</div>
              <div className="stat-icon">✂️</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Mi Ganancia</div>
              <div className="stat-value">{fmt(data.resumen.ganancia)}</div>
              <div className="stat-sub">
                {data.esquemaPago?.tipoPago === 'porcentaje'
                  ? `Porcentaje: ${Number(data.esquemaPago?.porcentaje || 0)}%`
                  : `Fijo: ${fmt(data.esquemaPago?.salarioFijo)}`}
              </div>
              <div className="stat-icon">🧾</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Esquema de Pago</div>
              <div className="stat-value" style={{ fontSize: '1.25rem' }}>
                {data.esquemaPago?.tipoPago === 'porcentaje' ? 'Porcentaje' : 'Fijo'}
              </div>
              <div className="stat-sub">
                {data.esquemaPago?.tipoPago === 'porcentaje'
                  ? `Comisión sobre ventas`
                  : `Comisión fija por servicio`}
              </div>
              <div className="stat-icon">📌</div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 24 }}>
            <h3 style={{ marginBottom: 16, fontSize: '1.05rem' }}>Historial</h3>
            {!data.pagos || data.pagos.length === 0 ? (
              <div className="empty-state" style={{ padding: 24 }}>
                <div className="empty-icon" style={{ fontSize: '2rem' }}>🧾</div>
                <p style={{ margin: 0 }}>No hay pagos registrados en este rango</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Servicio</th>
                      <th>Método</th>
                      <th style={{ textAlign: 'right' }}>Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.pagos.map((p) => (
                      <tr key={p._id || p.createdAt}>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {fmtDateTime(p.createdAt || p.fecha)}
                        </td>
                        <td><strong>{p.tipoServicio || 'Corte'}</strong></td>
                        <td style={{ color: 'var(--text-secondary)' }}>{p.metodoPago || 'efectivo'}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(p.montoServicio)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

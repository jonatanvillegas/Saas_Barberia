import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const fmt = (n) => `C$ ${Number(n || 0).toLocaleString('es-NI', { minimumFractionDigits: 2 })}`;
const fmtDate = (d) => new Date(d).toLocaleDateString('es-NI', { day: '2-digit', month: 'short', year: 'numeric' });

export default function Reportes() {
  const [tab, setTab] = useState('pagos');
  const [colaboradores, setColaboradores] = useState([]);
  const [filtros, setFiltros] = useState({ desde: '', hasta: '', colaborador: '' });
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/colaboradores').then(r => setColaboradores(r.data.data));
  }, []);

  const generar = useCallback(() => {
    setLoading(true);
    setResultado(null);
    const params = new URLSearchParams();
    if (filtros.desde) params.append('desde', filtros.desde);
    if (filtros.hasta) params.append('hasta', filtros.hasta);
    if (filtros.colaborador) params.append('colaborador', filtros.colaborador);

    const endpoint = tab === 'pagos' ? `/reportes/pagos?${params}` : `/reportes/colaboradores?${params}`;
    api.get(endpoint)
      .then(r => setResultado(r.data))
      .catch(() => toast.error('Error generando reporte'))
      .finally(() => setLoading(false));
  }, [tab, filtros]);

  return (
    <div>
      <div className="page-header">
        <h1>📄 Reportes</h1>
        <p>Análisis y resúmenes del negocio</p>
      </div>

      {/* Tabs */}
      <div className="reporte-tabs">
        <button className={`reporte-tab ${tab === 'pagos' ? 'active' : ''}`} onClick={() => { setTab('pagos'); setResultado(null); }}>
          🧾 Reporte de Pagos
        </button>
        <button className={`reporte-tab ${tab === 'colaboradores' ? 'active' : ''}`} onClick={() => { setTab('colaboradores'); setResultado(null); }}>
          💇 Reporte por Colaborador
        </button>
      </div>

      {/* Filtros */}
      <div className="card" style={{ marginBottom: 24 }}>
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
          <button id="btn-generar-reporte" className="btn btn-primary" onClick={generar} disabled={loading}>
            {loading ? '⏳ Generando...' : '🔍 Generar Reporte'}
          </button>
        </div>
      </div>

      {loading && <div className="loading-full"><div className="spinner"></div></div>}

      {/* Resultado: Reporte Pagos */}
      {!loading && resultado && tab === 'pagos' && (
        <div>
          {/* Resumen */}
          <div className="stats-grid">
            <div className="stat-card accent">
              <div className="stat-label">Total Generado</div>
              <div className="stat-value">{fmt(resultado.resumen?.totalGenerado)}</div>
              <div className="stat-icon">💰</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Cortes</div>
              <div className="stat-value">{resultado.resumen?.totalCortes}</div>
              <div className="stat-icon">✂️</div>
            </div>
          </div>

          {/* Por barbero */}
          {resultado.resumen?.porBarbero?.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ marginBottom: 16, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Resumen por Barbero</h3>
              <div className="table-wrapper" style={{ border: 'none' }}>
                <table className="table">
                  <thead><tr><th>Barbero</th><th>Cortes</th><th>Total</th></tr></thead>
                  <tbody>
                    {resultado.resumen.porBarbero.map((b, i) => (
                      <tr key={i}>
                        <td><strong>{b.nombre}</strong></td>
                        <td>{b.cortes}</td>
                        <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{fmt(b.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Detalle */}
          {resultado.data?.length > 0 && (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr><th>Fecha</th><th>Barbero</th><th>Servicio</th><th>Monto</th><th>Método</th><th>Registró</th></tr>
                </thead>
                <tbody>
                  {resultado.data.map(p => (
                    <tr key={p._id}>
                      <td style={{ fontSize: '0.8rem' }}>{fmtDate(p.fecha)}</td>
                      <td><strong>{p.colaborador?.nombre}</strong></td>
                      <td>{p.tipoServicio}</td>
                      <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{fmt(p.montoServicio)}</td>
                      <td><span className="badge badge-info">{p.metodoPago}</span></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{p.usuarioRegistro?.nombre}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {resultado.data?.length === 0 && (
            <div className="empty-state"><div className="empty-icon">📄</div><p>Sin resultados para estos filtros</p></div>
          )}
        </div>
      )}

      {/* Resultado: Reporte Colaboradores */}
      {!loading && resultado && tab === 'colaboradores' && (
        <div>
          {resultado.data?.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">💇</div><p>Sin datos</p></div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr><th>Colaborador</th><th>Tipo Pago</th><th>Cortes</th><th>Total Generado</th><th>Ganancia</th></tr>
                </thead>
                <tbody>
                  {resultado.data.map((r, i) => (
                    <tr key={i}>
                      <td><strong>{r.colaborador?.nombre}</strong></td>
                      <td>
                        <span className={`badge ${r.colaborador?.tipoPago === 'porcentaje' ? 'badge-accent' : 'badge-info'}`}>
                          {r.colaborador?.tipoPago}
                        </span>
                      </td>
                      <td>{r.totalCortes}</td>
                      <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{fmt(r.totalGenerado)}</td>
                      <td style={{ color: 'var(--success)', fontWeight: 700 }}>{fmt(r.ganancia)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

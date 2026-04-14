import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const fmt = (n) => `C$ ${Number(n || 0).toLocaleString('es-NI', { minimumFractionDigits: 2 })}`;

export default function Indicadores() {
  const [indicadores, setIndicadores] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({ desde: '', hasta: '', colaborador: '' });

  // Cargar lista de colaboradores para el filtro
  useEffect(() => {
    api.get('/colaboradores')
      .then(r => setColaboradores(r.data.data))
      .catch(() => toast.error('Error cargando colaboradores'));
  }, []);

  const cargar = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filtros.desde) params.append('desde', filtros.desde);
    if (filtros.hasta) params.append('hasta', filtros.hasta);
    if (filtros.colaborador) params.append('colaborador', filtros.colaborador);

    api.get(`/indicadores?${params}`)
      .then(r => setIndicadores(r.data.data))
      .catch(() => toast.error('Error cargando indicadores'))
      .finally(() => setLoading(false));
  }, [filtros]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { cargar(); }, [cargar]);

  const totalGeneral = indicadores.reduce((s, i) => s + i.totalGenerado, 0);
  const totalCortes = indicadores.reduce((s, i) => s + i.totalCortes, 0);

  return (
    <div>
      <div className="page-header">
        <h1>📈 Indicadores por Barbero</h1>
        <p>Rendimiento y productividad del equipo</p>
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
                <option value="">Todos los Barberos</option>
                {colaboradores.map(c => <option key={c._id} value={c._id}>{c.nombre}</option>)}
              </select>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setFiltros({ desde: '', hasta: '', colaborador: '' })}>
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Totales generales */}
      <div className="stats-grid">
        <div className="stat-card accent">
          <div className="stat-label">Total Generado</div>
          <div className="stat-value">{fmt(totalGeneral)}</div>
          <div className="stat-sub">Ingresos brutos en el periodo</div>
          <div className="stat-icon">💰</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Cortes</div>
          <div className="stat-value">{totalCortes}</div>
          <div className="stat-sub">Servicios realizados</div>
          <div className="stat-icon">✂️</div>
        </div>
      </div>

      {loading ? (
        <div className="loading-full"><div className="spinner"></div></div>
      ) : indicadores.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">📈</div><p>Sin datos en este rango</p></div>
      ) : (
        <>
          {/* Ranking tarjetas */}
          <div className="indicadores-grid">
            {indicadores.map((ind, idx) => (
              <div key={ind.colaborador._id} className={`indicador-card ${idx === 0 ? 'top' : ''}`}>
                <div className="indicador-rank">#{idx + 1}</div>
                <div className="indicador-avatar">{ind.colaborador.nombre?.[0]}</div>
                <div className="indicador-nombre">{ind.colaborador.nombre}</div>
                <div className="indicador-badge">
                  <span className={`badge ${ind.colaborador.tipoPago === 'porcentaje' ? 'badge-accent' : 'badge-info'}`}>
                    {ind.colaborador.tipoPago === 'porcentaje' ? `${ind.colaborador.porcentaje}%` : 'Fijo'}
                  </span>
                  <span className={`badge ${ind.colaborador.estado ? 'badge-success' : 'badge-danger'}`}>
                    {ind.colaborador.estado ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <hr className="divider" />
                <div className="indicador-stats">
                  <div className="indicador-stat">
                    <span className="indicador-stat-label">Cortes</span>
                    <span className="indicador-stat-value">{ind.totalCortes}</span>
                  </div>
                  <div className="indicador-stat">
                    <span className="indicador-stat-label">Generado</span>
                    <span className="indicador-stat-value" style={{ color: 'var(--accent)' }}>{fmt(ind.totalGenerado)}</span>
                  </div>
                  <div className="indicador-stat">
                    <span className="indicador-stat-label">Ganancia</span>
                    <span className="indicador-stat-value" style={{ color: 'var(--success)' }}>{fmt(ind.ganancia)}</span>
                  </div>
                  <div className="indicador-stat">
                    <span className="indicador-stat-label">Promedio/Corte</span>
                    <span className="indicador-stat-value">{fmt(ind.promedioPorCorte)}</span>
                  </div>
                </div>
                {/* Barra de progreso */}
                <div className="indicador-bar-wrap">
                  <div className="indicador-bar" style={{ width: totalGeneral > 0 ? `${(ind.totalGenerado / totalGeneral) * 100}%` : '0%' }}></div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  {totalGeneral > 0 ? `${((ind.totalGenerado / totalGeneral) * 100).toFixed(1)}% del total` : '0%'}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

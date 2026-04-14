import { useEffect, useState } from 'react';
import api from '../api/axios';
import useAuthStore from '../stores/authStore';
import toast from 'react-hot-toast';

const fmt = (n) => `C$ ${Number(n || 0).toLocaleString('es-NI', { minimumFractionDigits: 2 })}`;
const fmtDate = (d) => new Date(d).toLocaleDateString('es-NI', { day: '2-digit', month: 'short' });

export default function Dashboard() {
  const { barberia, usuario } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then(r => setData(r.data.data))
      .catch(() => toast.error('Error cargando dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-full"><div className="spinner"></div></div>;

  const isAdmin = usuario?.rol === 'admin';

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>{isAdmin ? `Resumen general de ${barberia?.nombre}` : `Hola, ${usuario?.nombre} 👋`}</p>
      </div>

      {data?.mensaje && (
        <div className="card" style={{ borderLeft: '4px solid var(--warning)', marginBottom: 24, background: 'var(--warning-muted)' }}>
          <p style={{ color: 'var(--warning)', fontWeight: 600 }}>⚠️ {data.mensaje}</p>
        </div>
      )}

      {/* Stats Hoy */}
      <div className="stats-grid">
        <div className="stat-card accent">
          <div className="stat-label">{isAdmin ? 'Total Generado Hoy' : 'Mis Ganancias Hoy'}</div>
          <div className="stat-value">
            {isAdmin ? fmt(data?.hoy?.totalGenerado) : fmt(data?.hoy?.gananciaEstimada)}
          </div>
          <div className="stat-sub">{isAdmin ? 'Ingresos brutos' : 'Comisión estimada'}</div>
          <div className="stat-icon">💰</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Cortes Realizados</div>
          <div className="stat-value">{data?.hoy?.cortes ?? 0}</div>
          <div className="stat-sub">Servicios de hoy</div>
          <div className="stat-icon">✂️</div>
        </div>
        {!isAdmin && (
           <div className="stat-card">
            <div className="stat-label">Total Generado</div>
            <div className="stat-value">{fmt(data?.hoy?.totalGenerado)}</div>
            <div className="stat-sub">Monto facturado hoy</div>
            <div className="stat-icon">📈</div>
          </div>
        )}
        {isAdmin && (
          <div className="stat-card">
            <div className="stat-label">Total Mes</div>
            <div className="stat-value">{fmt(data?.mes?.totalGenerado)}</div>
            <div className="stat-sub">Ventas acumuladas</div>
            <div className="stat-icon">📆</div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 32 }}>
        {isAdmin ? (
          <div className="card">
            <h3 style={{ marginBottom: 20, fontSize: '1.1rem' }}>📊 Rendimiento por Colaborador (Este Mes)</h3>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Colaborador</th>
                    <th>Cortes</th>
                    <th>Total Generado</th>
                    <th>Progreso</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.desgloseColaboradores?.map((col, idx) => (
                    <tr key={idx}>
                      <td><strong>{col.nombre}</strong></td>
                      <td>{col.cortes} servicios</td>
                      <td>{fmt(col.generado)}</td>
                      <td style={{ width: '200px' }}>
                        <div style={{ height: 8, background: 'var(--bg-surface)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ 
                            height: '100%', 
                            background: 'var(--accent)', 
                            width: `${Math.min((col.generado / (data.mes.totalGenerado || 1)) * 100, 100)}%` 
                          }}></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!data?.desgloseColaboradores || data.desgloseColaboradores.length === 0) && (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: 30 }}>Sin datos de colaboradores este mes</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="card">
            <h2 style={{ fontSize: '1.1rem', marginBottom: 20 }}>🕒 Mis Últimos Servicios</h2>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Servicio</th>
                    <th>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.historial?.map((p, idx) => (
                    <tr key={idx}>
                      <td>{fmtDate(p.fecha)}</td>
                      <td>{p.tipoServicio}</td>
                      <td>{fmt(p.montoServicio)}</td>
                    </tr>
                  ))}
                  {(!data?.historial || data.historial.length === 0) && (
                    <tr><td colSpan="3" style={{ textAlign: 'center', padding: 30 }}>No has registrado servicios aún</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

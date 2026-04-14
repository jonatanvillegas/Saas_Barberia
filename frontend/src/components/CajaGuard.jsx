import { useState, useEffect } from 'react';
import api from '../api/axios';
import useAuthStore from '../stores/authStore';

export default function CajaGuard({ children }) {
  const { usuario } = useAuthStore();
  const [cajaStatus, setCajaStatus] = useState({ loading: true, abierta: false });

  useEffect(() => {
    // Solo barberos verifican el estado real de caja.
    if (usuario?.rol !== 'barbero') return;

    let cancelado = false;
    api.get('/caja/sesion')
      .then(r => {
        if (cancelado) return;
        setCajaStatus({ loading: false, abierta: r.data.abierta });
      })
      .catch(() => {
        if (cancelado) return;
        setCajaStatus({ loading: false, abierta: false });
      });

    return () => { cancelado = true; };
  }, [usuario]);

  // Admin/caja/superadmin siempre pasan sin bloqueo
  if (usuario?.rol === 'superadmin' || usuario?.rol === 'admin' || usuario?.rol === 'caja') {
    return children;
  }

  if (cajaStatus.loading) {
    return (
      <div className="loading-full">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!cajaStatus.abierta) {
    return (
      <div className="empty-state" style={{ height: '70vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div className="empty-icon" style={{ fontSize: '4rem' }}>🔒</div>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: 12 }}>Sistema Bloqueado</h2>
        <p style={{ maxWidth: 400, margin: '0 auto' }}>
          La caja se encuentra actualmente <strong>cerrada</strong>. 
          Un administrador o cajero debe realizar la apertura para habilitar el acceso a los barberos.
        </p>
        <button className="btn btn-primary" style={{ marginTop: 24 }} onClick={() => window.location.reload()}>
          🔄 Reintentar
        </button>
      </div>
    );
  }

  return children;
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NuevoPago from './pages/NuevoPago';
import Pagos from './pages/Pagos';
import Caja from './pages/Caja';
import Colaboradores from './pages/Colaboradores';
import Indicadores from './pages/Indicadores';
import MiIndicador from './pages/MiIndicador';
import Reportes from './pages/Reportes';
import Usuarios from './pages/Usuarios';
import Configuracion from './pages/Configuracion';
import AdminBarberias from './pages/AdminBarberias';
import useAuthStore from './stores/authStore';

function HomeRedirect() {
  // Ojo: este componente siempre se usa dentro de ProtectedRoute+Layout
  // (o sea, ya hay token). Solo decide landing según rol.
  const { usuario } = useAuthStore();
  const rol = usuario?.rol;

  if (rol === 'admin') return <Navigate to="/dashboard" replace />;
  if (rol === 'caja') return <Navigate to="/caja" replace />;
  if (rol === 'barbero') return <Navigate to="/mi-indicador" replace />;
  if (rol === 'superadmin') return <Navigate to="/admin-barberias" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1c1c26',
            color: '#f0f0f5',
            border: '1px solid #2a2a3a',
            borderRadius: '10px',
            fontSize: '0.875rem',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#1c1c26' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#1c1c26' } },
        }}
      />
      <Routes>
        {/* Público */}
        <Route path="/login" element={<Login />} />

        {/* Protegidas */}
        <Route element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/dashboard" element={
            <ProtectedRoute roles={['admin']}>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/pagos" element={
            <ProtectedRoute roles={['admin', 'caja']}>
              <Pagos />
            </ProtectedRoute>
          } />
          <Route path="/pagos/nuevo" element={
            <ProtectedRoute roles={['admin', 'caja']}>
              <NuevoPago />
            </ProtectedRoute>
          } />
          <Route path="/caja" element={
            <ProtectedRoute roles={['admin', 'caja']}>
              <Caja />
            </ProtectedRoute>
          } />
          <Route path="/colaboradores" element={
            <ProtectedRoute roles={['admin']}>
              <Colaboradores />
            </ProtectedRoute>
          } />
          <Route path="/indicadores" element={
            <ProtectedRoute roles={['admin']}>
              <Indicadores />
            </ProtectedRoute>
          } />
          <Route path="/mi-indicador" element={
            <ProtectedRoute roles={['barbero']}>
              <MiIndicador />
            </ProtectedRoute>
          } />
          <Route path="/reportes" element={
            <ProtectedRoute roles={['admin']}>
              <Reportes />
            </ProtectedRoute>
          } />
          <Route path="/usuarios" element={
            <ProtectedRoute roles={['admin']}>
              <Usuarios />
            </ProtectedRoute>
          } />
          <Route path="/configuracion" element={
            <ProtectedRoute roles={['admin']}>
              <Configuracion />
            </ProtectedRoute>
          } />
          <Route path="/admin-barberias" element={
            <ProtectedRoute roles={['superadmin']}>
              <AdminBarberias />
            </ProtectedRoute>
          } />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

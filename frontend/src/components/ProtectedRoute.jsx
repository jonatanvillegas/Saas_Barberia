import { Navigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

export default function ProtectedRoute({ children, roles }) {
  const { token, usuario } = useAuthStore();

  if (!token) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(usuario?.rol)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

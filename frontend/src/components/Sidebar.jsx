import { NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import './Sidebar.css';

const navItems = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard', roles: ['admin'] },
  { to: '/pagos/nuevo', icon: '✂️', label: 'Registrar Pago', roles: ['admin', 'caja'] },
  { to: '/pagos', icon: '🧾', label: 'Pagos', roles: ['admin', 'caja'] },
  { to: '/caja', icon: '💰', label: 'Caja', roles: ['admin', 'caja'] },
  { to: '/colaboradores', icon: '💇', label: 'Colaboradores', roles: ['admin'] },
  { to: '/indicadores', icon: '📈', label: 'Indicadores', roles: ['admin'] },
  { to: '/mi-indicador', icon: '📈', label: 'Mi Indicador', roles: ['barbero'] },
  { to: '/reportes', icon: '📄', label: 'Reportes', roles: ['admin'] },
  { to: '/usuarios', icon: '👥', label: 'Usuarios', roles: ['admin'] },
  { to: '/configuracion', icon: '⚙️', label: 'Configuración', roles: ['admin'] },
  { to: '/admin-barberias', icon: '🏢', label: 'Inquilinos', roles: ['superadmin'] },
];

export default function Sidebar({ collapsed, onToggle, className = '' }) {
  const { usuario, barberia, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleItems = navItems.filter(item => item.roles.includes(usuario?.rol));

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${className}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        <span className="sidebar-logo">💈</span>
        {!collapsed && (
          <div className="sidebar-brand-text">
            <div className="sidebar-title">{barberia?.nombre || 'SysAdmin'}</div>
            {barberia && <div className="sidebar-slug">@{barberia?.slug}</div>}
          </div>
        )}
        <button className="sidebar-toggle" onClick={onToggle}>
          {collapsed ? '❯' : '❮'}
        </button>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            title={collapsed ? item.label : ''}
          >
            <span className="sidebar-icon">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer" style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}>
        {!collapsed && (
          <div className="sidebar-user">
            <div className="sidebar-avatar">{usuario?.nombre?.[0]?.toUpperCase()}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{usuario?.nombre}</div>
              <div className="sidebar-user-role">{usuario?.rol}</div>
            </div>
          </div>
        )}
        {collapsed && (
           <div className="sidebar-avatar" style={{ marginBottom: 12 }}>{usuario?.nombre?.[0]?.toUpperCase()}</div>
        )}
        <button className="sidebar-logout" onClick={handleLogout} title="Cerrar sesión">
          🚪
        </button>
      </div>
    </aside>
  );
}

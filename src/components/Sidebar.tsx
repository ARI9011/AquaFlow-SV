import { useState } from 'react';
import {
  LayoutDashboard, Map as MapIcon, Droplets, FileText,
  Settings, Bell, Users, LogOut, Menu, X, ShieldCheck, User as UserIcon,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface NavItemProps {
  icon: any;
  label: string;
  active?: boolean;
  badge?: number;
  onClick?: () => void;
  collapsed?: boolean;
}

const NavItem = ({ icon: Icon, label, active = false, badge, onClick, collapsed = false }: NavItemProps) => (
  <div
    onClick={onClick}
    className={`
      flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group relative
      ${active
        ? 'bg-aqua-cyan/10 text-aqua-cyan border border-aqua-cyan/15 shadow-[0_0_20px_rgba(0,242,234,0.06)]'
        : 'text-gray-500 hover:bg-white/[0.04] hover:text-gray-200 border border-transparent'}
      ${collapsed ? 'justify-center px-0' : ''}
    `}>
    <div className="flex items-center gap-3">
      <Icon size={17}
        className={`flex-shrink-0 transition-colors ${active ? 'text-aqua-cyan' : 'text-gray-600 group-hover:text-gray-300'}`}
      />
      {!collapsed && <span className="font-semibold text-sm tracking-wide whitespace-nowrap">{label}</span>}
    </div>
    {badge && !collapsed && (
      <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-lg animate-pulse min-w-[18px] text-center">
        {badge}
      </span>
    )}
    {badge && collapsed && (
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-lg">
        {badge}
      </span>
    )}
    {collapsed && (
      <div className="absolute left-full ml-3 px-3 py-1.5 bg-[#0d1c21] border border-white/10 rounded-lg text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl z-50">
        {label}
      </div>
    )}
  </div>
);

export default function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside className={`
      flex flex-col h-screen overflow-hidden transition-all duration-300 flex-shrink-0 relative
      bg-[#080f12] border-r border-white/[0.05]
      ${collapsed ? 'w-[72px]' : 'w-[240px]'}
    `}>
      {/* Línea de acento lateral */}
      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-aqua-cyan/20 to-transparent pointer-events-none" />

      {/* LOGO HEADER */}
      <div className={`h-16 flex items-center border-b border-white/[0.04] flex-shrink-0 px-3 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-aqua-cyan/15 border border-aqua-cyan/25 flex items-center justify-center flex-shrink-0">
              <Droplets size={14} className="text-aqua-cyan" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-white tracking-tight leading-none">AquaFlow</p>
              <p className="text-[9px] text-aqua-cyan/60 font-bold uppercase tracking-widest">SV · Monitoreo</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-xl bg-aqua-cyan/10 border border-aqua-cyan/20 flex items-center justify-center">
            <Droplets size={15} className="text-aqua-cyan" />
          </div>
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="p-1.5 hover:bg-white/[0.06] rounded-lg transition-colors text-gray-600 hover:text-gray-300 flex-shrink-0"
          >
            <X size={16} />
          </button>
        )}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#0d1c21] border border-white/10 rounded-full flex items-center justify-center shadow-lg text-gray-400 hover:text-white hover:border-aqua-cyan/30 transition-all z-10"
          >
            <Menu size={12} />
          </button>
        )}
      </div>

      {/* NAVEGACIÓN */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar py-3 px-2 space-y-4">

        <div>
          {!collapsed && (
            <p className="text-[9px] uppercase font-black text-gray-600 tracking-[0.22em] mb-2 px-3">Principal</p>
          )}
          <div className="space-y-0.5">
            <NavItem icon={LayoutDashboard} label="Dashboard"     active={location.pathname === '/dashboard'} onClick={() => navigate('/dashboard')} collapsed={collapsed} />
            <NavItem icon={MapIcon}         label="Mapa de zonas"  active={location.pathname === '/mapa'}      onClick={() => navigate('/mapa')}      collapsed={collapsed} />
            <NavItem icon={Droplets}        label="Sensores IoT"   active={location.pathname === '/sensores'}  onClick={() => navigate('/sensores')}  collapsed={collapsed} />
          </div>
        </div>

        <div>
          {!collapsed && (
            <p className="text-[9px] uppercase font-black text-gray-600 tracking-[0.22em] mb-2 px-3">Ciudadano</p>
          )}
          <div className="space-y-0.5">
            <NavItem icon={FileText}  label="Reportes"       active={location.pathname === '/reportes'}     onClick={() => navigate('/reportes')}     collapsed={collapsed} />
            <NavItem icon={Bell}      label="Alertas"        badge={3} active={location.pathname === '/alertas'} onClick={() => navigate('/alertas')} collapsed={collapsed} />
            <NavItem icon={Settings}  label="Configuración"  active={location.pathname === '/configuracion'} onClick={() => navigate('/configuracion')} collapsed={collapsed} />
          </div>
        </div>

        {isAdmin && (
          <div>
            {!collapsed && (
              <p className="text-[9px] uppercase font-black text-gray-600 tracking-[0.22em] mb-2 px-3">Administración</p>
            )}
            <div className="space-y-0.5">
              <NavItem icon={Users} label="Usuarios" active={location.pathname === '/usuarios'} onClick={() => navigate('/usuarios')} collapsed={collapsed} />
            </div>
          </div>
        )}
      </nav>

      {/* PERFIL DE USUARIO */}
      {!collapsed && user && (
        <div className="mx-2 mb-2 p-3 bg-white/[0.03] border border-white/[0.05] rounded-xl">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-full bg-aqua-cyan/15 border border-aqua-cyan/25 flex items-center justify-center flex-shrink-0">
              <UserIcon size={14} className="text-aqua-cyan" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-white truncate">{user.Usuario}</p>
              <div className="flex items-center gap-1 mt-0.5">
                {user.rol === 'admin'
                  ? <><ShieldCheck size={10} className="text-aqua-cyan" /><span className="text-[9px] text-aqua-cyan font-bold">Administrador</span></>
                  : <><UserIcon size={10} className="text-gray-500" /><span className="text-[9px] text-gray-500 font-bold">Técnico</span></>
                }
              </div>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-all text-xs font-bold border border-transparent hover:border-red-500/15">
            <LogOut size={13} />
            Cerrar Sesión
          </button>
        </div>
      )}

      {/* LOGOUT COLAPSADO */}
      {collapsed && (
        <div className="p-2 border-t border-white/[0.04]">
          <button onClick={handleLogout}
            title="Cerrar sesión"
            className="w-full flex items-center justify-center p-2.5 rounded-xl text-gray-600 hover:bg-red-500/10 hover:text-red-400 transition-all group">
            <LogOut size={17} className="group-hover:rotate-12 transition-transform" />
          </button>
        </div>
      )}
    </aside>
  );
}

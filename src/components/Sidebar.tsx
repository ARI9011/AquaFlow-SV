import { useState } from 'react';
import {
  LayoutDashboard,
  Map as MapIcon,
  Droplets,
  FileText,
  Settings,
  Bell,
  Users,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

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
    flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 group relative
    ${active
        ? 'bg-aqua-cyan/10 text-aqua-cyan border border-aqua-cyan/10 shadow-[0_0_15px_rgba(0,242,234,0.05)]'
        : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'}
    ${collapsed ? 'justify-center' : ''}
  `}>
    <div className="flex items-center gap-3">
      <Icon size={18} className={active ? 'text-aqua-cyan' : 'group-hover:text-gray-300'} />
      {!collapsed && <span className="font-bold text-sm tracking-wide whitespace-nowrap">{label}</span>}
    </div>
    {badge && !collapsed && (
      <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-lg animate-pulse">
        {badge}
      </span>
    )}
    {badge && collapsed && (
      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-lg">
        {badge}
      </span>
    )}
    {/* TOOLTIP para items colapsados */}
    {collapsed && (
      <div className="absolute left-full ml-2 px-3 py-1 bg-white/10 rounded-lg text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none backdrop-blur-md z-50">
        {label}
      </div>
    )}
  </div>
);

export default function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <aside className={`
      bg-aqua-card border-r border-white/5 flex flex-col h-screen overflow-hidden transition-all duration-300 flex-shrink-0
      ${collapsed ? 'w-20' : 'w-64'}
    `}>
      {/* HEADER */}
      <div className={`p-4 flex items-center justify-between border-b border-white/5 ${collapsed ? 'justify-center' : ''}`}>
        {!collapsed && (
          <h1 className="text-aqua-cyan font-bold text-2xl flex items-center gap-2 tracking-tighter">
            AquaFlow <span className="text-[10px] bg-white/10 px-1 rounded text-gray-400 font-mono">SV</span>
          </h1>
        )}
        {collapsed && <div className="text-aqua-cyan font-bold text-xl">💧</div>}
        
        {/* BOTÓN TOGGLE */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-white/10 rounded-lg transition-all text-gray-400 hover:text-white"
          title={collapsed ? "Expandir" : "Contraer"}
        >
          {collapsed ? <Menu size={20} /> : <X size={20} />}
        </button>
      </div>

      {/* NAVEGACIÓN */}
      <nav className="flex-1 px-2 py-4 space-y-6 overflow-y-auto pb-4 custom-scrollbar">
        {/* GRUPO PRINCIPAL */}
        <div>
          {!collapsed && (
            <p className="text-[10px] uppercase font-black text-gray-600 tracking-[0.2em] mb-3 px-4">Principal</p>
          )}
          <div className="space-y-1">
            <NavItem
              icon={LayoutDashboard}
              label="Dashboard"
              active={location.pathname === '/dashboard'}
              onClick={() => navigate('/dashboard')}
              collapsed={collapsed}
            />
            <NavItem
              icon={MapIcon}
              label="Mapa de zonas"
              active={location.pathname === '/mapa'}
              onClick={() => navigate('/mapa')}
              collapsed={collapsed}
            />
            <NavItem
              icon={Droplets}
              label="Sensores IoT"
              active={location.pathname === '/sensores'}
              onClick={() => navigate('/sensores')}
              collapsed={collapsed}
            />
          </div>
        </div>

        {/* GRUPO CIUDADANO */}
        <div>
          {!collapsed && (
            <p className="text-[10px] uppercase font-black text-gray-600 tracking-[0.2em] mb-3 px-4">Ciudadano</p>
          )}
          <div className="space-y-1">
            <NavItem
              icon={FileText}
              label="Reportes ciudadanos"
              active={location.pathname === '/reportes'}
              onClick={() => navigate('/reportes')}
              collapsed={collapsed}
            />
            <NavItem
              icon={Settings}
              label="Configuración"
              active={location.pathname === '/configuracion'}
              onClick={() => navigate('/configuracion')}
              collapsed={collapsed}
            />
            <NavItem
              icon={Bell}
              label="Alertas"
              badge={3}
              active={location.pathname === '/alertas'}
              onClick={() => navigate('/alertas')}
              collapsed={collapsed}
            />
          </div>
        </div>

        {/* SECCIÓN ADMINISTRACIÓN */}
        {isAdmin && (
          <div className={`${collapsed ? '' : 'pt-4 border-t border-white/5'}`}>
            {!collapsed && (
              <p className="text-[10px] uppercase font-black text-gray-600 tracking-[0.2em] mb-3 px-4">Administración</p>
            )}
            <div className="space-y-1">
              <NavItem
                icon={Users}
                label="Usuarios"
                active={location.pathname === '/usuarios'}
                onClick={() => navigate('/usuarios')}
                collapsed={collapsed}
              />
            </div>
          </div>
        )}
      </nav>

      {/* BOTÓN LOGOUT */}
      <div className={`p-2 border-t border-white/5 bg-white/[0.01] ${collapsed ? 'flex justify-center' : ''}`}>
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-red-500/10 hover:text-red-500 transition-all group ${collapsed ? 'justify-center' : 'w-full'}`}
          title={collapsed ? "Cerrar sesión" : ""}
        >
          <LogOut size={18} className="group-hover:rotate-12 transition-transform flex-shrink-0" />
          {!collapsed && <span className="font-bold text-sm tracking-wide">Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
}
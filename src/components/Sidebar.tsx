import {
  LayoutDashboard,
  Map as MapIcon,
  Droplets,
  FileText,
  Settings,
  Bell,
  Users,
  LogOut
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom'; // 1. Agregamos useLocation

interface NavItemProps {
  icon: any;
  label: string;
  active?: boolean;
  badge?: number;
  onClick?: () => void;
}

const NavItem = ({ icon: Icon, label, active = false, badge, onClick }: NavItemProps) => (
  <div
    onClick={onClick}
    className={`
    flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 group
    ${active
        ? 'bg-aqua-cyan/10 text-aqua-cyan border border-aqua-cyan/10 shadow-[0_0_15px_rgba(0,242,234,0.05)]'
        : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'}
  `}>
    <div className="flex items-center gap-3">
      <Icon size={18} className={active ? 'text-aqua-cyan' : 'group-hover:text-gray-300'} />
      <span className="font-bold text-sm tracking-wide">{label}</span>
    </div>
    {badge && (
      <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-lg animate-pulse">
        {badge}
      </span>
    )}
  </div>
);

export default function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const navigate = useNavigate();
  const location = useLocation(); // 2. Detecta en qué URL estamos

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <aside className="w-66 bg-aqua-card border-r border-white/5 flex flex-col h-screen overflow-hidden">
      <div className="p-8">
        <h1 className="text-aqua-cyan font-bold text-2xl flex items-center gap-2 tracking-tighter">
          AquaFlow <span className="text-[10px] bg-white/10 px-1 rounded text-gray-400 font-mono">SV</span>
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-6 overflow-y-auto pb-4 custom-scrollbar">
        {/* GRUPO PRINCIPAL */}
        <div>
          <p className="text-[10px] uppercase font-black text-gray-600 tracking-[0.2em] mb-3 px-4">Principal</p>
          <div className="space-y-1">
            <NavItem
              icon={LayoutDashboard}
              label="Dashboard"
              active={location.pathname === '/dashboard'}
              onClick={() => navigate('/dashboard')}
            />
            <NavItem
              icon={MapIcon}
              label="Mapa de zonas"
              active={location.pathname === '/mapa'}
              onClick={() => navigate('/mapa')}
            />
            <NavItem
              icon={Droplets}
              label="Sensores IoT"
              active={location.pathname === '/sensores'}
              onClick={() => navigate('/sensores')}
            />
          </div>
        </div>

        {/* GRUPO CIUDADANO */}
        <div>
          <p className="text-[10px] uppercase font-black text-gray-600 tracking-[0.2em] mb-3 px-4">Ciudadano</p>
          <div className="space-y-1">
            <NavItem icon={FileText} label="Reportes ciudadanos" />
            <NavItem icon={Settings} label="Configuración" />
            <NavItem icon={Bell} label="Alertas" badge={3} />
          </div>
        </div>

        {/* SECCIÓN ADMINISTRACIÓN */}
        {isAdmin && (
          <div className="pt-4 border-t border-white/5">
            <p className="text-[10px] uppercase font-black text-gray-600 tracking-[0.2em] mb-3 px-4">Administración</p>
            <div className="space-y-1">
              <NavItem
                icon={Users}
                label="Usuarios"
                active={location.pathname === '/usuarios'}
                onClick={() => navigate('/usuarios')}
              />
            </div>
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-white/5 bg-white/[0.01]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-red-500/10 hover:text-red-500 transition-all group"
        >
          <LogOut size={18} className="group-hover:rotate-12 transition-transform" />
          <span className="font-bold text-sm tracking-wide">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
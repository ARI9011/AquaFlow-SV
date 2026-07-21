import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, User, ChevronDown, LogOut, ShieldCheck, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PAGE_TITLES: Record<string, { title: string; sub: string }> = {
  '/inicio':       { title: 'Inicio',                sub: 'Bienvenido a AquaFlow SV'     },
  '/dashboard':    { title: 'Dashboard',            sub: 'Resumen general del sistema'  },
  '/mapa':         { title: 'Mapa de Zonas',        sub: 'Gran San Salvador'            },
  '/sensores':     { title: 'Sensores IoT',          sub: 'Dispositivos de medición'    },
  '/usuarios':     { title: 'Gestión de Usuarios',  sub: 'Control de acceso'           },
  '/reportes':     { title: 'Reportes Ciudadanos',  sub: 'Incidencias reportadas'      },
  '/alertas':      { title: 'Alertas del Sistema',  sub: '3 alertas activas'           },
  '/configuracion':{ title: 'Configuración',        sub: 'Preferencias del sistema'    },
};

const ALERTS_COUNT = 3;

export default function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bellOpen, setBellOpen]         = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const page = PAGE_TITLES[location.pathname] ?? { title: 'AquaFlow SV', sub: 'Monitoreo Hídrico' };

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  const closeAll = () => { setDropdownOpen(false); setBellOpen(false); };

  return (
    <header className="h-16 bg-[#080f12] border-b border-white/[0.05] flex items-center justify-between px-3 md:px-6 shadow-lg flex-shrink-0 relative z-[800] gap-2"
      onClick={(e) => { if (e.target === e.currentTarget) closeAll(); }}>

      {/* BOTÓN MENÚ MÓVIL */}
      <button
        onClick={onMenuClick}
        className="lg:hidden w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.07] hover:border-white/15 transition-all text-gray-400 hover:text-white"
        aria-label="Abrir menú"
      >
        <Menu size={17} />
      </button>

      {/* TÍTULO DE PÁGINA */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h2 className="text-white font-black text-base leading-none truncate">{page.title}</h2>
          {/* Indicador live en dashboard */}
          {location.pathname === '/dashboard' && (
            <div className="flex items-center gap-1 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[9px] font-black text-green-400 uppercase tracking-wide">En vivo</span>
            </div>
          )}
        </div>
        <p className="text-gray-600 text-[10px] font-medium mt-0.5 hidden sm:block">{page.sub}</p>
      </div>

      {/* ACCIONES DERECHAS */}
      <div className="flex items-center gap-2">

        {/* CAMPANA DE NOTIFICACIONES */}
        <div className="relative">
          <button
            onClick={() => { setBellOpen(v => !v); setDropdownOpen(false); }}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.07] hover:border-white/15 transition-all text-gray-400 hover:text-white"
          >
            <Bell size={16} />
            {ALERTS_COUNT > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-lg">
                {ALERTS_COUNT}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-[#0d1c21] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                <span className="text-sm font-black text-white">Alertas recientes</span>
                <span className="text-[10px] bg-red-500/15 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-black">{ALERTS_COUNT} activas</span>
              </div>
              {[
                { text: 'Presión crítica en Ilopango Sur', time: 'Hace 5 min', color: 'bg-red-500' },
                { text: 'Sensor F-002 desconectado',       time: 'Hace 18 min', color: 'bg-amber-500' },
                { text: 'Flujo bajo en Soyapango',         time: 'Hace 1 h',   color: 'bg-amber-500' },
              ].map((a, i) => (
                <div key={i} className="px-4 py-3 flex items-start gap-3 hover:bg-white/[0.03] border-b border-white/[0.04] last:border-0 transition-colors cursor-pointer">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${a.color}`} />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-200 truncate">{a.text}</p>
                    <p className="text-[10px] text-gray-600 mt-0.5">{a.time}</p>
                  </div>
                </div>
              ))}
              <div className="p-3">
                <button onClick={() => { navigate('/alertas'); closeAll(); }}
                  className="w-full py-2 text-[11px] font-bold text-aqua-cyan hover:bg-aqua-cyan/5 rounded-lg transition-colors">
                  Ver todas las alertas →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* DIVISOR */}
        <div className="w-px h-6 bg-white/[0.06]" />

        {/* AVATAR + DROPDOWN */}
        <div className="relative">
          <button
            onClick={() => { setDropdownOpen(v => !v); setBellOpen(false); }}
            className="flex items-center gap-2 md:gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-white/15 p-1.5 pr-3 rounded-xl transition-all"
          >
            <div className="w-7 h-7 bg-aqua-cyan/15 border border-aqua-cyan/25 rounded-full flex items-center justify-center text-aqua-cyan flex-shrink-0">
              <User size={14} />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-black text-white leading-none">{user?.Usuario ?? 'Usuario'}</p>
              <p className="text-[9px] text-gray-500 mt-0.5">{user?.rol === 'admin' ? 'Admin' : 'Técnico'}</p>
            </div>
            <ChevronDown size={13} className={`text-gray-500 transition-transform flex-shrink-0 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-[#0d1c21] border border-white/10 rounded-2xl shadow-2xl p-2 z-50">
              <div className="p-3 flex items-center gap-3 border-b border-white/[0.06] mb-1">
                <div className="w-9 h-9 bg-aqua-cyan/15 border border-aqua-cyan/20 rounded-full flex items-center justify-center text-aqua-cyan flex-shrink-0">
                  <User size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-white truncate">{user?.Usuario ?? 'Usuario'}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {user?.rol === 'admin'
                      ? <><ShieldCheck size={10} className="text-aqua-cyan" /><span className="text-[9px] text-aqua-cyan font-bold">Administrador</span></>
                      : <span className="text-[9px] text-gray-500 font-bold">Técnico</span>}
                  </div>
                </div>
              </div>

              <button onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-xs font-bold">
                <LogOut size={14} />
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

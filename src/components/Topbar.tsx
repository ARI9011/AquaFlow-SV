import { useState } from 'react';
import { Droplets, User, ChevronDown, LogOut } from 'lucide-react';

export default function Topbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="h-20 bg-aqua-card border-b border-white/5 flex items-center justify-between px-4 md:px-8 shadow-lg flex-shrink-0">

      {/* BRAND / LOGO - RESPONSIVE */}
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        <div className="w-10 h-10 bg-aqua-cyan/20 rounded-xl flex items-center justify-center text-aqua-cyan flex-shrink-0">
          <Droplets size={24} fill="currentColor" />
        </div>
        <div className="hidden sm:block">
          <h1 className="text-white font-black text-xl leading-none truncate">AquaFlow SV</h1>
          <span className="text-aqua-emerald text-[10px] uppercase tracking-widest font-bold truncate block">
            Monitoreo Hídrico
          </span>
        </div>
      </div>

      {/* TITULO CENTRAL - OCULTO EN MOBILE */}
      <div className="hidden md:block text-center flex-1">
        <h2 className="text-white font-bold text-lg">Dashboard</h2>
        <p className="text-gray-500 text-xs">Resumen general del sistema</p>
      </div>

      {/* USUARIO & DROPDOWN */}
      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 md:gap-3 bg-white/5 hover:bg-white/10 p-2 pr-3 md:pr-4 rounded-2xl transition-all border border-white/5 group"
        >
          <div className="w-8 md:w-10 h-8 md:h-10 bg-aqua-emerald/20 rounded-full flex items-center justify-center text-aqua-emerald flex-shrink-0">
            <User size={16} className="md:w-5 md:h-5" />
          </div>
          <span className="text-sm font-medium text-gray-300 hidden sm:inline"></span>
          <ChevronDown
            size={16}
            className={`text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* DROPDOWN MENU - RESPONSIVE */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-3 w-56 bg-aqua-card border border-white/10 rounded-2xl shadow-2xl p-2 z-50">
            <div className="p-3 flex items-center gap-3 border-b border-white/5 mb-2">
              <div className="w-8 h-8 bg-aqua-cyan/20 rounded-full flex items-center justify-center text-aqua-cyan flex-shrink-0">
                <User size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">Admin User</p>
                <p className="text-[10px] text-gray-500 uppercase">Administrador</p>
              </div>
            </div>

            <button className="w-full flex items-center gap-3 p-3 text-red-400 hover:bg-red-400/10 rounded-xl transition-colors text-sm font-bold">
              <LogOut size={16} />
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>

    </header>
  );
}
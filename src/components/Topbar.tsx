import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, User, ChevronDown, LogOut, ShieldCheck, Menu, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import AdminCrown from './AdminCrown';
import { useToast } from './Toast';

// Mapa de rutas -> clave de traducción (los textos viven en src/i18n.ts)
const PAGE_KEYS: Record<string, string> = {
  '/inicio':         'inicio',
  '/dashboard':      'dashboard',
  '/mapa':           'mapa',
  '/sensores':       'sensores',
  '/sobre-nosotros': 'sobreNosotros',
  '/usuarios':       'usuarios',
  '/reportes':       'reportes',
  '/alertas':        'alertas',
  '/configuracion':  'config',
};

interface AlertaResumen {
  id: number;
  tipo: string;
  zona: string;
  descripcion: string;
  creado_en: string;
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso.replace(' ', 'T')).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'Hace instantes';
  if (min < 60) return `Hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Hace ${h} h`;
  return `Hace ${Math.floor(h / 24)} d`;
}

export default function Topbar({ onMenuClick, alertas = [] }: { onMenuClick?: () => void; alertas?: AlertaResumen[] }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bellOpen, setBellOpen]         = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t, lang, toggleLang } = useLang();
  const showToast = useToast();
  const key = PAGE_KEYS[location.pathname] ?? 'default';
  const page = { title: t(`page.${key}.title`), sub: t(`page.${key}.sub`) };
  const alertsCount = alertas.length;

  const handleLogout = () => {
    setDropdownOpen(false);
    logout(); // limpia el usuario de inmediato; el POST de logout sigue en segundo plano
    navigate('/', { replace: true });
    showToast('Sesión cerrada correctamente');
  };

  const closeAll = () => { setDropdownOpen(false); setBellOpen(false); };

  return (
    <header className="h-16 bg-[var(--color-aqua-shell)] border-b border-ink/[0.05] flex items-center justify-between px-3 md:px-6 shadow-lg flex-shrink-0 relative z-[800] gap-2"
      onClick={(e) => { if (e.target === e.currentTarget) closeAll(); }}>

      {/* BOTÓN MENÚ MÓVIL */}
      <button
        onClick={onMenuClick}
        className="lg:hidden w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-ink/[0.03] border border-ink/[0.06] hover:bg-ink/[0.07] hover:border-ink/15 transition-all text-gray-400 hover:text-ink"
        aria-label="Abrir menú"
      >
        <Menu size={17} />
      </button>

      {/* TÍTULO DE PÁGINA */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h2 className="text-ink font-black text-base leading-none truncate">{page.title}</h2>
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

        {/* SELECTOR DE IDIOMA (ES / EN) */}
        <button
          onClick={toggleLang}
          aria-label={lang === 'es' ? 'Cambiar idioma a inglés' : 'Change language to Spanish'}
          title={lang === 'es' ? 'Switch to English' : 'Cambiar a Español'}
          className="h-9 px-3 flex items-center gap-1.5 rounded-xl bg-ink/[0.03] border border-ink/[0.06] hover:bg-ink/[0.07] hover:border-aqua-cyan/40 transition-all text-xs font-bold text-ink/80"
        >
          <span className={lang === 'es' ? 'text-aqua-cyan' : 'text-gray-500'}>ES</span>
          <span className="text-gray-600">/</span>
          <span className={lang === 'en' ? 'text-aqua-cyan' : 'text-gray-500'}>EN</span>
        </button>

        {/* CAMPANA DE NOTIFICACIONES */}
        <div className="relative">
          <button
            onClick={() => { setBellOpen(v => !v); setDropdownOpen(false); }}
            aria-label={`Notificaciones, ${alertsCount} alertas`}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-ink/[0.03] border border-ink/[0.06] hover:bg-ink/[0.07] hover:border-ink/15 transition-all text-gray-400 hover:text-ink"
          >
            <Bell size={16} aria-hidden="true" />
            {alertsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-ink text-[9px] font-black rounded-full flex items-center justify-center shadow-lg">
                {alertsCount}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-[var(--color-aqua-panel)] border border-ink/10 rounded-2xl shadow-2xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-ink/[0.06] flex items-center justify-between">
                <span className="text-sm font-black text-ink">Alertas recientes</span>
                <span className="text-[10px] bg-red-500/15 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-black">{alertsCount} activas</span>
              </div>
              {alertsCount === 0 && (
                <div className="px-4 py-6 text-center text-xs text-gray-500 font-medium">Sin alertas activas</div>
              )}
              {alertas.slice(0, 3).map((a) => (
                <div key={a.id} className="px-4 py-3 flex items-start gap-3 hover:bg-ink/[0.03] border-b border-ink/[0.04] last:border-0 transition-colors cursor-pointer">
                  <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5 bg-red-500" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-ink/90 truncate">{a.descripcion || `${a.tipo} en ${a.zona}`}</p>
                    <p className="text-[10px] text-gray-600 mt-0.5">{timeAgo(a.creado_en)}</p>
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
        <div className="w-px h-6 bg-ink/[0.06]" />

        {/* Con sesión: menú de usuario. Sin sesión: botón "Iniciar sesión" */}
        {user ? (
        <div className="relative">
          <button
            aria-label="Menú de usuario"
            onClick={() => { setDropdownOpen(v => !v); setBellOpen(false); }}
            className="flex items-center gap-2 md:gap-2.5 bg-ink/[0.03] hover:bg-ink/[0.07] border border-ink/[0.06] hover:border-ink/15 p-1.5 pr-3 rounded-xl transition-all"
          >
            <div className="w-7 h-7 bg-aqua-cyan/15 border border-aqua-cyan/25 rounded-full flex items-center justify-center text-aqua-cyan flex-shrink-0">
              <User size={14} />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-black text-ink leading-none flex items-center gap-1">
                {user?.Usuario ?? 'Usuario'}
                {user?.rol === 'admin' && <AdminCrown size={10} />}
              </p>
              <p className="text-[9px] text-gray-500 mt-0.5">{user?.rol === 'admin' ? 'Admin' : 'Técnico'}</p>
            </div>
            <ChevronDown size={13} className={`text-gray-500 transition-transform flex-shrink-0 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-[var(--color-aqua-panel)] border border-ink/10 rounded-2xl shadow-2xl p-2 z-50">
              <div className="p-3 flex items-center gap-3 border-b border-ink/[0.06] mb-1">
                <div className="w-9 h-9 bg-aqua-cyan/15 border border-aqua-cyan/20 rounded-full flex items-center justify-center text-aqua-cyan flex-shrink-0">
                  <User size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-ink truncate flex items-center gap-1">
                    {user?.Usuario ?? 'Usuario'}
                    {user?.rol === 'admin' && <AdminCrown size={11} />}
                  </p>
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
        ) : (
          <button
            onClick={() => navigate('/login')}
            aria-label="Iniciar sesión"
            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-aqua-cyan text-[#052] font-bold text-xs uppercase tracking-wide hover:brightness-110 transition-all"
          >
            <LogIn size={15} /> Iniciar sesión
          </button>
        )}
      </div>
    </header>
  );
}

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Map as MapIcon, Droplets, Bell, FileText, Settings,
  Users, ArrowRight, Sparkles, Gauge, Radio, Satellite, ShieldCheck,
  Waves, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import ParticleFlowHero from '../components/ParticleFlowHero';
import LoginRequiredModal from '../components/LoginRequiredModal';
import AdminCrown from '../components/AdminCrown';

function useInView<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, inView };
}

function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`reveal ${inView ? 'in-view' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function Counter({ target, suffix = '', duration = 1600 }: { target: number; suffix?: string; duration?: number }) {
  const { ref, inView } = useInView<HTMLSpanElement>(0.5);
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start: number | null = null;
    let raf = 0;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min(1, (ts - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, duration]);

  return <span ref={ref}>{value.toLocaleString('es-SV')}{suffix}</span>;
}

function saludoActual() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

const FEATURES: { icon: any; title: string; desc: string; path: string; accent: string; bg: string; adminOnly?: boolean }[] = [
  { icon: LayoutDashboard, title: 'Panel de Control',      desc: 'KPIs, tendencias de presión y caudal en tiempo real.',        path: '/dashboard',     accent: 'text-aqua-cyan', bg: 'bg-aqua-cyan/10' },
  { icon: MapIcon,         title: 'Mapa de Zonas',          desc: 'Ubicación geográfica de cada zona monitoreada.',               path: '/mapa',           accent: 'text-blue-400',  bg: 'bg-blue-500/10' },
  { icon: Droplets,        title: 'Sensores IoT',           desc: 'Estado y lecturas de los dispositivos conectados.',            path: '/sensores',       accent: 'text-green-400', bg: 'bg-green-500/10' },
  { icon: Bell,            title: 'Alertas Tempranas',      desc: 'Notificaciones automáticas ante presión crítica o fallas.',    path: '/alertas',        accent: 'text-amber-400', bg: 'bg-amber-500/10' },
  { icon: FileText,        title: 'Reportes Ciudadanos',    desc: 'Canal directo para que la comunidad reporte incidencias.',     path: '/reportes',       accent: 'text-purple-400',bg: 'bg-purple-500/10' },
  { icon: Settings,        title: 'Configuración',          desc: 'Ajusta preferencias y parámetros del sistema.',                path: '/configuracion',  accent: 'text-ink/80',  bg: 'bg-ink/10' },
  { icon: Users,           title: 'Gestión de Usuarios',    desc: 'Administra accesos y roles del equipo técnico.',               path: '/usuarios',       accent: 'text-red-400',   bg: 'bg-red-500/10', adminOnly: true },
];

const PASOS = [
  { n: '01', title: 'Captura',      desc: 'Sensores IoT miden presión y caudal cada minuto en cada zona.',                 icon: Radio },
  { n: '02', title: 'Transmisión',  desc: 'Los datos viajan en tiempo real desde el campo hacia la plataforma.',           icon: Satellite },
  { n: '03', title: 'Análisis',     desc: 'AquaFlow detecta patrones anómalos y calcula el estado de cada zona.',          icon: Gauge },
  { n: '04', title: 'Acción',       desc: 'Equipos técnicos y la ciudadanía reciben alertas para actuar a tiempo.',        icon: ShieldCheck },
];

const IMPACTO = [
  { value: 120000, suffix: '+',  label: 'Habitantes beneficiados' },
  { value: 4,       suffix: '',  label: 'Zonas monitoreadas' },
  { value: 24,      suffix: '/7', label: 'Monitoreo activo' },
  { value: 6,       suffix: '',  label: 'Sensores IoT desplegados' },
];

// Nombre amigable de cada apartado protegido (para el mensaje del aviso)
const NOMBRE_RUTA: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/mapa': 'Mapa de zonas',
  '/sensores': 'Sensores IoT',
  '/reportes': 'Reportes',
  '/alertas': 'Alertas',
  '/configuracion': 'Configuración',
  '/usuarios': 'Usuarios',
};

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useLang();
  const isAdmin = user?.rol === 'admin';
  const features = FEATURES.filter(f => !f.adminOnly || isAdmin);

  // Sección que un visitante SIN sesión intentó abrir (para mostrar el aviso)
  const [seccionBloqueada, setSeccionBloqueada] = useState<string | null>(null);

  // Si hay sesión, navega normal; si no, muestra el aviso de "inicia sesión".
  const irA = (path: string, nombre: string) => {
    if (user) navigate(path);
    else setSeccionBloqueada(nombre);
  };

  // Si ProtectedRoute nos trajo aquí por intentar entrar a un apartado sin sesión
  // (o por cerrar sesión estando en uno), mostramos el aviso automáticamente.
  useEffect(() => {
    const st = location.state as { requireLogin?: boolean; from?: string } | null;
    if (st?.requireLogin) {
      setSeccionBloqueada(NOMBRE_RUTA[st.from ?? ''] ?? 'esta sección');
      // Limpiar el estado para que el aviso no reaparezca al navegar/recargar.
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  return (
    <div className="space-y-6 page-enter pb-4">
      {seccionBloqueada && (
        <LoginRequiredModal
          seccion={seccionBloqueada}
          onIniciarSesion={() => navigate('/login')}
          onCancelar={() => setSeccionBloqueada(null)}
        />
      )}


      {/* HERO */}
      <div className="relative rounded-3xl overflow-hidden border border-ink/10 h-[460px] md:h-[500px]">
        <ParticleFlowHero />
        <div className="absolute inset-0 bg-gradient-to-t from-aqua-dark via-aqua-dark/75 to-aqua-dark/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-aqua-dark/95 via-aqua-dark/45 to-transparent" />
        <div className="relative h-full flex flex-col justify-center px-6 sm:px-10 lg:px-14 max-w-3xl">
          <div className="inline-flex w-fit items-center gap-2 bg-ink/[0.05] border border-aqua-cyan/25 rounded-full pl-2.5 pr-3.5 py-1.5 mb-5">
            <Sparkles size={12} className="text-aqua-cyan" />
            <span className="text-[10px] font-black uppercase tracking-widest text-aqua-cyan">{t('Nuevo')}</span>
            <span className="text-[10px] font-bold text-ink/80">{t('Alertas de presión en tiempo real')}</span>
          </div>

          <p className="text-aqua-cyan/70 text-[11px] uppercase tracking-[0.3em] font-bold mb-2 flex items-center gap-1.5">
            {t(saludoActual())}{user ? `, ${user.Usuario.split(' ')[0]}` : ''}
            {user?.rol === 'admin' && <AdminCrown size={12} />}
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter text-ink leading-[1.05] mb-4">
            {t('El agua del Gran San Salvador,')}<span className="gradient-text"> {t('monitoreada en vivo.')}</span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base font-medium max-w-xl mb-8 leading-relaxed">
            {t('AquaFlow SV conecta sensores IoT, mapas en vivo y reportes ciudadanos en una sola plataforma para anticipar fallas, optimizar el flujo y proteger el agua de miles de familias.')}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => irA('/dashboard', 'Dashboard')}
              className="group flex items-center gap-2 bg-aqua-cyan hover:bg-aqua-cyan/85 text-aqua-dark font-black px-6 py-3.5 rounded-2xl transition-all duration-300 shadow-lg shadow-aqua-cyan/10 active:scale-[0.98]"
            >
              {t('Ir al Dashboard')}
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => irA('/mapa', 'Mapa de zonas')}
              className="flex items-center gap-2 bg-ink/[0.04] hover:bg-ink/[0.08] border border-ink/10 text-ink font-bold px-6 py-3.5 rounded-2xl transition-all duration-300"
            >
              {t('Explorar el mapa')}
            </button>
          </div>

          <div className="flex items-center gap-3 mt-8 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] text-green-400 font-bold uppercase tracking-widest">{t('Datos en vivo')}</span>
            </div>
            <span className="text-[10px] text-gray-600">·</span>
            <span className="text-[10px] text-gray-500 font-bold">4 {t('zonas activas')}</span>
            <span className="text-[10px] text-gray-600">·</span>
            <span className="text-[10px] text-gray-500 font-bold">5/6 {t('sensores en línea')}</span>
          </div>
        </div>
      </div>

      {/* MISIÓN */}
      <Reveal>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 items-stretch">
          <div className="lg:col-span-3 portal-card p-6 sm:p-8 flex flex-col justify-center">
            <p className="text-[10px] text-aqua-cyan/60 uppercase tracking-[0.25em] font-bold mb-2">{t('Nuestra misión')}</p>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-ink mb-3">{t('Tecnología al servicio del agua')}</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              {t('AquaFlow SV nace para cerrar la brecha entre la infraestructura hídrica del Gran San Salvador y los datos que la mantienen funcionando. Unimos sensores IoT, mapas en vivo y la voz de la ciudadanía en un solo lugar, para que técnicos y autoridades detecten fallas antes de que se conviertan en cortes de agua.')}
            </p>
          </div>
          <div className="lg:col-span-2 portal-card p-6 sm:p-8 flex flex-col justify-center gap-4">
            {[
              { icon: Gauge, text: 'Presión y caudal medidos cada minuto' },
              { icon: Bell,  text: 'Alertas automáticas ante anomalías' },
              { icon: Users, text: 'Reportes ciudadanos integrados al panel' },
            ].map(i => (
              <div key={i.text} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-aqua-cyan/10 flex items-center justify-center flex-shrink-0">
                  <i.icon size={16} className="text-aqua-cyan" />
                </div>
                <p className="text-xs text-ink/80 font-semibold">{t(i.text)}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* FUNCIONALIDADES */}
      <Reveal>
        <div className="mb-1">
          <p className="text-[10px] text-aqua-cyan/60 uppercase tracking-[0.25em] font-bold mb-1">{t('Explora la plataforma')}</p>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-ink">{t('Todo lo que necesitas, en un solo panel')}</h2>
        </div>
      </Reveal>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {features.map((f, i) => (
          <Reveal key={f.title} delay={i * 60}>
            <button
              onClick={() => irA(f.path, f.title)}
              className="portal-card w-full h-full text-left p-5 flex flex-col gap-3 hover:scale-[1.02] hover:border-aqua-cyan/20 transition-all duration-300 group"
            >
              <div className={`w-11 h-11 rounded-xl ${f.bg} flex items-center justify-center`}>
                <f.icon size={20} className={f.accent} />
              </div>
              <div>
                <h3 className="text-sm font-black text-ink mb-1">{t(f.title)}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{t(f.desc)}</p>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-bold text-gray-600 group-hover:text-aqua-cyan transition-colors mt-auto pt-1">
                {t('Explorar')} <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </button>
          </Reveal>
        ))}
      </div>

      {/* CÓMO FUNCIONA */}
      <Reveal>
        <div className="text-center max-w-xl mx-auto pt-4 mb-1">
          <p className="text-[10px] text-aqua-cyan/60 uppercase tracking-[0.25em] font-bold mb-2">{t('Proceso')}</p>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-ink">{t('¿Cómo funciona AquaFlow?')}</h2>
          <p className="text-gray-500 text-sm mt-2">{t('De la gota de agua al dato, en cuatro pasos.')}</p>
        </div>
      </Reveal>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {PASOS.map((p, i) => (
          <Reveal key={p.n} delay={i * 100}>
            <div className="portal-card p-5 h-full relative overflow-hidden">
              <span className="absolute -top-3 -right-1 text-5xl font-black text-ink/[0.03] select-none">{p.n}</span>
              <div className="w-10 h-10 rounded-xl bg-aqua-cyan/10 flex items-center justify-center mb-4 relative z-10">
                <p.icon size={18} className="text-aqua-cyan" />
              </div>
              <h3 className="text-sm font-black text-ink mb-1.5 relative z-10">{t(p.title)}</h3>
              <p className="text-xs text-gray-500 leading-relaxed relative z-10">{t(p.desc)}</p>
            </div>
          </Reveal>
        ))}
      </div>

      {/* IMPACTO */}
      <Reveal>
        <div className="portal-card portal-grid-bg p-6 sm:p-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {IMPACTO.map(s => (
              <div key={s.label}>
                <p className="text-3xl sm:text-4xl font-black gradient-text">
                  <Counter target={s.value} suffix={s.suffix} />
                </p>
                <p className="text-[11px] text-gray-500 font-bold mt-1.5 uppercase tracking-wide">{t(s.label)}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* CTA FINAL */}
      <Reveal>
        <div className="relative portal-card p-8 sm:p-10 text-center overflow-hidden">
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-64 h-64 bg-aqua-cyan/[0.06] rounded-full blur-[100px]" />
          </div>
          <div className="relative">
            <Waves size={28} className="text-aqua-cyan mx-auto mb-4 float-slow" />
            <h2 className="text-xl sm:text-2xl font-black text-ink mb-2">{t('¿Listo para revisar tus datos?')}</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
              {t('Entra al panel de control y visualiza el estado del agua en Gran San Salvador en tiempo real.')}
            </p>
            <button
              onClick={() => irA('/dashboard', 'Dashboard')}
              className="inline-flex items-center gap-2 bg-aqua-cyan hover:bg-aqua-cyan/85 text-aqua-dark font-black px-7 py-3.5 rounded-2xl transition-all duration-300 shadow-lg shadow-aqua-cyan/10 active:scale-[0.98]"
            >
              {t('Ir al Dashboard')} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </Reveal>
    </div>
  );
}

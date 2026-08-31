import { ShieldCheck, Cpu, Droplets, Heart, Users, MapPin, Globe, Sparkles, Activity } from 'lucide-react';
import AquaFlowLogo from '../components/AquaFlowLogo';
import { ZONAS_VERDADERAS } from '../data/zonas';
import { useLang } from '../context/LanguageContext';

export default function SobreNosotros() {
  const { t } = useLang();
  const TEAM = [
    {
      nombre: 'Ariel García',
      color: 'from-cyan-500 to-blue-600',
      iniciales: 'AG',
    },
    {
      nombre: 'Fernando López',
      color: 'from-green-500 to-emerald-700',
      iniciales: 'FL',
    },
    {
      nombre: 'Ricardo Díaz',
      color: 'from-amber-500 to-orange-600',
      iniciales: 'RD',
    },
    {
      nombre: 'Gerardo Burgos',
      color: 'from-purple-500 to-indigo-700',
      iniciales: 'GB',
    },
  ];

  const PILARES = [
    {
      icon: Cpu,
      title: t('Telemetría IoT en Vivo'),
      desc: t('Medición continua de presión (PSI) y flujo (L/min) mediante microcontroladores Arduino conectados por streaming de datos en tiempo real (SSE).'),
      accent: 'text-aqua-cyan',
      bg: 'bg-aqua-cyan/10',
      border: 'border-aqua-cyan/20',
    },
    {
      icon: Users,
      title: t('Participación Ciudadana'),
      desc: t('Canal directo para reportar fugas, cortes de agua e inestabilidad en el servicio con geolocalización y seguimiento administrativo.'),
      accent: 'text-green-400',
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
    },
    {
      icon: Sparkles,
      title: t('Asistencia con IA'),
      desc: t('Integramos AquaBot potenciado por IA (Groq LLM) para brindar soporte 24/7 sobre el estado del suministro, consejos de ahorro y respuesta a consultas.'),
      accent: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
    },
    {
      icon: ShieldCheck,
      title: t('Transparencia y Accesibilidad'),
      desc: t('Plataforma adaptada a altos estándares de accesibilidad (lectura por voz, modos de contraste) para garantizar un acceso inclusivo para todos los salvadoreños.'),
      accent: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
    },
  ];

  return (
    <div className="space-y-8 page-enter portal-grid-bg min-h-full pb-8">

      {/* HERO BANNER */}
      <div className="portal-card p-8 md:p-12 relative overflow-hidden text-center md:text-left">
        <div className="absolute -right-12 -bottom-12 w-80 h-80 bg-aqua-cyan/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-aqua-cyan/10 border border-aqua-cyan/20 text-aqua-cyan text-xs font-bold uppercase tracking-widest">
              <Sparkles size={13} /> {t('Sobre Nosotros')}
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight gradient-text">
              {t('Transformando el monitoreo hídrico en El Salvador')}
            </h1>

            <p className="text-gray-400 text-sm md:text-base leading-relaxed">
              <strong className="text-ink">AquaFlow SV</strong> {t('es una plataforma tecnológica concebida para brindar supervisión en tiempo real, alertas preventivas y control inteligente del suministro de agua potable en los municipios del Gran San Salvador.')}
            </p>
          </div>

          {/* LOGO OFICIAL DESTACADO */}
          <div className="flex flex-col items-center justify-center p-6 bg-ink/[0.03] border border-ink/[0.08] rounded-3xl backdrop-blur-xl shadow-2xl flex-shrink-0 group hover:border-aqua-cyan/40 transition-all">
            <AquaFlowLogo size={110} variant="cyan" />
            <span className="font-black text-xl text-ink mt-3 tracking-tight">AquaFlow <span className="text-aqua-cyan">SV</span></span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{t('Isotipo Oficial 2026')}</span>
          </div>
        </div>
      </div>

      {/* MISIÓN Y VISIÓN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="portal-card p-6 border-l-4 border-l-aqua-cyan space-y-3">
          <div className="w-10 h-10 rounded-xl bg-aqua-cyan/10 flex items-center justify-center text-aqua-cyan">
            <Globe size={20} />
          </div>
          <h3 className="text-xl font-black text-ink">{t('Nuestra Misión')}</h3>
          <p className="text-xs text-gray-400 leading-relaxed font-medium">
            {t('Proveer una plataforma integral de monitoreo hídrico que combine dispositivos IoT, mapas interactivos de geolocalización e inteligencia artificial para detectar desabastecimientos, fluctuaciones de presión y fugas, garantizando un servicio más transparente y eficiente para la comunidad salvadoreña.')}
          </p>
        </div>

        <div className="portal-card p-6 border-l-4 border-l-green-400 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400">
            <Heart size={20} />
          </div>
          <h3 className="text-xl font-black text-ink">{t('Nuestra Visión')}</h3>
          <p className="text-xs text-gray-400 leading-relaxed font-medium">
            {t('Ser la solución de telemetría e infraestructura digital referente en El Salvador, empoderando a instituciones, técnicos y ciudadanos con información precisa para la toma de decisiones sostenibles en el cuidado y gestión del agua potable.')}
          </p>
        </div>
      </div>

      {/* PILARES TECNOLÓGICOS */}
      <div>
        <div className="text-center max-w-xl mx-auto mb-6">
          <p className="text-[10px] text-aqua-cyan/60 uppercase tracking-[0.25em] font-bold mb-1">{t('Innovación Tecnológica')}</p>
          <h2 className="text-2xl font-black tracking-tight text-ink">{t('Pilares Clave de AquaFlow SV')}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PILARES.map((p, i) => (
            <div key={i} className={`portal-card p-5 border ${p.border} space-y-3 hover:scale-[1.02] transition-all duration-200`}>
              <div className={`w-10 h-10 rounded-xl ${p.bg} flex items-center justify-center ${p.accent}`}>
                <p.icon size={20} />
              </div>
              <h4 className="font-bold text-sm text-ink">{p.title}</h4>
              <p className="text-xs text-gray-500 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ZONAS MONITOREADAS EN EL SALVADOR */}
      <div className="portal-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-ink/5">
          <div>
            <h3 className="text-lg font-black text-ink">{t('Cobertura Actual en el Gran San Salvador')}</h3>
            <p className="text-xs text-gray-500">{t('Zonas monitoreadas activamente por la red de sensores')}</p>
          </div>
          <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full text-green-400 text-xs font-bold">
            <Activity size={13} className="animate-pulse" /> {t('Telemetría Activa')}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ZONAS_VERDADERAS.map((z) => (
            <div key={z.id} className="bg-ink/[0.02] border border-ink/[0.05] rounded-xl p-4 flex items-center gap-3">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: z.color }} />
              <div className="min-w-0">
                <p className="text-xs font-bold text-ink truncate">{z.nombre}</p>
                <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                  <MapPin size={10} className="text-aqua-cyan" /> {z.sector}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* EQUIPO DE DESARROLLO */}
      <div>
        <div className="text-center max-w-xl mx-auto mb-6">
          <p className="text-[10px] text-aqua-cyan/60 uppercase tracking-[0.25em] font-bold mb-1">{t('Talento y Compromiso')}</p>
          <h2 className="text-2xl font-black tracking-tight text-ink">{t('Equipo de Desarrollo')}</h2>
          <p className="text-xs text-gray-500 mt-1">{t('Estudiantes detrás de la creación de AquaFlow SV')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TEAM.map((m) => (
            <div key={m.nombre} className="portal-card p-5 text-center flex flex-col items-center hover:scale-[1.02] transition-all duration-200 group">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${m.color} flex items-center justify-center text-white font-black text-xl shadow-lg mb-3 group-hover:rotate-3 transition-transform`}>
                {m.iniciales}
              </div>
              <h4 className="font-bold text-sm text-ink group-hover:text-aqua-cyan transition-colors">{m.nombre}</h4>
              <p className="text-[10px] text-gray-500 font-medium mt-1">{t('Desarrollador AquaFlow SV')}</p>
            </div>
          ))}
        </div>
      </div>

      {/* PIE DE PÁGINA SOBRE NOSOTROS */}
      <div className="portal-card p-6 text-center bg-gradient-to-r from-aqua-cyan/5 via-transparent to-aqua-cyan/5 border border-aqua-cyan/15">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Droplets size={16} className="text-aqua-cyan" />
          <span className="font-black text-ink text-sm">AquaFlow SV · {t('Proyecto 2026')}</span>
        </div>
        <p className="text-xs text-gray-500 max-w-lg mx-auto">
          {t('Diseñado con pasión por la innovación tecnológica, el compromiso ambiental y el bienestar de las familias salvadoreñas.')}
        </p>
      </div>

    </div>
  );
}

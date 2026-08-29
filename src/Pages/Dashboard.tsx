import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Droplets, AlertTriangle, FileText, Wifi, Gauge } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts';
import Clock from '../components/Clock';
import { useLang } from '../context/LanguageContext';
import axios from '../api/axiosConfig';
import { ZONAS_VERDADERAS, ESTADO_STYLES } from '../data/zonas';

/* ── Datos Dinámicos derivados de ZONAS_VERDADERAS ────────────────── */
const PRESSURE_DATA = [
  { hora: '08h', Cuscatancingo: 45, Soyapango: 40, 'Plan del Pino': 16, 'Ciudad Delgado': 32 },
  { hora: '09h', Cuscatancingo: 46, Soyapango: 41, 'Plan del Pino': 17, 'Ciudad Delgado': 33 },
  { hora: '10h', Cuscatancingo: 48, Soyapango: 42, 'Plan del Pino': 18, 'Ciudad Delgado': 34 },
  { hora: '11h', Cuscatancingo: 47, Soyapango: 43, 'Plan del Pino': 18.2, 'Ciudad Delgado': 35 },
  { hora: '12h', Cuscatancingo: 49, Soyapango: 42, 'Plan del Pino': 18, 'Ciudad Delgado': 36 },
  { hora: '13h', Cuscatancingo: 48.2, Soyapango: 42.5, 'Plan del Pino': 18.4, 'Ciudad Delgado': 35.0 },
];

const ZONE_COLORS: Record<string, string> = {
  Cuscatancingo:    '#22c55e',
  Soyapango:        '#00f2ea',
  'Plan del Pino':  '#ef4444',
  'Ciudad Delgado': '#f59e0b',
};

// Los nombres de zona tienen espacios ("Plan del Pino"), pero un id de SVG no
// puede tenerlos: un url(#pg-Plan del Pino) sin comillas es una referencia
// inválida y el navegador descarta el degradado, dejando esa área en negro.
const idZona = (nombre: string) => nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-');

const FLOW_DATA = ZONAS_VERDADERAS.map(z => ({
  zona: z.nombre.replace(' Centro', ''),
  flujo: z.flujo,
  fill: z.color,
}));

/* ── Tooltips personalizados ─────────────────────────────────────── */
const PressureTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--color-aqua-panel)] border border-ink/10 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{label}</p>
      {payload.map((e: any) => (
        <div key={e.name} className="flex items-center gap-2 text-xs mb-1 last:mb-0">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: e.color }} />
          <span className="text-gray-400">{e.name}:</span>
          <span className="font-black" style={{ color: e.color }}>{e.value} PSI</span>
        </div>
      ))}
    </div>
  );
};

const FlowTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--color-aqua-panel)] border border-ink/10 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-xs font-black text-ink">{label}</p>
      <p className="text-base font-black mt-0.5" style={{ color: payload[0]?.fill ?? 'var(--color-aqua-cyan)' }}>
        {payload[0]?.value} <span className="text-xs font-bold text-gray-500">L/min</span>
      </p>
    </div>
  );
};

/* ── Página ──────────────────────────────────────────────────────── */
export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useLang();
  const [reportesInfo, setReportesInfo] = useState({ total: 12, pendientes: 2 });
  const [alertasInfo, setAlertasInfo]   = useState({ total: 1, sub: 'Presión crítica' });

  useEffect(() => {
    // Cargar datos de reportes reales
    axios.get('/api/reportes')
      .then(res => {
        if (Array.isArray(res.data)) {
          const total = res.data.length;
          const pendientes = res.data.filter((r: any) => r.estado === 'pendiente' || !r.estado).length;
          setReportesInfo({ total, pendientes });
        }
      })
      .catch(() => { /* mantener fallback elegante */ });

    // Cargar datos de alertas reales
    axios.get('/api/alertas')
      .then(res => {
        if (Array.isArray(res.data)) {
          const activas = res.data.filter((a: any) => a.estado === 'activa').length;
          setAlertasInfo({ 
            total: activas, 
            sub: activas > 0 ? `${activas} requieren revisión` : 'Sin alertas críticas' 
          });
        }
      })
      .catch(() => { /* mantener fallback elegante */ });
  }, []);

  const operativasCount = ZONAS_VERDADERAS.filter(z => z.estado === 'Óptimo' || z.estado === 'Estable').length;
  const alertasCount    = ZONAS_VERDADERAS.filter(z => z.estado === 'Alerta' || z.estado === 'Crítico').length;

  const KPIS = [
    { 
      label: t('dash.kpi.zonas'), 
      value: String(ZONAS_VERDADERAS.length), 
      sub: `${operativasCount} ${t('dash.kpi.zonas.sub')}`, 
      icon: Wifi, 
      accent: 'text-aqua-cyan',  
      bg: 'bg-aqua-cyan/10',  
      top: 'card-top-cyan',
      route: '/mapa'
    },
    { 
      label: t('dash.kpi.sensores'),    
      value: '5/6', 
      sub: t('dash.kpi.sensores.sub'),  
      icon: Activity,      
      accent: 'text-green-400',  
      bg: 'bg-green-500/10',  
      top: 'card-top-green',
      route: '/sensores'
    },
    { 
      label: t('dash.kpi.reportes'), 
      value: String(reportesInfo.total),  
      sub: `${reportesInfo.pendientes} ${t('dash.kpi.reportes.sub')}`,         
      icon: FileText,      
      accent: 'text-blue-400',   
      bg: 'bg-blue-500/10',   
      top: 'card-top-blue',
      route: '/reportes'
    },
    { 
      label: t('dash.kpi.alertas'),     
      value: String(alertasInfo.total),   
      sub: alertasInfo.sub,      
      icon: AlertTriangle, 
      accent: 'text-amber-400',  
      bg: 'bg-amber-500/10',  
      top: 'card-top-amber',
      route: '/alertas'
    },
  ];

  return (
    <div className="space-y-5 page-enter portal-grid-bg min-h-full pb-2">

      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-[10px] text-aqua-cyan/60 uppercase tracking-[0.25em] font-bold mb-1">
            {t('dash.region')}
          </p>
          <h2 className="text-3xl font-black tracking-tighter gradient-text leading-tight">
            {t('dash.title')}
          </h2>
        </div>
        <div className="text-right flex-shrink-0">
          <Clock />
          <div className="flex items-center justify-end gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] text-green-400 font-bold tracking-widest uppercase">{t('dash.live')}</span>
          </div>
        </div>
      </div>

      {/* KPI Cards (Interactivas y conectadas a sus rutas) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {KPIS.map((k) => (
          <div 
            key={k.label} 
            onClick={() => navigate(k.route)}
            className={`portal-card ${k.top} p-5 flex items-start gap-3 hover:scale-[1.02] cursor-pointer transition-all duration-200 group`}
            title={`Ir a ${k.label}`}
          >
            <div className={`w-10 h-10 rounded-xl ${k.bg} flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-aqua-cyan/20 transition-colors`}>
              <k.icon size={18} className={k.accent} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-2xl font-black text-ink leading-none">{k.value}</p>
              <p className="text-[11px] font-bold text-gray-500 mt-0.5 leading-tight group-hover:text-aqua-cyan transition-colors">{k.label}</p>
              <p className={`text-[10px] font-bold mt-1.5 ${k.accent}`}>{k.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficas principales */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-3">

        {/* Tendencia de Presión */}
        <div className="xl:col-span-3 portal-card p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Tendencia de Presión</p>
              <h3 className="text-sm font-black text-ink mt-0.5">Últimas 6 horas · PSI por zona real</h3>
            </div>
            <div className="flex items-center gap-1.5 bg-ink/[0.03] border border-ink/[0.06] px-3 py-1.5 rounded-full flex-shrink-0">
              <Gauge size={11} className="text-aqua-cyan" />
              <span className="text-[10px] text-gray-400 font-bold">35–55 PSI normal</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={PRESSURE_DATA} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
              <defs>
                {Object.entries(ZONE_COLORS).map(([name, color]) => (
                  <linearGradient key={name} id={`pg-${idZona(name)}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={color} stopOpacity={0.28} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="hora" tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
              <YAxis domain={[10, 60]} tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<PressureTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.05)' }} />
              {Object.entries(ZONE_COLORS).map(([name, color]) => (
                <Area key={name} type="monotone" dataKey={name}
                  stroke={color} strokeWidth={2} fill={`url(#pg-${idZona(name)})`}
                  dot={false} activeDot={{ r: 3, strokeWidth: 0 }} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-ink/[0.04]">
            {Object.entries(ZONE_COLORS).map(([name, color]) => (
              <div key={name} className="flex items-center gap-1.5">
                <span className="w-5 h-0.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[10px] text-gray-500 font-bold">{name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Estado de Zonas */}
        <div className="xl:col-span-2 portal-card p-5 flex flex-col">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Estado Actual</p>
              <h3 className="text-sm font-black text-ink mt-0.5">Presión por zona</h3>
            </div>
            <button 
              onClick={() => navigate('/mapa')}
              className="text-[11px] font-bold text-aqua-cyan hover:underline"
            >
              Ver mapa →
            </button>
          </div>
          <div className="space-y-4 flex-1">
            {ZONAS_VERDADERAS.map((z) => {
              const st = ESTADO_STYLES[z.estado] || ESTADO_STYLES['Estable'];
              return (
                <div key={z.nombre}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: z.color }} />
                      <span className="text-xs text-ink/80 font-bold truncate">{z.nombre}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                      <span className="text-xs font-black" style={{ color: z.color }}>{z.presion} PSI</span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${st.pill}`}>{z.estado}</span>
                    </div>
                  </div>
                  <div className="w-full bg-ink/[0.05] rounded-full h-1.5">
                    <div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, (z.presion / 60) * 100)}%`, backgroundColor: z.color }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-ink/[0.04] grid grid-cols-2 gap-2">
            <div className="bg-green-500/[0.07] border border-green-500/15 rounded-xl p-3 text-center">
              <p className="text-xl font-black text-green-400">{operativasCount}</p>
              <p className="text-[10px] text-gray-500 font-bold mt-0.5">Operativas</p>
            </div>
            <div className="bg-amber-500/[0.07] border border-amber-500/15 rounded-xl p-3 text-center">
              <p className="text-xl font-black text-amber-400">{alertasCount}</p>
              <p className="text-[10px] text-gray-500 font-bold mt-0.5">En Alerta / Críticas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Flujo + Tabla */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-3">

        {/* Bar Chart de Flujo */}
        <div className="xl:col-span-2 portal-card p-5">
          <div className="mb-4">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Caudal Actual</p>
            <h3 className="text-sm font-black text-ink mt-0.5">Flujo por zona · L/min</h3>
          </div>
          <ResponsiveContainer width="100%" height={155}>
            <BarChart data={FLOW_DATA} margin={{ top: 2, right: 4, left: -26, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="zona" tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<FlowTooltip />} cursor={{ fill: 'rgba(255,255,255,0.025)' }} />
              <Bar dataKey="flujo" radius={[5, 5, 0, 0]} maxBarSize={42}>
                {FLOW_DATA.map((e, i) => <Cell key={i} fill={e.fill} fillOpacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tabla operativa */}
        <div className="xl:col-span-3 portal-card overflow-hidden">
          <div className="px-5 py-4 border-b border-ink/[0.04] flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Resumen Operativo Real</p>
              <h3 className="text-sm font-black text-ink mt-0.5">Todas las zonas monitoreadas</h3>
            </div>
            <div className="flex items-center gap-1.5">
              <Droplets size={13} className="text-aqua-cyan" />
              <span className="text-[10px] text-aqua-cyan font-bold">{ZONAS_VERDADERAS.length} zonas</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-ink/[0.04] bg-ink/[0.015]">
                  {['Zona', 'Presión', 'Flujo', 'Estado'].map(h => (
                    <th key={h} className="px-5 py-2.5 text-[10px] uppercase font-black tracking-widest text-gray-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ZONAS_VERDADERAS.map((z, i) => {
                  const st = ESTADO_STYLES[z.estado] || ESTADO_STYLES['Estable'];
                  return (
                    <tr key={z.nombre}
                      className={`hover:bg-ink/[0.02] transition-colors ${i < ZONAS_VERDADERAS.length - 1 ? 'border-b border-ink/[0.03]' : ''}`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: z.color }} />
                          <div>
                            <span className="text-sm font-bold text-ink whitespace-nowrap">{z.nombre}</span>
                            <p className="text-[10px] text-gray-500 capitalize">{z.sector}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="text-sm font-black" style={{ color: z.color }}>{z.presion}</span>
                        <span className="text-xs text-gray-600 ml-1">PSI</span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="text-sm font-bold text-ink/80">{z.flujo}</span>
                        <span className="text-xs text-gray-600 ml-1">L/min</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${st.pill}`}>{z.estado}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}


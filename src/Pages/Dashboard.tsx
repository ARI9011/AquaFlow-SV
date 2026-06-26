import { Activity, Droplets, AlertTriangle, FileText, Wifi, Gauge } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts';
import Clock from '../components/Clock';

/* ── Datos ──────────────────────────────────────────────────────── */
const PRESSURE_DATA = [
  { hora: '08h', Escalón: 48, Soyapango: 34, Mejicanos: 42, Ilopango: 25 },
  { hora: '09h', Escalón: 50, Soyapango: 36, Mejicanos: 44, Ilopango: 27 },
  { hora: '10h', Escalón: 52, Soyapango: 35, Mejicanos: 46, Ilopango: 26 },
  { hora: '11h', Escalón: 51, Soyapango: 37, Mejicanos: 45, Ilopango: 28 },
  { hora: '12h', Escalón: 53, Soyapango: 38, Mejicanos: 47, Ilopango: 30 },
  { hora: '13h', Escalón: 50, Soyapango: 36, Mejicanos: 45, Ilopango: 29 },
  { hora: '14h', Escalón: 52, Soyapango: 38, Mejicanos: 46, Ilopango: 28 },
  { hora: '15h', Escalón: 52, Soyapango: 38, Mejicanos: 45, Ilopango: 28 },
];

const ZONE_COLORS: Record<string, string> = {
  Escalón:   '#00f2ea',
  Soyapango: '#22c55e',
  Mejicanos: '#3b82f6',
  Ilopango:  '#f59e0b',
};

const FLOW_DATA = [
  { zona: 'Escalón',   flujo: 120, fill: '#00f2ea' },
  { zona: 'Soyapango', flujo: 85,  fill: '#22c55e' },
  { zona: 'Mejicanos', flujo: 105, fill: '#3b82f6' },
  { zona: 'Ilopango',  flujo: 72,  fill: '#f59e0b' },
];

const ZONAS = [
  { nombre: 'Colonia Escalón',  presion: 52, flujo: 120, estado: 'Óptimo',  color: '#00f2ea', pill: 'bg-green-500/15 text-green-400 border border-green-500/25'  },
  { nombre: 'Soyapango Centro', presion: 38, flujo: 85,  estado: 'Estable', color: '#22c55e', pill: 'bg-aqua-cyan/15 text-aqua-cyan border border-aqua-cyan/25'   },
  { nombre: 'Mejicanos Norte',  presion: 45, flujo: 105, estado: 'Óptimo',  color: '#3b82f6', pill: 'bg-green-500/15 text-green-400 border border-green-500/25'   },
  { nombre: 'Ilopango Sur',     presion: 28, flujo: 72,  estado: 'Alerta',  color: '#f59e0b', pill: 'bg-amber-500/15 text-amber-400 border border-amber-500/25'   },
];

const KPIS = [
  { label: 'Zonas Activas',       value: '4',   sub: 'Gran San Salvador',    icon: Wifi,          accent: 'text-aqua-cyan',  bg: 'bg-aqua-cyan/10',  top: 'card-top-cyan'  },
  { label: 'Sensores Activos',    value: '5/6', sub: '1 requiere atención',  icon: Activity,      accent: 'text-green-400',  bg: 'bg-green-500/10',  top: 'card-top-green' },
  { label: 'Reportes Ciudadanos', value: '12',  sub: '2 pendientes',         icon: FileText,      accent: 'text-blue-400',   bg: 'bg-blue-500/10',   top: 'card-top-blue'  },
  { label: 'Alertas Activas',     value: '1',   sub: 'Presión crítica',      icon: AlertTriangle, accent: 'text-amber-400',  bg: 'bg-amber-500/10',  top: 'card-top-amber' },
];

/* ── Tooltips personalizados ─────────────────────────────────────── */
const PressureTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0d1c21] border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
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
    <div className="bg-[#0d1c21] border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-xs font-black text-white">{label}</p>
      <p className="text-base font-black mt-0.5" style={{ color: payload[0]?.fill ?? '#00f2ea' }}>
        {payload[0]?.value} <span className="text-xs font-bold text-gray-500">L/min</span>
      </p>
    </div>
  );
};

/* ── Página ──────────────────────────────────────────────────────── */
export default function Dashboard() {
  return (
    <div className="space-y-5 page-enter portal-grid-bg min-h-full pb-2">

      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-[10px] text-aqua-cyan/60 uppercase tracking-[0.25em] font-bold mb-1">
            Gran San Salvador · El Salvador
          </p>
          <h2 className="text-3xl font-black tracking-tighter gradient-text leading-tight">
            Sistema de Monitoreo Hídrico
          </h2>
        </div>
        <div className="text-right flex-shrink-0">
          <Clock />
          <div className="flex items-center justify-end gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] text-green-400 font-bold tracking-widest uppercase">Datos en vivo</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {KPIS.map((k) => (
          <div key={k.label} className={`portal-card ${k.top} p-5 flex items-start gap-3 hover:scale-[1.015] cursor-default transition-all duration-200`}>
            <div className={`w-10 h-10 rounded-xl ${k.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
              <k.icon size={18} className={k.accent} />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-black text-white leading-none">{k.value}</p>
              <p className="text-[11px] font-bold text-gray-500 mt-0.5 leading-tight">{k.label}</p>
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
              <h3 className="text-sm font-black text-white mt-0.5">Últimas 8 horas · PSI por zona</h3>
            </div>
            <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.06] px-3 py-1.5 rounded-full flex-shrink-0">
              <Gauge size={11} className="text-aqua-cyan" />
              <span className="text-[10px] text-gray-400 font-bold">35–55 PSI normal</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={PRESSURE_DATA} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
              <defs>
                {Object.entries(ZONE_COLORS).map(([name, color]) => (
                  <linearGradient key={name} id={`pg-${name}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={color} stopOpacity={0.28} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="hora" tick={{ fill: '#374151', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
              <YAxis domain={[18, 60]} tick={{ fill: '#374151', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<PressureTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.05)' }} />
              {Object.entries(ZONE_COLORS).map(([name, color]) => (
                <Area key={name} type="monotone" dataKey={name}
                  stroke={color} strokeWidth={2} fill={`url(#pg-${name})`}
                  dot={false} activeDot={{ r: 3, strokeWidth: 0 }} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-white/[0.04]">
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
          <div className="mb-4">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Estado Actual</p>
            <h3 className="text-sm font-black text-white mt-0.5">Presión por zona</h3>
          </div>
          <div className="space-y-4 flex-1">
            {ZONAS.map((z) => (
              <div key={z.nombre}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: z.color }} />
                    <span className="text-xs text-gray-300 font-bold truncate">{z.nombre.split(' ')[0]}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                    <span className="text-xs font-black" style={{ color: z.color }}>{z.presion} PSI</span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${z.pill}`}>{z.estado}</span>
                  </div>
                </div>
                <div className="w-full bg-white/[0.05] rounded-full h-1.5">
                  <div className="h-1.5 rounded-full" style={{ width: `${(z.presion / 60) * 100}%`, backgroundColor: z.color }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-white/[0.04] grid grid-cols-2 gap-2">
            <div className="bg-green-500/[0.07] border border-green-500/15 rounded-xl p-3 text-center">
              <p className="text-xl font-black text-green-400">3</p>
              <p className="text-[10px] text-gray-500 font-bold mt-0.5">Óptimas</p>
            </div>
            <div className="bg-amber-500/[0.07] border border-amber-500/15 rounded-xl p-3 text-center">
              <p className="text-xl font-black text-amber-400">1</p>
              <p className="text-[10px] text-gray-500 font-bold mt-0.5">En Alerta</p>
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
            <h3 className="text-sm font-black text-white mt-0.5">Flujo por zona · L/min</h3>
          </div>
          <ResponsiveContainer width="100%" height={155}>
            <BarChart data={FLOW_DATA} margin={{ top: 2, right: 4, left: -26, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="zona" tick={{ fill: '#374151', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#374151', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<FlowTooltip />} cursor={{ fill: 'rgba(255,255,255,0.025)' }} />
              <Bar dataKey="flujo" radius={[5, 5, 0, 0]} maxBarSize={42}>
                {FLOW_DATA.map((e, i) => <Cell key={i} fill={e.fill} fillOpacity={0.82} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tabla operativa */}
        <div className="xl:col-span-3 portal-card overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.04] flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Resumen Operativo</p>
              <h3 className="text-sm font-black text-white mt-0.5">Todas las zonas monitoreadas</h3>
            </div>
            <div className="flex items-center gap-1.5">
              <Droplets size={13} className="text-aqua-cyan" />
              <span className="text-[10px] text-aqua-cyan font-bold">4 zonas</span>
            </div>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/[0.04] bg-white/[0.015]">
                {['Zona', 'Presión', 'Flujo', 'Estado'].map(h => (
                  <th key={h} className="px-5 py-2.5 text-[10px] uppercase font-black tracking-widest text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ZONAS.map((z, i) => (
                <tr key={z.nombre}
                  className={`hover:bg-white/[0.02] transition-colors ${i < ZONAS.length - 1 ? 'border-b border-white/[0.03]' : ''}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: z.color }} />
                      <span className="text-sm font-bold text-white">{z.nombre}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-black" style={{ color: z.color }}>{z.presion}</span>
                    <span className="text-xs text-gray-600 ml-1">PSI</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-bold text-gray-300">{z.flujo}</span>
                    <span className="text-xs text-gray-600 ml-1">L/min</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${z.pill}`}>{z.estado}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

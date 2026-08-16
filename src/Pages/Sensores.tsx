import { useState, useEffect } from 'react';
import { Droplets, Zap, Wifi, AlertTriangle, CheckCircle, Battery, Clock, Cpu } from 'lucide-react';

interface EstadoPiloto {
  conectado: boolean;
  caudal: number | null;
  estado: string | null;
  rele: boolean | null;
  actualizado_en: string | null;
}

function segundosDesde(iso: string | null) {
  if (!iso) return null;
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
}

function SensorPilotoCard() {
  const [datos, setDatos] = useState<EstadoPiloto | null>(null);
  const [, forzarRender] = useState(0);

  // Streaming en vivo: el servidor empuja el estado apenas cambia. Si el backend
  // aún no está disponible, reintenta cada 5 s de forma controlada (sin llenar
  // la consola de errores).
  useEffect(() => {
    let es: EventSource | null = null;
    let reintento: ReturnType<typeof setTimeout> | null = null;
    let cerrado = false;

    const conectar = () => {
      if (cerrado) return;
      es = new EventSource('/api/sensores/piloto/stream');

      es.onmessage = (ev) => {
        try { setDatos(JSON.parse(ev.data)); } catch { /* ignorar datos inválidos */ }
      };

      es.onerror = () => {
        // El backend no responde (aún no arranca o se cayó): cerrar y reintentar.
        es?.close();
        setDatos((d) => (d ? { ...d, conectado: false } : d));
        if (!cerrado) reintento = setTimeout(conectar, 5000);
      };
    };

    conectar();
    return () => {
      cerrado = true;
      if (reintento) clearTimeout(reintento);
      es?.close();
    };
  }, []);

  // El servidor solo empuja cuando algo cambia; este tick local es solo para
  // que el texto "hace Ns" se mantenga contando entre un push y el siguiente.
  useEffect(() => {
    const id = setInterval(() => forzarRender(n => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const conectado = !!datos?.conectado;
  const segundos = segundosDesde(datos?.actualizado_en ?? null);

  return (
    <div className={`portal-card overflow-hidden transition-all duration-200 ${conectado ? '' : 'opacity-70'}`}>
      <div className={`h-0.5 w-full ${conectado ? 'bg-gradient-to-r from-aqua-cyan/60 to-transparent' : 'bg-gradient-to-r from-red-500/60 to-transparent'}`} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${conectado ? 'bg-aqua-cyan/10' : 'bg-red-500/10'}`}>
              <Cpu size={16} className={conectado ? 'text-aqua-cyan' : 'text-red-400'} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-ink truncate">Sensor de Flujo (Arduino piloto)</p>
              <p className="text-[10px] text-gray-500 font-bold truncate">Conectado por USB · sin zona asignada</p>
            </div>
          </div>
          {conectado
            ? <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-full flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[9px] font-black text-green-400 uppercase tracking-wide">En vivo</span>
              </div>
            : <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-full flex-shrink-0">
                <AlertTriangle size={10} className="text-red-400" />
                <span className="text-[9px] font-black text-red-400 uppercase tracking-wide">Desconectado</span>
              </div>
          }
        </div>

        <div className="bg-ink/[0.03] border border-ink/[0.05] rounded-xl px-4 py-3 mb-3 text-center">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Flujo</p>
          <p className="text-3xl font-black" style={{ color: conectado ? 'var(--color-aqua-cyan)' : '#6b7280' }}>
            {conectado && datos?.caudal != null ? datos.caudal.toFixed(2) : '—'}
            <span className="text-sm text-gray-500 ml-1 font-bold">L/min</span>
          </p>
          {conectado && datos?.estado && (
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{datos.estado}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5 pt-0.5">
          <Clock size={10} className="text-gray-600" />
          <span className="text-[10px] text-gray-500">
            {conectado && segundos != null ? `Actualizado hace ${segundos}s` : 'Sin datos recientes del dispositivo'}
          </span>
        </div>
      </div>
    </div>
  );
}

const SENSORES = [
  { id: 1, nombre: 'Sensor T-001', zona: 'Cuscatancingo Centro',  tipo: 'Presión', valor: 48.2, unidad: 'PSI',   bateria: 95, activo: true,  lectura: 'Hace 2 min' },
  { id: 2, nombre: 'Sensor F-001', zona: 'Cuscatancingo Centro',  tipo: 'Flujo',   valor: 15.2, unidad: 'L/min', bateria: 88, activo: true,  lectura: 'Hace 1 min' },
  { id: 3, nombre: 'Sensor T-002', zona: 'Soyapango Centro',     tipo: 'Presión', valor: 42.5, unidad: 'PSI',   bateria: 72, activo: true,  lectura: 'Hace 3 min' },
  { id: 4, nombre: 'Sensor F-002', zona: 'Soyapango Centro',     tipo: 'Flujo',   valor: 12.8, unidad: 'L/min', bateria: 15, activo: false, lectura: 'Hace 45 min' },
  { id: 5, nombre: 'Sensor T-003', zona: 'Plan del Pino',        tipo: 'Presión', valor: 18.4, unidad: 'PSI',   bateria: 60, activo: true,  lectura: 'Hace 5 min' },
  { id: 6, nombre: 'Sensor T-004', zona: 'Ciudad Delgado Centro', tipo: 'Presión', valor: 35.0, unidad: 'PSI',   bateria: 82, activo: true,  lectura: 'Hace 2 min' },
];

function batteryColor(pct: number) {
  if (pct > 50) return { text: 'text-green-400', bar: 'bg-green-500' };
  if (pct > 25) return { text: 'text-amber-400', bar: 'bg-amber-500' };
  return { text: 'text-red-400', bar: 'bg-red-500' };
}

function SensorCard({ s }: { s: typeof SENSORES[0] }) {
  const bat = batteryColor(s.bateria);
  const TipoIcon = s.tipo === 'Flujo' ? Zap : Droplets;
  return (
    <div className={`portal-card overflow-hidden transition-all duration-200 hover:scale-[1.015] ${s.activo ? '' : 'opacity-70'}`}>
      {/* Banda superior de color */}
      <div className={`h-0.5 w-full ${s.activo ? 'bg-gradient-to-r from-aqua-cyan/60 to-transparent' : 'bg-gradient-to-r from-red-500/60 to-transparent'}`} />

      <div className="p-5">
        {/* Cabecera */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${s.activo ? 'bg-aqua-cyan/10' : 'bg-red-500/10'}`}>
              <TipoIcon size={16} className={s.activo ? 'text-aqua-cyan' : 'text-red-400'} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-ink truncate">{s.nombre}</p>
              <p className="text-[10px] text-gray-500 font-bold truncate">{s.zona}</p>
            </div>
          </div>
          {s.activo
            ? <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-full flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[9px] font-black text-green-400 uppercase tracking-wide">Activo</span>
              </div>
            : <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-full flex-shrink-0">
                <AlertTriangle size={10} className="text-red-400" />
                <span className="text-[9px] font-black text-red-400 uppercase tracking-wide">Inactivo</span>
              </div>
          }
        </div>

        {/* Valor principal */}
        <div className="bg-ink/[0.03] border border-ink/[0.05] rounded-xl px-4 py-3 mb-3 text-center">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">{s.tipo}</p>
          <p className="text-3xl font-black" style={{ color: s.activo ? 'var(--color-aqua-cyan)' : '#6b7280' }}>
            {s.valor}
            <span className="text-sm text-gray-500 ml-1 font-bold">{s.unidad}</span>
          </p>
        </div>

        {/* Batería y última lectura */}
        <div className="space-y-2">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                <Battery size={11} className={bat.text} />
                <span className="text-[10px] text-gray-500 font-bold">Batería</span>
              </div>
              <span className={`text-[11px] font-black ${bat.text}`}>{s.bateria}%</span>
            </div>
            <div className="w-full bg-ink/[0.05] rounded-full h-1.5">
              <div className={`h-1.5 rounded-full ${bat.bar}`} style={{ width: `${s.bateria}%`, transition: 'width 0.8s ease' }} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 pt-0.5">
            <Clock size={10} className="text-gray-600" />
            <span className="text-[10px] text-gray-500">{s.lectura}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Sensores() {
  const [filtro, setFiltro] = useState<'todos' | 'activos' | 'inactivos'>('todos');

  const activos   = SENSORES.filter(s => s.activo).length;
  const inactivos = SENSORES.filter(s => !s.activo).length;

  const filtrados = filtro === 'activos'   ? SENSORES.filter(s => s.activo)
                  : filtro === 'inactivos' ? SENSORES.filter(s => !s.activo)
                  : SENSORES;

  const KPIS = [
    { label: 'Activos',         value: activos,           sub: 'Transmitiendo datos', color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'card-top-green', icon: CheckCircle },
    { label: 'Inactivos',       value: inactivos,         sub: 'Requieren atención',  color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'card-top-red',   icon: AlertTriangle },
    { label: 'Total en Red',    value: SENSORES.length,   sub: 'Dispositivos IoT',    color: 'text-aqua-cyan',  bg: 'bg-aqua-cyan/10',  border: 'card-top-cyan',  icon: Wifi },
  ];

  const FILTERS = [
    { key: 'todos',     label: `Todos (${SENSORES.length})` },
    { key: 'activos',   label: `Activos (${activos})` },
    { key: 'inactivos', label: `Inactivos (${inactivos})` },
  ] as const;

  return (
    <div className="space-y-5 page-enter portal-grid-bg min-h-full pb-2">

      {/* Cabecera */}
      <div>
        <p className="text-[10px] text-aqua-cyan/60 uppercase tracking-[0.25em] font-bold mb-1">Dispositivos IoT</p>
        <h2 className="text-3xl font-black tracking-tighter gradient-text">Sensores de Medición</h2>
        <p className="text-sm text-gray-500 mt-1">Monitoreo en tiempo real de la red de sensores</p>
      </div>

      {/* Dispositivo real conectado */}
      <div>
        <p className="text-[9px] uppercase font-black text-gray-600 tracking-[0.22em] mb-2">Dispositivo real</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <SensorPilotoCard />
        </div>
      </div>

      {/* KPI Cards */}
      <div>
      <p className="text-[9px] uppercase font-black text-gray-600 tracking-[0.22em] mb-2">Red simulada (datos de ejemplo)</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {KPIS.map((k) => (
          <div key={k.label} className={`portal-card ${k.border} p-5 flex items-center gap-4`}>
            <div className={`w-10 h-10 rounded-xl ${k.bg} flex items-center justify-center flex-shrink-0`}>
              <k.icon size={18} className={k.color} />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-black text-ink">{k.value}</p>
              <p className="text-[11px] font-bold text-gray-500 truncate">{k.label}</p>
              <p className={`text-[10px] font-bold mt-0.5 ${k.color}`}>{k.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFiltro(key)}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all border ${
              filtro === key
                ? 'bg-aqua-cyan text-aqua-dark border-aqua-cyan'
                : 'bg-ink/[0.03] text-gray-400 border-ink/[0.06] hover:border-ink/15 hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Grid de sensores */}
      {filtrados.length === 0 ? (
        <div className="portal-card p-10 text-center">
          <Wifi size={28} className="mx-auto mb-3 text-gray-600" />
          <p className="text-sm font-bold text-gray-500">No hay sensores con este filtro.</p>
          <p className="text-xs text-gray-600 mt-1">Prueba con otra categoría.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtrados.map((s) => <SensorCard key={s.id} s={s} />)}
        </div>
      )}
      </div>
    </div>
  );
}

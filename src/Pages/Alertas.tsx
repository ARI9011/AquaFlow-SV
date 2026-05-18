import React, { useState } from 'react';
import { Bell, AlertTriangle, CheckCircle, Clock, Droplets, Zap, X } from 'lucide-react';

const alertasIniciales = [
  {
    id: 1,
    tipo: 'Presión Crítica',
    zona: 'Mejicanos Norte',
    sector: 'Mejicanos',
    descripcion: 'La presión ha caído a 18.4 PSI, por debajo del umbral mínimo de 25 PSI. Revisar red de distribución.',
    severidad: 'critica',
    icono: AlertTriangle,
    timestamp: 'hace 12 min',
  },
  {
    id: 2,
    tipo: 'Sensor Inactivo',
    zona: 'Soyapango Centro',
    sector: 'Soyapango',
    descripcion: 'Sensor F-002 sin respuesta desde hace 45 minutos. Batería al 15%, posible falla de conexión.',
    severidad: 'alta',
    icono: Zap,
    timestamp: 'hace 45 min',
  },
  {
    id: 3,
    tipo: 'Flujo Bajo',
    zona: 'Ilopango Sur',
    sector: 'Ilopango',
    descripcion: 'Flujo reducido a 10 L/min en el sector sur. Posible obstrucción o fuga en la red secundaria.',
    severidad: 'media',
    icono: Droplets,
    timestamp: 'hace 1 h',
  },
];

const historial = [
  { label: 'Sensor T-001 reconectado',  zona: 'Colonia Escalón',  tiempo: 'hace 3 h' },
  { label: 'Presión normalizada',        zona: 'Soyapango Centro', tiempo: 'hace 5 h' },
  { label: 'Fuga detectada y reparada', zona: 'Mejicanos Norte',  tiempo: 'hace 8 h' },
];

const severidadStyle: Record<string, { text: string; bg: string; border: string; label: string }> = {
  critica: { text: '#ef4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.3)',  label: 'Crítica' },
  alta:    { text: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)', label: 'Alta'    },
  media:   { text: '#00f2ea', bg: 'rgba(0,242,234,0.08)',  border: 'rgba(0,242,234,0.3)',  label: 'Media'   },
};

export default function Alertas() {
  const [alertas, setAlertas] = useState(alertasIniciales);

  const resolver = (id: number) => setAlertas(prev => prev.filter(a => a.id !== id));

  return (
    <div className="space-y-8 animate-in fade-in duration-700">

      <div>
        <h2 className="text-3xl font-black tracking-tighter text-white mb-2">
          Alertas del <span className="text-aqua-cyan">Sistema</span>
        </h2>
        <p className="text-gray-500 text-sm">Notificaciones activas que requieren atención inmediata</p>
      </div>

      {/* BANNER */}
      {alertas.length > 0 ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 flex items-start gap-4">
          <Bell className="text-red-400 flex-shrink-0 mt-1 animate-pulse" size={20} />
          <div>
            <h3 className="font-black text-red-400 mb-1">
              {alertas.length} alerta{alertas.length !== 1 ? 's' : ''} activa{alertas.length !== 1 ? 's' : ''}
            </h3>
            <p className="text-sm text-gray-300">Revisa y atiende las incidencias para mantener el sistema en óptimas condiciones.</p>
          </div>
        </div>
      ) : (
        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 flex items-start gap-4">
          <CheckCircle className="text-green-400 flex-shrink-0 mt-1" size={20} />
          <div>
            <h3 className="font-black text-green-400 mb-1">Sin alertas activas</h3>
            <p className="text-sm text-gray-300">Todos los sistemas operan con normalidad.</p>
          </div>
        </div>
      )}

      {/* ALERTAS ACTIVAS */}
      {alertas.length > 0 && (
        <div className="space-y-4">
          {alertas.map((alerta) => {
            const style = severidadStyle[alerta.severidad];
            const Icon  = alerta.icono;
            return (
              <div
                key={alerta.id}
                className="bg-aqua-card rounded-2xl p-6 flex items-start gap-4 transition-all hover:scale-[1.005]"
                style={{ border: `1px solid ${style.border}` }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: style.bg }}
                >
                  <Icon size={22} style={{ color: style.text }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-black text-white">{alerta.tipo}</h3>
                    <span
                      className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md"
                      style={{ color: style.text, backgroundColor: style.bg }}
                    >
                      {style.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">{alerta.descripcion}</p>
                  <div className="flex flex-wrap gap-4 text-[10px] text-gray-500">
                    <span>Zona: <strong className="text-gray-400">{alerta.zona}</strong></span>
                    <span className="flex items-center gap-1"><Clock size={10} />{alerta.timestamp}</span>
                  </div>
                </div>
                <button
                  onClick={() => resolver(alerta.id)}
                  title="Marcar como resuelto"
                  className="p-2 rounded-xl text-gray-500 hover:text-green-400 hover:bg-green-400/10 transition-all flex-shrink-0"
                >
                  <X size={18} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* HISTORIAL */}
      <div className="bg-aqua-card border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5">
          <h3 className="font-bold text-xl">Historial Reciente</h3>
        </div>
        <div className="p-6 space-y-2">
          {historial.map((item, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.02] transition-colors">
              <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
              <div className="flex-1">
                <span className="text-sm font-bold text-gray-300">{item.label}</span>
                <span className="text-gray-500 text-sm"> — {item.zona}</span>
              </div>
              <span className="text-[10px] text-gray-600 flex-shrink-0">{item.tiempo}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

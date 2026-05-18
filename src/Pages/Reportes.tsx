import React, { useState } from 'react';
import { FileText, AlertTriangle, CheckCircle, Clock, MapPin, Droplets, Zap } from 'lucide-react';

const reportesData = [
  {
    id: 1, tipo: 'Fuga de agua', zona: 'Colonia Escalón', sector: 'San Salvador',
    descripcion: 'Fuga visible en la calle principal, agua corriendo por la calzada hacia el parque.',
    estado: 'pendiente', prioridad: 'alta', fecha: '2026-05-18 09:24', reportadoPor: 'Ciudadano anónimo',
  },
  {
    id: 2, tipo: 'Presión baja', zona: 'Soyapango Centro', sector: 'Soyapango',
    descripcion: 'Insuficiente presión de agua en los hogares de la colonia desde el mediodía.',
    estado: 'en proceso', prioridad: 'media', fecha: '2026-05-18 08:10', reportadoPor: 'Juan Martínez',
  },
  {
    id: 3, tipo: 'Corte de servicio', zona: 'Mejicanos Norte', sector: 'Mejicanos',
    descripcion: 'Sin servicio de agua desde hace 6 horas en toda la cuadra norte.',
    estado: 'pendiente', prioridad: 'alta', fecha: '2026-05-17 22:45', reportadoPor: 'María López',
  },
  {
    id: 4, tipo: 'Agua turbia', zona: 'Ilopango Sur', sector: 'Ilopango',
    descripcion: 'El agua llega con color café desde la mañana, posible contaminación.',
    estado: 'resuelto', prioridad: 'media', fecha: '2026-05-17 14:30', reportadoPor: 'Carlos Rivas',
  },
  {
    id: 5, tipo: 'Fuga de agua', zona: 'Colonia Escalón', sector: 'San Salvador',
    descripcion: 'Tubería rota cerca del parque central, gran desperdicio de agua.',
    estado: 'resuelto', prioridad: 'alta', fecha: '2026-05-16 11:00', reportadoPor: 'Vecinos del sector',
  },
];

const prioridadStyle: Record<string, { text: string; bg: string; label: string }> = {
  alta:  { text: '#ef4444', bg: 'rgba(239,68,68,0.13)',  label: 'Alta'  },
  media: { text: '#f59e0b', bg: 'rgba(245,158,11,0.13)', label: 'Media' },
  baja:  { text: '#22c55e', bg: 'rgba(34,197,94,0.13)',  label: 'Baja'  },
};

const estadoStyle: Record<string, { text: string; bg: string; label: string }> = {
  pendiente:   { text: '#f59e0b', bg: 'rgba(245,158,11,0.13)', label: 'Pendiente'  },
  'en proceso':{ text: '#00f2ea', bg: 'rgba(0,242,234,0.13)',  label: 'En proceso' },
  resuelto:    { text: '#22c55e', bg: 'rgba(34,197,94,0.13)',  label: 'Resuelto'   },
};

const tipoIcon: Record<string, React.ElementType> = {
  'Fuga de agua':      Droplets,
  'Presión baja':      Zap,
  'Corte de servicio': AlertTriangle,
  'Agua turbia':       Droplets,
};

export default function Reportes() {
  const [filtro, setFiltro] = useState('todos');

  const reportesFiltrados = filtro === 'todos'
    ? reportesData
    : reportesData.filter(r => r.estado === filtro);

  const pendientes  = reportesData.filter(r => r.estado === 'pendiente').length;
  const enProceso   = reportesData.filter(r => r.estado === 'en proceso').length;
  const resueltos   = reportesData.filter(r => r.estado === 'resuelto').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">

      <div>
        <h2 className="text-3xl font-black tracking-tighter text-white mb-2">
          Reportes <span className="text-aqua-cyan">Ciudadanos</span>
        </h2>
        <p className="text-gray-500 text-sm">Incidencias reportadas por la comunidad del Gran San Salvador</p>
      </div>

      {/* MÉTRICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="text-amber-500" size={20} />
            <span className="text-amber-500 font-black text-sm uppercase tracking-widest">Pendientes</span>
          </div>
          <div className="text-3xl font-black text-white">{pendientes}</div>
          <p className="text-[11px] text-gray-400 mt-1">Requieren atención</p>
        </div>
        <div className="bg-aqua-cyan/10 border border-aqua-cyan/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="text-aqua-cyan" size={20} />
            <span className="text-aqua-cyan font-black text-sm uppercase tracking-widest">En proceso</span>
          </div>
          <div className="text-3xl font-black text-white">{enProceso}</div>
          <p className="text-[11px] text-gray-400 mt-1">Siendo atendidos</p>
        </div>
        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="text-green-500" size={20} />
            <span className="text-green-500 font-black text-sm uppercase tracking-widest">Resueltos</span>
          </div>
          <div className="text-3xl font-black text-white">{resueltos}</div>
          <p className="text-[11px] text-gray-400 mt-1">Cerrados</p>
        </div>
      </div>

      {/* FILTROS */}
      <div className="flex gap-3 flex-wrap">
        {[
          { key: 'todos',       label: `Todos (${reportesData.length})` },
          { key: 'pendiente',   label: `Pendientes (${pendientes})`     },
          { key: 'en proceso',  label: `En proceso (${enProceso})`      },
          { key: 'resuelto',    label: `Resueltos (${resueltos})`       },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFiltro(key)}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
              filtro === key
                ? 'bg-aqua-cyan text-aqua-dark'
                : 'bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* LISTA DE REPORTES */}
      <div className="space-y-3">
        {reportesFiltrados.map((reporte) => {
          const TipoIcon = tipoIcon[reporte.tipo] ?? FileText;
          const estado    = estadoStyle[reporte.estado];
          const prioridad = prioridadStyle[reporte.prioridad];
          return (
            <div key={reporte.id} className="bg-aqua-card border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-aqua-cyan/10 flex items-center justify-center text-aqua-cyan flex-shrink-0">
                  <TipoIcon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-black text-white">{reporte.tipo}</h3>
                    <span
                      className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md"
                      style={{ color: prioridad.text, backgroundColor: prioridad.bg }}
                    >
                      Prioridad {prioridad.label}
                    </span>
                    <span
                      className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md"
                      style={{ color: estado.text, backgroundColor: estado.bg }}
                    >
                      {estado.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">{reporte.descripcion}</p>
                  <div className="flex flex-wrap gap-4 text-[10px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin size={10} />{reporte.zona}, {reporte.sector}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={10} />{reporte.fecha}
                    </span>
                    <span>Reportado por: <strong className="text-gray-400">{reporte.reportadoPor}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}

import React, { useState } from 'react';
import { Droplets, Zap, Wifi, AlertTriangle, CheckCircle } from 'lucide-react';

// Datos de sensores IoT
const sensoresData = [
  { id: 1, nombre: 'Sensor T-001', zona: 'Colonia Escalón', tipo: 'Presión', valor: 48.2, unidad: 'PSI', estado: 'activo', bateria: 95, ultima_lectura: '2 min' },
  { id: 2, nombre: 'Sensor F-001', zona: 'Colonia Escalón', tipo: 'Flujo', valor: 15.2, unidad: 'L/min', estado: 'activo', bateria: 88, ultima_lectura: '1 min' },
  { id: 3, nombre: 'Sensor T-002', zona: 'Soyapango Centro', tipo: 'Presión', valor: 42.5, unidad: 'PSI', estado: 'activo', bateria: 72, ultima_lectura: '3 min' },
  { id: 4, nombre: 'Sensor F-002', zona: 'Soyapango Centro', tipo: 'Flujo', valor: 12.8, unidad: 'L/min', estado: 'inactivo', bateria: 15, ultima_lectura: '45 min' },
  { id: 5, nombre: 'Sensor T-003', zona: 'Mejicanos Norte', tipo: 'Presión', valor: 18.4, unidad: 'PSI', estado: 'activo', bateria: 60, ultima_lectura: '5 min' },
  { id: 6, nombre: 'Sensor T-004', zona: 'Ilopango Sur', tipo: 'Presión', valor: 35.0, unidad: 'PSI', estado: 'activo', bateria: 82, ultima_lectura: '2 min' },
];

const SensorCard = ({ sensor }: any) => (
  <div className={`bg-aqua-card border rounded-2xl p-4 transition-all ${
    sensor.estado === 'activo' 
      ? 'border-white/10 hover:border-aqua-cyan/30' 
      : 'border-red-500/30 opacity-75'
  }`}>
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <h3 className="font-black text-white text-sm">{sensor.nombre}</h3>
        <p className="text-[10px] text-gray-500 font-medium">{sensor.zona}</p>
      </div>
      <div>
        {sensor.estado === 'activo' ? (
          <CheckCircle className="text-green-500" size={18} />
        ) : (
          <AlertTriangle className="text-red-500" size={18} />
        )}
      </div>
    </div>
    <div className="space-y-3">
      <div className="bg-white/5 rounded-xl p-3">
        <p className="text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-widest">Tipo / Valor</p>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-300">{sensor.tipo}</span>
          <span className="font-mono text-lg font-black text-aqua-cyan">{sensor.valor}<span className="text-[10px] text-gray-600 ml-1">{sensor.unidad}</span></span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] text-gray-500 font-bold mb-1">Batería</p>
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <span className={`text-sm font-black ${
              sensor.bateria > 50 ? 'text-green-400' : sensor.bateria > 25 ? 'text-amber-400' : 'text-red-400'
            }`}>{sensor.bateria}%</span>
          </div>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 font-bold mb-1">Última lectura</p>
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <span className="text-[11px] font-bold text-gray-300">{sensor.ultima_lectura}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default function Sensores() {
  const [filtro, setFiltro] = useState('todos');

  const sensoresFiltrados = filtro === 'activos' 
    ? sensoresData.filter(s => s.estado === 'activo')
    : filtro === 'inactivos'
    ? sensoresData.filter(s => s.estado === 'inactivo')
    : sensoresData;

  const sensoresActivos = sensoresData.filter(s => s.estado === 'activo').length;
  const sensoresInactivos = sensoresData.filter(s => s.estado === 'inactivo').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* ENCABEZADO */}
      <div>
        <h2 className="text-3xl font-black tracking-tighter text-white mb-2">🔌 Sensores <span className="text-aqua-cyan">IoT</span></h2>
        <p className="text-gray-500 text-sm">Monitoreo en tiempo real de dispositivos de medición</p>
      </div>

      {/* MÉTRICAS RÁPIDAS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="text-green-500" size={20} />
            <span className="text-green-500 font-black text-sm uppercase tracking-widest">Activos</span>
          </div>
          <div className="text-3xl font-black text-white">{sensoresActivos}</div>
          <p className="text-[11px] text-gray-400 mt-1">Dispositivos funcionando</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="text-red-500" size={20} />
            <span className="text-red-500 font-black text-sm uppercase tracking-widest">Inactivos</span>
          </div>
          <div className="text-3xl font-black text-white">{sensoresInactivos}</div>
          <p className="text-[11px] text-gray-400 mt-1">Requieren atención</p>
        </div>
        <div className="bg-aqua-cyan/10 border border-aqua-cyan/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Wifi className="text-aqua-cyan" size={20} />
            <span className="text-aqua-cyan font-black text-sm uppercase tracking-widest">Total</span>
          </div>
          <div className="text-3xl font-black text-white">{sensoresData.length}</div>
          <p className="text-[11px] text-gray-400 mt-1">Sensores en red</p>
        </div>
      </div>

      {/* FILTROS */}
      <div className="flex gap-3">
        <button
          onClick={() => setFiltro('todos')}
          className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
            filtro === 'todos' 
              ? 'bg-aqua-cyan text-aqua-dark' 
              : 'bg-white/5 text-gray-300 hover:bg-white/10'
          }`}
        >
          Todos ({sensoresData.length})
        </button>
        <button
          onClick={() => setFiltro('activos')}
          className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
            filtro === 'activos' 
              ? 'bg-green-500 text-white' 
              : 'bg-white/5 text-gray-300 hover:bg-white/10'
          }`}
        >
          Activos ({sensoresActivos})
        </button>
        <button
          onClick={() => setFiltro('inactivos')}
          className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
            filtro === 'inactivos' 
              ? 'bg-red-500 text-white' 
              : 'bg-white/5 text-gray-300 hover:bg-white/10'
          }`}
        >
          Inactivos ({sensoresInactivos})
        </button>
      </div>

      {/* GRID DE SENSORES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sensoresFiltrados.map((sensor) => (
          <SensorCard key={sensor.id} sensor={sensor} />
        ))}
      </div>
    </div>
  );
}
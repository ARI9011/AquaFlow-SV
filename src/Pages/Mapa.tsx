import React from 'react';
import { MapPin, AlertCircle, Eye } from 'lucide-react';

// Datos de zonas para el mapa
const zonasData = [
  { id: 1, nombre: 'Colonia Escalón', sector: 'San Salvador', lat: 13.6938, lng: -89.2073, presion: 48.2, flujo: 15.2, estado: 'Óptimo', color: 'bg-green-500' },
  { id: 2, nombre: 'Soyapango Centro', sector: 'Soyapango', lat: 13.7389, lng: -89.1778, presion: 42.5, flujo: 12.8, estado: 'Estable', color: 'bg-aqua-cyan' },
  { id: 3, nombre: 'Mejicanos Norte', sector: 'Mejicanos', lat: 13.7544, lng: -89.1986, presion: 18.4, flujo: 5.1, estado: 'Crítico', color: 'bg-red-500' },
  { id: 4, nombre: 'Ilopango Sur', sector: 'Ilopango', lat: 13.6889, lng: -89.1325, presion: 35.0, flujo: 10.0, estado: 'Alerta', color: 'bg-amber-500' },
];

const ZonaCard = ({ zona }: any) => (
  <div className="bg-aqua-card border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-all cursor-pointer group">
    <div className="flex items-start justify-between mb-3">
      <div>
        <h3 className="font-bold text-white text-sm">{zona.nombre}</h3>
        <p className="text-[10px] text-gray-500 font-medium">{zona.sector}</p>
      </div>
      <div className={`w-8 h-8 ${zona.color} rounded-full flex items-center justify-center text-white text-sm font-black`}>
        
      </div>
    </div>
    <div className="space-y-2">
      <div className="flex justify-between text-[11px]">
        <span className="text-gray-500">Presión:</span>
        <span className="font-mono font-bold text-aqua-cyan">{zona.presion} PSI</span>
      </div>
      <div className="flex justify-between text-[11px]">
        <span className="text-gray-500">Flujo:</span>
        <span className="font-mono font-bold text-gray-300">{zona.flujo} L/m</span>
      </div>
      <div className="flex justify-between text-[11px] pt-2 border-t border-white/5">
        <span className="text-gray-500">Estado:</span>
        <span className={`font-bold ${zona.color === 'bg-green-500' ? 'text-green-400' : zona.color === 'bg-aqua-cyan' ? 'text-aqua-cyan' : zona.color === 'bg-red-500' ? 'text-red-400' : 'text-amber-400'}`}>
          {zona.estado}
        </span>
      </div>
    </div>
  </div>
);

export default function Mapa() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* ENCABEZADO */}
      <div>
        <h2 className="text-3xl font-black tracking-tighter text-white mb-2"> Mapa de <span className="text-aqua-cyan">Zonas</span></h2>
        <p className="text-gray-500 text-sm">Ubicación y estado de todas las zonas de monitoreo</p>
      </div>

      {/* BANNER INFORMATIVO */}
      <div className="bg-aqua-cyan/10 border border-aqua-cyan/30 rounded-2xl p-6 flex items-start gap-4">
        <MapPin className="text-aqua-cyan flex-shrink-0 mt-1" size={20} />
        <div>
          <h3 className="font-black text-aqua-cyan mb-1"> Zonas Activas</h3>
          <p className="text-sm text-gray-300">Estamos monitoreando <strong>4 zonas</strong> del Gran San Salvador en tiempo real.</p>
        </div>
      </div>

      {/* GRID DE ZONAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {zonasData.map((zona) => (
          <ZonaCard key={zona.id} zona={zona} />
        ))}
      </div>

      {/* TABLA DETALLADA */}
      <div className="bg-aqua-card rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5 bg-white/[0.01]">
          <h3 className="font-bold text-xl"> Detalles de Ubicaciones</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/[0.02] text-gray-500 text-[10px] uppercase font-black tracking-[0.15em]">
              <tr>
                <th className="px-8 py-5">Zona</th>
                <th className="px-8 py-5">Coordenadas</th>
                <th className="px-8 py-5 text-center">Presión</th>
                <th className="px-8 py-5 text-center">Flujo</th>
                <th className="px-8 py-5 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {zonasData.map((zona) => (
                <tr key={zona.id} className="hover:bg-white/[0.02]">
                  <td className="px-8 py-6 font-bold text-white">{zona.nombre}</td>
                  <td className="px-8 py-6 font-mono text-[11px] text-gray-400">{zona.lat.toFixed(4)}, {zona.lng.toFixed(4)}</td>
                  <td className="px-8 py-6 text-center font-bold text-aqua-cyan">{zona.presion} PSI</td>
                  <td className="px-8 py-6 text-center font-bold text-gray-300">{zona.flujo} L/m</td>
                  <td className="px-8 py-6 text-center">
                    <span className={`inline-block px-3 py-1 ${zona.color}/10 ${zona.color} text-[10px] font-black rounded-lg uppercase`}>
                      {zona.estado}
                    </span>
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
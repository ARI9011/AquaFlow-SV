import React, { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const zonasData = [
  { id: 1, nombre: 'Colonia Escalón',  sector: 'San Salvador', lat: 13.6938, lng: -89.2073, presion: 48.2, flujo: 15.2, estado: 'Óptimo',  color: '#22c55e' },
  { id: 2, nombre: 'Soyapango Centro', sector: 'Soyapango',    lat: 13.7389, lng: -89.1778, presion: 42.5, flujo: 12.8, estado: 'Estable',  color: '#00f2ea' },
  { id: 3, nombre: 'Mejicanos Norte',  sector: 'Mejicanos',    lat: 13.7544, lng: -89.1986, presion: 18.4, flujo: 5.1,  estado: 'Crítico',  color: '#ef4444' },
  { id: 4, nombre: 'Ilopango Sur',     sector: 'Ilopango',     lat: 13.6889, lng: -89.1325, presion: 35.0, flujo: 10.0, estado: 'Alerta',   color: '#f59e0b' },
];

const estadoStyle: Record<string, { text: string; bg: string; tw: string }> = {
  'Óptimo':  { text: '#22c55e', bg: 'rgba(34,197,94,0.13)',   tw: 'text-green-400' },
  'Estable': { text: '#00f2ea', bg: 'rgba(0,242,234,0.13)',   tw: 'text-cyan-400'  },
  'Crítico': { text: '#ef4444', bg: 'rgba(239,68,68,0.13)',   tw: 'text-red-400'   },
  'Alerta':  { text: '#f59e0b', bg: 'rgba(245,158,11,0.13)',  tw: 'text-amber-400' },
};

function BoundsFitter() {
  const map = useMap();
  useEffect(() => {
    map.setMaxBounds([[13.62, -89.30], [13.82, -89.08]]);
    map.setMinZoom(12);
  }, [map]);
  return null;
}

const ZonaCard = ({ zona }: { zona: typeof zonasData[0] }) => (
  <div className="bg-aqua-card border border-white/10 rounded-2xl p-4 hover:border-aqua-cyan/30 transition-all cursor-pointer group">
    <div className="flex items-start justify-between mb-3">
      <div>
        <h3 className="font-bold text-white text-sm group-hover:text-aqua-cyan transition-colors">{zona.nombre}</h3>
        <p className="text-[10px] text-gray-500 font-medium">{zona.sector}</p>
      </div>
      <div className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: zona.color }} />
    </div>
    <div className="space-y-2">
      <div className="flex justify-between text-[11px]">
        <span className="text-gray-500">Presión</span>
        <span className="font-mono font-bold text-aqua-cyan">{zona.presion} PSI</span>
      </div>
      <div className="flex justify-between text-[11px]">
        <span className="text-gray-500">Flujo</span>
        <span className="font-mono font-bold text-gray-300">{zona.flujo} L/m</span>
      </div>
      <div className="flex justify-between items-center text-[11px] pt-2 border-t border-white/5">
        <span className="text-gray-500">Estado</span>
        <span
          className="font-black text-[10px] uppercase px-2 py-0.5 rounded-md"
          style={{ color: estadoStyle[zona.estado].text, backgroundColor: estadoStyle[zona.estado].bg }}
        >
          {zona.estado}
        </span>
      </div>
    </div>
  </div>
);

export default function Mapa() {
  const [mapMounted, setMapMounted] = useState(false);

  // Difiere el mount del mapa al siguiente frame para que el resto de la página
  // (header, banner, cards, tabla) renderice primero sin bloquearse.
  useEffect(() => {
    const id = requestAnimationFrame(() => setMapMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">

      {/* ENCABEZADO */}
      <div>
        <h2 className="text-3xl font-black tracking-tighter text-white mb-2">
          Mapa de <span className="text-aqua-cyan">Zonas</span>
        </h2>
        <p className="text-gray-500 text-sm">Ubicación y estado de todas las zonas de monitoreo — Gran San Salvador</p>
      </div>

      {/* BANNER INFORMATIVO */}
      <div className="bg-aqua-cyan/10 border border-aqua-cyan/30 rounded-2xl p-6 flex items-start gap-4">
        <MapPin className="text-aqua-cyan flex-shrink-0 mt-1" size={20} />
        <div>
          <h3 className="font-black text-aqua-cyan mb-1">Zonas Activas</h3>
          <p className="text-sm text-gray-300">
            Monitoreando <strong>4 zonas</strong> del Gran San Salvador en tiempo real.
          </p>
        </div>
      </div>

      {/* MAPA INTERACTIVO */}
      <div className="bg-aqua-card border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5">
          <h3 className="font-bold text-lg text-white">Mapa Interactivo — San Salvador</h3>
          <p className="text-[11px] text-gray-500 mt-1">Haz clic en los marcadores para ver detalles de cada zona</p>
        </div>
        <div style={{ height: '480px' }}>
          {!mapMounted ? (
            <div className="h-full flex items-center justify-center bg-aqua-dark">
              <div className="flex flex-col items-center gap-3 text-gray-500">
                <div className="w-7 h-7 border-2 border-aqua-cyan/30 border-t-aqua-cyan rounded-full animate-spin" />
                <span className="text-xs font-medium">Cargando mapa...</span>
              </div>
            </div>
          ) : (
          <MapContainer
            center={[13.7242, -89.1950]}
            zoom={13}
            preferCanvas={true}
            style={{ height: '100%', width: '100%', background: '#060b0d' }}
            scrollWheelZoom={true}
          >
            <BoundsFitter />
            {/* Tiles oscuros CartoDB Dark Matter */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              keepBuffer={4}
              updateWhenIdle={false}
              updateWhenZooming={false}
            />
            {zonasData.map((zona) => (
              <React.Fragment key={zona.id}>
                {/* Halo de glow alrededor del marcador */}
                <CircleMarker
                  center={[zona.lat, zona.lng]}
                  radius={24}
                  interactive={false}
                  pathOptions={{ color: zona.color, fillColor: zona.color, fillOpacity: 0.1, weight: 0 }}
                />
                {/* Marcador principal */}
                <CircleMarker
                  center={[zona.lat, zona.lng]}
                  radius={12}
                  pathOptions={{ color: zona.color, fillColor: zona.color, fillOpacity: 0.9, weight: 2, opacity: 1 }}
                >
                  <Popup>
                    <div style={{ minWidth: '185px', fontFamily: 'Inter, sans-serif' }}>
                      {/* Header popup */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: zona.color, flexShrink: 0 }} />
                        <div>
                          <p style={{ fontWeight: 900, fontSize: '13px', color: 'white', margin: 0, lineHeight: 1.2 }}>{zona.nombre}</p>
                          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', margin: 0, marginTop: '2px' }}>{zona.sector}</p>
                        </div>
                      </div>
                      {/* Datos */}
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                          <span style={{ color: 'rgba(255,255,255,0.38)' }}>Presión</span>
                          <span style={{ fontWeight: 700, color: '#00f2ea', fontFamily: 'monospace' }}>{zona.presion} PSI</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                          <span style={{ color: 'rgba(255,255,255,0.38)' }}>Flujo</span>
                          <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.75)', fontFamily: 'monospace' }}>{zona.flujo} L/m</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                          <span style={{ color: 'rgba(255,255,255,0.38)' }}>Estado</span>
                          <span style={{
                            fontWeight: 900, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em',
                            color: zona.color, background: estadoStyle[zona.estado].bg,
                            padding: '2px 8px', borderRadius: '6px',
                          }}>
                            {zona.estado}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              </React.Fragment>
            ))}
          </MapContainer>
          )}
        </div>
      </div>

      {/* CARDS DE ZONAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {zonasData.map((zona) => (
          <ZonaCard key={zona.id} zona={zona} />
        ))}
      </div>

      {/* TABLA DETALLADA */}
      <div className="bg-aqua-card rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5 bg-white/[0.01]">
          <h3 className="font-bold text-xl">Detalles de Ubicaciones</h3>
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
                <tr key={zona.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: zona.color }} />
                      <span className="font-bold text-white">{zona.nombre}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 font-mono text-[11px] text-gray-400">
                    {zona.lat.toFixed(4)}, {zona.lng.toFixed(4)}
                  </td>
                  <td className="px-8 py-6 text-center font-bold text-aqua-cyan">{zona.presion} PSI</td>
                  <td className="px-8 py-6 text-center font-bold text-gray-300">{zona.flujo} L/m</td>
                  <td className="px-8 py-6 text-center">
                    <span
                      className="font-black text-[10px] uppercase px-3 py-1 rounded-lg"
                      style={{ color: estadoStyle[zona.estado].text, backgroundColor: estadoStyle[zona.estado].bg }}
                    >
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

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { Globe, AlertTriangle, CheckCircle, Activity, MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const zonasData = [
  { id: 1, nombre: 'Colonia Escalón',  sector: 'cuscatansingo', lat: 13.788145, lng: -89.187340, presion: 48.2, flujo: 15.2, estado: 'Óptimo',  color: '#22c55e' },
  { id: 2, nombre: 'Soyapango Centro', sector: 'Soyapango',    lat: 13.712607, lng: -89.136888, presion: 42.5, flujo: 12.8, estado: 'Estable',  color: '#00f2ea' },
  { id: 3, nombre: 'Mejicanos Norte',  sector: 'Plan del pino',    lat: 13.718460, lng: -89.151406, presion: 18.4, flujo: 5.1,  estado: 'Crítico',  color: '#ef4444' },
  { id: 4, nombre: 'Ilopango Sur',     sector: 'Ciudad Delgado',     lat: 13.714030, lng: -89.172931, presion: 35.0, flujo: 10.0, estado: 'Alerta',   color: '#f59e0b' },
];

const estadoStyle: Record<string, { text: string; bg: string; tw: string; cardTop: string }> = {
  'Óptimo':  { text: '#22c55e', bg: 'rgba(34,197,94,0.13)',  tw: 'text-green-400', cardTop: 'card-top-green' },
  'Estable': { text: '#00f2ea', bg: 'rgba(0,242,234,0.13)',  tw: 'text-cyan-400',  cardTop: 'card-top-cyan'  },
  'Crítico': { text: '#ef4444', bg: 'rgba(239,68,68,0.13)',  tw: 'text-red-400',   cardTop: 'card-top-red'   },
  'Alerta':  { text: '#f59e0b', bg: 'rgba(245,158,11,0.13)', tw: 'text-amber-400', cardTop: 'card-top-amber' },
};

const LEYENDA = [
  { estado: 'Óptimo',  color: '#22c55e', rango: '50–60 PSI' },
  { estado: 'Estable', color: '#00f2ea', rango: '35–50 PSI' },
  { estado: 'Alerta',  color: '#f59e0b', rango: '25–35 PSI' },
  { estado: 'Crítico', color: '#ef4444', rango: '< 25 PSI'  },
];

function BoundsFitter() {
  const map = useMap();
  useEffect(() => {
    map.setMaxBounds([[13.62, -89.30], [13.82, -89.08]]);
    map.setMinZoom(12);
  }, [map]);
  return null;
}

const ZonaCard = ({ zona }: { zona: typeof zonasData[0] }) => {
  const st = estadoStyle[zona.estado];
  return (
    <div className={`portal-card ${st.cardTop} overflow-hidden hover:scale-[1.015] transition-all duration-200 cursor-pointer group`}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0">
            <h3 className="font-bold text-ink text-sm group-hover:text-aqua-cyan transition-colors truncate">{zona.nombre}</h3>
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
          <div className="flex justify-between items-center text-[11px] pt-2 border-t border-ink/5">
            <span className="text-gray-500">Estado</span>
            <span className="font-black text-[10px] uppercase px-2 py-0.5 rounded-md"
              style={{ color: st.text, backgroundColor: st.bg }}>
              {zona.estado}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Mapa() {
  const [mapMounted, setMapMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMapMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const operativas   = zonasData.filter(z => z.estado === 'Óptimo' || z.estado === 'Estable').length;
  const incidencias  = zonasData.filter(z => z.estado === 'Crítico' || z.estado === 'Alerta').length;

  const KPIS = [
    { label: 'Total zonas',    value: zonasData.length, sub: 'Monitoreadas',      color: 'text-aqua-cyan', bg: 'bg-aqua-cyan/10', top: 'card-top-cyan',  icon: Globe        },
    { label: 'Operativas',     value: operativas,        sub: 'Óptimo / Estable', color: 'text-green-400', bg: 'bg-green-500/10', top: 'card-top-green', icon: CheckCircle  },
    { label: 'Con incidencia', value: incidencias,       sub: 'Alerta / Crítico', color: 'text-red-400',   bg: 'bg-red-500/10',   top: 'card-top-red',   icon: AlertTriangle },
  ];

  return (
    <div className="space-y-5 page-enter portal-grid-bg min-h-full pb-2">

      {/* ENCABEZADO */}
      <div>
        <p className="text-[10px] text-aqua-cyan/60 uppercase tracking-[0.25em] font-bold mb-1">Gran San Salvador</p>
        <h2 className="text-3xl font-black tracking-tighter gradient-text">Mapa de Zonas</h2>
        <p className="text-sm text-gray-500 mt-1">Ubicación y estado de todas las zonas de monitoreo</p>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {KPIS.map(k => (
          <div key={k.label} className={`portal-card ${k.top} p-5 flex items-center gap-4`}>
            <div className={`w-10 h-10 rounded-xl ${k.bg} flex items-center justify-center flex-shrink-0`}>
              <k.icon size={18} className={k.color} />
            </div>
            <div>
              <p className="text-2xl font-black text-ink">{k.value}</p>
              <p className="text-[11px] font-bold text-gray-500">{k.label}</p>
              <p className={`text-[10px] font-bold mt-0.5 ${k.color}`}>{k.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* MAPA INTERACTIVO */}
      <div className="portal-card overflow-hidden">
        <div className="p-5 border-b border-ink/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-aqua-cyan/10 flex items-center justify-center">
            <Activity size={16} className="text-aqua-cyan" />
          </div>
          <div>
            <h3 className="font-bold text-base text-ink">Mapa Interactivo — San Salvador</h3>
            <p className="text-[10px] text-gray-500 mt-0.5">Haz clic en los marcadores para ver detalles de cada zona</p>
          </div>
        </div>
        <div style={{ height: '460px' }}>
          {!mapMounted ? (
            <div className="h-full flex items-center justify-center bg-[var(--color-aqua-dark)]">
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
              style={{ height: '100%', width: '100%', background: 'var(--color-aqua-dark)' }}
              scrollWheelZoom={true}
            >
              <BoundsFitter />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                keepBuffer={4}
                updateWhenIdle={false}
                updateWhenZooming={false}
              />
              {zonasData.map((zona) => (
                <React.Fragment key={zona.id}>
                  <CircleMarker
                    center={[zona.lat, zona.lng]}
                    radius={24}
                    interactive={false}
                    pathOptions={{ color: zona.color, fillColor: zona.color, fillOpacity: 0.1, weight: 0 }}
                  />
                  <CircleMarker
                    center={[zona.lat, zona.lng]}
                    radius={12}
                    pathOptions={{ color: zona.color, fillColor: zona.color, fillOpacity: 0.9, weight: 2, opacity: 1 }}
                  >
                    <Popup>
                      <div style={{ minWidth: '185px', fontFamily: 'Inter, sans-serif' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: zona.color, flexShrink: 0 }} />
                          <div>
                            <p style={{ fontWeight: 900, fontSize: '13px', color: 'white', margin: 0, lineHeight: 1.2 }}>{zona.nombre}</p>
                            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', margin: 0, marginTop: '2px' }}>{zona.sector}</p>
                          </div>
                        </div>
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                            <span style={{ color: 'rgba(255,255,255,0.38)' }}>Presión</span>
                            <span style={{ fontWeight: 700, color: 'var(--color-aqua-cyan)', fontFamily: 'monospace' }}>{zona.presion} PSI</span>
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

      {/* ZONA CARDS */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <MapPin size={15} className="text-aqua-cyan" />
          <h3 className="font-bold text-ink text-base">Zonas Monitoreadas</h3>
          <span className="text-[10px] text-gray-600 font-bold ml-1">{zonasData.length} zonas</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {zonasData.map((zona) => <ZonaCard key={zona.id} zona={zona} />)}
        </div>
      </div>

      {/* TABLA DETALLADA */}
      <div className="portal-card overflow-hidden">
        <div className="p-5 border-b border-ink/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-aqua-cyan/10 flex items-center justify-center">
            <Globe size={16} className="text-aqua-cyan" />
          </div>
          <div>
            <h3 className="font-bold text-base text-ink">Detalles de Ubicaciones</h3>
            <p className="text-[10px] text-gray-500 mt-0.5">Coordenadas y métricas por zona</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-ink/[0.02] text-gray-500 text-[10px] uppercase font-black tracking-[0.15em]">
              <tr>
                <th className="px-6 py-4">Zona</th>
                <th className="px-6 py-4">Coordenadas</th>
                <th className="px-6 py-4 text-center">Presión</th>
                <th className="px-6 py-4 text-center">Flujo</th>
                <th className="px-6 py-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/[0.03]">
              {zonasData.map((zona) => (
                <tr key={zona.id} className="hover:bg-ink/[0.02] transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: zona.color }} />
                      <div>
                        <span className="font-bold text-ink text-sm">{zona.nombre}</span>
                        <p className="text-[10px] text-gray-500">{zona.sector}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 font-mono text-[11px] text-gray-400">
                    {zona.lat.toFixed(4)}, {zona.lng.toFixed(4)}
                  </td>
                  <td className="px-6 py-5 text-center font-bold text-aqua-cyan">{zona.presion} PSI</td>
                  <td className="px-6 py-5 text-center font-bold text-gray-300">{zona.flujo} L/m</td>
                  <td className="px-6 py-5 text-center">
                    <span className="font-black text-[10px] uppercase px-3 py-1 rounded-lg"
                      style={{ color: estadoStyle[zona.estado].text, backgroundColor: estadoStyle[zona.estado].bg }}>
                      {zona.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* LEYENDA */}
      <div className="portal-card p-4">
        <p className="text-[9px] uppercase font-black text-gray-600 tracking-[0.22em] mb-3 px-1">Leyenda de estados</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {LEYENDA.map(item => (
            <div key={item.estado} className="flex items-center gap-2.5 bg-ink/[0.02] rounded-xl px-3 py-2.5">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <div>
                <p className="text-xs font-black text-ink">{item.estado}</p>
                <p className="text-[10px] text-gray-600 font-mono">{item.rango}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

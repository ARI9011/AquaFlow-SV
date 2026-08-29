import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { Globe, AlertTriangle, CheckCircle, Activity, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import { ZONAS_VERDADERAS, ESTADO_STYLES, type ZonaMonitoreada } from '../data/zonas';

const LEYENDA = [
  { estado: 'Óptimo',  color: '#22c55e', rango: '50–60 PSI' },
  { estado: 'Estable', color: '#00f2ea', rango: '35–50 PSI' },
  { estado: 'Alerta',  color: '#f59e0b', rango: '25–35 PSI' },
  { estado: 'Crítico', color: '#ef4444', rango: '< 25 PSI'  },
];

// El basemap de Esri solo tiene teselas reales hasta el zoom 16 (a partir de ahí
// devuelve una tesela de aviso "Map data not yet available" en vez de mapa real).
const ZOOM_MAX_TESELAS = 16;

function BoundsFitter() {
  const map = useMap();
  useEffect(() => {
    map.setMaxBounds([[13.55, -89.40], [13.90, -88.95]]);
    map.setMinZoom(11);
    map.setMaxZoom(ZOOM_MAX_TESELAS);
  }, [map]);
  return null;
}

const ZonaCard = ({ zona, onClick }: { zona: ZonaMonitoreada; onClick?: () => void }) => {
  const st = ESTADO_STYLES[zona.estado] || ESTADO_STYLES['Estable'];
  return (
    <div 
      onClick={onClick}
      className={`portal-card ${st.cardTop} overflow-hidden hover:scale-[1.015] transition-all duration-200 cursor-pointer group`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0">
            <h3 className="font-bold text-ink text-sm group-hover:text-aqua-cyan transition-colors truncate">{zona.nombre}</h3>
            <p className="text-[10px] text-gray-500 font-medium capitalize">{zona.sector}</p>
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
            <span className="font-mono font-bold text-ink/80">{zona.flujo} L/m</span>
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
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'operativas' | 'incidencias'>('todos');
  const navigate = useNavigate();

  useEffect(() => {
    const id = requestAnimationFrame(() => setMapMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const operativasCount  = ZONAS_VERDADERAS.filter(z => z.estado === 'Óptimo' || z.estado === 'Estable').length;
  const incidenciasCount = ZONAS_VERDADERAS.filter(z => z.estado === 'Crítico' || z.estado === 'Alerta').length;

  const zonasFiltradas = ZONAS_VERDADERAS.filter(z => {
    if (filtroEstado === 'operativas') return z.estado === 'Óptimo' || z.estado === 'Estable';
    if (filtroEstado === 'incidencias') return z.estado === 'Crítico' || z.estado === 'Alerta';
    return true;
  });

  const KPIS = [
    { id: 'todos', label: 'Total zonas', value: ZONAS_VERDADERAS.length, sub: 'Monitoreadas', color: 'text-aqua-cyan', bg: 'bg-aqua-cyan/10', top: 'card-top-cyan', icon: Globe, action: () => setFiltroEstado('todos') },
    { id: 'operativas', label: 'Operativas', value: operativasCount, sub: 'Óptimo / Estable', color: 'text-green-400', bg: 'bg-green-500/10', top: 'card-top-green', icon: CheckCircle, action: () => setFiltroEstado('operativas') },
    { id: 'incidencias', label: 'Con incidencia', value: incidenciasCount, sub: 'Alerta / Crítico', color: 'text-red-400', bg: 'bg-red-500/10', top: 'card-top-red', icon: AlertTriangle, action: () => setFiltroEstado('incidencias') },
  ];

  return (
    <div className="space-y-5 page-enter portal-grid-bg min-h-full pb-2">

      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-[10px] text-aqua-cyan/60 uppercase tracking-[0.25em] font-bold mb-1">Gran San Salvador</p>
          <h2 className="text-3xl font-black tracking-tighter gradient-text">Mapa de Zonas</h2>
          <p className="text-sm text-gray-500 mt-1">Ubicación y estado en tiempo real de todas las zonas de monitoreo</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/sensores')}
            className="px-3.5 py-2 rounded-xl bg-aqua-cyan/10 border border-aqua-cyan/20 hover:bg-aqua-cyan/20 text-aqua-cyan text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Activity size={14} /> Ver Sensores IoT
          </button>
        </div>
      </div>

      {/* KPI CARDS (INTERACTIVOS) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {KPIS.map(k => (
          <div 
            key={k.id} 
            onClick={k.action}
            className={`portal-card ${k.top} p-5 flex items-center gap-4 cursor-pointer hover:scale-[1.015] transition-all duration-200 ${
              filtroEstado === k.id ? 'ring-1 ring-aqua-cyan/50 shadow-lg' : ''
            }`}
          >
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
        <div className="p-5 border-b border-ink/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-aqua-cyan/10 flex items-center justify-center">
              <Activity size={16} className="text-aqua-cyan" />
            </div>
            <div>
              <h3 className="font-bold text-base text-ink">Mapa Interactivo — San Salvador</h3>
              <p className="text-[10px] text-gray-500 mt-0.5">Haz clic en los marcadores para ver detalles de cada zona</p>
            </div>
          </div>
          {filtroEstado !== 'todos' && (
            <button 
              onClick={() => setFiltroEstado('todos')}
              className="text-xs font-bold text-aqua-cyan hover:underline"
            >
              Mostrar todas
            </button>
          )}
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
              center={[13.7350, -89.1620]}
              zoom={12}
              maxZoom={ZOOM_MAX_TESELAS}
              preferCanvas={true}
              style={{ height: '100%', width: '100%', background: 'var(--color-aqua-dark)' }}
              scrollWheelZoom={true}
            >
              <BoundsFitter />
              <TileLayer
                attribution='&copy; <a href="https://www.esri.com">Esri</a> &mdash; Esri, DeLorme, NAVTEQ'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                maxZoom={ZOOM_MAX_TESELAS}
                keepBuffer={4}
                updateWhenIdle={false}
                updateWhenZooming={false}
              />
              {zonasFiltradas.map((zona) => (
                <React.Fragment key={zona.id}>
                  <CircleMarker
                    center={[zona.lat, zona.lng]}
                    radius={26}
                    interactive={false}
                    pathOptions={{ color: zona.color, fillColor: zona.color, fillOpacity: 0.12, weight: 0 }}
                  />
                  <CircleMarker
                    center={[zona.lat, zona.lng]}
                    radius={13}
                    pathOptions={{ color: zona.color, fillColor: zona.color, fillOpacity: 0.95, weight: 2, opacity: 1 }}
                  >
                    <Popup>
                      <div style={{ minWidth: '190px', fontFamily: 'Inter, sans-serif' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: zona.color, flexShrink: 0 }} />
                          <div>
                            <p style={{ fontWeight: 900, fontSize: '13px', color: 'white', margin: 0, lineHeight: 1.2 }}>{zona.nombre}</p>
                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', margin: 0, marginTop: '2px', textTransform: 'capitalize' }}>{zona.sector}</p>
                          </div>
                        </div>
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                            <span style={{ color: 'rgba(255,255,255,0.4)' }}>Presión</span>
                            <span style={{ fontWeight: 700, color: 'var(--color-aqua-cyan)', fontFamily: 'monospace' }}>{zona.presion} PSI</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                            <span style={{ color: 'rgba(255,255,255,0.4)' }}>Flujo</span>
                            <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.85)', fontFamily: 'monospace' }}>{zona.flujo} L/m</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                            <span style={{ color: 'rgba(255,255,255,0.4)' }}>Estado</span>
                            <span style={{
                              fontWeight: 900, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em',
                              color: zona.color, background: ESTADO_STYLES[zona.estado]?.bg || 'rgba(0,242,234,0.13)',
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
          <span className="text-[10px] text-gray-600 font-bold ml-1">{zonasFiltradas.length} zonas</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {zonasFiltradas.map((zona) => <ZonaCard key={zona.id} zona={zona} />)}
        </div>
      </div>

      {/* TABLA DETALLADA DE ZONAS VERDADERAS */}
      <div className="portal-card overflow-hidden">
        <div className="p-5 border-b border-ink/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-aqua-cyan/10 flex items-center justify-center">
            <Globe size={16} className="text-aqua-cyan" />
          </div>
          <div>
            <h3 className="font-bold text-base text-ink">Detalles de Ubicaciones Reales</h3>
            <p className="text-[10px] text-gray-500 mt-0.5">Coordenadas exactas y lecturas dinámicas por zona</p>
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
              {zonasFiltradas.map((zona) => (
                <tr key={zona.id} className="hover:bg-ink/[0.02] transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: zona.color }} />
                      <div>
                        <span className="font-bold text-ink text-sm">{zona.nombre}</span>
                        <p className="text-[10px] text-gray-500 capitalize">{zona.sector}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 font-mono text-[11px] text-gray-400">
                    {zona.lat.toFixed(6)}, {zona.lng.toFixed(6)}
                  </td>
                  <td className="px-6 py-5 text-center font-bold text-aqua-cyan">{zona.presion} PSI</td>
                  <td className="px-6 py-5 text-center font-bold text-ink/80">{zona.flujo} L/m</td>
                  <td className="px-6 py-5 text-center">
                    <span className="font-black text-[10px] uppercase px-3 py-1 rounded-lg"
                      style={{ color: ESTADO_STYLES[zona.estado]?.text, backgroundColor: ESTADO_STYLES[zona.estado]?.bg }}>
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


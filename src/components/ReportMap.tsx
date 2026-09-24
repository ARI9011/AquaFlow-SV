import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, CircleMarker, Tooltip, useMapEvents } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { LocateFixed, Maximize, Plus, Minus, RotateCcw, MapPin } from 'lucide-react';
import { useConfig } from '../context/ConfigContext';
import { useLang } from '../context/LanguageContext';
import { ZONAS_VERDADERAS } from '../data/zonas';
import { MAP_BOUNDS, MAP_CENTER, STATUS, inCoverage, reportPoint } from '../data/reportes';
import type { MapPoint, Report } from '../data/reportes';
import 'leaflet/dist/leaflet.css';

interface Props {
  reports: Report[]; point: MapPoint | null; selectedId: number | null; focus: MapPoint | null;
  zones: boolean; disabled: boolean; onPick: (point: MapPoint) => void;
  onSelect: (report: Report) => void; onError: (message: string) => void;
}
function MapActions({ focus, disabled, onPick, onError }: Pick<Props, 'focus' | 'disabled' | 'onPick' | 'onError'>) {
  const { t } = useLang();
  const [locating, setLocating] = useState(false);
  const map = useMapEvents({
    click: event => {
      if (disabled) return;
      if (!inCoverage(event.latlng)) { onError(t('Selecciona una ubicación dentro del Gran San Salvador.')); return; }
      onPick({ lat: Number(event.latlng.lat.toFixed(6)), lng: Number(event.latlng.lng.toFixed(6)) });
    },
    locationfound: event => {
      setLocating(false);
      if (disabled) return;
      if (!inCoverage(event.latlng)) { onError(t('Tu ubicación está fuera del área de cobertura.')); return; }
      onPick({ lat: Number(event.latlng.lat.toFixed(6)), lng: Number(event.latlng.lng.toFixed(6)) });
      map.setView(event.latlng, 16);
    },
    locationerror: () => { setLocating(false); onError(t('No pudimos obtener tu ubicación. Revisa el permiso del navegador.')); },
  });
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    observer.observe(map.getContainer());
    return () => { observer.disconnect(); map.stopLocate(); };
  }, [map]);
  useEffect(() => { if (focus) map.setView([focus.lat, focus.lng], Math.max(15, map.getZoom()), { animate: false }); }, [map, focus]);
  return <div className="report-map-tools" onClick={e => e.stopPropagation()} onDoubleClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>
    <button type="button" title={t('Acercar')} aria-label={t('Acercar')} onClick={() => map.zoomIn()}><Plus size={18} /></button>
    <button type="button" title={t('Alejar')} aria-label={t('Alejar')} onClick={() => map.zoomOut()}><Minus size={18} /></button>
    <button type="button" title={t('Ver toda la zona')} aria-label={t('Ver toda la zona')} onClick={() => map.fitBounds([[13.695, -89.215], [13.804, -89.115]])}><Maximize size={17} /></button>
    <button type="button" title={t('Reportar en el centro del mapa')} aria-label={t('Reportar en el centro del mapa')} disabled={disabled} onClick={() => { const p = map.getCenter(); onPick({ lat: Number(p.lat.toFixed(6)), lng: Number(p.lng.toFixed(6)) }); }}><MapPin size={17} /></button>
    <button type="button" title={t('Mi ubicación')} aria-label={t('Mi ubicación')} disabled={disabled || locating} onClick={() => { setLocating(true); map.locate({ timeout: 10000, maximumAge: 60000, enableHighAccuracy: true }); }}><LocateFixed size={18} className={locating ? 'animate-pulse' : ''} /></button>
  </div>;
}
function ReportMarker({ report, selected, onSelect }: { report: Report; selected: boolean; onSelect: Props['onSelect'] }) {
  const { t } = useLang();
  const position = reportPoint(report);
  const status = STATUS[report.estado] || STATUS.pendiente;
  const icon = useMemo(() => divIcon({
    className: `report-marker ${selected ? 'is-selected' : ''}`,
    html: `<span class="report-pin" style="--pin-color:${status.color}"><span>${Number(report.id)}</span></span>`,
    iconSize: [32, 32], iconAnchor: [16, 16], tooltipAnchor: [0, -20],
  }), [report.id, selected, status.color]);
  if (!position) return null;
  return <Marker position={[position.lat, position.lng]} icon={icon} zIndexOffset={selected ? 1000 : 0}
    title={`#${report.id} · ${report.tipo} · ${t(status.label)}`} alt={`Reporte ${report.id}: ${report.tipo}`}
    eventHandlers={{ click: event => { event.originalEvent.stopPropagation(); onSelect(report); } }}>
    <Tooltip direction="top">#{report.id} · {t(report.tipo)} · {t(status.label)}</Tooltip>
  </Marker>;
}
export default function ReportMap(props: Props) {
  const { tema } = useConfig();
  const { t } = useLang();
  const [tileError, setTileError] = useState(false);
  const [tileKey, setTileKey] = useState(0);
  const draftIcon = useMemo(() => divIcon({ className: 'report-marker is-draft', html: '<span class="report-pin"><span>+</span></span>', iconSize: [32, 32], iconAnchor: [16, 16] }), []);
  const style = tema === 'oscuro' ? 'World_Dark_Gray_Base' : 'World_Light_Gray_Base';
  return <div className="report-map-canvas" data-testid="report-map">
    <MapContainer center={MAP_CENTER} zoom={13} minZoom={11} maxZoom={18} maxBounds={MAP_BOUNDS} maxBoundsViscosity={1} zoomControl={false} scrollWheelZoom className="report-leaflet">
      <TileLayer key={`${style}-${tileKey}`} attribution='&copy; <a href="https://www.esri.com">Esri</a>, HERE, Garmin, OpenStreetMap contributors'
        url={`https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/${style}/MapServer/tile/{z}/{y}/{x}`} maxNativeZoom={16} maxZoom={18}
        eventHandlers={{ tileerror: () => setTileError(true) }} />
      <MapActions {...props} />
      {props.zones && ZONAS_VERDADERAS.map(zone => <CircleMarker key={zone.id} center={[zone.lat, zone.lng]} radius={7} pathOptions={{ color: '#64748b', fillColor: '#fff', fillOpacity: .9, weight: 2 }} bubblingMouseEvents={false}
        eventHandlers={{ click: () => { if (!props.disabled) props.onPick({ lat: zone.lat, lng: zone.lng }); } }}><Tooltip>{zone.nombre}</Tooltip></CircleMarker>)}
      {props.reports.map(report => <ReportMarker key={report.id} report={report} selected={report.id === props.selectedId} onSelect={props.onSelect} />)}
      {props.point && <Marker position={[props.point.lat, props.point.lng]} icon={draftIcon} draggable={!props.disabled} zIndexOffset={2000} title={t('Ubicación del nuevo reporte')}
        eventHandlers={{
          dragend: event => {
            const p = event.target.getLatLng();
            if (inCoverage(p)) props.onPick({ lat: Number(p.lat.toFixed(6)), lng: Number(p.lng.toFixed(6)) });
            else event.target.setLatLng([props.point!.lat, props.point!.lng]);
          }
        }} />}
    </MapContainer>
    {tileError && <div className="report-tile-error" role="status"><span>{t('No se pudo cargar parte del mapa.')}</span><button type="button" onClick={() => { setTileError(false); setTileKey(k => k + 1); }}><RotateCcw size={14} />{t('Reintentar')}</button></div>}
    <div className="report-map-legend" aria-label={t('Estados del reporte')}>{Object.entries(STATUS).map(([key, status]) => <span key={key}><i style={{ backgroundColor: status.color }} />{t(status.label)}</span>)}</div>
  </div>;
}

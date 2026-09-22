import { ZONAS_VERDADERAS } from './zonas';

export type ReportStatus = 'pendiente' | 'en proceso' | 'resuelto';
export type Priority = 'alta' | 'media' | 'baja';
export interface MapPoint { lat: number; lng: number }
export interface Report {
  id: number; tipo: string; zona: string; sector: string; descripcion: string;
  estado: ReportStatus; prioridad: Priority; latitud: number | null; longitud: number | null;
  usuario_id: number; usuario: string; usuario_rol?: string; creado_en: string; total_comentarios: number;
}
export interface ReportDraft {
  tipo: string; zona: string; descripcion: string; prioridad: Priority;
  point: MapPoint | null; solicitud_id: string;
}
export const REPORT_TYPES = ['Fuga de agua', 'Presión baja', 'Corte de servicio', 'Agua turbia', 'Otro'];
export const STATUS: Record<ReportStatus, { label: string; color: string; className: string }> = {
  pendiente: { label: 'Pendiente', color: '#f59e0b', className: 'status-pending' },
  'en proceso': { label: 'En proceso', color: '#00f2ea', className: 'status-progress' },
  resuelto: { label: 'Resuelto', color: '#22c55e', className: 'status-resolved' },
};
export const MAP_CENTER: [number, number] = [13.727, -89.174];
export const MAP_BOUNDS: [[number, number], [number, number]] = [[13.55, -89.40], [13.90, -88.95]];
export function inCoverage(point: MapPoint) {
  return Number.isFinite(point.lat) && Number.isFinite(point.lng) && point.lat >= 13.55 && point.lat <= 13.90 && point.lng >= -89.40 && point.lng <= -88.95;
}
export function reportPoint(report: Report): MapPoint | null {
  if (report.latitud == null || report.longitud == null) return null;
  const point = { lat: Number(report.latitud), lng: Number(report.longitud) };
  return inCoverage(point) ? point : null;
}
export function nearestZone(point: MapPoint) {
  return ZONAS_VERDADERAS.reduce((nearest, zone) => {
    const distance = (z: typeof zone) => (z.lat - point.lat) ** 2 + ((z.lng - point.lng) * Math.cos(point.lat * Math.PI / 180)) ** 2;
    return distance(zone) < distance(nearest) ? zone : nearest;
  });
}
export function newDraft(): ReportDraft {
  return { tipo: REPORT_TYPES[0], zona: ZONAS_VERDADERAS[0].nombre, descripcion: '', prioridad: 'media', point: null, solicitud_id: crypto.randomUUID() };
}
export const draftKey = (userId: number) => `aquaflow:report-draft:${userId}`;
export function readDraft(userId: number): ReportDraft | null {
  try {
    const value = JSON.parse(localStorage.getItem(draftKey(userId)) || 'null');
    if (!value || !REPORT_TYPES.includes(value.tipo) || typeof value.descripcion !== 'string' ||
      !ZONAS_VERDADERAS.some(z => z.nombre === value.zona) || !['alta', 'media', 'baja'].includes(value.prioridad) ||
      typeof value.solicitud_id !== 'string' || !/^[a-zA-Z0-9-]{16,36}$/.test(value.solicitud_id) ||
      (value.point !== null && (!value.point || !inCoverage(value.point)))) return null;
    return value;
  } catch { return null; }
}
export function formatReportDate(date: string) {
  const parsed = new Date(date.includes('T') ? date : date.replace(' ', 'T'));
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleString('es-SV', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

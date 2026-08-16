export interface ZonaMonitoreada {
  id: number;
  nombre: string;
  sector: string;
  lat: number;
  lng: number;
  presion: number; // en PSI
  flujo: number;   // en L/min
  estado: 'Óptimo' | 'Estable' | 'Alerta' | 'Crítico';
  color: string;
}

export const ZONAS_VERDADERAS: ZonaMonitoreada[] = [
  { id: 1, nombre: 'Cuscatancingo Centro', sector: 'Cuscatancingo', lat: 13.788145, lng: -89.187340, presion: 48.2, flujo: 15.2, estado: 'Óptimo',  color: '#22c55e' },
  { id: 2, nombre: 'Soyapango Centro',     sector: 'Soyapango',    lat: 13.712607, lng: -89.136888, presion: 42.5, flujo: 12.8, estado: 'Estable',  color: '#00f2ea' },
  { id: 3, nombre: 'Plan del Pino',        sector: 'Ciudad Delgado',lat: 13.718460, lng: -89.151406, presion: 18.4, flujo: 5.1,  estado: 'Crítico',  color: '#ef4444' },
  { id: 4, nombre: 'Ciudad Delgado Centro', sector: 'Ciudad Delgado',lat: 13.714030, lng: -89.172931, presion: 35.0, flujo: 10.0, estado: 'Alerta',   color: '#f59e0b' },
];

export const ESTADO_STYLES: Record<string, { text: string; bg: string; tw: string; cardTop: string; pill: string }> = {
  'Óptimo':  { text: '#22c55e', bg: 'rgba(34,197,94,0.13)',  tw: 'text-green-400', cardTop: 'card-top-green', pill: 'bg-green-500/15 text-green-400 border border-green-500/25' },
  'Estable': { text: '#00f2ea', bg: 'rgba(0,242,234,0.13)',  tw: 'text-cyan-400',  cardTop: 'card-top-cyan',  pill: 'bg-aqua-cyan/15 text-aqua-cyan border border-aqua-cyan/25'  },
  'Alerta':  { text: '#f59e0b', bg: 'rgba(245,158,11,0.13)', tw: 'text-amber-400', cardTop: 'card-top-amber', pill: 'bg-amber-500/15 text-amber-400 border border-amber-500/25' },
  'Crítico': { text: '#ef4444', bg: 'rgba(239,68,68,0.13)',  tw: 'text-red-400',   cardTop: 'card-top-red',   pill: 'bg-red-500/15 text-red-400 border border-red-500/25'     },
};

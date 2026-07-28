import React, { useState, useEffect } from 'react';
import {
  Bell, AlertTriangle, CheckCircle, Clock, Droplets, Zap, MessageSquare, Send,
  Pencil, Trash2, ShieldCheck, History, PauseCircle, PlayCircle, MapPin, Users, X,
} from 'lucide-react';
import axios from 'axios';
import { useConfirm } from '../components/ConfirmDialog';
import { useConfig } from '../context/ConfigContext';

const SEV_STYLE: Record<string, { text: string; bg: string; label: string; cardTop: string }> = {
  critica: { text: '#ef4444', bg: 'rgba(239,68,68,0.08)',  label: 'Crítica', cardTop: 'card-top-red'   },
  alta:    { text: '#f59e0b', bg: 'rgba(245,158,11,0.08)', label: 'Alta',    cardTop: 'card-top-amber' },
  media:   { text: '#00f2ea', bg: 'rgba(0,242,234,0.08)',  label: 'Media',   cardTop: 'card-top-cyan'  },
};

const SEV_KPIS = [
  { key: 'critica', label: 'Críticas',  sub: 'Intervención urgente',  color: 'text-red-400',   bg: 'bg-red-500/10',   top: 'card-top-red',   icon: AlertTriangle },
  { key: 'alta',    label: 'Alta',      sub: 'Atención prioritaria',   color: 'text-amber-400', bg: 'bg-amber-500/10', top: 'card-top-amber', icon: Zap           },
  { key: 'media',   label: 'Media',     sub: 'Monitorear de cerca',    color: 'text-aqua-cyan', bg: 'bg-aqua-cyan/10', top: 'card-top-cyan',  icon: Bell          },
];

const ESTADO_STYLE: Record<string, { text: string; bg: string; label: string }> = {
  activa:     { text: 'text-red-400',   bg: 'bg-red-500/10',   label: 'Activa'     },
  suspendida: { text: 'text-gray-400',  bg: 'bg-gray-500/10',  label: 'Suspendida' },
  resuelta:   { text: 'text-green-400', bg: 'bg-green-500/10', label: 'Resuelta'   },
};

const TIPO_ICON: Record<string, React.ElementType> = {
  'Fuga de agua':      Droplets,
  'Presión baja':      Zap,
  'Corte de servicio': AlertTriangle,
  'Agua turbia':       Droplets,
};

interface Alerta {
  id: number;
  tipo: string;
  zona: string;
  sector: string;
  descripcion: string;
  severidad: 'critica' | 'alta' | 'media';
  estado: 'activa' | 'suspendida' | 'resuelta';
  total_reportes: number;
  usuario: string;
  creado_en: string;
  actualizado_en: string;
  resuelta_en: string | null;
}

interface Comentario {
  id: number;
  usuario_id: number;
  usuario: string;
  rol: string;
  contenido: string;
  creado_en: string;
  editado_en: string;
}

interface UsuarioActual {
  ID: number;
  Usuario: string;
  rol: string;
}

function toDate(iso: string) {
  return new Date(iso.replace(' ', 'T'));
}

function formatFecha(iso: string) {
  return toDate(iso).toLocaleString('es-SV', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - toDate(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'hace instantes';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} d`;
}

function Iniciales({ nombre }: { nombre: string }) {
  const letras = nombre.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full bg-aqua-cyan/20 border border-aqua-cyan/30 flex items-center justify-center flex-shrink-0 text-[11px] font-black text-aqua-cyan">
      {letras}
    </div>
  );
}

export default function Alertas() {
  const [alertas, setAlertas]         = useState<Alerta[]>([]);
  const [loadingAlertas, setLoadingA] = useState(true);
  const [filtro, setFiltro]           = useState('todos');
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [usuario, setUsuario]         = useState<UsuarioActual | null>(null);
  const [nuevoTexto, setNuevoTexto]   = useState('');
  const [enviando, setEnviando]       = useState(false);
  const [editandoId, setEditandoId]   = useState<number | null>(null);
  const [editTexto, setEditTexto]     = useState('');
  const [guardando, setGuardando]     = useState(false);
  const [error, setError]             = useState('');
  const [accionError, setAccionError] = useState('');
  const confirmDialog = useConfirm();
  const { pollingMs, tiempoReal } = useConfig();

  useEffect(() => {
    axios.get('/api/user-info', { withCredentials: true })
      .then(r => setUsuario(r.data))
      .catch(() => {});
    cargarAlertas();
    cargarComentarios();
  }, []);

  // Auto-refresh según el intervalo configurado por el admin en Configuración.
  useEffect(() => {
    if (!pollingMs) return;
    const id = setInterval(() => { cargarAlertas(true); cargarComentarios(); }, pollingMs);
    return () => clearInterval(id);
  }, [pollingMs]);

  // Modo "Tiempo real": el servidor avisa por streaming apenas algo cambia,
  // en vez de esperar a un intervalo fijo.
  useEffect(() => {
    if (!tiempoReal) return;
    const es = new EventSource('/api/alertas/stream');
    es.onmessage = () => { cargarAlertas(true); cargarComentarios(); };
    return () => es.close();
  }, [tiempoReal]);

  const cargarAlertas = (silent = false) => {
    if (!silent) setLoadingA(true);
    axios.get<Alerta[]>('/api/alertas', { withCredentials: true })
      .then(r => setAlertas(r.data))
      .catch(() => {})
      .finally(() => { if (!silent) setLoadingA(false); });
  };

  const cargarComentarios = () => {
    axios.get('/api/comentarios', { withCredentials: true })
      .then(r => setComentarios(r.data))
      .catch(() => {});
  };

  const cambiarEstadoAlerta = async (id: number, estado: 'activa' | 'suspendida' | 'resuelta') => {
    setAccionError('');
    try {
      await axios.put(`/api/alertas/${id}`, { estado }, { withCredentials: true });
      setAlertas(prev => prev.map(a => a.id === id
        ? { ...a, estado, resuelta_en: estado === 'resuelta' ? new Date().toISOString() : a.resuelta_en }
        : a));
    } catch (e: any) {
      setAccionError(e.response?.data?.error || 'Error al actualizar la alerta');
    }
  };

  const eliminarAlerta = async (id: number) => {
    const ok = await confirmDialog({ message: '¿Eliminar esta alerta? Esta acción no se puede deshacer.', danger: true });
    if (!ok) return;
    try {
      await axios.delete(`/api/alertas/${id}`, { withCredentials: true });
      setAlertas(prev => prev.filter(a => a.id !== id));
    } catch (e: any) {
      setAccionError(e.response?.data?.error || 'Error al eliminar la alerta');
    }
  };

  const enviar = async () => {
    if (!nuevoTexto.trim() || enviando) return;
    setEnviando(true);
    setError('');
    try {
      const { data } = await axios.post('/api/comentarios', { contenido: nuevoTexto }, { withCredentials: true });
      setComentarios(prev => [data, ...prev]);
      setNuevoTexto('');
    } catch (e: any) {
      setError(e.response?.data?.error || 'Error al enviar');
    } finally {
      setEnviando(false);
    }
  };

  const guardarEdicion = async (id: number) => {
    if (!editTexto.trim() || guardando) return;
    setGuardando(true);
    try {
      await axios.put(`/api/comentarios/${id}`, { contenido: editTexto }, { withCredentials: true });
      setComentarios(prev => prev.map(c => c.id === id ? { ...c, contenido: editTexto } : c));
      setEditandoId(null);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Error al editar');
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (id: number) => {
    const ok = await confirmDialog({ message: '¿Eliminar este comentario? Esta acción no se puede deshacer.', danger: true });
    if (!ok) return;
    try {
      await axios.delete(`/api/comentarios/${id}`, { withCredentials: true });
      setComentarios(prev => prev.filter(c => c.id !== id));
    } catch (e: any) {
      setError(e.response?.data?.error || 'Error al eliminar');
    }
  };

  const isAdmin = usuario?.rol === 'admin';

  // Activas + suspendidas: son las que aún requieren gestión del admin.
  const gestionables = alertas.filter(a => a.estado !== 'resuelta');
  const resueltas     = alertas.filter(a => a.estado === 'resuelta').slice(0, 10);

  const critCount  = gestionables.filter(a => a.severidad === 'critica').length;
  const altaCount  = gestionables.filter(a => a.severidad === 'alta').length;
  const mediaCount = gestionables.filter(a => a.severidad === 'media').length;

  const alertasFiltradas = filtro === 'todos' ? gestionables : gestionables.filter(a => a.severidad === filtro);

  const FILTERS = [
    { key: 'todos',   label: `Todos (${gestionables.length})` },
    { key: 'critica', label: `Crítica (${critCount})` },
    { key: 'alta',    label: `Alta (${altaCount})` },
    { key: 'media',   label: `Media (${mediaCount})` },
  ];

  const kpiCount = (key: string) =>
    key === 'critica' ? critCount : key === 'alta' ? altaCount : mediaCount;

  return (
    <div className="space-y-5 page-enter portal-grid-bg min-h-full pb-2">

      {/* ENCABEZADO */}
      <div>
        <p className="text-[10px] text-aqua-cyan/60 uppercase tracking-[0.25em] font-bold mb-1">Sistema de Monitoreo</p>
        <h2 className="text-3xl font-black tracking-tighter gradient-text">Alertas del Sistema</h2>
        <p className="text-sm text-gray-500 mt-1">Se genera una alerta automática cuando una zona acumula 5 o más reportes del mismo problema</p>
      </div>

      {accionError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-between">
          <span>⚠ {accionError}</span>
          <button onClick={() => setAccionError('')} className="text-red-400 hover:text-red-300 ml-4"><X size={14} /></button>
        </div>
      )}

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {SEV_KPIS.map(k => (
          <div key={k.key} className={`portal-card ${k.top} p-5 flex items-center gap-4`}>
            <div className={`w-10 h-10 rounded-xl ${k.bg} flex items-center justify-center flex-shrink-0`}>
              <k.icon size={18} className={k.color} />
            </div>
            <div>
              <p className="text-2xl font-black text-ink">{kpiCount(k.key)}</p>
              <p className="text-[11px] font-bold text-gray-500">{k.label}</p>
              <p className={`text-[10px] font-bold mt-0.5 ${k.color}`}>{k.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* BANNER DE ESTADO */}
      {gestionables.length > 0 ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <Bell size={16} className="text-red-400 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-red-400">
              {gestionables.length} alerta{gestionables.length !== 1 ? 's' : ''} activa{gestionables.length !== 1 ? 's' : ''} — requieren atención
            </p>
            <p className="text-xs text-gray-500">Resuelve cada incidencia para mantener el sistema estable.</p>
          </div>
        </div>
      ) : !loadingAlertas ? (
        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <CheckCircle size={16} className="text-green-400" />
          </div>
          <div>
            <p className="text-sm font-black text-green-400">Sin alertas activas</p>
            <p className="text-xs text-gray-500">Todos los sistemas operan con normalidad.</p>
          </div>
        </div>
      ) : null}

      {/* ALERTAS ACTIVAS */}
      {loadingAlertas ? (
        <div className="portal-card p-10 text-center">
          <div className="w-6 h-6 border-2 border-aqua-cyan/30 border-t-aqua-cyan rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500 font-medium">Cargando alertas...</p>
        </div>
      ) : gestionables.length > 0 && (
        <>
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map(({ key, label }) => (
              <button key={key} onClick={() => setFiltro(key)}
                className={`px-4 py-2 rounded-xl font-bold text-xs transition-all border ${
                  filtro === key
                    ? 'bg-aqua-cyan text-aqua-dark border-aqua-cyan'
                    : 'bg-ink/[0.03] text-gray-400 border-ink/[0.06] hover:border-ink/15 hover:text-ink'
                }`}>
                {label}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {alertasFiltradas.length === 0 ? (
              <div className="portal-card p-10 text-center">
                <CheckCircle size={28} className="mx-auto mb-3 text-gray-600" />
                <p className="text-sm font-bold text-gray-500">No hay alertas con esta severidad actualmente.</p>
              </div>
            ) : (
              alertasFiltradas.map((alerta) => {
                const style  = SEV_STYLE[alerta.severidad];
                const eStyle = ESTADO_STYLE[alerta.estado];
                const Icon   = TIPO_ICON[alerta.tipo] ?? Bell;
                return (
                  <div key={alerta.id}
                    className={`portal-card ${style.cardTop} overflow-hidden hover:scale-[1.005] transition-all duration-200`}>
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: style.bg }}>
                          <Icon size={18} style={{ color: style.text }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="font-black text-ink text-sm">{alerta.tipo}</h3>
                            <span className="text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full"
                              style={{ color: style.text, backgroundColor: style.bg }}>
                              {style.label}
                            </span>
                            <span className={`text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full ${eStyle.bg} ${eStyle.text}`}>
                              {eStyle.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 leading-relaxed mb-3">{alerta.descripcion}</p>
                          <div className="flex flex-wrap gap-4 text-[10px] text-gray-500">
                            <span className="flex items-center gap-1">
                              <MapPin size={10} />
                              Zona: <strong className="text-gray-400">{alerta.zona}, {alerta.sector}</strong>
                            </span>
                            <span className="flex items-center gap-1">
                              <Users size={10} />
                              {alerta.total_reportes} reportes · último de <strong className="text-gray-400">{alerta.usuario}</strong>
                            </span>
                            <span className="flex items-center gap-1"><Clock size={10} />{timeAgo(alerta.actualizado_en ?? alerta.creado_en)}</span>
                          </div>
                        </div>

                        {isAdmin && (
                          <div className="flex gap-1.5 flex-shrink-0">
                            {alerta.estado === 'activa' && (
                              <button onClick={() => cambiarEstadoAlerta(alerta.id, 'suspendida')} title="Suspender alerta"
                                className="w-7 h-7 rounded-lg bg-ink/[0.04] border border-ink/[0.07] text-gray-500 hover:text-amber-400 hover:border-amber-500/30 flex items-center justify-center transition-all">
                                <PauseCircle size={12} />
                              </button>
                            )}
                            {alerta.estado === 'suspendida' && (
                              <button onClick={() => cambiarEstadoAlerta(alerta.id, 'activa')} title="Reactivar alerta"
                                className="w-7 h-7 rounded-lg bg-ink/[0.04] border border-ink/[0.07] text-gray-500 hover:text-aqua-cyan hover:border-aqua-cyan/30 flex items-center justify-center transition-all">
                                <PlayCircle size={12} />
                              </button>
                            )}
                            <button onClick={() => cambiarEstadoAlerta(alerta.id, 'resuelta')} title="Marcar como resuelta"
                              className="w-7 h-7 rounded-lg bg-ink/[0.04] border border-ink/[0.07] text-gray-500 hover:text-green-400 hover:border-green-500/30 flex items-center justify-center transition-all">
                              <CheckCircle size={12} />
                            </button>
                            <button onClick={() => eliminarAlerta(alerta.id)} title="Eliminar alerta"
                              className="w-7 h-7 rounded-lg bg-ink/[0.04] border border-ink/[0.07] text-gray-500 hover:text-red-400 hover:border-red-500/30 flex items-center justify-center transition-all">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* HISTORIAL */}
      <div className="portal-card overflow-hidden">
        <div className="p-5 border-b border-ink/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center">
            <History size={16} className="text-green-400" />
          </div>
          <div>
            <h3 className="font-bold text-base text-ink">Historial Reciente</h3>
            <p className="text-[10px] text-gray-500 mt-0.5">Alertas resueltas recientemente</p>
          </div>
        </div>
        <div className="p-4 space-y-1">
          {resueltas.length === 0 ? (
            <p className="text-sm text-gray-600 text-center py-4">Aún no hay alertas resueltas.</p>
          ) : (
            resueltas.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-ink/[0.02] transition-colors">
                <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold text-ink/80">{item.tipo} resuelta</span>
                  <span className="text-gray-500 text-sm"> — {item.zona}, {item.sector}</span>
                </div>
                {isAdmin && (
                  <button onClick={() => eliminarAlerta(item.id)} title="Eliminar del historial"
                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-all flex-shrink-0">
                    <Trash2 size={12} />
                  </button>
                )}
                <span className="text-[10px] text-gray-600 flex-shrink-0">{timeAgo(item.resuelta_en ?? item.actualizado_en)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* COMENTARIOS */}
      <div className="portal-card overflow-hidden">
        <div className="p-5 border-b border-ink/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-aqua-cyan/10 flex items-center justify-center">
              <MessageSquare size={16} className="text-aqua-cyan" />
            </div>
            <div>
              <h3 className="font-bold text-base text-ink">Comentarios del equipo</h3>
              <p className="text-[10px] text-gray-500 mt-0.5">{comentarios.length} comentario{comentarios.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          {isAdmin && (
            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-aqua-cyan bg-aqua-cyan/10 px-3 py-1.5 rounded-xl border border-aqua-cyan/20">
              <ShieldCheck size={12} /> Admin
            </span>
          )}
        </div>

        <div className="p-5 space-y-5">
          {/* Formulario */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              {usuario ? <Iniciales nombre={usuario.Usuario} /> : <div className="w-8 h-8 rounded-full bg-ink/5 flex-shrink-0" />}
              <div className="flex-1">
                <textarea
                  value={nuevoTexto}
                  onChange={e => setNuevoTexto(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) enviar(); }}
                  placeholder="Escribe un comentario sobre esta alerta... (Ctrl+Enter para enviar)"
                  rows={3}
                  className="w-full bg-ink/5 border border-ink/10 rounded-2xl px-4 py-3 text-sm text-ink placeholder-gray-600 outline-none focus:border-aqua-cyan/40 resize-none transition-colors"
                />
              </div>
            </div>
            <div className="flex items-center justify-between flex-wrap gap-2 pl-11">
              {error && <p className="text-xs text-red-400">{error}</p>}
              <div className="ml-auto">
                <button onClick={enviar} disabled={!nuevoTexto.trim() || enviando}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-aqua-cyan text-aqua-dark text-sm font-bold hover:bg-aqua-cyan/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  <Send size={14} />
                  {enviando ? 'Enviando...' : 'Comentar'}
                </button>
              </div>
            </div>
          </div>

          {comentarios.length > 0 && <div className="border-t border-ink/5" />}

          <div className="space-y-4">
            {comentarios.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <MessageSquare size={28} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Aún no hay comentarios. ¡Sé el primero en comentar!</p>
              </div>
            ) : (
              comentarios.map(c => (
                <div key={c.id} className="flex gap-3 group">
                  <Iniciales nombre={c.usuario} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-sm font-bold text-ink">{c.usuario}</span>
                      {c.rol === 'admin' && (
                        <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-aqua-cyan bg-aqua-cyan/10 px-1.5 py-0.5 rounded-md border border-aqua-cyan/20">
                          <ShieldCheck size={9} /> Admin
                        </span>
                      )}
                      <span className="text-[10px] text-gray-600">{formatFecha(c.creado_en)}</span>
                    </div>
                    {editandoId === c.id ? (
                      <div className="space-y-2">
                        <textarea value={editTexto} onChange={e => setEditTexto(e.target.value)}
                          rows={3} autoFocus
                          className="w-full bg-ink/5 border border-aqua-cyan/30 rounded-xl px-3 py-2 text-sm text-ink outline-none resize-none"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => guardarEdicion(c.id)} disabled={guardando}
                            className="px-3 py-1.5 rounded-lg bg-aqua-cyan text-aqua-dark text-xs font-bold hover:bg-aqua-cyan/80 disabled:opacity-40 transition-all">
                            {guardando ? 'Guardando...' : 'Guardar'}
                          </button>
                          <button onClick={() => setEditandoId(null)}
                            className="px-3 py-1.5 rounded-lg bg-ink/5 text-gray-400 text-xs font-bold hover:bg-ink/10 transition-all">
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-ink/80 leading-relaxed whitespace-pre-wrap">{c.contenido}</p>
                    )}
                  </div>
                  {isAdmin && editandoId !== c.id && (
                    <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1">
                      <button onClick={() => { setEditandoId(c.id); setEditTexto(c.contenido); }} title="Editar"
                        className="p-1.5 rounded-lg text-gray-500 hover:text-aqua-cyan hover:bg-aqua-cyan/10 transition-all">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => eliminar(c.id)} title="Eliminar"
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

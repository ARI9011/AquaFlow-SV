import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, CheckCircle, Clock, Droplets, Zap, X, MessageSquare, Send, Pencil, Trash2, ShieldCheck, History } from 'lucide-react';
import axios from 'axios';

const alertasIniciales = [
  { id: 1, tipo: 'Presión Crítica',  zona: 'Mejicanos Norte',  sector: 'Mejicanos',  descripcion: 'La presión ha caído a 18.4 PSI, por debajo del umbral mínimo de 25 PSI. Revisar red de distribución.', severidad: 'critica', icono: AlertTriangle, timestamp: 'hace 12 min' },
  { id: 2, tipo: 'Sensor Inactivo',  zona: 'Soyapango Centro', sector: 'Soyapango',  descripcion: 'Sensor F-002 sin respuesta desde hace 45 minutos. Batería al 15%, posible falla de conexión.',           severidad: 'alta',    icono: Zap,           timestamp: 'hace 45 min' },
  { id: 3, tipo: 'Flujo Bajo',       zona: 'Ilopango Sur',     sector: 'Ilopango',   descripcion: 'Flujo reducido a 10 L/min en el sector sur. Posible obstrucción o fuga en la red secundaria.',             severidad: 'media',   icono: Droplets,      timestamp: 'hace 1 h'  },
];

const historial = [
  { label: 'Sensor T-001 reconectado',  zona: 'Colonia Escalón',  tiempo: 'hace 3 h' },
  { label: 'Presión normalizada',        zona: 'Soyapango Centro', tiempo: 'hace 5 h' },
  { label: 'Fuga detectada y reparada', zona: 'Mejicanos Norte',  tiempo: 'hace 8 h' },
];

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

function formatFecha(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('es-SV', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
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
  const [alertas, setAlertas]         = useState(alertasIniciales);
  const [filtro, setFiltro]           = useState('todos');
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [usuario, setUsuario]         = useState<UsuarioActual | null>(null);
  const [nuevoTexto, setNuevoTexto]   = useState('');
  const [enviando, setEnviando]       = useState(false);
  const [editandoId, setEditandoId]   = useState<number | null>(null);
  const [editTexto, setEditTexto]     = useState('');
  const [guardando, setGuardando]     = useState(false);
  const [error, setError]             = useState('');

  useEffect(() => {
    axios.get('/api/user-info', { withCredentials: true })
      .then(r => setUsuario(r.data))
      .catch(() => {});
    cargarComentarios();
  }, []);

  const cargarComentarios = () => {
    axios.get('/api/comentarios', { withCredentials: true })
      .then(r => setComentarios(r.data))
      .catch(() => {});
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
    if (!confirm('¿Eliminar este comentario?')) return;
    try {
      await axios.delete(`/api/comentarios/${id}`, { withCredentials: true });
      setComentarios(prev => prev.filter(c => c.id !== id));
    } catch (e: any) {
      setError(e.response?.data?.error || 'Error al eliminar');
    }
  };

  const isAdmin    = usuario?.rol === 'admin';
  const critCount  = alertas.filter(a => a.severidad === 'critica').length;
  const altaCount  = alertas.filter(a => a.severidad === 'alta').length;
  const mediaCount = alertas.filter(a => a.severidad === 'media').length;

  const alertasFiltradas = filtro === 'todos' ? alertas : alertas.filter(a => a.severidad === filtro);

  const FILTERS = [
    { key: 'todos',   label: `Todos (${alertas.length})` },
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
        <p className="text-sm text-gray-500 mt-1">Notificaciones activas que requieren atención inmediata</p>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-3 gap-3">
        {SEV_KPIS.map(k => (
          <div key={k.key} className={`portal-card ${k.top} p-5 flex items-center gap-4`}>
            <div className={`w-10 h-10 rounded-xl ${k.bg} flex items-center justify-center flex-shrink-0`}>
              <k.icon size={18} className={k.color} />
            </div>
            <div>
              <p className="text-2xl font-black text-white">{kpiCount(k.key)}</p>
              <p className="text-[11px] font-bold text-gray-500">{k.label}</p>
              <p className={`text-[10px] font-bold mt-0.5 ${k.color}`}>{k.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* BANNER DE ESTADO */}
      {alertas.length > 0 ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <Bell size={16} className="text-red-400 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-red-400">
              {alertas.length} alerta{alertas.length !== 1 ? 's' : ''} activa{alertas.length !== 1 ? 's' : ''} — requieren atención
            </p>
            <p className="text-xs text-gray-500">Resuelve cada incidencia para mantener el sistema estable.</p>
          </div>
        </div>
      ) : (
        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <CheckCircle size={16} className="text-green-400" />
          </div>
          <div>
            <p className="text-sm font-black text-green-400">Sin alertas activas</p>
            <p className="text-xs text-gray-500">Todos los sistemas operan con normalidad.</p>
          </div>
        </div>
      )}

      {/* ALERTAS ACTIVAS */}
      {alertas.length > 0 && (
        <>
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map(({ key, label }) => (
              <button key={key} onClick={() => setFiltro(key)}
                className={`px-4 py-2 rounded-xl font-bold text-xs transition-all border ${
                  filtro === key
                    ? 'bg-aqua-cyan text-aqua-dark border-aqua-cyan'
                    : 'bg-white/[0.03] text-gray-400 border-white/[0.06] hover:border-white/15 hover:text-gray-200'
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
                const style = SEV_STYLE[alerta.severidad];
                const Icon  = alerta.icono;
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
                            <h3 className="font-black text-white text-sm">{alerta.tipo}</h3>
                            <span className="text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full"
                              style={{ color: style.text, backgroundColor: style.bg }}>
                              {style.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 leading-relaxed mb-3">{alerta.descripcion}</p>
                          <div className="flex flex-wrap gap-4 text-[10px] text-gray-500">
                            <span>Zona: <strong className="text-gray-400">{alerta.zona}</strong></span>
                            <span className="flex items-center gap-1"><Clock size={10} />{alerta.timestamp}</span>
                          </div>
                        </div>
                        <button onClick={() => setAlertas(prev => prev.filter(a => a.id !== alerta.id))}
                          title="Marcar como resuelto"
                          className="p-2 rounded-xl text-gray-500 hover:text-green-400 hover:bg-green-400/10 transition-all flex-shrink-0">
                          <X size={16} />
                        </button>
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
        <div className="p-5 border-b border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center">
            <History size={16} className="text-green-400" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Historial Reciente</h3>
            <p className="text-[10px] text-gray-500 mt-0.5">Alertas resueltas recientemente</p>
          </div>
        </div>
        <div className="p-4 space-y-1">
          {historial.map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.02] transition-colors">
              <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-bold text-gray-300">{item.label}</span>
                <span className="text-gray-500 text-sm"> — {item.zona}</span>
              </div>
              <span className="text-[10px] text-gray-600 flex-shrink-0">{item.tiempo}</span>
            </div>
          ))}
        </div>
      </div>

      {/* COMENTARIOS */}
      <div className="portal-card overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-aqua-cyan/10 flex items-center justify-center">
              <MessageSquare size={16} className="text-aqua-cyan" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Comentarios del equipo</h3>
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
              {usuario ? <Iniciales nombre={usuario.Usuario} /> : <div className="w-8 h-8 rounded-full bg-white/5 flex-shrink-0" />}
              <div className="flex-1">
                <textarea
                  value={nuevoTexto}
                  onChange={e => setNuevoTexto(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) enviar(); }}
                  placeholder="Escribe un comentario sobre esta alerta... (Ctrl+Enter para enviar)"
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-aqua-cyan/40 resize-none transition-colors"
                />
              </div>
            </div>
            <div className="flex items-center justify-between pl-11">
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

          {comentarios.length > 0 && <div className="border-t border-white/5" />}

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
                      <span className="text-sm font-bold text-white">{c.usuario}</span>
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
                          className="w-full bg-white/5 border border-aqua-cyan/30 rounded-xl px-3 py-2 text-sm text-white outline-none resize-none"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => guardarEdicion(c.id)} disabled={guardando}
                            className="px-3 py-1.5 rounded-lg bg-aqua-cyan text-aqua-dark text-xs font-bold hover:bg-aqua-cyan/80 disabled:opacity-40 transition-all">
                            {guardando ? 'Guardando...' : 'Guardar'}
                          </button>
                          <button onClick={() => setEditandoId(null)}
                            className="px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 text-xs font-bold hover:bg-white/10 transition-all">
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{c.contenido}</p>
                    )}
                  </div>
                  {isAdmin && editandoId !== c.id && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1">
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

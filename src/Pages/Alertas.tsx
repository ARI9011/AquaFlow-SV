import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, CheckCircle, Clock, Droplets, Zap, X, MessageSquare, Send, Pencil, Trash2, ShieldCheck, User } from 'lucide-react';
import axios from 'axios';

// ── Datos estáticos de alertas ────────────────────────────────────────
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

const severidadStyle: Record<string, { text: string; bg: string; border: string; label: string }> = {
  critica: { text: '#ef4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.3)',  label: 'Crítica' },
  alta:    { text: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)', label: 'Alta'    },
  media:   { text: '#00f2ea', bg: 'rgba(0,242,234,0.08)',  border: 'rgba(0,242,234,0.3)',  label: 'Media'   },
};

// ── Tipos ─────────────────────────────────────────────────────────────
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

// ── Helpers ───────────────────────────────────────────────────────────
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

// ── Componente principal ──────────────────────────────────────────────
export default function Alertas() {
  const [alertas, setAlertas]           = useState(alertasIniciales);
  const [comentarios, setComentarios]   = useState<Comentario[]>([]);
  const [usuario, setUsuario]           = useState<UsuarioActual | null>(null);
  const [nuevoTexto, setNuevoTexto]     = useState('');
  const [enviando, setEnviando]         = useState(false);
  const [editandoId, setEditandoId]     = useState<number | null>(null);
  const [editTexto, setEditTexto]       = useState('');
  const [guardando, setGuardando]       = useState(false);
  const [error, setError]               = useState('');

  // Cargar usuario y comentarios al montar
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

  // Enviar comentario nuevo
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

  // Guardar edición (admin)
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

  // Eliminar comentario (admin)
  const eliminar = async (id: number) => {
    if (!confirm('¿Eliminar este comentario?')) return;
    try {
      await axios.delete(`/api/comentarios/${id}`, { withCredentials: true });
      setComentarios(prev => prev.filter(c => c.id !== id));
    } catch (e: any) {
      setError(e.response?.data?.error || 'Error al eliminar');
    }
  };

  const isAdmin = usuario?.rol === 'admin';

  return (
    <div className="space-y-8 animate-in fade-in duration-700">

      {/* ENCABEZADO */}
      <div>
        <h2 className="text-3xl font-black tracking-tighter text-white mb-2">
          Alertas del <span className="text-aqua-cyan">Sistema</span>
        </h2>
        <p className="text-gray-500 text-sm">Notificaciones activas que requieren atención inmediata</p>
      </div>

      {/* BANNER */}
      {alertas.length > 0 ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 flex items-start gap-4">
          <Bell className="text-red-400 flex-shrink-0 mt-1 animate-pulse" size={20} />
          <div>
            <h3 className="font-black text-red-400 mb-1">
              {alertas.length} alerta{alertas.length !== 1 ? 's' : ''} activa{alertas.length !== 1 ? 's' : ''}
            </h3>
            <p className="text-sm text-gray-300">Revisa y atiende las incidencias para mantener el sistema en óptimas condiciones.</p>
          </div>
        </div>
      ) : (
        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 flex items-start gap-4">
          <CheckCircle className="text-green-400 flex-shrink-0 mt-1" size={20} />
          <div>
            <h3 className="font-black text-green-400 mb-1">Sin alertas activas</h3>
            <p className="text-sm text-gray-300">Todos los sistemas operan con normalidad.</p>
          </div>
        </div>
      )}

      {/* ALERTAS ACTIVAS */}
      {alertas.length > 0 && (
        <div className="space-y-4">
          {alertas.map((alerta) => {
            const style = severidadStyle[alerta.severidad];
            const Icon  = alerta.icono;
            return (
              <div key={alerta.id} className="bg-aqua-card rounded-2xl p-6 flex items-start gap-4 transition-all hover:scale-[1.005]" style={{ border: `1px solid ${style.border}` }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: style.bg }}>
                  <Icon size={22} style={{ color: style.text }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-black text-white">{alerta.tipo}</h3>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md" style={{ color: style.text, backgroundColor: style.bg }}>{style.label}</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">{alerta.descripcion}</p>
                  <div className="flex flex-wrap gap-4 text-[10px] text-gray-500">
                    <span>Zona: <strong className="text-gray-400">{alerta.zona}</strong></span>
                    <span className="flex items-center gap-1"><Clock size={10} />{alerta.timestamp}</span>
                  </div>
                </div>
                <button onClick={() => setAlertas(prev => prev.filter(a => a.id !== alerta.id))} title="Marcar como resuelto" className="p-2 rounded-xl text-gray-500 hover:text-green-400 hover:bg-green-400/10 transition-all flex-shrink-0">
                  <X size={18} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* HISTORIAL */}
      <div className="bg-aqua-card border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5">
          <h3 className="font-bold text-xl">Historial Reciente</h3>
        </div>
        <div className="p-6 space-y-2">
          {historial.map((item, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.02] transition-colors">
              <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
              <div className="flex-1">
                <span className="text-sm font-bold text-gray-300">{item.label}</span>
                <span className="text-gray-500 text-sm"> — {item.zona}</span>
              </div>
              <span className="text-[10px] text-gray-600 flex-shrink-0">{item.tiempo}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECCIÓN DE COMENTARIOS ── */}
      <div className="bg-aqua-card border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">

        {/* Header comentarios */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-aqua-cyan/10 flex items-center justify-center">
              <MessageSquare size={18} className="text-aqua-cyan" />
            </div>
            <div>
              <h3 className="font-bold text-xl">Comentarios</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">{comentarios.length} comentario{comentarios.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          {isAdmin && (
            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-aqua-cyan bg-aqua-cyan/10 px-3 py-1.5 rounded-xl border border-aqua-cyan/20">
              <ShieldCheck size={12} /> Admin
            </span>
          )}
        </div>

        <div className="p-6 space-y-6">

          {/* Formulario nuevo comentario */}
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
                <button
                  onClick={enviar}
                  disabled={!nuevoTexto.trim() || enviando}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-aqua-cyan text-aqua-dark text-sm font-bold hover:bg-aqua-cyan/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <Send size={14} />
                  {enviando ? 'Enviando...' : 'Comentar'}
                </button>
              </div>
            </div>
          </div>

          {/* Divisor */}
          {comentarios.length > 0 && <div className="border-t border-white/5" />}

          {/* Lista de comentarios */}
          <div className="space-y-4">
            {comentarios.length === 0 ? (
              <div className="text-center py-10 text-gray-600">
                <MessageSquare size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Aún no hay comentarios. ¡Sé el primero!</p>
              </div>
            ) : (
              comentarios.map(c => (
                <div key={c.id} className="flex gap-3 group">
                  <Iniciales nombre={c.usuario} />

                  <div className="flex-1 min-w-0">
                    {/* Nombre + rol + fecha */}
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-sm font-bold text-white">{c.usuario}</span>
                      {c.rol === 'admin' && (
                        <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-aqua-cyan bg-aqua-cyan/10 px-1.5 py-0.5 rounded-md border border-aqua-cyan/20">
                          <ShieldCheck size={9} /> Admin
                        </span>
                      )}
                      <span className="text-[10px] text-gray-600">{formatFecha(c.creado_en)}</span>
                    </div>

                    {/* Contenido o formulario de edición */}
                    {editandoId === c.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editTexto}
                          onChange={e => setEditTexto(e.target.value)}
                          rows={3}
                          autoFocus
                          className="w-full bg-white/5 border border-aqua-cyan/30 rounded-xl px-3 py-2 text-sm text-white outline-none resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => guardarEdicion(c.id)}
                            disabled={guardando}
                            className="px-3 py-1.5 rounded-lg bg-aqua-cyan text-aqua-dark text-xs font-bold hover:bg-aqua-cyan/80 disabled:opacity-40 transition-all"
                          >
                            {guardando ? 'Guardando...' : 'Guardar'}
                          </button>
                          <button
                            onClick={() => setEditandoId(null)}
                            className="px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 text-xs font-bold hover:bg-white/10 transition-all"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{c.contenido}</p>
                    )}
                  </div>

                  {/* Botones admin (edit + delete) */}
                  {isAdmin && editandoId !== c.id && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1">
                      <button
                        onClick={() => { setEditandoId(c.id); setEditTexto(c.contenido); }}
                        title="Editar"
                        className="p-1.5 rounded-lg text-gray-500 hover:text-aqua-cyan hover:bg-aqua-cyan/10 transition-all"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => eliminar(c.id)}
                        title="Eliminar"
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
                      >
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

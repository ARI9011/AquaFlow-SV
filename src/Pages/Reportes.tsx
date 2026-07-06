import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  FileText, AlertTriangle, CheckCircle, Clock, MapPin,
  Droplets, Zap, Plus, Edit2, Trash2, MessageSquare,
  ChevronDown, ChevronUp, Send, X,
} from 'lucide-react';

/* ── Tipos ─────────────────────────────────────────────────────────── */
interface Reporte {
  id: number;
  tipo: string;
  zona: string;
  sector: string;
  descripcion: string;
  estado: 'pendiente' | 'en proceso' | 'resuelto';
  prioridad: 'alta' | 'media' | 'baja';
  usuario_id: number;
  usuario: string;
  creado_en: string | Date;
  total_comentarios: number;
}

interface Comentario {
  id: number;
  reporte_id: number;
  usuario_id: number;
  usuario: string;
  rol: string;
  contenido: string;
  creado_en: string | Date;
}

/* ── Datos estáticos ─────────────────────────────────────────────── */
const ZONAS_MAP: Record<string, string> = {
  'Colonia Escalón':  'San Salvador',
  'Soyapango Centro': 'Soyapango',
  'Mejicanos Norte':  'Mejicanos',
  'Ilopango Sur':     'Ilopango',
};

const TIPOS = ['Fuga de agua', 'Presión baja', 'Corte de servicio', 'Agua turbia', 'Otro'];

const P_STYLE: Record<string, { text: string; bg: string; border: string; label: string; leftBorder: string }> = {
  alta:  { text: 'text-red-400',   bg: 'bg-red-500/10',   border: 'border-red-500/20',   label: 'Alta',  leftBorder: 'priority-high'   },
  media: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Media', leftBorder: 'priority-medium' },
  baja:  { text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', label: 'Baja',  leftBorder: 'priority-low'    },
};

const E_STYLE: Record<string, { text: string; bg: string; border: string; label: string }> = {
  pendiente:    { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Pendiente'  },
  'en proceso': { text: 'text-aqua-cyan', bg: 'bg-aqua-cyan/10', border: 'border-aqua-cyan/20', label: 'En Proceso' },
  resuelto:     { text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', label: 'Resuelto'   },
};

const TIPO_ICON: Record<string, React.ElementType> = {
  'Fuga de agua':      Droplets,
  'Presión baja':      Zap,
  'Corte de servicio': AlertTriangle,
  'Agua turbia':       Droplets,
};

const TIPO_COLOR: Record<string, string> = {
  'Fuga de agua':      'text-blue-400 bg-blue-500/10',
  'Presión baja':      'text-amber-400 bg-amber-500/10',
  'Corte de servicio': 'text-red-400 bg-red-500/10',
  'Agua turbia':       'text-amber-400 bg-amber-500/10',
};

function fmtDate(val: string | Date) {
  try {
    const d = typeof val === 'string' ? new Date(val.replace(' ', 'T')) : val;
    return d.toLocaleString('es-SV', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return String(val); }
}

/* ── Modal crear / editar reporte ─────────────────────────────────── */
interface ModalProps {
  initial?: Partial<Reporte>;
  isAdmin: boolean;
  saving: boolean;
  onSave: (data: Partial<Reporte>) => Promise<void>;
  onClose: () => void;
}

function ReporteModal({ initial, isAdmin, saving, onSave, onClose }: ModalProps) {
  const [tipo,      setTipo]      = useState(initial?.tipo        ?? TIPOS[0]);
  const [zona,      setZona]      = useState(initial?.zona        ?? Object.keys(ZONAS_MAP)[0]);
  const [desc,      setDesc]      = useState(initial?.descripcion ?? '');
  const [prioridad, setPrioridad] = useState<string>(initial?.prioridad ?? 'media');
  const [estado,    setEstado]    = useState<string>(initial?.estado    ?? 'pendiente');

  const sector = ZONAS_MAP[zona] ?? zona;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#0a1518] border border-white/10 rounded-2xl shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h3 className="font-black text-white text-base">
            {initial?.id ? 'Editar Reporte' : 'Nuevo Reporte'}
          </h3>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={e => { e.preventDefault(); onSave({ tipo, zona, sector, descripcion: desc, prioridad: prioridad as any, estado: estado as any }); }}
          className="p-6 space-y-4">

          {/* Tipo */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Tipo de incidencia</label>
            <select value={tipo} onChange={e => setTipo(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-aqua-cyan/50 transition-all">
              {TIPOS.map(t => <option key={t} value={t} className="bg-[#0a1518]">{t}</option>)}
            </select>
          </div>

          {/* Zona */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Zona</label>
            <select value={zona} onChange={e => setZona(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-aqua-cyan/50 transition-all">
              {Object.keys(ZONAS_MAP).map(z => <option key={z} value={z} className="bg-[#0a1518]">{z}</option>)}
            </select>
            <p className="text-[10px] text-gray-600 ml-1">Sector: <span className="text-gray-400">{sector}</span></p>
          </div>

          {/* Prioridad */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Prioridad</label>
            <div className="flex gap-2">
              {(['alta', 'media', 'baja'] as const).map(p => (
                <button key={p} type="button" onClick={() => setPrioridad(p)}
                  className={`flex-1 py-2 rounded-xl text-xs font-black uppercase transition-all border ${
                    prioridad === p
                      ? `${P_STYLE[p].bg} ${P_STYLE[p].text} ${P_STYLE[p].border}`
                      : 'bg-white/[0.02] text-gray-500 border-white/[0.06] hover:border-white/15'
                  }`}>
                  {P_STYLE[p].label}
                </button>
              ))}
            </div>
          </div>

          {/* Estado — solo visible al editar y solo admin puede cambiarlo */}
          {initial?.id && (
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest flex items-center gap-2">
                Estado
                {!isAdmin && <span className="normal-case text-gray-600 font-medium">· solo admin puede cambiar esto</span>}
              </label>
              <div className="flex gap-2">
                {(['pendiente', 'en proceso', 'resuelto'] as const).map(s => (
                  <button key={s} type="button"
                    onClick={() => isAdmin && setEstado(s)}
                    disabled={!isAdmin}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${
                      estado === s
                        ? `${E_STYLE[s].bg} ${E_STYLE[s].text} ${E_STYLE[s].border}`
                        : 'bg-white/[0.02] text-gray-500 border-white/[0.06] disabled:opacity-30'
                    }`}>
                    {E_STYLE[s].label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Descripción */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Descripción</label>
            <textarea required rows={3} value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="Describe la incidencia con detalle..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-aqua-cyan/50 transition-all resize-none placeholder-gray-600" />
          </div>

          {/* Acciones */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-gray-400 font-bold text-sm hover:bg-white/[0.06] transition-colors disabled:opacity-50">
              Cancelar
            </button>
            <button type="submit" disabled={saving || !desc.trim()}
              className="flex-1 py-2.5 rounded-xl bg-aqua-cyan text-aqua-dark font-black text-sm hover:bg-aqua-cyan/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              {saving ? 'Guardando...' : initial?.id ? 'Guardar cambios' : 'Crear reporte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Sección de comentarios ────────────────────────────────────────── */
interface CommentProps {
  reporteId: number;
  userId: number;
  userRol: string;
  onCountChange: (delta: number) => void;
}

function ComentariosSection({ reporteId, userId, userRol, onCountChange }: CommentProps) {
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [loadingC,    setLoadingC]    = useState(true);
  const [texto,       setTexto]       = useState('');
  const [sending,     setSending]     = useState(false);

  useEffect(() => {
    axios.get<Comentario[]>(`/api/reportes/${reporteId}/comentarios`)
      .then(r => setComentarios(r.data))
      .catch(() => {})
      .finally(() => setLoadingC(false));
  }, [reporteId]);

  const addComentario = async () => {
    if (!texto.trim() || sending) return;
    setSending(true);
    try {
      const { data } = await axios.post<Comentario>(`/api/reportes/${reporteId}/comentarios`, { contenido: texto.trim() });
      setComentarios(prev => [...prev, data]);
      setTexto('');
      onCountChange(1);
    } catch { /* ignore */ }
    finally { setSending(false); }
  };

  const deleteComentario = async (cid: number) => {
    try {
      await axios.delete(`/api/reportes/${reporteId}/comentarios/${cid}`);
      setComentarios(prev => prev.filter(c => c.id !== cid));
      onCountChange(-1);
    } catch { /* ignore */ }
  };

  return (
    <div className="border-t border-white/[0.05] mt-4 pt-4 space-y-3">
      {loadingC ? (
        <p className="text-[11px] text-gray-600 animate-pulse">Cargando comentarios...</p>
      ) : comentarios.length === 0 ? (
        <p className="text-[11px] text-gray-600 italic">Sin comentarios todavía. ¡Sé el primero!</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
          {comentarios.map(c => (
            <div key={c.id} className="flex gap-2.5 group">
              <div className="w-6 h-6 rounded-lg bg-aqua-cyan/10 border border-aqua-cyan/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[8px] font-black text-aqua-cyan">{c.usuario.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 bg-white/[0.02] border border-white/[0.05] rounded-xl px-3 py-2">
                <div className="flex items-center justify-between mb-1 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[11px] font-black text-white truncate">{c.usuario}</span>
                    {c.rol === 'admin' && (
                      <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md bg-aqua-cyan/15 text-aqua-cyan border border-aqua-cyan/20 flex-shrink-0">
                        Admin
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] text-gray-600 hidden sm:block">{fmtDate(c.creado_en)}</span>
                    {(c.usuario_id === userId || userRol === 'admin') && (
                      <button onClick={() => deleteComentario(c.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all"
                        title="Eliminar comentario">
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[12px] text-gray-300 leading-relaxed">{c.contenido}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input nuevo comentario */}
      <div className="flex gap-2">
        <input
          type="text" value={texto}
          onChange={e => setTexto(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addComentario(); }}}
          placeholder="Escribe un comentario..."
          disabled={sending}
          className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-aqua-cyan/40 transition-colors disabled:opacity-50"
        />
        <button onClick={addComentario} disabled={!texto.trim() || sending}
          className="w-8 h-8 rounded-xl bg-aqua-cyan text-aqua-dark flex items-center justify-center hover:bg-aqua-cyan/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0">
          <Send size={13} />
        </button>
      </div>
    </div>
  );
}

/* ── Página principal ────────────────────────────────────────────────── */
export default function Reportes() {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'admin';

  const [reportes,   setReportes]   = useState<Reporte[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [filtro,     setFiltro]     = useState('todos');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showModal,  setShowModal]  = useState(false);
  const [editingR,   setEditingR]   = useState<Reporte | null>(null);
  const [saving,     setSaving]     = useState(false);
  const [errorMsg,   setErrorMsg]   = useState('');

  const fetchReportes = useCallback(() => {
    setLoading(true);
    axios.get<Reporte[]>('/api/reportes')
      .then(r => setReportes(r.data))
      .catch(() => setErrorMsg('Error al cargar reportes.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchReportes(); }, [fetchReportes]);

  /* ── Derivados ─────────────────────────────────────────────────── */
  const pendientes = reportes.filter(r => r.estado === 'pendiente').length;
  const enProceso  = reportes.filter(r => r.estado === 'en proceso').length;
  const resueltos  = reportes.filter(r => r.estado === 'resuelto').length;
  const filtrados  = filtro === 'todos' ? reportes : reportes.filter(r => r.estado === filtro);

  /* ── Handlers ──────────────────────────────────────────────────── */
  const openCreate = () => { setEditingR(null); setShowModal(true); };
  const openEdit   = (r: Reporte) => { setEditingR(r); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditingR(null); };

  const handleSave = async (data: Partial<Reporte>) => {
    setSaving(true);
    try {
      if (editingR) {
        await axios.put(`/api/reportes/${editingR.id}`, data);
        setReportes(prev => prev.map(r => r.id === editingR.id ? { ...r, ...data } : r));
      } else {
        const { data: created } = await axios.post<{ id: number }>('/api/reportes', data);
        const nuevo: Reporte = {
          id: created.id,
          tipo: data.tipo!,
          zona: data.zona!,
          sector: data.sector!,
          descripcion: data.descripcion!,
          estado: 'pendiente',
          prioridad: data.prioridad ?? 'media',
          usuario_id: user!.id,
          usuario: user!.Usuario,
          creado_en: new Date().toISOString(),
          total_comentarios: 0,
        };
        setReportes(prev => [nuevo, ...prev]);
      }
      closeModal();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error ?? 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este reporte y todos sus comentarios?')) return;
    try {
      await axios.delete(`/api/reportes/${id}`);
      setReportes(prev => prev.filter(r => r.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error ?? 'Error al eliminar');
    }
  };

  const updateCount = useCallback((reporteId: number, delta: number) => {
    setReportes(prev => prev.map(r =>
      r.id === reporteId ? { ...r, total_comentarios: Math.max(0, r.total_comentarios + delta) } : r
    ));
  }, []);

  /* ── Render ────────────────────────────────────────────────────── */
  const KPIS = [
    { label: 'Pendientes', value: pendientes, sub: 'Sin atender',      color: 'text-amber-400', bg: 'bg-amber-500/10', top: 'card-top-amber', icon: Clock       },
    { label: 'En Proceso', value: enProceso,  sub: 'Siendo atendidos', color: 'text-aqua-cyan', bg: 'bg-aqua-cyan/10', top: 'card-top-cyan',  icon: Zap         },
    { label: 'Resueltos',  value: resueltos,  sub: 'Cerrados',         color: 'text-green-400', bg: 'bg-green-500/10', top: 'card-top-green', icon: CheckCircle },
  ];

  const FILTERS = [
    { key: 'todos',      label: `Todos (${reportes.length})` },
    { key: 'pendiente',  label: `Pendientes (${pendientes})`  },
    { key: 'en proceso', label: `En Proceso (${enProceso})`   },
    { key: 'resuelto',   label: `Resueltos (${resueltos})`    },
  ];

  return (
    <div className="space-y-5 page-enter portal-grid-bg min-h-full pb-2">

      {showModal && (
        <ReporteModal
          initial={editingR ?? undefined}
          isAdmin={isAdmin}
          saving={saving}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}

      {/* Cabecera */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] text-aqua-cyan/60 uppercase tracking-[0.25em] font-bold mb-1">Gran San Salvador</p>
          <h2 className="text-3xl font-black tracking-tighter gradient-text">Reportes Ciudadanos</h2>
          <p className="text-sm text-gray-500 mt-1">Incidencias reportadas por la comunidad</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-aqua-cyan hover:bg-aqua-cyan/80 text-aqua-dark font-black px-4 py-2.5 rounded-xl text-xs transition-all shadow-lg shadow-aqua-cyan/10 active:scale-[0.97] flex-shrink-0 mt-1">
          <Plus size={14} />
          Nuevo Reporte
        </button>
      </div>

      {/* Error */}
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-between">
          <span>⚠ {errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-red-400 hover:text-red-300 ml-4"><X size={14} /></button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-3">
        {KPIS.map(k => (
          <div key={k.label} className={`portal-card ${k.top} p-5 flex items-center gap-4`}>
            <div className={`w-10 h-10 rounded-xl ${k.bg} flex items-center justify-center flex-shrink-0`}>
              <k.icon size={18} className={k.color} />
            </div>
            <div>
              <p className="text-2xl font-black text-white">{k.value}</p>
              <p className="text-[11px] font-bold text-gray-500">{k.label}</p>
              <p className={`text-[10px] font-bold mt-0.5 ${k.color}`}>{k.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
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

      {/* Lista */}
      {loading ? (
        <div className="portal-card p-10 text-center">
          <div className="w-6 h-6 border-2 border-aqua-cyan/30 border-t-aqua-cyan rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500 font-medium">Cargando reportes...</p>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="portal-card p-10 text-center">
          <FileText size={28} className="mx-auto mb-3 text-gray-600" />
          <p className="text-sm font-bold text-gray-500">No hay reportes con este filtro.</p>
          {filtro === 'todos' && (
            <button onClick={openCreate} className="mt-3 text-xs font-bold text-aqua-cyan hover:underline">
              + Crear el primer reporte
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtrados.map(r => {
            const TipoIcon   = TIPO_ICON[r.tipo]   ?? FileText;
            const tipoColor  = TIPO_COLOR[r.tipo]  ?? 'text-gray-400 bg-white/5';
            const p          = P_STYLE[r.prioridad] ?? P_STYLE.media;
            const e          = E_STYLE[r.estado]    ?? E_STYLE.pendiente;
            const isExpanded = expandedId === r.id;
            const canEdit   = isAdmin;
            const canDelete = isAdmin || r.usuario_id === user?.id;

            return (
              <div key={r.id} className={`portal-card ${p.leftBorder} overflow-hidden transition-all duration-200`}>
                <div className="p-5">
                  <div className="flex items-start gap-4">

                    {/* Ícono tipo */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${tipoColor}`}>
                      <TipoIcon size={18} />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Título + badges */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-black text-white text-sm">{r.tipo}</h3>
                        <span className={`text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full border ${p.text} ${p.bg} ${p.border}`}>
                          ● {p.label}
                        </span>
                        <span className={`text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full border ${e.text} ${e.bg} ${e.border}`}>
                          {e.label}
                        </span>
                      </div>

                      <p className="text-sm text-gray-400 leading-relaxed mb-3">{r.descripcion}</p>

                      {/* Metadata */}
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                          <MapPin size={10} className="text-gray-600" />
                          <span>{r.zona}, {r.sector}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                          <Clock size={10} className="text-gray-600" />
                          <span>{fmtDate(r.creado_en)}</span>
                        </div>
                        <div className="text-[10px] text-gray-500">
                          Por: <span className="text-gray-300 font-bold">{r.usuario}</span>
                        </div>
                      </div>
                    </div>

                    {/* ID + acciones */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className="text-[10px] text-gray-600 font-mono bg-white/[0.03] border border-white/[0.06] px-2 py-1 rounded-lg hidden sm:block">
                        #R-{String(r.id).padStart(3, '0')}
                      </span>
                      {(canEdit || canDelete) && (
                        <div className="flex gap-1.5">
                          {canEdit && (
                            <button onClick={() => openEdit(r)}
                              className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.07] text-gray-500 hover:text-aqua-cyan hover:border-aqua-cyan/30 flex items-center justify-center transition-all"
                              title="Editar reporte">
                              <Edit2 size={12} />
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => handleDelete(r.id)}
                              className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.07] text-gray-500 hover:text-red-400 hover:border-red-500/30 flex items-center justify-center transition-all"
                              title="Eliminar reporte">
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Toggle comentarios */}
                  <div className="mt-4 pt-3 border-t border-white/[0.04]">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : r.id)}
                      className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 hover:text-aqua-cyan transition-colors">
                      <MessageSquare size={12} />
                      {isExpanded ? 'Ocultar comentarios' : 'Ver comentarios'}
                      {r.total_comentarios > 0 && (
                        <span className="bg-aqua-cyan/15 text-aqua-cyan text-[10px] font-black px-1.5 py-0.5 rounded-md">
                          {r.total_comentarios}
                        </span>
                      )}
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>

                    {isExpanded && user && (
                      <ComentariosSection
                        reporteId={r.id}
                        userId={user!.id}
                        userRol={user.rol}
                        onCountChange={delta => updateCount(r.id, delta)}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

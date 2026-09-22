import { useCallback, useEffect, useState } from 'react';
import { Send, Trash2, MessageSquare } from 'lucide-react';
import axios from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { useConfirm } from './ConfirmDialog';
import { formatReportDate } from '../data/reportes';

interface Comment { id: number; usuario_id: number; usuario: string; rol: string; contenido: string; creado_en: string }
export default function ReportComments({ reportId, onChange }: { reportId: number; onChange: () => void }) {
  const { user } = useAuth();
  const { t } = useLang();
  const confirm = useConfirm();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async (signal?: AbortSignal) => {
    try { const { data } = await axios.get<Comment[]>(`/api/reportes/${reportId}/comentarios`, { signal }); setComments(data); setError(''); }
    catch (err) { if (!axios.isCancel(err)) setError('No se pudieron cargar los comentarios.'); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [reportId]);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);
  const send = async (event: React.FormEvent) => {
    event.preventDefault(); if (!text.trim() || sending) return;
    setSending(true); setError('');
    try { const { data } = await axios.post<Comment>(`/api/reportes/${reportId}/comentarios`, { contenido: text.trim() }); setComments(previous => [...previous, data]); setText(''); onChange(); }
    catch { setError('No se pudo enviar el comentario. Intenta nuevamente.'); }
    finally { setSending(false); }
  };
  const remove = async (id: number) => {
    if (!await confirm({ message: t('¿Eliminar este comentario?'), danger: true })) return;
    try { await axios.delete(`/api/reportes/${reportId}/comentarios/${id}`); setComments(previous => previous.filter(c => c.id !== id)); onChange(); }
    catch { setError('No se pudo eliminar el comentario.'); }
  };
  return <section className="report-comments" aria-label={t('Comentarios')}>
    <h3><MessageSquare size={16} />{t('Seguimiento')}<span>{comments.length}</span></h3>
    {loading ? <p className="report-muted" role="status">{t('Cargando comentarios...')}</p> : comments.length === 0 && <p className="report-muted">{t('Aún no hay comentarios.')}</p>}
    {error && <div className="report-inline-error" role="alert">{t(error)}<button type="button" onClick={() => void load()}>{t('Actualizar')}</button></div>}
    {comments.map(comment => <article key={comment.id} className="report-comment"><div className="report-comment-heading"><strong>{comment.usuario}</strong>{comment.rol === 'admin' && <span className="report-admin-label">{t('Administrador')}</span>}
      {(comment.usuario_id === user?.id || user?.rol === 'admin') && <button type="button" className="report-icon-button" aria-label={t('Eliminar comentario')} title={t('Eliminar comentario')} onClick={() => void remove(comment.id)}><Trash2 size={14} /></button>}</div>
      <p>{comment.contenido}</p><time dateTime={comment.creado_en}>{formatReportDate(comment.creado_en)}</time></article>)}
    <form onSubmit={send} className="report-comment-form"><label className="sr-only" htmlFor="report-comment">{t('Nuevo comentario')}</label><textarea id="report-comment" rows={2} value={text} onChange={e => setText(e.target.value)} maxLength={2000} placeholder={t('Añade una actualización...')} disabled={sending} /><button type="submit" className="report-icon-button" disabled={sending || !text.trim()} aria-label={t('Enviar comentario')} title={t('Enviar comentario')}><Send size={17} /></button></form>
  </section>;
}

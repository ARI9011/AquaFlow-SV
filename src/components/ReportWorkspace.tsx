import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Activity, ArrowLeft, ArrowUpRight, Check, CheckCircle2, ChevronRight, Clock3, Droplets, FileText, List, Loader2, Map, MapPin, MessageSquare, Plus, RefreshCw, Search, Send, SlidersHorizontal, Trash2, X } from 'lucide-react';
import axios from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext';
import { useLang } from '../context/LanguageContext';
import { useToast } from './Toast';
import { useConfirm } from './ConfirmDialog';
import { ZONAS_VERDADERAS } from '../data/zonas';
import ReportMap from './ReportMap';
import ReportComments from './ReportComments';
import { REPORT_TYPES, STATUS, draftKey, formatReportDate, inCoverage, nearestZone, newDraft, readDraft, reportPoint } from '../data/reportes';
import type { MapPoint, Priority, Report, ReportDraft, ReportStatus } from '../data/reportes';
import './reportes.css';

function StatusBadge({ status }: { status: ReportStatus }) {
  const { t } = useLang();
  const value = STATUS[status] || STATUS.pendiente;
  return <span className={`report-status ${value.className}`}><i />{t(value.label)}</span>;
}
export default function ReportWorkspace({ mapPage = false }: { mapPage?: boolean }) {
  const { user } = useAuth();
  const { pollingMs, tiempoReal } = useConfig();
  const { t } = useLang();
  const toast = useToast();
  const confirm = useConfirm();
  const [params, setParams] = useSearchParams();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [draft, setDraft] = useState<ReportDraft | null>(() => user ? readDraft(user.id) : null);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(() => Number(params.get('reporte')) || null);
  const [view, setView] = useState<'map' | 'list'>('map');
  const [status, setStatus] = useState<ReportStatus | 'todos'>('todos');
  const [mine, setMine] = useState(false);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('recent');
  const [zones, setZones] = useState(mapPage);
  const [focus, setFocus] = useState<MapPoint | null>(draft?.point || null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const sideRef = useRef<HTMLElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const submitting = useRef(false);
  const zoneFilter = params.get('zona');
  const typeFilter = params.get('tipo');
  const selected = reports.find(report => report.id === selectedId) || null;
  const panelOpen = Boolean(draft || selected);

  const refresh = useCallback(async (silent = false) => {
    requestRef.current?.abort();
    const controller = new AbortController(); requestRef.current = controller;
    if (!silent) setRefreshing(true);
    try {
      const { data } = await axios.get<Report[]>('/api/reportes', { signal: controller.signal });
      if (!Array.isArray(data)) throw new Error('Invalid reports');
      setReports(data); setLoadError(''); setLastUpdated(new Date());
    } catch (err) { if (!axios.isCancel(err)) setLoadError('No pudimos actualizar los reportes. Comprueba la conexión e intenta de nuevo.'); }
    finally { if (!controller.signal.aborted) { setLoading(false); setRefreshing(false); } }
  }, []);
  useEffect(() => {
    void refresh();
    const update = () => { if (!submitting.current) void refresh(true); };
    window.addEventListener('focus', update); window.addEventListener('online', update);
    return () => { requestRef.current?.abort(); window.removeEventListener('focus', update); window.removeEventListener('online', update); };
  }, [refresh]);
  useEffect(() => {
    if (!pollingMs) return;
    const timer = setInterval(() => { if (!submitting.current) void refresh(true); }, pollingMs);
    return () => clearInterval(timer);
  }, [pollingMs, refresh]);
  useEffect(() => {
    if (!tiempoReal) return;
    const stream = new EventSource('/api/reportes/stream');
    stream.onmessage = () => { if (!submitting.current) void refresh(true); };
    return () => stream.close();
  }, [tiempoReal, refresh]);
  useEffect(() => {
    if (!user) return;
    try { if (draft) localStorage.setItem(draftKey(user.id), JSON.stringify(draft)); else localStorage.removeItem(draftKey(user.id)); }
    catch { /* El envío a MySQL no depende del almacenamiento local. */ }
  }, [draft, user]);
  useEffect(() => { if (selectedId && selected && !focus) setFocus(reportPoint(selected)); }, [selectedId, selected, focus]);

  const scoped = useMemo(() => reports.filter(r => !mine || r.usuario_id === user?.id)
    .filter(r => !zoneFilter || r.zona === zoneFilter).filter(r => !typeFilter || r.tipo === typeFilter), [reports, mine, user?.id, zoneFilter, typeFilter]);
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('es');
    const priorities = { alta: 0, media: 1, baja: 2 };
    return scoped.filter(r => status === 'todos' || r.estado === status)
      .filter(r => !query || `${r.id} ${r.tipo} ${r.zona} ${r.descripcion}`.toLocaleLowerCase('es').includes(query))
      .sort((a, b) => sort === 'oldest' ? a.id - b.id : sort === 'priority' ? priorities[a.prioridad] - priorities[b.prioridad] || b.id - a.id : b.id - a.id);
  }, [scoped, status, search, sort]);
  const withoutPoint = filtered.filter(r => !reportPoint(r)).length;
  const revealPanel = () => requestAnimationFrame(() => {
    sideRef.current?.focus({ preventScroll: true });
    if (window.innerWidth < 1100) sideRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  });
  const pickPoint = (point: MapPoint) => {
    if (submitting.current || !inCoverage(point)) return;
    setDraft(previous => ({ ...(previous || newDraft()), point, zona: nearestZone(point).nombre }));
    setSelectedId(null); setSaveError(''); setView('map'); revealPanel();
  };
  const startReport = () => { setDraft(previous => previous || newDraft()); setSelectedId(null); setSaveError(''); setView('map'); revealPanel(); };
  const selectReport = async (report: Report) => {
    if (submitting.current) return;
    if (draft && !await confirm({ message: t('¿Descartar el borrador para abrir este reporte?') })) return;
    setDraft(null); setSaveError(''); setSelectedId(report.id); setFocus(reportPoint(report)); revealPanel();
  };
  const discardDraft = async () => {
    if (submitting.current) return;
    if (draft?.descripcion.trim() && !await confirm({ message: t('¿Descartar este borrador?'), danger: true })) return;
    setDraft(null); setSaveError('');
  };
  const changeDraft = (patch: Partial<ReportDraft>) => setDraft(previous => previous ? { ...previous, ...patch } : previous);
  const saveReport = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft || submitting.current || !user) return;
    if (!draft.point || !inCoverage(draft.point)) { setSaveError('Falta seleccionar la ubicación del reporte.'); return; }
    if (!draft.descripcion.trim()) { setSaveError('Describe la incidencia antes de enviar.'); return; }
    const zone = ZONAS_VERDADERAS.find(z => z.nombre === draft.zona);
    if (!zone) return;
    submitting.current = true; setSaving(true); setSaveError(''); requestRef.current?.abort();
    try {
      const { data } = await axios.post<Report>('/api/reportes', {
        tipo: draft.tipo, zona: zone.nombre, sector: zone.sector, descripcion: draft.descripcion.trim(), prioridad: draft.prioridad,
        latitud: draft.point.lat, longitud: draft.point.lng, solicitud_id: draft.solicitud_id,
      }, { timeout: 20000 });
      if (!data.id || !reportPoint(data)) throw new Error('Missing saved coordinates');
      setReports(previous => [data, ...previous.filter(r => r.id !== data.id)]);
      setSelectedId(data.id); setFocus(reportPoint(data)); setDraft(null); setStatus('todos'); setSearch('');
      setParams({ reporte: String(data.id) }, { replace: true }); setLastUpdated(new Date()); setLoadError('');
      toast(`${t('Reporte guardado')} #${data.id}`);
    } catch (err) {
      setSaveError(axios.isAxiosError(err) ? err.response?.data?.error || 'No se confirmó el envío. Tu borrador sigue disponible; puedes reintentar sin duplicar el reporte.' : 'No se pudo confirmar la ubicación guardada. Intenta nuevamente.');
    } finally { submitting.current = false; setSaving(false); setLoading(false); setRefreshing(false); }
  };
  const deleteReport = async (report: Report) => {
    if (!await confirm({ message: t('¿Eliminar este reporte y todos sus comentarios? Esta acción no se puede deshacer.'), danger: true })) return;
    try { await axios.delete(`/api/reportes/${report.id}`); setReports(previous => previous.filter(r => r.id !== report.id)); setSelectedId(null); toast(t('Reporte eliminado')); }
    catch { toast(t('No se pudo eliminar el reporte.'), 'error'); }
  };

  const reportList = <div className="report-results" aria-busy={loading}>
    <div className="report-results-heading"><h2><MapPin size={16} />{t(mine ? 'Mis reportes' : 'Actividad de la comunidad')}</h2><span>{filtered.length}</span></div>
    {loading ? <div className="report-empty" role="status"><Loader2 size={26} className="animate-spin" /><p>{t('Cargando reportes...')}</p></div> : loadError && !reports.length ? <div className="report-empty"><FileText size={28} /><h3>{t('Reportes no disponibles')}</h3><button className="report-button" onClick={() => void refresh()}>{t('Reintentar')}</button></div> : !filtered.length ? <div className="report-empty"><img src="/aquabot-sin-datos.png" alt="" width="72" height="72" /><h3>{t('No hay reportes con estos filtros')}</h3><button className="report-button" onClick={() => { setStatus('todos'); setMine(false); setSearch(''); setParams({}); }}>{t('Ver todos')}</button></div> : filtered.map(report =>
      <button type="button" key={report.id} onClick={() => void selectReport(report)} className={`portal-card report-row ${selectedId === report.id ? 'is-active' : ''}`} style={{ borderTopColor: (STATUS[report.estado] || STATUS.pendiente).color }} aria-pressed={selectedId === report.id}>
        <div className="report-row-top"><span className="report-number">#{String(report.id).padStart(3, '0')}</span><StatusBadge status={report.estado} /></div>
        <h3>{t(report.tipo)}<ChevronRight size={16} /></h3><p className="report-row-description">{report.descripcion}</p>
        <div className="report-row-location"><MapPin size={13} /><span>{report.zona}</span>{!reportPoint(report) && <span className="report-no-point">{t('Sin ubicación')}</span>}</div>
        <div className="report-row-bottom"><time dateTime={report.creado_en}>{formatReportDate(report.creado_en)}</time><span><MessageSquare size={12} />{report.total_comentarios}</span></div>
      </button>)}
  </div>;
  const listOrder = <div className="report-list-order"><label htmlFor="report-sort">{t('Ordenar por')}</label><select id="report-sort" aria-label={t('Ordenar reportes')} value={sort} onChange={e => setSort(e.target.value)}><option value="recent">{t('Más recientes')}</option><option value="oldest">{t('Más antiguos')}</option><option value="priority">{t('Prioridad')}</option></select></div>;
  return <div className="reports-workspace page-enter portal-grid-bg">
    <div className="report-page-heading"><div><div className="report-eyebrow">AquaFlow SV <span>/ {t('Gran San Salvador')}</span></div><h1 className="gradient-text">{t(mapPage ? 'Mapa de la comunidad' : 'Reportes ciudadanos')}</h1></div>
      <div className="report-heading-actions"><Link className="report-button report-monitor-link" to="/mapa?vista=zonas">{t('Monitoreo de zonas')}<ArrowUpRight size={15} /></Link><button type="button" className="report-button report-button-primary" onClick={startReport} disabled={saving}><Plus size={17} />{t(draft ? 'Continuar reporte' : 'Nuevo reporte')}</button></div>
    </div>
    <div className="report-summary" aria-label={t('Resumen de reportes')}>
      <button type="button" className="portal-card card-top-cyan" aria-pressed={status === 'todos'} onClick={() => setStatus('todos')}><span className="report-summary-icon"><FileText size={18} /></span><span className="report-summary-value"><strong>{loading ? '—' : scoped.length}</strong><span>{t('Reportes')}</span></span></button>
      <button type="button" aria-pressed={status === 'pendiente'} onClick={() => setStatus('pendiente')} className="portal-card card-top-amber status-pending"><span className="report-summary-icon"><Clock3 size={18} /></span><span className="report-summary-value"><strong>{loading ? '—' : scoped.filter(r => r.estado === 'pendiente').length}</strong><span>{t('Pendientes')}</span></span></button>
      <button type="button" aria-pressed={status === 'en proceso'} onClick={() => setStatus('en proceso')} className="portal-card card-top-cyan status-progress"><span className="report-summary-icon"><Droplets size={18} /></span><span className="report-summary-value"><strong>{loading ? '—' : scoped.filter(r => r.estado === 'en proceso').length}</strong><span>{t('En proceso')}</span></span></button>
      <button type="button" aria-pressed={status === 'resuelto'} onClick={() => setStatus('resuelto')} className="portal-card card-top-green status-resolved"><span className="report-summary-icon"><CheckCircle2 size={18} /></span><span className="report-summary-value"><strong>{loading ? '—' : scoped.filter(r => r.estado === 'resuelto').length}</strong><span>{t('Resueltos')}</span></span></button>
    </div>
    {loadError && <div className="report-inline-error" role="alert"><span>{t(loadError)}</span><button onClick={() => void refresh()} disabled={refreshing}><RefreshCw size={14} />{t('Reintentar')}</button></div>}
    {(zoneFilter || typeFilter) && <div className="report-filter-notice"><span>{zoneFilter}{typeFilter ? ` · ${typeFilter}` : ''}</span><button aria-label={t('Quitar filtro de alerta')} onClick={() => setParams({})}><X size={15} /></button></div>}
    <div className="report-toolbar">
      <div className="report-search"><Search size={17} /><input aria-label={t('Buscar reportes')} value={search} onChange={e => setSearch(e.target.value)} placeholder={t('Buscar zona, incidencia o número...')} />{search && <button aria-label={t('Limpiar búsqueda')} title={t('Limpiar búsqueda')} onClick={() => setSearch('')}><X size={14} /></button>}</div>
      <label className="report-state-select"><SlidersHorizontal size={15} /><select aria-label={t('Estado del reporte')} value={status} onChange={e => setStatus(e.target.value as typeof status)}><option value="todos">{t('Todos los estados')}</option>{Object.entries(STATUS).map(([key, v]) => <option key={key} value={key}>{t(v.label)}</option>)}</select></label>
      <label className="report-checkbox"><input type="checkbox" checked={mine} onChange={e => setMine(e.target.checked)} />{t('Solo mis reportes')}</label>
      <div className="report-view-switch" role="group" aria-label={t('Vista de reportes')}><button title={t('Mapa')} aria-label={t('Mapa')} aria-pressed={view === 'map'} onClick={() => setView('map')}><Map size={17} /></button><button title={t('Lista')} aria-label={t('Lista')} aria-pressed={view === 'list'} onClick={() => setView('list')}><List size={17} /></button></div>
      <button className="report-icon-button" title={t('Actualizar reportes')} aria-label={t('Actualizar reportes')} disabled={refreshing || saving} onClick={() => void refresh()}><RefreshCw size={17} className={refreshing ? 'animate-spin' : ''} /></button>
    </div>
    <div className={`report-workbench ${panelOpen ? 'has-panel' : ''} ${view === 'list' ? 'is-list-view' : ''}`}>
      <section className={`report-main-surface ${view === 'map' ? 'portal-card' : ''}`} aria-label={t(view === 'map' ? 'Mapa de incidencias' : 'Listado de incidencias')}>
        {view === 'map' ? <><div className="report-map-heading"><div className="report-map-title"><span className="report-map-heading-icon"><Activity size={16} /></span><div><h2>{t('Mapa de reportes')}</h2><p>{t('Gran San Salvador')}</p></div></div><label className="report-checkbox"><input type="checkbox" checked={zones} onChange={e => setZones(e.target.checked)} />{t('Zonas de referencia')}</label></div>
          <ReportMap reports={filtered} selectedId={selectedId} point={draft?.point || null} focus={focus} zones={zones} disabled={saving} onPick={pickPoint} onSelect={report => void selectReport(report)} onError={message => toast(message, 'error')} />
          <div className="report-map-footer"><span>{filtered.length - withoutPoint} {t('ubicados')}{withoutPoint > 0 && ` · ${withoutPoint} ${t('sin ubicación exacta')}`}</span><span>{lastUpdated && `${t('Actualizado')} ${lastUpdated.toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' })}`}</span></div></> : <>{listOrder}{reportList}</>}
      </section>
      {panelOpen && <aside ref={sideRef} tabIndex={-1} className="portal-card report-side-panel" aria-label={t(draft ? 'Nuevo reporte' : 'Detalle del reporte')}>
        {draft ? <><div className="report-panel-heading"><div><span className="report-eyebrow">{t('Reporte nuevo')}</span><h2>{t('Reportar incidencia')}</h2></div><button className="report-icon-button" title={t('Descartar borrador')} aria-label={t('Descartar borrador')} onClick={() => void discardDraft()} disabled={saving}><X size={18} /></button></div>
          <form className="report-form" onSubmit={saveReport}><fieldset disabled={saving}>
            <div className={`report-location ${draft.point ? 'has-location' : ''}`}><MapPin size={19} /><div><strong>{t(draft.point ? 'Ubicación seleccionada' : 'Ubicación pendiente')}</strong><span>{draft.point ? `${draft.point.lat.toFixed(6)}, ${draft.point.lng.toFixed(6)}` : t('Gran San Salvador')}</span></div>{draft.point && <Check size={17} />}</div>
            <label className="report-field">{t('Zona de referencia')}<select value={draft.zona} onChange={e => changeDraft({ zona: e.target.value })}>{ZONAS_VERDADERAS.map(z => <option key={z.id}>{z.nombre}</option>)}</select></label>
            {!draft.point && <button type="button" className="report-text-button" onClick={() => { const z = ZONAS_VERDADERAS.find(z => z.nombre === draft.zona)!; const point = { lat: z.lat, lng: z.lng }; pickPoint(point); setFocus(point); }}><MapPin size={14} />{t('Usar el centro de esta zona')}</button>}
            <label className="report-field">{t('Tipo de incidencia')}<select value={draft.tipo} onChange={e => changeDraft({ tipo: e.target.value })}>{REPORT_TYPES.map(type => <option key={type} value={type}>{t(type)}</option>)}</select></label>
            <label className="report-field" htmlFor="report-description">{t('Descripción')}<textarea id="report-description" aria-label={t('Descripción')} required rows={4} maxLength={5000} value={draft.descripcion} onChange={e => changeDraft({ descripcion: e.target.value })} placeholder={t('¿Qué está ocurriendo en este lugar?')} /><span className="report-character-count" aria-hidden="true">{draft.descripcion.length}/5000</span></label>
            <div className="report-field"><span>{t('Prioridad')}</span><div className="report-priority" role="radiogroup" aria-label={t('Prioridad')}>{(['baja', 'media', 'alta'] as Priority[]).map(priority => <label key={priority}><input type="radio" name="prioridad" value={priority} checked={draft.prioridad === priority} onChange={() => changeDraft({ prioridad: priority })} /><span>{t(priority === 'alta' ? 'Alta' : priority === 'media' ? 'Media' : 'Baja')}</span></label>)}</div></div>
          </fieldset>{saveError && <div className="report-inline-error" role="alert">{t(saveError)}</div>}<button type="submit" className="report-button report-button-primary report-submit" disabled={saving || !draft.point || !draft.descripcion.trim()}>{saving ? <Loader2 size={17} className="animate-spin" /> : <Send size={16} />}{t(saving ? 'Guardando reporte...' : 'Enviar reporte')}</button></form></> : selected ? <>
            <div className="report-panel-heading"><button className="report-text-button" onClick={() => { setSelectedId(null); setParams(previous => { previous.delete('reporte'); return previous; }, { replace: true }); }}><ArrowLeft size={16} />{t('Reportes')}</button><span className="report-number">#{String(selected.id).padStart(3, '0')}</span></div>
            <div className="report-detail"><StatusBadge status={selected.estado} /><h2>{t(selected.tipo)}</h2><div className="report-detail-zone"><MapPin size={16} /><span>{selected.zona}<small>{selected.sector}</small></span></div><p className="report-detail-description">{selected.descripcion}</p>
              <dl className="report-metadata"><div><dt>{t('Prioridad')}</dt><dd>{t(selected.prioridad === 'alta' ? 'Alta' : selected.prioridad === 'media' ? 'Media' : 'Baja')}</dd></div><div><dt>{t('Reportado por')}</dt><dd>{selected.usuario}</dd></div><div><dt>{t('Fecha')}</dt><dd>{formatReportDate(selected.creado_en)}</dd></div><div><dt>{t('Ubicación')}</dt><dd>{reportPoint(selected) ? `${Number(selected.latitud).toFixed(6)}, ${Number(selected.longitud).toFixed(6)}` : t('Sin ubicación exacta')}</dd></div></dl>
              <ol className="report-timeline" aria-label={t('Estado de atención')}>{Object.entries(STATUS).map(([key, v], i) => <li key={key} className={i <= Object.keys(STATUS).indexOf(selected.estado) ? 'is-complete' : ''}><span>{i <= Object.keys(STATUS).indexOf(selected.estado) ? <Check size={12} /> : i + 1}</span>{t(v.label)}</li>)}</ol>
              {user?.rol === 'admin' && <Link className="report-button" to={`/reportes?reporte=${selected.id}`}>{t('Gestionar reporte')}<ArrowUpRight size={15} /></Link>}
              <ReportComments key={selected.id} reportId={selected.id} onChange={() => void refresh(true)} />
              {(user?.id === selected.usuario_id || user?.rol === 'admin') && <button className="report-text-button report-delete" onClick={() => void deleteReport(selected)}><Trash2 size={14} />{t('Eliminar reporte')}</button>}
            </div></> : null}
      </aside>}
    </div>
    {view === 'map' && !panelOpen && <section className="report-feed" aria-label={t('Reportes recientes')}>{listOrder}{reportList}</section>}
  </div>;
}

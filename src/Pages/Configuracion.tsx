import React, { useEffect, useState } from 'react';
import { Bell, RefreshCw, Zap, Moon, Sun, Shield, Save, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext';
import { useLang } from '../context/LanguageContext';

const Toggle = ({ value, onChange, disabled = false }: {
  value: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) => (
  <button
    onClick={() => !disabled && onChange(!value)}
    className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
      disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
    } ${value ? 'bg-aqua-cyan' : 'bg-ink/10'}`}
  >
    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${value ? 'left-6' : 'left-1'}`} />
  </button>
);

const SettingRow = ({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between flex-wrap gap-3 py-4 border-b border-ink/5 last:border-0">
    <div className="mr-4 min-w-0">
      <p className="text-sm font-bold text-ink">{label}</p>
      {sub && <p className="text-[11px] text-gray-500 mt-0.5">{sub}</p>}
    </div>
    <div className="flex-shrink-0">{children}</div>
  </div>
);

function Section({
  icon: Icon, title, top = 'card-top-cyan', children,
}: {
  icon: React.ElementType; title: string; top?: string; children: React.ReactNode;
}) {
  return (
    <div className={`portal-card ${top} overflow-hidden`}>
      <div className="p-5 border-b border-ink/5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-aqua-cyan/10 flex items-center justify-center">
          <Icon size={16} className="text-aqua-cyan" />
        </div>
        <h3 className="font-bold text-base text-ink">{title}</h3>
      </div>
      <div className="px-6 py-2">{children}</div>
    </div>
  );
}

export default function Configuracion() {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'admin';
  const { sistema, notificaciones, configLoading, tema, setTema, updateNotificaciones, updateSistema } = useConfig();
  const { t } = useLang();
  const esOscuro = tema === 'oscuro';

  // Borrador local editable, sembrado desde el contexto cuando termina de cargar.
  const [notifAlertas,  setNotifAlertas]  = useState(notificaciones.notif_alertas);
  const [notifReportes, setNotifReportes] = useState(notificaciones.notif_reportes);
  const [notifSensores, setNotifSensores] = useState(notificaciones.notif_sensores);
  const [autoRefresh,   setAutoRefresh]   = useState(sistema.auto_refresh);
  const [intervalo,     setIntervalo]     = useState(String(sistema.intervalo));
  const [umbralPresion, setUmbralPresion] = useState(String(sistema.umbral_presion));
  const [umbralFlujo,   setUmbralFlujo]   = useState(String(sistema.umbral_flujo));

  useEffect(() => {
    if (configLoading) return;
    setNotifAlertas(notificaciones.notif_alertas);
    setNotifReportes(notificaciones.notif_reportes);
    setNotifSensores(notificaciones.notif_sensores);
    setAutoRefresh(sistema.auto_refresh);
    setIntervalo(String(sistema.intervalo));
    setUmbralPresion(String(sistema.umbral_presion));
    setUmbralFlujo(String(sistema.umbral_flujo));
  }, [configLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState('');

  const guardar = async () => {
    setSaving(true);
    setError('');
    try {
      await updateNotificaciones({
        notif_alertas: notifAlertas,
        notif_reportes: notifReportes,
        notif_sensores: notifSensores,
      });
      if (isAdmin) {
        await updateSistema({
          auto_refresh: autoRefresh,
          intervalo: Number(intervalo),
          umbral_presion: Number(umbralPresion),
          umbral_flujo: Number(umbralFlujo),
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError(t('No se pudo guardar la configuración. Intenta de nuevo.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 page-enter portal-grid-bg min-h-full pb-2">

      {/* ENCABEZADO */}
      <div>
        <p className="text-[10px] text-aqua-cyan/60 uppercase tracking-[0.25em] font-bold mb-1">{t('Panel de Control')}</p>
        <h2 className="text-3xl font-black tracking-tighter gradient-text">{t('Configuración')}</h2>
        <p className="text-sm text-gray-500 mt-1">{t('Personaliza las preferencias y umbrales de AquaFlow SV')}</p>
      </div>

      {/* NOTIFICACIONES */}
      <Section icon={Bell} title={t('Notificaciones')} top="card-top-cyan">
        <SettingRow label={t('Alertas del sistema')} sub={t('Avisar cuando un sensor detecte valores críticos')}>
          <Toggle value={notifAlertas} onChange={setNotifAlertas} disabled={configLoading} />
        </SettingRow>
        <SettingRow label={t('Nuevos reportes ciudadanos')} sub={t('Notificación al recibir un reporte de la comunidad')}>
          <Toggle value={notifReportes} onChange={setNotifReportes} disabled={configLoading} />
        </SettingRow>
        <SettingRow label={t('Estado de sensores')} sub={t('Avisar cuando un sensor se desconecte o reconecte')}>
          <Toggle value={notifSensores} onChange={setNotifSensores} disabled={configLoading} />
        </SettingRow>
      </Section>

      {/* APARIENCIA */}
      <Section icon={esOscuro ? Moon : Sun} title={t('Apariencia')} top="card-top-blue">
        <SettingRow
          label={esOscuro ? t('Modo oscuro') : t('Modo claro')}
          sub={esOscuro
            ? t('Optimizado para monitoreo nocturno y bajo consumo visual')
            : t('Vista previa clara y cómoda para uso diurno')}
        >
          <Toggle value={esOscuro} onChange={(v) => setTema(v ? 'oscuro' : 'claro')} />
        </SettingRow>
      </Section>

      {isAdmin && (
        <>
          {/* ACTUALIZACIÓN DE DATOS */}
          <Section icon={RefreshCw} title={t('Actualización de datos')} top="card-top-blue">
            <SettingRow label={t('Actualización automática')} sub={t('Refrescar Reportes y Alertas periódicamente para todos los usuarios')}>
              <Toggle value={autoRefresh} onChange={setAutoRefresh} disabled={configLoading} />
            </SettingRow>
            <SettingRow label={t('Intervalo de actualización')} sub={t('Cada cuánto se refrescan los datos en toda la plataforma')}>
              <select
                value={intervalo}
                onChange={(e) => setIntervalo(e.target.value)}
                disabled={!autoRefresh || configLoading}
                className={`bg-[var(--color-aqua-panel)] border border-ink/10 rounded-xl px-4 py-2 text-ink text-sm outline-none focus:border-aqua-cyan/50 transition-opacity ${
                  !autoRefresh ? 'opacity-40 cursor-not-allowed' : ''
                }`}
              >
                <option value="0">{t('Tiempo real (sin intervalo)')}</option>
                <option value="10">10 {t('segundos')}</option>
                <option value="30">30 {t('segundos')}</option>
                <option value="60">1 {t('minuto')}</option>
                <option value="300">5 {t('minutos')}</option>
              </select>
            </SettingRow>
          </Section>

          {/* UMBRALES DE ALERTA */}
          <Section icon={Zap} title={t('Umbrales de alerta')} top="card-top-amber">
            <SettingRow label={t('Presión mínima aceptable')} sub={t('Valor de referencia; aún no se genera desde sensores en vivo')}>
              <div className="flex items-center gap-2">
                <input type="number" value={umbralPresion} onChange={(e) => setUmbralPresion(e.target.value)}
                  disabled={configLoading}
                  className="w-20 bg-[var(--color-aqua-panel)] border border-ink/10 rounded-xl px-3 py-2 text-ink text-sm text-center outline-none focus:border-aqua-cyan/50 font-mono disabled:opacity-40"
                />
                <span className="text-gray-500 text-sm">PSI</span>
              </div>
            </SettingRow>
            <SettingRow label={t('Flujo mínimo aceptable')} sub={t('Valor de referencia; aún no se genera desde sensores en vivo')}>
              <div className="flex items-center gap-2">
                <input type="number" value={umbralFlujo} onChange={(e) => setUmbralFlujo(e.target.value)}
                  disabled={configLoading}
                  className="w-20 bg-[var(--color-aqua-panel)] border border-ink/10 rounded-xl px-3 py-2 text-ink text-sm text-center outline-none focus:border-aqua-cyan/50 font-mono disabled:opacity-40"
                />
                <span className="text-gray-500 text-sm">L/min</span>
              </div>
            </SettingRow>
          </Section>

          {/* SEGURIDAD */}
          <Section icon={Shield} title={t('Seguridad')} top="card-top-green">
            <SettingRow label={t('Sesión activa')} sub={`${t('Sesión iniciada como')} ${user?.Usuario || t('Administrador')}`}>
              <span className="text-[10px] font-black uppercase px-3 py-1 rounded-lg bg-aqua-cyan/10 text-aqua-cyan border border-aqua-cyan/20">
                Admin
              </span>
            </SettingRow>
          </Section>
        </>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-2xl text-sm font-semibold">
          ⚠ {error}
        </div>
      )}

      {/* GUARDAR */}
      <div className="flex justify-end">
        <button
          onClick={guardar}
          disabled={saving || configLoading}
          className={`flex items-center gap-2 font-black px-8 py-3 rounded-2xl transition-all disabled:opacity-50 ${
            saved
              ? 'bg-green-500 text-ink'
              : 'bg-aqua-cyan hover:bg-aqua-cyan/80 text-aqua-dark'
          }`}
        >
          {saved
            ? <><CheckCircle2 size={17} /> {t('GUARDADO')}</>
            : <><Save size={17} /> {saving ? t('GUARDANDO...') : t('GUARDAR CAMBIOS')}</>
          }
        </button>
      </div>

    </div>
  );
}

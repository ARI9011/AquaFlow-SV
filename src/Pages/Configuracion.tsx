import React, { useState } from 'react';
import { Bell, RefreshCw, Zap, Moon, Shield } from 'lucide-react';

const Toggle = ({ value, onChange, disabled = false }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) => (
  <button
    onClick={() => !disabled && onChange(!value)}
    className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
      disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
    } ${value ? 'bg-aqua-cyan' : 'bg-white/10'}`}
  >
    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${value ? 'left-6' : 'left-1'}`} />
  </button>
);

const SettingRow = ({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between py-5 border-b border-white/5 last:border-0">
    <div className="mr-4">
      <p className="text-sm font-bold text-white">{label}</p>
      {sub && <p className="text-[11px] text-gray-500 mt-0.5">{sub}</p>}
    </div>
    <div className="flex-shrink-0">{children}</div>
  </div>
);

const SectionHeader = ({ icon: Icon, title }: { icon: React.ElementType; title: string }) => (
  <div className="p-8 border-b border-white/5 flex items-center gap-3">
    <Icon className="text-aqua-cyan" size={20} />
    <h3 className="font-bold text-xl">{title}</h3>
  </div>
);

export default function Configuracion() {
  const [notifAlertas,   setNotifAlertas]   = useState(true);
  const [notifReportes,  setNotifReportes]  = useState(true);
  const [notifSensores,  setNotifSensores]  = useState(false);
  const [autoRefresh,    setAutoRefresh]    = useState(true);
  const [modoOscuro,     setModoOscuro]     = useState(true);
  const [intervalo,      setIntervalo]      = useState('30');
  const [umbralPresion,  setUmbralPresion]  = useState('25');
  const [umbralFlujo,    setUmbralFlujo]    = useState('8');
  const [saved, setSaved] = useState(false);

  const guardar = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">

      <div>
        <h2 className="text-3xl font-black tracking-tighter text-white mb-2">
          Configuración <span className="text-aqua-cyan">del Sistema</span>
        </h2>
        <p className="text-gray-500 text-sm">Personaliza las preferencias y umbrales de AquaFlow SV</p>
      </div>

      {/* NOTIFICACIONES */}
      <div className="bg-aqua-card border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <SectionHeader icon={Bell} title="Notificaciones" />
        <div className="px-8 py-2">
          <SettingRow label="Alertas del sistema" sub="Avisar cuando un sensor detecte valores críticos">
            <Toggle value={notifAlertas} onChange={setNotifAlertas} />
          </SettingRow>
          <SettingRow label="Nuevos reportes ciudadanos" sub="Notificación al recibir un reporte de la comunidad">
            <Toggle value={notifReportes} onChange={setNotifReportes} />
          </SettingRow>
          <SettingRow label="Estado de sensores" sub="Avisar cuando un sensor se desconecte o reconecte">
            <Toggle value={notifSensores} onChange={setNotifSensores} />
          </SettingRow>
        </div>
      </div>

      {/* ACTUALIZACIÓN DE DATOS */}
      <div className="bg-aqua-card border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <SectionHeader icon={RefreshCw} title="Actualización de datos" />
        <div className="px-8 py-2">
          <SettingRow label="Actualización automática" sub="Refrescar datos de sensores periódicamente">
            <Toggle value={autoRefresh} onChange={setAutoRefresh} />
          </SettingRow>
          <SettingRow label="Intervalo de actualización" sub="Cada cuántos segundos se actualizan los datos">
            <select
              value={intervalo}
              onChange={(e) => setIntervalo(e.target.value)}
              disabled={!autoRefresh}
              className={`bg-aqua-dark border border-white/10 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-aqua-cyan/50 transition-opacity ${
                !autoRefresh ? 'opacity-40 cursor-not-allowed' : ''
              }`}
            >
              <option value="10">10 segundos</option>
              <option value="30">30 segundos</option>
              <option value="60">1 minuto</option>
              <option value="300">5 minutos</option>
            </select>
          </SettingRow>
        </div>
      </div>

      {/* UMBRALES DE ALERTA */}
      <div className="bg-aqua-card border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <SectionHeader icon={Zap} title="Umbrales de alerta" />
        <div className="px-8 py-2">
          <SettingRow label="Presión mínima aceptable" sub="Se generará alerta si la presión cae por debajo de este valor">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={umbralPresion}
                onChange={(e) => setUmbralPresion(e.target.value)}
                className="w-20 bg-aqua-dark border border-white/10 rounded-xl px-3 py-2 text-white text-sm text-center outline-none focus:border-aqua-cyan/50 font-mono"
              />
              <span className="text-gray-500 text-sm">PSI</span>
            </div>
          </SettingRow>
          <SettingRow label="Flujo mínimo aceptable" sub="Se generará alerta si el flujo cae por debajo de este valor">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={umbralFlujo}
                onChange={(e) => setUmbralFlujo(e.target.value)}
                className="w-20 bg-aqua-dark border border-white/10 rounded-xl px-3 py-2 text-white text-sm text-center outline-none focus:border-aqua-cyan/50 font-mono"
              />
              <span className="text-gray-500 text-sm">L/min</span>
            </div>
          </SettingRow>
        </div>
      </div>

      {/* APARIENCIA */}
      <div className="bg-aqua-card border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <SectionHeader icon={Moon} title="Apariencia" />
        <div className="px-8 py-2">
          <SettingRow label="Modo oscuro" sub="AquaFlow SV usa un modo oscuro optimizado para monitoreo nocturno">
            <Toggle value={modoOscuro} onChange={setModoOscuro} disabled />
          </SettingRow>
        </div>
      </div>

      {/* SEGURIDAD */}
      <div className="bg-aqua-card border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <SectionHeader icon={Shield} title="Seguridad" />
        <div className="px-8 py-2">
          <SettingRow label="Sesión activa" sub="Sesión iniciada como Administrador del sistema">
            <span className="text-[10px] font-black uppercase px-3 py-1 rounded-lg bg-aqua-cyan/10 text-aqua-cyan">
              Admin
            </span>
          </SettingRow>
          <SettingRow label="Tiempo de expiración de sesión" sub="La sesión expira tras inactividad prolongada">
            <select className="bg-aqua-dark border border-white/10 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-aqua-cyan/50">
              <option>30 minutos</option>
              <option>1 hora</option>
              <option>4 horas</option>
              <option>Nunca</option>
            </select>
          </SettingRow>
        </div>
      </div>

      {/* GUARDAR */}
      <div className="flex justify-end">
        <button
          onClick={guardar}
          className={`font-black px-8 py-3 rounded-2xl transition-all ${
            saved
              ? 'bg-green-500 text-white'
              : 'bg-aqua-cyan hover:bg-aqua-cyan/80 text-aqua-dark'
          }`}
        >
          {saved ? '✓ GUARDADO' : 'GUARDAR CAMBIOS'}
        </button>
      </div>

    </div>
  );
}

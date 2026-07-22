import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

type Tema = 'oscuro' | 'claro';

interface SistemaConfig {
  auto_refresh: boolean;
  intervalo: number;
  umbral_presion: number;
  umbral_flujo: number;
}

interface NotificacionesConfig {
  notif_alertas: boolean;
  notif_reportes: boolean;
  notif_sensores: boolean;
  tema: Tema;
}

const SISTEMA_DEFAULT: SistemaConfig = {
  auto_refresh: true,
  intervalo: 30,
  umbral_presion: 25,
  umbral_flujo: 8,
};

const NOTIFICACIONES_DEFAULT: NotificacionesConfig = {
  notif_alertas: true,
  notif_reportes: true,
  notif_sensores: false,
  tema: 'oscuro',
};

const TEMA_STORAGE_KEY = 'aquaflow_tema';

function aplicarTemaAlDOM(tema: Tema) {
  document.documentElement.setAttribute('data-theme', tema === 'claro' ? 'light' : 'dark');
}

interface ConfigContextType {
  sistema: SistemaConfig;
  notificaciones: NotificacionesConfig;
  configLoading: boolean;
  /** Milisegundos de polling a usar en páginas con datos en vivo (0 si el auto-refresh está apagado o si es tiempo real). */
  pollingMs: number;
  /** true cuando el admin eligió "Tiempo real" — usar streaming (SSE) en vez de sondeo por intervalo. */
  tiempoReal: boolean;
  tema: Tema;
  setTema: (tema: Tema) => Promise<void>;
  refreshConfig: () => void;
  updateNotificaciones: (partial: Partial<Omit<NotificacionesConfig, 'tema'>>) => Promise<void>;
  updateSistema: (partial: Partial<SistemaConfig>) => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | null>(null);

function normalizeSistema(raw: any): SistemaConfig {
  return {
    auto_refresh: !!raw.auto_refresh,
    intervalo: Number(raw.intervalo) || SISTEMA_DEFAULT.intervalo,
    umbral_presion: Number(raw.umbral_presion) || SISTEMA_DEFAULT.umbral_presion,
    umbral_flujo: Number(raw.umbral_flujo) || SISTEMA_DEFAULT.umbral_flujo,
  };
}

function normalizeNotificaciones(raw: any): NotificacionesConfig {
  return {
    notif_alertas: !!raw.notif_alertas,
    notif_reportes: !!raw.notif_reportes,
    notif_sensores: !!raw.notif_sensores,
    tema: raw.tema === 'claro' ? 'claro' : 'oscuro',
  };
}

export function ConfigProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [sistema, setSistema] = useState<SistemaConfig>(SISTEMA_DEFAULT);
  const [notificaciones, setNotificaciones] = useState<NotificacionesConfig>(() => {
    // Aplica de inmediato el último tema conocido (localStorage) para evitar parpadeo mientras carga el backend.
    const cache = (typeof localStorage !== 'undefined' && localStorage.getItem(TEMA_STORAGE_KEY) === 'claro') ? 'claro' : 'oscuro';
    return { ...NOTIFICACIONES_DEFAULT, tema: cache };
  });
  const [configLoading, setConfigLoading] = useState(true);

  useEffect(() => { aplicarTemaAlDOM(notificaciones.tema); }, [notificaciones.tema]);

  const fetchConfig = useCallback(() => {
    if (!user) { setConfigLoading(false); return; }
    setConfigLoading(true);
    axios.get('/api/configuracion')
      .then(({ data }) => {
        setSistema(normalizeSistema(data.sistema || {}));
        const notif = normalizeNotificaciones(data.notificaciones || {});
        setNotificaciones(notif);
        localStorage.setItem(TEMA_STORAGE_KEY, notif.tema);
      })
      .catch(() => { /* se quedan los valores por defecto / cacheados */ })
      .finally(() => setConfigLoading(false));
  }, [user]);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const updateNotificaciones = async (partial: Partial<Omit<NotificacionesConfig, 'tema'>>) => {
    const next = { ...notificaciones, ...partial };
    setNotificaciones(next);
    await axios.put('/api/configuracion/notificaciones', next);
  };

  const updateSistema = async (partial: Partial<SistemaConfig>) => {
    const next = { ...sistema, ...partial };
    setSistema(next);
    await axios.put('/api/configuracion/sistema', next);
  };

  const setTema = async (tema: Tema) => {
    setNotificaciones(prev => ({ ...prev, tema }));
    localStorage.setItem(TEMA_STORAGE_KEY, tema);
    try {
      await axios.put('/api/configuracion/tema', { tema });
    } catch {
      // El tema ya se aplicó visualmente y quedó cacheado localmente; se reintentará guardar en el próximo cambio.
    }
  };

  const tiempoReal = sistema.auto_refresh && sistema.intervalo === 0;
  const pollingMs = sistema.auto_refresh && !tiempoReal ? sistema.intervalo * 1000 : 0;

  return (
    <ConfigContext.Provider value={{
      sistema, notificaciones, configLoading, pollingMs, tiempoReal,
      tema: notificaciones.tema, setTema,
      refreshConfig: fetchConfig, updateNotificaciones, updateSistema,
    }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig must be inside ConfigProvider');
  return ctx;
}

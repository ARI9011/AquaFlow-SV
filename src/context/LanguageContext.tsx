import { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import { useConfig } from './ConfigContext';
import type { Idioma } from './ConfigContext';

export type Lang = Idioma;

interface LanguageCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  /** Traduce un texto en español al idioma activo. En español lo devuelve tal cual. */
  t: (texto: string) => string;
}

const LanguageContext = createContext<LanguageCtx>({
  lang: 'es',
  setLang: () => {},
  toggleLang: () => {},
  t: (texto) => texto,
});

const DICCIONARIO_STORAGE_KEY = 'aquaflow_traducciones_en';
const LOTE_ESPERA_MS = 80;

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { idioma, setIdioma } = useConfig();
  const lang: Lang = idioma;

  // Caché local del navegador de lo ya traducido (además de la caché compartida en el
  // servidor): evita repetir la llamada a /api/translate para textos ya vistos en esta máquina.
  const [diccionario, setDiccionario] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem(DICCIONARIO_STORAGE_KEY) || '{}'); } catch { return {}; }
  });
  const pendientesRef = useRef<Set<string>>(new Set());
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Junta en un solo lote todos los textos pedidos durante el mismo ciclo de render
  // (toda la página cambia de idioma a la vez) en vez de una llamada por texto.
  const pedirTraduccion = (texto: string) => {
    if (pendientesRef.current.has(texto)) return;
    pendientesRef.current.add(texto);
    if (timerRef.current) return;
    timerRef.current = window.setTimeout(async () => {
      const lote = Array.from(pendientesRef.current);
      pendientesRef.current.clear();
      timerRef.current = null;
      try {
        const { data } = await axios.post('/api/translate', { textos: lote });
        setDiccionario(prev => {
          const siguiente = { ...prev, ...data };
          try { localStorage.setItem(DICCIONARIO_STORAGE_KEY, JSON.stringify(siguiente)); } catch { /* localStorage lleno, no es crítico */ }
          return siguiente;
        });
      } catch {
        // se queda en español; el próximo cambio de idioma o recarga lo vuelve a intentar
      }
    }, LOTE_ESPERA_MS);
  };

  const t = (texto: string): string => {
    if (lang !== 'en') return texto;
    const limpio = texto.trim();
    if (!limpio) return texto;
    const traducido = diccionario[limpio];
    if (traducido) return traducido;
    pedirTraduccion(limpio);
    return texto; // mientras llega la traducción, se ve en español
  };

  const setLang = (l: Lang) => { setIdioma(l); };
  const toggleLang = () => setIdioma(idioma === 'es' ? 'en' : 'es');

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);

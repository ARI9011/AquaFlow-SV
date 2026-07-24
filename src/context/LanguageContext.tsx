import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { translations } from '../i18n';
import type { Lang } from '../i18n';

interface LanguageCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageCtx>({
  lang: 'es',
  setLang: () => {},
  toggleLang: () => {},
  t: (k) => k,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = (typeof localStorage !== 'undefined' && localStorage.getItem('lang')) as Lang | null;
    return saved === 'en' || saved === 'es' ? saved : 'es';
  });

  useEffect(() => {
    if (typeof localStorage !== 'undefined') localStorage.setItem('lang', lang);
    if (typeof document !== 'undefined') document.documentElement.lang = lang;
  }, [lang]);

  const toggleLang = () => setLang((l) => (l === 'es' ? 'en' : 'es'));

  // Devuelve la traducción; si falta, usa el español; si tampoco, la clave.
  const t = (key: string): string =>
    translations[lang][key] ?? translations.es[key] ?? key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);

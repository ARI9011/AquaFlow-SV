import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

// tamaño de texto y alto contraste, se guardan en localStorage y se aplican en <html>

interface A11yCtx {
  fontScale: number;          // 1 = normal, 1.15, 1.3, ...
  highContrast: boolean;
  aumentarTexto: () => void;
  reducirTexto: () => void;
  resetTexto: () => void;
  toggleContraste: () => void;
  // el botón de accesibilidad y el del chat comparten esquina, esto es para
  // que el ChatBot avise cuándo esconder el de accesibilidad
  chatAbierto: boolean;
  setChatAbierto: (v: boolean) => void;
}

const A11yContext = createContext<A11yCtx>({
  fontScale: 1,
  highContrast: false,
  aumentarTexto: () => {},
  reducirTexto: () => {},
  resetTexto: () => {},
  toggleContraste: () => {},
  chatAbierto: false,
  setChatAbierto: () => {},
});

const MIN = 0.9;
const MAX = 1.6;
const STEP = 0.1;

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [fontScale, setFontScale] = useState<number>(() => {
    const v = parseFloat(localStorage.getItem('a11y_font') || '1');
    return isNaN(v) ? 1 : Math.min(MAX, Math.max(MIN, v));
  });
  const [highContrast, setHighContrast] = useState<boolean>(
    () => localStorage.getItem('a11y_contrast') === '1'
  );
  const [chatAbierto, setChatAbierto] = useState(false);

  // esto afecta todos los rem/em de golpe
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontScale * 100}%`;
    localStorage.setItem('a11y_font', String(fontScale));
  }, [fontScale]);

  // pone o quita la clase en <html>
  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', highContrast);
    localStorage.setItem('a11y_contrast', highContrast ? '1' : '0');
  }, [highContrast]);

  const aumentarTexto = () => setFontScale((s) => Math.min(MAX, +(s + STEP).toFixed(2)));
  const reducirTexto = () => setFontScale((s) => Math.max(MIN, +(s - STEP).toFixed(2)));
  const resetTexto = () => setFontScale(1);
  const toggleContraste = () => setHighContrast((v) => !v);

  return (
    <A11yContext.Provider
      value={{ fontScale, highContrast, aumentarTexto, reducirTexto, resetTexto, toggleContraste, chatAbierto, setChatAbierto }}
    >
      {children}
    </A11yContext.Provider>
  );
}

export const useA11y = () => useContext(A11yContext);

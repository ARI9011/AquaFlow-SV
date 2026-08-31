import { useEffect, useRef, useState } from 'react';
import { Accessibility, Volume2, VolumeX, Contrast, Minus, Plus, RotateCcw, X } from 'lucide-react';
import { useA11y } from '../context/AccessibilityContext';


export default function AccessibilityPanel() {
  const [abierto, setAbierto] = useState(false);
  const { fontScale, highContrast, aumentarTexto, reducirTexto, resetTexto, toggleContraste, chatAbierto } = useA11y();

  const [narrador, setNarrador] = useState(false);
  const [soportaVoz, setSoportaVoz] = useState(true);
  const ultimoRef = useRef<string>('');
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setSoportaVoz(typeof window !== 'undefined' && 'speechSynthesis' in window);
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const textoDe = (el: HTMLElement | null): string => {
    if (!el) return '';
    const aria = el.getAttribute('aria-label') || el.getAttribute('title') || el.getAttribute('alt');
    if (aria) return aria.trim();
    const propio = Array.from(el.childNodes)
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent || '').join(' ').replace(/\s+/g, ' ').trim();
    return (propio || (el.innerText || '').replace(/\s+/g, ' ').trim()).slice(0, 220);
  };

  const hablar = (texto: string) => {
    if (!texto || texto === ultimoRef.current) return;
    ultimoRef.current = texto;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = document.documentElement.lang === 'en' ? 'en-US' : 'es-ES';
    u.rate = 1.05;
    window.speechSynthesis.speak(u);
  };

  useEffect(() => {
    if (!narrador) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      ultimoRef.current = '';
      return;
    }
    const onMove = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest('[data-a11y-panel]')) return;
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        const texto = textoDe(el);
        if (texto) hablar(texto);
      }, 250);
    };
    document.addEventListener('mouseover', onMove);
    return () => {
      document.removeEventListener('mouseover', onMove);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [narrador]);

  // se oculta si el chat está abierto, comparten la misma esquina
  if (chatAbierto) return null;

  return (
    <div data-a11y-panel className="fixed bottom-32 right-4 sm:right-6 z-[900] flex flex-col items-end gap-3">
      {/* Panel expandible */}
      {abierto && (
        <div
          role="dialog"
          aria-label="Opciones de accesibilidad"
          className="w-64 bg-[var(--color-aqua-panel,#0d2137)] border border-ink/15 rounded-2xl shadow-2xl p-4 text-ink"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-sm">Accesibilidad</span>
            <button onClick={() => setAbierto(false)} aria-label="Cerrar panel de accesibilidad"
              className="text-gray-400 hover:text-ink"><X size={16} /></button>
          </div>

          {/* Tamaño de texto */}
          <p className="text-[11px] uppercase tracking-wide text-gray-400 font-bold mb-1.5">Tamaño de texto</p>
          <div className="flex items-center gap-2 mb-4">
            <button onClick={reducirTexto} aria-label="Reducir tamaño del texto"
              className="flex-1 h-10 rounded-xl bg-ink/[0.05] border border-ink/10 hover:border-aqua-cyan/40 flex items-center justify-center"><Minus size={16} /></button>
            <span className="w-12 text-center text-sm font-bold" aria-live="polite">{Math.round(fontScale * 100)}%</span>
            <button onClick={aumentarTexto} aria-label="Aumentar tamaño del texto"
              className="flex-1 h-10 rounded-xl bg-ink/[0.05] border border-ink/10 hover:border-aqua-cyan/40 flex items-center justify-center"><Plus size={16} /></button>
            <button onClick={resetTexto} aria-label="Restablecer tamaño del texto"
              className="h-10 w-10 rounded-xl bg-ink/[0.05] border border-ink/10 hover:border-aqua-cyan/40 flex items-center justify-center"><RotateCcw size={15} /></button>
          </div>

          {/* Alto contraste */}
          <button onClick={toggleContraste} aria-pressed={highContrast}
            className={`w-full h-11 rounded-xl flex items-center justify-center gap-2 font-bold text-sm mb-2.5 transition
              ${highContrast ? 'bg-aqua-cyan text-[#052]' : 'bg-ink/[0.05] border border-ink/10 hover:border-aqua-cyan/40'}`}>
            <Contrast size={17} /> Alto contraste
          </button>

          {/* Narrador por cursor */}
          {soportaVoz && (
            <button onClick={() => setNarrador((v) => !v)} aria-pressed={narrador}
              className={`w-full h-11 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition
                ${narrador ? 'bg-aqua-cyan text-[#052] animate-pulse' : 'bg-ink/[0.05] border border-ink/10 hover:border-aqua-cyan/40'}`}>
              {narrador ? <Volume2 size={17} /> : <VolumeX size={17} />}
              {narrador ? 'Narrador activo' : 'Narrador por cursor'}
            </button>
          )}
          {narrador && (
            <p className="text-[11px] text-gray-400 mt-2 text-center">Señala un texto con el mouse para escucharlo.</p>
          )}
        </div>
      )}

      {/* Botón principal */}
      <button
        onClick={() => setAbierto((v) => !v)}
        aria-label="Abrir opciones de accesibilidad"
        aria-expanded={abierto}
        title="Accesibilidad"
        className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg bg-aqua-cyan text-[#052] hover:brightness-110 transition-all"
      >
        <Accessibility size={24} />
      </button>
    </div>
  );
}

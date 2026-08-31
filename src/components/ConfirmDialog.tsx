import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AlertTriangle, HelpCircle, X } from 'lucide-react';
import { useLang } from '../context/LanguageContext';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

type ConfirmFn = (options: ConfirmOptions | string) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm debe usarse dentro de <ConfirmProvider>');
  return ctx;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const { t } = useLang();
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<(value: boolean) => void>();

  const confirmDialog = useCallback<ConfirmFn>((opts) => {
    setOptions(typeof opts === 'string' ? { message: opts } : opts);
    return new Promise<boolean>((resolve) => { resolver.current = resolve; });
  }, []);

  const close = (result: boolean) => {
    setOptions(null);
    resolver.current?.(result);
    resolver.current = undefined;
  };

  return (
    <ConfirmContext.Provider value={confirmDialog}>
      {children}
      {options && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={(e) => { if (e.target === e.currentTarget) close(false); }}
        >
          <div className="w-full max-w-sm bg-[var(--color-aqua-panel)] border border-ink/10 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between px-6 pt-6">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                options.danger ? 'bg-red-500/10 border border-red-500/20' : 'bg-aqua-cyan/10 border border-aqua-cyan/20'
              }`}>
                {options.danger
                  ? <AlertTriangle size={20} className="text-red-400" />
                  : <HelpCircle size={20} className="text-aqua-cyan" />}
              </div>
              <button onClick={() => close(false)}
                className="w-7 h-7 rounded-lg bg-ink/5 hover:bg-ink/10 flex items-center justify-center text-gray-400 hover:text-ink transition-colors">
                <X size={14} />
              </button>
            </div>

            <div className="px-6 pt-4 pb-6">
              <h3 className="font-black text-ink text-base">
                {options.title ?? (options.danger ? t('Confirmar eliminación') : t('Confirmar acción'))}
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed mt-1.5">{options.message}</p>
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => close(false)}
                className="flex-1 py-2.5 rounded-xl bg-ink/[0.03] border border-ink/10 text-gray-400 font-bold text-sm hover:bg-ink/[0.06] transition-colors">
                {options.cancelText ?? t('Cancelar')}
              </button>
              <button onClick={() => close(true)}
                className={`flex-1 py-2.5 rounded-xl font-black text-sm transition-all ${
                  options.danger
                    ? 'bg-red-500 text-ink hover:bg-red-500/80'
                    : 'bg-aqua-cyan text-aqua-dark hover:bg-aqua-cyan/80'
                }`}>
                {options.confirmText ?? (options.danger ? t('Eliminar') : t('Confirmar'))}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'error';
}

type ToastFn = (message: string, type?: 'success' | 'error') => void;

const ToastContext = createContext<ToastFn | null>(null);

export function useToast(): ToastFn {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return ctx;
}

const AUTO_DISMISS_MS = 3500;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const showToast = useCallback<ToastFn>((message, type = 'success') => {
    if (timer.current) clearTimeout(timer.current);
    const id = Date.now();
    setToast({ id, message, type });
    timer.current = setTimeout(() => setToast(t => (t?.id === id ? null : t)), AUTO_DISMISS_MS);
  }, []);

  const close = () => {
    if (timer.current) clearTimeout(timer.current);
    setToast(null);
  };

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[1000] w-[calc(100%-2rem)] max-w-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-md ${
            toast.type === 'success'
              ? 'bg-aqua-cyan/10 border-aqua-cyan/30 text-aqua-cyan'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            {toast.type === 'success'
              ? <CheckCircle2 size={18} className="flex-shrink-0" />
              : <AlertTriangle size={18} className="flex-shrink-0" />}
            <p className="text-sm font-bold text-ink flex-1">{toast.message}</p>
            <button onClick={close} className="text-gray-400 hover:text-ink transition-colors flex-shrink-0">
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

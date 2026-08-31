import { LogIn, X } from 'lucide-react';
import { useLang } from '../context/LanguageContext';

interface Props {
  seccion?: string;
  onIniciarSesion: () => void;
  onCancelar: () => void;
}

export default function LoginRequiredModal({ seccion, onIniciarSesion, onCancelar }: Props) {
  const { t } = useLang();
  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
      aria-label={t('Debes iniciar sesión')}
      onClick={(e) => { if (e.target === e.currentTarget) onCancelar(); }}
    >
      <div className="relative w-full max-w-md bg-[var(--color-aqua-panel,#0d2137)] border border-ink/10 rounded-3xl p-8 shadow-2xl text-center">
        <button
          onClick={onCancelar}
          aria-label={t('Cerrar aviso')}
          className="absolute top-4 right-4 text-gray-400 hover:text-ink"
        >
          <X size={18} />
        </button>

        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-aqua-cyan/15 flex items-center justify-center overflow-hidden">
            <img src="/aquabot-alerta-detectada.png" alt="" className="w-full h-full object-contain p-1.5" />
          </div>
        </div>

        <h2 className="text-2xl font-black text-ink tracking-tight">{t('Inicia sesión para continuar')}</h2>
        <p className="text-sm text-gray-400 mt-2">
          {seccion
            ? <>{t('Para acceder a')} <span className="text-aqua-cyan font-semibold">{t(seccion)}</span> {t('necesitas iniciar sesión en AquaFlow SV.')}</>
            : <>{t('Esta sección es privada. Necesitas iniciar sesión en AquaFlow SV para acceder.')}</>}
        </p>

        <div className="mt-7 flex flex-col gap-3">
          <button
            onClick={onIniciarSesion}
            className="w-full h-12 rounded-2xl bg-aqua-cyan text-[#052] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 transition"
          >
            <LogIn size={18} /> {t('Iniciar sesión')}
          </button>
          <button
            onClick={onCancelar}
            className="w-full h-12 rounded-2xl bg-ink/[0.05] border border-ink/10 text-gray-300 font-bold text-sm hover:bg-ink/[0.1] transition"
          >
            {t('Cancelar')}
          </button>
        </div>
      </div>
    </div>
  );
}

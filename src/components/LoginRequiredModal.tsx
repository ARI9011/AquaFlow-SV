import { Lock, LogIn, X } from 'lucide-react';

// Modal de advertencia que aparece cuando un visitante (sin sesión) intenta
// entrar a una sección protegida desde la página de bienvenida.

interface Props {
  seccion?: string;              // nombre de la sección que intentó abrir (opcional)
  onIniciarSesion: () => void;   // ir al login
  onCancelar: () => void;        // cerrar y quedarse en la bienvenida
}

export default function LoginRequiredModal({ seccion, onIniciarSesion, onCancelar }: Props) {
  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Debes iniciar sesión"
      onClick={(e) => { if (e.target === e.currentTarget) onCancelar(); }}
    >
      <div className="relative w-full max-w-md bg-[var(--color-aqua-panel,#0d2137)] border border-ink/10 rounded-3xl p-8 shadow-2xl text-center">
        <button
          onClick={onCancelar}
          aria-label="Cerrar aviso"
          className="absolute top-4 right-4 text-gray-400 hover:text-ink"
        >
          <X size={18} />
        </button>

        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-aqua-cyan/15 flex items-center justify-center">
            <Lock className="text-aqua-cyan" size={30} />
          </div>
        </div>

        <h2 className="text-2xl font-black text-ink tracking-tight">Inicia sesión para continuar</h2>
        <p className="text-sm text-gray-400 mt-2">
          {seccion
            ? <>Para acceder a <span className="text-aqua-cyan font-semibold">{seccion}</span> necesitas iniciar sesión en AquaFlow SV.</>
            : <>Esta sección es privada. Necesitas iniciar sesión en AquaFlow SV para acceder.</>}
        </p>

        <div className="mt-7 flex flex-col gap-3">
          <button
            onClick={onIniciarSesion}
            className="w-full h-12 rounded-2xl bg-aqua-cyan text-[#052] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 transition"
          >
            <LogIn size={18} /> Iniciar sesión
          </button>
          <button
            onClick={onCancelar}
            className="w-full h-12 rounded-2xl bg-ink/[0.05] border border-ink/10 text-gray-300 font-bold text-sm hover:bg-ink/[0.1] transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

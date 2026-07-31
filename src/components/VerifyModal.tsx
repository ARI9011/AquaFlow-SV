import { useState } from 'react';
import axios from 'axios';
import { MailCheck } from 'lucide-react';

interface VerifyModalProps {
  email: string;
  onVerified: () => void;
  onClose: () => void;
}

export default function VerifyModal({ email, onVerified, onClose }: VerifyModalProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const verificar = async () => {
    if (code.trim().length !== 6) {
      setError('Ingresa el código de 6 dígitos.');
      return;
    }
    setError(''); setInfo(''); setLoading(true);
    try {
      await axios.post('/auth/verify-code', { email, code: code.trim() });
      onVerified();
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'No se pudo verificar el código.');
    } finally {
      setLoading(false);
    }
  };

  const reenviar = async () => {
    setError(''); setInfo(''); setResending(true);
    try {
      await axios.post('/auth/resend-code', { email });
      setInfo('Te enviamos un nuevo código a tu correo.');
    } catch {
      setError('No se pudo reenviar el código.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-[var(--color-aqua-panel)] border border-ink/10 rounded-3xl p-8 shadow-2xl">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-aqua-cyan/15 flex items-center justify-center">
            <MailCheck className="text-aqua-cyan" size={28} />
          </div>
        </div>
        <h2 className="text-2xl font-black text-ink text-center tracking-tight">Verifica tu cuenta</h2>
        <p className="text-sm text-gray-400 text-center mt-2">
          Enviamos un código de 6 dígitos a<br />
          <span className="text-aqua-cyan font-semibold">{email}</span>
        </p>

        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          inputMode="numeric"
          placeholder="______"
          className="mt-6 w-full text-center text-3xl tracking-[0.5em] font-bold bg-black/30 border border-ink/10 rounded-2xl py-4 text-ink placeholder-gray-600 focus:outline-none focus:border-aqua-cyan/60"
        />

        {error && <p className="text-red-400 text-sm text-center mt-3">{error}</p>}
        {info && <p className="text-aqua-cyan text-sm text-center mt-3">{info}</p>}

        <button
          onClick={verificar}
          disabled={loading}
          className="mt-6 w-full bg-aqua-cyan text-[#052] font-black rounded-2xl py-3.5 text-sm uppercase tracking-widest hover:brightness-110 transition disabled:opacity-60"
        >
          {loading ? 'Verificando…' : 'Verificar'}
        </button>

        <div className="flex items-center justify-between mt-4 text-[11px] font-bold uppercase tracking-widest">
          <button
            onClick={reenviar}
            disabled={resending}
            className="text-gray-400 hover:text-aqua-cyan transition disabled:opacity-60"
          >
            {resending ? 'Reenviando…' : 'Reenviar código'}
          </button>
          <button onClick={onClose} className="text-gray-500 hover:text-ink transition">
            Verificar después
          </button>
        </div>
      </div>
    </div>
  );
}

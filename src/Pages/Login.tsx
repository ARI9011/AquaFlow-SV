import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BubbleBackground from '../components/BubbleBackground';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Clock } from 'lucide-react';

const MAX_ATTEMPTS = 3;
const LOCKOUT_SECONDS = 60;

export default function Login() {
  const navigate = useNavigate();
  const { setUser, user, authLoading } = useAuth();

  // Si ya hay sesión activa, redirigir al dashboard
  useEffect(() => {
    if (!authLoading && user) navigate('/dashboard', { replace: true });
  }, [user, authLoading, navigate]);

  /* ── Formulario ── */
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  /* ── Login ── */
  const [loginEmail,    setLoginEmail]    = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  /* ── Rate limit (client-side UX, reforzado server-side) ── */
  const [attempts,   setAttempts]   = useState(0);      // 0-3
  const [lockedUntil, setLockedUntil] = useState(0);    // timestamp ms

  // Deriva los segundos restantes en cada render
  const secondsLeft = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
  const isLocked = secondsLeft > 0;

  // Tick para que el countdown se actualice cada segundo
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!isLocked) return;
    const t = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, [isLocked, lockedUntil]);

  /* ── Registro ── */
  const [registerName,            setRegisterName]            = useState('');
  const [registerEmail,           setRegisterEmail]           = useState('');
  const [registerPassword,        setRegisterPassword]        = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');

  const isAdminEmail = (email: string) => email.toLowerCase().endsWith('@flowcdb.com');

  const toggleForm = () => {
    setIsLogin(v => !v);
    setError('');
    setSuccess('');
    setLoginEmail(''); setLoginPassword('');
    setRegisterName(''); setRegisterEmail('');
    setRegisterPassword(''); setRegisterConfirmPassword('');
  };

  /* ── Handlers ── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked || loading) return;
    setError(''); setLoading(true);

    try {
      const { data } = await axios.post('/auth/login', {
        email: loginEmail, password: loginPassword,
      });
      setUser(data.user);
      setAttempts(0);
      navigate('/dashboard');
    } catch (err: any) {
      const data = err.response?.data ?? {};
      const status = err.response?.status;

      if (status === 429) {
        // El servidor indica bloqueo
        const retryAfter = data.retryAfter ?? LOCKOUT_SECONDS;
        setLockedUntil(Date.now() + retryAfter * 1000);
        setAttempts(MAX_ATTEMPTS);
        setError(data.error ?? `Cuenta bloqueada. Espera ${retryAfter} segundos.`);
      } else {
        // Credenciales incorrectas: manejar cuenta del lado cliente
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= MAX_ATTEMPTS) {
          setLockedUntil(Date.now() + LOCKOUT_SECONDS * 1000);
          setError(`Demasiados intentos fallidos. Espera ${LOCKOUT_SECONDS} segundos.`);
        } else {
          const left = MAX_ATTEMPTS - newAttempts;
          setError(
            (data.error ?? 'Credenciales incorrectas') +
            ` — Intentos restantes: ${left}`
          );
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!registerEmail.includes('@')) {
      return setError('Por favor ingresa un email válido.');
    }
    if (registerPassword.length < 6) {
      return setError('La contraseña debe tener al menos 6 caracteres.');
    }
    if (registerPassword !== registerConfirmPassword) {
      return setError('Las contraseñas no coinciden.');
    }

    setLoading(true);
    try {
      const isAdmin = isAdminEmail(registerEmail);
      await axios.post('/auth/register', {
        nombre: registerName,
        email:  registerEmail,
        password: registerPassword,
        adminCode: isAdmin ? 'FLOWCDB2026' : '',
      });
      setSuccess(
        '¡Cuenta creada exitosamente!' +
        (isAdmin ? ' Acceso de Administrador activado.' : '')
      );
      setRegisterName(''); setRegisterEmail('');
      setRegisterPassword(''); setRegisterConfirmPassword('');
      setTimeout(() => { setIsLogin(true); setSuccess(''); }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Error al registrar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  /* ── UI ── */
  return (
    <div className="min-h-screen bg-aqua-dark flex items-center justify-center p-6 font-sans selection:bg-aqua-cyan/30 text-white">
      <BubbleBackground />
      <div className="w-full max-w-[420px] animate-in fade-in zoom-in duration-500 relative" style={{ zIndex: 1 }}>

        {/* LOGO */}
        <div className="flex items-center justify-center gap-4 mb-10 group">
          <div className="w-14 h-14 bg-aqua-card border border-white/10 rounded-2xl flex items-center justify-center text-3xl shadow-2xl group-hover:border-aqua-cyan/50 transition-all duration-500">
            💧
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-white">AquaFlow <span className="text-aqua-cyan">SV</span></h1>
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-500">Monitoreo Hídrico</p>
          </div>
        </div>

        {/* CARD */}
        <div className="bg-aqua-card border border-white/5 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-aqua-cyan/5 rounded-full blur-3xl pointer-events-none" />

          {/* ── FORMULARIO LOGIN ── */}
          {isLogin ? (
            <div className="space-y-6 animate-in slide-in-from-left-4 duration-500">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-white tracking-tight">Bienvenido</h2>
                <p className="text-gray-500 text-sm mt-1 font-medium">Ingresa tu email y contraseña</p>
              </div>

              {/* Bloqueo de cuenta */}
              {isLocked && (
                <div className="bg-orange-500/10 border border-orange-500/30 text-orange-400 px-4 py-4 rounded-2xl text-sm font-semibold flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={16} />
                    <span>Cuenta bloqueada temporalmente</span>
                  </div>
                  <div className="flex items-center gap-2 text-orange-300 text-lg font-black">
                    <Clock size={18} />
                    <span>{secondsLeft}s</span>
                  </div>
                  <p className="text-[11px] text-orange-400/70 text-center">
                    Demasiados intentos fallidos. Espera antes de intentar de nuevo.
                  </p>
                </div>
              )}

              {/* Error normal */}
              {error && !isLocked && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-2xl text-sm font-semibold">
                  ⚠ {error}
                </div>
              )}

              {/* Indicador de intentos */}
              {attempts > 0 && !isLocked && (
                <div className="flex justify-center gap-1.5">
                  {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i < attempts ? 'bg-red-500' : 'bg-white/10'}`} />
                  ))}
                </div>
              )}

              <form className="space-y-4" onSubmit={handleLogin}>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-1">Email</label>
                  <input
                    type="email" required
                    placeholder="tu@email.com"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    disabled={isLocked || loading}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3 text-sm text-white focus:outline-none focus:border-aqua-cyan/50 focus:bg-white/[0.05] transition-all disabled:opacity-40"
                  />
                  {isAdminEmail(loginEmail) && loginEmail && (
                    <p className="text-[10px] text-aqua-cyan font-bold mt-1">🔑 Acceso Admin detectado</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-1">Contraseña</label>
                  <input
                    type="password" required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    disabled={isLocked || loading}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3 text-sm text-white focus:outline-none focus:border-aqua-cyan/50 focus:bg-white/[0.05] transition-all disabled:opacity-40"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLocked || loading}
                  className="w-full bg-aqua-cyan hover:bg-aqua-cyan/80 disabled:bg-gray-600 text-aqua-dark font-black py-4 rounded-2xl transition-all shadow-lg shadow-aqua-cyan/10 active:scale-[0.98] mt-4"
                >
                  {isLocked
                    ? `Bloqueado (${secondsLeft}s)`
                    : loading ? 'Verificando...' : 'INICIAR SESIÓN'}
                </button>
              </form>
            </div>

          ) : (
            /* ── FORMULARIO REGISTRO ── */
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-white tracking-tight">Crear Cuenta</h2>
                <p className="text-gray-500 text-sm mt-1 font-medium">Regístrate para acceder al sistema</p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-2xl text-sm font-semibold">
                  ⚠ {error}
                </div>
              )}
              {success && (
                <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-2xl text-sm font-semibold">
                  ✓ {success}
                </div>
              )}

              <form className="space-y-4 max-h-[460px] overflow-y-auto pr-2 custom-scrollbar" onSubmit={handleRegister}>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-1">Nombre Completo</label>
                  <input
                    type="text" required
                    placeholder="Tu nombre"
                    value={registerName}
                    onChange={e => setRegisterName(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3 text-sm text-white focus:outline-none focus:border-aqua-cyan/50 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-1">Email</label>
                  <input
                    type="email" required
                    placeholder="tu@email.com"
                    value={registerEmail}
                    onChange={e => setRegisterEmail(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3 text-sm text-white focus:outline-none focus:border-aqua-cyan/50 transition-all"
                  />
                  {isAdminEmail(registerEmail) && registerEmail && (
                    <p className="text-[10px] text-aqua-cyan font-bold">🔑 Se registrará como ADMINISTRADOR</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-1">Contraseña</label>
                  <input
                    type="password" required
                    placeholder="Mínimo 6 caracteres"
                    value={registerPassword}
                    onChange={e => setRegisterPassword(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3 text-sm text-white focus:outline-none focus:border-aqua-cyan/50 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-1">Confirmar Contraseña</label>
                  <input
                    type="password" required
                    placeholder="Repite tu contraseña"
                    value={registerConfirmPassword}
                    onChange={e => setRegisterConfirmPassword(e.target.value)}
                    className={`w-full bg-white/[0.03] border rounded-2xl px-5 py-3 text-sm text-white focus:outline-none transition-all ${
                      registerConfirmPassword && registerPassword !== registerConfirmPassword
                        ? 'border-red-500/50 focus:border-red-500'
                        : registerConfirmPassword && registerPassword === registerConfirmPassword
                          ? 'border-green-500/50 focus:border-green-500'
                          : 'border-white/10 focus:border-aqua-cyan/50'
                    }`}
                  />
                  {registerConfirmPassword && registerPassword !== registerConfirmPassword && (
                    <p className="text-[10px] text-red-400 font-bold ml-1">Las contraseñas no coinciden</p>
                  )}
                  {registerConfirmPassword && registerPassword === registerConfirmPassword && (
                    <p className="text-[10px] text-green-400 font-bold ml-1">✓ Las contraseñas coinciden</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || (!!registerConfirmPassword && registerPassword !== registerConfirmPassword)}
                  className="w-full bg-white hover:bg-gray-200 disabled:bg-gray-400 disabled:cursor-not-allowed text-black font-black py-4 rounded-2xl transition-all active:scale-[0.98] mt-4"
                >
                  {loading ? 'Registrando...' : 'CREAR CUENTA'}
                </button>
              </form>
            </div>
          )}

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5" />
            </div>
            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
              <span className="bg-aqua-card px-4 text-gray-600">O</span>
            </div>
          </div>

          <button
            onClick={toggleForm}
            className="w-full text-[11px] font-bold text-gray-400 hover:text-aqua-cyan transition-colors uppercase tracking-widest"
          >
            {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia Sesión'}
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import VerifyModal from '../components/VerifyModal';
import BubbleBackground from '../components/BubbleBackground';
import ParticleFlowHero from '../components/ParticleFlowHero';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Clock } from 'lucide-react';

const MAX_ATTEMPTS = 3;
const LOCKOUT_SECONDS = 60;

function GoogleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
    </svg>
  );
}

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

  /* ── Rate limit ── */
  const [attempts,   setAttempts]   = useState(0);     
  const [lockedUntil, setLockedUntil] = useState(0);    

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

  const ADMIN_EMAILS = [
    'arielgarciacdb@gmail.com',
    'axelfernandolopez267@gmail.com',
    'ricardo.diaz17at@gmail.com',
    'gerardo768burgos@gmail.com',
  ];
  const isAdminEmail = (email: string) => ADMIN_EMAILS.includes(email.toLowerCase());

  /* ── Suaviza el cruce del panel diagonal ── */
  const diagonalPanelRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    diagonalPanelRef.current?.animate(
      [
        { opacity: 1 },
        { opacity: 0.45, offset: 0.5 },
        { opacity: 1 },
      ],
      { duration: 900, easing: 'cubic-bezier(0.4,0,0.2,1)' }
    );
  }, [isLogin]);

  const toggleForm = () => {
    setIsLogin(v => !v);
    setError('');
    setSuccess('');
    setLoginEmail(''); setLoginPassword('');
    setRegisterName(''); setRegisterEmail('');
    setRegisterPassword(''); setRegisterConfirmPassword('');
  };


  /* ── Handlers ── */
  // Correo pendiente de verificación (muestra el modal de código)
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);
  // Usuario de Google en espera: NO se marca la sesión hasta cerrar/verificar el modal
  const [pendingUser, setPendingUser] = useState<any>(null);

  // Inicio de sesión con Google
  const loginConGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError(''); setLoading(true);
      try {
        const { data } = await axios.post('/auth/google', {
          access_token: tokenResponse.access_token,
        });
        setAttempts(0);
        if (data.needsVerification) {
          setPendingUser(data.user);
          setVerifyEmail(data.user.Correo);
        } else {
          setUser(data.user);
          navigate('/dashboard');
        }
      } catch {
        setError('No se pudo iniciar sesión con Google. Intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError('Inicio de sesión con Google cancelado.'),
  });

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
    <div className="h-screen w-screen bg-black font-sans selection:bg-aqua-cyan/30 text-white relative overflow-hidden">
      {verifyEmail && (
        <VerifyModal
          email={verifyEmail}
          onVerified={() => { setVerifyEmail(null); if (pendingUser) setUser(pendingUser); navigate('/dashboard'); }}
          onClose={() => { setVerifyEmail(null); if (pendingUser) setUser(pendingUser); navigate('/dashboard'); }}
        />
      )}
      {/* Halo ambiental de fondo */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="w-[70vw] h-[70vw] max-w-[900px] max-h-[900px] bg-aqua-cyan/[0.05] rounded-full blur-[130px]" />
      </div>

      <div className="w-full h-full relative overflow-hidden z-10 page-enter bg-gradient-to-br from-[#031213] via-[#04191b] to-[#020707]">

        {/* Resplandor ambiental de la tarjeta: fuera del panel con scroll para que el
            blur se desvanezca contra la esquina redondeada de la tarjeta en vez de
            cortarse en un borde recto (el panel de abajo recorta en X por tener
            overflow-y-auto, lo que dejaba un "cuadro" visible pegado a la forma diagonal). */}
        <div className="pointer-events-none absolute -top-20 left-[14%] w-64 h-64 bg-aqua-cyan/[0.06] rounded-full blur-3xl z-0" />

        {/* Burbujas a lo ancho de TODA la tarjeta (no solo del panel de 42%): antes
            el canvas terminaba justo donde termina el formulario, dejando la franja
            entre ese borde y el corte diagonal completamente vacía ("espacio muerto"
            sin burbujas). El panel diagonal (z-10) las tapa donde corresponde. */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <BubbleBackground count={42} variant="absolute" />
        </div>

        {/* ── FORMULARIO: se desliza al lado opuesto del panel diagonal ── */}
        <div
          className={`absolute top-0 left-0 w-full md:w-[42%] h-full flex flex-col justify-center px-6 sm:px-8 py-10 overflow-y-auto custom-scrollbar ${
            isLogin ? 'md:left-0' : 'md:left-[58%]'
          }`}
          style={{ transition: 'left 0.9s cubic-bezier(0.4,0,0.2,1)', willChange: 'left' }}
        >
          <div className="relative z-10 w-full max-w-[360px] mx-auto">

            {/* LOGO */}
            <div className="flex items-center gap-3 mb-10 group">
              <div className="w-12 h-12 bg-white/[0.03] border border-aqua-cyan/20 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-aqua-cyan/10 group-hover:border-aqua-cyan/50 transition-all duration-500">
                💧
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tighter text-white leading-none">AquaFlow <span className="text-aqua-cyan">SV</span></h1>
                <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-gray-500 mt-1">Monitoreo Hídrico</p>
              </div>
            </div>

            <div key={isLogin ? 'login' : 'register'} className="auth-form-transition">
              {/* ── FORMULARIO LOGIN ── */}
              {isLogin ? (
                <div className="space-y-6">
                  <div className="text-center mb-2">
                    <h2 className="text-2xl font-black text-white tracking-tight">Bienvenido</h2>
                    <p className="text-gray-500 text-sm mt-1 font-medium">Ingresa tu email y contraseña</p>
                  </div>

                  {/* Login social */}
                  <button
                    type="button"
                    onClick={() => loginConGoogle()}
                    className="w-full flex items-center justify-center gap-2 bg-white/[0.03] border border-white/10 rounded-2xl py-3 text-sm font-bold text-gray-300 hover:border-aqua-cyan/40 hover:bg-white/[0.06] transition-all duration-300 active:scale-[0.98]"
                  >
                    <GoogleIcon /> Continuar con Google
                  </button>
                  {/* Inicio social manejado por el botón "Continuar con Google" */}

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5" /></div>
                    <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                      <span className="backdrop-blur-md bg-black/30 px-4 rounded-full py-1 text-gray-500">o con tu email</span>
                    </div>
                  </div>

                  {/* Bloqueo de cuenta */}
                  {isLocked && (
                    <div className="bg-orange-500/10 border border-orange-500/30 text-orange-400 px-4 py-4 rounded-2xl text-sm font-semibold flex flex-col items-center gap-2 transition-all duration-300">
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
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300">
                      ⚠ {error}
                    </div>
                  )}

                  {/* Indicador de intentos */}
                  {attempts > 0 && !isLocked && (
                    <div className="flex justify-center gap-1.5">
                      {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                        <div key={i} className={`w-2 h-2 rounded-full transition-colors duration-300 ${i < attempts ? 'bg-red-500' : 'bg-white/10'}`} />
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
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3 text-sm text-white focus:outline-none focus:border-aqua-cyan/50 focus:bg-white/[0.05] transition-all duration-300 disabled:opacity-40"
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
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3 text-sm text-white focus:outline-none focus:border-aqua-cyan/50 focus:bg-white/[0.05] transition-all duration-300 disabled:opacity-40"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLocked || loading}
                      className="w-full bg-aqua-cyan hover:bg-aqua-cyan/80 disabled:bg-gray-600 text-aqua-dark font-black py-4 rounded-2xl transition-all duration-300 shadow-lg shadow-aqua-cyan/10 active:scale-[0.98] mt-4"
                    >
                      {isLocked
                        ? `Bloqueado (${secondsLeft}s)`
                        : loading ? 'Verificando...' : 'INICIAR SESIÓN'}
                    </button>
                  </form>
                </div>

              ) : (
                /* ── FORMULARIO REGISTRO ── */
                <div className="space-y-6">
                  <div className="text-center mb-2">
                    <h2 className="text-2xl font-black text-white tracking-tight">Crear Cuenta</h2>
                    <p className="text-gray-500 text-sm mt-1 font-medium">Regístrate para acceder al sistema</p>
                  </div>

                  {/* Registro social */}
                  <button
                    type="button"
                    onClick={() => loginConGoogle()}
                    className="w-full flex items-center justify-center gap-2 bg-white/[0.03] border border-white/10 rounded-2xl py-3 text-sm font-bold text-gray-300 hover:border-aqua-cyan/40 hover:bg-white/[0.06] transition-all duration-300 active:scale-[0.98]"
                  >
                    <GoogleIcon /> Continuar con Google
                  </button>
                  {/* Inicio social manejado por el botón "Continuar con Google" */}

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5" /></div>
                    <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                      <span className="backdrop-blur-md bg-black/30 px-4 rounded-full py-1 text-gray-500">o con tu email</span>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300">
                      ⚠ {error}
                    </div>
                  )}
                  {success && (
                    <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300">
                      ✓ {success}
                    </div>
                  )}

                  <form className="space-y-4 max-h-[360px] overflow-y-auto pr-2 custom-scrollbar" onSubmit={handleRegister}>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-1">Nombre Completo</label>
                      <input
                        type="text" required
                        placeholder="Tu nombre"
                        value={registerName}
                        onChange={e => setRegisterName(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3 text-sm text-white focus:outline-none focus:border-aqua-cyan/50 transition-all duration-300"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-1">Email</label>
                      <input
                        type="email" required
                        placeholder="tu@email.com"
                        value={registerEmail}
                        onChange={e => setRegisterEmail(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3 text-sm text-white focus:outline-none focus:border-aqua-cyan/50 transition-all duration-300"
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
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3 text-sm text-white focus:outline-none focus:border-aqua-cyan/50 transition-all duration-300"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-1">Confirmar Contraseña</label>
                      <input
                        type="password" required
                        placeholder="Repite tu contraseña"
                        value={registerConfirmPassword}
                        onChange={e => setRegisterConfirmPassword(e.target.value)}
                        className={`w-full bg-white/[0.03] border rounded-2xl px-5 py-3 text-sm text-white focus:outline-none transition-all duration-300 ${
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
                      className="w-full bg-white hover:bg-gray-200 disabled:bg-gray-400 disabled:cursor-not-allowed text-black font-black py-4 rounded-2xl transition-all duration-300 active:scale-[0.98] mt-4"
                    >
                      {loading ? 'Registrando...' : 'CREAR CUENTA'}
                    </button>
                  </form>
                </div>
              )}
            </div>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5" />
              </div>
              <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                <span className="backdrop-blur-md bg-black/30 px-4 rounded-full py-1 text-gray-600">O</span>
              </div>
            </div>

            <button
              onClick={toggleForm}
              className="w-full text-[11px] font-bold text-gray-400 hover:text-aqua-cyan transition-colors duration-300 uppercase tracking-widest"
            >
              {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia Sesión'}
            </button>
          </div>
        </div>

        {/* ── PANEL DIAGONAL: flujo de partículas, cambia de lado entre login/registro ── */}
        <div
          ref={diagonalPanelRef}
          className={`hidden md:block absolute top-0 h-full md:w-[58%] bg-black z-10 overflow-hidden ${
            isLogin
              ? 'md:left-[42%] [clip-path:polygon(38%_0,100%_0,100%_100%,0_100%)]'
              : 'md:left-0 [clip-path:polygon(0_0,100%_0,62%_100%,0_100%)]'
          }`}
          style={{
            transition: 'left 0.9s cubic-bezier(0.4,0,0.2,1), clip-path 0.9s cubic-bezier(0.4,0,0.2,1)',
            willChange: 'left, clip-path, opacity',
          }}
        >
          <ParticleFlowHero />
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate(); // Hook para movernos entre páginas
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setError("");
  };

  // Función para manejar el envío del formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Evita que la página se recargue

    // Aquí podrías validar credenciales, por ahora entramos directo
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-aqua-dark flex items-center justify-center p-6 font-sans selection:bg-aqua-cyan/30 text-white">
      <div className="w-full max-w-[420px] animate-in fade-in zoom-in duration-500">

        {/* HEADER / LOGO */}
        <div className="flex items-center justify-center gap-4 mb-10 group">
          <div className="w-14 h-14 bg-aqua-card border border-white/10 rounded-2xl flex items-center justify-center text-3xl shadow-2xl group-hover:border-aqua-cyan/50 transition-all duration-500">
            💧
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-white">AquaFlow <span className="text-aqua-cyan">SV</span></h1>
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-500">Monitoreo Hídrico</p>
          </div>
        </div>

        {/* CARD PRINCIPAL */}
        <div className="bg-aqua-card border border-white/5 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-aqua-cyan/5 rounded-full blur-3xl pointer-events-none" />

          {isLogin ? (
            <div className="space-y-6 animate-in slide-in-from-left-4 duration-500">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-white tracking-tight">Bienvenido</h2>
                <p className="text-gray-500 text-sm mt-1 font-medium">Ingresa tu email y contraseña</p>
              </div>

              {/* Agregamos el onSubmit aquí */}
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="tu@email.com"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3 text-sm text-white focus:outline-none focus:border-aqua-cyan/50 focus:bg-white/[0.05] transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-1">Contraseña</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3 text-sm text-white focus:outline-none focus:border-aqua-cyan/50 focus:bg-white/[0.05] transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-aqua-cyan hover:bg-aqua-cyan/80 text-aqua-dark font-black py-4 rounded-2xl transition-all shadow-lg shadow-aqua-cyan/10 active:scale-[0.98] mt-4"
                >
                  INICIAR SESIÓN
                </button>
              </form>
            </div>
          ) : (
            /* FORMULARIO DE REGISTRO */
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-white tracking-tight">Crear Cuenta</h2>
                <p className="text-gray-500 text-sm mt-1 font-medium">Regístrate para acceder al sistema</p>
              </div>

              <form className="space-y-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-1">Nombre Completo</label>
                  <input type="text" required placeholder="Tu nombre" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3 text-sm text-white focus:outline-none focus:border-aqua-cyan/50 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-1">Email</label>
                  <input type="email" required placeholder="tu@email.com" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3 text-sm text-white focus:outline-none focus:border-aqua-cyan/50 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-1">Contraseña</label>
                  <input type="password" required placeholder="••••••••" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3 text-sm text-white focus:outline-none focus:border-aqua-cyan/50 transition-all" />
                </div>
                <button type="submit" className="w-full bg-white hover:bg-gray-200 text-black font-black py-4 rounded-2xl transition-all active:scale-[0.98] mt-4">
                  CREAR CUENTA
                </button>
              </form>
            </div>
          )}

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest"><span className="bg-aqua-card px-4 text-gray-600">O</span></div>
          </div>

          <button
            onClick={toggleForm}
            className="w-full text-[11px] font-bold text-gray-400 hover:text-aqua-cyan transition-colors uppercase tracking-widest"
          >
            {isLogin ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia Sesión"}
          </button>
        </div>
      </div>
    </div>
  );
}
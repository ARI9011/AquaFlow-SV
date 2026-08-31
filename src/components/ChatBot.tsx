import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { RotateCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useA11y } from '../context/AccessibilityContext';
import { useLang } from '../context/LanguageContext';
import { useConfirm } from './ConfirmDialog';

type Role = 'user' | 'assistant';
interface Message { role: Role; content: string; }

const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
    strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
  </svg>
);
const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
    strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

// avatar de AquaBot, sin fondo, solo la imagen
const BotAvatar = ({ size = 'sm', pose = 'principal' }: { size?: 'sm' | 'xs'; pose?: 'principal' | 'sin-datos' | 'alerta-detectada' }) => (
  <img
    src={`/aquabot-${pose}.png`}
    alt="AquaBot"
    className={`${size === 'sm' ? 'w-14 h-14' : 'w-7 h-7'} object-contain flex-shrink-0`}
  />
);

// saludos del botón, se elige uno random
const SALUDOS_BOTON = [
  '¡Hola! 👋',
  '¿Te ayudo?',
  '¿Alguna duda?',
  'Pregúntame algo',
  '¡Aquí estoy!',
  '¿Cómo va tu día?',
  '¡Hablemos!',
];

export default function ChatBot() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setChatAbierto } = useA11y();
  const { t, lang } = useLang();
  const confirmDialog = useConfirm();
  const [open, setOpen]     = useState(false);
  const [saludoBoton] = useState(() => SALUDOS_BOTON[Math.floor(Math.random() * SALUDOS_BOTON.length)]);

  // avisamos si está abierto para esconder el botón de accesibilidad
  useEffect(() => { setChatAbierto(open); }, [open, setChatAbierto]);
  useEffect(() => () => setChatAbierto(false), [setChatAbierto]);

  // Vacío = se muestra el saludo (calculado al vuelo con t(), no guardado en el
  // estado) en vez de un mensaje fijo — así si cambias de idioma a medio chat,
  // el saludo se actualiza solo igual que el resto de la página.
  const [messages, setMessages] = useState<Message[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [input, setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const [limiteAlcanzado, setLimiteAlcanzado] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  // Con sesión: carga la conversación guardada de esa persona. Sin sesión (o al
  // cerrarla): la conversación es solo de este navegador, en memoria.
  useEffect(() => {
    if (!user) { setMessages([]); return; }
    setCargandoHistorial(true);
    axios.get('/api/chat/historial')
      .then(({ data }) => {
        if (Array.isArray(data)) {
          setMessages(data.map((m: any) => ({ role: m.rol, content: m.contenido })));
        }
      })
      .catch(() => { /* se queda vacío, no es grave */ })
      .finally(() => setCargandoHistorial(false));
  }, [user]);

  // si inicia sesión con el chat abierto, se quita el límite
  useEffect(() => {
    if (user) setLimiteAlcanzado(false);
  }, [user]);

  const irALogin = () => {
    setOpen(false);
    navigate('/login');
  };

  const nuevaConversacion = async () => {
    const ok = await confirmDialog({
      message: t('¿Empezar una conversación nueva? Se borrará el historial guardado de este chat.'),
      danger: true,
    });
    if (!ok) return;
    if (user) {
      try { await axios.delete('/api/chat/historial'); } catch { /* se intenta de nuevo la próxima vez */ }
    }
    setMessages([]);
    setLimiteAlcanzado(false);
  };

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [open, messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading || limiteAlcanzado) return;
    const newMessages: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const { data } = await axios.post('/api/chat', {
        messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        lang,
      });
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err: any) {
      if (err?.response?.status === 403 && err.response.data?.requiresLogin) {
        setLimiteAlcanzado(true);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: t('Ocurrió un error al conectar con el servidor. Intenta de nuevo.'),
        }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const ui = (
    <>
      {/* animación de entrada del panel */}
      <style>{`
        @keyframes slide-up-panel {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>

      {/* botón flotante con la mascota */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-2 select-none">
        {!open && (
          <span className="hidden sm:block text-[10px] font-bold tracking-widest text-aqua-cyan/70 uppercase max-w-[160px] text-right">
            {t(saludoBoton)}
          </span>
        )}
        <button
          onClick={() => setOpen(v => !v)}
          aria-label={open ? t('Cerrar AquaBot') : t('Abrir AquaBot')}
          className={`flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-aqua-cyan rounded-2xl ${
            open
              ? 'w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-aqua-cyan to-teal-600 text-ink shadow-xl hover:shadow-aqua-cyan/30'
              : 'w-16 h-16 sm:w-20 sm:h-20 drop-shadow-[0_6px_14px_rgba(0,242,234,0.35)]'
          }`}
        >
          {open
            ? <CloseIcon />
            : <img src="/aquabot-principal.png" alt="AquaBot" className="w-full h-full object-contain" />}
        </button>
      </div>

      {/* panel de chat */}
      {open && (
        <div className="fixed bottom-[4.5rem] right-4 left-4 sm:left-auto sm:bottom-24 sm:right-6 z-50 w-auto sm:w-[360px] max-h-[70vh] sm:max-h-[540px] flex flex-col rounded-2xl border border-ink/10 bg-[var(--color-aqua-panel)] shadow-2xl shadow-black/70 overflow-hidden"
          style={{ animation: 'slide-up-panel .22s ease' }}>

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-aqua-cyan/15 to-transparent border-b border-ink/5">
            <BotAvatar size="sm" />
            <div>
              <p className="font-black text-sm text-ink leading-none">AquaBot</p>
              <p className="text-[10px] text-aqua-cyan/80 font-medium">{t('Asistente IA')} · AquaFlow SV</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px] text-green-400 font-medium">{t('En línea')}</span>
              </div>
              {messages.length > 0 && (
                <button
                  onClick={nuevaConversacion}
                  title={t('Nueva conversación')}
                  aria-label={t('Nueva conversación')}
                  className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-500 hover:text-aqua-cyan hover:bg-aqua-cyan/10 transition-colors flex-shrink-0"
                >
                  <RotateCcw size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {!cargandoHistorial && messages.length === 0 && (
              <div className="flex gap-2 justify-start">
                <div className="mt-1"><BotAvatar size="xs" /></div>
                <div className="max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed bg-ink/5 text-ink rounded-bl-sm border border-ink/5">
                  <p>{t('¡Hola! Soy AquaBot, tu asistente de AquaFlow SV. ¿En qué puedo ayudarte hoy?')}</p>
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="mt-1">
                    <BotAvatar size="xs" />
                  </div>
                )}
                <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed space-y-1.5 ${
                  msg.role === 'user'
                    ? 'bg-aqua-cyan text-aqua-dark font-semibold rounded-br-sm'
                    : 'bg-ink/5 text-ink rounded-bl-sm border border-ink/5'
                }`}>
                  {msg.content.split('\n').map((linea, li) => linea.trim() && (
                    <p key={li} className="whitespace-pre-wrap">{linea}</p>
                  ))}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="mt-1"><BotAvatar size="xs" pose="sin-datos" /></div>
                <div className="bg-ink/5 border border-ink/5 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-aqua-cyan animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-aqua-cyan animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-aqua-cyan animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}

            {limiteAlcanzado && (
              <div className="flex gap-2 justify-start">
                <div className="mt-1"><BotAvatar size="xs" pose="alerta-detectada" /></div>
                <div className="max-w-[85%] px-3.5 py-3 rounded-2xl rounded-bl-sm bg-amber-500/10 border border-amber-500/25 space-y-2.5">
                  <p className="text-sm text-ink/90 leading-relaxed">
                    {t('Alcanzaste el límite de mensajes gratuitos de AquaBot. Inicia sesión o regístrate para seguir chateando sin límite.')}
                  </p>
                  <button
                    onClick={irALogin}
                    className="w-full py-2 rounded-lg bg-aqua-cyan text-aqua-dark text-xs font-black uppercase tracking-wide hover:bg-aqua-cyan/80 transition-colors"
                  >
                    {t('Iniciar sesión / Registrarme')}
                  </button>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-ink/5 flex gap-2 bg-ink/[0.02]">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={limiteAlcanzado ? t('Inicia sesión para continuar...') : t('Escribe tu pregunta...')}
              disabled={loading || limiteAlcanzado}
              className="flex-1 bg-ink/5 border border-ink/10 rounded-xl px-3 py-2 text-sm text-ink placeholder-gray-600 outline-none focus:border-aqua-cyan/40 disabled:opacity-50 transition-colors"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading || limiteAlcanzado}
              className="w-9 h-9 rounded-xl bg-aqua-cyan text-aqua-dark flex items-center justify-center hover:bg-aqua-cyan/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      )}
    </>
  );

  return createPortal(ui, document.body);
}

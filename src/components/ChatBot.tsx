import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

type Role = 'user' | 'assistant';
interface Message { role: Role; content: string; }

/* ─── Ícono del botón flotante ─── */
const ChatBubbleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" aria-hidden="true">
    <path
      d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
      fill="currentColor"
    />
    <circle cx="8"  cy="11" r="1.1" fill="white" />
    <circle cx="12" cy="11" r="1.1" fill="white" />
    <circle cx="16" cy="11" r="1.1" fill="white" />
  </svg>
);

/* ─── Iconos ─── */
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

/* ─── Avatar IA para mensajes y header ─── */
const BotAvatar = ({ size = 'sm' }: { size?: 'sm' | 'xs' }) => (
  <div className={`${size === 'sm' ? 'w-8 h-8' : 'w-6 h-6'} rounded-xl bg-aqua-cyan/15 border border-aqua-cyan/25 flex items-center justify-center text-aqua-cyan flex-shrink-0`}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}
      strokeLinecap="round" strokeLinejoin="round"
      className={size === 'sm' ? 'w-4 h-4' : 'w-3.5 h-3.5'}>
      <rect x="5" y="8" width="14" height="12" rx="2" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      <path d="M9 13h.01M15 13h.01" />
      <path d="M9 17h6" />
    </svg>
  </div>
);

export default function ChatBot() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen]     = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '¡Hola! Soy AquaBot, tu asistente de AquaFlow SV. ¿En qué puedo ayudarte hoy?' },
  ]);
  const [input, setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const [limiteAlcanzado, setLimiteAlcanzado] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  // Si el usuario inicia sesión mientras el chat está abierto, se levanta el límite.
  useEffect(() => {
    if (user) setLimiteAlcanzado(false);
  }, [user]);

  const irALogin = () => {
    setOpen(false);
    navigate('/login');
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
      });
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err: any) {
      if (err?.response?.status === 403 && err.response.data?.requiresLogin) {
        setLimiteAlcanzado(true);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Ocurrió un error al conectar con el servidor. Intenta de nuevo.',
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
      {/* ── Animación slide-up para el panel ── */}
      <style>{`
        @keyframes slide-up-panel {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>

      {/* ── Botón flotante profesional ── */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-2 select-none">
        {!open && (
          <span className="hidden sm:block text-[10px] font-bold tracking-widest text-aqua-cyan/70 uppercase">
            AquaBot
          </span>
        )}
        <button
          onClick={() => setOpen(v => !v)}
          aria-label={open ? 'Cerrar AquaBot' : 'Abrir AquaBot'}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-aqua-cyan to-teal-600 text-ink flex items-center justify-center shadow-xl hover:shadow-aqua-cyan/30 hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-aqua-cyan"
        >
          {open ? <CloseIcon /> : <ChatBubbleIcon />}
        </button>
      </div>

      {/* ── Panel de chat ── */}
      {open && (
        <div className="fixed bottom-[4.5rem] right-4 left-4 sm:left-auto sm:bottom-24 sm:right-6 z-50 w-auto sm:w-[360px] max-h-[70vh] sm:max-h-[540px] flex flex-col rounded-2xl border border-ink/10 bg-[var(--color-aqua-panel)] shadow-2xl shadow-black/70 overflow-hidden"
          style={{ animation: 'slide-up-panel .22s ease' }}>

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-aqua-cyan/15 to-transparent border-b border-ink/5">
            <BotAvatar size="sm" />
            <div>
              <p className="font-black text-sm text-ink leading-none">AquaBot</p>
              <p className="text-[10px] text-aqua-cyan/80 font-medium">Asistente IA · AquaFlow SV</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] text-green-400 font-medium">En línea</span>
            </div>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="mt-1">
                    <BotAvatar size="xs" />
                  </div>
                )}
                <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-aqua-cyan text-aqua-dark font-semibold rounded-br-sm'
                    : 'bg-ink/5 text-ink rounded-bl-sm border border-ink/5'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="mt-1"><BotAvatar size="xs" /></div>
                <div className="bg-ink/5 border border-ink/5 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-aqua-cyan animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-aqua-cyan animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-aqua-cyan animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}

            {limiteAlcanzado && (
              <div className="flex gap-2 justify-start">
                <div className="mt-1"><BotAvatar size="xs" /></div>
                <div className="max-w-[85%] px-3.5 py-3 rounded-2xl rounded-bl-sm bg-amber-500/10 border border-amber-500/25 space-y-2.5">
                  <p className="text-sm text-ink/90 leading-relaxed">
                    Alcanzaste el límite de mensajes gratuitos de AquaBot. Inicia sesión o regístrate para seguir chateando sin límite.
                  </p>
                  <button
                    onClick={irALogin}
                    className="w-full py-2 rounded-lg bg-aqua-cyan text-aqua-dark text-xs font-black uppercase tracking-wide hover:bg-aqua-cyan/80 transition-colors"
                  >
                    Iniciar sesión / Registrarme
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
              placeholder={limiteAlcanzado ? 'Inicia sesión para continuar...' : 'Escribe tu pregunta...'}
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

import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { X, Send, Sparkles, Bot, ShieldCheck, RotateCcw } from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface ChatSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  initialContext?: string;
  prefilledPrompt?: string;
}

export const ChatSlideOver: React.FC<ChatSlideOverProps> = ({
  isOpen,
  onClose,
  initialContext = 'general',
  prefilledPrompt = '',
}) => {
  const { messages, send, isTyping, clearChat } = useChat({ initialContext: initialContext as any });
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const [sentCount, setSentCount] = useState<number>(0);
  const endRef = useRef<HTMLDivElement | null>(null);
  const { user, openAuthModal } = useAuth();

  // Load / sync message count from localStorage
  useEffect(() => {
    try {
      if (user) {
        // Logged-in users should have their demo counter cleared
        localStorage.removeItem('sent_messages_count');
        localStorage.removeItem('aria_demo_count');
        setSentCount(0);
      } else {
        const stored = parseInt(localStorage.getItem('sent_messages_count') || '0', 10);
        setSentCount(isNaN(stored) ? 0 : stored);
      }
    } catch {
      setSentCount(0);
    }
  }, [user, isOpen]);

  // If a prefilledPrompt is passed when opened, auto-send it
  useEffect(() => {
    if (isOpen && prefilledPrompt && prefilledPrompt.trim()) {
      submit(undefined, prefilledPrompt);
    }
  }, [isOpen, prefilledPrompt]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [isOpen, messages, isTyping]);

  const incrementSentCount = () => {
    if (user) return; // Do not increment demo counter for authenticated users
    try {
      const next = sentCount + 1;
      setSentCount(next);
      localStorage.setItem('sent_messages_count', String(next));
      localStorage.setItem('aria_demo_count', String(next));
    } catch {
      // ignore
    }
  };

  // Authenticated user bypass
  const isAuthenticated = Boolean(user);

  // Limit only applies to anonymous users who have reached 3 or more messages
  const isLimitReached = !isAuthenticated && sentCount >= 3;

  const renderMarkdown = (text: string) => {
    const raw = marked.parse(text || '') as string;
    const clean = DOMPurify.sanitize(raw);
    return { __html: clean };
  };

  const submit = async (e?: React.FormEvent, customText?: string) => {
    e?.preventDefault();
    if (isLimitReached) return;

    const textToSend = customText || input;
    if (!textToSend.trim()) return;

    setInput('');
    await send(textToSend, initialContext, messages);
    incrementSentCount();
  };

  if (!isOpen) return null;

  return (
    <div className="slide-over open fixed inset-0 z-50">
      <div className="overlay absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      <aside className="drawer relative z-10 bg-slate-950 text-slate-100 w-full max-w-md ml-auto h-full shadow-2xl flex flex-col border-l border-emerald-500/30">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 font-bold">
                <Bot className="w-5 h-5" />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full"></span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm text-white">{t('chat.title')}</h3>
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-[10px] text-slate-400">
                {isAuthenticated ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 inline" /> Acceso Ilimitado Activo
                  </span>
                ) : (
                  <span className={isLimitReached ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                    Prueba Gratis ({Math.min(sentCount, 3)}/3 Mensajes)
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={clearChat}
              title="Reiniciar chat / Limpiar historial"
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-emerald-400 transition-all cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              aria-label="Cerrar ventana de chat"
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Container */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3 font-sans text-xs bg-slate-950">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-slate-400">
              <Bot className="w-10 h-10 text-emerald-500/50" />
              <p className="text-xs max-w-xs">
                {t('chat.welcomeDefault')}
              </p>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[85%] p-3 rounded-2xl leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-tr-none shadow-md'
                      : 'bg-slate-900 text-slate-200 border border-white/10 rounded-tl-none prose prose-invert max-w-none'
                  }`}
                  dangerouslySetInnerHTML={m.sender !== 'user' ? renderMarkdown(m.content || m.text || '') : undefined}
                >
                  {m.sender === 'user' ? (m.content || m.text) : null}
                </div>
              </div>
            ))
          )}

          {isTyping && (
            <div className="flex items-center gap-2 text-slate-400 text-xs italic p-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"></span>
              <span>{t('chat.typing')}</span>
            </div>
          )}

          {/* Friendly Paywall Banner when 3-message limit is reached (Anonymous only) */}
          {isLimitReached && (
            <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/40 text-center space-y-3 my-3 shadow-xl animate-fadeIn">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-white">Límite de prueba alcanzado</p>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {initialContext === 'property'
                    ? '¿Te gustaría dejar tu WhatsApp para que un asesor te contacte y coordine una visita?'
                    : 'Has alcanzado el límite de 3 consultas de prueba. Crea tu cuenta gratis o inicia sesión para continuar usando el asistente sin límites.'}
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => openAuthModal('signup')}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  ✨ Crear Cuenta Gratis
                </button>
                <a
                  href="https://wa.me/5491140143729?text=Hola,%20alcanc%C3%A9%20el%20l%C3%ADmite%20de%203%20mensajes%20de%20prueba%20y%20quisiera%20coordinar%20una%20visita."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 font-bold text-xs transition-all text-center block"
                >
                  💬 Contactar Asesor por WhatsApp
                </a>
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* Input Footer */}
        <form onSubmit={submit} className="p-3.5 bg-slate-900 border-t border-white/10 flex items-center gap-2">
          <input
            type="text"
            disabled={isLimitReached}
            className="input flex-1 bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isLimitReached ? 'Límite de 3 mensajes alcanzado' : t('chat.placeholder')}
          />
          <button
            type="submit"
            disabled={isLimitReached || !input.trim()}
            className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </aside>
    </div>
  );
};

export default ChatSlideOver;

import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../context/AuthContext';
import { X, Send, Sparkles, Bot, ShieldCheck } from 'lucide-react';
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
  const { messages, send, isTyping } = useChat({ initialContext: initialContext as any });
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);
  const { user, openAuthModal } = useAuth();

  // If a prefilledPrompt is passed when opened, set it in input or auto-send
  useEffect(() => {
    if (isOpen && prefilledPrompt) {
      setInput(prefilledPrompt);
    }
  }, [isOpen, prefilledPrompt]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [isOpen, messages, isTyping]);

  const getSentCount = (): number => {
    try {
      return parseInt(localStorage.getItem('sent_messages_count') || '0', 10);
    } catch {
      return 0;
    }
  };

  const incrementSentCount = () => {
    try {
      const current = getSentCount();
      localStorage.setItem('sent_messages_count', String(current + 1));
    } catch {
      // ignore
    }
  };

  // Dev admin bypass check
  const isAdmin = Boolean(
    user?.role === 'admin' ||
    user?.email === 'admin@admin.com' ||
    localStorage.getItem('aria_prop_mock_role') === 'admin'
  );

  const renderMarkdown = (text: string) => {
    const raw = marked.parse(text || '') as string;
    const clean = DOMPurify.sanitize(raw);
    return { __html: clean };
  };

  const submit = async (e?: React.FormEvent, customText?: string) => {
    e?.preventDefault();
    const textToSend = customText || input;
    if (!textToSend.trim()) return;

    // Enforce 2 free message limit for non-admin users
    if (!isAdmin) {
      const sent = getSentCount();
      if (sent >= 2) {
        openAuthModal('login');
        return;
      }
    }

    setInput('');
    await send(textToSend, initialContext, messages);

    if (!isAdmin) {
      incrementSentCount();
    }
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
                <h3 className="font-bold text-sm text-white">Aria — Asistente IA 24/7</h3>
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-[10px] text-slate-400">
                {isAdmin ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 inline" /> Dev Admin (Mensajes Ilimitados)
                  </span>
                ) : (
                  `Prueba Gratis: ${getSentCount()}/2 mensajes utilizados`
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Cerrar ventana de chat"
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Container */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3 font-sans text-xs bg-slate-950">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-slate-400">
              <Bot className="w-10 h-10 text-emerald-500/50" />
              <p className="text-xs max-w-xs">
                ¡Hola! Soy Aria. ¿En qué puedo ayudarte hoy con la búsqueda, ROI o visitas de tus inmuebles?
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
                  dangerouslySetInnerHTML={m.sender === 'agent' ? renderMarkdown(m.text) : undefined}
                >
                  {m.sender === 'user' ? m.text : null}
                </div>
              </div>
            ))
          )}

          {isTyping && (
            <div className="flex items-center gap-2 text-slate-400 text-xs italic p-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"></span>
              <span>Aria está respondiendo...</span>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input Footer */}
        <form onSubmit={submit} className="p-3.5 bg-slate-900 border-t border-white/10 flex items-center gap-2">
          <input
            type="text"
            className="input flex-1 bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu mensaje o consulta RAG..."
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </aside>
    </div>
  );
};

export default ChatSlideOver;

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Building2, MapPin, Calendar, CheckCircle2 } from 'lucide-react';
import { Property } from '../../types';
import { PaywallModal } from '../chat/PaywallModal';
import { useAuth } from '../../context/AuthContext';

interface InteractiveSandboxWidgetProps {
  sampleProperties: Property[];
}

export const InteractiveSandboxWidget: React.FC<InteractiveSandboxWidgetProps> = ({ sampleProperties }) => {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'agent'; text: string; property?: Property }>>([
    {
      sender: 'agent',
      text: '¡Hola! Soy Aria. ¿Buscas comprar, alquilar o información sobre alguna propiedad en particular?',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const chatBoxRef = useRef<HTMLDivElement>(null);

  // Initialize sent free message state from localStorage
  const { user } = useAuth();
  const [freeMessageCount, setFreeMessageCount] = useState<number>(() => {
    return parseInt(localStorage.getItem('freeMessageCount') || '0', 10);
  });

  useEffect(() => {
    if (chatBoxRef.current && messages.length > 1) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputValue;
    if (!textToSend.trim()) return;

    // Unregistered users get 2 free messages before paywall
    if (!user && freeMessageCount >= 2) {
      setShowPaywall(true);
      return;
    }

    if (!user) {
      const nextCount = freeMessageCount + 1;
      setFreeMessageCount(nextCount);
      localStorage.setItem('freeMessageCount', nextCount.toString());
    }

    // Add user message
    const newMessages = [...messages, { sender: 'user' as const, text: textToSend }];
    setMessages(newMessages);
    if (!customPrompt) setInputValue('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: newMessages.map((m) => ({ sender: m.sender, content: m.text })),
        }),
      });

      if (!response.body) {
        setIsTyping(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let recommendedProp: Property | undefined;

      // Check if message matches any property
      const matched = sampleProperties.find(
        (p) =>
          textToSend.toLowerCase().includes(p.location.zone.toLowerCase()) ||
          textToSend.toLowerCase().includes(p.type) ||
          textToSend.toLowerCase().includes('chalet') ||
          textToSend.toLowerCase().includes('ático')
      );
      if (matched) recommendedProp = matched;

      setMessages((prev) => [...prev, { sender: 'agent', text: '', property: recommendedProp }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.replace('data: ', ''));
              if (data.text) {
                fullText += data.text;
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last && last.sender === 'agent') {
                    last.text = fullText;
                  }
                  return updated;
                });
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'agent',
          text: 'Disculpa, ocurrió una pequeña interrupción en la conexión. Te recomiendo nuestro Chalet de Lujo en La Moraleja (3.450.000€).',
          property: sampleProperties[0],
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const inputRef = useRef<HTMLInputElement>(null);

  const handleChipClick = (promptText: string) => {
    setInputValue(promptText);
    inputRef.current?.focus();
    handleSend(promptText);
  };

  return (
    <div className="w-full max-w-md mx-auto rounded-2xl bg-slate-900/90 border border-emerald-500/30 shadow-2xl shadow-emerald-500/10 overflow-hidden flex flex-col h-[540px] relative backdrop-blur-xl">
      
      {/* Widget Header */}
      <div className="p-3.5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80"
              alt="Aria Prop"
              className="w-10 h-10 rounded-full object-cover border-2 border-emerald-400/50"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full animate-ping"></span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold text-white">Habla con Aria | Asesora Inmobiliaria 24/7</h4>
              <Sparkles className="w-3 h-3 text-emerald-400" />
            </div>
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              En línea 24/7 • Sandbox Live
            </p>
          </div>
        </div>
        <div className="px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-mono">
          Demo Live RAG
        </div>
      </div>

      {/* Quick Prompts Bar (Cloudairy-Inspired Prompt Chips) */}
      <div className="p-2 bg-slate-950/80 border-b border-white/5 flex gap-1.5 overflow-x-auto no-scrollbar text-[11px]">
        <button
          onClick={() => handleChipClick('📊 Calcular ROI de departamento')}
          className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-emerald-500/20 text-slate-200 hover:text-emerald-300 border border-white/10 hover:border-emerald-500/40 transition-all cursor-pointer flex items-center gap-1 font-medium"
        >
          <span>📊 Calcular ROI de departamento</span>
        </button>
        <button
          onClick={() => handleChipClick('🏠 Buscar inmuebles de 2 dormitorios')}
          className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-emerald-500/20 text-slate-200 hover:text-emerald-300 border border-white/10 hover:border-emerald-500/40 transition-all cursor-pointer flex items-center gap-1 font-medium"
        >
          <span>🏠 Buscar inmuebles de 2 dormitorios</span>
        </button>
        <button
          onClick={() => handleChipClick('📄 Consultar detalles de plano / dossier')}
          className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-emerald-500/20 text-slate-200 hover:text-emerald-300 border border-white/10 hover:border-emerald-500/40 transition-all cursor-pointer flex items-center gap-1 font-medium"
        >
          <span>📄 Consultar detalles de plano / dossier</span>
        </button>
        <button
          onClick={() => handleChipClick('📅 Agendar visita virtual')}
          className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-emerald-500/20 text-slate-200 hover:text-emerald-300 border border-white/10 hover:border-emerald-500/40 transition-all cursor-pointer flex items-center gap-1 font-medium"
        >
          <span>📅 Agendar visita virtual</span>
        </button>
      </div>

      {/* Messages List (Internal Scroll Only) */}
      <div ref={chatBoxRef} className="flex-1 p-3.5 overflow-y-auto space-y-3 font-sans text-xs">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-2xl leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-emerald-600 text-white rounded-tr-none shadow-md shadow-emerald-600/20'
                  : 'bg-slate-800/90 text-slate-200 border border-white/10 rounded-tl-none'
              }`}
            >
              {m.text || (isTyping && idx === messages.length - 1 ? 'Aria está escribiendo...' : '')}
            </div>

            {/* Rich Property Card if attached */}
            {m.property && (
              <div className="mt-2 max-w-[90%] p-2.5 rounded-xl bg-slate-950 border border-emerald-500/30 shadow-lg space-y-2">
                <div className="relative h-28 rounded-lg overflow-hidden">
                  <img
                    src={m.property.images[0]}
                    alt={m.property.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                    {m.property.price.toLocaleString('es-ES')} €
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-white truncate">{m.property.title}</p>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    {m.property.location.zone}, {m.property.location.city}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-300 pt-1 border-t border-white/10">
                  <span>{m.property.features.bedrooms} hab</span>
                  <span>•</span>
                  <span>{m.property.features.areaM2} m²</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-semibold">{m.property.features.pool ? 'Piscina' : 'Garaje'}</span>
                </div>
                <button
                  onClick={() => handleSend(`Me interesa agendar visita para ${m.property?.title}`)}
                  className="w-full py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-semibold border border-emerald-500/40 transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Calendar className="w-3 h-3" />
                  <span>Agendar Visita Virtual</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Chat Input */}
      <div className="p-2.5 bg-slate-950 border-t border-white/10 flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Escribe tus criterios de búsqueda..."
          className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
        />
        <button
          onClick={() => handleSend()}
          disabled={!inputValue.trim()}
          className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all disabled:opacity-50 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* Paywall Conversion Modal */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
      />

    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { Property, BotConfig } from '../../types';
import { Send, Bot } from 'lucide-react';
import { PaywallModal } from '../chat/PaywallModal';
import { TwitterActionCard } from '../marketing/TwitterActionCard';
import { useAuth } from '../../context/AuthContext';
import { getUserProfile } from '../../lib/supabase';

interface EmbedChatWidgetProps {
  botConfig: BotConfig;
  properties: Property[];
}

export const EmbedChatWidget: React.FC<EmbedChatWidgetProps> = ({ botConfig, properties }) => {
  const { user, openAuthModal } = useAuth();
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'agent'; text: string; property?: Property }>>([
    {
      sender: 'agent',
      text: botConfig.welcomeMessage || '¡Hola! Soy Aria. ¿En qué puedo ayudarte hoy?',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Allow 2 free messages by default
  const [sentCount, setSentCount] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('sent_messages_count') || '0', 10) || 0;
    } catch {
      return 0;
    }
  });

  const [isUnlimited, setIsUnlimited] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    let mounted = true;
    async function loadProfile() {
      if (user?.id) {
        try {
          const profile = await getUserProfile(user.id);
          if (!mounted) return;
          if (profile?.estado_cuenta === 'plan_activo' || profile?.estado_cuenta === 'pro_basico' || (profile as any)?.role === 'admin') {
            setIsUnlimited(true);
          }
        } catch (e) {
          // ignore
        }
      }
    }
    loadProfile();
    return () => {
      mounted = false;
    };
  }, [user]);

  const handleSend = async (text?: string) => {
    const textToSend = text || inputValue;
    if (!textToSend.trim()) return;

    // If user has unlimited plan or admin, allow unlimited
    if (!isUnlimited) {
      if (sentCount >= 2) {
        setShowPaywall(true);
        return;
      }
      const newCount = sentCount + 1;
      setSentCount(newCount);
      try {
        localStorage.setItem('sent_messages_count', String(newCount));
      } catch {}
    }

    const newMessages = [...messages, { sender: 'user' as const, text: textToSend }];
    setMessages(newMessages);
    if (!text) setInputValue('');
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

      const matchedProp = properties.find((p) =>
        textToSend.toLowerCase().includes(p.location.city.toLowerCase()) ||
        textToSend.toLowerCase().includes(p.type) ||
        textToSend.toLowerCase().includes('chalet') ||
        textToSend.toLowerCase().includes('lujo')
      );

      setMessages((prev) => [...prev, { sender: 'agent', text: '', property: matchedProp }]);

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
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'agent',
          text: 'Con mucho gusto te asesoro. Te recomiendo consultar nuestro catálogo. Si lo prefieres, agenda una visita con nosotros.',
          property: properties[0],
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {/* Twitter / X High-Impact CTA Widget Card */}
      <TwitterActionCard onSelectPrompt={(prompt) => handleSend(prompt)} />

      {/* Main Embedded Chat Card */}
      <div className="w-full h-[580px] rounded-3xl bg-slate-900/95 border border-emerald-500/30 shadow-2xl overflow-hidden flex flex-col backdrop-blur-2xl">

        {/* Header */}
        <div className="p-4 text-slate-950 font-bold flex items-center justify-between" style={{ backgroundColor: botConfig.primaryColor || '#10b981' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-950/20 border border-slate-950/30 flex items-center justify-center">
              <Bot className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold leading-tight">{botConfig.agentName || 'Aria Prop IA'}</h4>
              <p className="text-[10px] opacity-85">{botConfig.agencyName || 'Agencia Inmobiliaria'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-slate-950/20 text-slate-950 text-[10px] font-mono font-bold">Widget Embebido</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs font-sans">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-2xl leading-relaxed ${m.sender === 'user' ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-white/[0.04] text-slate-200 border border-white/5 rounded-tl-none'}`}>
                {m.text || (isTyping && idx === messages.length - 1 ? 'Escribiendo...' : '')}
              </div>

              {m.property && (
                <div className="mt-2 max-w-[90%] p-3 rounded-xl bg-black/40 border border-emerald-500/30 space-y-2">
                  <img src={m.property.images[0]} alt={m.property.title} className="w-full h-24 object-cover rounded-xl" />
                  <p className="font-semibold text-white text-xs truncate">{m.property.title}</p>
                  <p className="text-[10px] text-emerald-400 font-mono font-bold">{m.property.price.toLocaleString('es-ES')} €</p>
                  <button onClick={() => handleSend(`Deseo solicitar cita para la propiedad ${m.property?.code}`)} className="w-full py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold text-[11px] border border-emerald-500/30">Agendar Cita</button>
                </div>
              )}
            </div>
          ))}
          {isTyping && <p className="text-[10px] text-slate-500 italic">La IA está pensando...</p>}
          <div ref={chatEndRef} />
        </div>

        {/* Quick replies */}
        {botConfig.enableQuickReplies && botConfig.quickReplies && (
          <div className="p-2 bg-black/40 border-t border-white/5 flex gap-1.5 overflow-x-auto no-scrollbar text-[10px]">
            {botConfig.quickReplies.map((qr, i) => (
              <button key={i} onClick={() => handleSend(qr)} className="shrink-0 px-2.5 py-1 rounded-lg bg-white/5 text-slate-300 hover:text-white border border-white/5 cursor-pointer">{qr}</button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-3 bg-black/40 border-t border-white/5 flex items-center gap-2">
          <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Escribe tu idea o consulta de tu proyecto..." className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all" />
          <button onClick={() => handleSend()} className="p-2.5 rounded-xl text-slate-950 font-bold transition-all cursor-pointer" style={{ backgroundColor: botConfig.primaryColor || '#10b981' }}>
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Paywall Modal */}
      <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} />
    </div>
  );
};

export default EmbedChatWidget;

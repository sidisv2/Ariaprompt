import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Sparkles, Building2, Phone, Calendar, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const StandaloneChatWidget: React.FC = () => {
  const [agencyId, setAgencyId] = useState<string>('');
  const [agentName, setAgentName] = useState<string>('Aria');
  const [agencyName, setAgencyName] = useState<string>('Inmobiliaria Palermo');
  const [welcomeMessage, setWelcomeMessage] = useState<string>(
    '¡Hola! Soy tu asistente inmobiliaria 24/7. ¿Qué tipo de propiedad estás buscando o en qué zona te gustaría encontrar?'
  );
  const [primaryColor, setPrimaryColor] = useState<string>('#10b981');
  const [calendarUrl, setCalendarUrl] = useState<string>('');
  const [advisorPhone, setAdvisorPhone] = useState<string>('');

  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'agent'; text: string }>>([]);
  const [inputVal, setInputVal] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Leer agencyId de la URL (?agencyId=... o /embed/chat/:agencyId)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    let id = urlParams.get('agencyId') || urlParams.get('agency_id') || urlParams.get('agentId') || '';

    if (!id && window.location.pathname.includes('/embed/chat/')) {
      const parts = window.location.pathname.split('/embed/chat/');
      if (parts[1]) id = parts[1].replace('/', '');
    }

    setAgencyId(id);

    async function loadAgencyBotConfig(targetId: string) {
      if (!targetId || !supabase) return;

      try {
        // 1. Intentar buscar en profiles por id o user_id
        const { data: profile } = await supabase
          .from('profiles')
          .select('*, organizations(*)')
          .or(`id.eq.${targetId},organization_id.eq.${targetId}`)
          .maybeSingle();

        if (profile?.organizations) {
          const org = profile.organizations as any;
          if (org.bot_name) setAgentName(org.bot_name);
          if (org.name) setAgencyName(org.name);
          if (org.welcome_message) setWelcomeMessage(org.welcome_message);
          if (org.calendar_booking_url) setCalendarUrl(org.calendar_booking_url);
          if (org.advisor_alert_phone) setAdvisorPhone(org.advisor_alert_phone);
        } else if (profile) {
          if (profile.nombre || profile.full_name) setAgencyName(profile.nombre || profile.full_name);
          if (profile.advisor_alert_phone || profile.phone) setAdvisorPhone(profile.advisor_alert_phone || profile.phone);
        }

        // 2. Intentar buscar directamente en organizations
        const { data: org } = await supabase
          .from('organizations')
          .select('*')
          .or(`id.eq.${targetId},user_id.eq.${targetId}`)
          .maybeSingle();

        if (org) {
          if (org.bot_name) setAgentName(org.bot_name);
          if (org.name) setAgencyName(org.name);
          if (org.welcome_message) setWelcomeMessage(org.welcome_message);
          if (org.calendar_booking_url) setCalendarUrl(org.calendar_booking_url);
          if (org.advisor_alert_phone) setAdvisorPhone(org.advisor_alert_phone);
        }
      } catch (err) {
        console.warn('StandaloneChatWidget: Could not load config from Supabase:', err);
      }
    }

    if (id) {
      loadAgencyBotConfig(id);
    }
  }, []);

  // Inicializar con el mensaje de bienvenida
  useEffect(() => {
    setMessages([
      {
        sender: 'agent',
        text: welcomeMessage,
      },
    ]);
  }, [welcomeMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const query = inputVal.trim();
    if (!query || isTyping) return;

    setInputVal('');
    const newHistory = [...messages, { sender: 'user' as const, text: query }];
    setMessages(newHistory);
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: newHistory.map((m) => ({ sender: m.sender, content: m.text })),
          agency_id: agencyId,
        }),
      });

      if (!response.body) {
        setIsTyping(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      setMessages((prev) => [...prev, { sender: 'agent', text: '' }]);

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
              // ignore json parse error on streaming chunks
            }
          }
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'agent',
          text: 'Disculpá, tuve una interrupción de conexión. Por favor reintentá tu consulta.',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="w-full h-screen bg-[#0b141a] text-slate-100 flex flex-col font-sans select-none overflow-hidden">
      
      {/* Standalone Header */}
      <div
        className="p-3.5 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 border-b border-white/10 text-white flex items-center justify-between shadow-md"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black shadow-inner">
              <Bot className="w-5 h-5" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900"></span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-extrabold text-sm text-white tracking-tight">{agentName}</h3>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-bold border border-emerald-500/30">
                IA 24/7
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">{agencyName}</p>
          </div>
        </div>

        {calendarUrl && (
          <a
            href={calendarUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition-transform active:scale-95 flex items-center gap-1.5 shadow-sm"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Agendar Visita</span>
          </a>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs bg-[#0b141a]">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-fadeIn`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[80%] p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                msg.sender === 'user'
                  ? 'bg-emerald-600 text-white rounded-tr-none shadow-md shadow-emerald-950/20'
                  : 'bg-slate-900 text-slate-200 border border-white/10 rounded-tl-none shadow-sm'
              }`}
            >
              {msg.text || (isTyping && idx === messages.length - 1 ? 'Pensando respuesta...' : '')}
            </div>
            <span className="text-[9px] text-slate-500 font-mono mt-1 px-1">
              {msg.sender === 'user' ? 'Tú' : agentName}
            </span>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 p-3 max-w-[120px] rounded-2xl bg-slate-900 border border-white/10 text-emerald-400 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"></span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]"></span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-white/10 flex items-center gap-2">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Escribí tu consulta sobre propiedades..."
          className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
        />

        <button
          type="submit"
          disabled={isTyping || !inputVal.trim()}
          className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-transform active:scale-95 disabled:opacity-40 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Tiny Brand Footer */}
      <div className="py-1 px-3 bg-slate-950/90 text-center border-t border-white/5">
        <span className="text-[9px] text-slate-500 tracking-wider">
          Powered by <strong className="text-slate-400 font-bold">AriaProp.online</strong> • Asistente IA Inmobiliario
        </span>
      </div>

    </div>
  );
};

export default StandaloneChatWidget;

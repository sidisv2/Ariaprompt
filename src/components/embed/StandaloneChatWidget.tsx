import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Sparkles, Building2, Phone, Calendar, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'agent';
  text: string;
  timestamp: Date;
}

export const StandaloneChatWidget: React.FC = () => {
  const [agencyId, setAgencyId] = useState<string>('');
  const [agentName, setAgentName] = useState<string>('Aria');
  const [agencyName, setAgencyName] = useState<string>('Inmobiliaria Palermo');
  const [welcomeMessage, setWelcomeMessage] = useState<string>(
    '¡Hola! Soy tu asistente inmobiliaria 24/7. ¿Qué tipo de propiedad estás buscando o en qué zona te gustaría encontrar?'
  );
  const [calendarUrl, setCalendarUrl] = useState<string>('');
  const [advisorPhone, setAdvisorPhone] = useState<string>('');

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
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
        // 1. Buscar en profiles
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

        // 2. Buscar en organizations
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
        id: 'welcome-msg',
        sender: 'bot',
        text: welcomeMessage,
        timestamp: new Date(),
      },
    ]);
  }, [welcomeMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleSendMessage = async (textToSend?: string | React.FormEvent) => {
    if (typeof textToSend === 'object' && textToSend !== null && 'preventDefault' in textToSend) {
      textToSend.preventDefault();
      textToSend = undefined;
    }

    const messageText = (typeof textToSend === 'string' ? textToSend : inputVal).trim();
    if (!messageText || isSending) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsSending(true);

    // Agregar mensaje temporal del bot con loader
    const botMsgId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: botMsgId, sender: 'bot', text: '...', timestamp: new Date() },
    ]);

    try {
      // 1. Intentar llamar al backend /api/chat
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          agencyId: agencyId || undefined,
          agency_id: agencyId || undefined,
          history: messages.slice(-6).map((m) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }],
          })),
        }),
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('text/event-stream')) {
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let fullText = '';

          if (reader) {
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
                      setMessages((prev) =>
                        prev.map((m) => (m.id === botMsgId ? { ...m, text: fullText } : m))
                      );
                    }
                  } catch {}
                }
              }
            }
          }
          if (fullText.trim()) {
            setMessages((prev) =>
              prev.map((m) => (m.id === botMsgId ? { ...m, text: fullText } : m))
            );
            return;
          }
        }

        const data = await response.json();
        const botResponseText =
          data.reply ||
          data.text ||
          data.message ||
          '¡Hola! Estoy a tu disposición para ayudarte a encontrar la propiedad ideal.';
        setMessages((prev) =>
          prev.map((m) => (m.id === botMsgId ? { ...m, text: botResponseText } : m))
        );
      } else {
        throw new Error('API /api/chat error status: ' + response.status);
      }
    } catch (err) {
      console.warn('Fallback local para widget de chat:', err);
      // Respuesta asistida local inteligente si la API externa no está disponible
      let fallbackText = `¡Hola! Gracias por comunicarte con ${agencyName || 'nuestra agencia'}. `;
      const queryLower = messageText.toLowerCase();

      if (queryLower.includes('hola') || queryLower.includes('buenos') || queryLower.includes('buenas')) {
        fallbackText += `¿Estás buscando comprar, alquilar o información sobre algún departamento o lote en particular?`;
      } else if (
        queryLower.includes('precio') ||
        queryLower.includes('costo') ||
        queryLower.includes('cuanto') ||
        queryLower.includes('valor') ||
        queryLower.includes('tasacion')
      ) {
        fallbackText += `Contamos con opciones variadas en venta y alquiler con excelente tasación. Si me indicás la zona, ambientes o tu presupuesto estimado, te comparto las fichas comerciales disponibles.`;
      } else if (queryLower.includes('visita') || queryLower.includes('ver') || queryLower.includes('conocer') || queryLower.includes('agendar')) {
        fallbackText += `¡Excelente! Podemos coordinar una visita presencial. ${
          calendarUrl
            ? 'Podés agendarla directamente en nuestro calendario o dejarme tu teléfono.'
            : 'Dejame tu número de WhatsApp y un asesor comercial te contactará para fijar día y hora.'
        }`;
      } else {
        fallbackText += `He tomado nota de tu consulta sobre "${messageText}". Si nos dejás tu número o WhatsApp, un asesor comercial te contactará de inmediato con todos los detalles.`;
      }

      setMessages((prev) =>
        prev.map((m) => (m.id === botMsgId ? { ...m, text: fallbackText } : m))
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="w-full h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-hidden font-sans select-none">
      
      {/* Standalone Header */}
      <div className="p-3.5 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 border-b border-white/10 text-white flex items-center justify-between shadow-md shrink-0">
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
            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition-transform active:scale-95 flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Agendar Visita</span>
          </a>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs bg-[#0b141a]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-fadeIn`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[80%] p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                msg.sender === 'user'
                  ? 'bg-emerald-600 text-white rounded-tr-none shadow-md shadow-emerald-950/20'
                  : 'bg-slate-900 text-slate-200 border border-white/10 rounded-tl-none shadow-sm'
              }`}
            >
              {msg.text === '...' ? (
                <div className="flex items-center gap-1.5 py-1 px-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]"></span>
                </div>
              ) : (
                msg.text
              )}
            </div>
            <span className="text-[9px] text-slate-500 font-mono mt-1 px-1">
              {msg.sender === 'user' ? 'Tú' : agentName}
            </span>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-white/10 flex items-center gap-2 shrink-0">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Escribí tu consulta sobre propiedades..."
          className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
        />

        <button
          type="submit"
          disabled={isSending || !inputVal.trim()}
          className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-transform active:scale-95 disabled:opacity-40 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Tiny Brand Footer */}
      <div className="py-1 px-3 bg-slate-950/90 text-center border-t border-white/5 shrink-0">
        <span className="text-[9px] text-slate-500 tracking-wider">
          Powered by <strong className="text-slate-400 font-bold">AriaProp.online</strong> • Asistente IA Inmobiliario
        </span>
      </div>

    </div>
  );
};

export default StandaloneChatWidget;

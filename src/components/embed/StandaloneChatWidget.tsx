import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Sparkles, Building2, Phone, Calendar, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'agent';
  text: string;
  timestamp: Date;
}

interface FaqItem {
  question: string;
  answer: string;
}

export const StandaloneChatWidget: React.FC = () => {
  const [agencyId, setAgencyId] = useState<string>('');
  const [botName, setBotName] = useState<string>('Asistente IA');
  const [agencyName, setAgencyName] = useState<string>('Inmobiliaria');
  const [welcomeMessage, setWelcomeMessage] = useState<string>('¡Hola! ¿En qué puedo ayudarte hoy?');
  const [customRules, setCustomRules] = useState<string>('');
  const [faqList, setFaqList] = useState<FaqItem[]>([]);
  const [bookingUrl, setBookingUrl] = useState<string>('');
  const [advisorPhone, setAdvisorPhone] = useState<string>('');

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. CARGA DE CONFIGURACIÓN REAL DESDE SUPABASE
  useEffect(() => {
    const loadAgencyBotConfig = async () => {
      const params = new URLSearchParams(window.location.search);
      let targetAgencyId = params.get('agencyId') || params.get('agency_id') || params.get('agentId') || agencyId;

      if (!targetAgencyId && window.location.pathname.includes('/embed/chat/')) {
        const parts = window.location.pathname.split('/embed/chat/');
        if (parts[1]) targetAgencyId = parts[1].replace('/', '');
      }

      if (!targetAgencyId || !supabase) return;
      setAgencyId(targetAgencyId);

      try {
        // Buscar en organizations
        const { data: orgData } = await supabase
          .from('organizations')
          .select('*')
          .or(`id.eq.${targetAgencyId},user_id.eq.${targetAgencyId}`)
          .maybeSingle();

        if (orgData) {
          const loadedBotName = orgData.bot_name || 'Asistente IA';
          const loadedAgencyName = orgData.name || 'Inmobiliaria';
          const loadedWelcome = orgData.welcome_message || `¡Hola! Soy tu asistente de ${loadedAgencyName}. ¿En qué te puedo ayudar hoy?`;
          const loadedRules = orgData.custom_prompt_instructions || orgData.system_prompt || '';
          let loadedFaqs: FaqItem[] = [];

          if (orgData.faq_knowledge) {
            try {
              loadedFaqs = typeof orgData.faq_knowledge === 'string'
                ? JSON.parse(orgData.faq_knowledge)
                : orgData.faq_knowledge;
            } catch {}
          }

          setBotName(loadedBotName);
          setAgencyName(loadedAgencyName);
          setWelcomeMessage(loadedWelcome);
          setCustomRules(loadedRules);
          setFaqList(loadedFaqs);
          setBookingUrl(orgData.calendar_booking_url || '');
          setAdvisorPhone(orgData.advisor_alert_phone || '');

          setMessages([
            {
              id: 'welcome-msg',
              sender: 'bot',
              text: loadedWelcome,
              timestamp: new Date(),
            },
          ]);
          return;
        }

        // Buscar en profiles si no se encontró en organizations directamente
        const { data: profile } = await supabase
          .from('profiles')
          .select('*, organizations(*)')
          .or(`id.eq.${targetAgencyId},organization_id.eq.${targetAgencyId}`)
          .maybeSingle();

        if (profile) {
          const org = profile.organizations as any;
          const loadedBotName = org?.bot_name || profile.nombre || profile.full_name || 'Asistente IA';
          const loadedAgencyName = org?.name || profile.nombre || profile.full_name || 'Inmobiliaria';
          const loadedWelcome = org?.welcome_message || `¡Hola! Soy tu asistente de ${loadedAgencyName}. ¿En qué puedo ayudarte hoy?`;
          const loadedRules = org?.custom_prompt_instructions || org?.system_prompt || '';
          let loadedFaqs: FaqItem[] = [];

          if (org?.faq_knowledge) {
            try {
              loadedFaqs = typeof org.faq_knowledge === 'string'
                ? JSON.parse(org.faq_knowledge)
                : org.faq_knowledge;
            } catch {}
          }

          setBotName(loadedBotName);
          setAgencyName(loadedAgencyName);
          setWelcomeMessage(loadedWelcome);
          setCustomRules(loadedRules);
          setFaqList(loadedFaqs);
          setBookingUrl(org?.calendar_booking_url || '');
          setAdvisorPhone(org?.advisor_alert_phone || profile.advisor_alert_phone || profile.phone || '');

          setMessages([
            {
              id: 'welcome-msg',
              sender: 'bot',
              text: loadedWelcome,
              timestamp: new Date(),
            },
          ]);
        }
      } catch (err) {
        console.warn('StandaloneChatWidget: Error loading bot settings:', err);
      }
    };

    loadAgencyBotConfig();
  }, [agencyId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // 2. RESPUESTAS INTELIGENTES BASADAS EN FAQ, REGLAS Y BACKEND
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
      // 1. Intentar llamar al backend /api/chat con el contexto completo
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          agencyId: agencyId || undefined,
          agency_id: agencyId || undefined,
          agencyName,
          botName,
          customRules,
          faqList,
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
          `¡Hola! Estoy a tu disposición para asesorarte en nombre de ${agencyName}.`;
        setMessages((prev) =>
          prev.map((m) => (m.id === botMsgId ? { ...m, text: botResponseText } : m))
        );
      } else {
        throw new Error('API /api/chat error status: ' + response.status);
      }
    } catch (err) {
      console.warn('Procesamiento con FAQs y reglas de negocio locales:', err);
      const queryLower = messageText.toLowerCase();
      let matchedResponse = '';

      // A. Comprobar si coincide con alguna FAQ configurada en Supabase
      if (Array.isArray(faqList) && faqList.length > 0) {
        for (const faq of faqList) {
          if (!faq.question || !faq.answer) continue;
          const qWords = faq.question.toLowerCase().split(' ').filter((w) => w.length > 3);
          const hasMatch = qWords.some((w) => queryLower.includes(w));
          if (hasMatch) {
            matchedResponse = faq.answer;
            break;
          }
        }
      }

      // B. Si coincide con agendar visita o reserva
      if (!matchedResponse) {
        if (
          queryLower.includes('visita') ||
          queryLower.includes('ver') ||
          queryLower.includes('agendar') ||
          queryLower.includes('cita') ||
          queryLower.includes('conocer')
        ) {
          if (bookingUrl) {
            matchedResponse = `¡Con gusto! Podés agendar tu visita presencial directamente desde nuestro calendario oficial aquí: ${bookingUrl} o dejarnos tu WhatsApp para coordinar día y horario.`;
          } else {
            matchedResponse = `¡Excelente! Para agendar una visita a la propiedad, por favor dejanos tu teléfono o WhatsApp y un asesor comercial te contactará a la brevedad.`;
          }
        }
      }

      // C. Saludos o consultas comunes
      if (!matchedResponse) {
        if (queryLower.includes('hola') || queryLower.includes('buenos') || queryLower.includes('buenas')) {
          matchedResponse = `¡Hola! Gracias por comunicarte con ${agencyName}. ¿Qué tipo de propiedad estás buscando o en qué zona te gustaría encontrar?`;
        } else if (
          queryLower.includes('precio') ||
          queryLower.includes('costo') ||
          queryLower.includes('cuanto') ||
          queryLower.includes('valor') ||
          queryLower.includes('alquiler') ||
          queryLower.includes('venta')
        ) {
          matchedResponse = `En ${agencyName} contamos con opciones destacadas en venta y alquiler. Si me indicás ambientes, zona o presupuesto estimado, te comparto las fichas comerciales disponibles.`;
        } else if (customRules) {
          matchedResponse = `He tomado nota de tu consulta sobre "${messageText}". ${customRules}. Si nos dejás tu número de contacto, nuestro equipo comercial se comunicará de inmediato.`;
        } else {
          matchedResponse = `He tomado nota de tu consulta sobre "${messageText}". Si nos compartís tu número de WhatsApp, un asesor comercial de ${agencyName} se pondrá en contacto para brindarte todos los detalles.`;
        }
      }

      setMessages((prev) =>
        prev.map((m) => (m.id === botMsgId ? { ...m, text: matchedResponse } : m))
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
              <h3 className="font-extrabold text-sm text-white tracking-tight">{botName}</h3>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-bold border border-emerald-500/30">
                IA 24/7
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">{agencyName}</p>
          </div>
        </div>

        {bookingUrl && (
          <a
            href={bookingUrl}
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
              {msg.sender === 'user' ? 'Tú' : botName}
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

import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  RotateCcw,
  Zap,
  Building,
  Sliders,
  Flame,
  Sun,
  Snowflake,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MessageSquare,
  Search,
  User,
  ArrowRight,
  Database,
  Paperclip,
  Smile,
  CheckCheck
} from 'lucide-react';
import { AppRoute, BotConfig } from '../../types';
import { generateStructuredAriaRealEstateResponse, ExtractedLeadData } from '../../../api/_lib/openrouterService';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

interface AssistantPlaygroundViewProps {
  botConfig?: BotConfig;
  onRouteChange?: (route: AppRoute) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

interface MatchedProperty {
  id: string;
  title: string;
  price: number;
  currency?: string;
  type: string;
  zone: string;
  url?: string;
  bedrooms?: number;
  areaM2?: number;
}

export const AssistantPlaygroundView: React.FC<AssistantPlaygroundViewProps> = ({
  botConfig,
  onRouteChange,
}) => {
  const { user } = useAuth();

  const isUnlimitedUser = Boolean(
    user &&
      (user.isOwner ||
        user.plan !== 'normal' ||
        user.email?.toLowerCase().trim() === 'valentinlautaromorales@gmail.com')
  );

  const MAX_FREE_MESSAGES = 3;

  const [sentCount, setSentCount] = useState<number>(() => {
    try {
      const val = localStorage.getItem('aria_playground_guest_msg_count');
      return val ? parseInt(val, 10) : 0;
    } catch {
      return 0;
    }
  });

  const remainingFreeMessages = Math.max(0, MAX_FREE_MESSAGES - sentCount);
  const isFreeLimitReached = !isUnlimitedUser && sentCount >= MAX_FREE_MESSAGES;

  const defaultWelcomeMessage: ChatMessage = {
    id: 'welcome-1',
    sender: 'bot',
    text: `¡Hola! 👋 Soy ${botConfig?.agentName || 'Aria'}, la asesora IA comercial de ${botConfig?.agencyName || 'Aria Prop'}. ¿En qué tipo de propiedad o zona estás interesado hoy?`,
    timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('aria_playground_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return [defaultWelcomeMessage];
  });

  // Save messages to localStorage on change
  useEffect(() => {
    try {
      if (messages.length > 0) {
        localStorage.setItem('aria_playground_chat_history', JSON.stringify(messages));
      }
    } catch (_) {}
  }, [messages]);

  const handleResetChat = () => {
    try {
      localStorage.removeItem('aria_playground_chat_history');
      setMessages([defaultWelcomeMessage]);
      setExtractedEntities({
        budget_max_usd: null,
        preferred_zone: null,
        property_type: null,
        operation_type: null,
        lead_name: null,
        status: 'active',
      });
      setMatchedProperties(dbProperties.slice(0, 5).map(p => ({
        id: p.id,
        title: p.title,
        price: Number(p.price) || 0,
        currency: p.currency || 'USD',
        zone: p.zone || p.address || 'Zona',
        type: p.type || 'apartment',
        bedrooms: p.bedrooms || 2,
        areaM2: p.surface_m2 || p.area_m2 || 60,
      })));
    } catch (_) {}
  };

  const [inputMsg, setInputMsg] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [latencyMs, setLatencyMs] = useState<number>(420);
  const [extractedEntities, setExtractedEntities] = useState<ExtractedLeadData>({
    budget_max_usd: null,
    preferred_zone: null,
    property_type: null,
    operation_type: null,
    lead_name: null,
    status: 'active',
  });
  const [matchedProperties, setMatchedProperties] = useState<MatchedProperty[]>([]);
  const [dbProperties, setDbProperties] = useState<any[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch all active properties from Supabase in real-time
  useEffect(() => {
    async function loadProperties() {
      if (!supabase) return;
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const sbUser = sessionData.session?.user;

        let query = supabase
          .from('properties')
          .select('*')
          .neq('is_public', false)
          .in('status', ['available', 'disponible', 'published']);

        if (sbUser) {
          query = query.or(`user_id.eq.${sbUser.id},organization_id.eq.${sbUser.id}`);
        }

        const { data: props } = await query.limit(50);
        if (props && props.length > 0) {
          setDbProperties(props);
          setMatchedProperties(props.slice(0, 10).map((p: any) => ({
            id: p.id,
            title: p.title,
            price: Number(p.price) || 0,
            currency: p.currency || 'USD',
            zone: p.zone || p.address || 'Zona',
            type: p.type || 'apartment',
            bedrooms: p.bedrooms || 2,
            areaM2: p.surface_m2 || p.area_m2 || 60,
          })));
        } else {
          const { data: fallbackProps } = await supabase
            .from('properties')
            .select('*')
            .neq('is_public', false)
            .in('status', ['available', 'disponible'])
            .limit(50);
          if (fallbackProps && fallbackProps.length > 0) {
            setDbProperties(fallbackProps);
            setMatchedProperties(fallbackProps.slice(0, 10).map((p: any) => ({
              id: p.id,
              title: p.title,
              price: Number(p.price) || 0,
              currency: p.currency || 'USD',
              zone: p.zone || p.address || 'Zona',
              type: p.type || 'apartment',
              bedrooms: p.bedrooms || 2,
              areaM2: p.surface_m2 || p.area_m2 || 60,
            })));
          }
        }
      } catch (err) {
        console.warn('⚠️ Could not load properties for playground:', err);
      }
    }
    loadProperties();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMsg).trim();
    if (!query || isTyping) return;

    if (!isUnlimitedUser && sentCount >= MAX_FREE_MESSAGES) {
      return;
    }

    if (!isUnlimitedUser) {
      const nextCount = sentCount + 1;
      setSentCount(nextCount);
      try {
        localStorage.setItem('aria_playground_guest_msg_count', String(nextCount));
      } catch (e) {
        console.warn('Error updating guest msg count:', e);
      }
    }

    const userMsgObj: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsgObj]);
    if (!textToSend) setInputMsg('');
    setIsTyping(true);

    const startTime = performance.now();

    try {
      let replyText = '';
      let extractedData: ExtractedLeadData = {
        budget_max_usd: null,
        preferred_zone: null,
        property_type: null,
        operation_type: null,
        lead_name: null,
        status: 'active',
      };
      let matches: MatchedProperty[] = [];

      try {
        // 1. Attempt API server request to /api/chat
        const apiRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: query,
            history: messages.map((m) => ({ sender: m.sender === 'user' ? 'user' : 'assistant', content: m.text })),
            agentName: botConfig?.agentName || 'Aria',
            agencyName: botConfig?.agencyName || 'Aria Prop',
          }),
        });

        if (apiRes.ok) {
          const data = await apiRes.json();
          if (data.replyText) {
            replyText = data.replyText;
            if (data.extractedData) extractedData = data.extractedData;
            if (data.matchedProperties) matches = data.matchedProperties;
            if (data.latencyMs) setLatencyMs(data.latencyMs);
          }
        }
      } catch (apiErr) {
        console.warn('⚠️ Server /api/chat fetch failed, attempting client-side engine:', apiErr);
      }

      // 2. Client-side fallback if server didn't provide replyText
      if (!replyText) {
        let catalogText = '';
        if (dbProperties.length > 0) {
          catalogText = dbProperties
            .map(
              (p) =>
                `- [ID: ${p.id}] "${p.title || 'Propiedad'}" (${(p.type || 'Depto').toUpperCase()} - ${p.operation || 'ALQUILER'}) en ${p.zone || 'Palermo'}. Precio: $${p.price || 800} USD. ${p.bedrooms || 2} hab. Ficha: https://ariaprop.online/properties/${p.id}`
            )
            .join('\n');
        } else {
          catalogText = `
- [ID: p-1] "Departamento 2 Ambientes c/ Balcón" (ALQUILER) en Palermo Soho. Precio: $800 USD. 1 hab, 52 m². Ficha: https://ariaprop.online/properties/p-1
- [ID: p-2] "Casa Moderna 4 Ambientes c/ Piscina" (VENTA) en Barrio Castores, Nordelta. Precio: $350,000 USD. 3 hab, 280 m². Ficha: https://ariaprop.online/properties/p-2
- [ID: p-3] "Penthouse de Lujo c/ Terraza Privada" (VENTA) en Puerto Madero. Precio: $520,000 USD. 3 hab, 195 m². Ficha: https://ariaprop.online/properties/p-3
          `.trim();
        }

        const response = await generateStructuredAriaRealEstateResponse({
          message: query,
          history: messages.map((m) => ({ sender: m.sender === 'user' ? 'user' : 'assistant', content: m.text })),
          propertyContext: catalogText,
          agentName: botConfig?.agentName || 'Aria',
          agencyName: botConfig?.agencyName || 'Aria Prop',
        });

        replyText = response.replyText;
        if (response.extractedData) extractedData = response.extractedData;
      }

      const elapsed = Math.round(performance.now() - startTime);
      setLatencyMs((prev) => (prev > 0 ? prev : elapsed));

      if (extractedData) {
        setExtractedEntities((prev) => ({
          budget_max_usd: extractedData.budget_max_usd ?? prev.budget_max_usd,
          preferred_zone: extractedData.preferred_zone ?? prev.preferred_zone,
          property_type: extractedData.property_type ?? prev.property_type,
          operation_type: extractedData.operation_type ?? prev.operation_type,
          lead_name: extractedData.lead_name ?? prev.lead_name,
          status: extractedData.status ?? prev.status,
        }));
      }

      if (matches.length > 0) {
        setMatchedProperties(matches);
      } else if (dbProperties.length > 0) {
        const lowerRes = replyText.toLowerCase();
        const found = dbProperties.filter(
          (p) => lowerRes.includes(p.title?.toLowerCase() || '') || lowerRes.includes(p.zone?.toLowerCase() || '') || lowerRes.includes(p.id)
        );
        setMatchedProperties(
          (found.length > 0 ? found : dbProperties.slice(0, 2)).map((m) => ({
            id: m.id,
            title: m.title || 'Propiedad destacada',
            price: m.price || 0,
            type: m.type || 'Inmueble',
            zone: m.zone || 'Mendoza',
            url: `https://ariaprop.online/properties/${m.id}`,
            bedrooms: m.bedrooms || 2,
            areaM2: m.area_m2 || 60,
          }))
        );
      }

      const botReplyObj: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender: 'bot',
        text: replyText,
        timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botReplyObj]);
    } catch (err) {
      console.error('❌ Playground simulation error:', err);
    } finally {
      setIsTyping(false);
    }
  };



  const getLeadTempBadge = () => {
    if (extractedEntities.status === 'qualified' || (extractedEntities.budget_max_usd && extractedEntities.preferred_zone)) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
          <Flame className="w-3.5 h-3.5 text-rose-400 fill-current" /> Lead HOT (Alta Conversión)
        </span>
      );
    }
    if (extractedEntities.preferred_zone || extractedEntities.budget_max_usd) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
          <Sun className="w-3.5 h-3.5 text-amber-400" /> Lead WARM (En Calificación)
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
        <Snowflake className="w-3.5 h-3.5 text-cyan-400" /> Lead COLD (Prospección Inicial)
      </span>
    );
  };

  return (
    <div className="space-y-6 text-slate-100 pb-8 max-w-[1600px] mx-auto">
      
      {/* Top Header & Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Bot className="w-7 h-7 text-emerald-400" />
            Asistente IA 24/7 (Sandbox RAG en Tiempo Real)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Simulador panorámico en vivo para testear respuestas comerciales, motor de recomendaciones y extracción RAG de entidades.
          </p>

          {/* Usage / Plan Banner */}
          {isUnlimitedUser ? (
            <div className="mt-2.5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-teal-500/20 border border-amber-500/30 text-amber-300 text-xs font-black shadow-md">
              <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>👑 Modo Enterprise / Owner - Mensajes Ilimitados</span>
            </div>
          ) : (
            <div className={`mt-2.5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-extrabold border ${
              isFreeLimitReached
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-rose-950/40 shadow-lg'
                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
            }`}>
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Prueba gratuita: Te quedan <strong className="text-white underline font-black">{remainingFreeMessages} de 3</strong> mensajes</span>
              {isFreeLimitReached && (
                <button
                  onClick={() => onRouteChange?.('dashboard-checkout')}
                  className="ml-2 px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] uppercase cursor-pointer transition-all shadow-md hover:scale-105"
                >
                  Desbloquear ➔
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {onRouteChange && (
            <>
              <button
                onClick={() => onRouteChange('dashboard-bot-config')}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 font-bold text-xs border border-white/10 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>Reglas & Tono</span>
              </button>
              <button
                onClick={() => onRouteChange('dashboard-properties')}
                className="px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-extrabold text-xs border border-emerald-500/30 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Building className="w-4 h-4 text-emerald-400" />
                <span>Ver Inventario</span>
              </button>
            </>
          )}
          <button
            onClick={handleResetChat}
            title="Reiniciar chat simulado"
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-emerald-400 border border-white/10 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main 2-Column Panoramic Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Wide Panoramic Chat Canvas (8 Cols - 70-75% Width) */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="w-full bg-[#0b141a] rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col h-[700px] relative backdrop-blur-xl">
            
            {/* Panoramic Header Bar */}
            <div className="bg-[#111b21] py-3.5 px-6 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-300 flex items-center justify-center text-slate-950 font-black text-base shadow-lg shadow-emerald-500/20">
                  <Bot className="w-6 h-6 text-slate-950" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-sm tracking-wide flex items-center gap-2">
                    <span>{botConfig?.agentName || 'Aria Assistant'}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      Asistente Inmobiliario IA
                    </span>
                  </h3>
                  <p className="text-xs text-emerald-400 font-medium flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>🟢 En línea 24/7 ({botConfig?.agencyName || 'Aria Prop LATAM'})</span>
                  </p>
                </div>
              </div>

              {/* Model Pill & Status */}
              <div className="hidden sm:flex items-center gap-3">
                <div className="px-3 py-1 rounded-full bg-slate-900 border border-white/10 text-[11px] font-mono text-slate-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>✦ Ariaprop IA · Motor RAG Inmobiliario</span>
                </div>
                <button
                  onClick={handleResetChat}
                  title="Reiniciar chat simulado"
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-emerald-400 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Panoramic Chat Canvas Body */}
            <div className="flex-1 bg-[#0b141a] p-6 overflow-y-auto space-y-4 font-sans bg-[radial-gradient(#202c33_1px,transparent_1px)] [background-size:20px_20px]">
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed shadow-lg ${
                        isUser
                          ? 'bg-[#005c4b] text-white rounded-tr-none border border-emerald-500/20'
                          : 'bg-[#202c33] text-slate-100 rounded-tl-none border border-white/10'
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.text}</p>
                    </div>
                    <div className="flex items-center gap-1 mt-1 px-1">
                      <span className="text-[10px] text-slate-500 font-mono">
                        {msg.timestamp}
                      </span>
                      {isUser && <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-[#202c33] border border-white/10 text-slate-300 text-xs w-64 rounded-tl-none animate-pulse shadow-md">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  <span className="text-xs text-slate-300 font-bold ml-1">Ariaprop IA está escribiendo...</span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Quick Suggestion Chips */}
            <div className="px-4 py-2.5 bg-[#111b21] border-t border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
              {[
                '¿Tienen 2 ambientes en alquiler?',
                '¿Qué propiedades tienen en venta hasta $150,000 USD?',
                'Quiero coordinar una visita presencial',
                '¿Aceptan permutas o crédito hipotecario?',
              ].map((chip, idx) => (
                <button
                  key={idx}
                  disabled={isFreeLimitReached}
                  onClick={() => handleSendMessage(chip)}
                  className="px-3 py-1.5 rounded-full bg-[#202c33] hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 text-xs font-semibold border border-white/5 whitespace-nowrap transition-all cursor-pointer shrink-0 disabled:opacity-40 shadow-sm"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Panoramic Input Bar or Locked Banner */}
            {isFreeLimitReached ? (
              <div className="p-6 bg-[#111b21] border-t border-rose-500/40 space-y-3 text-center">
                <div className="flex items-center justify-center gap-2 text-rose-400 font-extrabold text-sm">
                  <ShieldCheck className="w-5 h-5 text-rose-400" />
                  <span>Has alcanzado el límite de 3 mensajes de prueba gratuita</span>
                </div>
                <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed">
                  Pasa a un plan Pro o Enterprise para desbloquear atención comercial 24/7 ilimitada en WhatsApp y Web.
                </p>
                <button
                  onClick={() => onRouteChange?.('dashboard-checkout')}
                  className="px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] mx-auto"
                >
                  <Sparkles className="w-4 h-4 fill-slate-950 text-slate-950" />
                  <span>Desbloquear Mensajes Ilimitados ➔</span>
                </button>
              </div>
            ) : (
              <div className="p-4 bg-[#111b21] flex items-center gap-3 border-t border-slate-800">
                <div className="flex items-center gap-2 text-slate-400">
                  <button type="button" className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer" title="Adjuntar ficha o documento (Simulación)">
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <button type="button" className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer" title="Insertar emoji (Simulación)">
                    <Smile className="w-4 h-4" />
                  </button>
                </div>

                <input
                  type="text"
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Escribe tu consulta comercial sobre propiedades, precios o visitas..."
                  className="flex-1 bg-[#202c33] text-white placeholder-slate-400 rounded-2xl px-4 py-3 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 border border-transparent shadow-inner"
                />

                <button
                  disabled={!inputMsg.trim() || isTyping}
                  onClick={() => handleSendMessage()}
                  className="w-11 h-11 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 shrink-0 shadow-lg shadow-emerald-500/20 hover:scale-105"
                >
                  <Send className="w-5 h-5 fill-current" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Live RAG Inspector & Telemetry (4 Cols - 25-30% Width) */}
        <div className="lg:col-span-4 space-y-6">

          {/* Non-blocking Quota Notice Banner (if paid solo/pro plan) */}
          {!isUnlimitedUser && user?.plan && user.plan !== 'desarrolladores' && (
            <div className="p-5 rounded-3xl bg-slate-900/90 border border-amber-500/30 text-amber-300 text-xs space-y-2 shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5 text-amber-300">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Cuota Mensual del Plan ({user.plan === 'solo' ? 'Solo Agent' : 'Agency Pro'})
                </span>
                <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/30 font-bold uppercase">
                  Activo
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                Tu plan contempla hasta {user.plan === 'solo' ? '100 leads y 20 inmuebles' : '500 leads y 100 inmuebles'} por mes. Para cuota ilimitada sin restricciones, pasa al plan Enterprise.
              </p>
              <button
                onClick={() => onRouteChange?.('dashboard-checkout')}
                className="mt-1 text-[11px] text-amber-400 font-extrabold hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>Ver opciones de upgrade de plan ➔</span>
              </button>
            </div>
          )}
          
          {/* Card 1: Engine Telemetry Status */}
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-white/10 shadow-2xl space-y-4 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                Telemetría del Motor IA
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Operativo
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/5 space-y-1">
                <p className="text-[10px] text-slate-400 font-medium">Modelo Principal</p>
                <p className="font-mono text-emerald-300 font-bold">Ariaprop IA (Motor RAG)</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/5 space-y-1">
                <p className="text-[10px] text-slate-400 font-medium">Latencia de Respuesta</p>
                <p className="font-mono text-teal-300 font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-teal-400" /> ~{latencyMs}ms
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Live Extracted Entities */}
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-white/10 shadow-2xl space-y-4 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-400" />
                Entidades Detectadas (Live RAG)
              </h3>
              {getLeadTempBadge()}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/5 space-y-1">
                <p className="text-[10px] text-slate-400">Operación</p>
                <p className="font-bold text-white capitalize">
                  {extractedEntities.operation_type || 'Por definir'}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/5 space-y-1">
                <p className="text-[10px] text-slate-400">Presupuesto Máximo</p>
                <p className="font-mono text-emerald-400 font-bold">
                  {extractedEntities.budget_max_usd ? `$${extractedEntities.budget_max_usd.toLocaleString('en-US')} USD` : 'Por definir'}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/5 space-y-1">
                <p className="text-[10px] text-slate-400">Zona Preferida</p>
                <p className="font-bold text-white">
                  {extractedEntities.preferred_zone || 'Por definir'}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/5 space-y-1">
                <p className="text-[10px] text-slate-400">Tipo de Inmueble</p>
                <p className="font-bold text-white capitalize">
                  {extractedEntities.property_type || 'Inmueble general'}
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: RAG Matched Inventory Properties */}
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-white/10 shadow-2xl space-y-4 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                Inmuebles Seleccionados por RAG ({matchedProperties.length})
              </h3>
            </div>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {matchedProperties.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs bg-slate-950/60 rounded-2xl border border-white/5">
                  Realiza una consulta en el simulador para inspeccionar las propiedades recomendadas.
                </div>
              ) : (
                matchedProperties.map((prop) => (
                  <div
                    key={prop.id}
                    className="p-3 rounded-2xl bg-slate-950/80 border border-white/5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-white truncate">{prop.title}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {prop.zone} • {prop.bedrooms} hab • ${prop.price.toLocaleString('en-US')} USD
                      </p>
                    </div>

                    <a
                      href={prop.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-all cursor-pointer shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default AssistantPlaygroundView;

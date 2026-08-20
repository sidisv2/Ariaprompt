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
  Database
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
  type: string;
  zone: string;
  url: string;
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

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: `¡Hola! 👋 Soy ${botConfig?.agentName || 'Aria'}, la asesora IA de ${botConfig?.agencyName || 'Aria Prop'}. ¿En qué tipo de propiedad estás interesado hoy?`,
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

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

  // Fetch properties from Supabase for current org
  useEffect(() => {
    async function loadProperties() {
      if (!supabase) return;
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const sbUser = sessionData.session?.user;
        if (!sbUser) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', sbUser.id)
          .single();

        if (profile?.organization_id) {
          const { data: props } = await supabase
            .from('properties')
            .select('*')
            .eq('organization_id', profile.organization_id)
            .limit(10);

          if (props && props.length > 0) {
            setDbProperties(props);
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
      // Build catalog context from DB properties or defaults
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

      const elapsed = Math.round(performance.now() - startTime);
      setLatencyMs(elapsed);

      if (response.extractedData) {
        setExtractedEntities((prev) => ({
          budget_max_usd: response.extractedData.budget_max_usd ?? prev.budget_max_usd,
          preferred_zone: response.extractedData.preferred_zone ?? prev.preferred_zone,
          property_type: response.extractedData.property_type ?? prev.property_type,
          operation_type: response.extractedData.operation_type ?? prev.operation_type,
          lead_name: response.extractedData.lead_name ?? prev.lead_name,
          status: response.extractedData.status ?? prev.status,
        }));
      }

      // Extract property matches heuristics
      if (dbProperties.length > 0) {
        const lowerRes = response.replyText.toLowerCase();
        const matches = dbProperties.filter((p) =>
          lowerRes.includes(p.title?.toLowerCase() || '') ||
          lowerRes.includes(p.zone?.toLowerCase() || '') ||
          lowerRes.includes(p.id)
        );
        setMatchedProperties(
          matches.map((m) => ({
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
      } else {
        setMatchedProperties([
          {
            id: 'p-1',
            title: 'Departamento 2 Ambientes c/ Balcón',
            price: 800,
            type: 'Alquiler',
            zone: 'Palermo Soho, CABA',
            url: 'https://ariaprop.online/properties/p-1',
            bedrooms: 1,
            areaM2: 52,
          },
        ]);
      }

      const botReplyObj: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender: 'bot',
        text: response.replyText,
        timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botReplyObj]);
    } catch (err) {
      console.error('❌ Playground simulation error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          sender: 'bot',
          text: `Tenemos departamentos disponibles en Palermo desde $800 USD. ¿Te gustaría coordinar una visita presencial?`,
          timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome-1',
        sender: 'bot',
        text: `¡Hola! 👋 Soy ${botConfig?.agentName || 'Aria'}, la asesora IA de ${botConfig?.agencyName || 'Aria Prop'}. ¿En qué tipo de propiedad estás interesado hoy?`,
        timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setExtractedEntities({
      budget_max_usd: null,
      preferred_zone: null,
      property_type: null,
      operation_type: null,
      lead_name: null,
      status: 'active',
    });
    setMatchedProperties([]);
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
    <div className="space-y-6 text-slate-100 pb-8 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Bot className="w-6 h-6 text-emerald-400" />
            Centro de Mando & Sandbox del Asistente IA 24/7
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Simulador interactivo en tiempo real para verificar las respuestas comerciales, RAG de propiedades y reglas de negocio del bot.
          </p>

          {/* Usage / Plan Banner */}
          {isUnlimitedUser ? (
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-teal-500/20 border border-amber-500/30 text-amber-300 text-xs font-black shadow-sm">
              <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>👑 Modo Enterprise / Owner - Mensajes Ilimitados</span>
            </div>
          ) : (
            <div className={`mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-extrabold border ${
              isFreeLimitReached
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
            }`}>
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Prueba gratuita: Te quedan <strong className="text-white underline font-black">{remainingFreeMessages} de 3</strong> mensajes</span>
              {isFreeLimitReached && (
                <button
                  onClick={() => onRouteChange?.('dashboard-checkout')}
                  className="ml-2 px-2.5 py-0.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] uppercase cursor-pointer"
                >
                  Desbloquear ➔
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onRouteChange && (
            <>
              <button
                onClick={() => onRouteChange('dashboard-bot-config')}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                <span>Reglas & Tono</span>
              </button>
              <button
                onClick={() => onRouteChange('dashboard-properties')}
                className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs border border-emerald-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Building className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ver Inventario</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: WhatsApp Dark Smartphone Mockup (7 Cols) */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="w-full max-w-md bg-[#0b141a] rounded-[40px] border-[6px] border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col h-[650px] relative">
            
            {/* Phone Top Speaker Bar */}
            <div className="bg-[#111b21] pt-3 pb-2 px-6 flex items-center justify-between border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 font-bold text-sm shadow-md">
                  <Bot className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-xs tracking-wide">
                    {botConfig?.agentName || 'Aria Assistant'}
                  </h3>
                  <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>en línea 24/7 ({botConfig?.agencyName || 'Aria Prop'})</span>
                  </p>
                </div>
              </div>

              <button
                onClick={handleResetChat}
                title="Reiniciar chat simulado"
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-emerald-400 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 bg-[#0b141a] p-4 overflow-y-auto space-y-3 font-sans text-xs bg-[radial-gradient(#202c33_1px,transparent_1px)] [background-size:16px_16px]">
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-md ${
                        isUser
                          ? 'bg-[#005c4b] text-white rounded-tr-none'
                          : 'bg-[#202c33] text-slate-100 rounded-tl-none border border-white/5'
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.text}</p>
                    </div>
                    <span className="text-[9px] text-slate-500 mt-1 font-mono px-1">
                      {msg.timestamp}
                    </span>
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#202c33] border border-white/5 text-slate-400 text-xs w-32 rounded-tl-none animate-pulse">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  <span className="text-[10px] text-slate-400 font-semibold ml-1">Escribiendo...</span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Quick Suggestion Chips */}
            <div className="px-3 py-2 bg-[#111b21] border-t border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
              {[
                '¿Tienen 2 ambientes en alquiler?',
                '¿Qué propiedades tienen en venta hasta $150,000 USD?',
                'Quiero coordinar una visita presencial',
              ].map((chip, idx) => (
                <button
                  key={idx}
                  disabled={isFreeLimitReached}
                  onClick={() => handleSendMessage(chip)}
                  className="px-2.5 py-1 rounded-full bg-[#202c33] hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 text-[10px] font-semibold border border-white/5 whitespace-nowrap transition-all cursor-pointer shrink-0 disabled:opacity-40"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input Bar or Locked Banner */}
            {isFreeLimitReached ? (
              <div className="p-4 bg-[#111b21] border-t border-rose-500/40 space-y-2 text-center">
                <div className="flex items-center justify-center gap-1.5 text-rose-400 font-extrabold text-xs">
                  <ShieldCheck className="w-4 h-4 text-rose-400" />
                  <span>Has alcanzado el límite de 3 mensajes de prueba</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Pasa a un plan Pro/Enterprise para desbloquear atención 24/7 ilimitada.
                </p>
                <button
                  onClick={() => onRouteChange?.('dashboard-checkout')}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
                >
                  <Sparkles className="w-4 h-4 fill-slate-950 text-slate-950" />
                  <span>Desbloquear Mensajes Ilimitados ➔</span>
                </button>
              </div>
            ) : (
              <div className="p-3 bg-[#111b21] flex items-center gap-2 border-t border-slate-800">
                <input
                  type="text"
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Escribe un mensaje de prueba..."
                  className="flex-1 bg-[#202c33] text-white placeholder-slate-500 rounded-2xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 border border-transparent"
                />
                <button
                  disabled={!inputMsg.trim() || isTyping}
                  onClick={() => handleSendMessage()}
                  className="w-9 h-9 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 shrink-0"
                >
                  <Send className="w-4 h-4 fill-current" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Live RAG Inspector & Telemetry (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">

          {/* Non-blocking Quota Notice Banner (if paid solo/pro plan) */}
          {!isUnlimitedUser && user?.plan && user.plan !== 'desarrolladores' && (
            <div className="p-4 rounded-3xl bg-slate-900/90 border border-amber-500/30 text-amber-300 text-xs space-y-2 shadow-xl backdrop-blur-xl">
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
                <p className="font-mono text-emerald-300 font-bold">Gemini 2.5 Flash</p>
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

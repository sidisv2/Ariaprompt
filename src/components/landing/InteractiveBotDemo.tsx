import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  RefreshCw,
  Phone,
  Video,
  MoreVertical,
  CheckCheck,
  Building,
  Sparkles,
  ArrowRight,
  MapPin,
  DollarSign,
  Calendar,
  CheckCircle2,
  Bot
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface DemoMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  propertyCard?: {
    title: string;
    price: string;
    location: string;
    details: string;
    imageUrl: string;
    pdfBrochure?: boolean;
    googleMapsUrl?: string;
    tour360Url?: string;
  };
}

const INITIAL_MESSAGES: DemoMessage[] = [
  {
    id: 'msg-1',
    sender: 'bot',
    text: '👋 ¡Hola! Soy Aria, la Asistente Comercial IA 24/7 de Ariaprop. ¿Qué tipo de propiedad, desarrollo o lote estás buscando hoy?',
    timestamp: '09:41',
  },
];

const SUGGESTIONS = [
  { label: '🌲 Lote 1.000 m² c/ Costa de Río (Entrega + Cuotas)', key: 'lote' },
  { label: '🏢 Alquiler 2 amb en Palermo ($600 USD)', key: 'palermo' },
  { label: '🏡 Comprar Casa en Nordelta ($350,000 USD)', key: 'nordelta' },
  { label: '📅 Coordinar visita con asesor', key: 'visita' },
  { label: '📐 Tasar mi propiedad', key: 'tasacion' },
];

export const InteractiveBotDemo: React.FC<{ onOpenAuth?: () => void }> = ({ onOpenAuth }) => {
  const { openAuthModal } = useAuth();
  const [messages, setMessages] = useState<DemoMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = (textToSend: string) => {
    if (!textToSend.trim() || isTyping) return;

    const userMsgText = textToSend.trim();
    const nowTime = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    const userMsg: DemoMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userMsgText,
      timestamp: nowTime,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI thinking and typing delay (600ms)
    setTimeout(() => {
      let botResponse: DemoMessage;
      const lowerText = userMsgText.toLowerCase();

      if (lowerText.includes('lote') || lowerText.includes('terreno') || lowerText.includes('rio') || lowerText.includes('desarrollo')) {
        botResponse = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: '🌿 ¡Excelente oportunidad de desarrollo! Disponemos de lotes premium en primera línea náutica con plan de financiación directa:',
          timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          propertyCard: {
            title: 'Lote 1.000 m² con Costa de Río · Barrio Náutico',
            price: 'USD 45.000 (Anticipo 30% + 36 cuotas fijas)',
            location: 'Ribera del Delta / Zona Náutica',
            details: '1.000 m² • Escritura inmediata • Servicios subterráneos • Amarra propia',
            imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80',
            pdfBrochure: true,
            googleMapsUrl: 'https://maps.google.com',
            tour360Url: 'https://ariaprop.online',
          },
        };
      } else if (lowerText.includes('palermo') || lowerText.includes('alquiler')) {
        botResponse = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: '¡Excelente elección! Tengo este departamento ideal recién ingresado en Palermo Soho c/ Balcón corrido:',
          timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          propertyCard: {
            title: 'Depto 2 Ambientes en Palermo Soho',
            price: '$600 USD / mes',
            location: 'Palermo Soho, CABA',
            details: '2 amb • 65 m² • Balcón Terraza • Edificio c/ Amenities',
            imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80',
            pdfBrochure: true,
            googleMapsUrl: 'https://maps.google.com',
          },
        };
      } else if (lowerText.includes('nordelta') || lowerText.includes('comprar') || lowerText.includes('casa')) {
        botResponse = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: 'En Nordelta disponemos de esta casa moderna con amarra y piscina sobre lote al lago:',
          timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          propertyCard: {
            title: 'Casa Moderna 4 Amb c/ Piscina en Nordelta',
            price: '$350,000 USD',
            location: 'Barrio Castores, Nordelta',
            details: '4 amb • 240 m² • Piscina Climatizada • Amarra',
            imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
            pdfBrochure: true,
            googleMapsUrl: 'https://maps.google.com',
            tour360Url: 'https://ariaprop.online',
          },
        };
      } else if (lowerText.includes('visita') || lowerText.includes('asesor') || lowerText.includes('coordinar')) {
        botResponse = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: '🤖 ¡Perfecto! He registrado tus datos de preferencia y derivado esta consulta directamente con un Asesor Inmobiliario humano. Te contactaremos en breves momentos.',
          timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        };
      } else if (lowerText.includes('tasar') || lowerText.includes('tasacion')) {
        botResponse = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: '📐 Para realizar una tasación profesional y estimar el Cap Rate de tu inmueble, por favor indícame la ubicación aproximada y los m² totales.',
          timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        };
      } else {
        botResponse = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: `Entendido. He analizado tu búsqueda de "${userMsgText}" en nuestro inventario. Aquí tienes una opción destacada:`,
          timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          propertyCard: {
            title: 'Residencia Premium c/ Vista Panorámica',
            price: '$220,000 USD',
            location: 'Zona Exclusiva',
            details: '3 amb • 110 m² • Cochera Fija • Vigilancia 24hs',
            imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80',
            pdfBrochure: true,
            googleMapsUrl: 'https://maps.google.com',
          },
        };
      }

      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 600);
  };

  const handleReset = () => {
    setMessages(INITIAL_MESSAGES);
    setInputText('');
    setIsTyping(false);
  };

  const handleCtaClick = () => {
    if (onOpenAuth) {
      onOpenAuth();
    } else {
      openAuthModal('signup');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-7xl mx-auto">
      
      {/* LEFT COLUMN: CTA Content */}
      <div className="lg:col-span-5 space-y-6 text-left">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold uppercase tracking-wider">
          <Sparkles className="w-4 h-4 fill-current" />
          <span>Simulador en Tiempo Real</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
          Prueba el motor de IA inmobiliaria en tiempo real 🚀
        </h2>

        <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
          Mira cómo Aria responde a tus clientes en menos de 2 segundos recomendando propiedades de tu catálogo con fotos, precios reales y filtrando leads cualificados las 24 horas del día.
        </p>

        <ul className="space-y-3 text-xs sm:text-sm text-slate-200">
          <li className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Respuestas automáticas inteligentes por WhatsApp 24/7</span>
          </li>
          <li className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Sincronización instantánea con Tokko Broker & EasyBroker</span>
          </li>
          <li className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Derivación automática a asesores humanos (Handover Mode)</span>
          </li>
        </ul>

        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <button
            onClick={handleCtaClick}
            className="px-6 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-105"
          >
            <span>Comenzar gratis en tu inmobiliaria</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* RIGHT COLUMN: WhatsApp Phone Mockup Simulator */}
      <div className="lg:col-span-7 flex justify-center">
        <div className="w-full max-w-sm sm:max-w-md bg-[#0b141a] rounded-[40px] border-8 border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[620px] relative font-sans">
          
          {/* Status Bar */}
          <div className="bg-[#111b21] px-5 py-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>9:41</span>
            <div className="flex items-center gap-1.5">
              <span>5G</span>
              <div className="w-5 h-2.5 rounded-sm border border-slate-400 p-0.5 flex items-center">
                <div className="w-full h-full bg-emerald-400 rounded-2xs" />
              </div>
            </div>
          </div>

          {/* WhatsApp Header */}
          <div className="bg-[#202c33] px-4 py-3 flex items-center justify-between border-b border-white/5 text-white">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
                  AP
                </div>
                <span className="w-3 h-3 bg-emerald-500 border-2 border-[#202c33] rounded-full absolute bottom-0 right-0" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-xs text-white leading-tight">Aria Prop Assistant</h3>
                <span className="text-[10px] text-emerald-400 font-medium block">
                  {isTyping ? 'escribiendo...' : 'en línea'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-slate-400">
              <Video className="w-4 h-4 cursor-pointer hover:text-white" />
              <Phone className="w-4 h-4 cursor-pointer hover:text-white" />
              <button
                onClick={handleReset}
                title="Reiniciar Demo"
                className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Background & Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0b141a] bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-page-fade`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-md ${
                      isUser
                        ? 'bg-[#005c4b] text-white rounded-tr-none'
                        : 'bg-[#202c33] text-slate-100 rounded-tl-none border border-white/5'
                    }`}
                  >
                    <p>{msg.text}</p>

                    {/* Property Card Thumbnail inside message */}
                    {msg.propertyCard && (
                      <div className="mt-2.5 rounded-xl bg-[#111b21] overflow-hidden border border-white/10 text-left">
                        <img
                          src={msg.propertyCard.imageUrl}
                          alt={msg.propertyCard.title}
                          className="w-full h-32 object-cover"
                        />
                        <div className="p-2.5 space-y-1">
                          <h4 className="font-bold text-white text-xs">{msg.propertyCard.title}</h4>
                          <p className="text-emerald-400 font-extrabold text-xs">{msg.propertyCard.price}</p>
                          <p className="text-[10px] text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span>{msg.propertyCard.location}</span>
                          </p>
                          <p className="text-[10px] text-slate-300 font-mono pt-1 border-t border-white/5">
                            {msg.propertyCard.details}
                          </p>

                          {/* Quick Actions (PDF, Maps, Tour 360) */}
                          <div className="pt-2 flex flex-wrap items-center gap-1.5 border-t border-white/5">
                            {msg.propertyCard.pdfBrochure && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 text-[9px] font-bold border border-rose-500/30">
                                📄 Ficha PDF lista
                              </span>
                            )}
                            {msg.propertyCard.googleMapsUrl && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[9px] font-bold border border-emerald-500/30">
                                📍 Google Maps
                              </span>
                            )}
                            {msg.propertyCard.tour360Url && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 text-[9px] font-bold border border-sky-500/30">
                                🔄 Tour 360°
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-1 text-[9px] text-slate-400 mt-1">
                      <span>{msg.timestamp}</span>
                      {isUser && <CheckCheck className="w-3 h-3 text-emerald-400" />}
                    </div>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-2 bg-[#202c33] text-slate-400 text-xs px-4 py-2.5 rounded-2xl rounded-tl-none w-fit animate-pulse">
                <Bot className="w-3.5 h-3.5 text-emerald-400" />
                <span>Aria está escribiendo...</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick-Reply Suggestion Chips */}
          <div className="bg-[#111b21] p-2 border-t border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {SUGGESTIONS.map((s) => (
              <button
                key={s.key}
                onClick={() => handleSendMessage(s.label)}
                className="px-2.5 py-1.5 rounded-full bg-[#202c33] hover:bg-[#2a3942] text-slate-200 text-[10px] font-semibold transition-all cursor-pointer whitespace-nowrap border border-white/5"
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Input Footer Bar */}
          <div className="bg-[#202c33] p-2.5 flex items-center gap-2 border-t border-white/5">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
              placeholder="Escribe una consulta..."
              className="flex-1 bg-[#2a3942] text-white text-xs rounded-full px-4 py-2 placeholder-slate-400 focus:outline-none"
            />
            <button
              onClick={() => handleSendMessage(inputText)}
              disabled={!inputText.trim()}
              className="w-9 h-9 rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 flex items-center justify-center transition-all cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4 fill-current ml-0.5" />
            </button>
          </div>

        </div>
      </div>

    </div>
  );
};

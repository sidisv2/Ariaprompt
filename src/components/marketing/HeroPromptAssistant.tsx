import React, { useState } from 'react';
import { Send, Sparkles, User, Bot, CheckCircle2, Calendar, Phone, ArrowRight, MessageSquare } from 'lucide-react';

interface QuickChip {
  id: string;
  label: string;
  icon: string;
  userPrompt: string;
  aiResponse: {
    text: string;
    metrics?: string;
    details?: { label: string; value: string }[];
  };
}

export const HeroPromptAssistant: React.FC<{ onStartDemo?: () => void }> = ({ onStartDemo }) => {
  const [inputText, setInputText] = useState('');
  const [activeChat, setActiveChat] = useState<{
    userText: string;
    aiResponse: {
      text: string;
      metrics?: string;
      details?: { label: string; value: string }[];
    };
  } | null>({
    userText: 'Hola, busco departamento de 2 dormitorios en Belgrano con presupuesto de $180.000 USD',
    aiResponse: {
      text: '¡Hola! Excelente elección. Tengo 2 inmuebles en Belgrano que se ajustan perfecto a tu presupuesto. Calificación: Lead de Alta Intención (Score 98/100).',
      metrics: 'Visita Agendada • Mañana 16:30 hs',
      details: [
        { label: 'Inmueble', value: 'Av. Cabildo 2400 (72m² • 2D)' },
        { label: 'Presupuesto OK', value: '$175.000 USD (Aprobado)' },
        { label: 'Contacto WhatsApp', value: '+54 9 11 4892-1049' },
      ],
    },
  });

  const chips: QuickChip[] = [
    {
      id: 'calificar',
      label: 'Calificar un lead',
      icon: '📊',
      userPrompt: '¿Qué presupuesto y plazo de compra tiene el lead de la Casa en Nordelta?',
      aiResponse: {
        text: 'Analizando conversación: El comprador dispone de $340.000 USD al contado, busca escriturar en 30 días y necesita cochera doble.',
        metrics: 'Lead Aprobado (VIP)',
        details: [
          { label: 'Intención', value: 'Compra Inmediata (30 días)' },
          { label: 'Capacidad Pago', value: 'Contado Escribanía' },
        ],
      },
    },
    {
      id: 'agendar',
      label: 'Agendar una visita',
      icon: '📅',
      userPrompt: 'Quiero agendar una visita presencial para este jueves por la tarde.',
      aiResponse: {
        text: '¡Visita coordinada! He reservado el jueves a las 17:00 hs en tu Google Calendar y le envié la ubicación exacta por WhatsApp al cliente.',
        metrics: 'Confirmado en Calendario',
        details: [
          { label: 'Horario', value: 'Jueves 17:00 hs (30 min)' },
          { label: 'Recordatorio SMS', value: 'Programado 2h antes' },
        ],
      },
    },
    {
      id: 'whatsapp',
      label: 'Responder por WhatsApp',
      icon: '📱',
      userPrompt: 'Un cliente preguntó a las 3:00 AM si el departamento acepta mascotas.',
      aiResponse: {
        text: 'Aria respondió a las 3:00:04 AM: "¡Hola Marcos! Sí, el edificio acepta mascotas de hasta 15kg. ¿Te gustaría agendar una visita para mañana?"',
        metrics: 'Respuesta en 4 segundos ⚡',
        details: [
          { label: 'Estado', value: 'Atendido fuera de horario' },
          { label: 'Ficha Técnica PDF', value: 'Enviada automáticamente' },
        ],
      },
    },
    {
      id: 'seguimiento',
      label: 'Dar seguimiento a un cliente',
      icon: '🔄',
      userPrompt: '¿Qué pasó con el prospecto que vio el PH en Palermo la semana pasada?',
      aiResponse: {
        text: 'Re-contacté a Sofía ayer. Mantiene el interés pero solicita rebaja del 3%. ¿Quieres que te reserve cita para evaluar la contraoferta?',
        metrics: 'Lead Re-activado',
        details: [
          { label: 'Última interacción', value: 'Ayer 19:15 hs' },
          { label: 'Acción sugerida', value: 'Llamada de cierre' },
        ],
      },
    },
  ];

  const handleChipClick = (chip: QuickChip) => {
    setInputText(chip.userPrompt);
    setActiveChat({
      userText: chip.userPrompt,
      aiResponse: chip.aiResponse,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setActiveChat({
      userText: inputText,
      aiResponse: {
        text: `Aria Prop procesó tu consulta: "${inputText}". He calificado los requisitos del lead, verificado disponibilidad en inventario y preparado el resumen para tu agenda.`,
        metrics: 'Atendido en < 3s',
        details: [
          { label: 'Consulta', value: inputText },
          { label: 'Estado IA', value: 'Cualificación en proceso' },
        ],
      },
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 text-left">
      
      {/* Interactive Prompt Box Container (Cloudairy Style) */}
      <div className="p-3 sm:p-4 rounded-3xl bg-white border border-indigo-100 shadow-2xl shadow-indigo-500/10 backdrop-blur-xl transition-all duration-300">
        
        <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
          <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 shrink-0">
            <Sparkles className="w-5 h-5 fill-indigo-500/20 text-indigo-600 animate-pulse" />
          </div>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="¿Qué necesitas que Aria resuelva hoy?"
            className="w-full bg-transparent text-sm sm:text-base text-slate-900 placeholder-slate-400 focus:outline-none font-medium pr-12"
          />
          <button
            type="submit"
            className="p-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition-all cursor-pointer hover:scale-105 shrink-0"
            title="Probar consulta"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Action Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 mt-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Acciones rápidas:
          </span>
          {chips.map((chip) => (
            <button
              key={chip.id}
              onClick={() => handleChipClick(chip)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200/80 hover:border-indigo-300 text-xs font-semibold transition-all cursor-pointer active:scale-95 shadow-sm"
            >
              <span>{chip.icon}</span>
              <span>{chip.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Simulated Live Chat Response Panel */}
      {activeChat && (
        <div className="p-5 rounded-3xl bg-slate-900 text-white border border-indigo-500/30 shadow-2xl space-y-4 animate-fadeIn">
          
          {/* User Message */}
          <div className="flex items-start gap-3 justify-end">
            <div className="p-3.5 rounded-2xl bg-indigo-600 text-white text-xs sm:text-sm font-medium max-w-md shadow-md">
              <p>{activeChat.userText}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shrink-0">
              <User className="w-4 h-4" />
            </div>
          </div>

          {/* AI Response */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-800/90 border border-white/10 text-slate-200 text-xs sm:text-sm space-y-3 max-w-lg shadow-md">
              
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-[11px] font-extrabold text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 fill-current" />
                  <span>Respuesta Aria Prop IA</span>
                </span>
                {activeChat.aiResponse.metrics && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {activeChat.aiResponse.metrics}
                  </span>
                )}
              </div>

              <p className="leading-relaxed">{activeChat.aiResponse.text}</p>

              {activeChat.aiResponse.details && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {activeChat.aiResponse.details.map((d, i) => (
                    <div key={i} className="p-2 rounded-xl bg-slate-950/80 border border-white/5 text-[11px]">
                      <span className="text-slate-400 block text-[10px]">{d.label}</span>
                      <span className="font-bold text-white">{d.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

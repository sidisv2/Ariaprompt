import React, { useState } from 'react';
import { Send, Sparkles, User, Bot, CheckCircle2, Calendar, ShieldCheck, Zap } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const HeroPromptAssistant: React.FC<{ onStartDemo?: () => void }> = ({ onStartDemo }) => {
  const { t, lang } = useLanguage();
  const [inputText, setInputText] = useState('');
  const [activeChat, setActiveChat] = useState<{
    userText: string;
    aiResponse: {
      text: string;
      metrics?: string;
      details?: { label: string; value: string }[];
    };
  } | null>({
    userText: t('prompt.userDefault'),
    aiResponse: {
      text: t('prompt.aiDefault'),
      metrics: t('prompt.metricDefault'),
      details: [
        { label: 'Inmueble', value: 'Av. Cabildo 2400 (72m² • 2D)' },
        { label: 'Presupuesto OK', value: '$175.000 USD (Aprobado)' },
        { label: 'Contacto WhatsApp', value: '+54 9 11 4892-1049' },
      ],
    },
  });

  const chips = [
    {
      id: 'calificar',
      label: t('prompt.chip1'),
      icon: '📊',
      userPrompt: t('prompt.user1'),
      aiResponse: {
        text: t('prompt.ai1'),
        metrics: t('prompt.metric1'),
        details: [
          { label: 'Intención', value: 'Compra Inmediata (30 días)' },
          { label: 'Capacidad Pago', value: 'Contado Escribanía' },
        ],
      },
    },
    {
      id: 'agendar',
      label: t('prompt.chip2'),
      icon: '📅',
      userPrompt: t('prompt.user2'),
      aiResponse: {
        text: t('prompt.ai2'),
        metrics: t('prompt.metric2'),
        details: [
          { label: 'Horario', value: 'Jueves 17:00 hs (30 min)' },
          { label: 'Recordatorio SMS', value: 'Programado 2h antes' },
        ],
      },
    },
    {
      id: 'whatsapp',
      label: t('prompt.chip3'),
      icon: '📱',
      userPrompt: t('prompt.user3'),
      aiResponse: {
        text: t('prompt.ai3'),
        metrics: t('prompt.metric3'),
        details: [
          { label: 'Estado', value: 'Atendido fuera de horario' },
          { label: 'Ficha Técnica PDF', value: 'Enviada automáticamente' },
        ],
      },
    },
    {
      id: 'seguimiento',
      label: t('prompt.chip4'),
      icon: '🎯',
      userPrompt: t('prompt.user4'),
      aiResponse: {
        text: t('prompt.ai4'),
        metrics: t('prompt.metric4'),
        details: [
          { label: 'Re-Contacto', value: 'Exitoso en 24h' },
          { label: 'Estado Lead', value: 'En negociación activa' },
        ],
      },
    },
  ];

  const handleChipClick = (chip: (typeof chips)[0]) => {
    setActiveChat({
      userText: chip.userPrompt,
      aiResponse: chip.aiResponse,
    });
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setActiveChat({
      userText: inputText,
      aiResponse: {
        text: `¡Excelente consulta! Analizando el inventario de la agencia... He seleccionado 2 inmuebles ideales para esa solicitud.`,
        metrics: 'Lead Calificado • Score 95/100',
        details: [
          { label: 'Respuesta IA', value: 'Generada en 3.8s' },
          { label: 'Acción Siguiente', value: 'Enviar Ficha PDF por WhatsApp' },
        ],
      },
    });

    setInputText('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      
      {/* 2 Pre-armados Sample Cards (Cloudairy Showcase Style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-md shadow-slate-200/50 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 font-bold flex items-center justify-center shrink-0 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 block">Lead Calificado en WhatsApp</span>
              <span className="text-[11px] text-slate-500">Depto 2 amb. • Presupuesto $180k USD</span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black shrink-0">
            Score 98/100
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-md shadow-slate-200/50 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center shrink-0 border border-indigo-200">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 block">Visita Agendada en Google Cal</span>
              <span className="text-[11px] text-slate-500">Jueves 16:30 hs • Confirmado 24/7</span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-black shrink-0">
            Automático
          </span>
        </div>
      </div>

      {/* Main Interactive Prompt Box */}
      <div className="relative rounded-3xl bg-slate-900 border border-indigo-500/30 p-4 sm:p-6 shadow-2xl shadow-indigo-500/10 text-white space-y-4">
        
        {/* Quick Action Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold">
          <span className="text-slate-400 shrink-0 font-bold text-[11px] uppercase tracking-wider">{t('prompt.quickAction')}</span>
          {chips.map((chip) => (
            <button
              key={chip.id}
              onClick={() => handleChipClick(chip)}
              className="px-3 py-1.5 rounded-full bg-slate-800 hover:bg-indigo-600/30 text-slate-200 border border-white/10 hover:border-indigo-400/50 transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              <span>{chip.icon}</span>
              <span>{chip.label}</span>
            </button>
          ))}
        </div>

        {/* Dynamic Simulated Output Display */}
        {activeChat && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 space-y-3 animate-fadeIn">
            
            {/* User Bubble */}
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs text-slate-200 font-medium leading-relaxed bg-slate-900 px-3 py-2 rounded-2xl border border-white/5">
                {activeChat.userText}
              </p>
            </div>

            {/* AI Agent Response Bubble */}
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 font-bold">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-xs text-emerald-300 font-medium leading-relaxed bg-emerald-950/40 p-3 rounded-2xl border border-emerald-500/30">
                  {activeChat.aiResponse.text}
                </p>

                {activeChat.aiResponse.metrics && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    <span>{activeChat.aiResponse.metrics}</span>
                  </div>
                )}

                {activeChat.aiResponse.details && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    {activeChat.aiResponse.details.map((d, i) => (
                      <div key={i} className="p-2 rounded-xl bg-slate-900 border border-white/5 text-[10px]">
                        <span className="text-slate-400 block">{d.label}</span>
                        <span className="font-bold text-white block truncate">{d.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleCustomSubmit} className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t('prompt.placeholder')}
            className="w-full pl-4 pr-12 py-3 rounded-2xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="absolute right-2 p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all cursor-pointer"
            title="Enviar mensaje"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};

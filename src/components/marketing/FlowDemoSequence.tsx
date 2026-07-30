import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { MessageSquare, Calendar, CheckCircle2, UserCheck, Zap, Brain, Sparkles, ShieldCheck } from 'lucide-react';

export const FlowDemoSequence: React.FC = () => {
  const { t } = useLanguage();
  const [demoMode, setDemoMode] = useState<'speed' | 'context'>('context');
  const [activeStep, setActiveStep] = useState<number>(0);

  // Auto-advance loop (3.5s per step)
  useEffect(() => {
    const maxSteps = demoMode === 'speed' ? 4 : 5;
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % maxSteps);
    }, 4000);
    return () => clearInterval(timer);
  }, [demoMode]);

  const speedSteps = [
    {
      id: 0,
      badge: t('flowDemo.step1Badge') || 'Paso 1 • Consulta de Lead',
      title: t('flowDemo.step1Title') || 'El prospecto escribe por WhatsApp o Web',
      desc: t('flowDemo.step1Desc') || 'Son las 11:15 PM. Un comprador interesado pregunta por un departamento de 3 ambientes en Palermo.',
      chatUser: t('flowDemo.step1UserMsg') || 'Hola! Vi el depto de 3 amb en Palermo (USD 175k). ¿Está disponible? Quisiera verlo.',
    },
    {
      id: 1,
      badge: t('flowDemo.step2Badge') || 'Paso 2 • Respuesta Instantánea en Segundos',
      title: t('flowDemo.step2Title') || 'Aria responde al instante con datos reales del CRM',
      desc: t('flowDemo.step2Desc') || 'Sin demoras ni esperar a mañana. Aria entrega la ficha técnica exacta desde Tokko/EasyBroker.',
      chatBot: t('flowDemo.step2BotMsg') || '¡Hola! Sí, está disponible (Código EB-4092). Cuenta con 85m², balcón terraza y cochera. ¿Querés agendar una visita presencial esta semana?',
    },
    {
      id: 2,
      badge: t('flowDemo.step3Badge') || 'Paso 3 • Cualificación & Agendamiento',
      title: t('flowDemo.step3Title') || 'Cualifica presupuesto y reserva la cita en tu calendario',
      desc: t('flowDemo.step3Desc') || 'Aria confirma la disponibilidad del comprador y reserva directamente en tu agenda.',
      chatUser: t('flowDemo.step3UserMsg') || 'Sí, me interesa ir este Sábado a las 11:00 hs.',
      chatBotConfirm: t('flowDemo.step3BotConfirm') || '¡Excelente, Mateo! Tu visita quedó agendada para el Sábado a las 11:00 hs. Te envié la confirmación.',
    },
    {
      id: 3,
      badge: t('flowDemo.step4Badge') || 'Paso 4 • Lead Listo en tu Dashboard',
      title: t('flowDemo.step4Title') || 'Te enterás al abrir la oficina a la mañana con la cita confirmada',
      desc: t('flowDemo.step4Desc') || 'El lead aparece cualificado en tu panel de control con presupuesto, propiedad de interés y horario agendado.',
      dashboardLead: {
        name: 'Mateo Rossi',
        interest: 'Depto 3 Amb - Palermo (USD 175.000)',
        appointment: 'Sábado 11:00 hs',
        status: 'Cita Confirmada',
      },
    },
  ];

  const contextSteps = [
    {
      id: 0,
      badge: t('flowDemo.cStep1Badge') || 'Turno 1 • Manejo de Ambigüedad',
      title: t('flowDemo.cStep1Title') || 'El usuario hace una consulta vaga o incompleta',
      desc: t('flowDemo.cStep1Desc') || 'En lugar de adivinar o trabarse, Aria responde pidiendo la aclaración justa para enfocar la búsqueda.',
      chatUser: t('flowDemo.cStep1User') || 'Hola, busco algo cerca del centro, no muy caro.',
      chatBot: t('flowDemo.cStep1Bot') || '¡Hola! Con gusto te ayudo a buscar. Para sugerirte las mejores opciones: ¿buscás para alquilar o comprar, y qué presupuesto máximo manejás aproximadamente?',
    },
    {
      id: 1,
      badge: t('flowDemo.cStep2Badge') || 'Turno 2 • Memoria Conversacional',
      title: t('flowDemo.cStep2Title') || 'El usuario aclara y suma un nuevo requisito',
      desc: t('flowDemo.cStep2Desc') || 'Aria recuerda la zona Centro, el presupuesto de USD 140k y retiene que prefiere cochera sin perder el contexto.',
      chatUser: t('flowDemo.cStep2User') || 'Es para comprar, hasta USD 140,000. Pero en realidad mejor si tiene cochera.',
      chatBot: t('flowDemo.cStep2Bot') || 'Entendido. Filtro Venta en zona Centro hasta USD 140.000 con Cochera. Encontré 2 opciones: 1) Depto 2 Amb en Barrio Bombal (USD 125,000) y 2) Depto 3 Amb en Av. España (USD 138,000), ambos con cochera propia.',
    },
    {
      id: 2,
      badge: t('flowDemo.cStep3Badge') || 'Turno 3 • Búsqueda Comparativa Dinámica',
      title: t('flowDemo.cStep3Title') || 'El usuario pide comparar subiendo el presupuesto',
      desc: t('flowDemo.cStep3Desc') || 'Aria no empieza de cero: mantiene Venta + Centro + Cochera y expande a USD 160k incorporando nuevas opciones.',
      chatUser: t('flowDemo.cStep3User') || '¿Y si subo el presupuesto a USD 160,000, qué otras opciones más amplias aparecen?',
      chatBot: t('flowDemo.cStep3Bot') || 'Manteniendo Venta con Cochera en zona céntrica y aumentando el tope a USD 160.000, se suma el Penthouse 3 Amb (USD 155,000) con balcón terraza y valet parking. ¿Te gustaría agendar una visita?',
    },
    {
      id: 3,
      badge: t('flowDemo.cStep4Badge') || 'Turno 4 • Reserva & Cualificación Final',
      title: t('flowDemo.cStep4Title') || 'El usuario elige fecha y Aria coordina la cita',
      desc: t('flowDemo.cStep4Desc') || 'Aria confirma la cita en la agenda del agente y emite el scoring automático del lead.',
      chatUser: t('flowDemo.cStep4User') || 'Sí, el sábado a las 11:30 hs me viene perfecto.',
      chatBotConfirm: t('flowDemo.cStep4BotConfirm') || '¡Perfecto, Carlos! Cita agendada para el Sábado a las 11:30 hs. Lead Cualificado (Presupuesto: USD 160k | Score: 96/100 🔥). Recordatorio enviado a tu WhatsApp.',
    },
    {
      id: 4,
      badge: t('flowDemo.cStep5Badge') || 'Turno 5 • Lead Registrado en Dashboard',
      title: t('flowDemo.cStep5Title') || 'Lead registrado con contexto completo en el CRM',
      desc: t('flowDemo.cStep5Desc') || 'Toda la conversación, preferencias registradas (USD 160k, cochera, centro) y horario de cita quedan listos en el dashboard.',
      dashboardLead: {
        name: 'Carlos Gómez',
        interest: 'Venta Centro - Penthouse 3 Amb (USD 155.000)',
        appointment: 'Sábado 11:30 hs',
        status: 'Lead Caliente 🔥 (96/100)',
      },
    },
  ];

  const currentSteps = demoMode === 'speed' ? speedSteps : contextSteps;
  const currentStepData = currentSteps[activeStep] || currentSteps[0];

  return (
    <div className="w-full max-w-5xl mx-auto rounded-3xl bg-slate-900/90 border border-emerald-500/30 p-6 md:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
      
      {/* Top Controls & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 fill-emerald-400" />
            <span>{t('flowDemo.liveSequenceBadge') || 'Demostración Interactiva de Inteligencia IA'}</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {t('flowDemo.heading') || 'Comprobá cómo Aria entiende contexto, memoria y ambigüedad'}
          </h3>
        </div>

        {/* Dual Mode Switcher Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-2xl border border-white/10 shrink-0">
          <button
            onClick={() => {
              setDemoMode('context');
              setActiveStep(0);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              demoMode === 'context'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>{t('flowDemo.tabContext') || '🧠 Memoria & Contexto (5 Turnos)'}</span>
          </button>

          <button
            onClick={() => {
              setDemoMode('speed');
              setActiveStep(0);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              demoMode === 'speed'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>{t('flowDemo.tabSpeed') || '⚡ Flujo Rápido (1-Clic)'}</span>
          </button>
        </div>
      </div>

      {/* Step Progress Dots Bar */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/5 text-xs text-slate-400">
        <span className="font-bold text-emerald-400 text-[11px] uppercase tracking-wider">
          {demoMode === 'context' ? 'Secuencia de Diálogo Inteligente Multiturno' : 'Secuencia de Respuesta Inmediata'}
        </span>
        <div className="flex items-center gap-1.5">
          {currentSteps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveStep(idx)}
              className={`h-2.5 rounded-full transition-all cursor-pointer ${
                activeStep === idx ? 'w-8 bg-emerald-400' : 'w-2.5 bg-slate-700 hover:bg-slate-600'
              }`}
              title={`Paso ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Main Animated Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* Left Side: Narrative Explanation */}
        <div className="lg:col-span-5 space-y-4 text-left">
          <span className="inline-block text-xs font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
            {currentStepData.badge}
          </span>
          <h4 className="text-xl font-bold text-white leading-snug">
            {currentStepData.title}
          </h4>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {currentStepData.desc}
          </p>

          <div className="pt-2 flex items-center gap-2 text-xs font-bold text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{demoMode === 'context' ? 'Comprensión contextual continua en cada turno' : 'Sincronización automática 24/7 sin guardias manuales'}</span>
          </div>
        </div>

        {/* Right Side: Visual Chat & Dashboard Simulation */}
        <div className="lg:col-span-7 bg-slate-950 rounded-2xl border border-white/10 p-5 min-h-[300px] flex flex-col justify-center space-y-3 relative shadow-inner">
          
          {/* Chat Bubble: User Message */}
          {currentStepData.chatUser && (
            <div className="space-y-2 animate-fade-in">
              <div className="flex items-center gap-2 text-xs text-slate-400 pb-1 border-b border-white/5">
                <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
                <span>Prospecto Inmobiliario</span>
              </div>
              <div className="max-w-[90%] p-3.5 rounded-2xl bg-teal-600/20 border border-teal-500/30 text-teal-100 text-xs sm:text-sm font-medium ml-auto rounded-tr-none text-left">
                {currentStepData.chatUser}
              </div>
            </div>
          )}

          {/* Chat Bubble: AI Response */}
          {currentStepData.chatBot && (
            <div className="space-y-2 animate-fade-in">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-1 border-b border-white/5">
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <Brain className="w-3.5 h-3.5 text-emerald-400" /> Aria AI (Respuesta Contextual)
                </span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/20">
                  Memoria Activa
                </span>
              </div>
              <div className="max-w-[92%] p-3.5 rounded-2xl bg-slate-900 border border-emerald-500/40 text-emerald-100 text-xs sm:text-sm font-medium rounded-tl-none text-left leading-relaxed">
                {currentStepData.chatBot}
              </div>
            </div>
          )}

          {/* Chat Confirmation */}
          {currentStepData.chatBotConfirm && (
            <div className="max-w-[90%] p-3.5 rounded-2xl bg-slate-900 border border-emerald-500/40 text-emerald-100 text-xs sm:text-sm font-medium rounded-tl-none flex items-start gap-2.5 text-left">
              <Calendar className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{currentStepData.chatBotConfirm}</span>
            </div>
          )}

          {/* Dashboard Result Card */}
          {currentStepData.dashboardLead && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between text-xs text-emerald-400 font-extrabold pb-2 border-b border-white/5">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Lead Registrado en Dashboard</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  Cita Confirmada
                </span>
              </div>
              
              <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-black text-white">{currentStepData.dashboardLead.name}</span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium">{currentStepData.dashboardLead.interest}</p>
                  <p className="text-[11px] text-emerald-400 font-bold">📅 {currentStepData.dashboardLead.appointment}</p>
                </div>
                <span className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black shrink-0">
                  {currentStepData.dashboardLead.status}
                </span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

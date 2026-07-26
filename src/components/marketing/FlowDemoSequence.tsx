import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { MessageSquare, Calendar, CheckCircle2, UserCheck, Zap, ArrowRight, ShieldCheck } from 'lucide-react';

export const FlowDemoSequence: React.FC = () => {
  const { t } = useLanguage();
  const [activeStep, setActiveStep] = useState<number>(0);

  // 14-second loop: 0 -> 1 -> 2 -> 3 -> 0
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const steps = [
    {
      id: 0,
      badge: t('flowDemo.step1Badge') || 'Paso 1 • Consulta de Lead',
      title: t('flowDemo.step1Title') || 'El prospecto escribe por WhatsApp o Web',
      desc: t('flowDemo.step1Desc') || 'Son las 11:15 PM. Un comprador interesado pregunta por un departamento de 3 ambientes en Palermo.',
      chatUser: t('flowDemo.step1UserMsg') || 'Hola! Vi el depto de 3 amb en Palermo (USD 175k). ¿Está disponible? Quisiera verlo.',
    },
    {
      id: 1,
      badge: t('flowDemo.step2Badge') || 'Paso 2 • Respuesta Instantánea < 5s',
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

  return (
    <div className="w-full max-w-5xl mx-auto rounded-3xl bg-slate-900/90 border border-emerald-500/30 p-6 md:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
      
      {/* Top Header & Step Progress Indicators */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-2">
            <Zap className="w-3.5 h-3.5 fill-emerald-400" />
            <span>{t('flowDemo.liveSequenceBadge') || 'Demostración del Flujo Completo (10-15s Loop)'}</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {t('flowDemo.heading') || 'Mirá cómo Aria transforma un lead nocturno en una visita agendada'}
          </h3>
        </div>

        {/* Step Progress Dots */}
        <div className="flex items-center gap-2">
          {steps.map((s, idx) => (
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
        
        {/* Left Side: Step Narrative & Explanation */}
        <div className="lg:col-span-5 space-y-4 text-left">
          <span className="inline-block text-xs font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
            {steps[activeStep].badge}
          </span>
          <h4 className="text-xl font-bold text-white leading-snug">
            {steps[activeStep].title}
          </h4>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {steps[activeStep].desc}
          </p>

          <div className="pt-2 flex items-center gap-2 text-xs font-bold text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Sincronización automática 24/7 sin guardar guardias manuales</span>
          </div>
        </div>

        {/* Right Side: Visual Chat / Dashboard Simulation */}
        <div className="lg:col-span-7 bg-slate-950 rounded-2xl border border-white/10 p-5 min-h-[260px] flex flex-col justify-center space-y-3 relative shadow-inner">
          
          {/* Step 0: User Msg */}
          {activeStep === 0 && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 text-xs text-slate-400 pb-2 border-b border-white/5">
                <MessageSquare className="w-4 h-4 text-teal-400" />
                <span>WhatsApp Business • 11:15 PM</span>
              </div>
              <div className="max-w-[85%] p-3.5 rounded-2xl bg-teal-600/20 border border-teal-500/30 text-teal-100 text-xs sm:text-sm font-medium ml-auto rounded-tr-none">
                {steps[0].chatUser}
              </div>
            </div>
          )}

          {/* Step 1: AI Instant Response */}
          {activeStep === 1 && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-white/5">
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <Zap className="w-3.5 h-3.5 fill-current" /> Aria AI (Respuesta en 1.8s)
                </span>
                <span className="text-[10px] text-slate-500">Catálogo Tokko/EasyBroker</span>
              </div>
              <div className="max-w-[85%] p-3.5 rounded-2xl bg-slate-900 border border-emerald-500/40 text-emerald-100 text-xs sm:text-sm font-medium rounded-tl-none">
                {steps[1].chatBot}
              </div>
            </div>
          )}

          {/* Step 2: Qualification & Scheduling */}
          {activeStep === 2 && (
            <div className="space-y-3 animate-fade-in">
              <div className="max-w-[80%] p-3 rounded-2xl bg-teal-600/20 border border-teal-500/30 text-teal-100 text-xs font-medium ml-auto rounded-tr-none">
                {steps[2].chatUser}
              </div>
              <div className="max-w-[85%] p-3.5 rounded-2xl bg-slate-900 border border-emerald-500/40 text-emerald-100 text-xs sm:text-sm font-medium rounded-tl-none flex items-start gap-2">
                <Calendar className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{steps[2].chatBotConfirm}</span>
              </div>
            </div>
          )}

          {/* Step 3: Dashboard Result */}
          {activeStep === 3 && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between text-xs text-emerald-400 font-extrabold pb-2 border-b border-white/5">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Cita Agendada en Dashboard</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">
                  09:00 AM Siguiente Día
                </span>
              </div>
              
              <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 flex items-center justify-between">
                <div className="space-y-1 text-left">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-extrabold text-white">{steps[3].dashboardLead?.name}</span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium">{steps[3].dashboardLead?.interest}</p>
                  <p className="text-[11px] text-emerald-400 font-bold">📅 {steps[3].dashboardLead?.appointment}</p>
                </div>
                <span className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black">
                  {steps[3].dashboardLead?.status}
                </span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

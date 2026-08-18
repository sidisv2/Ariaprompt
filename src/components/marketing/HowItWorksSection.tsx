import React from 'react';
import { MessageSquare, Bot, CalendarCheck, Award, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const HowItWorksSection: React.FC<{ onRouteChange?: (route: any) => void }> = ({ onRouteChange }) => {
  const { user, openAuthModal } = useAuth();
  const { t } = useLanguage();

  const handleCta = () => {
    if (user) {
      if (onRouteChange) onRouteChange('app');
    } else {
      openAuthModal('signup', 'pro', 'dashboard-checkout');
    }
  };

  const steps = [
    {
      step: '01',
      icon: <MessageSquare className="w-5 h-5 text-emerald-400" />,
      title: t('how.step1Title') || 'Conexión de Catálogo y CRM',
      description: t('how.step1Desc') || 'Sincroniza tus propiedades desde Tokko Broker, EasyBroker o mediante carga de catálogo directo de la agencia.',
    },
    {
      step: '02',
      icon: <Bot className="w-5 h-5 text-teal-300" />,
      title: t('how.step2Title') || 'Atención Instantánea 24/7',
      description: t('how.step2Desc') || 'Aria responde a los prospectos en menos de 5 segundos en WhatsApp y Web, aclarando detalles técnicos y precios.',
    },
    {
      step: '03',
      icon: <CalendarCheck className="w-5 h-5 text-indigo-400" />,
      title: t('how.step3Title') || 'Cualificación de Presupuesto',
      description: t('how.step3Desc') || 'El agente IA analiza el presupuesto, la urgencia de compra y la zona deseada, filtrando curiosos automáticamente.',
    },
    {
      step: '04',
      icon: <Award className="w-5 h-5 text-amber-400" />,
      title: t('how.step4Title') || 'Agendado en Tu Calendario',
      description: t('how.step4Desc') || 'Los leads calificados coordinan la visita presencial directamente en Google Calendar con el corredor asignado.',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-slate-950 text-white border-b border-white/10 relative overflow-hidden text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{t('how.badge') || 'Proceso Automatizado'}</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            {t('how.title') || 'Cuatro sencillos pasos para multiplicar tus cierres'}
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
            {t('how.subtitle') || 'Conocé cómo la IA se encarga de la prospección nocturna mientras tu equipo se enfoca exclusivamente en cerrar ventas.'}
          </p>
        </div>

        {/* 4 Steps Grid with Ultra-High Contrast */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-slate-900/90 border border-emerald-500/30 hover:border-emerald-400/60 transition-all duration-300 shadow-xl backdrop-blur-xl flex flex-col justify-between space-y-5 relative group hover:-translate-y-1"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black font-mono tracking-wider px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    PASO {s.step}
                  </span>
                  <div className="p-2.5 rounded-2xl bg-slate-950 border border-emerald-500/30 group-hover:border-emerald-400/60 transition-colors shadow-md">
                    {s.icon}
                  </div>
                </div>
                
                {/* 100% Readable High-Contrast Card Title & Description */}
                <h3 className="text-base sm:text-lg font-black text-white leading-snug tracking-tight">
                  {s.title}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  {s.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Strategic CTA */}
        <div className="pt-4 text-center">
          <button
            onClick={handleCta}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-xl shadow-emerald-500/25 transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <span>{t('how.cta') || 'Ver el Asistente en Acción'}</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

      </div>
    </section>
  );
};

export default HowItWorksSection;

import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Database, CalendarCheck, MessageSquare, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

export const WhyAriaSection: React.FC = () => {
  const { t } = useLanguage();

  const cards = [
    {
      icon: <Database className="w-6 h-6 text-teal-400" />,
      title: t('whyAria.card1Title') || 'Conectado a tu Catálogo Real (No Inventa Datos)',
      desc: t('whyAria.card1Desc') || 'A diferencia de un ChatGPT genérico, Aria Prop se sincroniza vía API Key con Tokko Broker y EasyBroker. Responde únicamente con los datos reales, precios y fotos vigentes de tu inventario.',
      tag: 'Integración CRM Directa',
    },
    {
      icon: <CalendarCheck className="w-6 h-6 text-emerald-400" />,
      title: t('whyAria.card2Title') || 'Cualifica y Agenda Automáticamente',
      desc: t('whyAria.card2Desc') || 'Un CRM tradicional solo almacena contactos pasivos. Aria Prop entabla una conversación comercial real, detecta el presupuesto del comprador y le agenda una visita en tu calendario sin tu intervención.',
      tag: 'Venta Proactiva 24/7',
    },
    {
      icon: <MessageSquare className="w-6 h-6 text-cyan-400" />,
      title: t('whyAria.card3Title') || 'Directo en tu Web y WhatsApp (Sin Apps Extra)',
      desc: t('whyAria.card3Desc') || 'Funciona de forma totalmente transparente en tu sitio web y en tu número de WhatsApp Business. Tu cliente no tiene que descargar ninguna app ni registrarse en ninguna plataforma externa.',
      tag: 'Experiencia Omnicanal',
    },
  ];

  return (
    <section className="py-20 bg-slate-900/80 text-white border-b border-white/10 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-extrabold">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>{t('whyAria.badge') || 'Diferenciadores Clave'}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            {t('whyAria.title') || '¿Por qué Aria Prop y no ChatGPT o un CRM tradicional?'}
          </h2>
          <p className="text-sm sm:text-base text-slate-300">
            {t('whyAria.subtitle') || 'Aria Prop no es un bot genérico ni una agenda pasiva: es un asistente comercial especializado en el mercado inmobiliario.'}
          </p>
        </div>

        {/* 3 Differentiators Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card, idx) => (
            <div
              key={idx}
              className="rounded-3xl bg-slate-950 border border-white/10 p-6 md:p-8 flex flex-col justify-between space-y-6 shadow-xl hover:border-emerald-500/40 transition-all text-left group"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {card.icon}
                </div>
                <h3 className="text-lg font-extrabold text-white leading-snug">
                  {card.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                  {card.desc}
                </p>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center gap-2 text-xs font-extrabold text-emerald-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{card.tag}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

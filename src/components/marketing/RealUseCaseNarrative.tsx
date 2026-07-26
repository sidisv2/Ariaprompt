import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Clock, MessageSquare, Calendar, CheckCircle2, Moon, Sun, ArrowRight, UserCheck } from 'lucide-react';

export const RealUseCaseNarrative: React.FC = () => {
  const { t } = useLanguage();

  const timeline = [
    {
      time: '11:00 PM (Jueves)',
      icon: <Moon className="w-4 h-4 text-indigo-400" />,
      title: t('useCase.step1Title') || 'El comprador escribe por WhatsApp fuera de horario',
      desc: t('useCase.step1Desc') || 'Un cliente interesado ve una propiedad en Palermo y envía una consulta por WhatsApp preguntando por precio, disponibilidad y visitas.',
    },
    {
      time: '11:00:03 PM',
      icon: <Clock className="w-4 h-4 text-emerald-400" />,
      title: t('useCase.step2Title') || 'Aria responde al instante con los datos exactos del catálogo',
      desc: t('useCase.step2Desc') || 'En 3 segundos, Aria le envía la ficha completa sincronizada desde tu CRM, aclarando el precio (USD 175.000) y las características principales.',
    },
    {
      time: '11:01:15 PM',
      icon: <Calendar className="w-4 h-4 text-teal-400" />,
      title: t('useCase.step3Title') || 'Cualificación de presupuesto y reserva de visita',
      desc: t('useCase.step3Desc') || 'Aria valida que el comprador tiene el presupuesto listo y agenda la visita directamente para el Sábado a las 11:00 AM.',
    },
    {
      time: '09:00 AM (Viernes)',
      icon: <Sun className="w-4 h-4 text-amber-400" />,
      title: t('useCase.step4Title') || 'Vos abrís la oficina con la cita confirmada',
      desc: t('useCase.step4Desc') || 'Llegás a la inmobiliaria a la mañana con tu café, abrís el dashboard de Aria Prop y encontrás la cita ya confirmada en tu calendario.',
    },
  ];

  return (
    <section className="py-20 bg-slate-950 text-white border-b border-white/10 relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('useCase.badge') || 'Caso de Uso Real en Acción'}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            {t('useCase.title') || 'Un día cualquiera en tu inmobiliaria con Aria Prop'}
          </h2>
          <p className="text-sm sm:text-base text-slate-300">
            {t('useCase.subtitle') || 'Así es como ningún prospecto interesado se vuelve a perder por demoras en la respuesta.'}
          </p>
        </div>

        {/* Story Timeline Container */}
        <div className="rounded-3xl bg-slate-900 border border-white/10 p-6 md:p-10 shadow-2xl relative">
          <div className="space-y-8 relative before:absolute before:inset-0 before:left-6 md:before:left-1/2 before:-translate-x-1/2 before:w-0.5 before:bg-gradient-to-b before:from-emerald-500 before:via-teal-400 before:to-indigo-500">
            
            {timeline.map((item, idx) => (
              <div
                key={idx}
                className={`relative flex flex-col md:flex-row items-start gap-6 ${
                  idx % 2 === 0 ? 'md:flex-row-reverse text-left' : 'text-left'
                }`}
              >
                
                {/* Timeline Center Node */}
                <div className="absolute left-6 md:left-1/2 -translate-x-1/2 w-10 h-10 rounded-2xl bg-slate-950 border-2 border-emerald-400 flex items-center justify-center shrink-0 z-10 shadow-lg shadow-emerald-500/20">
                  {item.icon}
                </div>

                {/* Content Box */}
                <div className="ml-14 md:ml-0 md:w-1/2 p-5 md:p-6 rounded-2xl bg-slate-950/90 border border-white/10 shadow-md space-y-2 hover:border-emerald-500/30 transition-all">
                  <div className="inline-block px-3 py-1 rounded-full bg-white/5 text-emerald-400 text-xs font-bold font-mono">
                    {item.time}
                  </div>
                  <h4 className="text-base font-extrabold text-white">
                    {item.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </div>

              </div>
            ))}

          </div>
        </div>

      </div>
    </section>
  );
};

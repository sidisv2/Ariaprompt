import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { X, Check, ArrowRight, Zap, ShieldCheck } from 'lucide-react';

export const ComparisonSection: React.FC = () => {
  const { t } = useLanguage();

  const rows = [
    {
      feature: t('comparison.row1Feature') || 'Velocidad de Respuesta a Leads',
      without: t('comparison.row1Without') || 'Demoras de 2 a 12 horas respondiendo a mano. Los leads se enfrían o consultan a la competencia.',
      withAria: t('comparison.row1With') || 'Respuesta instantánea en menos de 5 segundos, las 24 horas del día, los 7 días de la semana.',
    },
    {
      feature: t('comparison.row2Feature') || 'Atención Fuera de Horario (Noches y Fines de Semana)',
      without: t('comparison.row2Without') || 'Mensajes nocturnos sin atender hasta el día siguiente. Prospectos perdidos.',
      withAria: t('comparison.row2With') || 'Atención comercial activa 24/7. Responde fichas, precios y cualifica presupuestos sin pausas.',
    },
    {
      feature: t('comparison.row3Feature') || 'Cualificación y Agendamiento de Visitas',
      without: t('comparison.row3Without') || 'Decenas de mensajes de ida y vuelta para coordinar fecha y hora. Tiempo perdido.',
      withAria: t('comparison.row3With') || 'Aria cualifica el presupuesto del comprador y reserva la visita automáticamente en tu agenda.',
    },
    {
      feature: t('comparison.row4Feature') || 'Sincronización de Catálogo de Propiedades',
      without: t('comparison.row4Without') || 'Buscar fichas en PDFs o archivos a mano y copiar/pegar descripciones por WhatsApp.',
      withAria: t('comparison.row4With') || 'Conexión directa vía API Key con Tokko Broker y EasyBroker. Datos 100% reales y actualizados.',
    },
  ];

  return (
    <section className="py-20 bg-slate-950 text-white border-b border-white/10 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold">
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>{t('comparison.badge') || 'Comparativa de Impacto Comercial'}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            {t('comparison.title') || 'Sin Aria Prop vs. Con Aria Prop'}
          </h2>
          <p className="text-sm sm:text-base text-slate-300">
            {t('comparison.subtitle') || 'Descubrí la diferencia entre depender del tiempo manual y tener un asistente de ventas inmobiliarias respondiendo 24/7.'}
          </p>
        </div>

        {/* Comparison Table / Grid */}
        <div className="rounded-3xl bg-slate-900 border border-white/10 overflow-hidden shadow-2xl">
          
          {/* Table Column Headers */}
          <div className="grid grid-cols-1 md:grid-cols-12 bg-slate-950/80 border-b border-white/10 p-4 md:p-6 text-xs font-black uppercase tracking-wider">
            <div className="md:col-span-4 text-slate-400">Dimensión Comercial</div>
            <div className="md:col-span-4 text-rose-400 flex items-center gap-1.5 mt-2 md:mt-0">
              <X className="w-4 h-4 text-rose-500" />
              <span>Sin Aria Prop (Gestión Manual)</span>
            </div>
            <div className="md:col-span-4 text-emerald-400 flex items-center gap-1.5 mt-2 md:mt-0">
              <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
              <span>Con Aria Prop (IA 24/7)</span>
            </div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-white/5">
            {rows.map((row, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-12 p-5 md:p-6 gap-4 items-center hover:bg-white/[0.02] transition-colors">
                
                {/* Feature Column */}
                <div className="md:col-span-4 space-y-1">
                  <h4 className="text-sm font-extrabold text-white">{row.feature}</h4>
                </div>

                {/* Without Aria */}
                <div className="md:col-span-4 p-3.5 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-xs text-rose-200/90 leading-relaxed flex items-start gap-2.5">
                  <X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{row.without}</span>
                </div>

                {/* With Aria */}
                <div className="md:col-span-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-100 font-medium leading-relaxed flex items-start gap-2.5 shadow-sm">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 stroke-[3]" />
                  <span>{row.withAria}</span>
                </div>

              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
};

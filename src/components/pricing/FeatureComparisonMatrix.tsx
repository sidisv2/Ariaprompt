import React, { useState } from 'react';
import { Check, Minus, Sparkles, Zap, ShieldCheck, Building2, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

export const FeatureComparisonMatrix: React.FC = () => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    ai: true,
    rag: true,
    crm: true,
    security: true,
  });

  const toggleCategory = (catKey: string) => {
    setExpandedCategories((prev) => ({ ...prev, [catKey]: !prev[catKey] }));
  };

  const featureGroups = [
    {
      key: 'ai',
      title: '1. Motor de IA & Agentes Virtuales 24/7',
      items: [
        { name: 'Agentes Inmobiliarios de IA Activos 24/7', starter: '1 Agente', pro: 'Ilimitados', custom: 'Ilimitados Dedicados' },
        { name: 'Motor de Respuestas Aria AI Streaming', starter: true, pro: true, custom: true },
        { name: 'Personalización de Tono & Nombre de Agente', starter: true, pro: true, custom: true },
        { name: 'Prompt System Prompt a Medida', starter: false, pro: true, custom: true },
        { name: 'Fine-Tuning con Historial de Ventas', starter: false, pro: false, custom: true },
      ],
    },
    {
      key: 'rag',
      title: '2. RAG, Documentación PDF & Análisis de Inmuebles',
      items: [
        { name: 'Capacidad de Inmuebles en Catálogo RAG', starter: 'Hasta 50 Inmuebles', pro: 'Ilimitados', custom: 'Ilimitados' },
        { name: 'Lectura de Memorias de Calidades y Dossiers PDF', starter: true, pro: true, custom: true },
        { name: 'Lectura de Planos 2D / 3D y Planos de Planta', starter: false, pro: true, custom: true },
        { name: 'Evaluador de Rentabilidad Bruta (ROI / Cap Rate)', starter: false, pro: true, custom: true },
        { name: 'Búsqueda Semántica Vectorial Inmediata', starter: true, pro: true, custom: true },
      ],
    },
    {
      key: 'crm',
      title: '3. Cualificación de Leads, WhatsApp & CRM',
      items: [
        { name: 'Widget Web Embebible 100% Personalizable', starter: true, pro: true, custom: true },
        { name: 'Integración Directa con WhatsApp Business API', starter: true, pro: true, custom: true },
        { name: 'Lead Scoring Automático (Hot / Warm / Cold)', starter: true, pro: true, custom: true },
        { name: 'Agendamiento Directo a Google Calendar', starter: false, pro: true, custom: true },
        { name: 'Exportación a Salesforce, Hubspot & CRMs Locales', starter: false, pro: true, custom: true },
        { name: 'Webhooks & API REST Dedicada', starter: false, pro: false, custom: true },
      ],
    },
    {
      key: 'security',
      title: '4. Seguridad, SLA & Garantías Comerciales',
      items: [
        { name: 'Prueba Gratuita de 7 Días sin Tarjeta', starter: true, pro: true, custom: true },
        { name: 'Garantía de Devolución de 14 Días', starter: true, pro: true, custom: true },
        { name: 'Cancelación en 1 Clic Sin Permanencia', starter: true, pro: true, custom: true },
        { name: 'Cifrado de Datos Bancario SSL 256-bits', starter: true, pro: true, custom: true },
        { name: 'Garantía SLA de Disponibilidad del 99.9%', starter: false, pro: false, custom: true },
        { name: 'Gestor de Cuenta VIP Dedicado', starter: false, pro: false, custom: true },
      ],
    },
  ];

  const renderVal = (val: string | boolean) => {
    if (typeof val === 'boolean') {
      return val ? (
        <div className="w-5 h-5 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center mx-auto shadow-md shadow-emerald-400/20 font-black">
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        </div>
      ) : (
        <Minus className="w-4 h-4 text-slate-600 mx-auto" />
      );
    }
    return <span className="text-xs font-extrabold text-emerald-300">{val}</span>;
  };

  return (
    <div className="space-y-8 pt-8 border-t border-white/10 animate-page-fade">
      
      {/* Title */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Matriz de Comparación de Planes (Cloudairy Style)</span>
        </div>
        <h3 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          Compara todas las funcionalidades en detalle
        </h3>
        <p className="text-xs sm:text-sm text-slate-400">
          Transparencia total para que elijas la suscripción ideal para tu agencia o proyecto inmobiliario.
        </p>
      </div>

      {/* Comparison Table Card */}
      <div className="rounded-3xl bg-slate-900/90 border border-emerald-500/30 shadow-2xl overflow-hidden backdrop-blur-xl">
        
        {/* Table Header Row */}
        <div className="grid grid-cols-12 bg-slate-950/80 p-4 sm:p-6 border-b border-white/10 text-xs font-bold items-center sticky top-16 z-20 backdrop-blur-md">
          <div className="col-span-5 text-slate-200 uppercase tracking-wider">Funcionalidades</div>
          <div className="col-span-2 text-center text-slate-300">
            <span className="block text-sm font-extrabold text-white">Starter</span>
            <span className="text-[10px] text-emerald-400 font-mono">$19 / mes</span>
          </div>
          <div className="col-span-3 text-center bg-emerald-500/10 p-2 rounded-2xl border border-emerald-500/30 shadow-inner">
            <span className="text-[9px] font-black uppercase text-emerald-400 block tracking-wider">★ Más Popular</span>
            <span className="block text-sm font-black text-white">Pro Enterprise</span>
            <span className="text-[10px] text-emerald-300 font-mono">$39 / mes</span>
          </div>
          <div className="col-span-2 text-center text-slate-300">
            <span className="block text-sm font-extrabold text-white">Custom</span>
            <span className="text-[10px] text-cyan-400 font-mono">$59 / mes</span>
          </div>
        </div>

        {/* Categories & Items */}
        <div className="divide-y divide-white/5">
          {featureGroups.map((group) => {
            const isOpen = expandedCategories[group.key] ?? true;
            return (
              <div key={group.key} className="bg-slate-900/60">
                {/* Category Accordion Header */}
                <button
                  onClick={() => toggleCategory(group.key)}
                  className="w-full px-4 sm:px-6 py-4 flex items-center justify-between bg-slate-950/40 hover:bg-slate-950/70 text-left transition-colors cursor-pointer"
                >
                  <span className="text-xs sm:text-sm font-extrabold text-emerald-400 tracking-wide">
                    {group.title}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </button>

                {/* Items */}
                {isOpen && (
                  <div className="divide-y divide-white/5">
                    {group.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-12 px-4 sm:px-6 py-3.5 text-xs text-slate-300 items-center hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="col-span-5 font-medium pr-2 text-slate-200">{item.name}</div>
                        <div className="col-span-2 text-center">{renderVal(item.starter)}</div>
                        <div className="col-span-3 text-center bg-emerald-500/5 py-1.5 rounded-xl border border-emerald-500/10">
                          {renderVal(item.pro)}
                        </div>
                        <div className="col-span-2 text-center">{renderVal(item.custom)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
};

export default FeatureComparisonMatrix;

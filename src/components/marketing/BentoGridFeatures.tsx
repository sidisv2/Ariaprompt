import React from 'react';
import { 
  FileText, 
  Zap, 
  Flame, 
  ThermometerSnowflake, 
  ThermometerSun, 
  MessageSquare, 
  Layers, 
  Bot, 
  ShieldCheck, 
  Sparkles,
  Search,
  CheckCircle2
} from 'lucide-react';

export const BentoGridFeatures: React.FC = () => {
  return (
    <section className="py-20 bg-slate-950 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Arquitectura B2B Enterprise</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Diseñado para Convertir Visitas Web en <br />
            <span className="text-emerald-400">Contratos Firmados</span>
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Tu fuerza de ventas impulsada por inteligencia artificial generativa con acceso instantáneo a planos, catálogos y dossieres de calidades.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Respuesta Instantánea (<1s) - PDF/Excel RAG */}
          <div className="md:col-span-2 rounded-3xl bg-white/[0.03] backdrop-blur-sm border border-white/10 p-8 relative overflow-hidden group hover:border-emerald-500/30 transition-all flex flex-col justify-between">
            <div className="space-y-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                  Respuesta Instantánea (&lt;1s)
                </span>
                <span className="text-xs text-slate-400">Sincronización RAG</span>
              </div>
              <h3 className="text-xl font-bold text-white">
                La IA conoce todo tu inventario en PDF, Excel y Planos
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
                Sube las escrituras, listas de precios en Excel, planos en PDF o memorias de acabados de tus propiedades. La IA analiza el inventario en tiempo real para responder con precisión exacta sobre superficies, ubicaciones y precios en USD o moneda local.
              </p>
            </div>

            {/* Visual AI Graphic */}
            <div className="mt-8 p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Bot className="w-4 h-4" /> Aria Prop / RAG Motor IA
                </span>
                <span className="text-emerald-400 font-bold">Documentos Inyectados: 12 PDFs / Excel</span>
              </div>
              <div className="p-3 rounded-xl bg-black/30 border border-emerald-500/20 text-slate-300">
                <p className="text-emerald-400 font-semibold mb-1">🔍 Consulta del Cliente:</p>
                <p className="italic">"¿El departamento en Polanco incluye estacionamiento de visitas y cuál es la cuota de mantenimiento?"</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200">
                <p className="font-semibold text-emerald-400 mb-1">⚡ Respuesta Instantánea (0.6s):</p>
                <p>"Sí. Cuenta con 3 cajones de estacionamiento subterráneos y valet parking para visitas. La cuota mensual es de $4,200 MXN."</p>
              </div>
            </div>
          </div>

          {/* Card 2: Lead Scoring Automático */}
          <div className="rounded-3xl bg-white/[0.03] backdrop-blur-sm border border-white/10 p-8 flex flex-col justify-between hover:border-emerald-500/30 transition-all">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Lead Scoring Automático</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Clasifica automáticamente a los compradores en "Calientes" (con presupuesto inmediato) o "Fríos" para priorizar tu fuerza de ventas.
              </p>
            </div>

            <div className="mt-6 space-y-2.5">
              <div className="p-3 rounded-xl bg-black/40 border border-red-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-bold text-white">Lead Caliente (Hot)</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300">Score 95/100</span>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-amber-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ThermometerSun className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-white">Lead Tibio (Warm)</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">Score 68/100</span>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-blue-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ThermometerSnowflake className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-bold text-white">Lead Frío (Cold)</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300">Score 35/100</span>
              </div>
            </div>
          </div>

          {/* Card 3: Instalación en 2 Minutos */}
          <div className="md:col-span-3 rounded-3xl bg-white/[0.03] backdrop-blur-sm border border-white/10 p-8 flex flex-col sm:flex-row items-center justify-between gap-6 hover:border-emerald-500/30 transition-all">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-semibold">
                <Zap className="w-3.5 h-3.5" />
                <span>Instalación en 2 Minutos</span>
              </div>
              <h3 className="text-2xl font-bold text-white">
                Un solo script listo para copiar y pegar
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Compatible al 100% con WordPress, Wix, Webflow, Idealista, TocToc, Properati o sitios en HTML puro. Pégalo antes de la etiqueta <code className="text-emerald-400 font-mono bg-black/40 px-1.5 py-0.5 rounded border border-white/10">&lt;/body&gt;</code> y empieza a recibir leands calientes de inmediato.
              </p>
            </div>

            <div className="w-full sm:w-auto p-4 rounded-2xl bg-black/50 border border-emerald-500/30 space-y-2 text-left font-mono text-xs shrink-0">
              <div className="flex items-center justify-between text-slate-400 text-[10px] pb-2 border-b border-white/5">
                <span>aria-widget.js</span>
                <span className="text-emerald-400 font-bold">1 Clic</span>
              </div>
              <code className="text-emerald-400 block break-all text-[11px]">
                &lt;script src="https://ariaprop.ai/aria-widget.js" data-agent="agencia-latam"&gt;&lt;/script&gt;
              </code>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

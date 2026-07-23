import React, { useState } from 'react';
import { AppRoute } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  Check,
  Sparkles,
  Zap,
  Building2,
  ShieldCheck,
  ArrowRight,
  CreditCard,
  ChevronRight,
  HelpCircle
} from 'lucide-react';

interface MobilePricingSectionProps {
  onRouteChange: (route: AppRoute) => void;
}

export const MobilePricingSection: React.FC<MobilePricingSectionProps> = ({ onRouteChange }) => {
  const { requireAuthForPayment } = useAuth();
  const [isAnnual, setIsAnnual] = useState(true);
  const [activeCardIndex, setActiveCardIndex] = useState(1); // 0: basico, 1: pro (recommended), 2: enterprise

  const handlePlanSelection = (planId: string) => {
    requireAuthForPayment({
      planId,
      targetRoute: 'dashboard-checkout',
    });
  };

  return (
    <section className="py-8 px-4 space-y-6">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Planes Adaptados a LATAM</span>
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight">
          Suscripciones Inmobiliarias
        </h2>
        <p className="text-xs text-slate-400 max-w-xs mx-auto">
          Prueba 7 días gratis. Cancela en cualquier momento sin compromisos.
        </p>

        {/* Toggle Billing */}
        <div className="pt-2 flex items-center justify-center gap-2">
          <span className={`text-xs ${!isAnnual ? 'text-white font-bold' : 'text-slate-400'}`}>Mensual</span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="w-12 h-6 rounded-full bg-slate-800 p-1 border border-white/10 relative transition-colors cursor-pointer"
          >
            <div
              className={`w-4 h-4 rounded-full bg-emerald-400 transition-transform ${
                isAnnual ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
          <span className={`text-xs ${isAnnual ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
            Anual <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded-full text-emerald-300">-20%</span>
          </span>
        </div>
      </div>

      {/* Swipeable Horizontal Cards Container */}
      <div className="space-y-3">
        <div 
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none gap-4 pb-2 pt-1"
          onScroll={(e) => {
            const container = e.currentTarget;
            const scrollPos = container.scrollLeft;
            const cardWidth = container.clientWidth * 0.85;
            const index = Math.round(scrollPos / cardWidth);
            if (index >= 0 && index <= 2) setActiveCardIndex(index);
          }}
        >
          {/* Card 1: Básico */}
          <div className="snap-center shrink-0 w-[85vw] max-w-xs bg-slate-900 border border-white/10 rounded-3xl p-5 space-y-4 flex flex-col justify-between shadow-xl">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase text-slate-400">Básico</span>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-300 font-semibold">1 Agente IA</span>
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">${isAnnual ? 19 : 24}</span>
                  <span className="text-xs text-slate-400">/mes</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Ideal para corredores independientes.</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-white/5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center shrink-0 font-bold">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>Hasta 50 inmuebles en catálogo</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center shrink-0 font-bold">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>Atención WhatsApp & Web Widget</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center shrink-0 font-bold">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>Calificación automática de leads</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handlePlanSelection('basico')}
              className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-white font-bold text-xs border border-white/10 transition-all active:scale-95 cursor-pointer"
            >
              Probar Plan Básico
            </button>
          </div>

          {/* Card 2: Profesional (Recomendado) */}
          <div className="snap-center shrink-0 w-[85vw] max-w-xs bg-slate-900 border-2 border-emerald-500 rounded-3xl p-5 space-y-4 flex flex-col justify-between shadow-2xl shadow-emerald-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-gradient-to-l from-emerald-500 to-teal-400 text-slate-950 font-black text-[9px] px-3 py-1 rounded-bl-xl uppercase tracking-wider">
              Popular LATAM
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase text-emerald-400">Profesional</span>
                <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-full text-emerald-300 font-semibold">3 Agentes IA</span>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">${isAnnual ? 39 : 49}</span>
                  <span className="text-xs text-slate-400">/mes</span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1">Para inmobiliarias en crecimiento.</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-emerald-500/20 text-xs text-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center shrink-0 font-bold">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>Inmuebles e inventario ilimitado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center shrink-0 font-bold">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>RAG con fotos y fichas PDF</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center shrink-0 font-bold">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>Agendamiento directo a Google Calendar</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center shrink-0 font-bold">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>Soporte prioritario 24/7</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handlePlanSelection('profesional')}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 active:scale-95 transition-transform cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Suscribirme Ahora</span>
            </button>
          </div>

          {/* Card 3: Enterprise */}
          <div className="snap-center shrink-0 w-[85vw] max-w-xs bg-slate-900 border border-white/10 rounded-3xl p-5 space-y-4 flex flex-col justify-between shadow-xl">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase text-slate-400">Enterprise</span>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-300 font-semibold">Ilimitado</span>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">${isAnnual ? 59 : 69}</span>
                  <span className="text-xs text-slate-400">/mes</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Para grandes desarrolladoras e inmobiliarias.</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-white/5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center shrink-0 font-bold">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>Múltiples sucursales y agentes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center shrink-0 font-bold">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>Integración CRM personalizada</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center shrink-0 font-bold">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>Acompañamiento en la puesta en marcha</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handlePlanSelection('enterprise')}
              className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-white font-bold text-xs border border-white/10 transition-all active:scale-95 cursor-pointer"
            >
              Contactar Plan Enterprise
            </button>
          </div>
        </div>

        {/* Carousel Dots */}
        <div className="flex justify-center items-center gap-2">
          {[0, 1, 2].map((idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all ${
                activeCardIndex === idx ? 'w-6 bg-emerald-400' : 'w-2 bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Payment Gateways Info Banner */}
      <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 text-center space-y-2">
        <p className="text-xs font-bold text-white">Aceptamos pasarelas locales en LATAM:</p>
        <div className="flex flex-wrap justify-center items-center gap-2 text-[10px] text-slate-300">
          <span className="px-2 py-1 rounded bg-slate-800 border border-white/5">💳 Tarjeta</span>
          <span className="px-2 py-1 rounded bg-sky-500/10 border border-sky-500/20 text-sky-300">Mercado Pago</span>
          <span className="px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300">PayPal</span>
          <span className="px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300">SPEI / PSE</span>
          <span className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">Binance Pay</span>
        </div>
      </div>

    </section>
  );
};

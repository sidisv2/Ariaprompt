import React, { useState } from 'react';
import { Sparkles, Link2, CheckCircle2, ArrowRight, Building2, Bot, ShieldCheck } from 'lucide-react';
import { AppRoute } from '../../types';

interface CrmOnboardingModalProps {
  onClose: () => void;
  onRouteChange: (route: AppRoute) => void;
}

export const CrmOnboardingModal: React.FC<CrmOnboardingModalProps> = ({ onClose, onRouteChange }) => {
  const [step, setStep] = useState<1 | 2>(1);

  const handleFinishAndConnect = () => {
    localStorage.setItem('aria_onboarding_completed', 'true');
    onClose();
    onRouteChange('dashboard-integrations');
  };

  const handleSkip = () => {
    localStorage.setItem('aria_onboarding_completed', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative overflow-hidden animate-scale-up">
        
        {/* Ambient glow background */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 blur-3xl pointer-events-none" />

        {/* Step Indicator Pills */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-xs border border-emerald-500/30">
              Paso {step} de 2
            </span>
            <span className="text-xs text-slate-400 font-semibold">Configuración de Bienvenido</span>
          </div>

          <button
            onClick={handleSkip}
            className="text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Hacerlo más tarde
          </button>
        </div>

        {/* Step 1: Welcome & Assistant Overview */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black">
              <Bot className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white tracking-tight">
                ¡Bienvenido a Aria Prop! 🤖
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Tu Workspace de Inteligencia Inmobiliaria está listo. Tu <strong>Asistente IA 24/7</strong> atiende prospectos en WhatsApp y Web, responde consultas técnicas sobre inmuebles y agenda visitas directo en Google Calendar.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-white/5 space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Atención automática las 24 hs del día</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Cualificación inteligente de presupuesto y urgencia</span>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end">
              <button
                onClick={() => setStep(2)}
                className="w-full py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Siguiente: Conectar Mi CRM</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: CRM Connection Highlight */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 font-black">
              <Link2 className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white tracking-tight">
                Sincronizá tu Catálogo Real 🏘️
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Para que Aria responda con tus propiedades y precios reales de forma 100% verificada, conectá tu cuenta de <strong>Tokko Broker</strong> o <strong>EasyBroker</strong> con tu API Key.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-white/5 space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2 text-teal-400 font-bold">
                <Building2 className="w-4 h-4" />
                <span>Importación automática en menos de 1 minuto</span>
              </div>
              <div className="flex items-center gap-2 text-teal-400 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Sello transparente "Sincronizado desde CRM"</span>
              </div>
            </div>

            <div className="pt-4 flex items-center gap-3">
              <button
                onClick={handleSkip}
                className="w-1/3 py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Más tarde
              </button>
              <button
                onClick={handleFinishAndConnect}
                className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-black text-xs shadow-lg shadow-teal-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Link2 className="w-4 h-4" />
                <span>Conectar Tokko / EasyBroker</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

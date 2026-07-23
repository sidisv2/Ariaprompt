import React, { useState } from 'react';
import { InteractiveSandboxWidget } from './InteractiveSandboxWidget';
import { TwitterActionCard } from './TwitterActionCard';
import { Property, AppRoute } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, ArrowRight, CheckCircle2, ShieldCheck, Zap, MessageSquare, Mail, Star } from 'lucide-react';

interface HeroSectionProps {
  sampleProperties: Property[];
  onRouteChange: (route: AppRoute) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ sampleProperties, onRouteChange }) => {
  const { openAuthModal, requireAuthForPayment } = useAuth();
  const [emailInput, setEmailInput] = useState('');

  const handleStartFreeTrial = () => {
    const passed = requireAuthForPayment({
      planId: 'pro',
      targetRoute: 'dashboard-checkout',
    });
    if (!passed) {
      openAuthModal('signup', 'pro', 'dashboard-checkout');
    }
  };

  const handleEmailSignup = () => {
    openAuthModal('signup', 'pro', 'dashboard-checkout');
  };

  return (
    <section className="relative pt-24 sm:pt-28 lg:pt-32 pb-20 overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      
      {/* Background glow & grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-radial-gradient blur-3xl opacity-60 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Hero Headline & Value Proposition */}
          <div className="lg:col-span-7 space-y-6 text-left">
            
            {/* Top Shiny Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-xs font-bold text-emerald-300">Aria Prop: Agente de IA Inmobiliario 24/7 en Línea</span>
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            </div>

            {/* Impact Title (Cloudairy Style) */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
              Plataforma Todo en Uno <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                con IA Inmobiliaria
              </span>.
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl font-normal">
              Atiende dudas sobre precios, ubicación y planos 24/7. Cualifica a los compradores, evalúa rentabilidades y agenda llamadas en automático.
            </p>

            {/* Cloudairy Social Proof Rating */}
            <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
              <span>Más de <strong>50.000</strong> prospectos atendidos con</span>
              <div className="flex items-center text-amber-400">
                <Star className="w-3.5 h-3.5 fill-current" />
                <Star className="w-3.5 h-3.5 fill-current" />
                <Star className="w-3.5 h-3.5 fill-current" />
                <Star className="w-3.5 h-3.5 fill-current" />
                <Star className="w-3.5 h-3.5 fill-current" />
              </div>
            </div>

            {/* Cloudairy-Style Floating Email Input Bar */}
            <div className="pt-2">
              <div className="flex flex-col sm:flex-row items-center gap-2 p-2 rounded-2xl bg-slate-900 border border-emerald-400/40 shadow-2xl backdrop-blur-xl max-w-lg">
                <div className="flex items-center gap-2.5 px-3 flex-1 w-full">
                  <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleEmailSignup()}
                    placeholder="Ingresa tu correo electrónico"
                    className="w-full bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none py-2 font-medium"
                  />
                </div>
                <button
                  onClick={handleEmailSignup}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-black text-xs shadow-lg shadow-emerald-400/30 transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                >
                  <span className="text-slate-950 font-black">Regístrate gratis</span>
                  <ArrowRight className="w-4 h-4 text-slate-950 stroke-[3]" />
                </button>
              </div>
            </div>

            {/* Secondary CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={handleStartFreeTrial}
                className="px-5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-200 font-bold text-xs border border-white/10 hover:border-emerald-500/40 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>Probar 7 Días Gratis</span>
              </button>

              <button
                onClick={() => onRouteChange('embed-preview')}
                className="px-5 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white font-semibold text-xs border border-white/10 hover:border-emerald-500/40 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ver Widget Embebible</span>
              </button>
            </div>

            {/* Key Trust Checkmarks */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-white/10 text-xs text-slate-200 font-medium">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-400/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span>RAG con Dossier PDF y Planos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-400/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span>Lead Scoring Automático</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-400/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span>Agendamiento de Visitas</span>
              </div>
            </div>

          </div>

          {/* Right Column: Interactive Live Widget Sandbox */}
          <div className="lg:col-span-5 relative space-y-4">
            <TwitterActionCard />
            <div className="relative">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-500 opacity-20 blur-xl"></div>
              <InteractiveSandboxWidget sampleProperties={sampleProperties} />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

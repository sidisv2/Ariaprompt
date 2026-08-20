import React, { useState } from 'react';
import { HeroPromptAssistant } from './HeroPromptAssistant';
import { FlowDemoSequence } from './FlowDemoSequence';
import { Property, AppRoute } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Sparkles, ArrowRight, CheckCircle2, Zap, MessageSquare, Loader2 } from 'lucide-react';

interface HeroSectionProps {
  sampleProperties: Property[];
  onRouteChange: (route: AppRoute) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ sampleProperties, onRouteChange }) => {
  const { user, loading, openAuthModal, requireAuthForPayment, signInAsDemoUser } = useAuth();
  const { t } = useLanguage();
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);

  const isUserLoggedInOrLoading = Boolean(
    loading ||
      user ||
      (user &&
        (user.isOwner ||
          user.isAdmin ||
          user.email?.toLowerCase().trim() === 'valentinlautaromorales@gmail.com'))
  );

  const handleStartFreeTrial = () => {
    const passed = requireAuthForPayment({
      planId: 'pro',
      targetRoute: 'dashboard-checkout',
    });
    if (!passed) {
      openAuthModal('signup', 'pro', 'dashboard-checkout');
    }
  };

  const handleDirectDemoAccess = async () => {
    setDemoLoading(true);
    setDemoError(null);
    try {
      const res = await signInAsDemoUser();
      if (res.success) {
        onRouteChange('dashboard-metrics');
      } else {
        setDemoError(res.error || 'Hubo un error al iniciar la demostración en vivo. Intenta de nuevo.');
      }
    } catch (err: any) {
      setDemoError(err?.message || 'Error inesperado al conectar.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <section className="relative overflow-hidden pt-6 pb-16 lg:pt-10 lg:pb-24 bg-slate-950">
      {/* Background radial gradient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-10">
        
        {/* Main Hero Header */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-bold tracking-wide uppercase shadow-lg shadow-emerald-500/10">
            <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>{t('hero.badge')}</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1]">
            {t('hero.title1')}{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">
              {t('hero.title2')}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-slate-300 text-base sm:text-xl max-w-2xl mx-auto leading-relaxed">
            {t('hero.subtitle')}
          </p>

          {/* High-Impact CTA Group */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            {isUserLoggedInOrLoading ? (
              <button
                onClick={() => onRouteChange('dashboard-metrics')}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-105"
              >
                <Sparkles className="w-4 h-4 fill-slate-950 text-slate-950" />
                <span>Ir a Mi Panel / Dashboard ➔</span>
              </button>
            ) : (
              <button
                onClick={() => onRouteChange('app')}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-105"
              >
                <Sparkles className="w-4 h-4 fill-slate-950 text-slate-950" />
                <span>Probar Gratis (3 Consultas) ➔</span>
              </button>
            )}

            {!isUserLoggedInOrLoading && (
              <button
                onClick={handleDirectDemoAccess}
                disabled={demoLoading}
                className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 font-extrabold text-sm border border-slate-200 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-105 disabled:opacity-50"
              >
                {demoLoading ? <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> : <Zap className="w-4 h-4 text-indigo-600" />}
                <span>{demoLoading ? 'Iniciando Demostración...' : t('hero.ctaSecondary')}</span>
              </button>
            )}
          </div>

          {/* Visible Error Feedback if Direct Demo Access Fails */}
          {demoError && (
            <div className="max-w-md mx-auto p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold animate-fadeIn">
              ⚠️ {demoError}
            </div>
          )}

          {/* Trust Bullet Strip (Only rendered for non-logged-in visitors) */}
          {!isUserLoggedInOrLoading && (
            <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-semibold">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Sin tarjeta de crédito requerida</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Respuesta en tiempo real</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Configuración en 3 minutos</span>
              </div>
            </div>
          )}     
        </div>

        {/* Interactive Prompt Box Assistant Widget */}
        <div className="pt-4">
          <HeroPromptAssistant onStartDemo={handleStartFreeTrial} />
        </div>

        {/* Short Animated Sequence Flow Demo (10-15s Loop) */}
        <div className="pt-6">
          <FlowDemoSequence />
        </div>

      </div>
    </section>
  );
};

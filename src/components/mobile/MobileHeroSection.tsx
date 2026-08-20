import React, { useState } from 'react';
import { Property, AppRoute } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Sparkles, ArrowRight, ShieldCheck, Zap, MessageSquare, Building2, Play, Loader2 } from 'lucide-react';
import { TwitterActionCard } from '../marketing/TwitterActionCard';
import { InteractiveSandboxWidget } from '../marketing/InteractiveSandboxWidget';
import { HeroPromptAssistant } from '../marketing/HeroPromptAssistant';

interface MobileHeroSectionProps {
  sampleProperties: Property[];
  onRouteChange: (route: AppRoute) => void;
}

export const MobileHeroSection: React.FC<MobileHeroSectionProps> = ({ sampleProperties, onRouteChange }) => {
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

  const handleStartTrial = () => {
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
        setDemoError(res.error || 'Error al iniciar la demo.');
      }
    } catch (err: any) {
      setDemoError(err?.message || 'Error al conectar.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-center pt-2">
      {/* Top Badge */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-wider shadow-sm">
        <Sparkles className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
        <span>{t('hero.badge')}</span>
      </div>

      {/* Headline */}
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-white leading-tight tracking-tight">
          {t('hero.title1')}{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400">
            {t('hero.title2')}
          </span>.
        </h1>
        <p className="text-xs text-slate-300 leading-relaxed px-2">
          {t('hero.subtitle')}
        </p>
      </div>

      {/* Cloudairy Prompt Assistant Widget */}
      <div className="py-2">
        <HeroPromptAssistant onStartDemo={handleStartTrial} />
      </div>

      {/* Action Buttons */}
      <div className="space-y-2.5 pt-1">
        {isUserLoggedInOrLoading ? (
          <button
            onClick={() => onRouteChange('dashboard-metrics')}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 active:scale-98 transition-transform flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 fill-slate-950 text-slate-950" />
            <span>Ir a Mi Panel / Dashboard ➔</span>
          </button>
        ) : (
          <button
            onClick={() => onRouteChange('app')}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 active:scale-98 transition-transform flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 fill-slate-950 text-slate-950" />
            <span>Probar Gratis (3 Consultas) ➔</span>
          </button>
        )}

        {!isUserLoggedInOrLoading && (
          <button
            onClick={handleDirectDemoAccess}
            disabled={demoLoading}
            className="w-full py-3 px-4 rounded-xl bg-white text-slate-900 font-extrabold text-xs border border-slate-200 shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {demoLoading ? <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> : <Zap className="w-4 h-4 text-indigo-600" />}
            <span>{demoLoading ? 'Iniciando Demostración...' : t('hero.ctaSecondary')}</span>
          </button>
        )}

        {demoError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold animate-fadeIn text-center">
            ⚠️ {demoError}
          </div>
        )}
      </div>

      {/* Twitter Action Card + Interactive Chat */}
      <div className="space-y-3 pt-2">
        <TwitterActionCard />
        <InteractiveSandboxWidget sampleProperties={sampleProperties} />
      </div>

      {/* Quick Mobile Stats Strip */}
      <div className="grid grid-cols-3 gap-2 bg-slate-900/90 border border-white/10 rounded-2xl p-3 text-center">
        <div>
          <p className="text-base font-black text-emerald-400">0 seg</p>
          <p className="text-[9px] text-slate-400">Demora en Respuesta</p>
        </div>
        <div className="border-x border-white/10">
          <p className="text-base font-black text-teal-300">&lt; 5 seg</p>
          <p className="text-[9px] text-slate-400">Respuesta RAG</p>
        </div>
        <div>
          <p className="text-base font-black text-emerald-400">24 / 7</p>
          <p className="text-[9px] text-slate-400">Atención Activa</p>
        </div>
      </div>

      {/* Property Cards Mobile Preview */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white">Inventario RAG Activo:</span>
          <button
            onClick={() => onRouteChange('dashboard-properties')}
            className="text-[11px] text-emerald-400 font-bold flex items-center gap-0.5"
          >
            <span>Ver todo ({sampleProperties.length})</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-none snap-x snap-mandatory">
          {sampleProperties.slice(0, 3).map((prop) => (
            <div
              key={prop.id}
              className="snap-center shrink-0 w-60 bg-slate-900 border border-white/10 rounded-2xl p-2.5 space-y-2"
            >
              <img
                src={prop.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=500&auto=format&fit=crop&q=60'}
                alt={prop.title}
                className="w-full h-28 object-cover rounded-xl"
              />
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">{prop.type}</span>
                <p className="text-xs font-bold text-white truncate">{prop.title}</p>
                <p className="text-[11px] text-slate-400 truncate">{prop.location.address}, {prop.location.city}</p>
                <p className="text-xs font-black text-white mt-1">
                  ${prop.price.toLocaleString()} <span className="text-[9px] text-slate-400 font-normal">USD</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const FinalCtaSection: React.FC = () => {
  const { openAuthModal } = useAuth();
  const { t } = useLanguage();

  return (
    <section className="py-24 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 text-white border-t border-white/10 relative overflow-hidden text-center">
      
      {/* Glow Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-500/15 blur-3xl rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8">
        
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/10">
          <Sparkles className="w-4 h-4 fill-current" />
          <span>{t('cta.badge')}</span>
        </div>

        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15]">
          {t('cta.title1')} <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-300 bg-clip-text text-transparent">
            {t('cta.title2')}
          </span>?
        </h2>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
          {t('cta.subtitle')}
        </p>

        {/* CTAs Group */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={() => openAuthModal('signup', 'pro', 'dashboard-checkout')}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm shadow-2xl shadow-emerald-500/30 transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-105"
          >
            <Sparkles className="w-4 h-4 fill-slate-950 text-slate-950" />
            <span>{t('cta.primary')}</span>
            <ArrowRight className="w-4 h-4 text-slate-950 stroke-[3]" />
          </button>

          <button
            onClick={() => openAuthModal('signup', 'custom', 'dashboard-checkout')}
            className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-extrabold text-sm border border-white/15 hover:border-indigo-400 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-105"
          >
            <Zap className="w-4 h-4 text-indigo-400" />
            <span>{t('cta.secondary')}</span>
          </button>
        </div>

        {/* Guarantees */}
        <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{t('cta.trust1')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{t('cta.trust2')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{t('cta.trust3')}</span>
          </div>
        </div>

      </div>
    </section>
  );
};

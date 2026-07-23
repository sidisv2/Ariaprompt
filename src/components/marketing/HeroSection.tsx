import React from 'react';
import { HeroPromptAssistant } from './HeroPromptAssistant';
import { Property, AppRoute } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Sparkles, ArrowRight, CheckCircle2, Zap, MessageSquare, Star } from 'lucide-react';

interface HeroSectionProps {
  sampleProperties: Property[];
  onRouteChange: (route: AppRoute) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ sampleProperties, onRouteChange }) => {
  const { openAuthModal, requireAuthForPayment } = useAuth();
  const { t } = useLanguage();

  const handleStartFreeTrial = () => {
    const passed = requireAuthForPayment({
      planId: 'pro',
      targetRoute: 'dashboard-checkout',
    });
    if (!passed) {
      openAuthModal('signup', 'pro', 'dashboard-checkout');
    }
  };

  return (
    <section className="relative pt-24 sm:pt-28 lg:pt-32 pb-20 overflow-hidden bg-slate-50 text-slate-900 border-b border-slate-200/80">
      
      {/* Light subtle background glow & grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Centered Hero Header (Cloudairy Style) */}
        <div className="text-center max-w-4xl mx-auto space-y-6 mb-10">
          
          {/* Top Shiny Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-indigo-200 shadow-sm shadow-indigo-500/10">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-xs font-extrabold text-indigo-950">{t('hero.badge')}</span>
            <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
          </div>

          {/* Impact Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.1]">
            {t('hero.title1')} <br />
            <span className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-teal-600 bg-clip-text text-transparent">
              {t('hero.title2')}
            </span>.
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
            {t('hero.subtitle')}
          </p>

          {/* Social Proof Rating */}
          <div className="flex items-center justify-center gap-2 text-xs text-slate-600 font-medium pt-1">
            <span>{t('hero.socialProof')}</span>
            <div className="flex items-center text-amber-400">
              <Star className="w-3.5 h-3.5 fill-current" />
              <Star className="w-3.5 h-3.5 fill-current" />
              <Star className="w-3.5 h-3.5 fill-current" />
              <Star className="w-3.5 h-3.5 fill-current" />
              <Star className="w-3.5 h-3.5 fill-current" />
            </div>
          </div>
        </div>

        {/* Cloudairy Interactive Prompt Box Assistant Widget */}
        <div className="mb-10">
          <HeroPromptAssistant onStartDemo={handleStartFreeTrial} />
        </div>

        {/* 2 Main Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={handleStartFreeTrial}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-105"
          >
            <Sparkles className="w-4 h-4 fill-slate-950 text-slate-950" />
            <span>{t('hero.ctaPrimary')}</span>
            <ArrowRight className="w-4 h-4 text-slate-950 stroke-[3]" />
          </button>

          <button
            onClick={() => {
              const el = document.getElementById('how-it-works');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
              else onRouteChange('soluciones');
            }}
            className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 font-extrabold text-sm border border-slate-200 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-105"
          >
            <Zap className="w-4 h-4 text-indigo-600" />
            <span>{t('hero.ctaSecondary')}</span>
          </button>
        </div>

        {/* Trust Bullet Strip */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-semibold">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{t('hero.trust1')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{t('hero.trust2')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{t('hero.trust3')}</span>
          </div>
        </div>

      </div>
    </section>
  );
};

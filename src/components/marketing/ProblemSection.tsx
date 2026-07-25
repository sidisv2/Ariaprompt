import React from 'react';
import { Clock, AlertTriangle, MessageSquareOff, TrendingDown, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const ProblemSection: React.FC = () => {
  const { openAuthModal } = useAuth();
  const { t } = useLanguage();

  const problems = [
    {
      icon: <Clock className="w-6 h-6 text-rose-600" />,
      tag: t('problem.card1Tag'),
      title: t('problem.card1Title'),
      description: t('problem.card1Desc'),
    },
    {
      icon: <TrendingDown className="w-6 h-6 text-amber-600" />,
      tag: t('problem.card2Tag'),
      title: t('problem.card2Title'),
      description: t('problem.card2Desc'),
    },
    {
      icon: <MessageSquareOff className="w-6 h-6 text-indigo-600" />,
      tag: t('problem.card3Tag'),
      title: t('problem.card3Title'),
      description: t('problem.card3Desc'),
    },
  ];

  return (
    <section className="py-20 bg-slate-900 border-b border-white/10 relative overflow-hidden text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-extrabold uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>{t('problem.badge')}</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            {t('problem.title')}
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            {t('problem.subtitle')}
          </p>
        </div>

        {/* 3 Problem Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {problems.map((p, idx) => (
            <div
              key={idx}
              className="p-7 rounded-3xl bg-slate-950 border border-white/10 hover:border-rose-500/40 transition-all duration-300 shadow-xl flex flex-col justify-between space-y-6 group hover:-translate-y-1"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 group-hover:bg-rose-500/20 transition-colors">
                    {p.icon}
                  </div>
                  <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-slate-900 text-slate-300 border border-white/10">
                    {p.tag}
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-white leading-snug">{p.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{p.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Section Action CTA */}
        <div className="mt-12 text-center">
          <button
            onClick={() => openAuthModal('signup', 'pro', 'dashboard-checkout')}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer hover:scale-105"
          >
            <span>{t('problem.cta')}</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

      </div>
    </section>
  );
};

import React from 'react';
import { MessageSquare, Bot, CalendarCheck, Award, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const HowItWorksSection: React.FC = () => {
  const { openAuthModal } = useAuth();
  const { t } = useLanguage();

  const steps = [
    {
      step: '01',
      icon: <MessageSquare className="w-6 h-6 text-indigo-600" />,
      title: t('how.step1Title'),
      description: t('how.step1Desc'),
    },
    {
      step: '02',
      icon: <Bot className="w-6 h-6 text-teal-600" />,
      title: t('how.step2Title'),
      description: t('how.step2Desc'),
    },
    {
      step: '03',
      icon: <CalendarCheck className="w-6 h-6 text-cyan-600" />,
      title: t('how.step3Title'),
      description: t('how.step3Desc'),
    },
    {
      step: '04',
      icon: <Award className="w-6 h-6 text-amber-600" />,
      title: t('how.step4Title'),
      description: t('how.step4Desc'),
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-white border-b border-slate-200/80 relative overflow-hidden text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-extrabold uppercase tracking-wider">
            <Bot className="w-4 h-4" />
            <span>{t('how.badge')}</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            {t('how.title')}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            {t('how.subtitle')}
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 hover:border-indigo-300 transition-all duration-300 shadow-md hover:shadow-xl flex flex-col justify-between space-y-5 relative group hover:scale-[1.02]"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                    {s.step}
                  </span>
                  <div className="p-2.5 rounded-2xl bg-white border border-slate-200/80 group-hover:border-indigo-300 transition-colors shadow-sm">
                    {s.icon}
                  </div>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 leading-snug">{s.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{s.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Strategic CTA */}
        <div className="mt-12 text-center">
          <button
            onClick={() => openAuthModal('signup', 'pro', 'dashboard-checkout')}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-xl shadow-emerald-500/20 transition-all cursor-pointer hover:scale-105"
          >
            <span>{t('how.cta')}</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

      </div>
    </section>
  );
};

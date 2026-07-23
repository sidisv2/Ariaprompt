import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { AppRoute } from '../../types';
import { Calculator, TrendingUp, Clock, AlertTriangle, Sparkles, CheckCircle2, ArrowRight, DollarSign } from 'lucide-react';

interface RoiSavingsCalculatorSectionProps {
  onRouteChange?: (route: AppRoute) => void;
}

export const RoiSavingsCalculatorSection: React.FC<RoiSavingsCalculatorSectionProps> = ({ onRouteChange }) => {
  const { lang, t } = useLanguage();
  const { openAuthModal } = useAuth();

  const [monthlyLeads, setMonthlyLeads] = useState<number>(150);
  const [scheduleType, setScheduleType] = useState<'business_hours' | 'partial' | '247_human'>('business_hours');
  const [avgCommissionUsd, setAvgCommissionUsd] = useState<number>(3500);

  // Simple, transparent math
  let afterHoursLossRate = 0.60;
  if (scheduleType === 'partial') afterHoursLossRate = 0.35;
  if (scheduleType === '247_human') afterHoursLossRate = 0.15;

  const lostLeadsMonthly = Math.round(monthlyLeads * afterHoursLossRate);
  const recoveredToursMonthly = Math.round(lostLeadsMonthly * 0.45);
  const potentialClosedDeals = Math.max(1, Math.round(recoveredToursMonthly * 0.12));
  const lostCommissionUsd = potentialClosedDeals * avgCommissionUsd;
  const estimatedRoiMultiplier = Math.round((lostCommissionUsd / 299) * 10) / 10;

  return (
    <section className="py-20 bg-slate-950 text-white relative overflow-hidden border-t border-white/10">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-emerald-500/10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Calculator className="w-4 h-4" />
            <span>{lang === 'es' ? 'Calculadora Interactiva de Impacto' : 'Interactive Impact Calculator'}</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            {lang === 'es' ? '¿Cuánto estás' : 'How much revenue are you'}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400">
              {lang === 'es' ? 'perdiendo hoy' : 'losing today'}
            </span>{' '}
            {lang === 'es' ? 'por no responder en < 5s?' : 'by not replying in < 5s?'}
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            {lang === 'es'
              ? 'Ajusta tus métricas de captación actual y descubre cuántas comisiones y visitas agendadas estás dejando en manos de la competencia.'
              : 'Adjust your current lead generation metrics and calculate how many tours and commissions you are leaving behind.'}
          </p>
        </div>

        {/* Calculator Card Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Controls Column (Left) */}
          <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-white/10 space-y-6 backdrop-blur-xl shadow-2xl flex flex-col justify-between">
            
            {/* Control 1: Monthly Leads */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold uppercase text-slate-300 tracking-wider">
                  1. {lang === 'es' ? 'Leads Inmobiliarios Mensuales' : 'Monthly Real Estate Leads'}
                </label>
                <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-black text-sm">
                  {monthlyLeads.toLocaleString('en-US')} leads/mes
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="1000"
                step="10"
                value={monthlyLeads}
                onChange={(e) => setMonthlyLeads(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                <span>20 leads</span>
                <span>500 leads</span>
                <span>1,000+ leads</span>
              </div>
            </div>

            {/* Control 2: Current Schedule */}
            <div className="space-y-3">
              <label className="text-xs font-extrabold uppercase text-slate-300 tracking-wider block">
                2. {lang === 'es' ? 'Horario de Atención Comercial Actual' : 'Current Sales Hours'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setScheduleType('business_hours')}
                  className={`p-3 rounded-2xl text-left border text-xs font-bold transition-all cursor-pointer ${
                    scheduleType === 'business_hours'
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-1 ring-emerald-400/50'
                      : 'bg-slate-950/60 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <Clock className="w-4 h-4 text-emerald-400 mb-1" />
                  <span>{lang === 'es' ? 'Solo Horario Oficina (9-18h)' : 'Business Hours Only'}</span>
                  <span className="block text-[10px] text-slate-400 font-normal mt-0.5">60% fuera de horario</span>
                </button>

                <button
                  type="button"
                  onClick={() => setScheduleType('partial')}
                  className={`p-3 rounded-2xl text-left border text-xs font-bold transition-all cursor-pointer ${
                    scheduleType === 'partial'
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-1 ring-emerald-400/50'
                      : 'bg-slate-950/60 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <Clock className="w-4 h-4 text-teal-400 mb-1" />
                  <span>{lang === 'es' ? 'Atención Parcial / Sábados' : 'Partial / Saturdays'}</span>
                  <span className="block text-[10px] text-slate-400 font-normal mt-0.5">35% fuera de horario</span>
                </button>

                <button
                  type="button"
                  onClick={() => setScheduleType('247_human')}
                  className={`p-3 rounded-2xl text-left border text-xs font-bold transition-all cursor-pointer ${
                    scheduleType === '247_human'
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-1 ring-emerald-400/50'
                      : 'bg-slate-950/60 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <Clock className="w-4 h-4 text-amber-400 mb-1" />
                  <span>{lang === 'es' ? 'Guardia Humana Nocturna' : 'Night Guard Duty'}</span>
                  <span className="block text-[10px] text-slate-400 font-normal mt-0.5">Alto costo salarial</span>
                </button>
              </div>
            </div>

            {/* Control 3: Avg Commission per Sale/Rent */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold uppercase text-slate-300 tracking-wider">
                  3. {lang === 'es' ? 'Comisión Promedio por Operación (USD)' : 'Average Commission per Deal (USD)'}
                </label>
                <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-black text-sm">
                  ${avgCommissionUsd.toLocaleString('en-US')} USD
                </span>
              </div>
              <input
                type="range"
                min="500"
                max="15000"
                step="250"
                value={avgCommissionUsd}
                onChange={(e) => setAvgCommissionUsd(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                <span>$500 USD</span>
                <span>$5,000 USD</span>
                <span>$15,000+ USD</span>
              </div>
            </div>

          </div>

          {/* Real-time Results Card (Right) */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/80 to-slate-950 border border-emerald-500/40 shadow-2xl space-y-6 flex flex-col justify-between relative overflow-hidden">
            
            <div className="absolute top-0 right-0 px-4 py-1.5 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase rounded-bl-2xl shadow-md">
              Cálculo en Vivo
            </div>

            <div className="space-y-5 pt-2">
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                  {lang === 'es' ? 'Comisiones Perdidas Estimadas al Mes:' : 'Estimated Monthly Lost Commissions:'}
                </span>
                <div className="text-3xl sm:text-4xl font-black text-rose-400 mt-1 flex items-baseline gap-1">
                  <span>${lostCommissionUsd.toLocaleString('en-US')}</span>
                  <span className="text-sm text-slate-400 font-medium">USD / mes</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/10">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">{lang === 'es' ? 'Leads No Atendidos' : 'Unattended Leads'}</span>
                  <span className="text-xl font-black text-rose-300">~{lostLeadsMonthly}</span>
                  <span className="text-[10px] text-slate-400 block">{lang === 'es' ? 'prospectos/mes' : 'leads/mo'}</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/10">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">{lang === 'es' ? 'Visitas Recuperables' : 'Recoverable Tours'}</span>
                  <span className="text-xl font-black text-emerald-400">+{recoveredToursMonthly}</span>
                  <span className="text-[10px] text-slate-400 block">{lang === 'es' ? 'citas agendadas' : 'tours booked'}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-300">{lang === 'es' ? 'Retorno Estimado (ROI Multiplicador)' : 'Estimated ROI Multiplier'}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-black text-xs">
                    {estimatedRoiMultiplier}x ROI
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {lang === 'es'
                    ? `Al captar el 100% de consultas fuera de horario, Aria Prop se paga sola con la primera operación concretada.`
                    : `By engaging 100% of after-hours leads, Aria Prop pays for itself with the very first closed deal.`}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                if (onRouteChange) onRouteChange('pricing');
                else openAuthModal('signup', 'pro', 'dashboard-checkout');
              }}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-black text-xs shadow-xl shadow-emerald-400/20 transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
            >
              <Sparkles className="w-4 h-4 fill-current" />
              <span>{lang === 'es' ? 'Recuperar Estos Leads Ahora' : 'Recover These Leads Now'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </div>

        </div>

      </div>
    </section>
  );
};

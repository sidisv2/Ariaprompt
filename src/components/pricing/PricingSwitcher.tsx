import React, { useState } from 'react';
import { Check, Sparkles, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AppRoute } from '../../types';

import { PLAN_LIMITS } from '../../lib/planLimits';

interface PricingSwitcherProps {
  onRouteChange?: (route: AppRoute) => void;
}

export const PricingSwitcher: React.FC<PricingSwitcherProps> = ({ onRouteChange }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const { openAuthModal, requireAuthForPayment } = useAuth();

  const hasDiscount5 = Boolean(localStorage.getItem('aria_discount_5') === 'true');

  const plans = [
    {
      id: 'starter',
      name: PLAN_LIMITS.solo_agent.name,
      tagline: PLAN_LIMITS.solo_agent.description,
      monthlyPrice: PLAN_LIMITS.solo_agent.monthlyPriceUsd,
      annualPrice: PLAN_LIMITS.solo_agent.annualPriceUsd,
      features: [
        '1 Agente de IA Activo 24/7 (Web)',
        `Hasta ${PLAN_LIMITS.solo_agent.maxLeadsPerMonth} Leads Cualificados / mes`,
        'Sincronización con Google Calendar',
        `Catálogo de hasta ${PLAN_LIMITS.solo_agent.maxProperties} Inmuebles`,
        'Soporte por Email & Chat',
      ],
      popular: false,
      badge: '7 días de prueba gratis',
      buttonText: 'Empezar Prueba Gratis',
      color: 'border-slate-800 bg-slate-900/60',
    },
    {
      id: 'pro',
      name: PLAN_LIMITS.agency_pro.name,
      tagline: PLAN_LIMITS.agency_pro.description,
      monthlyPrice: PLAN_LIMITS.agency_pro.monthlyPriceUsd,
      annualPrice: PLAN_LIMITS.agency_pro.annualPriceUsd,
      features: [
        '5 Agentes de IA 24/7 (WhatsApp & Web)',
        `Hasta ${PLAN_LIMITS.agency_pro.maxLeadsPerMonth} Leads Cualificados / mes`,
        'Integración Tokko Broker & EasyBroker',
        `Catálogo de hasta ${PLAN_LIMITS.agency_pro.maxProperties} Inmuebles`,
        'Evaluador de Rentabilidad & Cap Rate',
        'Soporte Prioritario VIP 24/7',
      ],
      popular: true,
      badge: 'Recomendado — Plan Más Vendido',
      buttonText: 'Probar Plan Pro Gratis',
      color: 'border-emerald-500/50 bg-slate-900/90 shadow-2xl shadow-emerald-500/10',
    },
    {
      id: 'custom',
      name: `${PLAN_LIMITS.enterprise.name} / Desarrolladores`,
      tagline: PLAN_LIMITS.enterprise.description,
      isCustom: true,
      monthlyPrice: PLAN_LIMITS.enterprise.monthlyPriceUsd,
      annualPrice: PLAN_LIMITS.enterprise.annualPriceUsd,
      features: [
        'Agentes & Sucursales Ilimitadas',
        'Infraestructura RAG Dedicada',
        'Sincronización Multi-CRM & Webhooks',
        'Acceso API para Apps Propias',
        'Gerente de Cuenta Dedicado & SLA 99.9%',
      ],
      popular: false,
      badge: 'Solución a Medida',
      buttonText: 'Contactar Ventas',
      color: 'border-cyan-500/30 bg-slate-900/60',
    },
  ];

  const handleSelectPlan = (planId: string) => {
    const passed = requireAuthForPayment({
      planId,
      targetRoute: 'dashboard-checkout',
    });
    if (!passed) {
      openAuthModal('signup', planId, 'dashboard-checkout');
    } else if (onRouteChange) {
      onRouteChange('dashboard-checkout');
    }
  };

  return (
    <div className="space-y-10">
      
      {/* Billing Switcher Toggle */}
      <div className="flex flex-col items-center justify-center space-y-3">
        <div className="inline-flex items-center p-1.5 rounded-2xl bg-slate-900 border border-white/10 shadow-inner">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              billingCycle === 'monthly'
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Facturación Mensual
          </button>

          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              billingCycle === 'annual'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Facturación Anual</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-950 text-[10px] text-emerald-300 font-extrabold border border-emerald-400/40">
              -20%
            </span>
          </button>
        </div>
        <p className="text-xs text-slate-400 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Cambia o cancela tu plan en cualquier momento sin penalizaciones</span>
        </p>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {plans.map((plan) => {
          const rawPrice = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
          const price = hasDiscount5 ? Math.round(rawPrice * 0.95) : rawPrice;
          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between border transition-all hover:scale-[1.02] ${plan.color}`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-emerald-400 text-slate-950 font-black text-[11px] uppercase tracking-wider shadow-lg shadow-emerald-400/40 flex items-center gap-1.5 border border-emerald-300 z-20 shrink-0 whitespace-nowrap">
                  <Zap className="w-3.5 h-3.5 fill-slate-950 stroke-none" />
                  <span className="text-slate-950 font-black">{plan.badge}</span>
                </div>
              )}

              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  {!plan.popular && (
                    <span className="text-[10px] font-bold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-full border border-white/10">
                      {plan.badge}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 mb-6 min-h-[32px]">{plan.tagline}</p>

                {/* Price Display with Animated Transition */}
                <div className="mb-6 pb-6 border-b border-white/10">
                  {plan.isCustom ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                        A Medida
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                        ${price}
                      </span>
                      {hasDiscount5 && (
                        <span className="line-through text-xs text-slate-400 font-mono ml-1">${rawPrice}</span>
                      )}
                      <span className="text-xs text-slate-400 font-medium ml-1">
                        USD / mes
                      </span>
                    </div>
                  )}
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    {plan.isCustom
                      ? 'Cotización personalizada por volumen de sucursales'
                      : billingCycle === 'annual'
                      ? 'Facturado anualmente (-20% ahorro)'
                      : 'Facturado mensualmente'}
                  </p>
                </div>

                {/* Features List */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-xs text-slate-200">
                      <div className="w-5 h-5 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-emerald-400/20 font-bold">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleSelectPlan(plan.id)}
                className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  plan.popular
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                }`}
              >
                <span>{plan.buttonText}</span>
              </button>

            </div>
          );
        })}
      </div>

    </div>
  );
};

export default PricingSwitcher;

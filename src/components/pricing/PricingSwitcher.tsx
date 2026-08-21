import React, { useState } from 'react';
import { Check, Sparkles, Zap, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../hooks/useSubscription';
import { AppRoute } from '../../types';
import { PLAN_LIMITS, PlanTier } from '../../lib/planLimits';
import { UpgradeConfirmModal } from './UpgradeConfirmModal';

interface PricingSwitcherProps {
  onRouteChange?: (route: AppRoute) => void;
}

export const PricingSwitcher: React.FC<PricingSwitcherProps> = ({ onRouteChange }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const { user, openAuthModal, requireAuthForPayment } = useAuth();
  const { userPlan, isOwner, upgradeSubscription } = useSubscription();

  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [targetUpgradePlan, setTargetUpgradePlan] = useState<PlanTier>('pro');

  const hasDiscount5 = Boolean(localStorage.getItem('aria_discount_5') === 'true');

  const WHATSAPP_ENTERPRISE_URL =
    'https://wa.me/5492604014372?text=Hola!%20Tengo%20un%20plan%20en%20Ariaprop%20y%20quiero%20escalar%20mi%20inmobiliaria%20a%20Enterprise%20%F0%9F%9A%80';

  const getCardProps = (planTier: 'solo' | 'pro' | 'desarrolladores') => {
    // 1. Owner / Superadmin state
    if (isOwner) {
      if (planTier === 'desarrolladores') {
        return {
          badge: '👑 Tu Plan Actual (Owner / Enterprise)',
          buttonText: '✓ Acceso Total (Owner)',
          disabled: true,
          action: () => {},
          isCurrent: true,
          color: 'border-amber-400/60 bg-slate-900/90 shadow-2xl shadow-amber-500/10',
        };
      }
      return {
        badge: '✓ Incluido en tu Plan',
        buttonText: '✓ Incluido en tu Plan',
        disabled: true,
        action: () => {},
        isCurrent: true,
        color: 'border-slate-800 bg-slate-900/60',
      };
    }

    // 2. User has 'solo' plan
    if (userPlan === 'solo') {
      if (planTier === 'solo') {
        return {
          badge: '✓ Tu Plan Actual',
          buttonText: '✓ Plan Solo Agent Activo',
          disabled: true,
          action: () => {},
          isCurrent: true,
          color: 'border-slate-700 bg-slate-900/80',
        };
      }
      if (planTier === 'pro') {
        return {
          badge: '⚡ UPGRADE DISPONIBLE',
          buttonText: '⚡ Mejorar a Agency Pro ➔',
          disabled: false,
          action: () => {
            setTargetUpgradePlan('pro');
            setUpgradeModalOpen(true);
          },
          isCurrent: false,
          color: 'border-emerald-400 bg-slate-900/90 shadow-2xl shadow-emerald-500/20 ring-2 ring-emerald-400/30',
        };
      }
      if (planTier === 'desarrolladores') {
        return {
          badge: 'Solución a Medida',
          buttonText: 'Escalar a Enterprise ➔',
          disabled: false,
          action: () => {
            window.open(WHATSAPP_ENTERPRISE_URL, '_blank');
          },
          isCurrent: false,
          color: 'border-cyan-500/30 bg-slate-900/60',
        };
      }
    }

    // 3. User has 'pro' plan
    if (userPlan === 'pro') {
      if (planTier === 'solo' || planTier === 'pro') {
        return {
          badge: planTier === 'pro' ? '✓ Tu Plan Actual' : '✓ Incluido en tu Plan',
          buttonText: planTier === 'pro' ? '✓ Plan Agency Pro Activo' : '✓ Incluido en tu Plan',
          disabled: true,
          action: () => {},
          isCurrent: planTier === 'pro',
          color: planTier === 'pro' ? 'border-emerald-500/50 bg-slate-900/90 shadow-2xl shadow-emerald-500/10' : 'border-slate-800 bg-slate-900/60',
        };
      }
      if (planTier === 'desarrolladores') {
        return {
          badge: '👑 ESCALA CORPORATIVA',
          buttonText: '👑 Escalar a Enterprise ➔',
          disabled: false,
          action: () => {
            window.open(WHATSAPP_ENTERPRISE_URL, '_blank');
          },
          isCurrent: false,
          color: 'border-amber-400/60 bg-slate-900/90 shadow-2xl shadow-amber-500/10',
        };
      }
    }

    // 4. User has 'desarrolladores' (Enterprise) plan
    if (userPlan === 'desarrolladores') {
      return {
        badge: planTier === 'desarrolladores' ? '👑 Tu Plan Actual (Enterprise)' : '✓ Incluido en tu Plan',
        buttonText: planTier === 'desarrolladores' ? '✓ Plan Enterprise Activo' : '✓ Incluido en tu Plan',
        disabled: true,
        action: () => {},
        isCurrent: true,
        color: planTier === 'desarrolladores' ? 'border-amber-400/60 bg-slate-900/90 shadow-2xl shadow-amber-500/10' : 'border-slate-800 bg-slate-900/60',
      };
    }

    // 5. Default: Visitor or 'normal' (guest/gratis) tier
    if (planTier === 'solo') {
      return {
        badge: '7 días de prueba gratis',
        buttonText: 'Empezar Prueba Gratis',
        disabled: false,
        action: () => handleSelectPlan('solo'),
        isCurrent: false,
        color: 'border-slate-800 bg-slate-900/60',
      };
    }
    if (planTier === 'pro') {
      return {
        badge: 'RECOMENDADO — PLAN MÁS VENDIDO',
        buttonText: 'Probar Plan Pro Gratis',
        disabled: false,
        action: () => handleSelectPlan('pro'),
        isCurrent: false,
        color: 'border-emerald-500/50 bg-slate-900/90 shadow-2xl shadow-emerald-500/10',
      };
    }
    return {
      badge: 'Solución a Medida',
      buttonText: 'Contactar Ventas',
      disabled: false,
      action: () => {
        window.open(WHATSAPP_ENTERPRISE_URL, '_blank');
      },
      isCurrent: false,
      color: 'border-cyan-500/30 bg-slate-900/60',
    };
  };

  const handleSelectPlan = (planId: string) => {
    localStorage.setItem('aria_selected_billing_cycle', billingCycle);
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

  const handleExecuteUpgrade = async (targetPlan: PlanTier) => {
    const res = await upgradeSubscription(targetPlan);
    if (res.success && onRouteChange) {
      onRouteChange('dashboard-metrics');
    }
  };

  const plans = [
    {
      id: 'solo',
      tierKey: 'solo' as const,
      name: `${PLAN_LIMITS.solo.emoji} ${PLAN_LIMITS.solo.name}`,
      tagline: 'Ideal para corredores y agentes inmobiliarios independientes.',
      monthlyPrice: PLAN_LIMITS.solo.monthlyPriceUsd,
      annualPrice: PLAN_LIMITS.solo.annualPriceUsd,
      features: [
        '1 Agente de IA Activo 24/7 (WhatsApp Meta + Web)',
        'Hasta 100 Leads Cualificados / mes',
        'Transcripción y comprensión de notas de voz (Gemini 2.5 Flash)',
        'Catálogo de hasta 20 Inmuebles en tiempo real',
        'Sincronización con Google Calendar',
        'Bóveda Privada de Documentos PDF',
        'Soporte por Email & Chat',
      ],
      popular: false,
    },
    {
      id: 'pro',
      tierKey: 'pro' as const,
      name: `${PLAN_LIMITS.pro.emoji} ${PLAN_LIMITS.pro.name}`,
      tagline: 'Para agencias en crecimiento con WhatsApp multi-asesor y sincronización CRM.',
      monthlyPrice: PLAN_LIMITS.pro.monthlyPriceUsd,
      annualPrice: PLAN_LIMITS.pro.annualPriceUsd,
      features: [
        '5 Agentes de IA 24/7 (WhatsApp Meta + Web)',
        'Hasta 500 Leads Cualificados / mes',
        'Transcripción ilimitada de notas de voz con IA',
        'Integración Tokko Broker & EasyBroker',
        'Catálogo de hasta 100 Inmuebles',
        'CRM con Inbox de chats en vivo e intervención humana',
        'Evaluador de Rentabilidad & Cap Rate',
        'Soporte Prioritario VIP 24/7',
      ],
      popular: true,
    },
    {
      id: 'desarrolladores',
      tierKey: 'desarrolladores' as const,
      name: `${PLAN_LIMITS.desarrolladores.emoji} Desarrolladores / Enterprise`,
      tagline: 'Para desarrolladoras, promotoras y redes inmobiliarias.',
      isCustom: true,
      monthlyPrice: 0,
      annualPrice: 0,
      features: [
        'Agentes & Sucursales Ilimitadas',
        'Infraestructura RAG Dedicada',
        'Sincronización Multi-CRM & Webhooks',
        'Acceso API para Apps Propias & CRM Local',
        'Gerente de Cuenta Dedicado & SLA 99.9%',
      ],
      popular: false,
    },
  ];

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
            Facturación Mensual ($35 / $99)
          </button>

          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              billingCycle === 'annual'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Facturación Anual ($29 / $79)</span>
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
          const cardProps = getCardProps(plan.tierKey);

          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between border transition-all hover:scale-[1.02] ${cardProps.color}`}
            >
              {plan.popular && !cardProps.isCurrent && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-emerald-400 text-slate-950 font-black text-[11px] uppercase tracking-wider shadow-lg shadow-emerald-400/40 flex items-center gap-1.5 border border-emerald-300 z-20 shrink-0 whitespace-nowrap">
                  <Zap className="w-3.5 h-3.5 fill-slate-950 stroke-none" />
                  <span className="text-slate-950 font-black">{cardProps.badge}</span>
                </div>
              )}

              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  {(!plan.popular || cardProps.isCurrent) && (
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                      cardProps.isCurrent ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-extrabold' : 'bg-slate-800 text-slate-300 border-white/10'
                    }`}>
                      {cardProps.badge}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 mb-6 min-h-[32px]">{plan.tagline}</p>

                {/* Price Display */}
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
                onClick={cardProps.action}
                disabled={cardProps.disabled}
                className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  cardProps.disabled
                    ? 'bg-slate-800 text-slate-400 border border-white/5 cursor-not-allowed'
                    : plan.popular || cardProps.buttonText.includes('⚡')
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25 cursor-pointer hover:scale-105'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/10 cursor-pointer hover:scale-105'
                }`}
              >
                <span>{cardProps.buttonText}</span>
              </button>

            </div>
          );
        })}
      </div>

      {/* Instant Hot Upgrade Modal */}
      <UpgradeConfirmModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        currentPlan={userPlan}
        targetPlan={targetUpgradePlan}
        onConfirmUpgrade={handleExecuteUpgrade}
      />

    </div>
  );
};

export default PricingSwitcher;

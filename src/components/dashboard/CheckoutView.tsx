import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  CreditCard,
  Building,
  Zap,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Globe2,
  DollarSign,
  Lock,
  Sparkles,
  ArrowRight,
  Wallet,
  Building2,
  Send,
  RefreshCw,
  Award,
  Headphones
} from 'lucide-react';
import { trackPurchaseConversion } from '../../lib/analytics';
import { PLAN_LIMITS } from '../../lib/planLimits';
import { AppRoute } from '../../types';
import {
  VisaLogo,
  MastercardLogo,
  AmexLogo,
  MercadoPagoLogo,
  PaypalLogo,
  SpeiLogo,
  PseLogo,
} from '../common/PaymentLogos';

interface CheckoutViewProps {
  onRouteChange?: (route: AppRoute) => void;
}

type CurrencyCode = 'USD' | 'MXN' | 'COP' | 'ARS' | 'CLP';

const CURRENCIES: { code: CurrencyCode; label: string; symbol: string; rate: number; flag: string }[] = [
  { code: 'USD', label: 'Dólares (USD)', symbol: '$', rate: 1, flag: '🇺🇸' },
  { code: 'MXN', label: 'Pesos Mexicanos (MXN)', symbol: '$', rate: 20.0, flag: '🇲🇽' },
  { code: 'COP', label: 'Pesos Colombianos (COP)', symbol: '$', rate: 4100, flag: '🇨🇴' },
  { code: 'ARS', label: 'Pesos Argentinos (ARS)', symbol: '$', rate: 1200, flag: '🇦🇷' },
  { code: 'CLP', label: 'Pesos Chilenos (CLP)', symbol: '$', rate: 940, flag: '🇨🇱' },
];

interface PlanItem {
  id: string;
  name: string;
  priceUsd: number;
  badge?: string;
  description: string;
  features: string[];
}

type PaymentMethod = 'card' | 'mercadopago' | 'paypal' | 'transfer';

const normalizePlanId = (planId: string) => {
  if (planId === 'solo_agent') return 'starter';
  if (planId === 'agency_pro') return 'pro';
  if (planId === 'custom' || planId === 'enterprise') return 'agency';
  return planId;
};

const IS_PADDLE_PRODUCTION = import.meta.env.VITE_PADDLE_ENV === 'production';

// Production Price IDs (Verified against Paddle Production Live API api.paddle.com)
const PADDLE_PRODUCTION_PRICE_IDS: Record<string, { monthly: string; annual: string }> = {
  starter: {
    monthly: import.meta.env.VITE_PADDLE_PRICE_SOLO_MONTHLY || 'pri_01kyh5xs672hj75v57tyf8mqg1',
    annual:  import.meta.env.VITE_PADDLE_PRICE_SOLO_ANNUAL  || 'pri_01kyh5zsndbhkhswrbfmwj4xvb',
  },
  pro: {
    monthly: import.meta.env.VITE_PADDLE_PRICE_PRO_MONTHLY  || 'pri_01kyh63dg2h0jkwvd1bh6jde47',
    annual:  import.meta.env.VITE_PADDLE_PRICE_PRO_ANNUAL   || 'pri_01kyh64fj85g1j12vgar9ct9yz',
  },
};

// Sandbox Fallback Price IDs
const PADDLE_SANDBOX_PRICE_IDS: Record<string, { monthly: string; annual: string }> = {
  starter: {
    monthly: 'pri_01kyh5xs672hj75v57tyf8mqg1',
    annual:  'pri_01kyh5zsndbhkhswrbfmwj4xvb',
  },
  pro: {
    monthly: 'pri_01kyh63dg2h0jkwvd1bh6jde47',
    annual:  'pri_01kyh64fj85g1j12vgar9ct9yz',
  },
};

const PADDLE_PRICE_IDS = IS_PADDLE_PRODUCTION ? PADDLE_PRODUCTION_PRICE_IDS : PADDLE_SANDBOX_PRICE_IDS;

const OFFICIAL_PAYMENT_LINKS: Record<string, { monthly: string; annual: string }> = {
  starter: {
    monthly: 'https://mpago.la/17xmopC',
    annual:  'https://mpago.la/29pqoZr',
  },
  pro: {
    monthly: 'https://mpago.la/1UhRK7X',
    annual:  'https://mpago.la/1z8gxgW',
  },
  agency: {
    monthly: 'https://wa.me/5492604014372?text=Hola!%20Me%20interesa%20el%20plan%20Enterprise%20/%20Desarrolladores%20de%20AriaPrompt.',
    annual:  'https://wa.me/5492604014372?text=Hola!%20Me%20interesa%20el%20plan%20Enterprise%20/%20Desarrolladores%20de%20AriaPrompt.',
  },
};

export function CheckoutView({ }: CheckoutViewProps) {
  const { requireAuthForPayment, pendingPlan } = useAuth();
  const [selectedPlanId, setSelectedPlanId] = useState<string>(() => pendingPlan ? normalizePlanId(pendingPlan) : 'pro');
  const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>(() => {
    return (localStorage.getItem('aria_selected_billing_cycle') as 'annual' | 'monthly') || 'annual';
  });

  React.useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).Paddle) {
      const script = document.createElement('script');
      script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
      script.async = true;
      script.onload = () => {
        if ((window as any).Paddle) {
          try {
            if (IS_PADDLE_PRODUCTION) {
              (window as any).Paddle.Environment?.set('production');
              console.log('✅ Paddle.js v2 SDK initialized in PRODUCTION mode.');
            } else {
              (window as any).Paddle.Environment?.set('sandbox');
              console.log('✅ Paddle.js v2 SDK initialized in SANDBOX mode.');
            }
          } catch (err) {
            console.warn('⚠️ Paddle.js initialization warning:', err);
          }
        }
      };
      document.head.appendChild(script);
    }
  }, []);

  const getDynamicPlans = (): PlanItem[] => {
    const isAnnual = billingCycle === 'annual';
    return [
      {
        id: 'starter',
        name: PLAN_LIMITS.solo_agent.name,
        priceUsd: isAnnual ? PLAN_LIMITS.solo_agent.annualPriceUsd : PLAN_LIMITS.solo_agent.monthlyPriceUsd,
        description: PLAN_LIMITS.solo_agent.description,
        features: [
          '1 Agente de IA (Aria) activo',
          `Hasta ${PLAN_LIMITS.solo_agent.maxLeadsPerMonth} leads cualificados/mes`,
          `Hasta ${PLAN_LIMITS.solo_agent.maxProperties} propiedades en catálogo`,
          'Widget Web & WhatsApp API',
          '7 Días de Prueba Gratis (Sin tarjeta)'
        ]
      },
      {
        id: 'pro',
        name: PLAN_LIMITS.agency_pro.name,
        priceUsd: isAnnual ? PLAN_LIMITS.agency_pro.annualPriceUsd : PLAN_LIMITS.agency_pro.monthlyPriceUsd,
        badge: 'MÁS POPULAR',
        description: PLAN_LIMITS.agency_pro.description,
        features: [
          '5 Agentes de IA configurables',
          `Hasta ${PLAN_LIMITS.agency_pro.maxLeadsPerMonth} leads cualificados/mes`,
          `Hasta ${PLAN_LIMITS.agency_pro.maxProperties} propiedades en catálogo`,
          'Sincronización Automática Tokko & EasyBroker',
          'RAG Documental (PDFs, Planos)',
          'Soporte Prioritario VIP 24/7'
        ]
      },
      {
        id: 'agency',
        name: PLAN_LIMITS.enterprise.name,
        priceUsd: 0,
        badge: 'SOLUCIÓN A MEDIDA',
        description: PLAN_LIMITS.enterprise.description,
        features: [
          'Agentes de IA Ilimitados',
          'Marca Blanca 100% (Sin logo de Aria Prop)',
          'Dominio Personalizado',
          'Múltiples sucursales y ciudades',
          'Gerente de Cuenta Dedicado',
          'API Custom, Webhooks & SLA 99.9%'
        ]
      }
    ];
  };

  const PLANS = getDynamicPlans();
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mercadopago');

  const activeCurrencyObj = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];
  const activePlan = PLANS.find((p) => p.id === selectedPlanId) || PLANS[1];

  /** Returns the official payment link for a given plan + billing cycle. */
  const getOfficialPaymentLink = (planId: string, cycle: 'monthly' | 'annual' = billingCycle) => {
    const linkConfig = OFFICIAL_PAYMENT_LINKS[normalizePlanId(planId)] || OFFICIAL_PAYMENT_LINKS.pro;
    return linkConfig[cycle];
  };

  const officialPaymentLink = getOfficialPaymentLink(activePlan.id);

  /**
   * Opens a Paddle checkout overlay for card/PayPal/Google Pay/Apple Pay.
   * Falls back to opening the MP link in a new tab if Paddle is not available.
   */
  const openPaddleCheckout = (priceId: string, planId: string, fallbackUrl: string) => {
    try {
      const Paddle = (window as any).Paddle;
      const targetPlan = PLANS.find((p) => p.id === planId) || activePlan;
      const successUrl = `${window.location.origin}/checkout/success?txn_id={checkout_id}&plan=${planId}&amount=${targetPlan.priceUsd}&currency=USD`;

      if (Paddle) {
        Paddle.Checkout.open({
          items: [{ priceId, quantity: 1 }],
          settings: {
            successUrl: successUrl,
          },
          eventCallback: (data: any) => {
            if (data?.name === 'checkout.completed' || data?.event === 'Checkout.Complete') {
              const txnId = data?.data?.id || data?.checkout?.id || `pdl_${Date.now()}`;
              window.location.href = `${window.location.origin}/checkout/success?txn_id=${txnId}&plan=${planId}&amount=${targetPlan.priceUsd}&currency=USD`;
            }
          }
        });
      } else {
        window.open(fallbackUrl, '_blank');
      }
    } catch {
      window.open(fallbackUrl, '_blank');
    }
  };

  const formattedPrice = (activePlan.priceUsd * activeCurrencyObj.rate).toLocaleString('es-ES', {
    maximumFractionDigits: 0
  });

  /** CTA on plan cards — goes directly to the right gateway, no intermediate modal. */
  const handleOpenCheckoutWithAuth = (planId: string) => {
    const normId = normalizePlanId(planId);
    setSelectedPlanId(normId);

    requireAuthForPayment({
      planId,
      onAuthenticated: () => {
        if (normId === 'agency') {
          // Enterprise/Developers: open WhatsApp
          window.open(getOfficialPaymentLink(planId), '_blank');
        } else if (paymentMethod === 'card' || paymentMethod === 'paypal' || paymentMethod === 'transfer') {
          const priceId = PADDLE_PRICE_IDS[normId]?.[billingCycle] || PADDLE_PRICE_IDS.pro[billingCycle];
          openPaddleCheckout(priceId, normId, getOfficialPaymentLink(planId));
        } else {
          // Mercado Pago (default)
          window.open(getOfficialPaymentLink(planId), '_blank');
        }
      },
    });
  };

  /** Mercado Pago card click — opens MP link directly in new tab. */
  const handleMercadoPago = () => {
    setPaymentMethod('mercadopago');
    requireAuthForPayment({
      planId: selectedPlanId,
      onAuthenticated: () => {
        window.open(getOfficialPaymentLink(selectedPlanId, billingCycle), '_blank');
      },
    });
  };

  /** Card/PayPal/Transfer click — opens Paddle checkout overlay directly. */
  const handlePaddleMethod = (method: PaymentMethod) => {
    setPaymentMethod(method);
    requireAuthForPayment({
      planId: selectedPlanId,
      onAuthenticated: () => {
        const normId = normalizePlanId(selectedPlanId);
        const priceId = PADDLE_PRICE_IDS[normId]?.[billingCycle] || PADDLE_PRICE_IDS.pro[billingCycle];
        openPaddleCheckout(priceId, normId, getOfficialPaymentLink(selectedPlanId, billingCycle));
      },
    });
  };


  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Pasarela de Pagos LATAM & Global
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Globe2 className="w-3.5 h-3.5 text-emerald-400" />
              Soporte Multimoneda
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">Planes y Pasarelas de Pago Oficiales</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Selecciona tu plan, elige la moneda de tu país y utiliza cualquiera de nuestras pasarelas integradas.
          </p>
        </div>

        {/* Currency & Billing Cycle Switchers */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Billing Cycle Toggle */}
          <div className="bg-black/40 border border-white/10 p-1.5 rounded-2xl flex items-center gap-1 shadow-inner">
            <button
              onClick={() => {
                setBillingCycle('annual');
                localStorage.setItem('aria_selected_billing_cycle', 'annual');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                billingCycle === 'annual'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Facturación Anual (-20%)
            </button>
            <button
              onClick={() => {
                setBillingCycle('monthly');
                localStorage.setItem('aria_selected_billing_cycle', 'monthly');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-slate-800 text-white font-bold border border-white/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Facturación Mensual
            </button>
          </div>

          {/* Currency Switcher Pill */}
          <div className="bg-black/40 border border-white/10 p-1.5 rounded-2xl flex items-center gap-1 shadow-inner">
            {CURRENCIES.map((c) => (
              <button
                key={c.code}
                onClick={() => setCurrency(c.code)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  currency === c.code
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{c.flag}</span>
                <span>{c.code}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Plan Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const isSelected = plan.id === selectedPlanId;
          const planPrice = (plan.priceUsd * activeCurrencyObj.rate).toLocaleString('es-ES', {
            maximumFractionDigits: 0
          });

          return (
            <div
              key={plan.id}
              onClick={() => setSelectedPlanId(plan.id)}
              className={`p-6 sm:p-8 rounded-3xl border transition-all duration-300 cursor-pointer flex flex-col justify-between relative ${
                isSelected
                  ? 'bg-slate-900/90 border-emerald-500 shadow-[0_0_35px_rgba(16,185,129,0.2)] ring-1 ring-emerald-500/50'
                  : 'bg-black/30 border-white/5 hover:border-white/20 hover:bg-black/50'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 right-6 px-3.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-[10px] tracking-wider uppercase shadow-md flex items-center gap-1">
                  <Sparkles className="w-3 h-3 fill-slate-950" />
                  <span>{plan.badge}</span>
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{plan.description}</p>
                </div>

                <div className="py-3 border-y border-white/5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white font-mono">
                      {activeCurrencyObj.symbol}{planPrice}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {activeCurrencyObj.code} / mes
                    </span>
                  </div>
                  {currency !== 'USD' && (
                    <p className="text-[11px] text-emerald-400 mt-1 font-mono">
                      (~${plan.priceUsd} USD)
                    </p>
                  )}
                </div>

                <ul className="space-y-3 text-xs text-slate-300">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenCheckoutWithAuth(plan.id);
                }}
                className={`w-full mt-8 py-3 px-4 rounded-xl font-bold text-xs transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <span>{isSelected ? 'Proceder al Pago Seguro' : 'Seleccionar Plan'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Payment Methods Section */}
      <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-400" />
              Métodos de Pago Aceptados en Latinoamérica y Global
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Acepta pagos instantáneos en moneda local o USD con tus pasarelas favoritas.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
            <Lock className="w-3.5 h-3.5" />
            <span>Encriptación SSL 256-bit</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Mercado Pago — opens MP link directly in new tab */}
          <button
            onClick={handleMercadoPago}
            className={`p-5 rounded-2xl border text-left transition-all space-y-3 cursor-pointer ${
              paymentMethod === 'mercadopago'
                ? 'bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500'
                : 'bg-black/30 border-white/5 hover:border-white/15'
            }`}
          >
            <MercadoPagoLogo className="h-6" />
            <div>
              <p className="font-bold text-white text-xs">Mercado Pago</p>
              <p className="text-[10px] text-slate-400">MXN, ARS, COP, CLP, PEN</p>
            </div>
          </button>

          {/* Credit/Debit Card — opens Paddle overlay */}
          <button
            onClick={() => handlePaddleMethod('card')}
            className={`p-5 rounded-2xl border text-left transition-all space-y-3 cursor-pointer ${
              paymentMethod === 'card'
                ? 'bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500'
                : 'bg-black/30 border-white/5 hover:border-white/15'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <VisaLogo className="h-4" />
              <MastercardLogo className="h-4" />
            </div>
            <div>
              <p className="font-bold text-white text-xs">Tarjeta Crédito / Débito</p>
              <p className="text-[10px] text-slate-400">Visa, Mastercard, Amex</p>
            </div>
          </button>

          {/* PayPal — opens Paddle overlay */}
          <button
            onClick={() => handlePaddleMethod('paypal')}
            className={`p-5 rounded-2xl border text-left transition-all space-y-3 cursor-pointer ${
              paymentMethod === 'paypal'
                ? 'bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500'
                : 'bg-black/30 border-white/5 hover:border-white/15'
            }`}
          >
            <PaypalLogo className="h-6" />
            <div>
              <p className="font-bold text-white text-xs">PayPal Internacional</p>
              <p className="text-[10px] text-slate-400">Pago Global en USD</p>
            </div>
          </button>

          {/* Transfer SPEI / PSE — opens Paddle overlay */}
          <button
            onClick={() => handlePaddleMethod('transfer')}
            className={`p-5 rounded-2xl border text-left transition-all space-y-3 cursor-pointer ${
              paymentMethod === 'transfer'
                ? 'bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500'
                : 'bg-black/30 border-white/5 hover:border-white/15'
            }`}
          >
            <div className="flex items-center gap-1">
              <SpeiLogo />
              <PseLogo />
            </div>
            <div>
              <p className="font-bold text-white text-xs">SPEI / PSE / CBU</p>
              <p className="text-[10px] text-slate-400">Transferencia Directa</p>
            </div>
          </button>

        </div>
      </div>

    </div>
  );
}

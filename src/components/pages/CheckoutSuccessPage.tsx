import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { AppRoute } from '../../types';
import { CheckCircle2, ShieldCheck, ArrowRight, Building, Sparkles, AlertTriangle } from 'lucide-react';
import { trackPurchaseConversion } from '../../lib/analytics';
import { PLAN_LIMITS } from '../../lib/planLimits';
import { Footer } from '../marketing/Footer';

interface CheckoutSuccessPageProps {
  onRouteChange: (route: AppRoute) => void;
}

export const CheckoutSuccessPage: React.FC<CheckoutSuccessPageProps> = ({ onRouteChange }) => {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const isPt = language === 'pt';

  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [planId, setPlanId] = useState<string>('pro');
  const [amount, setAmount] = useState<number>(99);
  const [currency, setCurrency] = useState<string>('USD');
  const [verificationState, setVerificationState] = useState<'verifying' | 'verified' | 'unverified'>('verifying');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const txnId =
      urlParams.get('txn_id') ||
      urlParams.get('transaction_id') ||
      urlParams.get('checkout_id') ||
      urlParams.get('paddle_order_id') ||
      urlParams.get('order_id') ||
      urlParams.get('payment_id');

    const rawPlan = urlParams.get('plan') || 'pro';
    const normPlan = rawPlan === 'solo_agent' ? 'solo' : rawPlan === 'agency_pro' ? 'pro' : rawPlan;
    const planConfig = PLAN_LIMITS[normPlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.pro;

    setPlanId(normPlan);
    setAmount(planConfig.monthlyPriceUsd);

    if (!txnId || txnId.startsWith('pdl_') || txnId.startsWith('mock_')) {
      console.log('🔒 CheckoutSuccessPage: Missing or synthetic transaction ID. Conversion tracking disabled to prevent fake Ads data.');
      setVerificationState('unverified');
      return;
    }

    setTransactionId(txnId);

    // Call server-side verification endpoint (/api/verify-transaction)
    fetch(`/api/verify-transaction?txn_id=${encodeURIComponent(txnId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.verified === true) {
          setVerificationState('verified');
          setAmount(data.amount || planConfig.monthlyPriceUsd);
          setCurrency(data.currency || 'USD');

          // CONDITION 1: Deduplication via localStorage check
          const dedupeKey = `ads_conversion_fired_${txnId}`;
          const alreadyFired = localStorage.getItem(dedupeKey);

          if (alreadyFired) {
            console.log(`ℹ️ CheckoutSuccessPage: Conversion event for verified transaction "${txnId}" was already fired. Suppressing duplicate.`);
            return;
          }

          localStorage.setItem(dedupeKey, 'true');
          trackPurchaseConversion(txnId, data.amount || planConfig.monthlyPriceUsd);
          console.log(`🎯 CheckoutSuccessPage: SERVER-VERIFIED conversion event fired for "${txnId}": ${data.amount} ${data.currency}`);
        } else {
          console.log(`🔒 CheckoutSuccessPage: Transaction "${txnId}" not server-verified (${data?.reason || 'unconfirmed'}). Google Ads conversion event suppressed.`);
          setVerificationState('unverified');
        }
      })
      .catch((err) => {
        console.warn('⚠️ CheckoutSuccessPage: Verification request failed:', err);
        setVerificationState('unverified');
      });
  }, []);

  const planName = PLAN_LIMITS[planId as keyof typeof PLAN_LIMITS]?.name || 'Agency Pro';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      <main className="flex-1 max-w-3xl mx-auto px-4 py-16 flex flex-col justify-center items-center text-center space-y-8 animate-page-fade">
        
        {/* Success Icon */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-2xl shadow-emerald-500/30">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <Sparkles className="w-6 h-6 text-emerald-300 absolute -top-1 -right-1 animate-pulse" />
        </div>

        {/* Heading */}
        <div className="space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isEn ? 'Payment Confirmed' : isPt ? 'Pagamento Confirmado' : 'Pago Confirmado'}</span>
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            {isEn ? 'Welcome to Aria Prop!' : isPt ? 'Bem-vindo ao Aria Prop!' : '¡Bienvenido a Aria Prop!'}
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-lg mx-auto">
            {isEn
              ? `Your subscription to ${planName} has been activated successfully. Your AI Commercial Assistant is ready to work.`
              : isPt
              ? `Sua assinatura do plano ${planName} foi ativada com sucesso. Seu assistente de IA está pronto.`
              : `Tu suscripción al plan ${planName} ha sido activada con éxito. Tu Asistente IA Comercial está listo para trabajar 24/7.`}
          </p>
        </div>

        {/* Order Details Box */}
        <div className="w-full bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl backdrop-blur-xl text-left">
          <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-400 border-b border-white/10 pb-3 flex items-center gap-2">
            <Building className="w-4 h-4" />
            <span>{isEn ? 'Subscription Summary' : isPt ? 'Resumo da Assinatura' : 'Resumen de la Suscripción'}</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 space-y-1">
              <span className="text-slate-400 block text-[11px] font-medium">{isEn ? 'Selected Plan' : 'Plan Contratado'}</span>
              <strong className="text-white font-bold text-sm block">{planName}</strong>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 space-y-1">
              <span className="text-slate-400 block text-[11px] font-medium">{isEn ? 'Amount Paid' : 'Monto Abonado'}</span>
              <strong className="text-emerald-400 font-bold text-sm block">${amount} {currency}</strong>
            </div>

            {transactionId ? (
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 space-y-1 sm:col-span-2">
                <span className="text-slate-400 block text-[11px] font-medium">{isEn ? 'Transaction ID' : 'ID de Transacción Paddle'}</span>
                <span className="text-slate-200 font-mono text-xs block break-all">{transactionId}</span>
              </div>
            ) : (
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 space-y-1 sm:col-span-2 text-slate-400 text-xs">
                <span>{isEn ? 'Acceso activo en tu workspace.' : 'Tu acceso está habilitado en tu espacio de trabajo.'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={() => onRouteChange('app')}
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition-all transform hover:scale-[1.02] shadow-xl shadow-emerald-500/20 cursor-pointer"
          >
            <span>{isEn ? 'Enter My Workspace' : isPt ? 'Ir para o Meu Painel' : 'Ingresar a mi Workspace'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </main>

      <Footer onRouteChange={onRouteChange} />
    </div>
  );
};

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  CreditCard,
  Building,
  Zap,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Globe2,
  QrCode,
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
import { AppRoute } from '../../types';
import {
  VisaLogo,
  MastercardLogo,
  AmexLogo,
  MercadoPagoLogo,
  PaypalLogo,
  SpeiLogo,
  PseLogo,
  UsdtLogo
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

const PLANS: PlanItem[] = [
  {
    id: 'starter',
    name: 'Plan Básico',
    priceUsd: 31,
    description: 'Ideal para agentes independientes o agencias pequeñas iniciando con IA.',
    features: [
      '1 Agente de IA (Aria) activo',
      'Hasta 500 chats de cualificación/mes',
      'Hasta 20 propiedades sincronizadas',
      'Widget Web Embebible',
      '7 Días de Prueba Gratis (Sin tarjeta)'
    ]
  },
  {
    id: 'pro',
    name: 'Plan Profesional',
    priceUsd: 71,
    badge: 'MÁS POPULAR',
    description: 'Para agencias en crecimiento que buscan automatización total por WhatsApp y CRM.',
    features: [
      '3 Agentes de IA configurables',
      'Chats y Propiedades Ilimitados',
      'Sincronización Automática de CRM',
      'Soporte Prioritario por WhatsApp 24/7',
      'RAG Documental (PDFs, Excel, Planos)',
      'Intervención en Vivo (Human-in-the-loop)'
    ]
  },
  {
    id: 'agency',
    name: 'Plan Enterprise',
    priceUsd: 159,
    badge: 'MEJOR VALOR',
    description: 'Para redes inmobiliarias, franquicias y múltiples sucursales con marca blanca.',
    features: [
      'Agentes de IA Ilimitados',
      'Marca Blanca 100% (Sin logo de Aria Prop)',
      'Dominio Personalizado',
      'Múltiples sucursales y ciudades',
      'Gerente de Cuenta Dedicado',
      'API Custom, Webhooks & Zapier'
    ]
  }
];

export function CheckoutView({ }: CheckoutViewProps) {
  const { requireAuthForPayment } = useAuth();
  const [selectedPlanId, setSelectedPlanId] = useState<string>('pro');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mercadopago' | 'paypal' | 'transfer' | 'crypto'>('mercadopago');
  
  // Custom Payment Link Configuration (Admin settings)
  const [customLinks, setCustomLinks] = useState({
    mercadopago: 'https://mpago.la/pos/ariaprop-checkout-latam',
    paypal: 'https://paypal.me/ariaprop/149usd',
    stripe: 'https://checkout.stripe.com/c/pay/ariaprop-enterprise',
    whatsappPay: 'https://wa.me/525512345678?text=Deseo%20pagar%20el%20Plan%20Pro%20Enterprise',
  });

  const [copiedLink, setCopiedLink] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  const activeCurrencyObj = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];
  const activePlan = PLANS.find((p) => p.id === selectedPlanId) || PLANS[1];

  const formattedPrice = (activePlan.priceUsd * activeCurrencyObj.rate).toLocaleString('es-ES', {
    maximumFractionDigits: 0
  });

  const handleCopyLink = (linkUrl: string) => {
    navigator.clipboard.writeText(linkUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleOpenCheckoutWithAuth = (planId: string) => {
    setSelectedPlanId(planId);
    requireAuthForPayment({
      planId,
      onAuthenticated: () => setShowCheckoutModal(true),
    });
  };

  const handleOpenPaymentMethodWithAuth = (method: 'card' | 'mercadopago' | 'paypal' | 'transfer' | 'crypto') => {
    setPaymentMethod(method);
    requireAuthForPayment({
      planId: selectedPlanId,
      onAuthenticated: () => setShowCheckoutModal(true),
    });
  };

  const handleSimulatePayment = () => {
    setPaymentCompleted(true);
    setTimeout(() => {
      setShowCheckoutModal(false);
      setPaymentCompleted(false);
    }, 2500);
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

        {/* Currency Switcher Pill */}
        <div className="bg-black/40 border border-white/10 p-1.5 rounded-2xl flex items-center gap-1 self-start md:self-auto shadow-inner">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Mercado Pago */}
          <button
            onClick={() => handleOpenPaymentMethodWithAuth('mercadopago')}
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

          {/* Credit/Debit Card */}
          <button
            onClick={() => handleOpenPaymentMethodWithAuth('card')}
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

          {/* PayPal */}
          <button
            onClick={() => handleOpenPaymentMethodWithAuth('paypal')}
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

          {/* Transfer Bank SPEI / PSE */}
          <button
            onClick={() => handleOpenPaymentMethodWithAuth('transfer')}
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

          {/* Crypto Binance */}
          <button
            onClick={() => handleOpenPaymentMethodWithAuth('crypto')}
            className={`p-5 rounded-2xl border text-left transition-all space-y-3 cursor-pointer ${
              paymentMethod === 'crypto'
                ? 'bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500'
                : 'bg-black/30 border-white/5 hover:border-white/15'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <UsdtLogo className="h-5" />
              <span className="text-xs font-bold text-yellow-400">USDT</span>
            </div>
            <div>
              <p className="font-bold text-white text-xs">Binance Pay / Crypto</p>
              <p className="text-[10px] text-slate-400">USDT / USDC (TRC20)</p>
            </div>
          </button>
        </div>
      </div>

      {/* Trust & Security Stamps */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-white">Garantía de Reembolso 14 Días</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Devolución completa si no estás satisfecho.</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
          <RefreshCw className="w-8 h-8 text-emerald-400 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-white">Sin Contratos Ni Permanencia</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Cancela o cambia de plan en 1 clic.</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
          <Headphones className="w-8 h-8 text-emerald-400 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-white">Soporte Prioritario VIP 24/7</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Atención directa por WhatsApp y teléfono.</p>
          </div>
        </div>
      </div>

      {/* Admin / Custom Payment Links Box */}
      <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-sm">Configuración de Links de Pago Personalizados</h3>
          </div>
          <span className="px-2.5 py-0.5 rounded text-[10px] bg-white/10 text-slate-300 font-mono">
            Administrador de Enlaces
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Puedes pegar aquí tus propios enlaces de pago (Stripe Checkout, Mercado Pago Link, PayPal Me o enlace de WhatsApp) para que tus clientes se dirijan a tu pasarela directa:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Enlace Mercado Pago Checkout:</label>
            <input
              type="text"
              value={customLinks.mercadopago}
              onChange={(e) => setCustomLinks({ ...customLinks, mercadopago: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Enlace PayPal / Stripe Custom:</label>
            <input
              type="text"
              value={customLinks.paypal}
              onChange={(e) => setCustomLinks({ ...customLinks, paypal: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-2xl">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <span className="text-[10px] uppercase font-extrabold text-emerald-400 tracking-wider">
                  Checkout Seguro - {activePlan.name}
                </span>
                <h3 className="text-lg font-bold text-white">Resumen de Suscripción</h3>
              </div>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="text-slate-400 hover:text-white text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {paymentCompleted ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h4 className="text-xl font-bold text-white">¡Suscripción Activada con Éxito!</h4>
                <p className="text-xs text-slate-300 max-w-xs mx-auto">
                  Tu plan <strong className="text-emerald-400">{activePlan.name}</strong> y tu agente <strong>Aria Prop</strong> están listos para atender a tus clientes.
                </p>
              </div>
            ) : (
              <>
                {/* Order Summary */}
                <div className="bg-black/40 p-4 rounded-2xl space-y-2 border border-white/5 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Plan Seleccionado:</span>
                    <span className="font-bold text-white">{activePlan.name}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Moneda Elegida:</span>
                    <span className="font-bold text-emerald-400">{activeCurrencyObj.flag} {activeCurrencyObj.code}</span>
                  </div>
                  <div className="flex justify-between text-slate-300 pt-2 border-t border-white/5 text-sm">
                    <span className="font-bold text-white">Total a Pagar:</span>
                    <span className="font-extrabold text-emerald-400 font-mono">
                      {activeCurrencyObj.symbol}{formattedPrice} {activeCurrencyObj.code} / mes
                    </span>
                  </div>
                </div>

                {/* Selected Payment Method Details */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3 text-xs">
                  <div className="flex items-center gap-2 text-white font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Método: {paymentMethod === 'mercadopago' ? 'Mercado Pago Checkout' : paymentMethod === 'card' ? 'Tarjeta de Crédito / Débito' : paymentMethod === 'paypal' ? 'PayPal Express' : paymentMethod === 'transfer' ? 'Transferencia Bancaria SPEI / PSE' : 'Binance Pay / USDT'}</span>
                  </div>

                  {paymentMethod === 'transfer' && (
                    <div className="p-3 bg-black/50 rounded-xl space-y-1 font-mono text-[11px] text-slate-300 border border-white/5">
                      <p><strong className="text-emerald-400">Banco:</strong> Banco Santander LATAM</p>
                      <p><strong className="text-emerald-400">CLABE / SPEI (México):</strong> 012180015432987654</p>
                      <p><strong className="text-emerald-400">CBU (Argentina):</strong> 0000003100098765432100</p>
                      <p><strong className="text-emerald-400">Concepto:</strong> Suscripción Aria Prop - {activePlan.name}</p>
                    </div>
                  )}

                  {paymentMethod === 'crypto' && (
                    <div className="p-3 bg-black/50 rounded-xl space-y-1 font-mono text-[11px] text-slate-300 border border-white/5 flex items-center justify-between">
                      <div>
                        <p><strong className="text-yellow-400">Red:</strong> TRC20 (USDT)</p>
                        <p><strong className="text-yellow-400">Wallet:</strong> T9xZ2aPq8R7mK1sL3vN5bY4cW6u</p>
                      </div>
                      <QrCode className="w-10 h-10 text-yellow-400 shrink-0" />
                    </div>
                  )}

                  {/* Payment link preview */}
                  <div className="pt-2">
                    <label className="block text-[11px] text-slate-400 mb-1">Enlace de Pago Generado:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={customLinks.mercadopago}
                        className="flex-1 bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 font-mono text-[10px] text-emerald-400"
                      />
                      <button
                        onClick={() => handleCopyLink(customLinks.mercadopago)}
                        className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedLink ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Modal Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <a
                    href={customLinks.mercadopago}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <span>Abrir Pasarela Directa</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <button
                    onClick={handleSimulatePayment}
                    className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  >
                    <span>Simular Pago Completado</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

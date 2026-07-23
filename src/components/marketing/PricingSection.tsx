import React, { useState } from 'react';
import { AppRoute } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { PricingSwitcher } from '../pricing/PricingSwitcher';
import { FeatureComparisonMatrix } from '../pricing/FeatureComparisonMatrix';
import {
  Check,
  Sparkles,
  Zap,
  ShieldCheck,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  Lock,
  RefreshCw,
  Award,
  Headphones,
  CheckCircle2,
  ArrowRight,
  Globe,
  Wallet,
  ShieldAlert,
  Sliders
} from 'lucide-react';
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

interface PricingSectionProps {
  onRouteChange: (route: AppRoute) => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onRouteChange }) => {
  const [selectedGateway, setSelectedGateway] = useState<string>('all');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const { openAuthModal, requireAuthForPayment } = useAuth();

  const handlePlanSelection = (planId: string = 'pro') => {
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

  const faqs = [
    {
      q: '¿Cómo funciona la prueba gratuita de 7 días?',
      a: 'Tendrás acceso completo a todas las funcionalidades del plan seleccionado sin pagar nada durante 7 días. Puedes cancelar en cualquier momento.',
    },
    {
      q: '¿Qué pasarelas de pago puedo ofrecer a mis clientes?',
      a: 'Soportamos Stripe, Mercado Pago, PayPal Express, transferencias SPEI/PSE y pagos en USDT/USDC.',
    },
    {
      q: '¿Puedo cambiar de plan más adelante?',
      a: 'Sí, puedes hacer upgrade o downgrade de plan en cualquier momento desde tu panel de control.',
    },
  ];

  const paymentMethods = [
    {
      id: 'cards',
      name: 'Tarjetas de Crédito y Débito',
      category: 'global',
      description: 'Visa, Mastercard, American Express y tarjetas locales.',
      speed: 'Procesamiento Instantáneo (0s)',
      currencies: 'USD, MXN, COP, ARS, CLP, EUR',
      icon: (
        <div className="flex items-center gap-2">
          <VisaLogo className="h-5" />
          <MastercardLogo className="h-5" />
          <AmexLogo className="h-4" />
        </div>
      ),
      badge: 'Bancario SSL'
    },
    {
      id: 'mercadopago',
      name: 'Mercado Pago LATAM',
      category: 'latam',
      description: 'Pago seguro en moneda local sin comisiones por tipo de cambio.',
      speed: 'Aprobación Inmediata',
      currencies: '🇲🇽 MXN | 🇦🇷 ARS | 🇨🇴 COP | 🇨🇱 CLP | 🇵🇪 PEN',
      icon: <MercadoPagoLogo className="h-6" />,
      badge: 'Líder LATAM'
    },
    {
      id: 'paypal',
      name: 'PayPal Express',
      category: 'global',
      description: 'Protección al comprador de PayPal en transacciones internacionales.',
      speed: 'Instantáneo',
      currencies: 'USD, EUR y 25+ divisas',
      icon: <PaypalLogo className="h-6" />,
      badge: 'Protección Total'
    },
    {
      id: 'transfer',
      name: 'Transferencia Directa (SPEI / PSE)',
      category: 'latam',
      description: 'Transferencia bancaria directa SPEI (México), PSE (Colombia) y CBU (Argentina).',
      speed: 'Confirmación < 5 min',
      currencies: 'Moneda Local Directa',
      icon: (
        <div className="flex items-center gap-1.5">
          <SpeiLogo />
          <PseLogo />
        </div>
      ),
      badge: 'Sin Tarjeta'
    },
    {
      id: 'crypto',
      name: 'Binance Pay & USDT Crypto',
      category: 'crypto',
      description: 'Pagos descentralizados en USDT (TRC20 / Polygon) y USDC con cero comisiones.',
      speed: 'Confirmación Blockchain (1 min)',
      currencies: 'USDT, USDC, BUSD',
      icon: (
        <div className="flex items-center gap-2">
          <UsdtLogo className="h-6" />
          <span className="text-xs font-bold text-yellow-400">Binance Pay</span>
        </div>
      ),
      badge: 'Web3 & Crypto'
    }
  ];

  const filteredMethods = selectedGateway === 'all'
    ? paymentMethods
    : paymentMethods.filter((m) => m.category === selectedGateway);

  const trustBadges = [
    {
      icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
      title: 'Pago 100% Seguro',
      desc: 'Encriptado bancario SSL de 256 bits a través de pasarelas auditadas PCI-DSS.'
    },
    {
      icon: <RefreshCw className="w-6 h-6 text-emerald-400" />,
      title: 'Garantía 14 Días',
      desc: 'Reembolso sin preguntas si el agente de IA no incrementa tus contactos cualificados.'
    },
    {
      icon: <Award className="w-6 h-6 text-emerald-400" />,
      title: 'Sin Permanencia',
      desc: 'Cancela o cambia de plan en cualquier momento con un solo clic desde tu panel.'
    },
    {
      icon: <Headphones className="w-6 h-6 text-emerald-400" />,
      title: 'Soporte VIP 24/7',
      desc: 'Equipo especializado para asistirte en la puesta en marcha de tu agente Aria.'
    }
  ];

  return (
    <section id="pricing" className="py-24 bg-slate-950 border-t border-white/10 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-bold tracking-wide uppercase shadow-lg shadow-emerald-500/10">
            <Zap className="w-3.5 h-3.5" />
            <span>Suscripciones Transparentes & Pagos Flexibles</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Planes diseñados para acelerar tus ventas
          </h2>
          
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Comienza gratis por 7 días sin requerir tarjeta. Escala a medida que crece tu catálogo e integra las mejores pasarelas de pago de tu región.
          </p>

          {/* Free trial callout badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/[0.04] border border-emerald-500/20 text-xs text-slate-200 shadow-inner">
            <Clock className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span><strong>7 Días de Prueba Gratis</strong> — Registro instantáneo sin tarjeta</span>
          </div>
        </div>

        {/* Dynamic Pricing Switcher & Cards */}
        <PricingSwitcher onRouteChange={onRouteChange} />

        {/* Cloudairy Feature Comparison Matrix */}
        <FeatureComparisonMatrix />

        {/* SECTION 2: ACCEPTED PAYMENT METHODS */}
        <div id="payment-methods" className="rounded-3xl bg-slate-900/60 border border-white/10 p-8 sm:p-12 space-y-10 relative overflow-hidden backdrop-blur-md shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/10 pb-8">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                <Wallet className="w-3.5 h-3.5" />
                <span>Métodos de Pago Aceptados</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Paga de forma fácil y segura en tu moneda local
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm">
                Soportamos las pasarelas de pago más populares de Latinoamérica y el mundo. Transacciones 100% cifradas y acreditación instantánea.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/10">
              <button
                onClick={() => setSelectedGateway('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedGateway === 'all'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setSelectedGateway('latam')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedGateway === 'latam'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🌎 LATAM Local
              </button>
              <button
                onClick={() => setSelectedGateway('global')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedGateway === 'global'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                💳 Tarjeta / Global
              </button>
              <button
                onClick={() => setSelectedGateway('crypto')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedGateway === 'crypto'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🪙 Crypto / USDT
              </button>
            </div>
          </div>

          {/* Payment Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMethods.map((method) => (
              <div
                key={method.id}
                className="rounded-2xl bg-black/40 border border-white/5 hover:border-emerald-500/40 p-6 space-y-4 transition-all duration-300 hover:bg-black/60 group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-white/[0.05] border border-white/10 group-hover:border-emerald-500/30 transition-colors">
                      {method.icon}
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {method.badge}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                      {method.name}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {method.description}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 space-y-2 text-[11px]">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-500">Velocidad:</span>
                    <span className="font-semibold text-emerald-400">{method.speed}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-500">Monedas:</span>
                    <span className="font-mono text-slate-300">{method.currencies}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Direct CTA Bar under Payment Methods */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">¿Listo para probar Aria Prop en tu negocio?</h4>
                <p className="text-xs text-slate-400">Prueba gratuita de 7 días. Selecciona tu plan y método preferido en el checkout.</p>
              </div>
            </div>

            <button
              onClick={() => handlePlanSelection('profesional')}
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              <span>Ir a la Pasarela de Pago</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SECTION 3: TRUST & SECURITY BADGES */}
        <div className="space-y-8">
          <div className="text-center max-w-xl mx-auto">
            <h3 className="text-xl sm:text-2xl font-bold text-white">Garantías de Seguridad y Confianza</h3>
            <p className="text-xs text-slate-400 mt-1">Transacciones protegidas con los máximos estándares de la industria financiera.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trustBadges.map((badge, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition-all text-center space-y-3"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-inner">
                  {badge.icon}
                </div>
                <h4 className="text-sm font-bold text-white">{badge.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{badge.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Accordion Section */}
        <div className="max-w-3xl mx-auto pt-10 border-t border-white/10 space-y-8">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
              <HelpCircle className="w-5 h-5 text-emerald-400" />
              Preguntas Frecuentes sobre Aria Prop
            </h3>
            <p className="text-xs text-slate-400">Resuelve todas tus dudas antes de iniciar tu prueba de 7 días gratis.</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-white/[0.02] border border-white/10 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between text-white font-semibold text-xs sm:text-sm hover:bg-white/5 transition-all cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-emerald-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>
                  {isOpen && (
                    <div className="p-4 pt-0 text-slate-300 text-xs sm:text-sm leading-relaxed border-t border-white/5 bg-black/20">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};

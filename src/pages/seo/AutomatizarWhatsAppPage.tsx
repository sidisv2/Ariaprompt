import React, { useState } from 'react';
import { AppRoute } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { SEO } from '../../components/common/SEO';
import { Header } from '../../components/common/Header';
import { Footer } from '../../components/marketing/Footer';
import {
  MessageSquare,
  Zap,
  CheckCircle2,
  FileText,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Mic,
  Building2,
  ExternalLink,
  Users,
  Clock,
  Database,
  Lock
} from 'lucide-react';

interface SEOPageProps {
  onRouteChange: (route: AppRoute) => void;
  onOpenPrompt?: (prompt: string) => void;
}

export const AutomatizarWhatsAppPage: React.FC<SEOPageProps> = ({
  onRouteChange,
  onOpenPrompt,
}) => {
  const { t } = useLanguage();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: '¿Cómo evita Aria que se pierdan consultas de Zonaprop, Argenprop o Redes?',
      a: 'Cada vez que entra un lead desde portales o campañas de Meta Ads a tu WhatsApp, Aria responde en menos de 10 segundos, califica el presupuesto, envía la ficha técnica y coordina la visita antes de que el usuario busque otra opción.'
    },
    {
      q: '¿Es compatible con la API Oficial de Meta WhatsApp Cloud?',
      a: 'Sí. Aria Prop opera exclusivamente con WhatsApp Cloud API Oficial de Meta. Esto garantiza alta disponibilidad, velocidad extrema y soporte multi-asesor sin riesgo de bloqueos de número.'
    },
    {
      q: '¿Varios asesores pueden atender el mismo número de WhatsApp?',
      a: 'Sí. La arquitectura oficial multi-asesor permite que tu equipo comercial visualice los chats en simultáneo y tome el control cuando sea necesario con solo escribir un mensaje.'
    },
    {
      q: '¿Qué pasa si el cliente envía una nota de voz por WhatsApp?',
      a: 'Aria procesa y transcribe el audio al instante con Gemini 2.5 Flash, entiende requerimientos complejos y responde con precisión técnica inmediata.'
    }
  ];

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        'name': 'Aria Prop - Automatizá el WhatsApp de tu inmobiliaria con la API Oficial de Meta',
        'applicationCategory': 'BusinessApplication',
        'operatingSystem': 'All',
        'url': 'https://ariaprop.online/whatsapp-para-inmobiliarias',
        'image': 'https://ariaprop.online/og-image.jpg',
        'description': 'Automatizá el WhatsApp de tu inmobiliaria con la API Oficial de Meta. Respuesta en menos de 10 segundos, atención 24/7 y multi-asesor.',
        'offers': {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'USD'
        }
      },
      {
        '@type': 'FAQPage',
        'mainEntity': faqs.map((f) => ({
          '@type': 'Question',
          'name': f.q,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': f.a
          }
        }))
      }
    ]
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      <SEO
        title="Automatizá el WhatsApp de tu inmobiliaria con la API Oficial de Meta | Aria Prop"
        description="Respuesta en menos de 10 segundos para consultas de Zonaprop, Argenprop y Redes. Atención 24/7, comprensión de audios y WhatsApp multi-asesor con Aria Prop."
        url="https://ariaprop.online/whatsapp-para-inmobiliarias"
        image="https://ariaprop.online/og-image.jpg"
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
      />

      <Header currentRoute="soluciones" onRouteChange={onRouteChange} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-20">
        
        {/* 1. Hero Section */}
        <section className="text-center max-w-4xl mx-auto space-y-6 pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/10">
            <Smartphone className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>WhatsApp Cloud API Oficial de Meta</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
            Automatizá el WhatsApp de tu inmobiliaria con la{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">
              API Oficial de Meta
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-3xl mx-auto">
            Responde en menos de 10 segundos cada consulta de Zonaprop, Argenprop y Redes Sociales. Atención 24/7, soporte multi-asesor y sincronización directa con tu catálogo de propiedades.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onRouteChange('dashboard-checkout')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-105"
            >
              <Sparkles className="w-5 h-5 fill-slate-950 text-slate-950" />
              <span>Comenzar prueba gratis de 14 días</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          <p className="text-xs text-slate-400 font-medium">
            Sin contratos forzosos · Configuración en 15 minutos · Sin comisiones por venta
          </p>
        </section>

        {/* 2. Interactive WhatsApp Simulator */}
        <section className="max-w-md mx-auto">
          <div className="rounded-3xl bg-slate-950 border border-emerald-500/40 p-4 shadow-2xl shadow-emerald-500/10 relative">
            <div className="border-b border-white/10 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs border border-emerald-500/30">
                    AP
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-slate-950" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-xs flex items-center gap-1.5">
                    WhatsApp Inmobiliaria
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">META API</span>
                  </h3>
                  <p className="text-[10px] text-emerald-400 font-semibold">🟢 Respuesta en &lt; 10s · 24/7</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-3 text-xs">
              <div className="flex justify-end">
                <div className="bg-emerald-600 text-slate-950 font-medium rounded-2xl rounded-tr-none px-3.5 py-2.5 max-w-[90%] shadow-md">
                  <p className="leading-snug">Hola, vi la casa en Belgrano en Zonaprop. ¿Tienen el plano y las expensas?</p>
                  <span className="text-[9px] text-slate-950/70 block text-right mt-1 font-mono">14:32</span>
                </div>
              </div>

              <div className="flex justify-start">
                <div className="bg-slate-900 border border-white/10 text-slate-200 rounded-2xl rounded-tl-none p-3 max-w-[95%] shadow-md space-y-2.5">
                  <p className="leading-relaxed">
                    ¡Hola! Sí, acá tenés la ficha técnica verificada de la propiedad en Belgrano R:
                  </p>
                  <div className="rounded-xl bg-slate-950 border border-emerald-500/30 p-2.5 flex items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-white text-xs">Casa 4 Amb · 210m²</div>
                      <div className="text-[10px] text-emerald-400 font-semibold">USD 320.000 · Expensas $0</div>
                    </div>
                    <span className="px-2 py-1 rounded bg-emerald-500 text-slate-950 font-bold text-[10px]">
                      Ficha PDF
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-500 block text-right font-mono">14:32 · Respuesta en 6s</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Three Key Pillars */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-white">Respuesta en menos de 10s</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Atiende al instante las consultas que entran desde Zonaprop, Argenprop, Instagram Ads y Google, evitando que el cliente consulte a la competencia.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-white">Multi-Asesor Simultáneo</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Tus corredores pueden responder desde el mismo número oficial en cualquier momento, con asignación inteligente de leads y pausas automáticas del bot.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-white">Infraestructura Oficial Meta</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Sin emuladores QR ni soluciones no oficiales propensas a bloqueos. Conexión 100% oficial Cloud API con cifrado TLS y alta disponibilidad 24/7.
            </p>
          </div>
        </section>

        {/* 4. FAQ Section */}
        <section className="space-y-6 max-w-4xl mx-auto pt-8 border-t border-white/10">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Preguntas Frecuentes</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Dudas comunes sobre WhatsApp Oficial para Inmobiliarias
            </h2>
          </div>

          <div className="space-y-3 pt-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-slate-900/80 border border-white/10 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  className="w-full p-5 text-left font-bold text-white text-sm flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {openFaqIndex === idx ? <ChevronUp className="w-5 h-5 text-emerald-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />}
                </button>
                {openFaqIndex === idx && (
                  <div className="p-5 pt-0 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/5 bg-slate-950/40">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 5. Bottom Call to Action */}
        <section className="p-8 sm:p-12 rounded-3xl bg-slate-900 border border-emerald-500/30 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Empezá a responder en segundos hoy mismo
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl mx-auto">
            Configurá tu asistente de WhatsApp con la API Oficial de Meta y no pierdas ni un solo interesado más.
          </p>
          <button
            onClick={() => onRouteChange('dashboard-checkout')}
            className="px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition-all inline-flex items-center gap-2 cursor-pointer hover:scale-105"
          >
            <Sparkles className="w-4 h-4 fill-slate-950 text-slate-950" />
            <span>Comenzar prueba gratis de 14 días ➔</span>
          </button>
        </section>

      </main>

      <Footer onRouteChange={onRouteChange} />
    </div>
  );
};

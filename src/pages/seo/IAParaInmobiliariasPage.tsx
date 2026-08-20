import React, { useState } from 'react';
import { AppRoute } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { SEO } from '../../components/common/SEO';
import { Header } from '../../components/common/Header';
import { Footer } from '../../components/marketing/Footer';
import {
  Sparkles,
  Zap,
  CheckCircle2,
  Clock,
  Calendar,
  Building2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  MessageSquare
} from 'lucide-react';

interface SEOPageProps {
  onRouteChange: (route: AppRoute) => void;
  onOpenPrompt?: (prompt: string) => void;
}

export const IAParaInmobiliariasPage: React.FC<SEOPageProps> = ({
  onRouteChange,
  onOpenPrompt,
}) => {
  const { t } = useLanguage();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: '¿Cómo ayuda la Inteligencia Artificial a una inmobiliaria en el día a día?',
      a: 'La IA de Aria Prop actúa como un asesor comercial 24/7. Responde dudas sobre precios, m², ubicación y características de tus inmuebles en WhatsApp y Web en menos de 5 segundos, cualifica el presupuesto del cliente y agenda la visita presencial directamente en tu calendario.'
    },
    {
      q: '¿La IA puede inventar datos sobre mis propiedades?',
      a: 'No. Aria Prop utiliza arquitectura RAG (Retrieval-Augmented Generation) estricta, lo que significa que solo consulta tu catálogo verificado (Tokko, EasyBroker o PDFs autorizados). Nunca inventará precios, disponibilidad ni características.'
    },
    {
      q: '¿Qué ocurre si un comprador hace una pregunta compleja o negociación?',
      a: 'Aria detecta automáticamente la necesidad de intervención humana y deriva el chat al WhatsApp del corredor asignado con la ficha del lead ya calificado.'
    },
    {
      q: '¿Cuánto tiempo lleva implementar la IA en mi inmobiliaria?',
      a: 'La integración se realiza en menos de 15 minutos mediante API Key oficial de WhatsApp o subiendo tus fichas técnicas directas. No requiere conocimientos de programación.'
    }
  ];

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        'name': 'Aria Prop - Agente de IA para Inmobiliarias',
        'applicationCategory': 'BusinessApplication',
        'operatingSystem': 'All',
        'url': 'https://ariaprop.online/ia-para-inmobiliarias',
        'description': 'Plataforma de Inteligencia Artificial para inmobiliarias que cualifica compradores y agenda visitas automáticas 24/7.',
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
        title="IA para Inmobiliarias | Agente Comercial 24/7 | Aria Prop"
        description="Descubre cómo la Inteligencia Artificial ayuda a tu inmobiliaria a atender consultas 24/7 en WhatsApp, cualificar compradores por presupuesto y agendar más visitas."
        url="https://ariaprop.online/ia-para-inmobiliarias"
      />

      {/* JSON-LD Rich Snippet */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
      />

      <Header currentRoute="soluciones" onRouteChange={onRouteChange} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        
        {/* Hero Section */}
        <section className="text-center max-w-4xl mx-auto space-y-6 pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/10">
            <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Guía Estratégica B2B • PropTech IA</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
            IA para Inmobiliarias:{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">
              Cómo Convertir Más Consultas en Visitas Reales
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-3xl mx-auto">
            El 68% de las consultas inmobiliarias se realizan fuera del horario comercial. Las agencias que responden en menos de 5 minutos aumentan sus probabilidades de cierre en un 395%. Descubre cómo automatizar tu catálogo sin perder el trato humano.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => {
                if (onOpenPrompt) onOpenPrompt('Hola, me gustaría ver cómo funciona la IA para mi catálogo de propiedades.');
                else onRouteChange('app');
              }}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-105"
            >
              <Sparkles className="w-5 h-5 fill-slate-950 text-slate-950" />
              <span>Probar IA con mi Catálogo ➔</span>
            </button>

            <button
              onClick={() => onRouteChange('catalog')}
              className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-200 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>Explorar Catálogo Público</span>
            </button>
          </div>
        </section>

        {/* 4 Pillars of AI Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-3 hover:border-emerald-500/40 transition-colors shadow-xl">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-white">Respuesta en &lt; 5 seg</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Atención 24/7 en WhatsApp y Web. Muestra fichas técnicas completas sin hacer esperar al prospecto.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-3 hover:border-emerald-500/40 transition-colors shadow-xl">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-white">Cualificación RAG</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Filtra curiosos analizando presupuesto, zona deseada y urgencia de mudanza antes de coordinar la visita.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-3 hover:border-emerald-500/40 transition-colors shadow-xl">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-white">Agenda Automática</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Reserva horarios disponibles en Google Calendar e integra avisos al WhatsApp de tu corredor asignado.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-3 hover:border-emerald-500/40 transition-colors shadow-xl">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-white">Datos 100% Reales</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sin alucinaciones. Respuestas respaldadas por la información real cargada en tu CRM o fichas técnicas.
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="space-y-6 max-w-4xl mx-auto pt-8 border-t border-white/10">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Preguntas Frecuentes</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Todo lo que necesitas saber sobre IA Inmobiliaria
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
                  <div className="p-5 pt-0 text-xs text-slate-300 leading-relaxed border-t border-white/5 bg-slate-950/40">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-emerald-500/30 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Comienza a Agendar Visitas 24/7 Hoy Mismo
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl mx-auto">
            Activa el agente comercial IA de Aria Prop en menos de 15 minutos sin necesidad de tarjeta de crédito.
          </p>
          <button
            onClick={() => onRouteChange('app')}
            className="px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition-all inline-flex items-center gap-2 cursor-pointer hover:scale-105"
          >
            <Sparkles className="w-4 h-4 fill-slate-950 text-slate-950" />
            <span>Probar Gratis Ahora ➔</span>
          </button>
        </section>

      </main>

      <Footer onRouteChange={onRouteChange} />
    </div>
  );
};

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
  MessageSquare,
  Mic,
  Database,
  Search,
  ExternalLink
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
      q: '¿Cómo busca la IA dentro de mi catálogo de propiedades?',
      a: 'Aria Prop utiliza búsqueda semántica e indexación vectorial (RAG). Entiende intenciones complejas como "busco un 3 ambientes luminoso cerca de colegios en Belgrano con cochera" y encuentra las unidades exactas de tu inventario en segundos.'
    },
    {
      q: '¿Cómo procesa las notas de voz de los clientes?',
      a: 'Aria integra Gemini 2.5 Flash Multimodal. Descarga el audio de WhatsApp, lo transcribe al instante, comprende preguntas con modismos locales y responde de inmediato con las opciones que mejor se ajustan.'
    },
    {
      q: '¿La IA califica a los interesados antes de pasarlos a un asesor?',
      a: 'Sí. Aria pregunta y valida presupuesto disponible, método de pago (contado o crédito), urgencia de mudanza y zona deseada, entregando al asesor humano un lead 100% precalificado.'
    },
    {
      q: '¿La IA puede inventar datos de las propiedades?',
      a: 'No. Aria opera con arquitectura RAG estricta y anclaje a tus fichas técnicas o CRM (Tokko, EasyBroker). Si un dato no está en el catálogo, indica con precisión que consultará con el equipo comercial.'
    }
  ];

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        'name': 'Aria Prop - Una Inteligencia Artificial que conoce tu catálogo real de propiedades',
        'applicationCategory': 'BusinessApplication',
        'operatingSystem': 'All',
        'url': 'https://ariaprop.online/ia-para-inmobiliarias',
        'image': 'https://ariaprop.online/og-image.jpg',
        'description': 'Búsqueda semántica sobre tu inventario de propiedades, comprensión de notas de voz con Gemini 2.5 Flash y calificación comercial de interesados.',
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
        title="Una Inteligencia Artificial que conoce tu catálogo real de propiedades | Aria Prop"
        description="Búsqueda semántica sobre tu inventario, comprensión de notas de voz con Gemini 2.5 Flash y calificación comercial de compradores para tu inmobiliaria."
        url="https://ariaprop.online/ia-para-inmobiliarias"
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
            <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Motor RAG Inmobiliario + Gemini 2.5 Flash</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
            Una Inteligencia Artificial que conoce tu{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">
              catálogo real de propiedades
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-3xl mx-auto">
            Búsqueda semántica instantánea sobre tu inventario, transcripción y comprensión de notas de voz con Gemini 2.5 Flash y calificación automática de presupuesto y compradores interesados.
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
            Sincronización Tokko Broker & EasyBroker · Sin comisiones de venta · Cero alucinaciones
          </p>
        </section>

        {/* 2. Interactive Voice & Catalog Simulation */}
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
                    Aria · Motor RAG Inmobiliario
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">IA REAL</span>
                  </h3>
                  <p className="text-[10px] text-emerald-400 font-semibold">🟢 Catálogo Sincronizado · 24/7</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-3 text-xs">
              {/* Voice Note Simulation */}
              <div className="flex justify-end">
                <div className="bg-emerald-600 text-slate-950 font-medium rounded-2xl rounded-tr-none p-3 max-w-[90%] shadow-md space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-950/20 flex items-center justify-center">
                      <Mic className="w-4 h-4 text-slate-950" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="h-2 w-full bg-slate-950/20 rounded-full overflow-hidden flex items-center px-1 gap-0.5">
                        <span className="h-2.5 w-1 bg-slate-950 rounded-full animate-pulse" />
                        <span className="h-1.5 w-1 bg-slate-950 rounded-full" />
                        <span className="h-3 w-1 bg-slate-950 rounded-full animate-pulse" />
                        <span className="h-2 w-1 bg-slate-950 rounded-full" />
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-950/80 font-mono">
                        <span>0:18</span>
                        <span>Audio del interesado</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-950/10 rounded-lg p-1.5 text-[10px] italic border border-black/5">
                    🎙️ "Hola, buscamos casa en country con pileta hasta 280 mil dólares, ¿qué tienen disponible?"
                  </div>
                </div>
              </div>

              {/* Instant Semantic Search & Filter */}
              <div className="flex justify-start">
                <div className="bg-slate-900 border border-emerald-500/30 text-slate-200 rounded-2xl rounded-tl-none p-3 max-w-[95%] shadow-md space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold">
                    <Sparkles className="w-3 h-3 fill-current" />
                    <span>Audio procesado con Gemini 2.5 Flash</span>
                  </div>
                  <p className="leading-snug">
                    ¡Excelente! Encontré 2 casas que cumplen con tus requisitos en Barrio Privado Los Sauces:
                  </p>
                  <div className="rounded-xl bg-slate-950 border border-emerald-500/30 p-2.5 space-y-1">
                    <div className="font-bold text-white text-xs">Casa en Los Sauces · 4 Amb con Piscina</div>
                    <div className="text-[10px] text-emerald-400 font-semibold">USD 265.000 · Lote 800m²</div>
                    <span className="inline-block mt-1 text-[9px] bg-emerald-500 text-slate-950 font-bold px-2 py-0.5 rounded">
                      Ficha PDF Enviada
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-500 block text-right font-mono">14:35 · Calificación Comercial</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Three Key Capabilities */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-white">Búsqueda Semántica RAG</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              No requiere palabras clave exactas. La IA entiende intenciones, zonas de interés, amenities y presupuestos sobre tu inventario real.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Mic className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-white">Comprensión de Notas de Voz</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Transcribe y comprende audios con Gemini 2.5 Flash, extrayendo parámetros clave para responder al cliente y guardarlos en tu CRM.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-white">Calificación Comercial</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Filtra y clasifica a los compradores por capacidad económica, urgencia y tipo de operación antes de coordinar la visita presencial.
            </p>
          </div>
        </section>

        {/* 4. FAQ Section */}
        <section className="space-y-6 max-w-4xl mx-auto pt-8 border-t border-white/10">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Preguntas Frecuentes</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Dudas comunes sobre la IA Inmobiliaria de Aria
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

        {/* 5. Bottom CTA Banner */}
        <section className="p-8 sm:p-12 rounded-3xl bg-slate-900 border border-emerald-500/30 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Conectá tu catálogo a la IA de Aria hoy mismo
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl mx-auto">
            Activá tu asistente comercial inteligente en 15 minutos y empezá a agendar visitas con prospectos calificados.
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

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
  XCircle,
  Building2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldCheck,
  Scale,
  Calendar,
  MessageSquare,
  Bot,
  UserCheck
} from 'lucide-react';

interface SEOPageProps {
  onRouteChange: (route: AppRoute) => void;
  onOpenPrompt?: (prompt: string) => void;
}

export const ChatbotVsAgentePage: React.FC<SEOPageProps> = ({
  onRouteChange,
  onOpenPrompt,
}) => {
  const { t } = useLanguage();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: '¿Por qué los chatbots con menús rígidos pierden clientes inmobiliarios?',
      a: 'Porque los compradores buscan respuestas directas ("¿Acepta permuta?", "¿Tiene balcón corrido?"). Los menús numéricos ("Presione 1 para Ventas") frustran al usuario y provocan el abandono inmediato de la conversación.'
    },
    {
      q: '¿Cómo funciona la derivación inteligente a asesores humanos?',
      a: 'Aria detecta cuando un prospecto está calificado con presupuesto y listo para visitar, o cuando hace una propuesta de oferta/negociación. En ese instante envía la alerta con el resumen completo al WhatsApp del corredor a cargo.'
    },
    {
      q: '¿Aria puede agendar las visitas directamente en Google Calendar?',
      a: 'Sí. Aria valida disponibilidad en tiempo real, propone los días y horarios que mejor se adapten al comprador y al asesor, y confirma la cita automáticamente.'
    },
    {
      q: '¿Se requiere reemplazar mi software o CRM actual?',
      a: 'No. Aria se integra con Tokko Broker, EasyBroker o tu inventario existente sin alterar tus operaciones diarias.'
    }
  ];

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        'name': 'Aria Prop - El fin de los chatbots rígidos: Asistentes comerciales con IA para inmobiliarias',
        'applicationCategory': 'BusinessApplication',
        'operatingSystem': 'All',
        'url': 'https://ariaprop.online/chatbot-inmobiliario',
        'image': 'https://ariaprop.online/og-image.jpg',
        'description': 'Conversaciones naturales vs menús de opciones antiguos, agendamiento de visitas y derivación inteligente para inmobiliarias.',
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
        title="El fin de los chatbots rígidos: Asistentes comerciales con IA para inmobiliarias | Aria Prop"
        description="Comparativa real: Conversaciones naturales vs menús de opciones antiguos. Agendamiento de visitas automático y derivación inteligente a tus corredores."
        url="https://ariaprop.online/chatbot-inmobiliario"
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
            <Scale className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Chatbots de Opciones vs. Asistentes IA</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
            El fin de los chatbots rígidos:{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">
              Asistentes comerciales con IA para inmobiliarias
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-3xl mx-auto">
            Decile adiós a los molestos menús con opciones ("Presione 1 para Ventas"). Aria conversa de forma 100% natural, resuelve dudas complejas de tu inventario, agenda visitas y deriva leads calificados a tus asesores.
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
            Respuestas instantáneas · Agendado en Google Calendar · Derivación inteligente
          </p>
        </section>

        {/* 2. Interactive Comparison Visualizer */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          
          {/* Chatbot Antiguo */}
          <div className="rounded-3xl bg-slate-900/60 border border-rose-500/30 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <Bot className="w-5 h-5" />
                <span>Chatbot Antiguo con Menús</span>
              </div>
              <span className="text-[10px] bg-rose-500/20 text-rose-300 font-mono px-2 py-0.5 rounded">RÍGIDO</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-2xl border border-white/5 space-y-1 text-slate-400">
                <p>🤖 "Hola, seleccione una opción:</p>
                <p>1️⃣ Comprar propiedad</p>
                <p>2️⃣ Alquilar</p>
                <p>3️⃣ Hablar con un asesor"</p>
              </div>
              <div className="p-3 bg-rose-950/40 rounded-2xl border border-rose-500/20 text-rose-300 text-xs">
                ❌ <strong>El cliente pregunta:</strong> "¿Tienen dúplex en Colegiales que acepte mascotas?" <br />
                ⚠️ <strong>Error:</strong> "Opción no válida. Por favor ingrese 1, 2 o 3."
              </div>
            </div>
          </div>

          {/* Asistente IA Aria */}
          <div className="rounded-3xl bg-slate-900/90 border border-emerald-500/40 p-6 space-y-4 shadow-xl shadow-emerald-500/10">
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Sparkles className="w-5 h-5" />
                <span>Asistente Comercial con IA (Aria)</span>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded font-bold">100% NATURAL</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-emerald-950/40 rounded-2xl border border-emerald-500/30 text-emerald-200 space-y-1.5">
                <p>💬 <strong>Cliente:</strong> "¿Tienen dúplex en Colegiales que acepte mascotas?"</p>
                <p className="text-white">✨ <strong>Aria:</strong> "¡Hola! Sí, tenemos un dúplex de 3 ambientes sobre Crámer con terraza propia donde se aceptan mascotas. ¿Te gustaría que te envíe el PDF con fotos y expensas?"</p>
              </div>
              <div className="flex items-center justify-between text-[11px] text-emerald-400 font-semibold px-2">
                <span>✓ Comprende lenguaje natural</span>
                <span>✓ Agenda visita en Calendar</span>
              </div>
            </div>
          </div>

        </section>

        {/* 3. Detailed Comparison Table */}
        <section className="space-y-8 max-w-5xl mx-auto">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Comparativa Técnica</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              ¿Por qué las inmobiliarias modernas eligen Asistentes IA?
            </h2>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-white/10 shadow-2xl">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-slate-900">
                  <th className="p-4 font-extrabold text-white w-1/3">Capacidad Comercial</th>
                  <th className="p-4 font-extrabold text-rose-400 w-1/3">Chatbot Tradicional</th>
                  <th className="p-4 font-extrabold text-emerald-400 w-1/3">Asistente IA (Aria Prop)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-slate-950/60">
                <tr>
                  <td className="p-4 font-semibold text-slate-200">Comprensión de Mensajes</td>
                  <td className="p-4 text-rose-300 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Menús rígidos ("Marque 1, 2 o 3")</span>
                  </td>
                  <td className="p-4 text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Conversación fluida y natural</span>
                  </td>
                </tr>

                <tr>
                  <td className="p-4 font-semibold text-slate-200">Búsqueda de Inmuebles</td>
                  <td className="p-4 text-rose-300 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Links estáticos genéricos</span>
                  </td>
                  <td className="p-4 text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Consulta en tiempo real catálogo real</span>
                  </td>
                </tr>

                <tr>
                  <td className="p-4 font-semibold text-slate-200">Envío de Fichas PDF</td>
                  <td className="p-4 text-rose-300 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>No disponible o manual</span>
                  </td>
                  <td className="p-4 text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Envío automático de PDF y fotos</span>
                  </td>
                </tr>

                <tr>
                  <td className="p-4 font-semibold text-slate-200">Agendado de Visitas</td>
                  <td className="p-4 text-rose-300 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Solo captura número de teléfono</span>
                  </td>
                  <td className="p-4 text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Reserva directa en Google Calendar</span>
                  </td>
                </tr>

                <tr>
                  <td className="p-4 font-semibold text-slate-200">Derivación Inteligente</td>
                  <td className="p-4 text-rose-300 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Transfiere sin contexto comercial</span>
                  </td>
                  <td className="p-4 text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Avisa al asesor con ficha del lead lista</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. FAQ Section */}
        <section className="space-y-6 max-w-4xl mx-auto pt-8 border-t border-white/10">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Preguntas Frecuentes</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Preguntas comunes sobre Asistentes IA vs. Chatbots
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

        {/* 5. Bottom Banner */}
        <section className="p-8 sm:p-12 rounded-3xl bg-slate-900 border border-emerald-500/30 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Evoluciona tu Inmobiliaria al Siguiente Nivel
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl mx-auto">
            Prueba Aria Prop gratis hoy mismo y experimenta conversaciones 100% comerciales que agendan visitas reales.
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

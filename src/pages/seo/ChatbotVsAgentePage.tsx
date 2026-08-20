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
  Scale
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
      q: '¿Por qué los compradores abandonan las conversaciones con los chatbots tradicionales?',
      a: 'Porque los chatbots tradicionales obligan al usuario a navegar por menús numéricos rígidos (ej: "Presione 1 para Ventas, 2 para Alquileres"). Si el comprador realiza una pregunta abierta ("¿Tiene balcón y acepta mascotas?"), el chatbot falla y responde con un error genérico.'
    },
    {
      q: '¿Cómo entiende el Agente de IA de Aria Prop las preguntas abiertas?',
      a: 'Utiliza modelos de lenguaje natural (LLM) combinados con motor RAG (Retrieval-Augmented Generation). Lee e interpreta el contexto completo de la pregunta del cliente y busca las respuestas exactas en la ficha técnica de tus propiedades.'
    },
    {
      q: '¿Es más caro un Agente Comercial con IA que un Chatbot tradicional?',
      a: 'No. Gracias a la infraestructura optimizada de Aria Prop, el costo por conversación es sumamente accesible y se recupera con la primera visita agendada o venta concretada.'
    }
  ];

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        'headline': 'Chatbot Inmobiliario Tradicional vs. Agente Comercial con IA',
        'description': 'Comparativa detallada entre chatbots con menús rígidos y agentes comerciales con Inteligencia Artificial para el sector inmobiliario.',
        'image': 'https://ariaprop.online/og-image.jpg',
        'screenshot': 'https://ariaprop.online/og-image.jpg',
        'mainEntityOfPage': {
          '@type': 'WebPage',
          '@id': 'https://ariaprop.online/chatbot-vs-agente-ia'
        },
        'publisher': {
          '@type': 'Organization',
          'name': 'Aria Prop',
          'url': 'https://ariaprop.online'
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
        title="Chatbot Inmobiliario vs Agente IA | Comparativa | Aria Prop"
        description="Descubre las diferencias entre un chatbot tradicional de menús rígidos y un Agente Comercial de IA que comprende lenguaje natural y cualifica presupuesto."
        url="https://ariaprop.online/chatbot-vs-agente-ia"
        image="https://ariaprop.online/og-image.jpg"
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
      />

      <Header currentRoute="soluciones" onRouteChange={onRouteChange} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        
        {/* Hero Section */}
        <section className="text-center max-w-4xl mx-auto space-y-6 pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/10">
            <Scale className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Análisis Comparativo B2B</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
            Chatbot Inmobiliario Tradicional vs.{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">
              Agente Comercial con IA
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-3xl mx-auto">
            ¿Por qué los menús de botones y las opciones numéricas hacen perder clientes en WhatsApp? Analizamos por qué el 82% de las inmobiliarias está migrando de chatbots rígidos a agentes comerciales conversacionales con Inteligencia Artificial.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => {
                if (onOpenPrompt) onOpenPrompt('Hola, quisiera comparar cómo responde un Agente de IA versus un chatbot de menús.');
                else onRouteChange('app');
              }}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-105"
            >
              <Sparkles className="w-5 h-5 fill-slate-950 text-slate-950" />
              <span>Probar Agente Comercial IA ➔</span>
            </button>

            <button
              onClick={() => onRouteChange('catalog')}
              className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-200 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>Explorar Catálogo Conectado</span>
            </button>
          </div>
        </section>

        {/* Detailed Comparison Table */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Matriz de Diferencias</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Tabla Comparativa de Capacidades
            </h2>
          </div>

          <div className="overflow-x-auto pt-4">
            <table className="w-full border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-slate-900">
                  <th className="p-4 font-extrabold text-white w-1/3">Capacidad Comercial</th>
                  <th className="p-4 font-extrabold text-rose-400 w-1/3">Chatbot Tradicional</th>
                  <th className="p-4 font-extrabold text-emerald-400 w-1/3">Agente IA (Aria Prop)</th>
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
                    <span>Lenguaje natural conversacional</span>
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
                    <span>Consulta en tiempo real (Tokko/EasyBroker)</span>
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
                  <td className="p-4 font-semibold text-slate-200">Cualificación de Presupuesto</td>
                  <td className="p-4 text-rose-300 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Inexistente (mezcla todos los contactos)</span>
                  </td>
                  <td className="p-4 text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Análisis automático de zona y urgencia</span>
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
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="space-y-6 max-w-4xl mx-auto pt-8 border-t border-white/10">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Preguntas Frecuentes</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Preguntas comunes sobre Agentes de IA vs. Chatbots
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

        {/* Bottom Banner */}
        <section className="p-8 sm:p-12 rounded-3xl bg-slate-900 border border-emerald-500/30 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Evoluciona tu Inmobiliaria al Siguiente Nivel
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl mx-auto">
            Prueba Aria Prop gratis hoy mismo y experimenta la diferencia en cualificación de leads.
          </p>
          <button
            onClick={() => onRouteChange('app')}
            className="px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition-all inline-flex items-center gap-2 cursor-pointer hover:scale-105"
          >
            <Sparkles className="w-4 h-4 fill-slate-950 text-slate-950" />
            <span>Probar Agente IA Gratis ➔</span>
          </button>
        </section>

      </main>

      <Footer onRouteChange={onRouteChange} />
    </div>
  );
};

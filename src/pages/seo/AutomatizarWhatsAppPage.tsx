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
  Smartphone
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
      q: '¿Es compatible con la API Oficial de Meta WhatsApp Cloud?',
      a: 'Sí. Aria Prop se conecta directamente con WhatsApp Cloud API (Meta Official Partner), lo que garantiza el cumplimiento de políticas de Meta, evitando bloqueos y permitiendo alta velocidad de envío.'
    },
    {
      q: '¿Puede enviar fichas PDF o fotos directamente en el chat?',
      a: 'Por supuesto. Cuando el interesado consulta por una propiedad, Aria le adjunta la ficha técnica completa en formato PDF y la galería de fotos verificada directamente en la conversación de WhatsApp.'
    },
    {
      q: '¿Qué ocurre si el usuario solicita agendar una visita?',
      a: 'Aria le ofrece los horarios disponibles según tu Google Calendar, coordina el día y hora preferidos, confirma la reserva y envía la notificación al WhatsApp del corredor a cargo.'
    },
    {
      q: '¿Mis asesores pueden intervenir en el chat de WhatsApp cuando quieran?',
      a: 'Sí. En todo momento el equipo humano puede tomar el control del chat desde la bandeja de entrada unificada de Aria o desde la app oficial de WhatsApp Business.'
    }
  ];

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        'name': 'Aria Prop - Automatización de WhatsApp Inmobiliario',
        'applicationCategory': 'BusinessApplication',
        'operatingSystem': 'All',
        'url': 'https://ariaprop.online/automatizar-whatsapp-inmobiliaria',
        'image': 'https://ariaprop.online/og-image.jpg',
        'screenshot': 'https://ariaprop.online/og-image.jpg',
        'description': 'Automatiza WhatsApp para inmobiliarias con IA: envía fichas técnicas en PDF, cualifica compradores y coordina visitas presenciales.',
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
        title="Automatizar WhatsApp para Inmobiliarias | Aria Prop"
        description="Aprende a automatizar el WhatsApp de tu inmobiliaria con IA oficial de Meta. Envía fichas técnicas PDF, cualifica prospectos y agenda visitas 24/7."
        url="https://ariaprop.online/automatizar-whatsapp-inmobiliaria"
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
            <Smartphone className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>WhatsApp Business Official Cloud API</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
            Cómo Automatizar el WhatsApp de tu Inmobiliaria{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">
              sin Perder Leads
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-3xl mx-auto">
            Descubre el método paso a paso para conectar tu catálogo de inmuebles a WhatsApp Cloud API. Entrega fichas PDF al instante, filtra interesados sin presupuesto y sincroniza visitas presenciales en Google Calendar.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => {
                if (onOpenPrompt) onOpenPrompt('Hola, quisiera ver una demostración de automatización de WhatsApp.');
                else onRouteChange('app');
              }}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-105"
            >
              <Sparkles className="w-5 h-5 fill-slate-950 text-slate-950" />
              <span>Ver Demo en WhatsApp ➔</span>
            </button>

            <button
              onClick={() => onRouteChange('catalog')}
              className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-200 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Ver Ejemplo de Ficha PDF</span>
            </button>
          </div>
        </section>

        {/* Feature Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="p-8 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white">Fichas PDF Automatizadas</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Responde a cada consulta adjuntando el dossier técnico de la propiedad en PDF con planos, fotos y expensas exactas.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white">Visitas en tu Agenda</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Coordina el día y horario de inspección presencial directamente en la agenda del asesor sin ida y vuelta de mensajes.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white">Derivación a Asesor Humano</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Cuando el prospecto está listo para realizar una oferta o negociación, Aria transfiere la conversación al WhatsApp del corredor.
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="space-y-6 max-w-4xl mx-auto pt-8 border-t border-white/10">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Preguntas Frecuentes</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Dudas comunes sobre automatización de WhatsApp
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
            Conecta tu WhatsApp a la IA de Aria Prop
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl mx-auto">
            Configuración guiada en 15 minutos sin interrumpir tus chats actuales.
          </p>
          <button
            onClick={() => onRouteChange('app')}
            className="px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition-all inline-flex items-center gap-2 cursor-pointer hover:scale-105"
          >
            <Sparkles className="w-4 h-4 fill-slate-950 text-slate-950" />
            <span>Probar Gratis (3 Consultas) ➔</span>
          </button>
        </section>

      </main>

      <Footer onRouteChange={onRouteChange} />
    </div>
  );
};

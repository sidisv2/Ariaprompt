import React, { useState } from 'react';
import { Search, ChevronDown, HelpCircle, Sparkles } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const FAQ: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { lang } = useLanguage();

  const faqsEs = [
    {
      q: '¿Cómo funciona la lectura RAG de dossiers y documentos PDF?',
      a: 'Aria Prop procesa automáticamente tus documentos (dossiers en PDF, especificaciones técnicas, planos o archivos Excel). Extrae los datos relevantes (metrajes, precios, distribución) y los utiliza para responder preguntas de los clientes en tiempo real con total precisión.',
      cat: 'RAG & Documentos',
    },
    {
      q: '¿Puedo personalizar la voz y tono del agente para mi agencia?',
      a: 'Sí. Puedes definir el nombre de tu asistente, foto de perfil, mensaje de bienvenida, tono (profesional, amigable, de lujo o directo) e instrucciones personalizadas para adaptar la interacción a la personalidad de tu marca.',
      cat: 'General',
    },
    {
      q: '¿Cómo se agendan las visitas virtuales y presenciales?',
      a: 'Aria evalúa el interés del lead y, al detectar intención de compra o alquiler, propone automáticamente horarios de visita según la disponibilidad de tu equipo y recopila el teléfono y correo del prospecto.',
      cat: 'General',
    },
    {
      q: '¿Es posible conectar Aria Prop a mi cuenta de WhatsApp Business?',
      a: 'Sí. Los planes Pro Enterprise y Custom incluyen integración nativa con la API oficial de WhatsApp Business para responder consultas en automático a través de WhatsApp.',
      cat: 'Integraciones',
    },
    {
      q: '¿Qué pasarelas de pago están disponibles para la suscripción?',
      a: 'Aceptamos tarjetas de crédito/débito internacionales via Stripe, Mercado Pago para Latinoamérica (MXN, COP, ARS, CLP, PEN), PayPal Express y transferencias bancarias locales (SPEI/PSE).',
      cat: 'Planes & Pagos',
    },
  ];

  const faqsEn = [
    {
      q: 'How does RAG reading of dossiers and PDF documents work?',
      a: 'Aria Prop automatically parses your documents (PDF dossiers, technical specs, floor plans, or Excel files). It extracts relevant data (sqft, prices, layout) and uses it to answer client inquiries in real time with high accuracy.',
      cat: 'RAG & Documents',
    },
    {
      q: 'Can I customize the agent voice and tone for my agency?',
      a: 'Yes. You can define your assistant name, avatar, welcome message, tone (professional, friendly, luxury, direct) and custom prompt rules to match your brand personality.',
      cat: 'General',
    },
    {
      q: 'How are virtual and in-person tours scheduled?',
      a: 'Aria qualifies buyer intent and automatically proposes visit time slots according to your team availability, capturing lead phone numbers and emails.',
      cat: 'General',
    },
    {
      q: 'Can I connect Aria Prop to my WhatsApp Business account?',
      a: 'Yes. Pro Enterprise and Custom plans include native official WhatsApp Business API integration for automated responses via WhatsApp.',
      cat: 'Integrations',
    },
    {
      q: 'What payment gateways are available for subscription?',
      a: 'We accept international credit/debit cards via Stripe, Mercado Pago for LATAM, PayPal Express, and local bank transfers.',
      cat: 'Plans & Billing',
    },
  ];

  const currentFaqs = lang === 'en' ? faqsEn : faqsEs;

  const filteredFaqs = currentFaqs.filter(
    (item) =>
      item.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.a.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.cat.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 bg-slate-950/80 border-t border-white/5 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Section Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-bold uppercase tracking-wider">
            <HelpCircle className="w-4 h-4" />
            <span>{lang === 'es' ? 'Preguntas Frecuentes' : 'Frequently Asked Questions'}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {lang === 'es' ? 'Resuelve todas tus dudas sobre Aria Prop' : 'Got questions about Aria Prop?'}
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            {lang === 'es'
              ? 'Explora las preguntas más comunes sobre la integración RAG, agentes de IA 24/7 y planes de suscripción.'
              : 'Explore common questions about RAG document processing, 24/7 AI agents, and subscription plans.'}
          </p>
        </div>

        {/* Live Search Input */}
        <div className="relative max-w-lg mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={lang === 'es' ? 'Buscar por palabra clave (ej. WhatsApp, RAG, visitas)...' : 'Search by keyword (e.g., WhatsApp, RAG, tours)...'}
            className="w-full bg-slate-900 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all shadow-lg"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              {lang === 'es' ? 'Limpiar' : 'Clear'}
            </button>
          )}
        </div>

        {/* Accordion List */}
        <div className="space-y-3 pt-2">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-slate-900/60 border border-white/10 overflow-hidden transition-all duration-200 hover:border-white/20"
              >
                <button
                  onClick={() => toggleAccordion(idx)}
                  className="w-full p-5 flex items-center justify-between text-left gap-4 cursor-pointer focus:outline-none"
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {faq.cat}
                    </span>
                    <span className="text-sm sm:text-base font-bold text-slate-100">
                      {faq.q}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 text-emerald-400' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/5">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default FAQ;

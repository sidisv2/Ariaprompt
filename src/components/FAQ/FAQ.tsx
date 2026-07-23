import React, { useState } from 'react';
import { Search, ChevronDown, HelpCircle, Sparkles, MessageSquare } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: 'General' | 'RAG & Documentos' | 'Integraciones' | 'Planes & Pagos';
}

const FAQ_DATA: FAQItem[] = [
  {
    question: '¿Cómo funciona la lectura RAG de dossiers y documentos PDF?',
    answer: 'Aria Prop procesa automáticamente tus documentos (dossiers en PDF, especificaciones técnicas, planos o archivos Excel). Extrae los datos relevantes (metrajes, precios, distribución) y los utiliza para responder preguntas de los clientes en tiempo real con total precisión.',
    category: 'RAG & Documentos',
  },
  {
    question: '¿Puedo personalizar la voz y tono del agente para mi agencia?',
    answer: 'Sí. Puedes definir el nombre de tu asistente, foto de perfil, mensaje de bienvenida, tono (profesional, amigable, de lujo o directo) e instrucciones personalizadas para adaptar la interacción a la personalidad de tu marca.',
    category: 'General',
  },
  {
    question: '¿Cómo se agendan las visitas virtuales y presenciales?',
    answer: 'Aria evalúa el interés del lead y, al detectar intención de compra o alquiler, propone automáticamente horarios de visita según la disponibilidad de tu equipo y recopila el teléfono y correo del prospecto.',
    category: 'General',
  },
  {
    question: '¿Es posible conectar Aria Prop a mi cuenta de WhatsApp Business?',
    answer: 'Sí. Los planes Pro Enterprise y Custom incluyen integración nativa con la API oficial de WhatsApp Business para responder consultas en automático a través de WhatsApp.',
    category: 'Integraciones',
  },
  {
    question: '¿Qué pasarelas de pago están disponibles para la suscripción?',
    answer: 'Aceptamos tarjetas de crédito/débito internacionales via Stripe, Mercado Pago para Latinoamérica (MXN, COP, ARS, CLP, PEN), PayPal Express y transferencias bancarias locales (SPEI/PSE).',
    category: 'Planes & Pagos',
  },
  {
    question: '¿Existe algún compromiso de permanencia?',
    answer: 'No. Puedes cancelar o actualizar tu suscripción en cualquier momento directamente desde tu panel de control sin penalización alguna.',
    category: 'Planes & Pagos',
  },
  {
    question: '¿Qué ocurre si supero el límite de mensajes del plan?',
    answer: 'Recibirás una notificación previa y podrás actualizar tu plan en 1 clic. Tus clientes nunca se quedarán sin atención, ya que el sistema mantiene la continuidad del servicio.',
    category: 'Planes & Pagos',
  },
];

export const FAQ: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const filteredFaqs = FAQ_DATA.filter(
    (item) =>
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
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
            <span>Preguntas Frecuentes</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Resuelve todas tus dudas sobre Aria Prop
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Explora las preguntas más comunes sobre la integración RAG, agentes de IA 24/7 y planes de suscripción.
          </p>
        </div>

        {/* Live Search Input */}
        <div className="relative max-w-lg mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por palabra clave (ej. WhatsApp, RAG, visitas)..."
            className="w-full bg-slate-900 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all shadow-lg"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Accordion List */}
        <div className="space-y-3 pt-2">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-10 bg-slate-900/50 rounded-2xl border border-white/5 p-6">
              <p className="text-sm text-slate-400">
                No encontramos preguntas que coincidan con "<strong>{searchTerm}</strong>".
              </p>
              <button
                onClick={() => setSearchTerm('')}
                className="mt-3 px-4 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30"
              >
                Ver todas las preguntas
              </button>
            </div>
          ) : (
            filteredFaqs.map((faq, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div
                  key={idx}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isOpen
                      ? 'bg-slate-900/90 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                      : 'bg-slate-900/40 border-white/5 hover:border-white/10'
                  }`}
                >
                  <button
                    onClick={() => toggleAccordion(idx)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left gap-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 text-emerald-400 border border-emerald-500/20">
                        {faq.category}
                      </span>
                      <span className="text-sm font-bold text-white leading-snug">
                        {faq.question}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-emerald-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Accordion Content with smooth CSS grid height */}
                  <div className={`accordion-content ${isOpen ? 'open' : ''}`}>
                    <div className="accordion-inner px-6 pb-5 pt-1 text-xs text-slate-300 leading-relaxed border-t border-white/5 mt-1">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </section>
  );
};

export default FAQ;

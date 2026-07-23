import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { AppRoute } from '../../types';
import { Check, X, Sparkles, ArrowRight, ShieldCheck, Zap, HelpCircle } from 'lucide-react';
import { Footer } from '../marketing/Footer';

interface ComparisonPageProps {
  type: 'manual' | 'crm' | 'chatbots';
  onRouteChange: (route: AppRoute) => void;
}

export const ComparisonPage: React.FC<ComparisonPageProps> = ({ type, onRouteChange }) => {
  const { lang } = useLanguage();
  const { openAuthModal } = useAuth();

  const data = {
    manual: {
      badge: 'Comparativa Inmobiliaria',
      title: lang === 'es' ? 'Aria Prop vs. Atención Manual de Leads' : 'Aria Prop vs. Manual Lead Engagement',
      subtitle:
        lang === 'es'
          ? 'Descubre cómo la IA generativa 24/7 multiplica las visitas agendadas frente a la respuesta manual tradicional.'
          : 'See how 24/7 generative AI increases booked tours compared to traditional manual replies.',
      comparisonName: lang === 'es' ? 'Atención Manual Humana' : 'Manual Human Reply',
      rows: [
        { feature: 'Tiempo de respuesta a prospectos', competitor: '2 a 12 Horas (o días)', aria: '< 5 Segundos (24/7)' },
        { feature: 'Disponibilidad de atención', competitor: 'Solo horario de oficina', aria: '24/7/365 sin pausas' },
        { feature: 'Calificación de presupuesto', competitor: 'Manual por llamadas', aria: 'Automatizada en < 1 min' },
        { feature: 'Agendamiento en Google Calendar', competitor: 'Llamadas de coordinación', aria: 'Agendamiento directo 1-clic' },
        { feature: 'Acceso a Planos y Fichas RAG', competitor: 'Búsqueda manual de PDFs', aria: 'Lectura RAG instantánea' },
        { feature: 'Costo por lead cualificado', competitor: 'Alto (Horas agente)', aria: 'Fijo mensual sin comisiones' },
      ],
    },
    crm: {
      badge: 'Migración Inteligente',
      title: lang === 'es' ? 'Por qué cambiar de un CRM Tradicional a Aria Prop' : 'Why Switch from a Traditional CRM to Aria Prop',
      subtitle:
        lang === 'es'
          ? 'Los CRM tradicionales guardan datos estáticos; Aria Prop cualifica, conversa y agenda citas en automático.'
          : 'Traditional CRMs store static data; Aria Prop engages, qualifies, and books appointments automatically.',
      comparisonName: lang === 'es' ? 'CRM Tradicional' : 'Traditional CRM',
      rows: [
        { feature: 'Rol principal en la agencia', competitor: 'Base de datos pasiva', aria: 'Agente activo de ventas 24/7' },
        { feature: 'Respuesta automática a leads', competitor: 'Plantillas genéricas frías', aria: 'Conversación IA humana personalizada' },
        { feature: 'Integración WhatsApp Business API', competitor: 'Requiere plugins caros', aria: 'Nativa y oficial' },
        { feature: 'Lectura RAG de Fichas en PDF', competitor: 'No disponible', aria: 'Indexación RAG instantánea' },
        { feature: 'Cálculo de ROI para Inversionistas', competitor: 'No disponible', aria: 'Cálculos de Cap Rate en vivo' },
        { feature: 'Facilidad de implementación', competitor: 'Semanas de capacitación', aria: 'Listo en < 10 minutos' },
      ],
    },
    chatbots: {
      badge: 'Evolución de IA',
      title: lang === 'es' ? 'Aria Prop vs. Chatbots Tradicionales de Reglas' : 'Aria Prop vs. Traditional Rule-Based Chatbots',
      subtitle:
        lang === 'es'
          ? 'Supera los menús de botones inflexibles con inteligencia artificial generativa entrenada en bienes raíces.'
          : 'Move beyond rigid button menus with generative AI trained specifically for real estate.',
      comparisonName: lang === 'es' ? 'Chatbot de Reglas (Menu de botones)' : 'Rule-Based Chatbot (Button menus)',
      rows: [
        { feature: 'Comprensión del lenguaje natural', competitor: 'Menús de botones rígidos', aria: 'IA Generativa Avanzada' },
        { feature: 'Respuestas a preguntas complejas', competitor: 'Mensaje de "no entendí"', aria: 'Respuestas detalladas con RAG' },
        { feature: 'Recomendación de catálogo', competitor: 'Links genéricos', aria: 'Matching inteligente por zona y m²' },
        { feature: 'Adaptabilidad de tono de marca', competitor: 'Seco e inflexible', aria: 'Lujo, profesional o directo' },
        { feature: 'Mapeo de presupuesto y ROI', competitor: 'No soporta cálculos', aria: 'Cálculos financieros automáticos' },
        { feature: 'Experiencia del comprador', competitor: 'Frustrante', aria: 'Sofisticada y rápida' },
      ],
    },
  }[type];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
      <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 pt-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>{data.badge}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            {data.title}
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            {data.subtitle}
          </p>
        </div>

        {/* Comparison Table */}
        <div className="rounded-3xl bg-slate-900/90 border border-white/10 overflow-hidden shadow-2xl">
          <div className="grid grid-cols-12 bg-slate-950 p-4 border-b border-white/10 text-xs font-bold uppercase tracking-wider text-slate-400">
            <div className="col-span-5 sm:col-span-4">{lang === 'es' ? 'Funcionalidad Clave' : 'Key Feature'}</div>
            <div className="col-span-3 sm:col-span-4 text-center">{data.comparisonName}</div>
            <div className="col-span-4 sm:col-span-4 text-center text-emerald-400 font-extrabold flex items-center justify-center gap-1">
              <span>Aria Prop AI</span>
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="divide-y divide-white/5 text-xs sm:text-sm">
            {data.rows.map((row, idx) => (
              <div key={idx} className="grid grid-cols-12 p-4 items-center hover:bg-slate-800/40 transition-colors">
                <div className="col-span-5 sm:col-span-4 font-bold text-white leading-snug">{row.feature}</div>
                <div className="col-span-3 sm:col-span-4 text-center text-slate-400 flex items-center justify-center gap-1">
                  <X className="w-4 h-4 text-rose-400 shrink-0 hidden sm:inline" />
                  <span>{row.competitor}</span>
                </div>
                <div className="col-span-4 sm:col-span-4 text-center font-extrabold text-emerald-300 bg-emerald-500/10 py-2 px-3 rounded-xl border border-emerald-500/20 flex items-center justify-center gap-1">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{row.aria}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Card */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-emerald-500/30 text-center space-y-4 shadow-2xl">
          <h3 className="text-2xl font-black text-white">
            {lang === 'es' ? '¿Listo para modernizar la atención de tu agencia?' : 'Ready to modernize your agency engagement?'}
          </h3>
          <p className="text-slate-300 text-xs sm:text-sm max-w-xl mx-auto">
            {lang === 'es'
              ? 'Prueba Aria Prop gratis por 7 días y comprueba el impacto en agendamientos reales.'
              : 'Try Aria Prop free for 7 days and see the real impact on booked tours.'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => openAuthModal('signup', 'pro', 'dashboard-checkout')}
              className="px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 transition-all cursor-pointer flex items-center gap-2"
            >
              <span>{lang === 'es' ? 'Crear Cuenta Gratis' : 'Create Free Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onRouteChange('pricing')}
              className="px-6 py-3 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-white/10 transition-all cursor-pointer"
            >
              {lang === 'es' ? 'Ver Planes & Precios' : 'View Plans & Pricing'}
            </button>
          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
};

import React, { useState } from 'react';
import { AppRoute } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { PLAN_LIMITS } from '../../lib/planLimits';
import { RoiLeadCalculator } from './RoiLeadCalculator';
import {
  Clock,
  Zap,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldCheck,
  Building2,
  Calendar,
  MessageSquare,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Database,
  Users,
  BarChart3,
  Flame,
  Globe2,
  HelpCircle,
  Check,
  Send
} from 'lucide-react';

interface RestructuredLandingPageProps {
  onRouteChange: (route: AppRoute) => void;
  onOpenPrompt?: (promptText: string) => void;
}

export const RestructuredLandingPage: React.FC<RestructuredLandingPageProps> = ({
  onRouteChange,
}) => {
  const { user, loading, openAuthModal } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>('annual');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const isUserLoggedInOrLoading = Boolean(
    loading ||
      user ||
      (user &&
        (user.isOwner ||
          user.isAdmin ||
          user.email?.toLowerCase().trim() === 'valentinlautaromorales@gmail.com'))
  );

  const isAnnual = billingCycle === 'annual';

  const handleStartTrial = (planId: string = 'pro', targetRoute: AppRoute = 'dashboard-checkout') => {
    if (user) {
      onRouteChange(targetRoute);
    } else {
      openAuthModal('signup', planId, targetRoute);
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const scrollToHowItWorks = () => {
    const el = document.getElementById('how-it-works-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SECCIÓN 1 — Hero: Respuesta Instantánea                            */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Clock className="w-4 h-4" />
            <span>Respuesta Inmobiliaria Instantánea • Atención 24/7</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            No perdás más ventas por responder tarde.{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">
              Aria Prop cualifica y deriva las consultas en segundos.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Tus prospectos navegan por la noche y los fines de semana. Aria atiende las dudas de tu catálogo al instante en tu web y WhatsApp, cualifica el presupuesto y agenda la visita directamente en tu calendario.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {isUserLoggedInOrLoading ? (
              <button
                onClick={() => onRouteChange('dashboard-metrics')}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm sm:text-base transition-all duration-200 shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 group cursor-pointer"
              >
                <Sparkles className="w-5 h-5 fill-slate-950 text-slate-950" />
                <span>Ir a Mi Panel / Dashboard ➔</span>
              </button>
            ) : (
              <button
                onClick={() => onRouteChange('app')}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm sm:text-base transition-all duration-200 shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 group cursor-pointer"
              >
                <Sparkles className="w-5 h-5 fill-slate-950 text-slate-950" />
                <span>Probar Gratis (3 Consultas) ➔</span>
              </button>
            )}

            <button
              onClick={scrollToHowItWorks}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-sm sm:text-base transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Ver Cómo Funciona</span>
            </button>
          </div>

          {/* Trust Guarantees */}
          {!isUserLoggedInOrLoading && (
            <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-xs text-slate-400 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Sin tarjeta de crédito requerida</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Configuración rápida, sin necesidad de código</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Conexión nativa Tokko Broker & EasyBroker</span>
              </div>
            </div>
          )}
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SECCIÓN 2 — Comparativa Tradicional vs Con Aria Prop                 */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Comparativa Comercial</span>
          <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
            Atención Tradicional de Leads vs. Con Aria Prop
          </h2>
          <p className="text-sm text-slate-400">
            Escenario cotidiano: ¿Qué ocurre cuando un prospecto consulta por un inmueble fuera del horario de oficina?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Column 1: Without Aria */}
          <div className="bg-slate-900/60 p-6 sm:p-8 rounded-3xl border border-red-500/20 space-y-6 relative overflow-hidden">
            <div className="flex items-center gap-3 border-b border-red-500/20 pb-4">
              <div className="p-2.5 bg-red-500/10 text-red-400 rounded-xl">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Atención Tradicional Manual</h3>
                <p className="text-xs text-red-400">Respuestas demoradas & fuga de prospectos</p>
              </div>
            </div>

            <ul className="space-y-4 text-xs sm:text-sm text-slate-300">
              <li className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block mb-0.5">Demora de 10 a 14 horas en responder:</strong>
                  Consulta realizada un Sábado a las 23:00 hs desatendida hasta el Lunes por la mañana.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block mb-0.5">Enfriamiento de la intención de compra:</strong>
                  El prospecto pierde el interés o continúa buscando en portales y contratando a otra agencia.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block mb-0.5">Tiempo invertido en consultas no calificadas:</strong>
                  Corredores perdiendo horas respondiendo precios básicos por WhatsApp a curiosos sin presupuesto.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block mb-0.5">Coordinación manual de visitas:</strong>
                  Múltiples mensajes de ida y vuelta para encontrar un espacio libre en el calendario.
                </div>
              </li>
            </ul>
          </div>

          {/* Column 2: With Aria Prop */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 p-6 sm:p-8 rounded-3xl border border-emerald-500/40 space-y-6 relative overflow-hidden shadow-xl shadow-emerald-500/5">
            <div className="flex items-center gap-3 border-b border-emerald-500/20 pb-4">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Con Aria Prop 24/7</h3>
                <p className="text-xs text-emerald-400">Atención instantánea, cualificación & agendado</p>
              </div>
            </div>

            <ul className="space-y-4 text-xs sm:text-sm text-slate-300">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block mb-0.5">Respuesta inmediata en segundos:</strong>
                  Atención las 24hs en WhatsApp y Web. Muestra la ficha técnica exacta desde tu catálogo.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block mb-0.5">Datos 100% verificados sin alucinaciones:</strong>
                  Motor RAG que consulta únicamente el inventario real de tu inmobiliaria (Tokko/EasyBroker/PDFs).
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block mb-0.5">Cualificación automática de presupuesto:</strong>
                  Filtra curiosos analizando zona, urgencia y presupuesto antes de coordinar el contacto.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block mb-0.5">Agendado directo en Google Calendar:</strong>
                  Reserva la visita presencial en el horario del corredor y envía recordatorio por WhatsApp.
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SECCIÓN 3 — Cómo Funciona (Flujo Visual en 4 Pasos Verificados)    */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section id="how-it-works-section" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Flujo de Trabajo</span>
          <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
            ¿Cómo funciona Aria Prop en tu inmobiliaria?
          </h2>
          <p className="text-sm text-slate-400">
            Cuatro pasos automatizados para transformar visitantes en visitas agendadas y cierres comerciales.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-4 relative">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-sm">
              01
            </div>
            <h3 className="text-base font-bold text-white">Captura Multicanal & CRM</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Conectá tu catálogo vía API Key con <strong>Tokko Broker</strong>, <strong>EasyBroker</strong> o subí tus fichas directas (PDF/CSV). Recibe consultas en WhatsApp y Web.
            </p>
            <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-800">
              * Para portales inmobiliarios, las consultas se centralizan hacia tu canal oficial de WhatsApp/Web.
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-4 relative">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-sm">
              02
            </div>
            <h3 className="text-base font-bold text-white">Atención RAG en Segundos</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              El motor RAG analiza el mensaje y responde al instante con el precio real, m², ambientes y fotos de la propiedad solicitada sin inventar datos.
            </p>
            <div className="pt-2 text-[11px] text-emerald-400/80 border-t border-slate-800">
              ✔ Cero respuestas alucinadas
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-4 relative">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-sm">
              03
            </div>
            <h3 className="text-base font-bold text-white">Cualificación & Agendado</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Aria valida el presupuesto del comprador, su urgencia y zona preferida. Coordina día y hora reservando la cita directamente en Google Calendar.
            </p>
            <div className="pt-2 text-[11px] text-emerald-400/80 border-t border-slate-800">
              ✔ Sincronizado en tu agenda
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-4 relative">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-sm">
              04
            </div>
            <h3 className="text-base font-bold text-white">Dashboard & Derivación</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              El lead queda registrado en tu panel con su scoring (0-100). Si requiere intervención humana o negociación, se deriva al WhatsApp del corredor asignado.
            </p>
            <div className="pt-2 text-[11px] text-emerald-400/80 border-t border-slate-800">
              ✔ Transferencia a WhatsApp humano
            </div>
          </div>
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SECCIÓN 4 — Panel Administrativo / Métricas Implementadas           */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Panel de Control Real</span>
          <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
            Métricas de Gestión Inmobiliaria en Tiempo Real
          </h2>
          <p className="text-sm text-slate-400">
            Monitoreá únicamente lo que está verdaderamente implementado en la plataforma de tu agencia.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg w-fit">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-slate-300">Chats & Consultas Atendidas</h4>
            <p className="text-xs text-slate-400">
              Registro continuo de volumen de mensajes procesados en WhatsApp y Web Widget por tu asistente.
            </p>
          </div>

          <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg w-fit">
              <Flame className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-slate-300">Leads Cualificados & Scoring</h4>
            <p className="text-xs text-slate-400">
              Clasificación automática de prospectos en Hot/Warm según presupuesto, zona y scoring de 0 a 100.
            </p>
          </div>

          <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg w-fit">
              <Calendar className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-slate-300">Visitas & Tours Agendados</h4>
            <p className="text-xs text-slate-400">
              Listado en tiempo real de citas confirmadas sincronizadas con Google Calendar de cada corredor.
            </p>
          </div>

          <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg w-fit">
              <Database className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-slate-300">Catálogo & Conexión CRM</h4>
            <p className="text-xs text-slate-400">
              Monitoreo del total de inmuebles activos en catálogo e integración en línea con Tokko y EasyBroker.
            </p>
          </div>
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SECCIÓN INTERACTIVA — Calculadora de Impacto de Leads Perdidos    */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
        <RoiLeadCalculator onPlanSelect={(planId) => handleStartTrial(planId || 'pro', 'dashboard-checkout')} />
      </section>


      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SECCIÓN 5 — Precios Transparentes (PLAN_LIMITS Oficiales)           */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="text-center max-w-3xl mx-auto mb-8 space-y-3">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Planes Transparentes</span>
          <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
            Planes Diseñados para Corredores y Agencias
          </h2>
          <p className="text-sm text-slate-400">
            Elegí el plan que mejor se adapte al volumen de tu catálogo y estructura de equipo.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="pt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isAnnual ? 'bg-emerald-500 text-slate-950 shadow-md' : 'bg-slate-950 text-slate-400 border border-slate-800'
              }`}
            >
              Facturación Anual (-20%)
            </button>
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                !isAnnual ? 'bg-emerald-500 text-slate-950 shadow-md' : 'bg-slate-950 text-slate-400 border border-slate-800'
              }`}
            >
              Facturación Mensual
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pt-4">
          {/* Plan Solo Agent */}
          <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">{PLAN_LIMITS.solo.name}</span>
                <h3 className="text-2xl font-extrabold text-white mt-1">
                  ${isAnnual ? PLAN_LIMITS.solo.annualPriceUsd : PLAN_LIMITS.solo.monthlyPriceUsd} USD{' '}
                  <span className="text-xs font-normal text-slate-400">/mes</span>
                </h3>
                <p className="text-xs text-slate-400 mt-2">{PLAN_LIMITS.solo.description}</p>
              </div>

              <ul className="space-y-3 text-xs text-slate-300 pt-4 border-t border-slate-800">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>1 Agente de IA activo</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Hasta {PLAN_LIMITS.solo.maxLeadsPerMonth} leads cualificados/mes</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Hasta {PLAN_LIMITS.solo.maxProperties} propiedades en catálogo</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Bóveda de Documentos PDF Privada</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Soporte estándar por email (<a href="mailto:soporte@ariaprop.online" className="text-emerald-400 underline">soporte@ariaprop.online</a>)</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleStartTrial('solo', 'dashboard-checkout')}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all cursor-pointer"
            >
              Comenzar Prueba Solo Agent
            </button>
          </div>

          {/* Plan Agency Pro */}
          <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-3xl border border-emerald-500/50 p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-xl shadow-emerald-500/10 relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider rounded-full shadow-md">
              MÁS POPULAR
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">{PLAN_LIMITS.pro.name}</span>
                <h3 className="text-3xl font-black text-white mt-1">
                  ${isAnnual ? PLAN_LIMITS.pro.annualPriceUsd : PLAN_LIMITS.pro.monthlyPriceUsd} USD{' '}
                  <span className="text-xs font-normal text-slate-400">/mes</span>
                </h3>
                <p className="text-xs text-slate-400 mt-2">{PLAN_LIMITS.pro.description}</p>
              </div>

              <ul className="space-y-3 text-xs text-slate-300 pt-4 border-t border-slate-800">
                <li className="flex items-center gap-2 font-semibold text-white">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Sincronización Automática Tokko Broker & EasyBroker</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>5 Agentes de IA configurables</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Hasta {PLAN_LIMITS.pro.maxLeadsPerMonth} leads cualificados/mes</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Hasta {PLAN_LIMITS.pro.maxProperties} propiedades en catálogo</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Atención en WhatsApp API & Widget Web</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Soporte prioritario e instalación asistida</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleStartTrial('pro', 'dashboard-checkout')}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              Comenzar Prueba Agency Pro
            </button>
          </div>

          {/* Plan Enterprise */}
          <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">{PLAN_LIMITS.desarrolladores.name}</span>
                <h3 className="text-2xl font-extrabold text-white mt-1">Plan a Medida</h3>
                <p className="text-xs text-slate-400 mt-2">{PLAN_LIMITS.desarrolladores.description}</p>
              </div>

              <ul className="space-y-3 text-xs text-slate-300 pt-4 border-t border-slate-800">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Agentes y catálogo ilimitados</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Leads y consultas sin límite</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Dominio y Marca Blanca para la agencia</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Soporte dedicado 24/7 & SLA Garantizado</span>
                </li>
              </ul>
            </div>

            <a
              href="https://wa.me/5492604014372?text=Hola!%20Me%20interesa%20el%20plan%20Enterprise%20/%20Desarrolladores%20de%20AriaPrompt."
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all cursor-pointer text-center block"
            >
              Contactar por WhatsApp
            </a>
          </div>
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SECCIÓN 6 — Reducción de Fricción / FAQ Genuina (Sin Historias Falsas) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-slate-800/80 space-y-8">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Preguntas Frecuentes</span>
          <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
            Respuestas Claras sobre Aria Prop
          </h2>
          <p className="text-sm text-slate-400">
            Todo lo que necesitás saber antes de activar tu asistente inmobiliario.
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              q: '¿Aria Prop reemplaza a mis corredores e inmobiliarios?',
              a: 'No. Aria no reemplaza a tu personal: absorbe las preguntas repetitivas y nocturnas (precios, ubicaciones, disponibilidad) para filtrar curiosos y entregar a tu equipo únicamente los prospectos cualificados con la visita presencial ya coordinada.'
            },
            {
              q: '¿Cuánto tarda la integración con mi inmobiliaria?',
              a: 'Menos de 3 minutos. Solo ingresás la API Key de Tokko Broker o EasyBroker (o subís las fichas de tus propiedades en PDF/CSV) y el asistente queda listo para operar en tu web o WhatsApp.'
            },
            {
              q: '¿La IA puede inventar precios o datos de mis propiedades?',
              a: 'No. Aria Prop funciona con arquitectura RAG (Retrieval-Augmented Generation), lo que significa que responde estrictamente basándose en la información real y verificada del catálogo de tu agencia.'
            },
            {
              q: '¿Qué pasa si un prospecto hace una consulta que la IA no sabe responder?',
              a: 'Aria aclara transparentemente la falta de información y ofrece derivar la conversación al instante hacia el WhatsApp del asesor o corredor humano asignado con el historial completo.'
            },
            {
              q: '¿Cómo se agendan las visitas en mi agenda?',
              a: 'Aria se integra con Google Calendar. Cuando detecta a un comprador con presupuesto calificado, le ofrece los horarios disponibles de tu agenda y reserva la cita enviándole una confirmación.'
            }
          ].map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 text-left font-bold text-sm sm:text-base text-white flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/50"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp className="w-5 h-5 text-emerald-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />}
                </button>
                {isOpen && (
                  <div className="p-5 pt-0 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
};

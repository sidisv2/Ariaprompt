import React, { useState } from 'react';
import { AppRoute } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { PLAN_LIMITS } from '../../lib/planLimits';
import {
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
  Flame,
  Check,
  Send,
  Lock,
  UserCheck,
  FileCheck,
  Mic,
  Volume2,
  Clock,
  PhoneCall,
  ExternalLink,
  Bot,
  Layers,
  Award
} from 'lucide-react';

interface RestructuredLandingPageProps {
  onRouteChange: (route: AppRoute) => void;
  onOpenPrompt?: (promptText: string) => void;
}

export const RestructuredLandingPage: React.FC<RestructuredLandingPageProps> = ({
  onRouteChange,
  onOpenPrompt,
}) => {
  const { user, openAuthModal } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>('annual');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [activeTabPhone, setActiveTabPhone] = useState<'text' | 'audio'>('audio');

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
    const el = document.getElementById('pipeline-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. HERO SECTION (Propuesta de valor clara)                          */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-emerald-500/15 via-teal-500/10 to-transparent rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left: Value Proposition & CTAs (7 Cols) */}
          <div className="lg:col-span-7 space-y-7 text-left">
            
            {/* Trust Badges Top Bar */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wide shadow-lg shadow-emerald-500/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              <Zap className="w-3.5 h-3.5 text-emerald-400 fill-current" />
              <span>WhatsApp Business Oficial de Meta · Inventario en Tiempo Real · CRM Integrado</span>
            </div>

            {/* H1 Title */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
              Tu inmobiliaria responde cada consulta en segundos.{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">
                24/7.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl font-normal">
              Aria atiende WhatsApp, entiende texto y notas de voz, consulta tu inventario real de propiedades, califica al interesado y agenda visitas. Cuando hace falta, tu asesor toma el control.
            </p>

            {/* CTA Group */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                onClick={() => handleStartTrial('pro', 'dashboard-checkout')}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-105"
              >
                <Sparkles className="w-5 h-5 fill-slate-950 text-slate-950" />
                <span>Probar Aria Gratis</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              <button
                onClick={scrollToHowItWorks}
                className="px-6 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-200 font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Ver Flujo en 6 Pasos</span>
              </button>
            </div>

            {/* Microcopy Under CTA */}
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Configuración inicial sin tarjeta de crédito · Prueba gratuita de 14 días</span>
            </div>

          </div>

          {/* Right: Interactive Phone Simulator (5 Cols) */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-[360px] rounded-[40px] border-[6px] border-slate-800 bg-slate-950 p-4 shadow-2xl shadow-emerald-950/60 ring-1 ring-white/10">
              
              {/* Phone Notch & Header */}
              <div className="mx-auto mb-3 h-4 w-28 rounded-full bg-slate-900" />
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs border border-emerald-500/30">
                      AP
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-slate-950" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-xs flex items-center gap-1.5">
                      Aria Prop · Inmobiliaria
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">OFICIAL</span>
                    </h3>
                    <p className="text-[10px] text-emerald-400 font-semibold">🟢 en línea · responde al instante</p>
                  </div>
                </div>
              </div>

              {/* Chat Simulation Area */}
              <div className="space-y-3 pt-3 text-xs min-h-[360px] flex flex-col justify-between">
                
                <div className="space-y-3 overflow-y-auto max-h-[320px] pr-1">
                  
                  {/* Client Text Message */}
                  <div className="flex justify-end">
                    <div className="bg-emerald-600 text-slate-950 font-medium rounded-2xl rounded-tr-none px-3.5 py-2.5 max-w-[90%] shadow-md">
                      <p className="leading-snug">Hola, busco un departamento de 2 ambientes en Palermo hasta USD 110.000 con cochera</p>
                      <span className="text-[9px] text-slate-950/70 block text-right mt-1 font-mono">14:32</span>
                    </div>
                  </div>

                  {/* Aria Instant Response with Property Card */}
                  <div className="flex justify-start">
                    <div className="bg-slate-900 border border-white/10 text-slate-200 rounded-2xl rounded-tl-none p-3 max-w-[95%] shadow-md space-y-2.5">
                      <p className="leading-relaxed">
                        ¡Hola! Encontré 3 propiedades que coinciden con tu búsqueda:
                      </p>

                      {/* Property Card Interactive Mockup */}
                      <div className="rounded-xl bg-slate-950 border border-emerald-500/30 overflow-hidden">
                        <div className="h-24 bg-gradient-to-br from-slate-800 to-slate-900 relative flex items-center justify-center p-3">
                          <Building2 className="w-10 h-10 text-emerald-500/40" />
                          <span className="absolute top-2 right-2 bg-emerald-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full">
                            USD 105.000
                          </span>
                          <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white bg-slate-950/80 px-2 py-0.5 rounded">
                            2 Amb · 52m² · Palermo Soho
                          </span>
                        </div>
                        <div className="p-2.5 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-emerald-400 font-semibold">✓ Cochera fija incluida</span>
                          <button
                            onClick={() => {
                              if (onOpenPrompt) onOpenPrompt('Quiero ver la ficha del departamento en Palermo Soho de USD 105.000');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold text-[10px] hover:bg-emerald-400 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <span>Ver ficha</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>

                      <span className="text-[9px] text-slate-500 block text-right font-mono">14:32 · Aria IA</span>
                    </div>
                  </div>

                  {/* Client Voice Note Message */}
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
                            <span>0:24</span>
                            <span>Nota de voz</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-slate-950/10 rounded-lg p-1.5 text-[10px] italic border border-black/5">
                        🎙️ "Perfecto, ¿se puede visitar este viernes a las 16 hs?"
                      </div>
                    </div>
                  </div>

                  {/* Aria Voice Recognition & Instant Appointment Reply */}
                  <div className="flex justify-start">
                    <div className="bg-slate-900 border border-emerald-500/30 text-slate-200 rounded-2xl rounded-tl-none p-3 max-w-[95%] shadow-md space-y-2">
                      <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold">
                        <Sparkles className="w-3 h-3 fill-current" />
                        <span>Voz transcripta con Gemini 2.5 Flash</span>
                      </div>
                      <p className="leading-snug">
                        ¡Coordinado! Te agendé para el <strong>Viernes a las 16:00 hs</strong>. Tu asesor asignado te esperará en el departamento.
                      </p>
                      <span className="text-[9px] text-slate-500 block text-right font-mono">14:33 · Visita Agendada</span>
                    </div>
                  </div>

                </div>

                {/* Simulated Input Bar */}
                <div className="pt-2 border-t border-white/10 flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value="Escribe una consulta o envía un audio..."
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-slate-500 text-[11px] cursor-pointer"
                    onClick={() => {
                      if (onOpenPrompt) onOpenPrompt('¿Tienen departamentos en Recoleta con balcón terraza?');
                    }}
                  />
                  <div className="p-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs">
                    <Mic className="w-3.5 h-3.5" />
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. FLUJO COMERCIAL EN 6 PASOS                                       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section id="pipeline-section" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5" /> Pipeline Comercial Automatizado
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            De la primera consulta a la visita en 6 pasos
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            Todo el proceso de prospección y filtrado comercial resuelto en segundos, sin fricciones ni pérdidas de tiempo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
          
          {/* Step 1 */}
          <div className="bg-slate-900/70 p-6 rounded-3xl border border-white/10 hover:border-emerald-500/40 transition-all space-y-4 relative shadow-xl hover:-translate-y-1">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-base">
              01
            </div>
            <h3 className="text-lg font-bold text-white">Consulta entrante (WhatsApp 24/7)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              El cliente escribe o envía un audio a cualquier hora del día o del fin de semana a través del número oficial de tu inmobiliaria.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-900/70 p-6 rounded-3xl border border-white/10 hover:border-emerald-500/40 transition-all space-y-4 relative shadow-xl hover:-translate-y-1">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-base">
              02
            </div>
            <h3 className="text-lg font-bold text-white">Comprensión inteligente (Texto y Audios)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Aria procesa mensajes escritos y transcribe notas de voz largas con Gemini 2.5 Flash, extrayendo los requerimientos exactos del comprador.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-900/70 p-6 rounded-3xl border border-white/10 hover:border-emerald-500/40 transition-all space-y-4 relative shadow-xl hover:-translate-y-1">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-base">
              03
            </div>
            <h3 className="text-lg font-bold text-white">Consulta de inventario real</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Filtra tu catálogo sincronizado por zona, presupuesto máximo y características (cochera, metros, comodidades) sin inventar disponibilidad.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-slate-900/70 p-6 rounded-3xl border border-white/10 hover:border-emerald-500/40 transition-all space-y-4 relative shadow-xl hover:-translate-y-1">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-base">
              04
            </div>
            <h3 className="text-lg font-bold text-white">Calificación del interesado</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Evalúa la intención de compra real, valida si cuenta con fondos o crédito, y asigna un scoring de cliente (Hot / Warm) en tu CRM.
            </p>
          </div>

          {/* Step 5 */}
          <div className="bg-slate-900/70 p-6 rounded-3xl border border-white/10 hover:border-emerald-500/40 transition-all space-y-4 relative shadow-xl hover:-translate-y-1">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-base">
              05
            </div>
            <h3 className="text-lg font-bold text-white">Coordinación de visita</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Propone turnos disponibles directamente en el calendario del equipo inmobiliario y confirma la cita automáticamente con el cliente.
            </p>
          </div>

          {/* Step 6 */}
          <div className="bg-slate-900/70 p-6 rounded-3xl border border-emerald-500/40 hover:border-emerald-400 transition-all space-y-4 relative shadow-xl shadow-emerald-500/5 hover:-translate-y-1">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-base">
              06
            </div>
            <h3 className="text-lg font-bold text-white">Entrega al asesor en el CRM</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tu asesor recibe el lead en el panel con todo el historial de chat, audios para escuchar, ficha consultada y cita confirmada.
            </p>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. TABLA COMPARATIVA: "Sin Aria vs. Con Aria"                       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Comparativa de Rendimiento</span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Sin Aria vs. Con Aria
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            Descubrí cómo cambia la velocidad comercial y la tasa de conversión de tu inmobiliaria.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Column 1: Sin Aria */}
          <div className="bg-slate-900/60 p-6 sm:p-8 rounded-3xl border border-rose-500/20 space-y-6 relative overflow-hidden">
            <div className="flex items-center gap-3 border-b border-rose-500/20 pb-4">
              <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-2xl">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">Inmobiliaria Tradicional (Sin Aria)</h3>
                <p className="text-xs text-rose-400">Pérdida continua de prospectos por demoras</p>
              </div>
            </div>

            <ul className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <li className="flex items-start gap-3">
                <span className="text-rose-400 font-bold mt-0.5">✕</span>
                <span><strong>Leads esperando horas:</strong> Consultas que tardan de 2 a 12 horas en ser respondidas mientras el cliente busca otras opciones.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-rose-400 font-bold mt-0.5">✕</span>
                <span><strong>Oportunidades que se enfrían:</strong> Fines de semana y noches sin atención comercial activa.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-rose-400 font-bold mt-0.5">✕</span>
                <span><strong>Búsqueda manual de fichas:</strong> Asesores abriendo PDFs o carpetas a mano para contestar precios y metros básicos.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-rose-400 font-bold mt-0.5">✕</span>
                <span><strong>Audios sin escuchar:</strong> Notas de voz largas que quedan sin responder por falta de tiempo de los corredores.</span>
              </li>
            </ul>
          </div>

          {/* Column 2: Con Aria */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 p-6 sm:p-8 rounded-3xl border border-emerald-500/40 space-y-6 relative overflow-hidden shadow-2xl shadow-emerald-500/5">
            <div className="flex items-center gap-3 border-b border-emerald-500/20 pb-4">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-2xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">Inmobiliaria con Aria Prop</h3>
                <p className="text-xs text-emerald-400">Atención inmediata, catálogo en vivo y visitas</p>
              </div>
            </div>

            <ul className="space-y-4 text-xs sm:text-sm text-slate-200 leading-relaxed">
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                <span><strong>Respuesta en menos de 10 segundos:</strong> Atención instantánea las 24 horas del día, los 7 días de la semana.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                <span><strong>Catálogo consultado en vivo:</strong> Muestra fichas con fotos, precios y disponibilidad sincronizada con tu CRM.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                <span><strong>Transcripción y comprensión de audios:</strong> Entiende notas de voz y responde con precisión técnica inmediata.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                <span><strong>Visitas agendadas y filtradas:</strong> Entrega a tu equipo de ventas citas confirmadas con clientes calificados.</span>
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. SECCIÓN TRES DIFERENCIALES CLAVE                                 */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold uppercase tracking-wider">
            <Award className="w-3.5 h-3.5" /> Ventajas Exclusivas
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Tres diferenciales clave que hacen única a Aria
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            No es un bot genérico ni una integración inestable. Es infraestructura oficial de nivel profesional.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Diff 1 */}
          <div className="bg-slate-900/80 p-8 rounded-3xl border border-white/10 hover:border-emerald-500/40 transition-all space-y-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl w-fit border border-emerald-500/20">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="font-extrabold text-white text-xl">WhatsApp Oficial de Meta</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Infraestructura oficial de WhatsApp Cloud API. Soporta múltiples asesores en simultáneo, garantiza alta disponibilidad y elimina por completo el riesgo de bloqueos o desconexiones de sesiones no oficiales.
            </p>
          </div>

          {/* Diff 2 */}
          <div className="bg-slate-900/80 p-8 rounded-3xl border border-white/10 hover:border-emerald-500/40 transition-all space-y-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl w-fit border border-emerald-500/20">
              <Database className="w-7 h-7" />
            </div>
            <h3 className="font-extrabold text-white text-xl">Conoce tu catálogo real</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Aria no responde generalidades ni inventa datos. Consulta tu inventario en tiempo real, verifica disponibilidad, metros cubiertos, amenities y precios exactos para enviar fichas técnicas precisas.
            </p>
          </div>

          {/* Diff 3 */}
          <div className="bg-slate-900/80 p-8 rounded-3xl border border-white/10 hover:border-emerald-500/40 transition-all space-y-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl w-fit border border-emerald-500/20">
              <Volume2 className="w-7 h-7" />
            </div>
            <h3 className="font-extrabold text-white text-xl">Tus clientes hablan, Aria entiende</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Más del 60% de los interesados prefieren enviar notas de voz. Aria descarga el audio, lo transcribe con Gemini 2.5 Flash, lo almacena en tu CRM y responde de forma inmediata como un asesor experto.
            </p>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4.5. MÉTRICAS DE IMPACTO COMERCIAL                                  */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-slate-900/60 p-6 rounded-3xl border border-white/10 text-center space-y-2">
            <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              &lt; 10s
            </div>
            <div className="text-xs sm:text-sm font-bold text-white">Tiempo de respuesta inicial</div>
            <p className="text-[11px] text-slate-400">Atención instantánea sin esperas</p>
          </div>

          <div className="bg-slate-900/60 p-6 rounded-3xl border border-white/10 text-center space-y-2">
            <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              24/7
            </div>
            <div className="text-xs sm:text-sm font-bold text-white">Atención ininterrumpida</div>
            <p className="text-[11px] text-slate-400">Noches, feriados y fines de semana</p>
          </div>

          <div className="bg-slate-900/60 p-6 rounded-3xl border border-white/10 text-center space-y-2">
            <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              100%
            </div>
            <div className="text-xs sm:text-sm font-bold text-white">Comprensión de audios y texto</div>
            <p className="text-[11px] text-slate-400">Gemini 2.5 Flash Multimodal</p>
          </div>

          <div className="bg-slate-900/60 p-6 rounded-3xl border border-white/10 text-center space-y-2">
            <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              +40%
            </div>
            <div className="text-xs sm:text-sm font-bold text-white">Visitas coordinadas</div>
            <p className="text-[11px] text-slate-400">Agendamiento directo en Google Calendar</p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 5. PLANES Y PRECIOS TRANSPARENTES                                   */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Inversión Clara</span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Planes a la medida de tu inmobiliaria
          </h2>
          <p className="text-sm text-slate-400">
            Comenzá hoy con prueba gratuita de 14 días. Sin contratos forzosos ni comisiones ocultas.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="pt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isAnnual ? 'bg-emerald-500 text-slate-950 shadow-md font-black' : 'bg-slate-950 text-slate-400 border border-slate-800'
              }`}
            >
              Facturación Anual (-20% OFF)
            </button>
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                !isAnnual ? 'bg-emerald-500 text-slate-950 shadow-md font-black' : 'bg-slate-950 text-slate-400 border border-slate-800'
              }`}
            >
              Facturación Mensual
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pt-4">
          
          {/* Plan 1: Solo Agent */}
          <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">{PLAN_LIMITS.solo.name}</span>
                <h3 className="text-3xl font-black text-white mt-1">
                  ${isAnnual ? '29' : '35'} USD{' '}
                  <span className="text-xs font-normal text-slate-400">/mes</span>
                </h3>
                <p className="text-xs text-slate-400 mt-2">
                  Ideal para corredores y agentes inmobiliarios independientes.
                </p>
              </div>

              <ul className="space-y-3 text-xs text-slate-300 pt-4 border-t border-slate-800">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>1 Agente de IA Activo 24/7 (WhatsApp Meta + Web)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Hasta 100 Leads Cualificados / mes</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Transcripción y comprensión de notas de voz (Gemini 2.5 Flash)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Catálogo de hasta 20 Inmuebles en tiempo real</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Sincronización con Google Calendar</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Bóveda Privada de Documentos PDF</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Soporte por Email & Chat</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleStartTrial('solo', 'dashboard-checkout')}
              className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all cursor-pointer"
            >
              Comenzar prueba gratis de 14 días
            </button>
          </div>

          {/* Plan 2: Agency Pro */}
          <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-3xl border border-emerald-500/50 p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-2xl shadow-emerald-500/10 relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider rounded-full shadow-md">
              MÁS ELEGIDO
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">{PLAN_LIMITS.pro.name}</span>
                <h3 className="text-3xl font-black text-white mt-1">
                  ${isAnnual ? '79' : '99'} USD{' '}
                  <span className="text-xs font-normal text-slate-400">/mes</span>
                </h3>
                <p className="text-xs text-slate-400 mt-2">
                  Para agencias en crecimiento con WhatsApp multi-asesor y sincronización CRM.
                </p>
              </div>

              <ul className="space-y-3 text-xs text-slate-300 pt-4 border-t border-slate-800">
                <li className="flex items-center gap-2 font-semibold text-white">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>5 Agentes de IA 24/7 (WhatsApp Meta + Web)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Hasta 500 Leads Cualificados / mes</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Transcripción ilimitada de notas de voz con IA</span>
                </li>
                <li className="flex items-center gap-2 font-semibold text-emerald-300">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Integración Tokko Broker & EasyBroker</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Catálogo de hasta 100 Inmuebles</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>CRM con Inbox de chats en vivo e intervención humana</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Evaluador de Rentabilidad & Cap Rate</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Soporte Prioritario VIP 24/7</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleStartTrial('pro', 'dashboard-checkout')}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/25 cursor-pointer"
            >
              Comenzar prueba gratis de 14 días
            </button>
          </div>

          {/* Plan 3: Desarrolladores / Enterprise */}
          <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Desarrolladores / Enterprise</span>
                <h3 className="text-3xl font-black text-white mt-1">A Medida</h3>
                <p className="text-xs text-slate-400 mt-2">
                  Para desarrolladoras, promotoras y redes inmobiliarias.
                </p>
              </div>

              <ul className="space-y-3 text-xs text-slate-300 pt-4 border-t border-slate-800">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Agentes & Sucursales Ilimitadas</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Infraestructura RAG Dedicada</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Sincronización Multi-CRM & Webhooks</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Acceso API para Apps Propias & CRM Local</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Gerente de Cuenta Dedicado & SLA 99.9%</span>
                </li>
              </ul>
            </div>

            <a
              href="https://wa.me/5492604014372?text=Hola!%20Me%20interesa%20el%20plan%20Enterprise%20/%20Desarrolladores%20de%20AriaProp."
              target="_blank"
              rel="noreferrer"
              className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all cursor-pointer text-center block"
            >
              Contactar con Ventas
            </a>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 6. FAQ COMERCIAL ORIENTADA A INMOBILIARIAS                          */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-white/10 space-y-10">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Preguntas Frecuentes</span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Respuestas a tus dudas comerciales
          </h2>
          <p className="text-sm text-slate-400">
            Todo lo que necesitas saber antes de implementar Aria en tu inmobiliaria.
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              q: '¿Puedo usar mi número actual de WhatsApp?',
              a: 'Sí. Podés conectar tu número actual de WhatsApp Business a través del flujo oficial de Meta Cloud API o configurar una línea nueva exclusiva para la atención automatizada de la inmobiliaria.'
            },
            {
              q: '¿Cómo se conecta con mis propiedades?',
              a: 'Podés sincronizar tu inventario en 1 clic mediante la API de Tokko Broker o EasyBroker, cargar tu catálogo en formato Excel/CSV, o cargar fichas individuales directamente desde el panel de control de Aria.'
            },
            {
              q: '¿Mis asesores pueden responder desde la misma conversación?',
              a: 'Absolutamente. Cuando un asesor escribe un mensaje o activa el modo "Atención Humana" desde el CRM, la IA se pausa automáticamente para ese lead, permitiendo una intervención humana transparente y fluida.'
            },
            {
              q: '¿Qué pasa si un cliente envía un audio largo?',
              a: 'Aria procesa y transcribe audios de cualquier duración mediante Gemini 2.5 Flash en segundos. La nota de voz queda guardada en tu panel con su reproductor de audio y el texto transcripto para que el asesor pueda revisarla.'
            },
            {
              q: '¿Los datos de mi inmobiliaria están aislados y seguros?',
              a: 'Sí. Cada inmobiliaria cuenta con aislamiento estricto de base de datos multi-tenant y cifrado TLS/SSL. Tus fichas técnicas, clientes y conversaciones pertenecen exclusivamente a tu agencia y nunca se comparten con terceros.'
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

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 7. FINAL CTA BANNER                                                 */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center border-t border-white/10">
        <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-emerald-500/40 shadow-2xl shadow-emerald-500/10 space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Empezá a responder consultas en segundos hoy mismo
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Unite a las inmobiliarias que ya no pierden clientes por demoras. Configurá tu asistente en minutos y comenzá a agendar visitas 24/7.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => handleStartTrial('pro', 'dashboard-checkout')}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-105"
            >
              <Sparkles className="w-5 h-5 fill-slate-950 text-slate-950" />
              <span>Probar Aria Gratis por 14 días</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};

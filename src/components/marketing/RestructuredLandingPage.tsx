import React, { useState } from 'react';
import { AppRoute } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
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
  Send,
  Lock,
  UserCheck,
  FileCheck
} from 'lucide-react';

interface RestructuredLandingPageProps {
  onRouteChange: (route: AppRoute) => void;
  onOpenPrompt?: (promptText: string) => void;
}

export const RestructuredLandingPage: React.FC<RestructuredLandingPageProps> = ({
  onRouteChange,
  onOpenPrompt,
}) => {
  const { user, loading, openAuthModal } = useAuth();
  const { t } = useLanguage();
  const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>('annual');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [sandboxStep, setSandboxStep] = useState<number>(0);

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
      {/* SECCIÓN 1 — Hero & Simulador Interactivo Sandbox                    */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="relative pt-10 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Value Prop & CTAs (7 Cols) */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold tracking-wide uppercase shadow-lg shadow-emerald-500/10">
              <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>{t('landing_hero_badge')}</span>
            </div>

            {/* H1 Title */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
              Tu inmobiliaria <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">nunca más pierde un lead</span> por responder tarde.
            </h1>

            {/* Subtitle */}
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl">
              {t('landing_hero_subtitle')}
            </p>

            {/* CTA Group */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                onClick={() => {
                  if (onOpenPrompt) {
                    onOpenPrompt('Hola, quisiera ver cómo Aria atiende una propiedad de mi catálogo.');
                  } else {
                    onRouteChange('app');
                  }
                }}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-105"
              >
                <Sparkles className="w-5 h-5 fill-slate-950 text-slate-950" />
                <span>{t('landing_cta_primary')}</span>
              </button>

              <button
                onClick={scrollToHowItWorks}
                className="px-6 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-200 font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t('landing_cta_secondary')}</span>
              </button>
            </div>

            {/* Microcopy of Trust */}
            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {t('landing_microcopy')}
              </span>
            </div>
          </div>

          {/* Right Column: Interactive Sandbox Conversation Simulator (5 Cols) */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl bg-slate-900/90 border border-emerald-500/30 p-5 shadow-2xl shadow-emerald-950/50 space-y-4 relative">
              {/* Header Bar */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                      <Sparkles className="w-4 h-4 fill-emerald-400" />
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-slate-950" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-xs">Aria IA — Inmobiliaria 24/7</h3>
                    <p className="text-[10px] text-emerald-400 font-semibold">🟢 WhatsApp & Web Widget</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/30">
                  {t('demo_lead_score')}
                </span>
              </div>

              {/* Chat Messages */}
              <div className="space-y-3 text-xs min-h-[220px] max-h-[300px] overflow-y-auto pr-1">
                {/* Lead Msg 1 */}
                <div className="flex justify-end">
                  <div className="bg-emerald-600 text-slate-950 font-medium rounded-2xl rounded-tr-none px-4 py-2.5 max-w-[85%] shadow-md">
                    {t('demo_lead_msg1')}
                  </div>
                </div>

                {/* Aria Msg 1 */}
                <div className="flex justify-start">
                  <div className="bg-slate-950 border border-white/10 text-slate-200 rounded-2xl rounded-tl-none px-4 py-2.5 max-w-[90%] shadow-md space-y-2">
                    <p className="leading-relaxed">{t('demo_aria_msg1')}</p>
                    <div className="p-2 rounded-xl bg-slate-900 border border-emerald-500/20 text-[10px] flex items-center gap-2 text-emerald-300">
                      <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Ficha Ref: PROP-102 · Palermo 2 amb</span>
                    </div>
                  </div>
                </div>

                {/* Lead Msg 2 */}
                <div className="flex justify-end">
                  <div className="bg-emerald-600 text-slate-950 font-medium rounded-2xl rounded-tr-none px-4 py-2.5 max-w-[85%] shadow-md">
                    {t('demo_lead_msg2')}
                  </div>
                </div>

                {/* Aria Msg 2 */}
                <div className="flex justify-start">
                  <div className="bg-slate-950 border border-white/10 text-slate-200 rounded-2xl rounded-tl-none px-4 py-2.5 max-w-[90%] shadow-md space-y-2">
                    <p className="leading-relaxed">{t('demo_aria_msg2')}</p>
                    <div className="pt-1 flex gap-2">
                      <button
                        onClick={() => {
                          if (onOpenPrompt) onOpenPrompt('Quiero agendar la visita para el jueves a las 16 hs.');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-[10px] cursor-pointer hover:bg-emerald-400 transition-colors"
                      >
                        📅 Confirmar Visita Jueves 16:00 hs
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Interactive Sandbox Trigger Bar */}
              <div className="pt-2 border-t border-white/10 flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value="¿Tiene cochera disponible y acepta permuta?"
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-slate-400 text-xs cursor-pointer"
                  onClick={() => {
                    if (onOpenPrompt) onOpenPrompt('¿Tiene cochera disponible y acepta permuta?');
                  }}
                />
                <button
                  onClick={() => {
                    if (onOpenPrompt) onOpenPrompt('¿Tiene cochera disponible y acepta permuta?');
                  }}
                  className="p-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SECCIÓN 2 — Flujo: De Consulta a Visita Agendada                     */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section id="how-it-works-section" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> {t('flow_title')}
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            {t('flow_subtitle')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Step 1 */}
          <div className="bg-slate-900/80 p-6 rounded-3xl border border-white/10 hover:border-emerald-500/40 transition-all space-y-4 relative shadow-xl">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-sm">
              01
            </div>
            <h3 className="text-base font-extrabold text-white">{t('flow_step1_title')}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t('flow_step1_desc')}
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-900/80 p-6 rounded-3xl border border-white/10 hover:border-emerald-500/40 transition-all space-y-4 relative shadow-xl">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-sm">
              02
            </div>
            <h3 className="text-base font-extrabold text-white">{t('flow_step2_title')}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t('flow_step2_desc')}
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-900/80 p-6 rounded-3xl border border-white/10 hover:border-emerald-500/40 transition-all space-y-4 relative shadow-xl">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-sm">
              03
            </div>
            <h3 className="text-base font-extrabold text-white">{t('flow_step3_title')}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t('flow_step3_desc')}
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-slate-900/80 p-6 rounded-3xl border border-emerald-500/40 shadow-xl shadow-emerald-500/5 space-y-4 relative">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-sm">
              04
            </div>
            <h3 className="text-base font-extrabold text-white">{t('flow_step4_title')}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t('flow_step4_desc')}
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SECCIÓN 3 — Comparativa Antes vs. Con Aria Prop                      */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">{t('comp_title')}</span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Transformación Comercial para tu Inmobiliaria
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Column 1: Tradicional */}
          <div className="bg-slate-900/60 p-6 sm:p-8 rounded-3xl border border-rose-500/20 space-y-6 relative overflow-hidden">
            <div className="flex items-center gap-3 border-b border-rose-500/20 pb-4">
              <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-2xl">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{t('comp_trad_title')}</h3>
                <p className="text-xs text-rose-400">Pérdida de oportunidades por demoras</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {t('comp_trad_desc')}
            </p>
          </div>

          {/* Column 2: Con Aria Prop */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 p-6 sm:p-8 rounded-3xl border border-emerald-500/40 space-y-6 relative overflow-hidden shadow-xl shadow-emerald-500/5">
            <div className="flex items-center gap-3 border-b border-emerald-500/20 pb-4">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-2xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{t('comp_aria_title')}</h3>
                <p className="text-xs text-emerald-400">Respuesta inmediata & agenda llena</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {t('comp_aria_desc')}
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SECCIÓN 4 — Seguridad & Privacidad B2B                               */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" /> {t('security_title')}
          </div>
          <p className="text-sm text-slate-400">
            {t('security_subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/80 p-6 rounded-3xl border border-white/10 space-y-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl w-fit">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-white text-base">{t('security_feat1_title')}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t('security_feat1_desc')}
            </p>
          </div>

          <div className="bg-slate-900/80 p-6 rounded-3xl border border-white/10 space-y-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl w-fit">
              <FileCheck className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-white text-base">{t('security_feat2_title')}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t('security_feat2_desc')}
            </p>
          </div>

          <div className="bg-slate-900/80 p-6 rounded-3xl border border-white/10 space-y-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl w-fit">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-white text-base">{t('security_feat3_title')}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t('security_feat3_desc')}
            </p>
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

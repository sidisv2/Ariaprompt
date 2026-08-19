import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { AppRoute, Lead } from '../../types';
import {
  Users,
  Calendar,
  MessageSquare,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Bot,
  Calculator,
  Database,
  FileText,
  Zap
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { CrmOnboardingModal } from './CrmOnboardingModal';

interface SummaryDashboardViewProps {
  leads: Lead[];
  onRouteChange: (route: AppRoute) => void;
  onSelectTool?: (toolKey: 'general' | 'finance' | 'rag' | 'files') => void;
}

export const SummaryDashboardView: React.FC<SummaryDashboardViewProps> = ({
  leads,
  onRouteChange,
  onSelectTool,
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [showOnboarding, setShowOnboarding] = React.useState<boolean>(() => {
    return localStorage.getItem('aria_onboarding_completed') !== 'true';
  });

  const [waConnected, setWaConnected] = React.useState<boolean>(false);
  const [waPhoneId, setWaPhoneId] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function checkWhatsAppStatus() {
      try {
        let token = '';
        if (supabase) {
          const { data: sessionData } = await supabase.auth.getSession();
          token = sessionData.session?.access_token || '';
        }
        const res = await fetch('/api/whatsapp/oauth', {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.organization) {
            setWaConnected(Boolean(data.organization.wa_connected));
            setWaPhoneId(data.organization.wa_phone_number_id || null);
          }
        }
      } catch (err) {
        console.warn('WhatsApp status check error:', err);
      }
    }
    checkWhatsAppStatus();
  }, []);

  // Check if agency has connected any CRM or has manual properties
  const hasConnectedCrm = React.useMemo(() => {
    try {
      if (localStorage.getItem('aria_has_connected_crm') === 'true') return true;
      const userId = user?.id || 'demo-agency';
      const tokko = localStorage.getItem(`crm_tokko_${userId}`);
      const easy = localStorage.getItem(`crm_easybroker_${userId}`);
      if (tokko || easy) return true;

      const keys = Object.keys(localStorage);
      return keys.some((k) => (k.startsWith('crm_tokko_') || k.startsWith('crm_easybroker_')));
    } catch {
      return false;
    }
  }, [user]);

  const activeLeadsCount = leads.filter((l) => l.status === 'new' || l.status === 'contacted').length;
  const toursCount = leads.filter((l) => l.status === 'visit_scheduled').length;

  const toolCards = [
    {
      key: 'general' as const,
      title: t('tabs.general'),
      subtitle: 'Atención comercial 24/7 y cualificación de prospectos.',
      icon: <Bot className="w-5 h-5 text-emerald-400" />,
      badge: '24/7 Live',
    },
    {
      key: 'finance' as const,
      title: t('tabs.finance'),
      subtitle: 'Cálculos de ROI, Cap Rate y proyecciones a 5 años.',
      icon: <Calculator className="w-5 h-5 text-emerald-400" />,
      badge: 'ROI & Cashflow',
    },
    {
      key: 'rag' as const,
      title: t('tabs.rag'),
      subtitle: 'Búsqueda instantánea en catálogo e inmuebles.',
      icon: <Database className="w-5 h-5 text-emerald-400" />,
      badge: 'RAG Engine',
    },
    {
      key: 'files' as const,
      title: t('tabs.files'),
      subtitle: 'Indexación interactiva de dossieres y memorias PDF.',
      icon: <FileText className="w-5 h-5 text-emerald-400" />,
      badge: 'Documentos',
    },
  ];

  return (
    <div className="space-y-6 pb-6">
      
      {/* Onboarding Wizard Modal */}
      {showOnboarding && (
        <CrmOnboardingModal
          onClose={() => setShowOnboarding(false)}
          onRouteChange={onRouteChange}
        />
      )}

      {/* Demo Account Welcome Onboarding Banner */}
      {user?.isDemoAccount && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-950/90 via-slate-900 to-indigo-950/90 border-2 border-emerald-500/50 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-page-fade">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0">
              <Sparkles className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="space-y-1 text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-extrabold border border-emerald-500/30">
                <span>👋 ¡Bienvenido al Workspace de Demostración!</span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-white">
                Estás interactuando con la cuenta demo de Aria Prop 24/7
              </h3>
              <p className="text-xs text-slate-300 max-w-xl">
                Esta es una cuenta de prueba 24/7. Probá el chat de Aria en la pestaña <strong>"Agente Comercial"</strong> para ver cómo responde a tus prospectos o revisá las métricas y citas agendadas en tu agenda.
              </p>
            </div>
          </div>
          <button
            onClick={() => onSelectTool?.('general')}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shrink-0 cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            <span>Probar Agente Comercial</span>
          </button>
        </div>
      )}

      {/* Guided Empty State Banner: Prompt to connect Tokko or EasyBroker */}
      {!hasConnectedCrm && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-teal-950/80 via-slate-900 to-emerald-950/80 border-2 border-emerald-500/50 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-page-fade">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-extrabold border border-emerald-500/30 mb-1">
                <Sparkles className="w-3 h-3" />
                <span>Paso Recomendado para Iniciar</span>
              </div>
              <h3 className="text-base font-extrabold text-white">
                Conectá tu CRM (Tokko Broker o EasyBroker)
              </h3>
              <p className="text-xs text-slate-300 max-w-xl mt-0.5">
                Para que tu Asistente IA 24/7 responda a tus prospectos con las propiedades y precios reales de tu agencia, vinculá tu API Key en 1 minuto.
              </p>
            </div>
          </div>

          <button
            onClick={() => onRouteChange('dashboard-integrations')}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer hover:scale-105"
          >
            <span>Conectar CRM Ahora</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* PROMINENT WHATSAPP CONNECTION CTA BANNER */}
      <div
        className={`p-6 rounded-3xl border-2 transition-all backdrop-blur-xl shadow-2xl relative overflow-hidden animate-page-fade ${
          waConnected
            ? 'bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border-emerald-500/40'
            : 'bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950/90 border-emerald-500/60 shadow-emerald-500/10'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0">
              <MessageSquare className="w-7 h-7 text-emerald-400" />
            </div>
            <div className="space-y-1.5 text-left">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                    waConnected
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                  }`}
                >
                  {waConnected ? '🟢 WHATSAPP BUSINESS OFICIAL ACTIVO' : '⚡ PENDIENTE DE CONEXIÓN'}
                </span>
                {waConnected && waPhoneId && (
                  <span className="text-[11px] text-slate-400 font-mono">
                    Phone ID: {waPhoneId}
                  </span>
                )}
              </div>

              <h3 className="text-lg sm:text-xl font-extrabold text-white">
                {waConnected
                  ? 'Tu Inmobiliaria ya tiene a Aria respondiendo en WhatsApp 24/7'
                  : '🚀 Conecta tu WhatsApp Comercial para activar a Aria'}
              </h3>

              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                {waConnected
                  ? 'Cualquier consulta enviada a tu línea oficial de WhatsApp será atendida automáticamente recomendando inmuebles de tu catálogo y registrando leads en tu CRM.'
                  : 'Sigue 2 simples pasos: 1. Haz clic en "Conectar WhatsApp" -> 2. Inicia sesión con Facebook y valida el número oficial de tu inmobiliaria.'}
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <button
              onClick={() => onRouteChange('dashboard-bot-config')}
              className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer hover:scale-105 shadow-xl ${
                waConnected
                  ? 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30'
              }`}
            >
              <MessageSquare className="w-4 h-4 fill-current text-slate-950" />
              <span>{waConnected ? 'Gestionar Conexión' : 'Conectar WhatsApp en 1 Clic'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Welcome Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-emerald-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Workspace Atómico de Inteligencia Inmobiliaria</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {t('dashboard.welcomeTitle')}, {user ? user.nombre.split(' ')[0] : 'Agente'}! 👋
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              {t('dashboard.welcomeSub')}
            </p>
          </div>

          <button
            onClick={() => onRouteChange('dashboard-leads')}
            className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 transition-all cursor-pointer flex items-center gap-2 shrink-0 hover:scale-105"
          >
            <span>Ver Leads de Hoy ({leads.length})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics 4-Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Metric 1 */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-white/10 flex flex-col justify-between space-y-2 hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Users className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              {leads.length > 0 ? 'En vivo' : 'Sin leads'}
            </span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">{leads.length}</span>
            <span className="text-[11px] font-bold text-slate-400 block mt-0.5">{t('dashboard.metricLeadsToday')}</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-white/10 flex flex-col justify-between space-y-2 hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Calendar className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">Google Cal</span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">{toursCount}</span>
            <span className="text-[11px] font-bold text-slate-400 block mt-0.5">{t('dashboard.metricToursScheduled')}</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-white/10 flex flex-col justify-between space-y-2 hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <MessageSquare className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">Respuesta en Segundos</span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">{activeLeadsCount}</span>
            <span className="text-[11px] font-bold text-slate-400 block mt-0.5">{t('dashboard.metricActiveChats')}</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-white/10 flex flex-col justify-between space-y-2 hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">Cap Rate</span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">{leads.length > 0 ? '6.2%' : '0%'}</span>
            <span className="text-[11px] font-bold text-slate-400 block mt-0.5">{t('dashboard.metricAvgRoi')}</span>
          </div>
        </div>

      </div>

      {/* Quick Tools Grid (4 Simplified Tabs Access) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>{t('dashboard.quickActionsTitle')}</span>
          </h3>
          <span className="text-xs text-slate-400">Herramientas simplificadas para agentes</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {toolCards.map((tc) => (
            <button
              key={tc.key}
              onClick={() => onSelectTool?.(tc.key)}
              className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-white/10 hover:border-emerald-500/40 transition-all cursor-pointer text-left flex flex-col justify-between space-y-3 group shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-slate-950 border border-white/10">
                  {tc.icon}
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  {tc.badge}
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                  {tc.title}
                </h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {tc.subtitle}
                </p>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 group-hover:translate-x-1 transition-transform">
                <span>{t('dashboard.goTool')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Prospect Activity Table */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-white/10 space-y-3">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            {t('dashboard.recentActivityTitle')}
          </h3>
          <button
            onClick={() => onRouteChange('dashboard-leads')}
            className="text-xs font-bold text-emerald-400 hover:underline cursor-pointer"
          >
            Ver todos los prospectos →
          </button>
        </div>

        <div className="space-y-2">
          {leads.slice(0, 3).map((lead) => (
            <div key={lead.id} className="p-3 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 font-bold flex items-center justify-center border border-emerald-500/20">
                  {lead.name.charAt(0)}
                </div>
                <div>
                  <span className="font-bold text-white block">{lead.name}</span>
                  <span className="text-[10px] text-slate-400">{lead.preferredZone || 'Polanco'} • Presupuesto: ${lead.budgetMax.toLocaleString('en-US')} USD</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Score: {lead.score}/100
                </span>
                <span className="text-[10px] text-slate-400 hidden sm:inline-block">Hace 12 min</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

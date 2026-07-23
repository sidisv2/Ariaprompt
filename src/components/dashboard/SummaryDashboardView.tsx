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
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">+14% hoy</span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">{activeLeadsCount + 12}</span>
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
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">{toursCount + 5}</span>
            <span className="text-[11px] font-bold text-slate-400 block mt-0.5">{t('dashboard.metricToursScheduled')}</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-white/10 flex flex-col justify-between space-y-2 hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <MessageSquare className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">&lt; 5s res</span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">18</span>
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
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">9.4%</span>
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

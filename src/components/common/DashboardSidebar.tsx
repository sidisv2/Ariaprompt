import React from 'react';
import { AppRoute } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { getPlanLimits } from '../../lib/planLimits';
import { 
  BarChart3, 
  Building2, 
  Users, 
  Bot, 
  CreditCard,
  FolderKey,
  ShieldCheck,
  Globe2,
  Link2,
  MessageSquare,
  Sparkles,
  Zap,
  Lock
} from 'lucide-react';

interface DashboardSidebarProps {
  currentRoute: AppRoute;
  onRouteChange: (route: AppRoute) => void;
  propertiesCount: number;
  leadsCount: number;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  currentRoute,
  onRouteChange,
  propertiesCount,
  leadsCount,
}) => {
  const { t } = useLanguage();
  const { user, getPlanBadgeLabel } = useAuth();

  const planTier = user?.plan ?? 'normal';
  const planLimits = getPlanLimits(planTier);
  const isFreePlan = planTier === 'normal';
  const planLabel = getPlanBadgeLabel();

  // Check if CRM is connected (localStorage heuristic)
  const hasConnectedCrm = React.useMemo(() => {
    try {
      if (localStorage.getItem('aria_has_connected_crm') === 'true') return true;
      const keys = Object.keys(localStorage);
      return keys.some((k) => k.startsWith('crm_tokko_') || k.startsWith('crm_easybroker_'));
    } catch {
      return false;
    }
  }, []);

  const navItems = [
    {
      id: 'dashboard-integrations' as AppRoute,
      label: t('sidebar.integrations'),
      icon: Link2,
      badge: hasConnectedCrm ? 'Conectado' : '★ Recomendado',
      highlight: !hasConnectedCrm,
      /** CRM sync is gated behind 'pro' or higher */
      locked: !planLimits.crmSyncEnabled,
    },
    {
      id: 'dashboard-metrics' as AppRoute,
      label: t('sidebar.metrics'),
      icon: BarChart3,
      badge: 'En directo',
      locked: false,
    },
    {
      id: 'dashboard-properties' as AppRoute,
      label: t('sidebar.properties'),
      icon: Building2,
      count: propertiesCount,
      locked: false,
    },
    {
      id: 'dashboard-leads' as AppRoute,
      label: t('sidebar.leads'),
      icon: Users,
      count: leadsCount,
      locked: false,
    },
    {
      id: 'dashboard-bot-config' as AppRoute,
      label: 'Conexión WhatsApp & Bot',
      icon: MessageSquare,
      badge: '⚡ Meta 1-Clic',
      locked: false,
    },
    {
      id: 'dashboard-assistant' as AppRoute,
      label: 'Asistente IA 24/7 (Sandbox)',
      icon: Bot,
      badge: '✦ En Vivo',
      locked: false,
    },
    {
      id: 'dashboard-files' as AppRoute,
      label: t('sidebar.files'),
      icon: FolderKey,
      badge: 'Supabase',
      locked: false,
    },
    {
      id: 'dashboard-vault' as AppRoute,
      label: t('sidebar.vault'),
      icon: ShieldCheck,
      badge: 'Privado PDF',
      /** PDF Vault requires solo or higher */
      locked: !planLimits.pdfVaultEnabled,
    },
    {
      id: 'dashboard-checkout' as AppRoute,
      label: t('sidebar.checkout'),
      icon: CreditCard,
      badge: 'MercadoPago/USD',
      locked: false,
    },
  ];

  // Usage percentages (relative to current plan limits)
  const leadsUsagePct = planLimits.maxLeadsPerMonth > 0 && planLimits.maxLeadsPerMonth < 999999
    ? Math.min(100, Math.round((leadsCount / planLimits.maxLeadsPerMonth) * 100))
    : 0;
  const propertiesUsagePct = planLimits.maxProperties > 0 && planLimits.maxProperties < 999999
    ? Math.min(100, Math.round((propertiesCount / planLimits.maxProperties) * 100))
    : 0;
  const usagePct = Math.max(leadsUsagePct, propertiesUsagePct);
  const usageColor = usagePct >= 80 ? 'bg-rose-500' : usagePct >= 50 ? 'bg-amber-500' : 'bg-emerald-500';
  const usageGlow = usagePct >= 80 ? 'shadow-[0_0_10px_#f43f5e]' : 'shadow-[0_0_10px_#10b981]';

  return (
    <aside className="w-64 shrink-0 bg-black/40 backdrop-blur-md border-r border-white/5 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between hidden md:flex">
      <div className="space-y-6">
        
        {/* Active Agency Selector Box */}
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)] text-white font-bold text-xs">
            AP
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">Aria Prop LATAM</p>
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <Globe2 className="w-3 h-3 text-emerald-400 inline" />
              {t('sidebar.activeAgency')}
            </p>
          </div>
          {/* Plan chip next to agency name */}
          <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full ${
            planTier === 'pro' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
            planTier === 'solo' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
            planTier === 'desarrolladores' ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' :
            'bg-slate-700 text-slate-400 border border-slate-600'
          }`}>
            {planLabel}
          </span>
        </div>

        {/* Sidebar Nav */}
        <div className="space-y-3">
          
          {/* Main Primary Spotlight: Asistente IA 24/7 */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 px-3 mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Protagonista Principal</span>
            </p>
            <button
              onClick={() => onRouteChange('app')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentRoute === 'app' || currentRoute === 'aria-ai' || currentRoute === 'producto'
                  ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Bot className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Asistente IA 24/7</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                En vivo
              </span>
            </button>
          </div>

          {/* Secondary Group: Herramientas de Apoyo */}
          <div className="space-y-1 pt-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-1.5">
              Herramientas de Apoyo
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentRoute === item.id;
              const isLocked = item.locked;
              return (
                <button
                  key={item.id}
                  onClick={() => onRouteChange(item.id)}
                  title={isLocked ? 'Requiere un plan superior' : undefined}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white/10 text-white font-semibold border border-white/10 shadow-sm'
                      : isLocked
                      ? 'text-slate-600 hover:text-slate-500 hover:bg-white/3 opacity-60'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5 relative">
                    {item.highlight && !isLocked && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    )}
                    <Icon className={`w-4 h-4 ${isActive || item.highlight ? 'text-emerald-400' : isLocked ? 'text-slate-600' : 'text-slate-400'}`} />
                    <span className={item.highlight && !isLocked ? 'font-bold text-emerald-300' : ''}>{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {isLocked && <Lock className="w-3 h-3 text-slate-600" />}
                    {item.count !== undefined && !isLocked && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 text-slate-300 font-mono">
                        {item.count}
                      </span>
                    )}
                    {item.badge && item.count === undefined && !isLocked && (
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        item.highlight 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                          : 'text-slate-500 font-medium'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Footer — Plan Status + Upgrade CTA (if normal) or Quota Bar */}
      <div className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-2">
        {isFreePlan ? (
          /* Free plan: show upgrade prompt */
          <>
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                Plan Gratuito
              </span>
              <span className="text-[9px] text-slate-500">{planLimits.maxLeadsPerMonth} leads / mes</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-snug">
              {propertiesCount}/{planLimits.maxProperties} propiedades · {leadsCount}/{planLimits.maxLeadsPerMonth} leads
            </p>
            <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden mt-1">
              <div
                className={`${usageColor} ${usageGlow} h-full rounded-full transition-all`}
                style={{ width: `${usagePct}%` }}
              />
            </div>
            <button
              onClick={() => onRouteChange('dashboard-checkout')}
              className="w-full mt-1 py-2 px-3 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[11px] font-bold border border-emerald-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-900/30 animate-pulse-slow"
            >
              <Zap className="w-3.5 h-3.5 shrink-0" />
              <span>⚡ Mejorar Plan</span>
            </button>
          </>
        ) : (
          /* Paid plan: show quota bar */
          <>
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">
                {t('sidebar.activeQuota')}
              </span>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"></div>
            </div>
            <p className="text-xs text-slate-300">{t('sidebar.quotaSubtitle')}</p>
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className={`${usageColor} ${usageGlow} h-full rounded-full transition-all`}
                style={{ width: `${Math.max(4, usagePct)}%` }}
              />
            </div>
            <button
              onClick={() => onRouteChange('dashboard-checkout')}
              className="w-full mt-2 py-1.5 px-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-medium border border-emerald-500/20 transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>{t('sidebar.managePayments')}</span>
            </button>
          </>
        )}
      </div>
    </aside>
  );
};

export default DashboardSidebar;

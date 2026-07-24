import React from 'react';
import { AppRoute } from '../../types';
import { 
  BarChart3, 
  Building2, 
  Users, 
  Bot, 
  CreditCard,
  FolderKey,
  ExternalLink,
  ShieldCheck,
  Globe2,
  Link2
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
  const navItems = [
    {
      id: 'dashboard-metrics' as AppRoute,
      label: 'Métricas & En Vivo',
      icon: BarChart3,
      badge: 'En directo',
    },
    {
      id: 'dashboard-properties' as AppRoute,
      label: 'Catálogo Propiedades',
      icon: Building2,
      count: propertiesCount,
    },
    {
      id: 'dashboard-integrations' as AppRoute,
      label: 'Conexión CRM Partners',
      icon: Link2,
      badge: 'Tokko/EasyBroker',
    },
    {
      id: 'dashboard-leads' as AppRoute,
      label: 'CRM Leads & Chat',
      icon: Users,
      count: leadsCount,
    },
    {
      id: 'dashboard-bot-config' as AppRoute,
      label: 'Configurador Aria Prop',
      icon: Bot,
      badge: 'Script Embed',
    },
    {
      id: 'dashboard-files' as AppRoute,
      label: 'Mis Archivos & Perfil',
      icon: FolderKey,
      badge: 'Supabase',
    },
    {
      id: 'dashboard-vault' as AppRoute,
      label: 'Bóveda Privada PDF',
      icon: ShieldCheck,
      badge: 'Privado PDF',
    },
    {
      id: 'dashboard-checkout' as AppRoute,
      label: 'Planes & Pagos LATAM',
      icon: CreditCard,
      badge: 'MercadoPago/USD',
    },
  ];

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
              Agencia Enterprise LATAM
            </p>
          </div>
        </div>

        {/* Sidebar Nav */}
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-2">Panel de Control</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onRouteChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white/10 text-white font-semibold border border-white/10 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 text-slate-300 font-mono">
                    {item.count}
                  </span>
                )}
                {item.badge && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-semibold uppercase">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

      </div>

      {/* Footer Quota Box */}
      <div className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Pro LATAM Activo</span>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"></div>
        </div>
        <p className="text-xs text-slate-300">Aria Prop IA 24/7 en línea</p>
        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
          <div className="bg-emerald-500 h-full w-[88%] rounded-full shadow-[0_0_10px_#10b981]"></div>
        </div>
        <button
          onClick={() => onRouteChange('dashboard-checkout')}
          className="w-full mt-2 py-1.5 px-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-medium border border-emerald-500/20 transition-all flex items-center justify-center gap-1 cursor-pointer"
        >
          <span>Gestionar Pagos</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </aside>
  );
};

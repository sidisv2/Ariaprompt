import React from 'react';
import { AppRoute } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Home,
  Tag,
  BarChart3,
  Building2,
  UserCheck,
  LogIn,
} from 'lucide-react';

interface MobileBottomNavProps {
  currentRoute: AppRoute;
  onRouteChange: (route: AppRoute) => void;
  propertiesCount?: number;
  leadsCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentRoute,
  onRouteChange,
  propertiesCount = 0,
  leadsCount = 0,
}) => {
  const { user, openAuthModal } = useAuth();
  const { t } = useLanguage();

  const isRouteActive = (route: AppRoute) => currentRoute === route;
  const isDashboard = currentRoute.startsWith('dashboard');

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-2xl border-t border-white/10 px-2 py-1.5 pb-safe shadow-2xl">
      <div className="flex items-center justify-around max-w-md mx-auto">
        
        {/* Tab 1: Inicio */}
        <button
          onClick={() => onRouteChange('marketing')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all active:scale-90 cursor-pointer ${
            isRouteActive('marketing')
              ? 'text-emerald-400 bg-emerald-500/10 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Home className={`w-5 h-5 ${isRouteActive('marketing') ? 'stroke-[2.5px]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-1 tracking-tight">{t('mobile_nav.home')}</span>
        </button>

        {/* Tab 2: Precios */}
        <button
          onClick={() => onRouteChange('pricing')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all active:scale-90 cursor-pointer ${
            isRouteActive('pricing') || currentRoute === 'dashboard-checkout'
              ? 'text-emerald-400 bg-emerald-500/10 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Tag className={`w-5 h-5 ${isRouteActive('pricing') ? 'stroke-[2.5px]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-1 tracking-tight">{t('mobile_nav.pricing')}</span>
        </button>

        {/* Tab 3: Dashboard / Leads */}
        <button
          onClick={() => onRouteChange('dashboard-metrics')}
          className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all active:scale-90 cursor-pointer ${
            isDashboard && currentRoute !== 'dashboard-properties'
              ? 'text-emerald-400 bg-emerald-500/10 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 className={`w-5 h-5 ${isDashboard ? 'stroke-[2.5px]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-1 tracking-tight">{t('mobile_nav.metrics')}</span>
          {leadsCount > 0 && (
            <span className="absolute top-1 right-2.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-pulse" />
          )}
        </button>

        {/* Tab 4: Propiedades */}
        <button
          onClick={() => onRouteChange('dashboard-properties')}
          className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all active:scale-90 cursor-pointer ${
            currentRoute === 'dashboard-properties'
              ? 'text-emerald-400 bg-emerald-500/10 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building2 className={`w-5 h-5 ${currentRoute === 'dashboard-properties' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-1 tracking-tight">{t('mobile_nav.properties')}</span>
          {propertiesCount > 0 && (
            <span className="absolute top-1 right-2.5 text-[9px] font-bold text-slate-950 bg-teal-400 px-1 rounded-full">
              {propertiesCount}
            </span>
          )}
        </button>

        {/* Tab 5: Cuenta / Archivos / Auth */}
        <button
          onClick={() => {
            if (!user) {
              openAuthModal('login');
            } else {
              onRouteChange('dashboard-files');
            }
          }}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all active:scale-90 cursor-pointer ${
            currentRoute === 'dashboard-files' || currentRoute === 'dashboard-profile'
              ? 'text-emerald-400 bg-emerald-500/10 font-bold'
              : user
              ? 'text-teal-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          {user ? (
            user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.nombre}
                className="w-5 h-5 rounded-full border border-emerald-400 object-cover"
              />
            ) : (
              <UserCheck className="w-5 h-5 text-emerald-400" />
            )
          ) : (
            <LogIn className="w-5 h-5" />
          )}
          <span className="text-[10px] mt-1 tracking-tight">
            {user ? t('mobile_nav.files') : t('mobile_nav.login')}
          </span>
        </button>

      </div>
    </nav>
  );
};

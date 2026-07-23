import React from 'react';
import { AppRoute } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { RealtimeDot } from '../common/RealtimeDot';
import { Building2, Sparkles, Sliders, LogOut, LogIn, ChevronRight } from 'lucide-react';

interface MobileHeaderProps {
  currentRoute: AppRoute;
  onRouteChange: (route: AppRoute) => void;
  agencyName?: string;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  currentRoute,
  onRouteChange,
  agencyName = 'Aria Prop LATAM',
}) => {
  const { user, openAuthModal, signOut } = useAuth();
  const isDashboard = currentRoute.startsWith('dashboard');

  return (
    <header className="sticky top-0 z-30 w-full bg-slate-950/90 backdrop-blur-xl border-b border-white/10 px-4 py-3">
      <div className="flex items-center justify-between">
        
        {/* Left Branding */}
        <div 
          onClick={() => onRouteChange('marketing')}
          className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md shadow-emerald-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Building2 className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm text-white tracking-tight">Aria Prop</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                App
              </span>
            </div>
            <p className="text-[9px] text-slate-400 truncate max-w-[110px]">{agencyName}</p>
          </div>
        </div>

        {/* Right Status & Auth Action */}
        <div className="flex items-center gap-2">
          <RealtimeDot />

          {isDashboard && (
            <button
              onClick={() => onRouteChange('dashboard-bot-config')}
              className="p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-300 active:bg-white/10 text-xs flex items-center gap-1 cursor-pointer"
              title="Configurar IA"
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          )}

          {user ? (
            <div className="flex items-center gap-1.5 pl-1">
              <button
                onClick={() => onRouteChange('dashboard-files')}
                className="cursor-pointer active:scale-90 transition-transform"
                title="Mis Archivos & Perfil"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.nombre}
                    className="w-7 h-7 rounded-full border border-emerald-400 object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-xs flex items-center justify-center">
                    {user.nombre.charAt(0).toUpperCase()}
                  </div>
                )}
              </button>
              <button
                onClick={signOut}
                className="p-1.5 rounded-lg bg-slate-900 border border-white/10 text-slate-400 hover:text-rose-400 active:scale-95 transition-all cursor-pointer"
                title="Cerrar Sesión"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs active:scale-95 transition-transform flex items-center gap-1 shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Ingresar</span>
            </button>
          )}

        </div>

      </div>

      {/* Sub-navigation pills for Mobile Dashboard */}
      {isDashboard && (
        <div className="flex items-center gap-1.5 pt-2.5 mt-2 border-t border-white/5 overflow-x-auto scrollbar-none pb-0.5">
          <button
            onClick={() => onRouteChange('dashboard-metrics')}
            className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
              currentRoute === 'dashboard-metrics'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'bg-slate-900 text-slate-400 border border-white/5'
            }`}
          >
            📊 Métricas
          </button>
          
          <button
            onClick={() => onRouteChange('dashboard-properties')}
            className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
              currentRoute === 'dashboard-properties'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'bg-slate-900 text-slate-400 border border-white/5'
            }`}
          >
            🏢 Inmuebles
          </button>

          <button
            onClick={() => onRouteChange('dashboard-leads')}
            className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
              currentRoute === 'dashboard-leads'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'bg-slate-900 text-slate-400 border border-white/5'
            }`}
          >
            💬 CRM & Chat
          </button>

          <button
            onClick={() => onRouteChange('dashboard-bot-config')}
            className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
              currentRoute === 'dashboard-bot-config'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'bg-slate-900 text-slate-400 border border-white/5'
            }`}
          >
            ⚙️ Bot
          </button>

          <button
            onClick={() => onRouteChange('dashboard-files')}
            className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
              currentRoute === 'dashboard-files' || currentRoute === 'dashboard-profile'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'bg-slate-900 text-slate-400 border border-white/5'
            }`}
          >
            📁 Mis Archivos
          </button>

          <button
            onClick={() => onRouteChange('dashboard-checkout')}
            className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
              currentRoute === 'dashboard-checkout'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'bg-slate-900 text-slate-400 border border-white/5'
            }`}
          >
            💳 Pagos
          </button>
        </div>
      )}
    </header>
  );
};

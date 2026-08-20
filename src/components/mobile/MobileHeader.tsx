import React, { useState } from 'react';
import { AppRoute } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSelector } from '../common/LanguageSelector';
import { RealtimeDot } from '../common/RealtimeDot';
import {
  Building2,
  Sliders,
  LogOut,
  LogIn,
  Menu,
  X,
  Package,
  Briefcase,
  Bot,
  Tag,
  HelpCircle,
  BookOpen,
  Crown,
  LayoutDashboard,
} from 'lucide-react';

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
  const { user, openAuthModal, requestSignOut } = useAuth();
  const { t } = useLanguage();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isDashboard = currentRoute.startsWith('dashboard');

  const drawerSections = [
    {
      label: '📦 Producto',
      icon: Package,
      action: () => onRouteChange('producto'),
    },
    {
      label: '💼 Soluciones',
      icon: Briefcase,
      action: () => onRouteChange('soluciones'),
    },
    {
      label: '🤖 Aria AI / Playground',
      icon: Bot,
      action: () => onRouteChange('aria-ai'),
    },
    {
      label: '💰 Precios & Planes',
      icon: Tag,
      action: () => onRouteChange('pricing'),
    },
    {
      label: '❓ Preguntas Frecuentes (FAQ)',
      icon: HelpCircle,
      action: () => onRouteChange('recursos'),
    },
    {
      label: '📖 Cómo Funciona',
      icon: BookOpen,
      action: () => onRouteChange('recursos'),
    },
    {
      label: user ? '👑 Mi Panel / Dashboard' : '🔑 Ingresar a Mi Cuenta',
      icon: user ? Crown : LogIn,
      action: () => {
        if (user) {
          onRouteChange('dashboard-metrics');
        } else {
          openAuthModal('login');
        }
      },
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-slate-950/95 backdrop-blur-xl border-b border-white/10 px-2.5 sm:px-4 py-2 relative">
        <div className="flex items-center justify-between gap-1.5 sm:gap-2 max-w-full">
          
          {/* Left Branding + Hamburger Menu Toggle */}
          <div className="flex items-center gap-2 min-w-0 shrink">
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-1.5 rounded-xl bg-slate-900 border border-emerald-500/30 text-emerald-400 hover:text-white active:scale-95 transition-all cursor-pointer shrink-0"
              title="Abrir menú de navegación"
              aria-label="Abrir menú de navegación"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div 
              onClick={() => onRouteChange('marketing')}
              className="flex items-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95 transition-transform min-w-0 shrink"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md shadow-emerald-500/20 shrink-0">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-black text-xs sm:text-sm text-white tracking-tight truncate">Aria Prop</span>
                  <span className="text-[8px] sm:text-[9px] px-1 py-0.2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold shrink-0">
                    App
                  </span>
                </div>
                <p className="text-[9px] text-slate-400 truncate max-w-[65px] sm:max-w-[110px]">{agencyName}</p>
              </div>
            </div>
          </div>

          {/* Right Status & Actions */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 flex-nowrap">
            
            {/* Mobile Language Switcher Dropdown */}
            <LanguageSelector variant="mobile" />

            <RealtimeDot />

            {isDashboard && (
              <button
                onClick={() => onRouteChange('dashboard-bot-config')}
                className="p-1.5 sm:p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-300 active:bg-white/10 text-xs flex items-center justify-center shrink-0 cursor-pointer"
                title="Configurar IA"
              >
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              </button>
            )}

            {user ? (
              <div className="flex items-center gap-1 sm:gap-1.5 pl-0.5 shrink-0">
                <button
                  onClick={() => onRouteChange('dashboard-files')}
                  className="cursor-pointer active:scale-90 transition-transform shrink-0"
                  title="Mis Archivos & Perfil"
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.nombre}
                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-emerald-400 object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-xs flex items-center justify-center">
                      {user.nombre.charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>
                <button
                  onClick={requestSignOut}
                  className="p-1.5 rounded-lg bg-slate-900 border border-white/10 text-slate-400 hover:text-rose-400 active:scale-95 transition-all cursor-pointer shrink-0"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs active:scale-95 transition-transform flex items-center gap-1 shadow-md shadow-emerald-500/20 cursor-pointer shrink-0 whitespace-nowrap"
              >
                <LogIn className="w-3.5 h-3.5 shrink-0" />
                <span className="leading-none">Ingresar</span>
              </button>
            )}

          </div>

        </div>

        {/* Sub-navigation pills for Mobile Dashboard */}
        {isDashboard && (
          <div className="flex items-center gap-1.5 pt-2 mt-1.5 border-t border-white/5 overflow-x-auto scrollbar-none pb-0.5">
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

      {/* ─── Mobile Slide-out Navigation Drawer ─── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[9999] flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer Sheet Panel */}
          <div className="relative z-10 w-4/5 max-w-xs bg-[#0b141a]/95 backdrop-blur-xl border-r border-emerald-500/30 p-5 flex flex-col justify-between h-full shadow-2xl text-white animate-slideInLeft">
            <div className="space-y-6">
              {/* Header inside Drawer */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md">
                    <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-emerald-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-white">Aria Prop</h3>
                    <p className="text-[10px] text-slate-400">Navegación Móvil</p>
                  </div>
                </div>

                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Sections */}
              <nav className="space-y-2">
                {drawerSections.map((sec) => (
                  <button
                    key={sec.label}
                    onClick={() => {
                      sec.action();
                      setDrawerOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-slate-900/80 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 text-xs font-extrabold text-slate-200 hover:text-emerald-400 transition-all text-left cursor-pointer active:scale-95"
                  >
                    <sec.icon className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{sec.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Footer inside Drawer */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-bold">Idioma:</span>
                <LanguageSelector variant="mobile" />
              </div>

              {user ? (
                <button
                  onClick={() => {
                    onRouteChange('dashboard-metrics');
                    setDrawerOpen(false);
                  }}
                  className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Crown className="w-4 h-4" />
                  <span>Mi Panel / Dashboard</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    openAuthModal('login');
                    setDrawerOpen(false);
                  }}
                  className="w-full py-2.5 rounded-2xl bg-emerald-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Ingresar a Mi Cuenta</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileHeader;

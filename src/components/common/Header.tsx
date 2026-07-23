import React, { useState } from 'react';
import { AppRoute } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Globe, ChevronDown, User, LogOut, LayoutDashboard, Bot, FileText, HelpCircle, Building } from 'lucide-react';

interface HeaderProps {
  currentRoute?: AppRoute;
  onRouteChange?: (r: AppRoute) => void;
  agencyName?: string;
}

export const Header: React.FC<HeaderProps> = ({ currentRoute = 'marketing', onRouteChange, agencyName = 'Aria Prop' }) => {
  const { user, openAuthModal, signOut } = useAuth();
  const [activeDropdown, setActiveDropdown] = useState<'producto' | 'soluciones' | 'recursos' | null>(null);

  const navigateTo = (route: AppRoute) => {
    setActiveDropdown(null);
    onRouteChange?.(route);
  };

  return (
    <header className="sticky top-0 z-40 w-full px-4 sm:px-6 lg:px-8 pt-3 pb-1 bg-transparent">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between h-14 px-6 rounded-full bg-slate-900/90 border border-emerald-500/30 shadow-2xl backdrop-blur-xl text-white">
          
          {/* Logo & Subtitle & Account Pill (Left) */}
          <div className="flex items-center gap-3">
            
            {/* Logo */}
            <div
              className="flex items-center gap-2 cursor-pointer group"
              onClick={() => navigateTo('marketing')}
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-400 via-teal-300 to-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-400/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                AP
              </div>
              <span className="font-black text-sm text-white tracking-tight">{agencyName}</span>
            </div>

            {/* Divider */}
            <div className="h-4 w-px bg-white/10 hidden sm:block" />

            {/* Subtitle */}
            <span className="hidden lg:block text-[11px] text-slate-400 font-medium whitespace-nowrap">
              AI Workspace for Real Estate
            </span>

            {/* Account / Profile Pill on Left */}
            <div
              onClick={() => navigateTo('dashboard-roles')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-emerald-400/50 hover:bg-slate-700/80 text-xs font-bold text-white cursor-pointer transition-all hover:scale-105 shadow-sm"
              title="Gestión de Perfil, Roles y Suscripciones"
            >
              <div className="w-4 h-4 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center font-bold text-[9px]">
                <User className="w-2.5 h-2.5 stroke-[3]" />
              </div>
              <span className="hidden sm:inline-block truncate max-w-[70px] text-white font-bold">
                {user ? user.nombre.split(' ')[0] : 'Cuenta'}
              </span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-400 text-slate-950 text-[9px] font-black uppercase">
                {user?.role === 'admin' ? 'Admin' : user ? 'Pro' : 'Guest'}
              </span>
            </div>

          </div>

          {/* Cloudairy Central Dropdown Navigation Links */}
          <nav className="hidden md:flex items-center gap-5 text-xs font-bold text-slate-300 relative">
            
            {/* Producto Dropdown with Hover Bridge */}
            <div
              className="relative py-3"
              onMouseEnter={() => setActiveDropdown('producto')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                onClick={() => navigateTo('aria-ai')}
                className={`hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer ${
                  currentRoute === 'aria-ai' || currentRoute === 'producto' ? 'text-emerald-400 font-extrabold' : ''
                }`}
              >
                <span>Aria AI</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {activeDropdown === 'producto' && (
                <div className="absolute top-full left-0 pt-2 z-50 animate-fadeIn">
                  <div className="w-56 p-2 bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl space-y-1 text-left backdrop-blur-xl">
                    <button
                      onClick={() => navigateTo('aria-ai')}
                      className="w-full px-3 py-2 rounded-xl hover:bg-emerald-500/20 text-left text-xs font-semibold text-slate-200 hover:text-emerald-300 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Bot className="w-4 h-4 text-emerald-400" />
                      <span>Playground Aria AI Live</span>
                    </button>
                    <button
                      onClick={() => navigateTo('aria-ai')}
                      className="w-full px-3 py-2 rounded-xl hover:bg-emerald-500/20 text-left text-xs font-semibold text-slate-200 hover:text-emerald-300 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-teal-300" />
                      <span>Aria AI Engine</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Soluciones Dropdown with Hover Bridge */}
            <div
              className="relative py-3"
              onMouseEnter={() => setActiveDropdown('soluciones')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                onClick={() => navigateTo('soluciones')}
                className={`hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer ${
                  currentRoute === 'soluciones' ? 'text-emerald-400 font-extrabold' : ''
                }`}
              >
                <span>Soluciones</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {activeDropdown === 'soluciones' && (
                <div className="absolute top-full left-0 pt-2 z-50 animate-fadeIn">
                  <div className="w-56 p-2 bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl space-y-1 text-left backdrop-blur-xl">
                    <button
                      onClick={() => navigateTo('soluciones')}
                      className="w-full px-3 py-2 rounded-xl hover:bg-emerald-500/20 text-left text-xs font-semibold text-slate-200 hover:text-emerald-300 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <User className="w-4 h-4 text-emerald-400" />
                      <span>Para Compradores</span>
                    </button>
                    <button
                      onClick={() => navigateTo('soluciones')}
                      className="w-full px-3 py-2 rounded-xl hover:bg-emerald-500/20 text-left text-xs font-semibold text-slate-200 hover:text-emerald-300 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Building className="w-4 h-4 text-teal-300" />
                      <span>Para Inversionistas & Agentes</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Aria AI Button */}
            <button
              onClick={() => navigateTo('producto')}
              className="hover:text-emerald-300 text-emerald-400 font-extrabold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Aria AI</span>
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            </button>

            {/* Recursos Dropdown with Hover Bridge */}
            <div
              className="relative py-3"
              onMouseEnter={() => setActiveDropdown('recursos')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                onClick={() => navigateTo('recursos')}
                className={`hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer ${
                  currentRoute === 'recursos' ? 'text-emerald-400 font-extrabold' : ''
                }`}
              >
                <span>Recursos</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {activeDropdown === 'recursos' && (
                <div className="absolute top-full left-0 pt-2 z-50 animate-fadeIn">
                  <div className="w-56 p-2 bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl space-y-1 text-left backdrop-blur-xl">
                    <button
                      onClick={() => navigateTo('recursos')}
                      className="w-full px-3 py-2 rounded-xl hover:bg-emerald-500/20 text-left text-xs font-semibold text-slate-200 hover:text-emerald-300 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <span>Documentación RAG</span>
                    </button>
                    <button
                      onClick={() => navigateTo('recursos')}
                      className="w-full px-3 py-2 rounded-xl hover:bg-emerald-500/20 text-left text-xs font-semibold text-slate-200 hover:text-emerald-300 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <HelpCircle className="w-4 h-4 text-teal-300" />
                      <span>Preguntas Frecuentes</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Cómo funciona */}
            <button
              onClick={() => {
                const el = document.getElementById('how-it-works');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                else navigateTo('soluciones');
              }}
              className="hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Cómo funciona
            </button>

            {/* Precios */}
            <button
              onClick={() => navigateTo('pricing')}
              className={`hover:text-emerald-400 transition-colors cursor-pointer ${
                currentRoute === 'pricing' ? 'text-emerald-400 font-extrabold' : ''
              }`}
            >
              Precios
            </button>

            {/* FAQ */}
            <button
              onClick={() => {
                const el = document.getElementById('faq');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                else navigateTo('recursos');
              }}
              className="hover:text-emerald-400 transition-colors cursor-pointer"
            >
              FAQ
            </button>
          </nav>

          {/* Right CTAs */}
          <div className="flex items-center gap-2.5">
            {/* Language Pill */}
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 border border-white/10 text-[11px] text-slate-300 font-bold">
              <Globe className="w-3 h-3 text-emerald-400" />
              <span>ES</span>
            </div>

            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateTo('dashboard-metrics')}
                  className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Panel</span>
                </button>
                <button
                  onClick={() => signOut()}
                  className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => openAuthModal('login')}
                  className="px-4 py-1.5 rounded-full bg-slate-800/90 hover:bg-slate-800 text-white font-bold text-xs border border-white/10 hover:border-emerald-500/40 transition-all cursor-pointer"
                >
                  Acceso
                </button>

                <button
                  onClick={() => openAuthModal('signup', 'pro', 'dashboard-checkout')}
                  className="px-5 py-1.5 rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-black text-xs shadow-lg shadow-emerald-400/20 transition-all cursor-pointer flex items-center gap-1 hover:scale-105"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                  <span>Agendar demo</span>
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

export default Header;

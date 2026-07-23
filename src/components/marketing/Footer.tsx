import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { AppRoute } from '../../types';
import { ShieldCheck, Lock, CheckCircle2, Globe, Sparkles } from 'lucide-react';

interface FooterProps {
  onRouteChange?: (route: AppRoute) => void;
}

export const Footer: React.FC<FooterProps> = ({ onRouteChange }) => {
  const { t, lang } = useLanguage();

  const handleNav = (route: AppRoute) => {
    if (onRouteChange) onRouteChange(route);
  };

  return (
    <footer className="bg-slate-950 text-slate-400 text-xs border-t border-white/10 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Multi-Column Structured Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* Column 1: Brand & Security Badges */}
          <div className="space-y-4 lg:col-span-1">
            <div
              className="flex items-center gap-2 cursor-pointer group"
              onClick={() => handleNav('marketing')}
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-400 via-teal-300 to-emerald-400 text-slate-950 font-black text-xs shadow-md flex items-center justify-center">
                AP
              </div>
              <span className="font-black text-sm text-white tracking-tight">Aria Prop</span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              {t('footer.description')}
            </p>

            {/* Mini Security Badges */}
            <div className="pt-2 space-y-1.5 border-t border-white/5">
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Cumplimiento RGPD & Privacy</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-300 font-medium">
                <Lock className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                <span>Cifrado SSL de 256 bits</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-300 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-teal-400" />
                <span>Disponibilidad 99.9% Garantizada</span>
              </div>
            </div>
          </div>

          {/* Column 2: Producto */}
          <div className="space-y-3">
            <h4 className="text-white font-extrabold text-xs uppercase tracking-wider">
              {t('footer.col1')}
            </h4>
            <ul className="space-y-2 text-slate-400 text-[11px]">
              <li>
                <button onClick={() => handleNav('aria-ai')} className="hover:text-emerald-400 transition-colors">
                  Aria AI Assistant 24/7
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('dashboard-files')} className="hover:text-emerald-400 transition-colors">
                  Motor RAG de Expedientes
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('dashboard-metrics')} className="hover:text-emerald-400 transition-colors">
                  Calculadora ROI & Cap Rate
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('pricing')} className="hover:text-emerald-400 transition-colors">
                  Planes & Tarifas LATAM
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Comparar / Alternativas (New) */}
          <div className="space-y-3">
            <h4 className="text-white font-extrabold text-xs uppercase tracking-wider">
              {lang === 'es' ? 'Comparar / Alternativas' : 'Compare / Alternatives'}
            </h4>
            <ul className="space-y-2 text-slate-400 text-[11px]">
              <li>
                <button onClick={() => handleNav('comparar-manual')} className="hover:text-emerald-400 transition-colors text-left">
                  {lang === 'es' ? 'vs. Atención Manual de Leads' : 'vs. Manual Lead Engagement'}
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('comparar-crm')} className="hover:text-emerald-400 transition-colors text-left">
                  {lang === 'es' ? 'vs. CRM Tradicional' : 'vs. Traditional CRM'}
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('comparar-chatbots')} className="hover:text-emerald-400 transition-colors text-left">
                  {lang === 'es' ? 'vs. Chatbots de Reglas' : 'vs. Rule-Based Chatbots'}
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Soluciones */}
          <div className="space-y-3">
            <h4 className="text-white font-extrabold text-xs uppercase tracking-wider">
              {t('footer.col2')}
            </h4>
            <ul className="space-y-2 text-slate-400 text-[11px]">
              <li>
                <button onClick={() => handleNav('soluciones')} className="hover:text-emerald-400 transition-colors">
                  {lang === 'es' ? 'Para Agencias Inmobiliarias' : 'For Real Estate Agencies'}
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('soluciones')} className="hover:text-emerald-400 transition-colors">
                  {lang === 'es' ? 'Para Desarrolladores' : 'For Developers'}
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('soluciones')} className="hover:text-emerald-400 transition-colors">
                  {lang === 'es' ? 'Para Inversionistas' : 'For Investors'}
                </button>
              </li>
            </ul>
          </div>

          {/* Column 5: Recursos & Legal */}
          <div className="space-y-3">
            <h4 className="text-white font-extrabold text-xs uppercase tracking-wider">
              {t('footer.col4')}
            </h4>
            <ul className="space-y-2 text-slate-400 text-[11px]">
              <li>
                <button onClick={() => handleNav('recursos')} className="hover:text-emerald-400 transition-colors">
                  {lang === 'es' ? 'Política de Privacidad' : 'Privacy Policy'}
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('recursos')} className="hover:text-emerald-400 transition-colors">
                  {lang === 'es' ? 'Términos del Servicio' : 'Terms of Service'}
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('recursos')} className="hover:text-emerald-400 transition-colors">
                  {lang === 'es' ? 'Seguridad & Protección Datos' : 'Security & Data Protection'}
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Copyright & Rights */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} Aria Prop AI. {t('footer.rights')}</p>
          <div className="flex items-center gap-4">
            <span>Powered by Gemini 2.5 Flash & Next.js Engine</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">Latency &lt; 5s</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

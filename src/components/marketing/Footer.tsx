import React from 'react';
import { RealtimeDot } from '../common/RealtimeDot';
import { Building2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-slate-950 border-t border-white/10 text-slate-400 text-xs py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="font-bold text-white text-base">Aria <span className="text-emerald-400">Prop</span></span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Plataforma SaaS B2B de Agentes Inmobiliarios con Inteligencia Artificial.
            </p>
            <RealtimeDot label="Aria Prop 99.9% SLA" />
          </div>

          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Aria AI</h4>
            <ul className="space-y-2">
              <li><a href="#demo" className="hover:text-emerald-400 transition-colors">Playground Live</a></li>
              <li><a href="#how-it-works" className="hover:text-emerald-400 transition-colors">{t('nav.howItWorks')}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Plataforma</h4>
            <ul className="space-y-2">
              <li><a href="#pricing" className="hover:text-emerald-400 transition-colors">{t('nav.pricing')}</a></li>
              <li><a href="#faq" className="hover:text-emerald-400 transition-colors">{t('nav.faq')}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Legales</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Privacidad RGPD / GDPR</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Términos de Servicio</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Seguridad AES-256</a></li>
            </ul>
          </div>

        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} Aria Prop Inc. {t('footer.rights')}</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-slate-300">Twitter</a>
            <a href="#" className="hover:text-slate-300">LinkedIn</a>
            <a href="#" className="hover:text-slate-300">GitHub</a>
          </div>
        </div>

      </div>
    </footer>
  );
};

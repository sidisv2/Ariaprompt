import React from 'react';
import { RealtimeDot } from '../common/RealtimeDot';
import { Building2, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
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
              Plataforma SaaS B2B de Agentes Inmobiliarios con Inteligencia Artificial para Latinoamérica.
            </p>
            <RealtimeDot label="Aria Prop en línea al 100% en LATAM" />
          </div>

          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Aria AI</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="hover:text-emerald-400 transition-colors">Motor RAG Inmobiliario</a></li>
              <li><a href="#features" className="hover:text-emerald-400 transition-colors">Lead Scoring Automático</a></li>
              <li><a href="#features" className="hover:text-emerald-400 transition-colors">Conexión WhatsApp Business</a></li>
              <li><a href="#features" className="hover:text-emerald-400 transition-colors">Widget Embebible Web</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Soluciones</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Agencias Promotoras</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Patrimonios & Family Offices</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Fondos de Inversión Inmobiliaria</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Franquicias & Redes</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Legal & Seguridad</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> RGPD / GDPR Compliant</li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Términos de Servicio B2B</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Política de Privacidad</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">SLA 99.9% Garantizado</a></li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© 2026 PropTech AI Agent Platform. Todos los derechos reservados.</p>
          <p className="flex items-center gap-1">
            Diseñado con estándar Enterprise SaaS (Vercel / Linear style)
          </p>
        </div>

      </div>
    </footer>
  );
};

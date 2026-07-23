import React from 'react';
import { SolutionsGrid } from '../solutions/SolutionsGrid';
import { AppRoute } from '../../types';
import { Sparkles, Building, UserCheck, TrendingUp, ArrowRight } from 'lucide-react';

interface SolucionesPageProps {
  onRouteChange: (route: AppRoute) => void;
  onOpenPrompt?: (prompt: string) => void;
}

export const SolucionesPage: React.FC<SolucionesPageProps> = ({ onRouteChange, onOpenPrompt }) => {
  return (
    <div className="space-y-12 animate-page-fade py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Subpage Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-bold uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>Casos de Uso & Soluciones por Rol</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Soluciones de IA adaptadas para <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Compradores, Inversionistas y Agentes</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          Selecciona tu perfil o rol comercial y prueba directamente las secuencias de prompts diseñadas para cualificación, análisis financiero y captación.
        </p>
      </div>

      {/* Solutions Grid Component */}
      <SolutionsGrid onSelectPrompt={onOpenPrompt} />

      {/* Role Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-slate-900 border border-white/10 space-y-3 text-left">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-extrabold text-white">Para Compradores</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Asistencia guiada para encontrar su propiedad ideal, consultar memorias de calidades y agendar visitas virtuales.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-white/10 space-y-3 text-left">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h3 className="text-base font-extrabold text-white">Para Inversionistas</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Cálculo inmediato de rentabilidad bruta (Cap Rate), proyecciones de plusvalía y retorno de inversión en USD.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-white/10 space-y-3 text-left">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
            <Building className="w-5 h-5" />
          </div>
          <h3 className="text-base font-extrabold text-white">Para Agentes y Redes</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Filtro automático 24/7 de prospectos cualificados y sincronización con tu agenda comercial en WhatsApp.
          </p>
        </div>
      </div>

    </div>
  );
};

export default SolucionesPage;

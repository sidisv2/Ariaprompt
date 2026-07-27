import React from 'react';
import { Lock, Zap, X } from 'lucide-react';
import { AppRoute } from '../../types';
import { PlanTier } from '../../lib/planLimits';

export type LockedFeature = 'vault' | 'crm' | 'leads_limit' | 'properties_limit' | 'generic';

interface UpgradePromptBannerProps {
  feature: LockedFeature;
  onUpgrade: () => void;
  onDismiss?: () => void;
  /** Minimum plan required to unlock. Defaults to 'solo'. */
  requiredPlan?: Exclude<PlanTier, 'normal'>;
  inline?: boolean; // If true, renders inline (no overlay)
}

const FEATURE_COPY: Record<LockedFeature, { title: string; description: string }> = {
  vault: {
    title: 'Bóveda de Documentos',
    description: 'Almacená y compartí planos, escrituras y contratos de forma privada y segura.',
  },
  crm: {
    title: 'Sincronización CRM',
    description: 'Conectá Tokko Broker o EasyBroker y sincronizá tu catálogo automáticamente.',
  },
  leads_limit: {
    title: 'Límite de leads alcanzado',
    description: 'En el plan gratuito podés recibir hasta 5 leads por mes.',
  },
  properties_limit: {
    title: 'Límite de propiedades alcanzado',
    description: 'En el plan gratuito podés cargar hasta 3 propiedades.',
  },
  generic: {
    title: 'Función Premium',
    description: 'Esta función requiere un plan activo de Aria Prop.',
  },
};

const PLAN_NAMES: Record<Exclude<PlanTier, 'normal'>, string> = {
  solo: 'Solo Agent ($35/mes)',
  pro: 'Agency Pro ($99/mes)',
  desarrolladores: 'Desarrolladores',
};

export const UpgradePromptBanner: React.FC<UpgradePromptBannerProps> = ({
  feature,
  onUpgrade,
  onDismiss,
  requiredPlan = 'solo',
  inline = false,
}) => {
  const copy = FEATURE_COPY[feature];
  const planName = PLAN_NAMES[requiredPlan];

  if (inline) {
    return (
      <div className="w-full rounded-xl bg-slate-900/80 border border-slate-700/60 p-4 flex flex-col gap-3 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">{copy.title}</p>
            <p className="text-xs text-slate-400 mt-0.5 leading-snug">{copy.description}</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Disponible desde el plan <span className="text-emerald-400 font-semibold">{planName}</span>.
              La donación es completamente voluntaria — si querés apoyar el proyecto podés mejorar tu plan.
            </p>
          </div>
          {onDismiss && (
            <button onClick={onDismiss} className="text-slate-600 hover:text-slate-400 transition-colors shrink-0">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={onUpgrade}
          className="w-full py-2 px-4 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/30"
        >
          <Zap className="w-3.5 h-3.5" />
          Ver planes y mejorar
        </button>
      </div>
    );
  }

  // Full-page overlay mode
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl">
      <div className="relative max-w-sm w-full mx-4 rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl flex flex-col gap-4">
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
            <Lock className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">{copy.title}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Requiere plan superior</p>
          </div>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">{copy.description}</p>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Disponible desde <span className="text-emerald-400 font-semibold">{planName}</span>.
          La donación es completamente voluntaria — mejorá tu plan si querés apoyar el proyecto y acceder a más funciones.
        </p>
        <button
          onClick={onUpgrade}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/40"
        >
          <Zap className="w-4 h-4" />
          ⚡ Ver planes y mejorar
        </button>
      </div>
    </div>
  );
};

export default UpgradePromptBanner;

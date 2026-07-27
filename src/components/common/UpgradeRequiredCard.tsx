import React from 'react';
import { Lock, ArrowRight, Sparkles } from 'lucide-react';

interface UpgradeRequiredCardProps {
  title: string;
  description: string;
  onUpgrade: () => void;
  buttonLabel?: string;
}

export const UpgradeRequiredCard: React.FC<UpgradeRequiredCardProps> = ({
  title,
  description,
  onUpgrade,
  buttonLabel = 'Ver planes disponibles',
}) => (
  <div className="rounded-3xl border border-amber-400/30 bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 p-6 shadow-2xl shadow-amber-950/20">
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/30">
          <Lock className="h-6 w-6" />
        </div>
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-300">
            <Sparkles className="h-3 w-3" />
            Upgrade Requerido
          </div>
          <h3 className="mt-3 text-xl font-black text-white">{title}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{description}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onUpgrade}
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-300 to-emerald-300 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/10 transition-transform hover:scale-[1.01]"
      >
        {buttonLabel}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  </div>
);

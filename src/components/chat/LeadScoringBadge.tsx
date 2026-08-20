import React from 'react';
import { Flame, Zap, Snowflake } from 'lucide-react';

export interface LeadScoringBadgeProps {
  score?: number;
  temperature?: 'hot' | 'warm' | 'cold' | string;
  size?: 'sm' | 'md';
}

export function computeLeadScore(options: {
  status?: string;
  budget_max_usd?: number | null;
  hasVisitRequested?: boolean;
  totalMessages?: number;
}): { score: number; temperature: 'hot' | 'warm' | 'cold' } {
  let score = 30;

  if (options.hasVisitRequested || options.status === 'handover') {
    score += 50;
  }
  if (options.budget_max_usd && options.budget_max_usd > 0) {
    score += 20;
  }
  if (options.totalMessages && options.totalMessages >= 4) {
    score += 15;
  }

  score = Math.min(100, Math.max(10, score));

  let temperature: 'hot' | 'warm' | 'cold' = 'cold';
  if (score >= 80) temperature = 'hot';
  else if (score >= 40) temperature = 'warm';

  return { score, temperature };
}

export const LeadScoringBadge: React.FC<LeadScoringBadgeProps> = ({
  score = 50,
  temperature,
  size = 'md',
}) => {
  let temp: 'hot' | 'warm' | 'cold' = 'warm';
  if (temperature === 'hot' || score >= 80) temp = 'hot';
  else if (temperature === 'cold' || score < 40) temp = 'cold';

  const isSmall = size === 'sm';

  if (temp === 'hot') {
    return (
      <span
        title={`Score de Interés: ${score}/100 - Prospecto Caliente (Presupuesto listo / Visita agendada)`}
        className={`inline-flex items-center gap-1 rounded-full font-black uppercase tracking-wider border cursor-help ${
          isSmall ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[10px]'
        } bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-sm`}
      >
        <Flame className={isSmall ? 'w-3 h-3 text-rose-400' : 'w-3.5 h-3.5 text-rose-400'} />
        <span>🔥 Caliente ({score})</span>
      </span>
    );
  }

  if (temp === 'warm') {
    return (
      <span
        title={`Score de Interés: ${score}/100 - Prospecto Tibio (Interés genuino / Comparando opciones)`}
        className={`inline-flex items-center gap-1 rounded-full font-black uppercase tracking-wider border cursor-help ${
          isSmall ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[10px]'
        } bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-sm`}
      >
        <Zap className={isSmall ? 'w-3 h-3 text-amber-400' : 'w-3.5 h-3.5 text-amber-400'} />
        <span>⚡ Tibio ({score})</span>
      </span>
    );
  }

  return (
    <span
      title={`Score de Interés: ${score}/100 - Prospecto Frío (Pregunta genérica / Sin validación)`}
      className={`inline-flex items-center gap-1 rounded-full font-black uppercase tracking-wider border cursor-help ${
        isSmall ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[10px]'
      } bg-slate-500/10 text-slate-400 border-slate-500/30 shadow-sm`}
    >
      <Snowflake className={isSmall ? 'w-3 h-3 text-slate-400' : 'w-3.5 h-3.5 text-slate-400'} />
      <span>❄️ Frío ({score})</span>
    </span>
  );
};

export default LeadScoringBadge;

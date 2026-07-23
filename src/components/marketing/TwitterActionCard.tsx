import React from 'react';
import { Sparkles, MessageCircle, Repeat2, Heart, Share, Flame, TrendingUp, CheckCircle2 } from 'lucide-react';

interface TwitterActionCardProps {
  onSelectPrompt?: (promptText: string) => void;
}

export const TwitterActionCard: React.FC<TwitterActionCardProps> = ({ onSelectPrompt }) => {
  return (
    <div className="w-full rounded-2xl bg-black/90 border border-white/20 p-4 sm:p-5 shadow-2xl space-y-3 relative overflow-hidden backdrop-blur-xl">
      
      {/* Top Banner Row */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          {/* X Brand Icon */}
          <div className="w-8 h-8 rounded-full bg-white text-black font-black flex items-center justify-center text-sm shadow-md">
            𝕏
          </div>
          <div>
            <div className="flex items-center gap-1">
              <h4 className="text-xs font-bold text-white">PropTech AI en 𝕏</h4>
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 fill-sky-400/20" />
            </div>
            <p className="text-[10px] text-slate-400 font-mono">@PropTech_AI • Analizador Live</p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold">
          <Flame className="w-3 h-3 animate-bounce text-amber-400" />
          <span>Trending en 𝕏</span>
        </div>
      </div>

      {/* Main Copy requested by user */}
      <div className="space-y-2">
        <p className="text-xs sm:text-sm text-white font-medium leading-relaxed">
          🔥 <strong className="text-emerald-400">¿Tienes dudas sobre tu proyecto?</strong> Escribe tu idea abajo y deja que nuestra IA la analice en vivo. <span className="text-amber-300 font-bold">¡Pruébalo gratis ahora!</span>
        </p>

        {/* Quick prompt suggestions chips */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <button
            onClick={() => onSelectPrompt?.('¿Cómo evalúas la rentabilidad de mi desarrollo residencial?')}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border border-white/10 text-[10px] font-medium transition-all cursor-pointer"
          >
            💡 Evaluador de Rentabilidad
          </button>
          <button
            onClick={() => onSelectPrompt?.('Busco un chalet de lujo o ático con 3 habitaciones')}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border border-white/10 text-[10px] font-medium transition-all cursor-pointer"
          >
            🏡 Búsqueda de Inmuebles RAG
          </button>
        </div>
      </div>

      {/* Engagement Stats Bar */}
      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 hover:text-sky-400 transition-colors">
            <MessageCircle className="w-3.5 h-3.5" /> 2.4k
          </span>
          <span className="flex items-center gap-1 hover:text-emerald-400 transition-colors">
            <Repeat2 className="w-3.5 h-3.5" /> 890
          </span>
          <span className="flex items-center gap-1 hover:text-rose-400 transition-colors">
            <Heart className="w-3.5 h-3.5 fill-rose-500/20 text-rose-400" /> 5.1k
          </span>
        </div>
        <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-mono">
          <TrendingUp className="w-3 h-3" />
          <span>IA Activa</span>
        </div>
      </div>

    </div>
  );
};

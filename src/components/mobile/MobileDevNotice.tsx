import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, X, Check, Sparkles } from 'lucide-react';

const SESSION_KEY = 'aria_mobile_notice_dismissed';

export const MobileDevNotice: React.FC = () => {
  const [dismissed, setDismissed] = useState<boolean>(true);

  useEffect(() => {
    try {
      const isDismissed = sessionStorage.getItem(SESSION_KEY);
      if (!isDismissed) {
        setDismissed(false);
      }
    } catch (e) {
      setDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(SESSION_KEY, 'true');
    } catch (e) {}
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <aside
      role="region"
      aria-label="Aviso de optimización móvil"
      className="block md:hidden fixed top-16 left-3 right-3 z-40 p-3.5 rounded-2xl bg-[#0b141a]/95 border border-emerald-500/30 backdrop-blur-xl shadow-2xl text-white animate-fadeIn"
    >
      <div className="flex items-start gap-3">
        {/* Icon Badge */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
          <Smartphone className="w-5 h-5" />
        </div>

        {/* Notice Content */}
        <div className="flex-1 space-y-1 pr-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400">
              🛠️ Interfaz Móvil en Optimización
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Estamos puliendo la experiencia mobile. Para una gestión comercial completa y sin restricciones, te recomendamos acceder desde una computadora de escritorio.
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          aria-label="Descartar aviso"
          className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Action Footer */}
      <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between">
        <span className="text-[10px] text-slate-400 flex items-center gap-1">
          <Monitor className="w-3 h-3 text-emerald-400" />
          <span>Experiencia Desktop 100% Completa</span>
        </span>

        <button
          onClick={handleDismiss}
          className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] shadow-sm transition-all cursor-pointer"
        >
          Entendido
        </button>
      </div>
    </aside>
  );
};

export default MobileDevNotice;

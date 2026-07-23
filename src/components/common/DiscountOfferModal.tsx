import React, { useState, useEffect } from 'react';
import { Tag, Sparkles, X, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';

interface DiscountOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyDiscount: (code: string) => void;
}

export const DiscountOfferModal: React.FC<DiscountOfferModalProps> = ({
  isOpen,
  onClose,
  onApplyDiscount,
}) => {
  const [applied, setApplied] = useState(false);

  if (!isOpen) return null;

  const handleClaim = () => {
    onApplyDiscount('OFERTA5');
    setApplied(true);
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-500/20 space-y-6 text-slate-100 modal-card overflow-hidden animate-discount-pulse"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient background */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer z-10"
          aria-label="Cerrar ventana de oferta"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/10">
            <Tag className="w-3.5 h-3.5" />
            <span>Oferta de Bienvenida Limitada</span>
          </div>

          <h3 className="text-3xl font-black text-white tracking-tight">
            ¡Obtén un <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">5% de Descuento</span> Adicional!
          </h3>

          <p className="text-xs text-slate-300 leading-relaxed">
            Suscríbete hoy a cualquier plan de **Aria Prop** y aplica el código promocional exclusivo para tu agencia.
          </p>
        </div>

        {/* Coupon Code Pill */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 flex items-center justify-between text-center space-y-0">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Código Promocional:</span>
            <span className="text-lg font-mono font-black text-emerald-400 tracking-widest">OFERTA5</span>
          </div>
          <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
            -5% OFF
          </span>
        </div>

        {/* Features */}
        <div className="space-y-2 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Aplicable a facturación mensual o anual</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Acumulable con el 20% de ahorro anual</span>
          </div>
        </div>

        {/* Applied Alert */}
        {applied && (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center animate-bounce">
            ¡Código OFERTA5 aplicado con éxito! (-5%)
          </div>
        )}

        {/* CTA Button */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handleClaim}
            disabled={applied}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-xl shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{applied ? '¡Descuento Activado!' : 'Reclamar 5% de Descuento Instantáneo'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-transparent text-slate-400 hover:text-slate-200 text-xs font-semibold transition-all cursor-pointer text-center"
          >
            No por ahora
          </button>
        </div>

        <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 pt-2 border-t border-white/5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Válido para nuevos suscriptores</span>
        </div>

      </div>
    </div>
  );
};

export default DiscountOfferModal;

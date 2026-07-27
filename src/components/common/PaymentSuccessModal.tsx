import React from 'react';
import { CheckCircle2, Sparkles, X } from 'lucide-react';

interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: () => void;
}

export const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
  isOpen,
  onClose,
  onStart,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-emerald-400/30 bg-slate-900 p-6 text-center shadow-2xl shadow-emerald-950/40 sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Cerrar confirmación de pago"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/30">
          <CheckCircle2 className="h-9 w-9" />
        </div>

        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-300">
          <Sparkles className="h-3.5 w-3.5" />
          Pago verificado
        </div>

        <h2 className="mt-4 text-3xl font-black tracking-tight text-white">
          ¡Suscripción Activada con Éxito!
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Tu plan ya está listo. Puedes configurar tus agentes, conectar tu catálogo y empezar a atender leads en automático.
        </p>

        <button
          type="button"
          onClick={onStart}
          className="mt-7 w-full rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-300 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-emerald-500/20 transition-transform hover:scale-[1.01]"
        >
          Comenzar a usar tus Agentes
        </button>
      </div>
    </div>
  );
};

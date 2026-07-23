import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Sparkles, CheckCircle2, ShieldCheck, Zap, ArrowRight } from 'lucide-react';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscriptionActivated?: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  onSubscriptionActivated,
}) => {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const { user, openAuthModal } = useAuth();

  if (!isOpen) return null;

  const handleActivateTrial = async () => {
    setLoading(true);

    // If user is not authenticated, trigger Auth Modal to create free account
    if (!user) {
      onClose();
      openAuthModal('signup', 'pro', 'dashboard-checkout');
      setLoading(false);
      return;
    }

    // Activate 7-day trial locally & in localStorage
    try {
      localStorage.setItem('hasSentFreeMessage', 'false');
      localStorage.setItem('sent_messages_count', '0');
      localStorage.setItem('aria_prop_trial_active', 'true');
      localStorage.setItem(
        'aria_prop_trial_expires',
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      );
    } catch {
      // ignore storage error
    }

    setSuccessMsg('¡Prueba de 7 días activada con éxito! Chat ilimitado desbloqueado.');
    
    setTimeout(() => {
      onSubscriptionActivated?.();
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-md bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-500/20 space-y-6 text-slate-100 modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
          aria-label="Cerrar modal de prueba"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Badge & Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-extrabold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Prueba Gratuita 7 Días — Sin Compromiso</span>
          </div>

          <h3 className="text-2xl font-black text-white tracking-tight">
            Desbloquea el Potencial Completo de Aria Prop
          </h3>

          <p className="text-xs text-slate-300 leading-relaxed">
            Has probado la versión sandbox. Activa tus **7 Días Gratis** para consultas RAG ilimitadas, cálculo de ROI y agendamiento de visitas.
          </p>
        </div>

        {/* Feature Checkmarks List */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2.5 text-xs text-slate-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Consultas ilimitadas con Aria AI</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Lectura RAG de dossiers PDF y memorias técnicas</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Lead Scoring y agendamiento automático por WhatsApp</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Cancelación instantánea en 1 clic sin costo</span>
          </div>
        </div>

        {/* Feedback Alert */}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center animate-bounce">
            {successMsg}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          <button
            onClick={handleActivateTrial}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-xl shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin"></span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Activar Prueba Gratis de 7 Días</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-transparent hover:bg-white/5 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-all cursor-pointer text-center"
          >
            Continuar con versión limitada
          </button>
        </div>

        {/* Trust Footer */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 pt-2 border-t border-white/5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Garantía de Satisfacción 100% — Cero tarjeta requerida para la prueba</span>
        </div>

      </div>
    </div>
  );
};

export default PaywallModal;

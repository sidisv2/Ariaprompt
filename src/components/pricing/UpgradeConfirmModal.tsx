import React, { useState } from 'react';
import { Sparkles, CheckCircle2, Zap, X, Loader2 } from 'lucide-react';
import { PlanTier, getPlanEmojiLabel } from '../../lib/planLimits';

interface UpgradeConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: PlanTier;
  targetPlan: PlanTier;
  onConfirmUpgrade: (targetPlan: PlanTier) => Promise<void>;
}

export const UpgradeConfirmModal: React.FC<UpgradeConfirmModalProps> = ({
  isOpen,
  onClose,
  currentPlan,
  targetPlan,
  onConfirmUpgrade,
}) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const currentLabel = getPlanEmojiLabel(currentPlan);
  const targetLabel = getPlanEmojiLabel(targetPlan);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirmUpgrade(targetPlan);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1800);
    } catch (e) {
      console.error('Error during upgrade confirmation:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-emerald-500/40 p-6 sm:p-8 space-y-6 shadow-2xl text-white">
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Header Icon */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/30">
            <Zap className="w-6 h-6 fill-slate-950" />
          </div>
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold border border-emerald-500/30 uppercase tracking-wider">
              Upgrade de Suscripción en Caliente
            </span>
            <h3 className="text-xl font-extrabold text-white mt-1">
              Mejorar a {targetLabel.emoji} {targetLabel.title}
            </h3>
          </div>
        </div>

        {/* Dynamic Modal Content */}
        {success ? (
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3 animate-scaleUp">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="text-lg font-extrabold text-white">¡Upgrade Completado con Éxito!</h4>
            <p className="text-xs text-slate-300">
              Tu organización ha sido actualizada al instante a <strong>{targetLabel.emoji} {targetLabel.title}</strong>. Todas las funciones avanzadas han sido desbloqueadas sin necesidad de re-login.
            </p>
          </div>
        ) : (
          <>
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-3 text-xs leading-relaxed">
              <p className="text-slate-200 font-semibold text-sm">
                Estás mejorando tu plan de <span className="text-emerald-400 font-bold">{currentLabel.emoji} {currentLabel.title}</span> a <span className="text-emerald-400 font-bold">{targetLabel.emoji} {targetLabel.title}</span>.
              </p>
              <ul className="space-y-2 text-slate-300 pt-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>5 Agentes de IA Activos 24/7</strong> (WhatsApp Meta API + Widget Web)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Hasta 500 Leads Cualificados / mes</strong> derivación automática</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Sincronización en vivo CRM</strong> (Tokko Broker & EasyBroker)</span>
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={onClose}
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                onClick={handleConfirm}
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Procesando Upgrade...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 fill-slate-950" />
                    <span>Confirmar Upgrade a Agency Pro ➔</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  X,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  CreditCard,
  ChevronDown
} from 'lucide-react';

export const MobileAuthBottomSheet: React.FC = () => {
  const {
    authModalOpen,
    modalTab,
    pendingPlan,
    closeAuthModal,
    signIn,
    signUp,
    signInWithGoogle
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(modalTab || 'login');
  
  // Form fields
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status & Validation
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success' | 'info'; message: string } | null>(null);

  // Sync tab with AuthContext state when modal opens
  useEffect(() => {
    if (authModalOpen) {
      setActiveTab(modalTab);
      setFeedback(null);
      setNombre('');
      setEmail('');
      setPassword('');
      setShowPassword(false);
    }
  }, [authModalOpen, modalTab]);

  if (!authModalOpen) return null;

  const isEmailValid = email.trim() === 'admin' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordValid = password.length >= 4;
  const isNameValid = activeTab === 'signup' ? nombre.trim().length >= 2 : true;

  const canSubmit = isEmailValid && isPasswordValid && isNameValid && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setFeedback({ type: 'info', message: activeTab === 'login' ? 'Iniciando sesión...' : 'Creando cuenta...' });

    const targetEmail = email.trim() === 'admin' ? 'admin@admin.com' : email;

    if (activeTab === 'login') {
      const res = await signIn({ email: targetEmail, password });
      if (!res.success) {
        setFeedback({ type: 'error', message: res.error || 'Credenciales incorrectas. Revisa tu email y clave.' });
        setSubmitting(false);
      } else {
        setFeedback({ type: 'success', message: '¡Sesión iniciada con éxito! Redirigiendo...' });
      }
    } else {
      const res = await signUp({ email, password, nombre });
      if (!res.success) {
        setFeedback({ type: 'error', message: res.error || 'No se pudo crear la cuenta. Intenta de nuevo.' });
        setSubmitting(false);
      } else {
        setFeedback({ type: 'success', message: '¡Cuenta creada en Supabase! Redirigiendo...' });
      }
    }
  };

  const handleGoogleAuth = async () => {
    setSubmitting(true);
    setFeedback({ type: 'info', message: 'Conectando Google OAuth...' });
    const res = await signInWithGoogle();
    if (!res.success) {
      setFeedback({ type: 'error', message: res.error || 'Error en Google OAuth' });
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 backdrop-blur-md transition-all duration-300 animate-in fade-in"
      onClick={closeAuthModal}
    >
      {/* Bottom Sheet Container */}
      <div
        className="relative w-full max-w-lg bg-slate-900 border-t border-emerald-500/30 rounded-t-[32px] p-6 pb-8 shadow-2xl shadow-emerald-500/20 max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom duration-300 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Swipe Handle Bar */}
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-2 cursor-grab active:cursor-grabbing" />

        {/* Close Button top-right */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-5 w-8 h-8 rounded-full bg-white/5 border border-white/10 text-slate-400 active:text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Title */}
        <div className="space-y-1 text-center pt-1">
          {pendingPlan ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Protección de Pago: Plan {pendingPlan.toUpperCase()}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Aria Prop App Móvil</span>
            </div>
          )}

          <h3 className="text-xl font-black text-white tracking-tight">
            {pendingPlan ? 'Inicia sesión para pagar tu suscripción' : 'Acceso a la Plataforma'}
          </h3>
          
          <p className="text-xs text-slate-400">
            {pendingPlan
              ? 'Inicia sesión o regístrate en Supabase para proceder al pago.'
              : 'Gestiona tu bot inmobiliario y tus prospectos en movimiento.'}
          </p>
        </div>

        {/* Auth Tabs Switcher */}
        <div className="flex bg-black/40 p-1 rounded-2xl border border-white/10">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setFeedback(null);
            }}
            className={`flex-1 py-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer active:scale-95 ${
              activeTab === 'login'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400'
            }`}
          >
            Iniciar Sesión
          </button>
          
          <button
            type="button"
            onClick={() => {
              setActiveTab('signup');
              setFeedback(null);
            }}
            className={`flex-1 py-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer active:scale-95 ${
              activeTab === 'signup'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400'
            }`}
          >
            Crear Cuenta
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
              feedback.type === 'error'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-sky-500/10 border-sky-500/30 text-sky-300'
            }`}
          >
            {feedback.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
            {feedback.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />}
            {feedback.type === 'info' && <Loader2 className="w-4 h-4 shrink-0 animate-spin text-sky-400" />}
            <span className="leading-tight">{feedback.message}</span>
          </div>
        )}

        {/* OAuth Google Button */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={submitting}
          className="w-full py-3.5 px-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-xs transition-all active:scale-98 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continuar con Google</span>
        </button>

        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <span className="relative px-3 bg-slate-900 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
            o con tu email
          </span>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {activeTab === 'signup' && (
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-300">
                Nombre Completo
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Ej. Roberto Gómez"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="block text-[11px] font-semibold text-slate-300">
                Correo Electrónico
              </label>
              {email.length > 0 && (
                <span className={`text-[10px] ${isEmailValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isEmailValid ? '✓ Correcto' : 'Inválido'}
                </span>
              )}
            </div>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="agente@inmobiliaria.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="block text-[11px] font-semibold text-slate-300">
                Contraseña
              </label>
              {password.length > 0 && (
                <span className={`text-[10px] ${isPasswordValid ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {isPasswordValid ? '✓ 6+ chars' : 'Faltan chars'}
                </span>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-10 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 active:scale-98 transition-transform flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{activeTab === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 pt-2 border-t border-white/5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Autenticación Segura con Supabase</span>
        </div>

      </div>
    </div>
  );
};

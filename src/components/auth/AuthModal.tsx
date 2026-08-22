import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../lib/supabase';
import { X, Mail, Lock, User, Sparkles, ArrowRight, Play, KeyRound, ArrowLeft, RefreshCw } from 'lucide-react';

export const AuthModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: () => void;
  initialTab?: 'login' | 'signup';
}> = ({ isOpen, onClose, onAuthSuccess, initialTab = 'login' }) => {
  const { t } = useLanguage();
  const [tab, setTab] = useState<'login' | 'signup'>(initialTab);
  const [step, setStep] = useState<'form' | 'verify_otp'>('form');
  const [pendingEmail, setPendingEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { signIn, signUp, signInAsDemoUser, signInWithGoogle } = useAuth();

  useEffect(() => {
    setTab(initialTab);
    if (!isOpen) {
      setStep('form');
      setPendingEmail('');
      setOtpCode('');
      setIdentifier('');
      setPassword('');
      setConfirmPassword('');
      setDisplayName('');
      setErrorMsg(null);
      setResendSuccess(false);
    }
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  const handleDemoAccess = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await signInAsDemoUser();
      if (res.success) {
        onAuthSuccess?.();
        onClose();
      } else {
        setErrorMsg(res.error || 'Hubo un problema al ingresar con la cuenta demo. Intenta de nuevo.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Hubo un problema al iniciar la demostración. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const inputVal = identifier.trim();
    if (!inputVal || !password) {
      setErrorMsg(t('auth.invalidCredentials'));
      setLoading(false);
      return;
    }

    if (tab === 'signup') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(inputVal)) {
        setErrorMsg(t('auth.invalidEmail'));
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setErrorMsg(t('auth.shortPassword'));
        setLoading(false);
        return;
      }
      if (confirmPassword && confirmPassword !== password) {
        setErrorMsg(t('auth.passwordMismatch'));
        setLoading(false);
        return;
      }
    }

    try {
      if (tab === 'login') {
        const res = await signIn({ email: inputVal, password });
        if (!res.success) throw new Error(res.error || t('auth.invalidCredentials'));
        onAuthSuccess?.();
        onClose();
      } else {
        const res = await signUp({
          email: inputVal,
          password,
          nombre: displayName.trim() || inputVal.split('@')[0],
        });
        if (!res.success) throw new Error(res.error || 'Error al crear la cuenta. Intenta de nuevo.');

        // Pasamos al paso de verificación OTP
        setPendingEmail(inputVal);
        setOtpCode('');
        setStep('verify_otp');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!otpCode.trim()) {
      setErrorMsg('Por favor ingresa el código de 6 dígitos');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: pendingEmail.trim(),
        token: otpCode.trim(),
        type: 'signup',
      });

      if (error) {
        // Intento fallback con tipo 'email'
        const fallback = await supabase.auth.verifyOtp({
          email: pendingEmail.trim(),
          token: otpCode.trim(),
          type: 'email',
        });
        if (fallback.error) {
          throw new Error(fallback.error.message || 'Código de verificación inválido o expirado');
        }
      }

      const currentSession = data?.session || (await supabase.auth.getSession()).data.session;
      if (currentSession || data?.user) {
        onAuthSuccess?.();
        onClose();
        // Redirigir a /app o dashboard si es necesario
        if (window.location.pathname === '/' || window.location.pathname === '') {
          window.location.href = '/app';
        }
      } else {
        onAuthSuccess?.();
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Código de verificación incorrecto');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!pendingEmail || resending) return;
    setResending(true);
    setErrorMsg(null);
    setResendSuccess(false);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: pendingEmail.trim(),
      });
      if (error) throw error;
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 4000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'No se pudo reenviar el código. Intenta en unos momentos.');
    } finally {
      setResending(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await signInWithGoogle();
      if (!res.success) throw new Error(res.error || 'Error con Google OAuth');
      onAuthSuccess?.();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error con Google OAuth');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-md bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-500/10 space-y-5 text-slate-100 modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'verify_otp' ? (
          /* STEP 2: VERIFY OTP */
          <div className="space-y-5 animate-fadeIn">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto shadow-inner">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Confirmá tu cuenta
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed px-2">
                Ingresá el código de 6 dígitos que enviamos a{' '}
                <span className="text-emerald-400 font-bold break-all">{pendingEmail}</span>
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-medium text-center">
                {errorMsg}
              </div>
            )}

            {resendSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium text-center">
                ¡Código reenviado con éxito! Revisa tu bandeja de entrada o spam.
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 text-center block">
                  Código de verificación
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  autoFocus
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="000000"
                  className="w-full text-center tracking-[0.6em] text-2xl font-mono py-3 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length < 6}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin"></span>
                ) : (
                  <>
                    <span>Verificar Código</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="flex flex-col items-center gap-3 pt-2 text-xs">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resending}
                className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 underline font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                <span>¿No recibiste el código? Reenviar</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('form');
                  setErrorMsg(null);
                  setResendSuccess(false);
                }}
                className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver / Cambiar correo</span>
              </button>
            </div>
          </div>
        ) : (
          /* STEP 1: FORM (LOGIN / SIGNUP) */
          <>
            {/* Modal Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Aria Prop Portal</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                {tab === 'login' ? t('auth.loginTitle') : t('auth.signupTitle')}
              </h2>
              <p className="text-xs text-slate-400">
                Accede a tu workspace inmobiliario inteligente
              </p>
            </div>

            {/* Login / Sign Up Tabs */}
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-950 border border-white/10 text-xs font-bold">
              <button
                type="button"
                onClick={() => { setTab('login'); setErrorMsg(null); }}
                className={`py-2 rounded-xl transition-all cursor-pointer ${
                  tab === 'login'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t('nav.login')}
              </button>
              <button
                type="button"
                onClick={() => { setTab('signup'); setErrorMsg(null); }}
                className={`py-2 rounded-xl transition-all cursor-pointer ${
                  tab === 'signup'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t('nav.signup')}
              </button>
            </div>

            {/* PROMINENT GOOGLE OAUTH BUTTON (Standard at Top) */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-3 border border-slate-300 hover:scale-[1.01] active:scale-95"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z" />
                <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.8s.7 5.1 1.9 7.5l3.7-2.9z" />
                <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z" />
              </svg>
              <span className="text-slate-900 font-extrabold">{t('auth.google')}</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
              <span className="relative bg-slate-900 px-3 text-[10px] text-slate-400 uppercase font-bold tracking-wider">o con correo</span>
            </div>

            {/* Form */}
            <form onSubmit={handleAction} className="space-y-3.5">
              {tab === 'signup' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">{t('auth.nameLabel')}</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={t('auth.namePlaceholder')}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">{t('auth.emailLabel')}</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={t('auth.emailPlaceholder')}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">{t('auth.passwordLabel')}</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('auth.passwordPlaceholder')}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {tab === 'signup' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">{t('auth.confirmPasswordLabel')}</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t('auth.confirmPasswordPlaceholder')}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Submit Action */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin"></span>
                ) : (
                  <>
                    <span>{tab === 'login' ? t('auth.loginButton') : t('auth.signupButton')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Demo Access Button */}
            <button
              type="button"
              onClick={handleDemoAccess}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-emerald-400 font-bold text-xs border border-emerald-500/30 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{t('auth.demoButton')}</span>
            </button>
          </>
        )}

      </div>
    </div>
  );
};

export default AuthModal;

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { X, Mail, Lock, User, Sparkles, ArrowRight, Play } from 'lucide-react';

export const AuthModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: () => void;
  initialTab?: 'login' | 'signup';
}> = ({ isOpen, onClose, onAuthSuccess, initialTab = 'login' }) => {
  const { t } = useLanguage();
  const [tab, setTab] = useState<'login' | 'signup'>(initialTab);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { signIn, signUp, signInWithGoogle } = useAuth();

  useEffect(() => {
    setTab(initialTab);
    if (!isOpen) {
      setIdentifier('');
      setPassword('');
      setConfirmPassword('');
      setDisplayName('');
      setErrorMsg(null);
    }
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  const handleDemoAccess = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await signIn({ email: 'demo@ariaprop.com', password: 'demo' });
      onAuthSuccess?.();
      onClose();
    } catch {
      onAuthSuccess?.();
      onClose();
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
      } else {
        const res = await signUp({
          email: inputVal,
          password,
          nombre: displayName.trim() || inputVal.split('@')[0],
        });
        if (!res.success) throw new Error(res.error || 'Error al crear la cuenta. Intenta de nuevo.');
      }

      onAuthSuccess?.();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
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

      </div>
    </div>
  );
};

export default AuthModal;

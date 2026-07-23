import React, { useState, useRef } from 'react';
import {
  User,
  Mail,
  Camera,
  Check,
  Globe,
  Sun,
  Moon,
  Monitor,
  Bell,
  DollarSign,
  ShieldCheck,
  Save,
  Loader2,
  Sparkles,
  CheckCircle2,
  Lock,
  Upload
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { uploadFileToSupabase } from '../../lib/storageService';

export const ProfileSettingsView: React.FC = () => {
  const { user, userPreferences, updateUserProfile, updateUserPreferences, openAuthModal } = useAuth();

  const [nombre, setNombre] = useState<string>(user?.nombre || '');
  const [avatarUrl, setAvatarUrl] = useState<string>(user?.avatarUrl || '');
  const [uploadingAvatar, setUploadingAvatar] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Preference fields state
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>(userPreferences.theme);
  const [language, setLanguage] = useState<'es' | 'en' | 'pt'>(userPreferences.language);
  const [currency, setCurrency] = useState<'USD' | 'MXN' | 'COP' | 'ARS' | 'CLP'>(userPreferences.defaultCurrency);
  const [notificationsEmail, setNotificationsEmail] = useState<boolean>(userPreferences.notificationsEmail);
  const [notificationsWhatsapp, setNotificationsWhatsapp] = useState<boolean>(userPreferences.notificationsWhatsapp);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Default avatars list if user wants to select a pre-made avatar
  const presetAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
  ];

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return;
    const file = e.target.files[0];

    setUploadingAvatar(true);
    setSaveError(null);

    try {
      // Upload avatar to Supabase storage bucket `user-files`
      const uploadRes = await uploadFileToSupabase(user.id, file);
      if (uploadRes.success && uploadRes.fileData?.url) {
        setAvatarUrl(uploadRes.fileData.url);
      } else {
        setSaveError('Error al cargar la foto de perfil');
      }
    } catch (err: any) {
      setSaveError(err.message || 'Error al subir imagen de avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // 1. Update user profile details
      const profileRes = await updateUserProfile({
        nombre: nombre.trim(),
        avatarUrl,
      });

      // 2. Update preferences
      updateUserPreferences({
        theme,
        language,
        defaultCurrency: currency,
        notificationsEmail,
        notificationsWhatsapp,
      });

      if (profileRes.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        setSaveError(profileRes.error || 'Error al guardar cambios');
      }
    } catch (err: any) {
      setSaveError(err.message || 'Error al actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center max-w-xl mx-auto my-8">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 text-emerald-400">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Inicia Sesión para Personalizar tu Cuenta</h2>
        <p className="text-slate-400 text-sm mb-6">
          Guarda tus preferencias, cambia tu avatar y actualiza tus datos en tu perfil de Supabase.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-3 rounded-xl bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all cursor-pointer"
        >
          Iniciar Sesión
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSaveProfile} className="space-y-6 max-w-4xl mx-auto">
      {/* Profile Header / Avatar Section */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
          {/* Avatar Preview & Upload */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-2xl bg-slate-950 border-2 border-emerald-500/30 overflow-hidden shadow-xl shadow-emerald-500/10 shrink-0 relative">
              {avatarUrl ? (
                <img src={avatarUrl} alt={nombre} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-emerald-400 bg-emerald-500/10 text-2xl font-bold">
                  {nombre ? nombre[0].toUpperCase() : 'U'}
                </div>
              )}

              {uploadingAvatar && (
                <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center text-emerald-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 active:scale-90 transition-all cursor-pointer"
              title="Cambiar foto de perfil"
            >
              <Camera className="w-4 h-4" />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFileSelect}
            />
          </div>

          <div className="text-center sm:text-left space-y-1 min-w-0 flex-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl font-bold text-white truncate">{nombre || 'Usuario'}</h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-3.5 h-3.5" /> Supabase Verified
              </span>
            </div>
            <p className="text-xs text-slate-400">{user.email}</p>
            <p className="text-[11px] text-slate-500">
              Miembro desde: {new Date(user.createdAt).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </p>

            {/* Presets Row */}
            <div className="pt-2 flex items-center justify-center sm:justify-start gap-2">
              <span className="text-[11px] text-slate-400 mr-1">Avatares rápidos:</span>
              {presetAvatars.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatarUrl(url)}
                  className={`w-7 h-7 rounded-lg overflow-hidden border transition-all cursor-pointer ${
                    avatarUrl === url ? 'border-emerald-400 ring-2 ring-emerald-500/30' : 'border-slate-800 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 pb-2 border-b border-slate-800">
            <User className="w-4 h-4" />
            <h3 className="text-sm font-bold text-white">Datos Personales</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre de Mostrar</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu Nombre Completo"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico (Registrado)</label>
              <div className="relative">
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-400 cursor-not-allowed"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>
        </div>

        {/* Preference Settings Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 pb-2 border-b border-slate-800">
            <Globe className="w-4 h-4" />
            <h3 className="text-sm font-bold text-white">Preferencias de la Plataforma</h3>
          </div>

          <div className="space-y-4">
            {/* Theme Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tema Visual</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'dark', label: 'Oscuro', icon: Moon },
                  { id: 'light', label: 'Claro', icon: Sun },
                  { id: 'system', label: 'Sistema', icon: Monitor },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = theme === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTheme(item.id as any)}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Language & Currency */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Idioma</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
                >
                  <option value="es">Español (ES)</option>
                  <option value="en">English (US)</option>
                  <option value="pt">Português (BR)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Moneda Principal</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
                >
                  <option value="USD">USD ($)</option>
                  <option value="MXN">MXN ($)</option>
                  <option value="COP">COP ($)</option>
                  <option value="ARS">ARS ($)</option>
                  <option value="CLP">CLP ($)</option>
                </select>
              </div>
            </div>

            {/* Notifications */}
            <div className="space-y-2 pt-1 border-t border-slate-800/80">
              <span className="block text-xs font-semibold text-slate-300">Notificaciones</span>
              
              <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer">
                <span className="text-xs text-slate-300">Alertas por Correo</span>
                <input
                  type="checkbox"
                  checked={notificationsEmail}
                  onChange={(e) => setNotificationsEmail(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer">
                <span className="text-xs text-slate-300">Mensajes de Lead por WhatsApp</span>
                <input
                  type="checkbox"
                  checked={notificationsWhatsapp}
                  onChange={(e) => setNotificationsWhatsapp(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Save Notifications */}
      {saveSuccess && (
        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-xl text-xs font-medium animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>¡Perfil y preferencias actualizadas correctamente en Supabase!</span>
        </div>
      )}

      {saveError && (
        <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-xl text-xs font-medium animate-fadeIn">
          <span>{saveError}</span>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Guardando Cambios...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Guardar Ajustes de Perfil
            </>
          )}
        </button>
      </div>
    </form>
  );
};

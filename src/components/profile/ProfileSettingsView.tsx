import React, { useState, useRef, useEffect } from 'react';
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
  Upload,
  LogOut,
  KeyRound,
  X,
  AlertCircle,
  Phone
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { uploadFileToSupabase } from '../../lib/storageService';
import { supabase } from '../../lib/supabase';

export const ProfileSettingsView: React.FC = () => {
  const { user, userPreferences, updateUserProfile, updateUserPreferences, openAuthModal, requestSignOut } = useAuth();

  // 1. Personal Information State
  const [nombre, setNombre] = useState<string>(user?.nombre || '');
  const [avatarUrl, setAvatarUrl] = useState<string>(user?.avatarUrl || '');
  const [savingName, setSavingName] = useState<boolean>(false);
  const [nameSuccess, setNameSuccess] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  // 2. Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState<boolean>(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // 3. Change Email State
  const [newEmail, setNewEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState<boolean>(false);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  // 4. Platform Preferences & WhatsApp Alerts State
  const [phone, setPhone] = useState<string>('');
  const [language, setLanguage] = useState<'es' | 'en' | 'pt'>(userPreferences.language || 'es');
  const [currency, setCurrency] = useState<'USD' | 'MXN' | 'COP' | 'ARS' | 'CLP'>(userPreferences.defaultCurrency || 'USD');
  const [savingPreferences, setSavingPreferences] = useState<boolean>(false);
  const [prefsSuccess, setPrefsSuccess] = useState<string | null>(null);
  const [prefsError, setPrefsError] = useState<string | null>(null);

  const [uploadingAvatar, setUploadingAvatar] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carga inicial y sincronización con Supabase profiles y metadata
  useEffect(() => {
    let mounted = true;

    async function loadUserDataAndPreferences() {
      if (!user?.id) return;

      setNombre(user.nombre || '');
      setAvatarUrl(user.avatarUrl || '');

      try {
        // Consultar la tabla profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (mounted && profile) {
          const userPhone = profile.phone || profile.advisor_alert_phone || (user as any)?.phone || '';
          if (userPhone) setPhone(userPhone);

          if (profile.language && ['es', 'en', 'pt'].includes(profile.language)) {
            setLanguage(profile.language as any);
          }
          if (profile.currency && ['USD', 'MXN', 'COP', 'ARS', 'CLP'].includes(profile.currency)) {
            setCurrency(profile.currency as any);
          }
          if (profile.avatar_url) {
            setAvatarUrl(profile.avatar_url);
          }
          if (profile.full_name || profile.nombre) {
            setNombre(profile.full_name || profile.nombre);
          }
        } else if (mounted) {
          // Fallback a metadata de sesión
          const meta = (user as any)?.user_metadata || {};
          const fallbackPhone = meta.whatsapp_phone || meta.phone_number || meta.phone || '';
          if (fallbackPhone) setPhone(fallbackPhone);
          if (meta.language) setLanguage(meta.language);
          if (meta.currency) setCurrency(meta.currency);
        }
      } catch (err) {
        console.warn('Error al cargar perfil de Supabase:', err);
      }
    }

    loadUserDataAndPreferences();

    return () => {
      mounted = false;
    };
  }, [user]);

  if (!user) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center max-w-xl mx-auto my-8">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 text-emerald-400">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Inicia Sesión para Gestionar tu Cuenta</h2>
        <p className="text-slate-400 text-sm mb-6">
          Actualiza tus datos personales, contraseña y preferencias en tu perfil de Supabase.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-3 rounded-xl bg-emerald-500 text-slate-950 font-extrabold shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all cursor-pointer"
        >
          Iniciar Sesión
        </button>
      </div>
    );
  }

  // 1. Guardar Nombre Completo
  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setNameError('Por favor, ingresá un nombre válido');
      return;
    }

    setSavingName(true);
    setNameError(null);
    setNameSuccess(null);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: nombre.trim(),
          nombre: nombre.trim(),
        },
      });

      if (error) throw error;

      await supabase.from('profiles').update({ full_name: nombre.trim(), nombre: nombre.trim() }).eq('id', user.id);
      await updateUserProfile({ nombre: nombre.trim() });

      setNameSuccess('Nombre actualizado correctamente');
      setTimeout(() => setNameSuccess(null), 5000);
    } catch (err: any) {
      setNameError(err?.message || 'Error al actualizar el nombre');
    } finally {
      setSavingName(false);
    }
  };

  // 2. Cambiar Contraseña con validación estricta
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError('Ingresá tu contraseña actual para confirmar los cambios');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }

    setSavingPassword(true);

    try {
      // Reautenticación silenciosa con la contraseña actual
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        setPasswordError('La contraseña actual es incorrecta');
        setSavingPassword(false);
        return;
      }

      // Actualizar a la nueva contraseña
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setPasswordError(updateError.message || 'Error al actualizar la contraseña');
      } else {
        setPasswordSuccess('Contraseña actualizada con éxito');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(null), 5000);
      }
    } catch (err: any) {
      setPasswordError(err?.message || 'Error inesperado al actualizar la contraseña');
    } finally {
      setSavingPassword(false);
    }
  };

  // 3. Cambiar Correo Electrónico con verificación
  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setEmailSuccess(null);

    const targetEmail = newEmail.trim();
    if (!targetEmail || targetEmail.toLowerCase() === (user.email || '').toLowerCase()) {
      setEmailError('Ingresá una dirección de correo diferente a la actual');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(targetEmail)) {
      setEmailError('Ingresá un formato de correo válido');
      return;
    }

    setSavingEmail(true);

    try {
      const { error } = await supabase.auth.updateUser({
        email: targetEmail,
      });

      if (error) {
        setEmailError(error.message || 'Error al solicitar cambio de correo');
      } else {
        setEmailSuccess(`Te enviamos un enlace de confirmación a ${targetEmail}. Debés confirmarlo para completar el cambio.`);
        setNewEmail('');
        setTimeout(() => setEmailSuccess(null), 8000);
      }
    } catch (err: any) {
      setEmailError(err?.message || 'Error al solicitar cambio de correo');
    } finally {
      setSavingEmail(false);
    }
  };

  // 4. Subir Avatar
  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return;
    const file = e.target.files[0];

    setUploadingAvatar(true);
    setNameError(null);

    try {
      const uploadRes = await uploadFileToSupabase(user.id, file);
      if (uploadRes.success && uploadRes.fileData?.url) {
        setAvatarUrl(uploadRes.fileData.url);
        await updateUserProfile({ avatarUrl: uploadRes.fileData.url });
        await supabase.from('profiles').update({ avatar_url: uploadRes.fileData.url }).eq('id', user.id);
        setNameSuccess('Foto de perfil actualizada con éxito');
        setTimeout(() => setNameSuccess(null), 4000);
      } else {
        setNameError('Error al cargar la foto de perfil');
      }
    } catch (err: any) {
      setNameError(err.message || 'Error al subir imagen de avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // 5. Guardar Preferencias de Plataforma & Teléfono WhatsApp
  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPreferences(true);
    setPrefsError(null);
    setPrefsSuccess(null);

    // Limpiar formato del teléfono (quitar espacios, guiones y signos +)
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    if (cleanPhone && (cleanPhone.length < 8 || cleanPhone.length > 15)) {
      setPrefsError('Por favor ingresá un número de teléfono válido (entre 8 y 15 dígitos con código de país, ej. 5492604014372)');
      setSavingPreferences(false);
      return;
    }

    try {
      // 1. Actualizar metadatos de sesión en auth
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          phone_number: cleanPhone,
          whatsapp_phone: cleanPhone,
          phone: cleanPhone,
          language,
          currency,
        },
      });

      if (authError) {
        console.warn('Error updating auth user metadata:', authError);
      }

      // 2. Actualizar tabla profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          phone: cleanPhone,
          advisor_alert_phone: cleanPhone,
          language,
          currency,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('Error updating profiles table:', profileError);
        setPrefsError('Error al guardar las preferencias en la base de datos.');
        return;
      }

      // 3. Actualizar contexto de preferencias locales
      updateUserPreferences({
        language,
        defaultCurrency: currency,
      });

      setPhone(cleanPhone);
      setPrefsSuccess('Preferencias y teléfono de WhatsApp guardados con éxito.');
      setTimeout(() => setPrefsSuccess(null), 5000);
    } catch (err: any) {
      setPrefsError(err?.message || 'Error al guardar las preferencias.');
    } finally {
      setSavingPreferences(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto text-slate-100 pb-12">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
          <div className="relative group">
            <div className="w-24 h-24 rounded-2xl bg-slate-950 border-2 border-emerald-500/40 overflow-hidden shadow-xl shadow-emerald-500/10 shrink-0 relative">
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
              disabled={uploadingAvatar}
              className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-md transition-transform active:scale-90 cursor-pointer"
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

          <div className="text-center sm:text-left space-y-1.5 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Workspace Inmobiliario</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">{nombre || 'Usuario'}</h2>
            <p className="text-xs text-slate-400 font-mono">{user.email}</p>
          </div>

          <button
            type="button"
            onClick={requestSignOut}
            className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold text-xs border border-rose-500/30 flex items-center gap-2 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Grid: 1. Información Personal & 3. Cambiar Correo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 1. INFORMACIÓN PERSONAL (Nombre Completo) */}
        <div className="bg-slate-900 border border-emerald-500/20 rounded-3xl p-6 shadow-xl space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 text-emerald-400 font-bold border-b border-white/5 pb-3">
              <User className="w-5 h-5" />
              <h3 className="text-base text-white">Información Personal</h3>
            </div>

            {nameSuccess && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{nameSuccess}</span>
                </div>
                <button onClick={() => setNameSuccess(null)}><X className="w-3.5 h-3.5" /></button>
              </div>
            )}

            {nameError && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{nameError}</span>
                </div>
                <button onClick={() => setNameError(null)}><X className="w-3.5 h-3.5" /></button>
              </div>
            )}

            <form id="name-form" onSubmit={handleSaveName} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">Nombre Completo</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Tu nombre y apellido"
                    className="w-full bg-slate-950 border border-white/10 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">Correo Actual (Solo Lectura)</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full bg-slate-950/50 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-400 cursor-not-allowed font-mono"
                  />
                </div>
              </div>
            </form>
          </div>

          <button
            type="submit"
            form="name-form"
            disabled={savingName}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
          >
            {savingName ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar Nombre</span>
              </>
            )}
          </button>
        </div>

        {/* 3. CAMBIAR CORREO ELECTRÓNICO */}
        <div className="bg-slate-900 border border-emerald-500/20 rounded-3xl p-6 shadow-xl space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 text-emerald-400 font-bold border-b border-white/5 pb-3">
              <Mail className="w-5 h-5" />
              <h3 className="text-base text-white">Cambiar Correo Electrónico</h3>
            </div>

            {emailSuccess && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="leading-snug">{emailSuccess}</span>
                </div>
                <button onClick={() => setEmailSuccess(null)}><X className="w-3.5 h-3.5" /></button>
              </div>
            )}

            {emailError && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{emailError}</span>
                </div>
                <button onClick={() => setEmailError(null)}><X className="w-3.5 h-3.5" /></button>
              </div>
            )}

            <form id="email-form" onSubmit={handleUpdateEmail} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">Nuevo Correo Electrónico</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="nuevo_correo@inmobiliaria.com"
                    className="w-full bg-slate-950 border border-white/10 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-400 pt-1">
                  Se enviará un correo de confirmación a la nueva dirección antes de efectuar el cambio.
                </p>
              </div>
            </form>
          </div>

          <button
            type="submit"
            form="email-form"
            disabled={savingEmail || !newEmail.trim()}
            className="w-full py-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
          >
            {savingEmail ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            ) : (
              <>
                <Mail className="w-4 h-4" />
                <span>Actualizar Correo</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* 2. SECCIÓN: CAMBIAR CONTRASEÑA (Validación con Contraseña Actual) */}
      <div className="bg-slate-900 border border-emerald-500/20 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex items-center gap-2.5 text-emerald-400 font-bold border-b border-white/5 pb-3">
          <KeyRound className="w-5 h-5" />
          <h3 className="text-base text-white">Seguridad & Contraseña</h3>
        </div>

        {passwordSuccess && (
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
            <button onClick={() => setPasswordSuccess(null)}><X className="w-3.5 h-3.5" /></button>
          </div>
        )}

        {passwordError && (
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{passwordError}</span>
            </div>
            <button onClick={() => setPasswordError(null)}><X className="w-3.5 h-3.5" /></button>
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-2xl">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">Contraseña Actual</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-white/10 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Nueva Contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-slate-950 border border-white/10 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Confirmar Nueva Contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repetir nueva contraseña"
                  className="w-full bg-slate-950 border border-white/10 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
            className="py-3 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {savingPassword ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Actualizar Contraseña</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* 4. SECCIÓN: PREFERENCIAS DE PLATAFORMA & ALERTAS WHATSAPP */}
      <div className="bg-slate-900 border border-emerald-500/20 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex items-center gap-2.5 text-emerald-400 font-bold border-b border-white/5 pb-3">
          <Globe className="w-5 h-5" />
          <h3 className="text-base text-white">Preferencias de Plataforma & Alertas</h3>
        </div>

        {prefsSuccess && (
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{prefsSuccess}</span>
            </div>
            <button onClick={() => setPrefsSuccess(null)}><X className="w-3.5 h-3.5" /></button>
          </div>
        )}

        {prefsError && (
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{prefsError}</span>
            </div>
            <button onClick={() => setPrefsError(null)}><X className="w-3.5 h-3.5" /></button>
          </div>
        )}

        <form onSubmit={handleSavePreferences} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Idioma</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="w-full bg-slate-950 border border-white/10 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none cursor-pointer"
              >
                <option value="es">Español (ES)</option>
                <option value="en">English (US)</option>
                <option value="pt">Português (BR)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Moneda Principal</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as any)}
                className="w-full bg-slate-950 border border-white/10 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none cursor-pointer"
              >
                <option value="USD">USD ($)</option>
                <option value="MXN">MXN ($)</option>
                <option value="COP">COP ($)</option>
                <option value="ARS">ARS ($)</option>
                <option value="CLP">CLP ($)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-white/5">
            <label className="block text-xs font-semibold text-slate-300">
              Teléfono para Alertas de WhatsApp (Asesor Inmobiliario)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej: 5492604014372"
                className="w-full bg-slate-950 border border-white/10 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white font-mono placeholder-slate-500 outline-none transition-all"
              />
            </div>
            <p className="text-[11px] text-slate-400 pt-1">
              Ingresá el número internacional sin espacios ni símbolos (código de país + número, ej. 5492604014372).
            </p>
          </div>

          <button
            type="submit"
            disabled={savingPreferences}
            className="py-3 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {savingPreferences ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Guardando Preferencias...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-slate-950" />
                <span>Guardar Preferencias</span>
              </>
            )}
          </button>
        </form>
      </div>

    </div>
  );
};

export default ProfileSettingsView;

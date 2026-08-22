import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  KeyRound,
  Phone,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogOut,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  HelpCircle,
  RefreshCw,
  Lock
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export const WhatsAppSettings: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState<boolean>(false);
  const [copiedToken, setCopiedToken] = useState<boolean>(false);

  // Form Fields for Meta Official API
  const [metaPhoneId, setMetaPhoneId] = useState<string>('');
  const [metaWabaId, setMetaWabaId] = useState<string>('');
  const [metaAccessToken, setMetaAccessToken] = useState<string>('');
  const [metaWebhookVerifyToken, setMetaWebhookVerifyToken] = useState<string>('aria_prop_whatsapp_webhook_secret_verify_token_2026');
  
  const [orgData, setOrgData] = useState<any>(null);
  const [verifiedInfo, setVerifiedInfo] = useState<{
    verifiedName?: string;
    displayPhoneNumber?: string;
    qualityRating?: string;
  } | null>(null);

  const webhookUrl = 'https://ariaprop.online/api/webhook/whatsapp';

  // 1. Cargar estado de conexión de la organización
  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      if (!supabase) return;
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData?.user?.id || user?.id;

      if (!currentUserId) return;

      const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .or(`user_id.eq.${currentUserId},id.eq.${currentUserId}`)
        .maybeSingle();

      if (org) {
        setOrgData(org);
        const phoneId = org.meta_phone_number_id || org.wa_phone_number_id || '';
        const wabaId = org.meta_waba_id || org.wa_waba_id || '';
        const verifyTok = org.meta_webhook_verify_token || org.wa_verify_token || 'aria_prop_whatsapp_webhook_secret_verify_token_2026';

        setMetaPhoneId(phoneId);
        setMetaWabaId(wabaId);
        setMetaWebhookVerifyToken(verifyTok);

        if (phoneId && (org.meta_access_token || org.wa_access_token || org.wa_connected)) {
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      }
    } catch (err: any) {
      console.warn('Error al cargar estado de WhatsApp:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // 2. Verificar credenciales con Meta Graph API
  const handleVerifyCredentials = async () => {
    const cleanPhoneId = metaPhoneId.trim();
    const cleanToken = metaAccessToken.trim();

    if (!cleanPhoneId) {
      setErrorMsg('Ingresá el Phone Number ID proporcionado por Meta Developers.');
      return;
    }
    if (!cleanToken) {
      setErrorMsg('Ingresá el Token de acceso permanente de Meta.');
      return;
    }

    setVerifying(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setVerifiedInfo(null);

    try {
      let authToken = '';
      if (supabase) {
        const { data: sessionData } = await supabase.auth.getSession();
        authToken = sessionData.session?.access_token || '';
      }

      const res = await fetch('/api/whatsapp/oauth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          action: 'verify-credentials',
          meta_phone_number_id: cleanPhoneId,
          meta_access_token: cleanToken,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success && data.verified) {
        setVerifiedInfo({
          verifiedName: data.verifiedName,
          displayPhoneNumber: data.displayPhoneNumber,
          qualityRating: data.qualityRating,
        });
        setSuccessMsg(`✓ Línea verificada con éxito: ${data.verifiedName} (${data.displayPhoneNumber})`);
      } else {
        setErrorMsg(data.error || 'Meta no pudo verificar las credenciales. Revisá el Phone ID y el Token.');
      }
    } catch (err: any) {
      setErrorMsg(`Error de conexión con Meta: ${err.message || err}`);
    } finally {
      setVerifying(false);
    }
  };

  // 3. Guardar configuración en Supabase y activar bot
  const handleSaveConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhoneId = metaPhoneId.trim();
    const cleanWabaId = metaWabaId.trim();
    const cleanToken = metaAccessToken.trim();
    const cleanVerifyToken = metaWebhookVerifyToken.trim() || 'aria_prop_whatsapp_webhook_secret_verify_token_2026';

    if (!cleanPhoneId) {
      setErrorMsg('El campo Phone Number ID es obligatorio.');
      return;
    }

    setConnecting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      let authToken = '';
      if (supabase) {
        const { data: sessionData } = await supabase.auth.getSession();
        authToken = sessionData.session?.access_token || '';
      }

      const res = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          action: 'connect',
          meta_phone_number_id: cleanPhoneId,
          meta_waba_id: cleanWabaId || undefined,
          meta_access_token: cleanToken,
          meta_webhook_verify_token: cleanVerifyToken,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setSuccessMsg('¡WhatsApp Cloud API oficial conectada y activa! El bot ya está atendiendo.');
        setIsConnected(true);
        setMetaAccessToken('');
        await fetchStatus();
      } else {
        setErrorMsg(data.error || 'No se pudo guardar la conexión.');
      }
    } catch (err: any) {
      setErrorMsg(`Error al conectar: ${err.message || err}`);
    } finally {
      setConnecting(false);
    }
  };

  // 4. Desconectar cuenta
  const handleDisconnect = async () => {
    if (!window.confirm('¿Seguro que deseas desconectar WhatsApp Cloud API? El bot dejará de responder automáticamente en esta línea.')) {
      return;
    }

    setConnecting(true);
    try {
      let authToken = '';
      if (supabase) {
        const { data: sessionData } = await supabase.auth.getSession();
        authToken = sessionData.session?.access_token || '';
      }

      await fetch('/api/whatsapp/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ action: 'disconnect' }),
      });

      setIsConnected(false);
      setOrgData(null);
      setVerifiedInfo(null);
      setMetaPhoneId('');
      setMetaWabaId('');
      setMetaAccessToken('');
      setSuccessMsg('Línea de WhatsApp desconectada.');
      await fetchStatus();
    } catch (err: any) {
      setErrorMsg(`Error al desconectar: ${err.message || err}`);
    } finally {
      setConnecting(false);
    }
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2500);
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(metaWebhookVerifyToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            Integración Oficial Meta WhatsApp Cloud API
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Conecta la API oficial de Meta para atención automatizada con IA 24/7, sincronización directa con el CRM y cero riesgo de bloqueos.
          </p>
        </div>

        {isConnected && (
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Estado: Conectado y Activo</span>
          </div>
        )}
      </div>

      {/* Webhook Configuration Box for Meta Developers */}
      <div className="p-5 rounded-3xl bg-slate-900/90 border border-white/10 space-y-4 backdrop-blur-xl shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Paso 1: Configurar Webhook en Meta for Developers
          </h3>
          <a
            href="https://developers.facebook.com/apps/"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>Ir a Meta Developers</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          En el panel de tu App de Meta, ve a <strong>WhatsApp &gt; Configuración &gt; Webhook</strong>, haz clic en <strong>Editar</strong> e ingresa estos valores:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-white/10 space-y-1.5">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>URL de devolución de llamada (Callback URL):</span>
              <button
                type="button"
                onClick={handleCopyWebhook}
                className="text-emerald-400 hover:text-emerald-300 font-sans font-bold flex items-center gap-1 cursor-pointer"
              >
                {copiedWebhook ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedWebhook ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
            <p className="text-emerald-300 text-xs break-all font-bold select-all">
              {webhookUrl}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-white/10 space-y-1.5">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Identificador de verificación (Verify Token):</span>
              <button
                type="button"
                onClick={handleCopyToken}
                className="text-emerald-400 hover:text-emerald-300 font-sans font-bold flex items-center gap-1 cursor-pointer"
              >
                {copiedToken ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedToken ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
            <p className="text-emerald-300 text-xs break-all font-bold select-all">
              {metaWebhookVerifyToken}
            </p>
          </div>
        </div>

        <p className="text-[11px] text-slate-400">
          💡 En los campos del webhook en Meta, asegúrate de suscribirte al evento <strong>messages</strong>.
        </p>
      </div>

      {/* Credentials Form Box */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-white/10 space-y-6 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-400" />
              Paso 2: Credenciales de WhatsApp Cloud API
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ingresa los identificadores y el token permanente de tu System User de Meta.
            </p>
          </div>

          {isConnected && (
            <button
              type="button"
              disabled={connecting}
              onClick={handleDisconnect}
              className="px-3.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 font-bold text-xs border border-red-500/30 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {connecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
              <span>Desconectar Línea</span>
            </button>
          )}
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSaveConnection} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Phone Number ID */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                Phone Number ID (Identificador de Número) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={metaPhoneId}
                onChange={(e) => { setMetaPhoneId(e.target.value); setVerifiedInfo(null); }}
                placeholder="Ej. 104829472918472 (15-17 dígitos numéricos)"
                className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white font-mono focus:outline-none focus:border-emerald-500 transition-all placeholder:text-slate-600"
              />
              <p className="text-[11px] text-slate-500">
                Se obtiene en WhatsApp &gt; Configuración de la API en Meta for Developers.
              </p>
            </div>

            {/* WABA ID */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                WABA ID (WhatsApp Business Account ID)
              </label>
              <input
                type="text"
                value={metaWabaId}
                onChange={(e) => setMetaWabaId(e.target.value)}
                placeholder="Ej. 1092837465987123"
                className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white font-mono focus:outline-none focus:border-emerald-500 transition-all placeholder:text-slate-600"
              />
              <p className="text-[11px] text-slate-500">
                Identificador de la cuenta de WhatsApp Business.
              </p>
            </div>

          </div>

          {/* Access Token */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              Meta Access Token (System User / Token Permanente) <span className="text-rose-400">*</span>
            </label>
            <input
              type="password"
              value={metaAccessToken}
              onChange={(e) => { setMetaAccessToken(e.target.value); setVerifiedInfo(null); }}
              placeholder={isConnected ? '•••••••••••••••••••••••••••••••• (Guardado encriptado)' : 'EAAG...'}
              className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white font-mono focus:outline-none focus:border-emerald-500 transition-all placeholder:text-slate-600"
            />
            <p className="text-[11px] text-slate-500">
              Token de usuario del sistema con permisos `whatsapp_business_messaging` y `whatsapp_business_management`.
            </p>
          </div>

          {/* Webhook Verify Token (Editable) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Webhook Verify Token Personalizado
            </label>
            <input
              type="text"
              value={metaWebhookVerifyToken}
              onChange={(e) => setMetaWebhookVerifyToken(e.target.value)}
              placeholder="aria_prop_whatsapp_webhook_secret_verify_token_2026"
              className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white font-mono focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Verified Badge */}
          {verifiedInfo && (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Línea Verificada con Meta Graph API</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px]">Nombre Registrado:</span>
                  <p className="font-semibold text-white">{verifiedInfo.verifiedName}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Número Visible:</span>
                  <p className="font-semibold text-white">{verifiedInfo.displayPhoneNumber}</p>
                </div>
              </div>
            </div>
          )}

          {/* Form Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              type="button"
              disabled={verifying || !metaPhoneId || !metaAccessToken}
              onClick={handleVerifyCredentials}
              className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 transition-all border border-white/10 cursor-pointer disabled:opacity-50"
            >
              {verifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>Verificando con Meta...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Probar y Verificar Credenciales</span>
                </>
              )}
            </button>

            <button
              type="submit"
              disabled={connecting || !metaPhoneId}
              className="px-7 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 transition-all shadow-xl shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
            >
              {connecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 fill-slate-950 text-emerald-500" />
                  <span>Guardar y Activar WhatsApp Cloud API</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>

    </div>
  );
};

export default WhatsAppSettings;

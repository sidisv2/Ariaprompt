import React, { useEffect, useState, useCallback } from 'react';
import {
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Loader2,
  Phone,
  Building2,
  HelpCircle,
  LogOut,
  Sparkles,
  KeyRound,
  Layers,
  Send,
  Check,
  Copy,
  Info
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

declare global {
  interface Window {
    FB?: any;
    fbAsyncInit?: () => void;
  }
}

export interface WhatsAppOrgStatus {
  id: string;
  name: string;
  wa_phone_number_id: string | null;
  wa_waba_id: string | null;
  wa_connected: boolean;
  updated_at?: string;
}

export interface VerifiedCredentialsInfo {
  verifiedName: string;
  displayPhoneNumber: string | null;
  qualityRating?: string;
  phoneNumberId: string;
}

export const WhatsAppSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'manual' | 'embedded'>('manual');
  const [orgStatus, setOrgStatus] = useState<WhatsAppOrgStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Manual Form States
  const [manualPhoneId, setManualPhoneId] = useState<string>('');
  const [manualWabaId, setManualWabaId] = useState<string>('');
  const [manualAccessToken, setManualAccessToken] = useState<string>('');
  const [verifiedInfo, setVerifiedInfo] = useState<VerifiedCredentialsInfo | null>(null);

  // Helper for safe JSON parsing
  const safeFetchJson = async (url: string, options?: RequestInit) => {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    let data: any = {};
    if (contentType.includes('application/json')) {
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }
    } else {
      const text = await res.text().catch(() => '');
      data = { text };
    }
    return { ok: res.ok, status: res.status, data };
  };

  // 1. Fetch current WhatsApp connection status
  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      let token = '';
      if (supabase) {
        const { data: sessionData } = await supabase.auth.getSession();
        token = sessionData.session?.access_token || '';
      }

      const { ok, data } = await safeFetchJson('/api/whatsapp/connect', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (ok && data.success) {
        if (data.isConnected && data.organization) {
          setOrgStatus(data.organization);
          if (data.organization.wa_phone_number_id) {
            setManualPhoneId(data.organization.wa_phone_number_id);
          }
          if (data.organization.wa_waba_id) {
            setManualWabaId(data.organization.wa_waba_id);
          }
        } else {
          setOrgStatus(null);
        }
      }
    } catch (err) {
      console.warn('⚠️ Error al consultar estado de WhatsApp:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Load Facebook SDK dynamically for Embedded Signup
  useEffect(() => {
    fetchStatus();

    const appId = import.meta.env.VITE_META_APP_ID || '891096146948509';

    if (!document.getElementById('facebook-jssdk')) {
      const js = document.createElement('script');
      js.id = 'facebook-jssdk';
      js.src = 'https://connect.facebook.net/es_LA/sdk.js';
      js.async = true;
      js.defer = true;
      document.body.appendChild(js);

      window.fbAsyncInit = () => {
        if (window.FB) {
          window.FB.init({
            appId,
            cookie: true,
            xfbml: true,
            version: 'v20.0',
          });
        }
      };
    }

    // 3. Listen for Meta Embedded Signup postMessage events
    const handleMessageEvent = (event: MessageEvent) => {
      if (!event.origin.includes('facebook.com')) return;
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data.type === 'WA_EMBEDDED_SIGNUP') {
          console.log('📌 Meta Embedded Signup Event Received:', data);
          if (data.data?.waba_id && data.data?.phone_number_id) {
            handleCompleteSignup({
              wabaId: data.data.waba_id,
              phoneNumberId: data.data.phone_number_id,
            });
          }
        }
      } catch {}
    };

    window.addEventListener('message', handleMessageEvent);
    return () => window.removeEventListener('message', handleMessageEvent);
  }, [fetchStatus]);

  // 4. Verify Manual Credentials with Meta Graph API
  const handleVerifyManualCredentials = async () => {
    const cleanPhoneId = manualPhoneId.trim();
    const cleanToken = manualAccessToken.trim();

    if (!cleanPhoneId) {
      setErrorMsg('Por favor, ingresa el Phone Number ID asignado por Meta.');
      return;
    }

    if (!/^\d{12,20}$/.test(cleanPhoneId)) {
      setErrorMsg('El Phone Number ID debe ser un identificador numérico de Meta (15-17 dígitos), no ingreses tu número telefónico.');
      return;
    }

    if (!cleanToken || cleanToken.length < 20) {
      setErrorMsg('Por favor, ingresa un Access Token permanente o de System User de Meta válido.');
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

      const { ok, data } = await safeFetchJson('/api/whatsapp/oauth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          action: 'verify-credentials',
          phoneNumberId: cleanPhoneId,
          accessToken: cleanToken,
        }),
      });

      if (ok && data.success && data.verified) {
        setVerifiedInfo({
          verifiedName: data.verifiedName,
          displayPhoneNumber: data.displayPhoneNumber,
          qualityRating: data.qualityRating,
          phoneNumberId: data.phoneNumberId,
        });
        setSuccessMsg(`✅ ¡Credenciales verificadas con Meta! Línea: ${data.verifiedName} (${data.displayPhoneNumber || cleanPhoneId})`);
      } else {
        const errorDetail = data.error || (data.details?.message ? `Meta API: ${data.details.message}` : 'Meta Graph API no pudo verificar estas credenciales. Revisa el Phone Number ID y el Access Token.');
        console.error('[Meta Verify Error]:', data);
        setErrorMsg(errorDetail);
      }
    } catch (err: any) {
      console.error('[Meta Verify Exception]:', err);
      setErrorMsg(`Error al verificar credenciales con Meta: ${err.message || String(err)}`);
    } finally {
      setVerifying(false);
    }
  };

  // 5. Save & Connect Manual Credentials
  const handleSaveManualConnection = async () => {
    const cleanPhoneId = manualPhoneId.trim();
    const cleanWabaId = manualWabaId.trim();
    const cleanToken = manualAccessToken.trim();

    if (!cleanPhoneId || !cleanToken) {
      setErrorMsg('Debes ingresar el Phone Number ID y el Access Token antes de guardar.');
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
          phone_number_id: cleanPhoneId,
          phoneNumberId: cleanPhoneId,
          waba_id: cleanWabaId || undefined,
          wabaId: cleanWabaId || undefined,
          access_token: cleanToken,
          accessToken: cleanToken,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setSuccessMsg('🎉 ¡WhatsApp Business oficial conectado y activo! Aria responderá automáticamente.');
        if (data.organization) {
          setOrgStatus(data.organization);
        }
        setVerifiedInfo(null);
        setManualAccessToken('');
        fetchStatus();
      } else {
        const errorMsg = data.error || data.message || `Error HTTP ${res.status}`;
        console.error('[WhatsApp Connect Detailed Error]:', { status: res.status, data });
        setErrorMsg(`Error al guardar: ${errorMsg}`);
      }
    } catch (err: any) {
      console.error('[WhatsApp Connect Exception]:', err);
      setErrorMsg(`Excepción al conectar: ${err.message || 'Error de red o conexión'}`);
    } finally {
      setConnecting(false);
    }
  };

  // 6. Complete Embedded Signup flow by posting code/IDs to backend
  const handleCompleteSignup = async (payload: { code?: string; wabaId?: string; phoneNumberId?: string }) => {
    setConnecting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      let token = '';
      if (supabase) {
        const { data: sessionData } = await supabase.auth.getSession();
        token = sessionData.session?.access_token || '';
      }

      const { ok, data } = await safeFetchJson('/api/whatsapp/oauth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: 'connect',
          ...payload,
        }),
      });

      if (ok && data.success) {
        setSuccessMsg('✅ Cuenta de WhatsApp Business vinculada correctamente vía Meta Login');
        if (data.organization) {
          setOrgStatus(data.organization);
        }
        fetchStatus();
      } else {
        setErrorMsg(data.error || 'No se pudo vincular la cuenta mediante Meta Login.');
      }
    } catch (err: any) {
      setErrorMsg(`Error al vincular cuenta: ${err.message || String(err)}`);
    } finally {
      setConnecting(false);
    }
  };

  // 7. Trigger FB.login Embedded Signup Popup
  const handleLaunchEmbeddedSignup = () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const appId = import.meta.env.VITE_META_APP_ID || '891096146948509';
    const configId = import.meta.env.VITE_META_CONFIG_ID || '';

    if (!window.FB) {
      const redirectUri = `${window.location.origin}/api/whatsapp/oauth`;
      const oauthUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=whatsapp_business_management,whatsapp_business_messaging,public_profile`;
      window.open(oauthUrl, 'FacebookLogin', 'width=600,height=700');
      return;
    }

    setConnecting(true);

    window.FB.login(
      (response: any) => {
        if (response.authResponse?.code) {
          handleCompleteSignup({ code: response.authResponse.code });
        } else {
          console.warn('Usuario canceló el inicio de sesión con Meta o cerró la ventana emergente.');
          setConnecting(false);
        }
      },
      {
        scope: 'whatsapp_business_management,whatsapp_business_messaging,public_profile',
        config_id: configId || undefined,
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          setup: {},
          sessionInfoVersion: '2',
        },
      }
    );
  };

  // 8. Disconnect Account
  const handleDisconnect = async () => {
    if (!window.confirm('¿Estás seguro de que deseas desconectar tu cuenta oficial de WhatsApp Business? Aria dejará de responder automáticamente a los clientes.')) {
      return;
    }

    setConnecting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      let token = '';
      if (supabase) {
        const { data: sessionData } = await supabase.auth.getSession();
        token = sessionData.session?.access_token || '';
      }

      const res = await fetch('/api/whatsapp/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'disconnect' }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setSuccessMsg('WhatsApp Business desconectado correctamente.');
        setOrgStatus(null);
        setVerifiedInfo(null);
        setManualPhoneId('');
        setManualWabaId('');
        setManualAccessToken('');
        fetchStatus();
      } else {
        setErrorMsg(data.error || 'No se pudo desconectar la cuenta.');
      }
    } catch (err: any) {
      setErrorMsg(`Error al desconectar: ${err.message || String(err)}`);
    } finally {
      setConnecting(false);
    }
  };

  const isConnected = Boolean(orgStatus?.wa_connected && orgStatus?.wa_phone_number_id);

  return (
    <div className="space-y-8 text-slate-100">
      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-page-fade">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 animate-page-fade">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Connection Status Card */}
      {loading ? (
        <div className="p-8 rounded-3xl bg-slate-900/80 border border-white/10 flex flex-col items-center justify-center space-y-3 text-slate-400 text-xs">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
          <span>Comprobando credenciales con Meta Cloud API...</span>
        </div>
      ) : isConnected ? (
        /* CONNECTED STATE */
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-emerald-500/40 space-y-6 backdrop-blur-xl shadow-xl shadow-emerald-500/5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-base">WhatsApp Cloud API Oficial</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    ACTIVO & VERIFICADO
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Organización: <strong className="text-white">{orgStatus?.name || 'Tu Inmobiliaria'}</strong>
                </p>
              </div>
            </div>

            <button
              disabled={connecting}
              onClick={handleDisconnect}
              className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 font-semibold text-xs border border-red-500/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {connecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
              <span>Desconectar Cuenta</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 space-y-1">
              <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" /> Phone Number ID (Meta Graph API)
              </span>
              <p className="font-mono text-white font-bold text-sm">
                {orgStatus?.wa_phone_number_id || 'No asignado'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 space-y-1">
              <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" /> WABA ID (WhatsApp Business Account)
              </span>
              <p className="font-mono text-white font-bold text-sm">
                {orgStatus?.wa_waba_id || 'Configurado'}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/20 text-xs text-emerald-200 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-300">¡Aria Bot comercial está atendiendo en vivo!</p>
              <p className="text-emerald-400/80 mt-0.5 leading-relaxed">
                Los mensajes entrantes a este Phone Number ID son procesados en tiempo real por Aria, consultando el catálogo de propiedades de tu inmobiliaria y registrando los leads en tu CRM.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* DISCONNECTED / DUAL ONBOARDING STATE */
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-white/10 space-y-6 backdrop-blur-xl">
          
          <div className="space-y-2">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Conectar Cuenta de WhatsApp Business Oficial (Meta Cloud API)
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              Selecciona el método de conexión para vincular la línea de tu inmobiliaria. Aria se integrará directamente con los servidores de Meta Graph API v20.0 con máxima estabilidad y sin riesgo de bloqueos.
            </p>
          </div>

          {/* Dual Mode Switcher */}
          <div className="flex p-1 bg-slate-950 rounded-2xl border border-white/10 w-full sm:w-fit gap-1 text-xs">
            <button
              onClick={() => { setActiveTab('manual'); setErrorMsg(null); }}
              className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'manual'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>Configuración Manual (Avanzado)</span>
            </button>

            <button
              onClick={() => { setActiveTab('embedded'); setErrorMsg(null); }}
              className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'embedded'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span>Meta Embedded Signup (1 Clic)</span>
            </button>
          </div>

          {/* TAB 1: MANUAL CREDENTIALS FORM */}
          {activeTab === 'manual' && (
            <div className="space-y-6 pt-2">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/5 text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-emerald-400" /> ¿Dónde obtengo estas credenciales?
                </p>
                <p className="leading-relaxed">
                  En tu panel de <strong className="text-white">Meta for Developers &gt; WhatsApp &gt; Configuración de la API</strong> encontrarás tu <strong className="text-white">Identificador de número de teléfono (Phone Number ID)</strong> y tu <strong className="text-white">Identificador de la cuenta de WhatsApp Business (WABA ID)</strong>. El token se genera en tu Meta Business Manager como <em>System User Token</em>.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" /> Phone Number ID <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 1215379554999227 (15-17 dígitos)"
                    value={manualPhoneId}
                    onChange={(e) => { setManualPhoneId(e.target.value); setVerifiedInfo(null); }}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-white/10 text-white text-xs font-mono focus:border-emerald-500 focus:outline-none transition-colors placeholder:text-slate-600"
                  />
                  <p className="text-[11px] text-slate-500">ID numérico de la línea en Meta (no ingreses tu número telefónico).</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" /> WABA ID (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 1092837465987123"
                    value={manualWabaId}
                    onChange={(e) => setManualWabaId(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-white/10 text-white text-xs font-mono focus:border-emerald-500 focus:outline-none transition-colors placeholder:text-slate-600"
                  />
                  <p className="text-[11px] text-slate-500">WhatsApp Business Account ID.</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-400" /> Meta Access Token (System User / Permanent Token) <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  placeholder="EAAG..."
                  value={manualAccessToken}
                  onChange={(e) => { setManualAccessToken(e.target.value); setVerifiedInfo(null); }}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-white/10 text-white text-xs font-mono focus:border-emerald-500 focus:outline-none transition-colors placeholder:text-slate-600"
                />
                <p className="text-[11px] text-slate-500">Token con permisos `whatsapp_business_messaging` y `whatsapp_business_management`.</p>
              </div>

              {/* Verified Preview Card */}
              {verifiedInfo && (
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-2 animate-page-fade">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Línea Verificada Exitosamente por Meta Graph API</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px]">Nombre Verificado:</span>
                      <p className="font-semibold text-white">{verifiedInfo.verifiedName}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px]">Número Visible:</span>
                      <p className="font-semibold text-white">{verifiedInfo.displayPhoneNumber || 'Configurado'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={verifying || !manualPhoneId || !manualAccessToken}
                  onClick={handleVerifyManualCredentials}
                  className="px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 transition-all border border-white/10 cursor-pointer disabled:opacity-50"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                      <span>Verificando con Meta...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>1. Probar y Verificar Credenciales</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={connecting || !manualPhoneId || !manualAccessToken}
                  onClick={handleSaveManualConnection}
                  className="px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 transition-all shadow-xl shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                >
                  {connecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Guardando conexión...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>2. Guardar y Activar WhatsApp</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: META EMBEDDED SIGNUP (POPUP) */}
          {activeTab === 'embedded' && (
            <div className="space-y-6 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-white/5 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" /> 1. Cuenta Meta
                  </div>
                  <p className="text-slate-400 text-[11px]">Acceso a Meta Business Suite o Business Manager.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-white/5 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" /> 2. Número Teléfono
                  </div>
                  <p className="text-slate-400 text-[11px]">Número disponible para recibir SMS de verificación Meta.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-white/5 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" /> 3. Nombre Comercial
                  </div>
                  <p className="text-slate-400 text-[11px]">Nombre visible de tu inmobiliaria para WhatsApp.</p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  disabled={connecting}
                  onClick={handleLaunchEmbeddedSignup}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-600/20 cursor-pointer disabled:opacity-50"
                >
                  {connecting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Conectando con Meta...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      <span>Conectar WhatsApp Comercial (Meta Login)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

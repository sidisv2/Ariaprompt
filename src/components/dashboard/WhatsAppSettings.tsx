import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Info,
  Lock,
  Globe,
  Crown,
  ArrowRight
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

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
  meta_access_token?: string | null;
  subscription_status?: string | null;
  plan_id?: string | null;
}

export interface VerifiedCredentialsInfo {
  verifiedName: string;
  displayPhoneNumber: string | null;
  qualityRating?: string;
  phoneNumberId: string;
}

export const WhatsAppSettings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'manual' | 'embedded'>('manual');
  const [orgStatus, setOrgStatus] = useState<WhatsAppOrgStatus | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState<boolean>(false);
  const [copiedToken, setCopiedToken] = useState<boolean>(false);

  // SessionStorage keys for transient input persistence across tab navigation
  const STORAGE_KEY_PHONE = 'ariaprop_wa_draft_phone_id';
  const STORAGE_KEY_WABA = 'ariaprop_wa_draft_waba_id';
  const STORAGE_KEY_TOKEN = 'ariaprop_wa_draft_access_token';

  // Manual Form States initialized from sessionStorage if present
  const [manualPhoneId, setManualPhoneId] = useState<string>(() => {
    return typeof window !== 'undefined' ? (sessionStorage.getItem(STORAGE_KEY_PHONE) || '') : '';
  });
  const [manualWabaId, setManualWabaId] = useState<string>(() => {
    return typeof window !== 'undefined' ? (sessionStorage.getItem(STORAGE_KEY_WABA) || '') : '';
  });
  const [manualAccessToken, setManualAccessToken] = useState<string>(() => {
    return typeof window !== 'undefined' ? (sessionStorage.getItem(STORAGE_KEY_TOKEN) || '') : '';
  });
  const [verifiedInfo, setVerifiedInfo] = useState<VerifiedCredentialsInfo | null>(null);

  // Ref to prevent subsequent background re-fetches from overriding user modifications
  const hasLoadedInitialData = useRef<boolean>(false);
  const userHasModifiedInputs = useRef<boolean>(false);

  const webhookUrl = 'https://ariaprop.online/api/webhook/whatsapp';
  const webhookVerifyToken = 'aria_prop_whatsapp_webhook_secret_verify_token_2026';

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

  // 1. Fetch current WhatsApp connection status and credentials from Supabase
  const fetchStatus = useCallback(async (isInitialMount: boolean = false) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (!supabase) return;
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData?.user?.id || user?.id;

      if (currentUserId) {
        const { data: org } = await supabase
          .from('organizations')
          .select('*')
          .or(`user_id.eq.${currentUserId},id.eq.${currentUserId}`)
          .maybeSingle();

        if (org) {
          const phoneId = org.meta_phone_number_id || org.wa_phone_number_id || '';
          const wabaId = org.meta_waba_id || org.wa_waba_id || '';
          const token = org.meta_access_token || org.wa_access_token || '';

          // Only populate inputs on initial mount if user hasn't typed in inputs or sessionStorage isn't set
          if (isInitialMount && !userHasModifiedInputs.current) {
            const savedDraftPhone = sessionStorage.getItem(STORAGE_KEY_PHONE);
            const savedDraftWaba = sessionStorage.getItem(STORAGE_KEY_WABA);
            const savedDraftToken = sessionStorage.getItem(STORAGE_KEY_TOKEN);

            if (savedDraftPhone !== null) {
              setManualPhoneId(savedDraftPhone);
            } else if (phoneId) {
              setManualPhoneId(phoneId);
            }

            if (savedDraftWaba !== null) {
              setManualWabaId(savedDraftWaba);
            } else if (wabaId) {
              setManualWabaId(wabaId);
            }

            if (savedDraftToken !== null) {
              setManualAccessToken(savedDraftToken);
            } else if (token) {
              setManualAccessToken(token);
            }
          }

          const hasActiveConn = Boolean(phoneId && (token || org.wa_connected));
          setIsConnected(hasActiveConn);
          setOrgStatus({
            id: org.id,
            name: org.name || 'Inmobiliaria',
            wa_phone_number_id: phoneId || null,
            wa_waba_id: wabaId || null,
            wa_connected: hasActiveConn,
            meta_access_token: token || null,
            subscription_status: org.subscription_status,
            plan_id: org.plan_id,
            updated_at: org.updated_at,
          });
        }
      }
    } catch (err) {
      console.warn('⚠️ Error al consultar estado de WhatsApp:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 2. Load Facebook SDK dynamically for Embedded Signup
  useEffect(() => {
    if (!hasLoadedInitialData.current) {
      hasLoadedInitialData.current = true;
      fetchStatus(true);
    } else {
      fetchStatus(false);
    }

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

  // 4. Verify Manual Credentials STRICTLY with Meta Graph API (Phone Number ID + WABA ID)
  const handleVerifyManualCredentials = async () => {
    const cleanPhoneId = manualPhoneId.trim();
    const cleanWabaId = manualWabaId.trim();
    const cleanToken = manualAccessToken.trim();

    if (!cleanPhoneId) {
      setErrorMsg('Por favor, ingresa el Phone Number ID asignado por Meta.');
      return;
    }

    if (!cleanToken) {
      setErrorMsg('Por favor, ingresa el Meta Access Token permanente.');
      return;
    }

    setVerifying(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setVerifiedInfo(null);

    try {
      // 1. Validar Phone Number ID contra Meta Graph API
      const phoneUrl = `https://graph.facebook.com/v20.0/${encodeURIComponent(cleanPhoneId)}?fields=verified_name,display_phone_number,quality_rating,code_verification_status&access_token=${encodeURIComponent(cleanToken)}`;
      const phoneRes = await fetch(phoneUrl);
      const phoneData = await phoneRes.json().catch(() => ({}));

      if (!phoneRes.ok || phoneData.error) {
        const errorMsg = phoneData.error?.message || 'Credenciales inválidas en Meta Graph API.';
        throw new Error(`Phone Number ID inválido: ${errorMsg}`);
      }

      // 2. Si se ingresó WABA ID, validar también que el WABA exista y pertenezca al token
      if (cleanWabaId) {
        const wabaUrl = `https://graph.facebook.com/v20.0/${encodeURIComponent(cleanWabaId)}?fields=id,name&access_token=${encodeURIComponent(cleanToken)}`;
        const wabaRes = await fetch(wabaUrl);
        const wabaData = await wabaRes.json().catch(() => ({}));

        if (!wabaRes.ok || wabaData.error) {
          const errorMsg = wabaData.error?.message || 'No encontrado o sin permisos.';
          throw new Error(`WABA ID inválido: ${errorMsg}`);
        }
      }

      // Si todo es válido
      const verifiedName = phoneData.verified_name || phoneData.display_phone_number || 'Línea WhatsApp Oficial';
      const displayPhoneNumber = phoneData.display_phone_number || cleanPhoneId;

      setVerifiedInfo({
        verifiedName,
        displayPhoneNumber,
        qualityRating: phoneData.quality_rating || 'GREEN',
        phoneNumberId: phoneData.id || cleanPhoneId,
      });

      setSuccessMsg(`✅ ¡Credenciales válidas y verificadas con Meta! Línea: ${verifiedName} (${displayPhoneNumber})`);
    } catch (err: any) {
      console.error('[Meta Graph Verification Error]:', err);
      setErrorMsg(err.message || 'Error al verificar con Meta Graph API.');
    } finally {
      setVerifying(false);
    }
  };

  // 5. Save & Connect Manual Credentials (Direct Supabase Mutation - Zero 405 Error)
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
      if (!supabase) {
        throw new Error('Cliente de Supabase no disponible.');
      }

      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData?.user?.id || user?.id;

      if (!currentUserId) {
        throw new Error('Debes iniciar sesión para guardar la configuración.');
      }

      const updatePayload: Record<string, any> = {
        meta_phone_number_id: cleanPhoneId,
        meta_waba_id: cleanWabaId || null,
        meta_access_token: cleanToken,
        wa_connected: true,
        updated_at: new Date().toISOString(),
      };

      // Realizar update directo sobre la organización activa
      const { data: updatedOrg, error: updateErr } = await supabase
        .from('organizations')
        .update(updatePayload)
        .or(`user_id.eq.${currentUserId},id.eq.${currentUserId}`)
        .select()
        .maybeSingle();

      if (updateErr) {
        // Si la fila aún no existe, realizar un upsert
        const { error: upsertErr } = await supabase
          .from('organizations')
          .upsert({
            id: currentUserId,
            user_id: currentUserId,
            name: 'Mi Inmobiliaria',
            ...updatePayload,
          });

        if (upsertErr) {
          throw new Error(upsertErr.message);
        }
      }

      // Limpiar sessionStorage temporal tras guardado exitoso
      sessionStorage.removeItem(STORAGE_KEY_PHONE);
      sessionStorage.removeItem(STORAGE_KEY_WABA);
      sessionStorage.removeItem(STORAGE_KEY_TOKEN);
      userHasModifiedInputs.current = false;

      // Actualizar estado local inmediatamente
      setSuccessMsg('🎉 ¡WhatsApp Business oficial conectado y activo! Aria responderá automáticamente.');
      const newOrgState: WhatsAppOrgStatus = {
        id: updatedOrg?.id || orgStatus?.id || currentUserId,
        name: updatedOrg?.name || orgStatus?.name || 'Mi Inmobiliaria',
        wa_phone_number_id: cleanPhoneId,
        wa_waba_id: cleanWabaId || null,
        wa_connected: true,
        meta_access_token: cleanToken,
        subscription_status: orgStatus?.subscription_status || 'active',
        plan_id: orgStatus?.plan_id,
        updated_at: new Date().toISOString(),
      };

      setIsConnected(true);
      setOrgStatus(newOrgState);
      setVerifiedInfo(null);
    } catch (err: any) {
      console.error('[WhatsApp Direct Save Error]:', err);
      setErrorMsg(`Error al guardar: ${err.message || 'No se pudo guardar la configuración'}`);
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

      const res = await fetch('/api/whatsapp/connect', {
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

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setSuccessMsg('🎉 ¡WhatsApp Business oficial conectado y activo! Aria responderá automáticamente.');
        if (data.organization) {
          setIsConnected(true);
          setOrgStatus(data.organization);
        }
        await fetchStatus();
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
      setErrorMsg('El SDK de Meta se está inicializando o está bloqueado por tu navegador. Recarga la página o usa la Configuración Manual.');
      return;
    }

    try {
      const loginOptions: any = {
        scope: 'whatsapp_business_management,whatsapp_business_messaging',
        response_type: 'code',
      };

      if (configId && configId !== 'null') {
        loginOptions.config_id = configId;
      }

      window.FB.login((response: any) => {
        if (response.authResponse) {
          const code = response.authResponse.code;
          handleCompleteSignup({ code });
        } else {
          setErrorMsg('El proceso de vinculación con Meta fue cancelado o no otorgó los permisos requeridos.');
        }
      }, loginOptions);
    } catch (e: any) {
      setErrorMsg(`Error al abrir popup de Meta: ${e.message || String(e)}`);
    }
  };

  // 8. Disconnect WhatsApp (Direct Supabase Clean Mutation)
  const handleDisconnect = async () => {
    if (!confirm('¿Estás seguro de desconectar WhatsApp oficial? Aria dejará de responder automáticamente en este canal.')) return;
    setConnecting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (!supabase) {
        throw new Error('Cliente de Supabase no disponible.');
      }

      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData?.user?.id || user?.id;

      if (!currentUserId) {
        throw new Error('No hay sesión activa.');
      }

      // Mutación limpia en Supabase sobre la organización
      const { error } = await supabase
        .from('organizations')
        .update({
          meta_phone_number_id: null,
          meta_waba_id: null,
          meta_access_token: null,
          wa_connected: false,
          updated_at: new Date().toISOString(),
        })
        .or(`user_id.eq.${currentUserId},id.eq.${currentUserId}`);

      if (error) {
        throw new Error(error.message);
      }

      // Resetear estado local y sessionStorage de inmediato
      sessionStorage.removeItem(STORAGE_KEY_PHONE);
      sessionStorage.removeItem(STORAGE_KEY_WABA);
      sessionStorage.removeItem(STORAGE_KEY_TOKEN);
      userHasModifiedInputs.current = false;

      setIsConnected(false);
      setOrgStatus((prev) => prev ? { ...prev, wa_connected: false, wa_phone_number_id: null, wa_waba_id: null, meta_access_token: null } : null);
      setManualPhoneId('');
      setManualWabaId('');
      setManualAccessToken('');
      setVerifiedInfo(null);
      setSuccessMsg('✅ Línea de WhatsApp desconectada correctamente.');
    } catch (err: any) {
      console.error('[WhatsApp Disconnect Error]:', err);
      setErrorMsg(`Error al desconectar: ${err.message || 'No se pudo desconectar la línea'}`);
    } finally {
      setConnecting(false);
    }
  };

  const copyToClipboard = (text: string, isTok: boolean = false) => {
    navigator.clipboard.writeText(text);
    if (isTok) {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    } else {
      setCopiedWebhook(true);
      setTimeout(() => setCopiedWebhook(false), 2000);
    }
  };

  // Check Subscription / Plan access
  const hasActivePlan = (() => {
    if (!orgStatus) return true;
    const plan = (orgStatus.plan_id || '').toLowerCase();
    const status = (orgStatus.subscription_status || '').toLowerCase();
    if (plan.includes('pro') || plan.includes('business') || plan.includes('agency') || plan.includes('scale')) {
      return status !== 'canceled' && status !== 'expired' && status !== 'unpaid';
    }
    if (status === 'past_due' || status === 'canceled' || status === 'expired') {
      return false;
    }
    return true;
  })();

  const isFreePlanBlocked = orgStatus && !hasActivePlan;

  return (
    <div className="space-y-6 max-w-4xl animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2.5">
            <MessageSquare className="w-6 h-6 text-emerald-400" />
            Integración con WhatsApp Business API
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Conecta tu número oficial de Meta Cloud API para que Aria atienda y cualifique a tus prospectos 24/7.
          </p>
        </div>

        <button
          onClick={() => fetchStatus(false)}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-2 self-start sm:self-auto cursor-pointer transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Connected State Banner */}
      {isConnected && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-4 animate-fadeIn shadow-lg shadow-emerald-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-emerald-300">
                🎉 ¡WhatsApp Business oficial conectado y activo! Aria responderá automáticamente.
              </p>
              <p className="text-[11px] text-slate-400">
                Phone Number ID: <strong className="text-slate-200 font-mono">{orgStatus?.wa_phone_number_id || manualPhoneId}</strong>
                {orgStatus?.wa_waba_id && (
                  <span> · WABA ID: <strong className="text-slate-200 font-mono">{orgStatus.wa_waba_id}</strong></span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={handleDisconnect}
            disabled={connecting}
            className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            {connecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
            <span>Desconectar</span>
          </button>
        </div>
      )}

      {/* Paywall Banner Overlay if Subscription is Inactive */}
      {isFreePlanBlocked && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-emerald-500/15 border border-amber-500/30 shadow-2xl relative overflow-hidden space-y-4 animate-fadeIn">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30 shadow-lg">
              <Crown className="w-6 h-6" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  Plan Pro & Business
                </span>
                <span className="text-xs text-amber-300 font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Función Bloqueada
                </span>
              </div>
              <h3 className="text-base font-black text-white">
                Conexión con WhatsApp Business API disponible en Planes de Pago
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Para conectar tu número oficial de WhatsApp con Meta Cloud API y activar a Aria respondiendo automáticamente a tus prospectos 24/7, actualizá tu suscripción a un plan Pro o Business.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <a
              href="/pricing"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 fill-slate-950" />
              <span>Ver Planes y Mejorar Suscripción</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* Alert Messages */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Two Top Selection Tabs */}
      <div className="flex items-center gap-3 p-1.5 rounded-2xl bg-slate-900/90 border border-white/10 w-full sm:w-fit">
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'manual'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>🔑 Configuración Manual (Avanzado)</span>
        </button>

        <button
          onClick={() => setActiveTab('embedded')}
          className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'embedded'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>🌐 Meta Embedded Signup (1 Clic)</span>
        </button>
      </div>

      {/* Tab 1: Manual Configuration */}
      {activeTab === 'manual' && (
        <div className={`space-y-6 ${isFreePlanBlocked ? 'opacity-50 pointer-events-none filter blur-[1px]' : ''}`}>
          
          {/* Step 1: Webhook Configuration Info */}
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-white/10 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Paso 1: Configurar Webhook en Meta Developers
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              En tu aplicación de Meta for Developers (WhatsApp &gt; Configuration), copia y pega la URL de Callback y el Verify Token:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-950 border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Callback URL (Webhook)</span>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono text-emerald-300 truncate">{webhookUrl}</span>
                  <button
                    onClick={() => copyToClipboard(webhookUrl, false)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer shrink-0"
                    title="Copiar URL"
                  >
                    {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Verify Token</span>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono text-emerald-300 truncate">{webhookVerifyToken}</span>
                  <button
                    onClick={() => copyToClipboard(webhookVerifyToken, true)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer shrink-0"
                    title="Copiar Token"
                  >
                    {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Meta Credentials Form */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-white/10 space-y-4 shadow-xl">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <KeyRound className="w-4 h-4" />
              Paso 2: Credenciales de Meta Cloud API
            </h3>

            <div className="space-y-4 text-xs">
              {/* Phone Number ID */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                  <span>Phone Number ID <strong className="text-rose-400">*</strong></span>
                  <span className="text-[10px] text-slate-500 font-normal">Identificador numérico de 15 a 17 dígitos</span>
                </label>
                <input
                  type="text"
                  value={manualPhoneId}
                  onChange={(e) => {
                    const val = e.target.value;
                    userHasModifiedInputs.current = true;
                    setManualPhoneId(val);
                    sessionStorage.setItem(STORAGE_KEY_PHONE, val);
                  }}
                  placeholder="Ej: 106592837461928"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono transition-all"
                />
              </div>

              {/* WABA ID */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                  <span>WABA ID (Opcional)</span>
                  <span className="text-[10px] text-slate-500 font-normal">WhatsApp Business Account ID</span>
                </label>
                <input
                  type="text"
                  value={manualWabaId}
                  onChange={(e) => {
                    const val = e.target.value;
                    userHasModifiedInputs.current = true;
                    setManualWabaId(val);
                    sessionStorage.setItem(STORAGE_KEY_WABA, val);
                  }}
                  placeholder="Ej: 198273645102938"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono transition-all"
                />
              </div>

              {/* Meta Access Token */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                  <span>Meta Access Token (System User / Permanent Token) <strong className="text-rose-400">*</strong></span>
                  <span className="text-[10px] text-slate-500 font-normal">Token con permisos whatsapp_business_messaging</span>
                </label>
                <textarea
                  rows={3}
                  value={manualAccessToken}
                  onChange={(e) => {
                    const val = e.target.value;
                    userHasModifiedInputs.current = true;
                    setManualAccessToken(val);
                    sessionStorage.setItem(STORAGE_KEY_TOKEN, val);
                  }}
                  placeholder="EAAG..."
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono transition-all resize-none"
                />
              </div>
            </div>

            {/* Verified Info Card */}
            {verifiedInfo && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-3 animate-fadeIn">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="font-bold">Línea Verificada: {verifiedInfo.verifiedName}</p>
                  <p className="text-[11px] text-slate-300 font-mono">Número: {verifiedInfo.displayPhoneNumber || verifiedInfo.phoneNumberId}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={handleVerifyManualCredentials}
                disabled={verifying || !manualPhoneId.trim() || !manualAccessToken.trim()}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {verifying ? <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> : <ShieldCheck className="w-4 h-4 text-emerald-400" />}
                <span>1. Probar y Verificar Credenciales</span>
              </button>

              <button
                type="button"
                onClick={handleSaveManualConnection}
                disabled={connecting || !manualPhoneId.trim() || !manualAccessToken.trim()}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 stroke-[3]" />}
                <span>2. Guardar y Activar WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Meta Embedded Signup (1 Clic) */}
      {activeTab === 'embedded' && (
        <div className={`p-8 rounded-3xl bg-slate-900/90 border border-white/10 text-center space-y-6 shadow-xl ${isFreePlanBlocked ? 'opacity-50 pointer-events-none filter blur-[1px]' : ''}`}>
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20 shadow-xl">
            <Globe className="w-8 h-8" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-base font-black text-white">
              Conexión Automática con Meta Login
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Inicia sesión con tu cuenta de Facebook/Meta para vincular tu WhatsApp Business oficial en un solo clic, sin copiar IDs manualmente.
            </p>
          </div>

          <div>
            <button
              onClick={handleLaunchEmbeddedSignup}
              disabled={connecting}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-xl shadow-blue-500/20 transition-all flex items-center gap-2.5 mx-auto cursor-pointer disabled:opacity-50"
            >
              {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4 fill-white" />}
              <span>Conectar con Meta Login</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-500">
            Aria utiliza la API Oficial de Meta for Developers (WhatsApp Cloud API v20.0).
          </p>
        </div>
      )}
    </div>
  );
};

export default WhatsAppSettings;

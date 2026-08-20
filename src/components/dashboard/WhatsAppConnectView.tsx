import React, { useState, useEffect, useCallback } from 'react';
import {
  QrCode,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Loader2,
  LogOut,
  Smartphone,
  ShieldCheck,
  Building2,
  Sparkles,
  Info,
  ExternalLink
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export interface WhatsAppConnectViewProps {
  onConnectionChange?: (connected: boolean) => void;
}

export const WhatsAppConnectView: React.FC<WhatsAppConnectViewProps> = ({ onConnectionChange }) => {
  const [activeTab, setActiveTab] = useState<'qr' | 'meta'>('qr');
  const [loading, setLoading] = useState<boolean>(true);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [instanceName, setInstanceName] = useState<string>('');
  const [waStatus, setWaStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [waPhone, setWaPhone] = useState<string>('5491140143729');
  const [refreshCountdown, setRefreshCountdown] = useState<number>(30);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 1. Fetch Current Status from /api/whatsapp-qr
  const checkStatus = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      let token = '';
      if (supabase) {
        const { data: sessionData } = await supabase.auth.getSession();
        token = sessionData.session?.access_token || '';
      }

      const res = await fetch('/api/whatsapp-qr', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setWaStatus(data.wa_status === 'connected' ? 'connected' : 'disconnected');
          setWaPhone(data.wa_phone || '5491140143729');
          setInstanceName(data.instanceName || '');
          if (onConnectionChange) {
            onConnectionChange(data.wa_status === 'connected');
          }
        }
      }
    } catch (err: any) {
      console.warn('⚠️ QR connection status fetch warning:', err);
    } finally {
      setLoading(false);
    }
  }, [onConnectionChange]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Auto Polling & QR Countdown Timer when modal / QR code is active
  useEffect(() => {
    let timer: NodeJS.Timeout;
    let pollInterval: NodeJS.Timeout;

    if (qrCodeData && waStatus !== 'connected') {
      timer = setInterval(() => {
        setRefreshCountdown((prev) => {
          if (prev <= 1) {
            handleCreateQrInstance();
            return 30;
          }
          return prev - 1;
        });
      }, 1000);

      pollInterval = setInterval(async () => {
        try {
          let token = '';
          if (supabase) {
            const { data: sessionData } = await supabase.auth.getSession();
            token = sessionData.session?.access_token || '';
          }

          const res = await fetch('/api/whatsapp-qr', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });

          if (res.ok) {
            const data = await res.json();
            if (data.wa_status === 'connected') {
              setWaStatus('connected');
              setWaPhone(data.wa_phone || '5491140143729');
              setQrCodeData(null);
              setSuccessMsg('¡WhatsApp conectado exitosamente por Código QR!');
              if (onConnectionChange) onConnectionChange(true);
            }
          }
        } catch {}
      }, 3000);
    }

    return () => {
      if (timer) clearInterval(timer);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [qrCodeData, waStatus, onConnectionChange]);

  // 2. Request QR Code Instance from Evolution API
  const handleCreateQrInstance = async () => {
    setConnecting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      let token = '';
      if (supabase) {
        const { data: sessionData } = await supabase.auth.getSession();
        token = sessionData.session?.access_token || '';
      }

      const res = await fetch('/api/whatsapp-qr/create-instance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'create-instance' }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setInstanceName(data.instanceName || '');
        if (data.wa_status === 'connected') {
          setWaStatus('connected');
          setSuccessMsg('¡Instancia de WhatsApp activa y verificada!');
          setQrCodeData(null);
          if (onConnectionChange) onConnectionChange(true);
        } else {
          setQrCodeData(data.qr || data.qrcode || null);
          setWaStatus('connecting');
          setRefreshCountdown(30);
        }
      } else {
        setErrorMsg(data.error || 'Error al generar el Código QR con Evolution API.');
      }
    } catch (err: any) {
      console.error('Error generating Evolution QR:', err);
      setErrorMsg(err?.message || 'Fallo de red al comunicar con el servidor de WhatsApp.');
    } finally {
      setConnecting(false);
    }
  };

  // 3. Disconnect WhatsApp Instance
  const handleDisconnect = async () => {
    if (!window.confirm('¿Deseas desconectar este número de WhatsApp de Aria Prop Bot?')) return;

    setConnecting(true);
    setErrorMsg(null);

    try {
      let token = '';
      if (supabase) {
        const { data: sessionData } = await supabase.auth.getSession();
        token = sessionData.session?.access_token || '';
      }

      const res = await fetch('/api/whatsapp-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'disconnect' }),
      });

      if (res.ok) {
        setWaStatus('disconnected');
        setQrCodeData(null);
        setSuccessMsg('WhatsApp desconectado correctamente.');
        if (onConnectionChange) onConnectionChange(false);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al desconectar WhatsApp.');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Selector: Evolution QR vs Meta Cloud API */}
      <div className="flex items-center p-1 rounded-2xl bg-slate-900 border border-white/10 max-w-md">
        <button
          onClick={() => setActiveTab('qr')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'qr'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Código QR (Baileys)</span>
        </button>

        <button
          onClick={() => setActiveTab('meta')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'meta'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Meta Cloud API</span>
        </button>
      </div>

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

      {/* TAB 1: CODE QR EVOLUTION API */}
      {activeTab === 'qr' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-white/10 space-y-6 backdrop-blur-xl shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="space-y-1">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                Vincular WhatsApp por Código QR (Sin verificación Meta)
              </h3>
              <p className="text-xs text-slate-400">
                Conecta cualquier número de teléfono escaneando un Código QR desde tu aplicación de WhatsApp.
              </p>
            </div>

            <button
              onClick={checkStatus}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-white/10 transition-all cursor-pointer disabled:opacity-50"
              title="Actualizar estado"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loading ? (
            <div className="p-8 flex flex-col items-center justify-center space-y-3 text-slate-400 text-xs">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
              <span className="font-semibold text-slate-300">Conectando con Evolution API...</span>
            </div>
          ) : waStatus === 'connected' ? (
            /* CONNECTED STATE CARD */
            <div className="p-6 rounded-2xl bg-slate-950 border border-emerald-500/40 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-300 text-sm flex items-center gap-2">
                      🟢 WhatsApp Activo en +{waPhone}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Instancia: <code className="font-mono text-emerald-400">{instanceName || 'inmo_active'}</code>
                    </p>
                  </div>
                </div>

                <button
                  disabled={connecting}
                  onClick={handleDisconnect}
                  className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 font-semibold text-xs border border-red-500/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {connecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                  <span>Desconectar Instancia</span>
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-xs text-emerald-200 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Tu bot de Aria Prop está en línea atendiendo mensajes entrantes por WhatsApp Baileys. Las consultas serán procesadas automáticamente con el catálogo de tu inmobiliaria.
                </p>
              </div>
            </div>
          ) : (
            /* DISCONNECTED ONBOARDING WITH QR CODE MODAL */
            <div className="space-y-6">
              {connecting && !qrCodeData ? (
                <div className="p-8 flex flex-col items-center justify-center space-y-3 text-slate-400 text-xs">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                  <span className="font-semibold text-slate-300">Conectando con Evolution API...</span>
                </div>
              ) : !qrCodeData ? (
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/10 rounded-2xl space-y-4 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <QrCode className="w-7 h-7" />
                  </div>
                  <div className="space-y-1 max-w-md">
                    <h4 className="font-bold text-white text-sm">Generar Código QR de Vinculación</h4>
                    <p className="text-xs text-slate-400">
                      Haz clic abajo para crear tu instancia en Evolution API y mostrar el Código QR para escanear.
                    </p>
                  </div>

                  <button
                    disabled={connecting}
                    onClick={handleCreateQrInstance}
                    className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                  >
                    {connecting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Conectando con Evolution API...</span>
                      </>
                    ) : (
                      <>
                        <QrCode className="w-4 h-4" />
                        <span>📱 Vincular WhatsApp con Código QR</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* ACTIVE QR DISPLAY MODAL */
                <div className="p-6 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-6 flex flex-col items-center text-center animate-page-fade">
                  <div className="space-y-1">
                    <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ESCANEA CON TU TELÉFONO
                    </span>
                    <h4 className="font-bold text-white text-base mt-2">Escanea el Código QR para conectar</h4>
                    <p className="text-xs text-slate-400 max-w-sm">
                      El código expira en <strong className="text-emerald-400">{refreshCountdown}s</strong> y se refrescará automáticamente.
                    </p>
                  </div>

                  {/* QR Image Display */}
                  <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-xl border-4 border-emerald-500/40">
                    <img 
                      src={qrCodeData} 
                      alt="Código QR de WhatsApp" 
                      className="w-64 h-64 object-contain" 
                    />
                  </div>

                  {/* Step-by-step Instructions */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left w-full text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-white/5 space-y-1">
                      <span className="font-bold text-emerald-400">1. Abre WhatsApp</span>
                      <p className="text-slate-400 text-[11px]">Entra a la app en tu teléfono celular.</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900 border border-white/5 space-y-1">
                      <span className="font-bold text-emerald-400">2. Dispositivos Vinculados</span>
                      <p className="text-slate-400 text-[11px]">Toca Menú (⋮) o Ajustes &gt; Dispositivos vinculados.</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900 border border-white/5 space-y-1">
                      <span className="font-bold text-emerald-400">3. Escanea el Código</span>
                      <p className="text-slate-400 text-[11px]">Apunta con la cámara de tu teléfono a la pantalla.</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setQrCodeData(null)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs border border-white/10 transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: META CLOUD API (INFO & REFERENCE) */}
      {activeTab === 'meta' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-white/10 space-y-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Meta Cloud API (Integración Oficial)</h3>
              <p className="text-xs text-slate-400">Para organizaciones que cuentan con Meta Business Manager verificado.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-white/10 text-xs text-slate-300 space-y-2">
            <p className="leading-relaxed">
              La integración por Meta Cloud API permite operar a gran escala mediante la API oficial de WhatsApp Cloud. Si prefieres una activación rápida sin trámites comerciales, utiliza la opción <strong className="text-emerald-400">Código QR (Baileys)</strong>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

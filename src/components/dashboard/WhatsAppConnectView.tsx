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
  Sparkles,
  Copy,
  Check,
  Hash,
  Activity,
  Server
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export interface WhatsAppConnectViewProps {
  onConnectionChange?: (connected: boolean) => void;
}

export const WhatsAppConnectView: React.FC<WhatsAppConnectViewProps> = ({ onConnectionChange }) => {
  const [activeTab, setActiveTab] = useState<'qr' | 'meta'>('qr');
  const [linkMode, setLinkMode] = useState<'qr' | 'pairing'>('qr');
  const [loading, setLoading] = useState<boolean>(true);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingPhone, setPairingPhone] = useState<string>('5491140143729');
  const [instanceName, setInstanceName] = useState<string>('');
  const [waStatus, setWaStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [waPhone, setWaPhone] = useState<string>('5491140143729');
  const [refreshCountdown, setRefreshCountdown] = useState<number>(30);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
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
          const isConn = data.wa_status === 'connected';
          setWaStatus(isConn ? 'connected' : 'disconnected');
          setWaPhone(data.wa_phone || '5491140143729');
          setInstanceName(data.instanceName || '');
          if (onConnectionChange) {
            onConnectionChange(isConn);
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

  // Active Polling every 3 seconds while connecting / code is displayed
  useEffect(() => {
    let timer: NodeJS.Timeout;
    let pollInterval: NodeJS.Timeout;

    if ((qrCodeData || pairingCode) && waStatus !== 'connected') {
      timer = setInterval(() => {
        setRefreshCountdown((prev) => {
          if (prev <= 1) {
            if (linkMode === 'qr') {
              handleCreateQrInstance();
            } else if (linkMode === 'pairing') {
              handleCreatePairingCode();
            }
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
              setWaPhone(data.wa_phone || pairingPhone);
              setQrCodeData(null);
              setPairingCode(null);
              setSuccessMsg('¡WhatsApp conectado y vinculado exitosamente!');
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
  }, [qrCodeData, pairingCode, waStatus, linkMode, pairingPhone, onConnectionChange]);

  // 2. Generate QR Code Instance
  const handleCreateQrInstance = async () => {
    setConnecting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setPairingCode(null);

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
          setSuccessMsg('¡Instancia de WhatsApp activa!');
          setQrCodeData(null);
          if (onConnectionChange) onConnectionChange(true);
        } else {
          setQrCodeData(data.qr || data.qrcode || null);
          setWaStatus('connecting');
          setRefreshCountdown(30);
        }
      } else {
        setErrorMsg(data.error || 'Error al generar el Código QR.');
      }
    } catch (err: any) {
      console.error('Error generating Evolution QR:', err);
      setErrorMsg(err?.message || 'Error de comunicación con el servidor.');
    } finally {
      setConnecting(false);
    }
  };

  // 3. Generate 8-Digit Pairing Code
  const handleCreatePairingCode = async () => {
    if (!pairingPhone || pairingPhone.length < 8) {
      setErrorMsg('Ingresa un número de teléfono válido con código de país (ej. 5491140143729)');
      return;
    }

    setConnecting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setQrCodeData(null);

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
        body: JSON.stringify({
          action: 'pairing-code',
          phoneNumber: pairingPhone,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.pairingCode) {
        setInstanceName(data.instanceName || '');
        setPairingCode(data.pairingCode);
        setWaStatus('connecting');
        setRefreshCountdown(60);
      } else if (res.ok && data.success && (data.qr || data.qrcode)) {
        setInstanceName(data.instanceName || '');
        setQrCodeData(data.qr || data.qrcode);
        setLinkMode('qr');
        setWaStatus('connecting');
        setRefreshCountdown(30);
      } else {
        setErrorMsg(data.error || 'No se pudo generar el código de vinculación.');
      }
    } catch (err: any) {
      console.error('Error generating Evolution Pairing Code:', err);
      setErrorMsg(err?.message || 'Error de comunicación al solicitar Pairing Code.');
    } finally {
      setConnecting(false);
    }
  };

  // 4. Logout / Disconnect WhatsApp Instance
  const handleLogoutInstance = async () => {
    if (!window.confirm('¿Deseas desvincular y cerrar la sesión de WhatsApp de Aria Prop Bot?')) return;

    setConnecting(true);
    setErrorMsg(null);

    try {
      let token = '';
      if (supabase) {
        const { data: sessionData } = await supabase.auth.getSession();
        token = sessionData.session?.access_token || '';
      }

      const res = await fetch('/api/whatsapp-qr/logout-instance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'logout' }),
      });

      if (res.ok) {
        setWaStatus('disconnected');
        setQrCodeData(null);
        setPairingCode(null);
        setSuccessMsg('Cuenta de WhatsApp desvinculada y cerrada.');
        if (onConnectionChange) onConnectionChange(false);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al desvincular la cuenta.');
    } finally {
      setConnecting(false);
    }
  };

  const copyPairingCodeToClipboard = () => {
    if (pairingCode) {
      navigator.clipboard.writeText(pairingCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  // Helper to format 8-digit code (e.g., ABCD-1234)
  const formatPairingCodeDisplay = (code: string) => {
    const clean = code.replace(/[^A-Za-z0-9]/g, '');
    if (clean.length === 8) {
      return `${clean.slice(0, 4)} - ${clean.slice(4)}`;
    }
    return code;
  };

  return (
    <div className="space-y-6">
      {/* Primary Tab Selector: Evolution QR (Baileys) vs Meta Cloud API */}
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
          <span>Código QR / Pairing Code</span>
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

      {/* TAB 1: EVOLUTION API (QR CODE & PAIRING CODE) */}
      {activeTab === 'qr' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-white/10 space-y-6 backdrop-blur-xl shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="space-y-1">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                Vincular WhatsApp (Sin verificación de Meta)
              </h3>
              <p className="text-xs text-slate-400">
                Conecta la línea telefónica de tu inmobiliaria vía Código QR o Código de 8 Dígitos.
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
            /* CONNECTED STATE DASHBOARD & METRICS */
            <div className="p-6 rounded-2xl bg-slate-950 border border-emerald-500/40 space-y-6 animate-page-fade">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-300 text-base flex items-center gap-2">
                      🟢 WhatsApp Activo en el número: +{waPhone}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Instancia activa: <code className="font-mono text-emerald-400">{instanceName || 'inmo_active'}</code>
                    </p>
                  </div>
                </div>

                <button
                  disabled={connecting}
                  onClick={handleLogoutInstance}
                  className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 font-bold text-xs border border-red-500/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                  <span>🔴 Desvincular Cuenta de WhatsApp</span>
                </button>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-900 border border-white/5 space-y-1">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Server className="w-4 h-4 text-emerald-400" />
                    <span>Instancia Servidor</span>
                  </div>
                  <p className="font-bold text-white text-sm font-mono truncate">{instanceName || 'Evolution-Railway'}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-white/5 space-y-1">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>Estado Comercial</span>
                  </div>
                  <p className="font-bold text-emerald-300 text-sm">Aria AI Bot (Activo 24/7)</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-white/5 space-y-1">
                  <div className="flex items-center gap-2 text-slate-400">
                    <RefreshCw className="w-4 h-4 text-emerald-400" />
                    <span>Última Sincronización</span>
                  </div>
                  <p className="font-bold text-white text-sm">Hoy - En línea</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-xs text-emerald-200 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Tu bot comercial de Aria Prop está atendiendo mensajes entrantes por WhatsApp Baileys. Los prospectos se calificarán y registrarán automáticamente en tu CRM de Supabase.
                </p>
              </div>
            </div>
          ) : (
            /* DISCONNECTED: DUAL LINKING MODES (QR vs PAIRING CODE) */
            <div className="space-y-6">
              {/* Dual Mode Switcher */}
              <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-950 border border-white/10 max-w-sm">
                <button
                  onClick={() => {
                    setLinkMode('qr');
                    setPairingCode(null);
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    linkMode === 'qr'
                      ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>📷 Escanear Código QR</span>
                </button>

                <button
                  onClick={() => {
                    setLinkMode('pairing');
                    setQrCodeData(null);
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    linkMode === 'pairing'
                      ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Hash className="w-3.5 h-3.5" />
                  <span>🔢 Código de 8 Dígitos</span>
                </button>
              </div>

              {/* MODE A: QR CODE LINKING */}
              {linkMode === 'qr' && (
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
                        <h4 className="font-bold text-white text-sm">Vincular con Código QR</h4>
                        <p className="text-xs text-slate-400">
                          Haz clic para solicitar tu Código QR en vivo desde Evolution API y escanearlo con la app de WhatsApp.
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
                            <span>📷 Generar y Mostrar Código QR</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    /* ACTIVE QR DISPLAY */
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

                      <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-xl border-4 border-emerald-500/40">
                        <img 
                          src={qrCodeData} 
                          alt="Código QR de WhatsApp" 
                          className="w-64 h-64 object-contain" 
                        />
                      </div>

                      {/* Instructions */}
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
                          <span className="font-bold text-emerald-400">3. Escanea la Pantalla</span>
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

              {/* MODE B: 8-DIGIT PAIRING CODE LINKING */}
              {linkMode === 'pairing' && (
                <div className="space-y-6">
                  {!pairingCode ? (
                    <div className="p-6 rounded-2xl bg-slate-950 border border-white/10 space-y-4 max-w-md">
                      <div className="space-y-1">
                        <h4 className="font-bold text-white text-sm flex items-center gap-2">
                          <Hash className="w-4 h-4 text-emerald-400" />
                          Vincular con Código de 8 Dígitos (Pairing Code)
                        </h4>
                        <p className="text-xs text-slate-400">
                          Ingresa tu número de WhatsApp con código de país (ej. 5491140143729 sin espacios ni símbolos +).
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-300">Número de Teléfono a Vincular</label>
                        <input
                          type="text"
                          value={pairingPhone}
                          onChange={(e) => setPairingPhone(e.target.value)}
                          placeholder="5491140143729"
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <button
                        disabled={connecting}
                        onClick={handleCreatePairingCode}
                        className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                      >
                        {connecting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Solicitando Código de 8 Dígitos...</span>
                          </>
                        ) : (
                          <>
                            <Hash className="w-4 h-4" />
                            <span>Generar Código de 8 Dígitos</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    /* DISPLAY 8-DIGIT PAIRING CODE */
                    <div className="p-6 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-6 flex flex-col items-center text-center animate-page-fade">
                      <div className="space-y-1">
                        <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          CÓDIGO DE EMPAREJAMIENTO OBTENIDO
                        </span>
                        <h4 className="font-bold text-white text-base mt-2">Escribe este código en tu WhatsApp</h4>
                        <p className="text-xs text-slate-400 max-w-sm">
                          El código expira en <strong className="text-emerald-400">{refreshCountdown}s</strong>.
                        </p>
                      </div>

                      {/* Code Display */}
                      <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/50 flex items-center gap-4">
                        <span className="text-3xl font-extrabold text-emerald-400 font-mono tracking-widest">
                          {formatPairingCodeDisplay(pairingCode)}
                        </span>
                        <button
                          onClick={copyPairingCodeToClipboard}
                          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs border border-emerald-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
                          title="Copiar código"
                        >
                          {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          <span>{copiedCode ? '¡Copiado!' : 'Copiar'}</span>
                        </button>
                      </div>

                      {/* Instructions */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left w-full text-xs">
                        <div className="p-3.5 rounded-xl bg-slate-900 border border-white/5 space-y-1">
                          <span className="font-bold text-emerald-400">1. Abre WhatsApp</span>
                          <p className="text-slate-400 text-[11px]">En tu celular con el número +{pairingPhone}.</p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-900 border border-white/5 space-y-1">
                          <span className="font-bold text-emerald-400">2. Vincular con Teléfono</span>
                          <p className="text-slate-400 text-[11px]">Dispositivos vinculados &gt; Vincular con número de teléfono.</p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-900 border border-white/5 space-y-1">
                          <span className="font-bold text-emerald-400">3. Escribe el Código</span>
                          <p className="text-slate-400 text-[11px]">Ingresa los 8 dígitos que se muestran en pantalla.</p>
                        </div>
                      </div>

                      <button
                        onClick={() => setPairingCode(null)}
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
              La integración por Meta Cloud API permite operar a gran escala mediante la API oficial de WhatsApp Cloud. Si prefieres una activación rápida sin trámites comerciales, utiliza la opción <strong className="text-emerald-400">Código QR / Pairing Code</strong>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

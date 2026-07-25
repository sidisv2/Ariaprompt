import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Link2, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Key, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles, 
  Trash2, 
  Database,
  ArrowRight,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { validateTokkoApiKey, validateEasyBrokerApiKey } from '../../lib/crmClients';

interface CrmIntegrationState {
  provider: 'tokko' | 'easybroker';
  status: 'connected' | 'not_connected' | 'error' | 'syncing';
  apiKey?: string;
  lastSyncAt?: string;
  lastError?: string;
  syncedCount?: number;
}

const getAgencyId = (userId?: string | null): string => {
  if (userId && userId !== 'demo-agency') {
    localStorage.setItem('aria_agency_id', userId);
    return userId;
  }
  let stored = localStorage.getItem('aria_agency_id');
  if (!stored || stored === 'demo-agency') {
    stored = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    localStorage.setItem('aria_agency_id', stored);
  }
  return stored;
};

export const CrmIntegrationsView: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();

  const [loadingIntegrations, setLoadingIntegrations] = useState(true);
  const [integrations, setIntegrations] = useState<Record<string, CrmIntegrationState>>({
    tokko: { provider: 'tokko', status: 'not_connected', syncedCount: 0 },
    easybroker: { provider: 'easybroker', status: 'not_connected', syncedCount: 0 },
  });

  const [selectedModalProvider, setSelectedModalProvider] = useState<'tokko' | 'easybroker' | null>(null);
  const [inputApiKey, setInputApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationSuccess, setValidationSuccess] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);

  // Fetch initial integrations ONLY after auth session is fully loaded
  useEffect(() => {
    if (authLoading) return;
    fetchIntegrations();
  }, [user, authLoading]);

  const fetchIntegrations = async () => {
    setLoadingIntegrations(true);
    const agencyId = user?.id || 'demo-agency';
    try {
      const res = await fetch(`/api/crm-credentials?agency_id=${agencyId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const map: Record<string, CrmIntegrationState> = {
            tokko: { provider: 'tokko', status: 'not_connected', syncedCount: 0 },
            easybroker: { provider: 'easybroker', status: 'not_connected', syncedCount: 0 },
          };
          json.data.forEach((item: any) => {
            if (map[item.provider]) {
              map[item.provider] = {
                provider: item.provider,
                status: item.status || 'connected',
                lastSyncAt: item.last_sync_at,
                lastError: item.last_error,
                syncedCount: item.synced_count ?? 0,
              };
            }
          });
          setIntegrations(map);
          setLoadingIntegrations(false);
          return;
        }
      }
    } catch (err) {
      console.warn('CRM credentials fetch fallback:', err);
    }

    // Fallback strictly scoped to agencyId (Multi-Tenant Isolated)
    const savedTokko = localStorage.getItem(`crm_tokko_${agencyId}`);
    const savedEasy = localStorage.getItem(`crm_easybroker_${agencyId}`);

    setIntegrations({
      tokko: savedTokko ? JSON.parse(savedTokko) : { provider: 'tokko', status: 'not_connected', syncedCount: 0 },
      easybroker: savedEasy ? JSON.parse(savedEasy) : { provider: 'easybroker', status: 'not_connected', syncedCount: 0 },
    });
    setLoadingIntegrations(false);
  };

  const handleOpenConnectModal = (provider: 'tokko' | 'easybroker') => {
    setSelectedModalProvider(provider);
    setInputApiKey('');
    setValidationError(null);
    setValidationSuccess(null);
  };

  const handleValidateAndConnect = async () => {
    if (!selectedModalProvider || !inputApiKey.trim()) return;

    setIsValidating(true);
    setValidationError(null);
    setValidationSuccess(null);

    const agencyId = getAgencyId(user?.id);

    try {
      // Send validation directly to Vercel Serverless Function (runs server-to-server, avoiding CORS restrictions)
      const res = await fetch('/api/crm-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agency_id: agencyId,
          provider: selectedModalProvider,
          apiKey: inputApiKey.trim(),
        }),
      });

      const rawText = await res.text();
      let json: any = {};
      try {
        json = JSON.parse(rawText);
      } catch (parseErr) {
        console.error('Non-JSON server response:', rawText);
        setValidationError('Respuesta no estructurada del servidor. Por favor intenta nuevamente.');
        setIsValidating(false);
        return;
      }

      if (!res.ok || !json.success) {
        const errorMsg = json.error || json.message || `API Key de ${selectedModalProvider === 'tokko' ? 'Tokko Broker' : 'EasyBroker'} inválida o no autorizada.`;
        setValidationError(errorMsg);
        setIsValidating(false);
        return;
      }

      const updatedState: CrmIntegrationState = {
        provider: selectedModalProvider,
        status: 'connected',
        apiKey: inputApiKey.trim(),
        lastSyncAt: new Date().toISOString(),
        syncedCount: json.data?.synced_count ?? json.totalCount ?? 0,
      };

      // Save strictly scoped by agencyId for multi-tenant isolation
      localStorage.setItem(`crm_${selectedModalProvider}_${agencyId}`, JSON.stringify(updatedState));
      localStorage.setItem('aria_has_connected_crm', 'true');

      setIntegrations((prev) => ({
        ...prev,
        [selectedModalProvider]: updatedState,
      }));

      setValidationSuccess(json.message || `Conexión a ${selectedModalProvider === 'tokko' ? 'Tokko Broker' : 'EasyBroker'} exitosa.`);

      // Trigger initial sync in background
      fetch('/api/crm-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agency_id: agencyId, provider: selectedModalProvider }),
      }).catch((err) => console.warn('Background sync trigger:', err));

      setTimeout(() => {
        setSelectedModalProvider(null);
        setIsValidating(false);
      }, 1500);

    } catch (err: any) {
      setValidationError(`Error al conectar con el servidor de Aria Prop: ${err?.message || 'Error de red'}`);
      setIsValidating(false);
    }
  };

  const handleManualSync = async (provider: 'tokko' | 'easybroker') => {
    setIsSyncing(provider);
    const agencyId = getAgencyId(user?.id);

    try {
      const res = await fetch('/api/crm-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agency_id: agencyId, provider }),
      });

      const json = await res.json();
      const realCount = json.totalSynced ?? 0;
      
      const updatedState: CrmIntegrationState = {
        ...integrations[provider],
        status: json.success ? 'connected' : 'error',
        lastSyncAt: new Date().toISOString(),
        lastError: json.success ? undefined : json.error,
        syncedCount: realCount,
      };

      localStorage.setItem(`crm_${provider}_${agencyId}`, JSON.stringify(updatedState));
      setIntegrations((prev) => ({ ...prev, [provider]: updatedState }));
    } catch (err: any) {
      console.error(`Sync error for ${provider}:`, err);
    } finally {
      setIsSyncing(null);
    }
  };

  const handleDisconnect = async (provider: 'tokko' | 'easybroker') => {
    const agencyId = getAgencyId(user?.id);
    if (!confirm(`¿Desvincular la cuenta de ${provider === 'tokko' ? 'Tokko Broker' : 'EasyBroker'}?`)) return;

    try {
      await fetch('/api/crm-credentials', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agency_id: agencyId, provider }),
      });
    } catch (err) {
      console.warn('Disconnect error:', err);
    }

    localStorage.removeItem(`crm_${provider}_${agencyId}`);
    setIntegrations((prev) => ({
      ...prev,
      [provider]: { provider, status: 'not_connected', syncedCount: 0 },
    }));
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 animate-page-fade">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-2">
            <Link2 className="w-3.5 h-3.5" />
            <span>Sincronización Automática RAG</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Integraciones con CRMs Inmobiliarios
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Conecta tu cuenta de <strong>Tokko Broker</strong> o <strong>EasyBroker</strong> para importar automáticamente tus propiedades reales al Asistente IA 24/7 sin carga manual.
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 flex items-start gap-3 text-xs text-slate-300">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-emerald-400 font-bold block mb-0.5">Transparencia de Fuente de Datos Multi-Tenant</strong>
          Las propiedades importadas desde tu CRM quedan etiquetadas como <em>"Sincronizado desde Tokko Broker"</em> o <em>"Sincronizado desde EasyBroker"</em> en las respuestas de la IA, aisladas de forma segura bajo el RLS de tu agencia.
        </div>
      </div>

      {/* CRM Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Tokko Broker Card */}
        <div className="rounded-3xl bg-slate-900 border border-white/10 p-6 flex flex-col justify-between space-y-6 shadow-xl relative overflow-hidden">
          <div className="space-y-4">
            
            {/* Card Top Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 font-black text-lg">
                  TB
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">Tokko Broker</h3>
                  <p className="text-[11px] text-slate-400">CRM Inmobiliario líder en Argentina, Chile & LATAM</p>
                </div>
              </div>

              {/* Status Badge */}
              {(authLoading || loadingIntegrations) ? (
                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs font-bold flex items-center gap-1.5 animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                  <span>Cargando...</span>
                </span>
              ) : integrations.tokko.status === 'connected' ? (
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Conectado</span>
                </span>
              ) : integrations.tokko.status === 'error' ? (
                <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Error</span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 border border-white/10 text-xs font-bold flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>No conectado</span>
                </span>
              )}
            </div>

            {/* Sync Meta Info */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/5 space-y-2 text-xs text-slate-300">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Inmuebles Sincronizados:</span>
                <span className="font-bold text-white font-mono">{integrations.tokko.syncedCount || 0} propiedades</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Última Sincronización:</span>
                <span className="font-semibold text-slate-300">
                  {integrations.tokko.lastSyncAt 
                    ? new Date(integrations.tokko.lastSyncAt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })
                    : 'Nunca'}
                </span>
              </div>
              {integrations.tokko.lastError && (
                <p className="text-[11px] text-rose-400 pt-1 border-t border-white/5">
                  ⚠️ {integrations.tokko.lastError}
                </p>
              )}
            </div>

            <p className="text-xs text-slate-400">
              Conexión directa vía API Key. Sincroniza fichas técnicas, precios, fotos y descripciones detalladas de Tokko.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            {integrations.tokko.status === 'connected' ? (
              <>
                <button
                  onClick={() => handleManualSync('tokko')}
                  disabled={isSyncing === 'tokko'}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing === 'tokko' ? 'animate-spin' : ''}`} />
                  <span>{isSyncing === 'tokko' ? 'Sincronizando...' : 'Sincronizar Ahora'}</span>
                </button>
                <button
                  onClick={() => handleDisconnect('tokko')}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-white/10 transition-colors cursor-pointer"
                  title="Desvincular Tokko Broker"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => handleOpenConnectModal('tokko')}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-extrabold text-xs shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Key className="w-4 h-4" />
                <span>Conectar Tokko Broker (API Key)</span>
              </button>
            )}
          </div>
        </div>

        {/* EasyBroker Card */}
        <div className="rounded-3xl bg-slate-900 border border-white/10 p-6 flex flex-col justify-between space-y-6 shadow-xl relative overflow-hidden">
          <div className="space-y-4">
            
            {/* Card Top Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-black text-lg">
                  EB
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">EasyBroker</h3>
                  <p className="text-[11px] text-slate-400">CRM Inmobiliario líder en México & Latinoamérica</p>
                </div>
              </div>

              {/* Status Badge */}
              {(authLoading || loadingIntegrations) ? (
                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs font-bold flex items-center gap-1.5 animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                  <span>Cargando...</span>
                </span>
              ) : integrations.easybroker.status === 'connected' ? (
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Conectado</span>
                </span>
              ) : integrations.easybroker.status === 'error' ? (
                <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Error</span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 border border-white/10 text-xs font-bold flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>No conectado</span>
                </span>
              )}
            </div>

            {/* Sync Meta Info */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/5 space-y-2 text-xs text-slate-300">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Inmuebles Sincronizados:</span>
                <span className="font-bold text-white font-mono">{integrations.easybroker.syncedCount || 0} propiedades</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Última Sincronización:</span>
                <span className="font-semibold text-slate-300">
                  {integrations.easybroker.lastSyncAt 
                    ? new Date(integrations.easybroker.lastSyncAt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })
                    : 'Nunca'}
                </span>
              </div>
              {integrations.easybroker.lastError && (
                <p className="text-[11px] text-rose-400 pt-1 border-t border-white/5">
                  ⚠️ {integrations.easybroker.lastError}
                </p>
              )}
            </div>

            <p className="text-xs text-slate-400">
              Conexión directa vía Header `X-Authorization`. Sincronización automática de inventario público y privado.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            {integrations.easybroker.status === 'connected' ? (
              <>
                <button
                  onClick={() => handleManualSync('easybroker')}
                  disabled={isSyncing === 'easybroker'}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing === 'easybroker' ? 'animate-spin' : ''}`} />
                  <span>{isSyncing === 'easybroker' ? 'Sincronizando...' : 'Sincronizar Ahora'}</span>
                </button>
                <button
                  onClick={() => handleDisconnect('easybroker')}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-white/10 transition-colors cursor-pointer"
                  title="Desvincular EasyBroker"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => handleOpenConnectModal('easybroker')}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Key className="w-4 h-4" />
                <span>Conectar EasyBroker (API Key)</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Modal Conexión API Key */}
      {selectedModalProvider && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl animate-scale-up">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-white text-base">
                  Conectar {selectedModalProvider === 'tokko' ? 'Tokko Broker' : 'EasyBroker'}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedModalProvider(null)}
                className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕ Cerrar
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedModalProvider === 'tokko' ? (
                  <>
                    Ingresa tu <strong>API Key</strong> de Tokko Broker. Puedes encontrarla en tu panel Tokko en <em>Ajustes -&gt; API / Integraciones</em>.
                  </>
                ) : (
                  <>
                    Ingresa tu <strong>API Key</strong> de EasyBroker. Puedes generarla en tu panel EasyBroker en <em>Configuración -&gt; Claves de API</em>.
                  </>
                )}
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Clave de API ({selectedModalProvider === 'tokko' ? 'Tokko API Key' : 'X-Authorization Key'}):
                </label>
                <input
                  type="password"
                  value={inputApiKey}
                  onChange={(e) => setInputApiKey(e.target.value)}
                  placeholder={selectedModalProvider === 'tokko' ? 'ej. 849a0f...tokko_key' : 'ej. eb_key_9f80...'}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-4 py-3 text-white font-mono text-xs focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>

              {/* Feedback messages */}
              {validationError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{validationError}</span>
                </div>
              )}

              {validationSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                  <span>{validationSuccess}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setSelectedModalProvider(null)}
                className="w-1/3 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleValidateAndConnect}
                disabled={isValidating || !inputApiKey.trim()}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isValidating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Validando API Key...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Validar y Conectar</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

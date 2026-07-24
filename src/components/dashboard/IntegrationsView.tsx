import React, { useState, useEffect } from 'react';
import {
  Building2,
  Key,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Link2,
  ExternalLink,
  ShieldCheck,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
  MapPin,
} from 'lucide-react';
import {
  CrmConnection,
  PartnerProperty,
  getSavedCrmConnections,
  saveCrmConnections,
  getSyncedPartnerProperties,
  saveSyncedPartnerProperties,
  syncTokkoBrokerProperties,
  syncEasyBrokerProperties,
} from '../../services/crmIntegrationService';

export const IntegrationsView: React.FC = () => {
  const [connections, setConnections] = useState<CrmConnection[]>([]);
  const [syncedProperties, setSyncedProperties] = useState<PartnerProperty[]>([]);
  
  // Form State
  const [agencyName, setAgencyName] = useState<string>('Inmobiliaria Valenzuela & Asoc.');
  const [crmType, setCrmType] = useState<'tokko' | 'easybroker'>('tokko');
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  
  // Feedback Banners
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setConnections(getSavedCrmConnections());
    setSyncedProperties(getSyncedPartnerProperties());
  }, []);

  const handleConnectAndSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!agencyName.trim()) {
      setErrorMsg('Por favor ingresa el nombre de la Inmobiliaria Partner.');
      return;
    }

    if (!apiKey.trim()) {
      setErrorMsg(`Por favor ingresa la API Key oficial de ${crmType === 'tokko' ? 'Tokko Broker' : 'EasyBroker'}.`);
      return;
    }

    setIsSyncing(true);

    try {
      let result: { connection: CrmConnection; properties: PartnerProperty[] };

      if (crmType === 'tokko') {
        result = await syncTokkoBrokerProperties(agencyName.trim(), apiKey.trim());
      } else {
        result = await syncEasyBrokerProperties(agencyName.trim(), apiKey.trim());
      }

      // Save new connection and append properties to isolated Partner Store
      const updatedConnections = [
        result.connection,
        ...connections.filter((c) => c.crmType !== result.connection.crmType || c.agencyName !== result.connection.agencyName),
      ];
      saveCrmConnections(updatedConnections);
      setConnections(updatedConnections);

      const updatedProperties = [
        ...result.properties,
        ...syncedProperties.filter((p) => p.partnerAgencyId !== result.connection.id),
      ];
      saveSyncedPartnerProperties(updatedProperties);
      setSyncedProperties(updatedProperties);

      setSuccessMsg(
        `¡Conexión Exitosa con ${crmType === 'tokko' ? 'Tokko Broker' : 'EasyBroker'}! Se sincronizaron ${result.properties.length} propiedades de "${agencyName}".`
      );
      setApiKey('');
    } catch (err: any) {
      console.error('Error connecting CRM:', err);
      setErrorMsg(err.message || 'Error de autenticación con la API Key del CRM. Por favor verifica los permisos.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleForceResync = async (conn: CrmConnection) => {
    setSuccessMsg(null);
    setErrorMsg(null);
    setIsSyncing(true);

    try {
      let result: { connection: CrmConnection; properties: PartnerProperty[] };
      if (conn.crmType === 'tokko') {
        result = await syncTokkoBrokerProperties(conn.agencyName, conn.apiKey);
      } else {
        result = await syncEasyBrokerProperties(conn.agencyName, conn.apiKey);
      }

      const updatedConnections = connections.map((c) => (c.id === conn.id ? result.connection : c));
      saveCrmConnections(updatedConnections);
      setConnections(updatedConnections);

      const updatedProperties = [
        ...result.properties,
        ...syncedProperties.filter((p) => p.partnerAgencyId !== conn.id),
      ];
      saveSyncedPartnerProperties(updatedProperties);
      setSyncedProperties(updatedProperties);

      setSuccessMsg(`Sincronización re-ejecutada con éxito para "${conn.agencyName}". (${result.properties.length} propiedades actualizadas).`);
    } catch (err: any) {
      console.error('Error re-syncing:', err);
      setErrorMsg(`Error al sincronizar "${conn.agencyName}": ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteConnection = (connId: string) => {
    const connToDelete = connections.find((c) => c.id === connId);
    const updatedConns = connections.filter((c) => c.id !== connId);
    saveCrmConnections(updatedConns);
    setConnections(updatedConns);

    const updatedProps = syncedProperties.filter((p) => p.partnerAgencyId !== connId);
    saveSyncedPartnerProperties(updatedProps);
    setSyncedProperties(updatedProps);

    setSuccessMsg(`Conexión eliminada correctamente.`);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-page-fade">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
            <Link2 className="w-3.5 h-3.5" />
            Fase 2 — Red de Inmobiliarias Partners Conectadas
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Conexión de CRM Partners <span className="text-slate-400 text-lg font-normal">(Tokko Broker & EasyBroker)</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-3xl">
            Sincroniza en tiempo real el inventario de las inmobiliarias partners mediante su API Key oficial. Los inmuebles se almacenan de forma aislada y son consultados por Aria Promp en el chat comparador.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-white/10 p-3 rounded-xl">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <p className="text-white font-bold">{syncedProperties.length} Propiedades Partner</p>
            <p className="text-slate-400">Sincronizadas en la red</p>
          </div>
        </div>
      </div>

      {/* Banners Feedback */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form Card & Active Connections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form to Connect CRM */}
        <div className="lg:col-span-1 bg-slate-900/80 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-400" />
            Conectar Nueva Inmobiliaria
          </h2>

          <form onSubmit={handleConnectAndSync} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nombre de la Inmobiliaria Partner:
              </label>
              <input
                type="text"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder="ej: Inmobiliaria Valenzuela & Asoc."
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Seleccionar CRM Inmobiliario:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCrmType('tokko')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center gap-1 ${
                    crmType === 'tokko'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                      : 'bg-slate-950 border-white/10 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <span className="text-sm">Tokko Broker</span>
                  <span className="text-[10px] text-slate-400 font-normal">API Key REST</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCrmType('easybroker')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center gap-1 ${
                    crmType === 'easybroker'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                      : 'bg-slate-950 border-white/10 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <span className="text-sm">EasyBroker</span>
                  <span className="text-[10px] text-slate-400 font-normal">X-Authorization</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                API Key Oficial del CRM:
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={crmType === 'tokko' ? 'ej: key_77821_tokko...' : 'ej: eb_key_99412...'}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                * Puedes escribir <code className="text-emerald-400">demo</code> para probar una sincronización simulada en vivo.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSyncing}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-extrabold text-sm shadow-lg hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sincronizando Inventario...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Probar Conexión & Sincronizar</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Connected Partners Cards List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Link2 className="w-5 h-5 text-emerald-400" />
            Inmobiliarias Partners Integradas ({connections.length})
          </h2>

          {connections.length === 0 ? (
            <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-8 text-center text-slate-400">
              No hay inmobiliarias partners conectadas aún. Utiliza el formulario para vincular la primera cuenta.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {connections.map((conn) => (
                <div
                  key={conn.id}
                  className="bg-slate-900 border border-white/10 rounded-2xl p-5 hover:border-emerald-500/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {conn.crmType === 'tokko' ? 'Tokko Broker API' : 'EasyBroker API'}
                        </span>
                        <h3 className="text-base font-bold text-white mt-1.5">{conn.agencyName}</h3>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10">
                        <CheckCircle2 className="w-3 h-3" />
                        Conectado
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-400">
                      <p>
                        <strong>Propiedades activas:</strong>{' '}
                        <span className="text-white font-bold">{conn.syncedPropertiesCount}</span>
                      </p>
                      <p>
                        <strong>Última sincronización:</strong>{' '}
                        {conn.lastSyncedAt
                          ? new Date(conn.lastSyncedAt).toLocaleTimeString('es-AR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Nunca'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/5 mt-4">
                    <button
                      onClick={() => handleForceResync(conn)}
                      disabled={isSyncing}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
                      title="Forzar re-sincronización del catálogo"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Re-sincronizar
                    </button>
                    <button
                      onClick={() => handleDeleteConnection(conn.id)}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1.5"
                      title="Eliminar conexión"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Synced Properties Table / Cards */}
      <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-400" />
              Inventario de Inmobiliarias Partners Sincronizado ({syncedProperties.length})
            </h2>
            <p className="text-xs text-slate-400">
              Propiedades almacenadas en la colección separada de partners, disponibles para el motor comparador.
            </p>
          </div>
        </div>

        {syncedProperties.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-6">No hay propiedades de partners sincronizadas.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {syncedProperties.map((p) => (
              <div
                key={p.id}
                className="bg-slate-950 border border-white/10 rounded-xl overflow-hidden hover:border-emerald-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-40 overflow-hidden bg-slate-900">
                    <img
                      src={p.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2'}
                      alt={p.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                      {p.crmSource === 'tokko' ? 'Tokko Broker' : 'EasyBroker'}
                    </div>
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-emerald-600 text-slate-950 text-[10px] font-extrabold">
                      ${p.price.toLocaleString('en-US')} USD {p.price < 5000 ? '/mes' : ''}
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      {p.partnerAgencyName}
                    </span>
                    <h3 className="text-sm font-bold text-white line-clamp-1">{p.title}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{p.location.address}, {p.location.city}</span>
                    </p>
                  </div>
                </div>

                <div className="px-4 pb-4 pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                  <span>{p.features.bedrooms} hab | {p.features.areaM2} m²</span>
                  {p.location.googleMapsUrl && (
                    <a
                      href={p.location.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1"
                    >
                      Mapa <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

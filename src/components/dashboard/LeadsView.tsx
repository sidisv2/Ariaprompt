import React, { useState } from 'react';
import { Lead } from '../../types';
import { 
  Users, 
  Flame, 
  ThermometerSun, 
  ThermometerSnowflake, 
  Search, 
  Phone, 
  Mail, 
  MessageSquare, 
  Calendar, 
  ChevronRight, 
  X,
  Filter,
  CheckCircle2
} from 'lucide-react';

interface LeadsViewProps {
  leads: Lead[];
  onUpdateLeadStatus: (leadId: string, newStatus: Lead['status']) => void;
  selectedLeadForChat?: string;
  onClearSelectedLead?: () => void;
}

export const LeadsView: React.FC<LeadsViewProps> = ({
  leads,
  onUpdateLeadStatus,
  selectedLeadForChat,
  onClearSelectedLead,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTempFilter, setActiveTempFilter] = useState<'all' | 'hot' | 'warm' | 'cold'>('all');
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [activeLeadDrawer, setActiveLeadDrawer] = useState<Lead | null>(
    selectedLeadForChat ? leads.find((l) => l.id === selectedLeadForChat) || null : null
  );

  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.preferredZone.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTemp = activeTempFilter === 'all' || l.temperature === activeTempFilter;
    return matchesSearch && matchesTemp;
  });

  const getTemperatureBadge = (temp: Lead['temperature']) => {
    switch (temp) {
      case 'hot':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1">
            <Flame className="w-3 h-3 text-red-400" /> Hot
          </span>
        );
      case 'warm':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <ThermometerSun className="w-3 h-3 text-amber-400" /> Warm
          </span>
        );
      case 'cold':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
            <ThermometerSnowflake className="w-3 h-3 text-blue-400" /> Cold
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 p-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            CRM de Leads Cualificados por IA
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gestión de clientes en función de temperatura de compra, presupuesto e historial de conversaciones.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsLoadingLeads(true);
              setTimeout(() => setIsLoadingLeads(false), 1200);
            }}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Users className={`w-3.5 h-3.5 text-emerald-400 ${isLoadingLeads ? 'animate-spin' : ''}`} />
            <span>Refrescar CRM</span>
          </button>

          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'kanban' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400'
              }`}
            >
              Vista Kanban
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'table' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400'
              }`}
            >
              Tabla Lista
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/80 p-3 rounded-2xl border border-white/10">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar lead por nombre, email o zona..."
            className="w-full bg-slate-950 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          {(['all', 'hot', 'warm', 'cold'] as const).map((temp) => (
            <button
              key={temp}
              onClick={() => setActiveTempFilter(temp)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                activeTempFilter === temp
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white bg-slate-950/60'
              }`}
            >
              {temp === 'all' ? 'Todos los Leads' : temp}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Hot Column */}
          <div className="space-y-4 p-4 rounded-2xl bg-black/30 border border-red-500/20">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-500" />
                <h3 className="font-semibold text-sm text-white">Alta Prioridad (Hot)</h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 text-[10px] font-bold border border-red-500/20 font-mono">
                {filteredLeads.filter((l) => l.temperature === 'hot').length}
              </span>
            </div>

            <div className="space-y-3">
              {filteredLeads
                .filter((l) => l.temperature === 'hot')
                .map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => setActiveLeadDrawer(lead)}
                    className="p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-red-500/30 transition-all cursor-pointer space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white text-xs">{lead.name}</span>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">Score {lead.score}</span>
                    </div>

                    <p className="text-[11px] text-slate-300 line-clamp-2">
                      {lead.chatHistorySummary || lead.notes}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-white/5">
                      <span>{lead.budgetMin.toLocaleString('es-ES')}€ - {lead.budgetMax.toLocaleString('es-ES')}€</span>
                      <span className="text-emerald-400 font-semibold">{lead.lastInteraction}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Warm Column */}
          <div className="space-y-4 p-4 rounded-2xl bg-black/30 border border-amber-500/20">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <ThermometerSun className="w-4 h-4 text-amber-500" />
                <h3 className="font-semibold text-sm text-white">Media Prioridad (Warm)</h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20 font-mono">
                {filteredLeads.filter((l) => l.temperature === 'warm').length}
              </span>
            </div>

            <div className="space-y-3">
              {filteredLeads
                .filter((l) => l.temperature === 'warm')
                .map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => setActiveLeadDrawer(lead)}
                    className="p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-amber-500/30 transition-all cursor-pointer space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white text-xs">{lead.name}</span>
                      <span className="text-[10px] font-mono text-amber-400 font-bold">Score {lead.score}</span>
                    </div>

                    <p className="text-[11px] text-slate-300 line-clamp-2">
                      {lead.chatHistorySummary || lead.notes}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-white/5">
                      <span>{lead.budgetMin.toLocaleString('es-ES')}€ - {lead.budgetMax.toLocaleString('es-ES')}€</span>
                      <span>{lead.lastInteraction}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Cold Column */}
          <div className="space-y-4 p-4 rounded-2xl bg-black/30 border border-blue-500/20">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <ThermometerSnowflake className="w-4 h-4 text-blue-500" />
                <h3 className="font-semibold text-sm text-white">Baja Prioridad (Cold)</h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold border border-blue-500/20 font-mono">
                {filteredLeads.filter((l) => l.temperature === 'cold').length}
              </span>
            </div>

            <div className="space-y-3">
              {filteredLeads
                .filter((l) => l.temperature === 'cold')
                .map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => setActiveLeadDrawer(lead)}
                    className="p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white text-xs">{lead.name}</span>
                      <span className="text-[10px] font-mono text-slate-400 font-bold">Score {lead.score}</span>
                    </div>

                    <p className="text-[11px] text-slate-300 line-clamp-2">
                      {lead.chatHistorySummary || lead.notes}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-white/5">
                      <span>{lead.budgetMin.toLocaleString('es-ES')}€ - {lead.budgetMax.toLocaleString('es-ES')}€</span>
                      <span>{lead.lastInteraction}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

        </div>
      ) : (
        /* Table View */
        <div className="rounded-2xl bg-black/30 border border-white/5 overflow-hidden">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-white/[0.01] text-slate-500 font-bold border-b border-white/5 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-3 font-medium">Cliente / Contacto</th>
                <th className="px-6 py-3 font-medium">Temperatura</th>
                <th className="px-6 py-3 font-medium">Rango Presupuesto</th>
                <th className="px-6 py-3 font-medium">Zona Preferida</th>
                <th className="px-6 py-3 font-medium">Estado Lead</th>
                <th className="px-6 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {filteredLeads.map((l) => (
                <tr key={l.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-semibold text-white">
                    <div>{l.name}</div>
                    <div className="text-[11px] text-slate-500 font-normal">{l.email}</div>
                  </td>
                  <td className="px-6 py-4">{getTemperatureBadge(l.temperature)}</td>
                  <td className="px-6 py-4 font-mono text-white">{l.budgetMin.toLocaleString('es-ES')}€ - {l.budgetMax.toLocaleString('es-ES')}€</td>
                  <td className="px-6 py-4 text-slate-300">{l.preferredZone}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-slate-300 capitalize border border-white/5">
                      {l.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setActiveLeadDrawer(l)}
                      className="px-3 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-medium text-[11px] border border-emerald-500/20"
                    >
                      Ver Historial
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Lead Detail & Chat Log Drawer */}
      {activeLeadDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex justify-end p-2 sm:p-4">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl max-w-lg w-full p-6 space-y-6 relative overflow-y-auto shadow-2xl">
            
            <button
              onClick={() => {
                setActiveLeadDrawer(null);
                if (onClearSelectedLead) onClearSelectedLead();
              }}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Detail */}
            <div className="space-y-2 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">{activeLeadDrawer.name}</h2>
                {getTemperatureBadge(activeLeadDrawer.temperature)}
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-300">
                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-emerald-400" /> {activeLeadDrawer.email}</span>
                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-emerald-400" /> {activeLeadDrawer.phone}</span>
              </div>
            </div>

            {/* Score & Parameters */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-950 border border-white/10 text-xs">
              <div>
                <p className="text-slate-400">Score de Intención:</p>
                <p className="text-xl font-bold text-emerald-400 font-mono">{activeLeadDrawer.score}/100</p>
              </div>
              <div>
                <p className="text-slate-400">Presupuesto Máximo:</p>
                <p className="text-base font-bold text-white font-mono">{activeLeadDrawer.budgetMax.toLocaleString('es-ES')} €</p>
              </div>
            </div>

            {/* Chat History Log */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                Historial de Conversación con Asistente IA
              </h3>

              <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 text-xs space-y-3 font-sans">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-white/5 text-slate-300">
                  <strong className="text-emerald-400 block mb-1">Cliente ({activeLeadDrawer.name}):</strong>
                  "Hola, estoy interesado en comprar un chalet independiente con piscina en La Moraleja. Mi presupuesto es de unos 3.5M€."
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200">
                  <strong className="text-emerald-400 block mb-1">Sofia (IA Agent):</strong>
                  "¡Perfecto! Tenemos disponible el Chalet de Lujo MAD-MOR-01 por 3.450.000€. Cuenta con 6 dormitorios, 780m² y piscina salina. ¿Te vendría bien coordinar una visita presencial este viernes a las 11:00 AM?"
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-white/5 text-slate-300">
                  <strong className="text-emerald-400 block mb-1">Cliente ({activeLeadDrawer.name}):</strong>
                  "Sí, reservado a esa hora. Mi número de teléfono es {activeLeadDrawer.phone}."
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => {
                  onUpdateLeadStatus(activeLeadDrawer.id, 'visit_scheduled');
                  setActiveLeadDrawer(null);
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
              >
                Confirmar Visita Agendada
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

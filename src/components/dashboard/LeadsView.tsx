import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  Phone,
  MessageSquare,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  Clock,
  Sparkles,
  DollarSign,
  MapPin,
  ExternalLink,
  Loader2,
  Filter,
  UserCheck,
  Building
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { LeadChatModal, CrmLead } from './LeadChatModal';

interface LeadsViewProps {
  leads?: any[];
  onUpdateLeadStatus?: (leadId: string, newStatus: any) => void;
  onInterveneLead?: (leadId: string) => void;
  selectedLeadForChat?: string;
  onClearSelectedLead?: () => void;
}

export const LeadsView: React.FC<LeadsViewProps> = ({
  selectedLeadForChat,
  onClearSelectedLead,
}) => {
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [selectedLead, setSelectedLead] = useState<CrmLead | null>(null);

  // Metric counts
  const [metrics, setMetrics] = useState({
    total: 0,
    qualified: 0,
    active: 0,
    handover: 0,
  });

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      let token = '';
      if (supabase) {
        const { data: sessionData } = await supabase.auth.getSession();
        token = sessionData.session?.access_token || '';
      }

      const params = new URLSearchParams({
        page: String(page),
        limit: '15',
        status: statusFilter,
        search: search.trim(),
      });

      const res = await fetch(`/api/crm/leads?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setLeads(data.leads || []);
          setTotalCount(data.pagination?.total || 0);
          setTotalPages(data.pagination?.totalPages || 1);

          // Update selected lead if passed via prop
          if (selectedLeadForChat && !selectedLead) {
            const found = (data.leads || []).find((l: CrmLead) => l.id === selectedLeadForChat);
            if (found) setSelectedLead(found);
          }
        }
      } else {
        // Direct Supabase Fallback if serverless API endpoint fails
        if (supabase) {
          let query = supabase.from('crm_leads_overview').select('*', { count: 'exact' });
          if (statusFilter !== 'all') {
            query = query.eq('status', statusFilter);
          }
          if (search.trim()) {
            query = query.or(
              `user_phone.ilike.%${search}%,user_name.ilike.%${search}%,preferred_zone.ilike.%${search}%`
            );
          }

          const offset = (page - 1) * 15;
          const { data: sbLeads, count: sbCount } = await query
            .order('last_message_at', { ascending: false })
            .range(offset, offset + 14);

          setLeads((sbLeads as CrmLead[]) || []);
          setTotalCount(sbCount || 0);
          setTotalPages(Math.ceil((sbCount || 0) / 15));
        }
      }
    } catch (err) {
      console.error('❌ Error fetching CRM leads:', err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search, selectedLeadForChat, selectedLead]);

  const fetchMetrics = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data } = await supabase.from('wa_conversations').select('status');
      if (data && Array.isArray(data)) {
        const total = data.length;
        const qualified = data.filter((d) => d.status === 'qualified').length;
        const active = data.filter((d) => d.status === 'active' || !d.status).length;
        const handover = data.filter((d) => d.status === 'handover').length;
        setMetrics({ total, qualified, active, handover });
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchLeads();
    fetchMetrics();
  }, [fetchLeads, fetchMetrics]);

  const handleStatusUpdated = (leadId: string, newStatus: CrmLead['status']) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead({ ...selectedLead, status: newStatus });
    }
    fetchMetrics();
  };

  const getStatusBadge = (status: CrmLead['status']) => {
    switch (status) {
      case 'qualified':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Calificado
          </span>
        );
      case 'active':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1 w-fit">
            <Clock className="w-3 h-3 text-blue-400" /> Activo
          </span>
        );
      case 'handover':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 w-fit">
            <Sparkles className="w-3 h-3 text-amber-400" /> En Espera
          </span>
        );
      case 'closed':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30 flex items-center gap-1 w-fit">
            Cerrado
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 p-4 sm:p-6 text-slate-100">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            CRM de Leads de WhatsApp Multi-Tenant
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Visualización y cualificación en tiempo real de prospectos inmobiliarios atendidos por Aria AI.
          </p>
        </div>

        <button
          onClick={() => {
            fetchLeads();
            fetchMetrics();
          }}
          className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs border border-white/10 transition-all flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar Datos</span>
        </button>
      </div>

      {/* KPI Cards (Top Metrics) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-white/10 space-y-2 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Leads</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-white font-mono">{metrics.total}</p>
          <p className="text-[10px] text-slate-500">Registrados en la plataforma</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 space-y-2 backdrop-blur-xl shadow-lg shadow-emerald-500/5">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold">
            <span>Leads Calificados</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-400 font-mono">{metrics.qualified}</p>
          <p className="text-[10px] text-emerald-500/80">Con zona, tipo y presupuesto</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-blue-500/20 space-y-2 backdrop-blur-xl">
          <div className="flex items-center justify-between text-blue-400 text-xs font-semibold">
            <span>En Conversación</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-3xl font-extrabold text-blue-400 font-mono">{metrics.active}</p>
          <p className="text-[10px] text-slate-500">Diálogo activo con la IA</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-amber-500/20 space-y-2 backdrop-blur-xl">
          <div className="flex items-center justify-between text-amber-400 text-xs font-semibold">
            <span>En Espera de Asesor</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-extrabold text-amber-400 font-mono">{metrics.handover}</p>
          <p className="text-[10px] text-slate-500">Requieren intervención humana</p>
        </div>

      </div>

      {/* Filter and Live Search Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-3 bg-slate-900/90 rounded-2xl border border-white/10 backdrop-blur-xl">
        
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar por teléfono, nombre o zona..."
            className="w-full bg-slate-950 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'qualified', label: 'Calificados' },
            { id: 'active', label: 'Activos' },
            { id: 'handover', label: 'En Espera' },
            { id: 'closed', label: 'Cerrados' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white bg-slate-950/60 hover:bg-slate-950'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

      </div>

      {/* Leads Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-white/10 overflow-hidden shadow-xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-bold border-b border-white/10 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-4 font-semibold">Contacto (Lead)</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
                <th className="px-6 py-4 font-semibold">Presupuesto Máx</th>
                <th className="px-6 py-4 font-semibold">Zona / Inmueble</th>
                <th className="px-6 py-4 font-semibold">Último Mensaje</th>
                <th className="px-6 py-4 font-semibold">Fecha / Hora</th>
                <th className="px-6 py-4 font-semibold text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-white/10 rounded w-28"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-white/10 rounded w-16"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-white/10 rounded w-20"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-white/10 rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-white/10 rounded w-36"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-white/10 rounded w-20"></div></td>
                    <td className="px-6 py-4 text-right"><div className="h-6 bg-white/10 rounded w-24 ml-auto"></div></td>
                  </tr>
                ))
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Users className="w-8 h-8 text-slate-600" />
                      <p className="font-semibold text-slate-300">No se encontraron leads para esta consulta</p>
                      <p className="text-[11px] text-slate-500 max-w-sm">
                        Los prospectos que envíen mensajes al WhatsApp de tu inmobiliaria aparecerán aquí automáticamente.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const formattedDate = new Date(lead.last_message_at).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Contact Info */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-white text-xs">
                          {lead.user_name || `Lead ${lead.user_phone}`}
                        </div>
                        <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />
                          <span>{lead.user_phone}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">{getStatusBadge(lead.status)}</td>

                      {/* Budget */}
                      <td className="px-6 py-4 font-mono font-semibold text-white">
                        {lead.budget_max_usd
                          ? `$${Number(lead.budget_max_usd).toLocaleString('en-US')} USD`
                          : <span className="text-slate-500 text-[11px]">Sin especificar</span>}
                      </td>

                      {/* Zone & Type */}
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-200">
                          {lead.preferred_zone || 'Cualquiera'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {lead.property_type || 'Inmueble general'}
                        </div>
                      </td>

                      {/* Last Message */}
                      <td className="px-6 py-4 max-w-xs">
                        <p className="truncate text-slate-300 text-[11px]">
                          {lead.last_message || 'Sin mensajes registrados'}
                        </p>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-slate-400 font-mono text-[11px]">
                        {formattedDate}
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedLead(lead)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold text-xs border border-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5 ml-auto"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Ver Conversación</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-950 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <div>
              Mostrando <span className="font-semibold text-white">{leads.length}</span> de{' '}
              <span className="font-semibold text-white">{totalCount}</span> leads
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-30 border border-white/10 transition-all cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>

              <span className="font-mono px-2 text-slate-300">
                Página {page} de {totalPages}
              </span>

              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-30 border border-white/10 transition-all cursor-pointer flex items-center gap-1"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Chat Transcript Modal */}
      {selectedLead && (
        <LeadChatModal
          lead={selectedLead}
          onClose={() => {
            setSelectedLead(null);
            if (onClearSelectedLead) onClearSelectedLead();
          }}
          onStatusUpdated={handleStatusUpdated}
        />
      )}

    </div>
  );
};

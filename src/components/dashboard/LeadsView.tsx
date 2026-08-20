import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Users,
  Search,
  Phone,
  MessageSquare,
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
  FileText,
  Save,
  User,
  X,
  Send,
  Building,
  Check,
  Bot,
  Mic
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { exportPropertySheetToPdf, generatePropertySheetDataUri } from '../../../lib/pdf/property-sheet';
import { LiveInboxView } from '../chat/LiveInboxView';
import { LeadScoringBadge, computeLeadScore } from '../chat/LeadScoringBadge';

export interface CrmLead {
  id: string;
  organization_id?: string;
  user_phone: string;
  user_name: string | null;
  status: 'active' | 'qualified' | 'handover' | 'closed';
  budget_max_usd: number | null;
  preferred_zone: string | null;
  property_type: string | null;
  last_message: string | null;
  last_message_at: string;
  total_messages: number;
  agent_notes?: string | null;
}

export interface WaMessageItem {
  id: string;
  conversation_id: string;
  organization_id: string;
  sender_type: 'user' | 'assistant' | 'system';
  message_text: string;
  media_type?: string;
  transcription?: string;
  created_at: string;
}

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
  const [viewMode, setViewMode] = useState<'live_inbox' | 'crm'>('live_inbox');
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [selectedLead, setSelectedLead] = useState<CrmLead | null>(null);

  // Messages for selected lead
  const [messages, setMessages] = useState<WaMessageItem[]>([]);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);

  // Agent Notes state
  const [agentNotes, setAgentNotes] = useState<string>('');
  const [savingNotes, setSavingNotes] = useState<boolean>(false);
  const [notesSavedNotice, setNotesSavedNotice] = useState<boolean>(false);

  // Metric counts
  const [metrics, setMetrics] = useState({
    total: 0,
    qualified: 0,
    active: 0,
    handover: 0,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

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
        limit: '20',
        status: statusFilter,
        search: search.trim(),
      });

      const res = await fetch(`/api/crm/leads?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const list: CrmLead[] = data.leads || [];
          setLeads(list);
          setTotalCount(data.pagination?.total || 0);
          setTotalPages(data.pagination?.totalPages || 1);

          if (!selectedLead && list.length > 0) {
            setSelectedLead(list[0]);
          } else if (selectedLead) {
            const updated = list.find((l) => l.id === selectedLead.id);
            if (updated) setSelectedLead(updated);
          }
        }
      } else {
        // Fallback directly to Supabase client
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

          const offset = (page - 1) * 20;
          const { data: sbLeads, count: sbCount } = await query
            .order('last_message_at', { ascending: false })
            .range(offset, offset + 19);

          const list = (sbLeads as CrmLead[]) || [];
          setLeads(list);
          setTotalCount(sbCount || 0);
          setTotalPages(Math.ceil((sbCount || 0) / 20));

          if (!selectedLead && list.length > 0) {
            setSelectedLead(list[0]);
          }
        }
      }
    } catch (err) {
      console.error('❌ Error fetching CRM leads:', err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search, selectedLead]);

  const fetchMetrics = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data } = await supabase.from('wa_conversations').select('status');
      if (data && Array.isArray(data)) {
        const total = data.length;
        const qualified = data.filter((d) => d.status === 'qualified').length;
        const active = data.filter((d) => d.status === 'active' || !d.status).length;
        const handover = data.filter((d) => d.status === 'handover' || d.status === 'human_handoff').length;
        setMetrics({ total, qualified, active, handover });
      }
    } catch {}
  }, []);

  const fetchConversationMessages = useCallback(async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('wa_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data);
      } else {
        setMessages([]);
      }
    } catch {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
    fetchMetrics();
  }, [fetchLeads, fetchMetrics]);

  // ---------------------------------------------------------------------------
  // SUPABASE REALTIME SUBSCRIPTION (Instant incoming messages & status changes)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!supabase) return;

    const playChime = () => {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();

        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
        gain1.gain.setValueAtTime(0.12, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start();
        osc1.stop(ctx.currentTime + 0.3);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
        gain2.gain.setValueAtTime(0.12, ctx.currentTime + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(ctx.currentTime + 0.15);
        osc2.stop(ctx.currentTime + 0.45);
      } catch {}
    };

    const notifyDesktop = (title: string, body: string) => {
      playChime();
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(title, { body, icon: '/favicon.ico' });
        } catch {}
      }
    };

    const channel = supabase
      .channel('public:wa_realtime_crm')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wa_conversations' },
        (payload: any) => {
          console.log('⚡ Supabase Realtime wa_conversations event:', payload.eventType);
          fetchLeads();
          fetchMetrics();

          if (payload.new?.status === 'handover' || payload.new?.status === 'human_handoff') {
            notifyDesktop('🚨 Solicitud de Asesor Humano', `El lead ${payload.new.user_name || payload.new.user_phone} solicitó atención.`);
          } else if (payload.new?.status === 'qualified') {
            notifyDesktop('⭐ Nuevo Lead Calificado', `El prospecto ${payload.new.user_name || payload.new.user_phone} ha sido cualificado.`);
          }

          if (payload.new && selectedLead && payload.new.id === selectedLead.id) {
            setSelectedLead((prev) => (prev ? { ...prev, ...payload.new } : null));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'wa_messages' },
        (payload: any) => {
          console.log('⚡ Supabase Realtime wa_messages event:', payload);
          if (payload.new?.sender_type === 'user') {
            notifyDesktop('💬 Nuevo Mensaje de WhatsApp', payload.new.message_text || 'Nuevo mensaje recibido.');
          }
          if (payload.new && selectedLead && payload.new.conversation_id === selectedLead.id) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            });
          }
          fetchLeads();
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchLeads, fetchMetrics, selectedLead?.id]);

  useEffect(() => {
    if (selectedLead) {
      setAgentNotes(selectedLead.agent_notes || '');
      fetchConversationMessages(selectedLead.id);
    }
  }, [selectedLead?.id, fetchConversationMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleUpdateStatus = async (newStatus: CrmLead['status']) => {
    if (!selectedLead || !supabase) return;
    try {
      const { error } = await supabase
        .from('wa_conversations')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', selectedLead.id);

      if (!error) {
        setSelectedLead((prev) => (prev ? { ...prev, status: newStatus } : null));
        setLeads((prev) =>
          prev.map((l) => (l.id === selectedLead.id ? { ...l, status: newStatus } : l))
        );
        fetchMetrics();
      }
    } catch (err) {
      console.error('❌ Error updating lead status:', err);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedLead || !supabase) return;
    setSavingNotes(true);
    try {
      const { error } = await supabase
        .from('wa_conversations')
        .update({ agent_notes: agentNotes, updated_at: new Date().toISOString() })
        .eq('id', selectedLead.id);

      if (!error) {
        setSelectedLead((prev) => (prev ? { ...prev, agent_notes: agentNotes } : null));
        setNotesSavedNotice(true);
        setTimeout(() => setNotesSavedNotice(false), 3000);
      }
    } catch (err) {
      console.error('❌ Error saving agent notes:', err);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleGeneratePdf = () => {
    if (!selectedLead) return;
    const bundle = exportPropertySheetToPdf({
      title: `Ficha Técnica para ${selectedLead.user_name || selectedLead.user_phone}`,
      price: selectedLead.budget_max_usd || 150000,
      currency: 'USD',
      operationType: 'Venta',
      location: selectedLead.preferred_zone || 'Mendoza / Palermo',
      bedrooms: 2,
      bathrooms: 1,
      totalAreaM2: 75,
      coveredAreaM2: 65,
      description: `Propiedad de interés seleccionada para el lead ${selectedLead.user_name || selectedLead.user_phone}. Presupuesto consultado: $${selectedLead.budget_max_usd || 'N/A'} USD.`,
      features: ['Luminoso', 'Excelente Ubicación', 'Apto Crédito', 'Seguridad 24hs'],
    });

    const w = window.open();
    if (w) {
      w.document.write(bundle.html);
      w.document.close();
    }
  };

  const getStatusBadge = (status: CrmLead['status']) => {
    switch (status) {
      case 'qualified':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Calificado
          </span>
        );
      case 'active':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1 w-fit">
            <Clock className="w-3 h-3 text-blue-400" /> Activo
          </span>
        );
      case 'handover':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 w-fit">
            <Sparkles className="w-3 h-3 text-amber-400" /> En Espera
          </span>
        );
      case 'closed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30 flex items-center gap-1 w-fit">
            Cerrado
          </span>
        );
    }
  };

  const cleanPhone = selectedLead?.user_phone ? selectedLead.user_phone.replace(/\D/g, '') : '';
  const waWebUrl = cleanPhone ? `https://wa.me/${cleanPhone}` : '#';

  return (
    <div className="space-y-6 text-slate-100 pb-8">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            Inbox & Gestión Comercial de Leads
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Revisión en tiempo real de prospectos cualificados por Aria Prop, intervención de asesores y generación de fichas en PDF.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Mode Switcher */}
          <div className="p-1 rounded-2xl bg-slate-900 border border-white/10 flex items-center gap-1 text-xs font-bold">
            <button
              onClick={() => setViewMode('live_inbox')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === 'live_inbox'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              💬 Live Inbox Takeover
            </button>
            <button
              onClick={() => setViewMode('crm')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === 'crm'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              📊 Vista CRM Tabular
            </button>
          </div>

          <button
            onClick={() => {
              fetchLeads();
              fetchMetrics();
            }}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs border border-white/10 transition-all flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {viewMode === 'live_inbox' ? (
        <LiveInboxView initialLeadId={selectedLeadForChat} />
      ) : (
        <>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 space-y-1 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Leads</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-white font-mono">{metrics.total}</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 space-y-1 backdrop-blur-xl">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold">
            <span>Calificados</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-400 font-mono">{metrics.qualified}</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-blue-500/20 space-y-1 backdrop-blur-xl">
          <div className="flex items-center justify-between text-blue-400 text-xs font-semibold">
            <span>Activos (IA)</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-extrabold text-blue-400 font-mono">{metrics.active}</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/20 space-y-1 backdrop-blur-xl">
          <div className="flex items-center justify-between text-amber-400 text-xs font-semibold">
            <span>Derivados a Humano</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-amber-400 font-mono">{metrics.handover}</p>
        </div>
      </div>

      {/* Main Split-View Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        
        {/* LEFT PANEL: Leads List (4 Cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-white/10 rounded-3xl p-4 flex flex-col space-y-4 shadow-xl backdrop-blur-xl">
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por teléfono o nombre..."
              className="w-full bg-slate-950 border border-white/10 rounded-2xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'hot', label: '🔥 Calientes' },
              { id: 'warm', label: '⚡ Tibios' },
              { id: 'cold', label: '❄️ Fríos' },
              { id: 'qualified', label: '🎯 Calificados' },
              { id: 'handover', label: '👤 Derivados' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusFilter(tab.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === tab.id
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white bg-slate-950/60 hover:bg-slate-950'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Leads List Cards */}
          <div className="flex-1 space-y-2 overflow-y-auto max-h-[500px] pr-1">
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 animate-pulse space-y-2">
                  <div className="h-4 bg-white/10 rounded w-28"></div>
                  <div className="h-3 bg-white/10 rounded w-36"></div>
                </div>
              ))
            ) : leads.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p>No se encontraron prospectos</p>
              </div>
            ) : (
              leads.map((lead) => {
                const isSelected = selectedLead?.id === lead.id;
                const formattedDate = lead.last_message_at
                  ? new Date(lead.last_message_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                  : '';

                const computedScoring = computeLeadScore({
                  status: lead.status,
                  budget_max_usd: lead.budget_max_usd,
                  hasVisitRequested: lead.status === 'handover',
                  totalMessages: lead.total_messages,
                });

                return (
                  <div
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                        : 'bg-slate-950/60 hover:bg-slate-950 border-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h4 className="font-bold text-white text-xs truncate">
                          {lead.user_name || `Lead ${lead.user_phone}`}
                        </h4>
                        <LeadScoringBadge
                          score={computedScoring.score}
                          size="sm"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">{formattedDate}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                        {lead.last_message || lead.preferred_zone || 'Sin mensajes registrados'}
                      </p>
                      {getStatusBadge(lead.status)}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-white disabled:opacity-30 border border-white/10 text-[11px]"
              >
                Anterior
              </button>
              <span className="font-mono text-[10px]">Página {page} de {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-white disabled:opacity-30 border border-white/10 text-[11px]"
              >
                Siguiente
              </button>
            </div>
          )}

        </div>

        {/* RIGHT PANEL: Selected Lead Details & Actions (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-white/10 rounded-3xl p-5 flex flex-col space-y-5 shadow-xl backdrop-blur-xl">
          
          {selectedLead ? (
            <>
              {/* Selected Lead Contact Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-white text-base">
                        {selectedLead.user_name || `Lead ${selectedLead.user_phone}`}
                      </h3>
                      {getStatusBadge(selectedLead.status)}
                    </div>
                    <p className="text-xs text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{selectedLead.user_phone}</span>
                    </p>
                  </div>
                </div>

                {/* Direct Action Buttons & Toggle Bot/Human */}
                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                  <button
                    onClick={() => {
                      const isCurrentlyHandover = selectedLead.status === 'handover';
                      const targetStatus: CrmLead['status'] = isCurrentlyHandover ? 'active' : 'handover';
                      handleUpdateStatus(targetStatus);
                    }}
                    title="Alternar entre respuestas automáticas de la IA y modo atención humana"
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer shadow-md ${
                      selectedLead.status === 'handover'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30 animate-pulse'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                    }`}
                  >
                    {selectedLead.status === 'handover' ? (
                      <>
                        <Bot className="w-3.5 h-3.5 text-amber-400" />
                        <span>🤖 IA Pausada (Reanudar)</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        <span>✨ IA Activa (Pausar)</span>
                      </>
                    )}
                  </button>

                  <a
                    href={waWebUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20"
                  >
                    <MessageSquare className="w-3.5 h-3.5 fill-current" />
                    <span>WhatsApp Web</span>
                  </a>

                  <button
                    onClick={handleGeneratePdf}
                    className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs border border-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-teal-400" />
                    <span>Ficha PDF</span>
                  </button>
                </div>
              </div>

              {/* Status Switcher & Qualification Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Presupuesto Máx</span>
                  <span className="text-sm font-extrabold text-white font-mono">
                    {selectedLead.budget_max_usd ? `$${Number(selectedLead.budget_max_usd).toLocaleString('en-US')} USD` : 'No especificado'}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Zona Preferida</span>
                  <span className="text-sm font-extrabold text-emerald-400 truncate block">
                    {selectedLead.preferred_zone || 'No especificada'}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Estado Comercial</span>
                  <select
                    value={selectedLead.status}
                    onChange={(e) => handleUpdateStatus(e.target.value as CrmLead['status'])}
                    className="w-full bg-slate-900 border border-emerald-500/40 rounded-xl px-2 py-1 text-xs text-emerald-300 font-bold focus:outline-none"
                  >
                    <option value="qualified">Calificado</option>
                    <option value="handover">Derivado (Handover)</option>
                    <option value="active">Activo (IA)</option>
                    <option value="closed">Cerrado</option>
                  </select>
                </div>
              </div>

              {/* Internal Agent Notes Section */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Save className="w-3.5 h-3.5 text-emerald-400" />
                    Notas Internas del Asesor Inmobiliario
                  </span>
                  {notesSavedNotice && (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 animate-pulse">
                      <Check className="w-3 h-3" /> ¡Nota guardada!
                    </span>
                  )}
                </div>
                <textarea
                  rows={2}
                  value={agentNotes}
                  onChange={(e) => setAgentNotes(e.target.value)}
                  placeholder="Escribe anotaciones sobre las preferencias del cliente o citas coordinadas..."
                  className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all resize-none"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs border border-emerald-500/30 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {savingNotes ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Guardar Nota</span>
                  </button>
                </div>
              </div>

              {/* Chat Messages History */}
              <div className="flex-1 flex flex-col space-y-2 min-h-[220px]">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Historial de Conversación</span>
                <div className="flex-1 bg-slate-950 border border-white/5 rounded-2xl p-3 overflow-y-auto max-h-[260px] space-y-2.5">
                  {loadingMessages ? (
                    <div className="p-4 text-center text-xs text-slate-500">Cargando mensajes...</div>
                  ) : messages.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">Sin mensajes registrados en la base de datos</div>
                  ) : (
                    messages.map((msg) => {
                      const isUser = msg.sender_type === 'user';
                      const isAudio = msg.media_type === 'audio' || msg.message_text.includes('🎙️') || !!msg.transcription;

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                              isUser
                                ? 'bg-emerald-500 text-slate-950 font-medium rounded-tr-none'
                                : 'bg-slate-900 text-slate-200 border border-white/10 rounded-tl-none'
                            }`}
                          >
                            {isAudio && (
                              <div className="flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wider mb-1 text-slate-900">
                                <Mic className="w-3.5 h-3.5 fill-current" />
                                <span>Nota de Voz Transcripta</span>
                              </div>
                            )}
                            <p>{msg.transcription || msg.message_text}</p>
                          </div>
                          <span className="text-[9px] text-slate-500 mt-1 font-mono px-1">
                            {new Date(msg.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs">
              <Users className="w-10 h-10 text-slate-600 mb-2" />
              <p>Selecciona un lead de la lista izquierda para gestionar su ficha y notas</p>
            </div>
          )}

        </div>

      </div>
        </>
      )}

    </div>
  );
};

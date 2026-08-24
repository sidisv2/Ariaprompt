import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Users, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  User, 
  Phone, 
  Search, 
  Save, 
  RefreshCw, 
  Check, 
  Loader2,
  FileText,
  Bot
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { LiveInboxView } from '../chat/LiveInboxView';
import { exportPropertySheetToPdf } from '../../../lib/pdf/property-sheet';

export interface CrmLead {
  id: string;
  channel?: string;
  organization_id?: string;
  user_phone: string;
  user_name?: string;
  status: 'qualified' | 'active' | 'handover' | 'closed';
  handled_by?: 'ia' | 'human';
  budget_max_usd?: number;
  preferred_zone?: string;
  property_type?: string;
  last_message?: string;
  last_message_at: string;
  total_messages: number;
  agent_notes?: string;
  notes?: string;
  source?: string;
  origin?: string;
  preferred_contact_slot?: string;
}

export interface ChatMessage {
  id: string;
  lead_id?: string;
  sender_type: 'user' | 'assistant' | 'human_agent' | 'system';
  message_type?: string;
  message_text: string;
  content?: string;
  media_type?: string;
  media_url?: string | null;
  transcription?: string | null;
  created_at: string;
}

export interface LeadsViewProps {
  leads?: any[];
  onUpdateLeadStatus?: (leadId: string, status: any) => Promise<void>;
  selectedLeadForChat?: string | null;
  onClearSelectedLead?: () => void;
}

export const LeadsView: React.FC<LeadsViewProps> = ({
  selectedLeadForChat: propSelectedLeadForChat,
}) => {
  const [viewMode, setViewMode] = useState<'crm' | 'live_inbox'>('live_inbox');
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [selectedLead, setSelectedLead] = useState<CrmLead | null>(null);
  const [selectedLeadForChat, setSelectedLeadForChat] = useState<string | null>(propSelectedLeadForChat || null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  // Outbound Contact state
  const [outboundLoading, setOutboundLoading] = useState<string | null>(null);
  const [outboundNotice, setOutboundNotice] = useState<string | null>(null);

  // Agent Notes state
  const [agentNotes, setAgentNotes] = useState<string>('');
  const [savingNotes, setSavingNotes] = useState<boolean>(false);
  const [notesSavedNotice, setNotesSavedNotice] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Dynamic KPIs computed straight from the leads array
  const metrics = useMemo(() => {
    const total = leads.length;
    const qualified = leads.filter((l) => l.status === 'qualified').length;
    const active = leads.filter((l) => l.status === 'active' || l.handled_by === 'ia').length;
    const handover = leads.filter((l) => l.status === 'handover' || l.handled_by === 'human').length;
    return { total, qualified, active, handover };
  }, [leads]);

  const fetchConversationMessages = useCallback(async (conversationId: string) => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    setMessagesError(null);

    try {
      let rawList: any[] = [];

      // 1. Fetch via backend API (/api/crm?action=get_messages&lead_id=UUID)
      try {
        const res = await fetch(`/api/crm?action=get_messages&lead_id=${encodeURIComponent(conversationId)}`, {
          cache: 'no-store',
          credentials: 'include',
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.messages)) {
            rawList = json.messages;
          }
        }
      } catch (apiErr) {
        console.warn('[LeadsView] Warning fetching messages via /api/crm:', apiErr);
      }

      // 2. Direct fallback to Supabase if API returned empty
      if (rawList.length === 0 && supabase) {
        const { data: chatData } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('lead_id', conversationId)
          .order('created_at', { ascending: true });

        if (chatData && chatData.length > 0) {
          rawList = chatData;
        }
      }

      if (rawList.length > 0) {
        const mapped: ChatMessage[] = rawList.map((m: any) => {
          const rawSender = m.sender || m.sender_type || m.role || '';
          let normalizedSender: 'user' | 'assistant' | 'human_agent' = 'assistant';
          if (rawSender === 'user' || rawSender === 'lead' || rawSender === 'client') {
            normalizedSender = 'user';
          } else if (rawSender === 'human_agent' || rawSender === 'human' || rawSender === 'operator') {
            normalizedSender = 'human_agent';
          } else {
            normalizedSender = 'assistant';
          }
          return {
            id: m.id,
            lead_id: m.lead_id,
            sender_type: normalizedSender,
            message_type: m.message_type || m.media_type || (m.media_url ? 'image' : 'text'),
            message_text: m.message_text || m.content || '',
            content: m.content || m.message_text || '',
            media_type: m.media_type || m.message_type,
            media_url: m.media_url || null,
            transcription: m.transcription || null,
            created_at: m.created_at || new Date().toISOString(),
          };
        });
        setMessages(mapped);
      } else {
        setMessages([]);
      }
    } catch (e: any) {
      console.error('[LeadsView] Error fetching conversation messages:', e);
      setMessagesError('No se pudo cargar la conversación.');
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let rawList: any[] = [];

      // 1. Fetch via backend API (/api/crm?action=get_leads)
      try {
        const res = await fetch('/api/crm?action=get_leads', {
          cache: 'no-store',
          credentials: 'include',
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.leads)) {
            rawList = json.leads;
          }
        }
      } catch (apiErr) {
        console.warn('[LeadsView] Warning fetching leads via /api/crm:', apiErr);
      }

      // 2. Direct Supabase fallback
      if (rawList.length === 0 && supabase) {
        const { data: dbData } = await supabase
          .from('leads')
          .select('*')
          .order('updated_at', { ascending: false });

        if (dbData && dbData.length > 0) {
          rawList = dbData;
        }
      }

      const list: CrmLead[] = rawList.map((item: any) => ({
        id: item.id,
        channel: item.channel || 'WHATSAPP',
        organization_id: item.organization_id || item.user_id,
        user_phone: item.phone || item.user_phone || item.name || 'Sin teléfono',
        user_name: item.name || item.user_name || item.phone || 'Cliente',
        status: item.status || 'active',
        handled_by: item.handled_by || (item.status === 'handover' ? 'human' : 'ia'),
        budget_max_usd: item.budget_max_usd || item.budgetMax || null,
        preferred_zone: item.preferred_zone || item.preferredZone || item.zone || null,
        property_type: item.property_type || item.propertyType || null,
        last_message: item.last_message || item.chatHistorySummary || 'Lead captado',
        last_message_at: item.updated_at || item.created_at || new Date().toISOString(),
        total_messages: item.total_messages || 1,
        agent_notes: item.notes || item.agent_notes || null,
        notes: item.notes || item.agent_notes || null,
      }));

      const filtered = statusFilter === 'all' ? list : list.filter((l) => l.status === statusFilter);

      setLeads(filtered);
      setTotalCount(filtered.length);
      setTotalPages(1);

      if (filtered.length > 0) {
        setSelectedLead((prev) => {
          if (!prev) {
            fetchConversationMessages(filtered[0].id);
            return filtered[0];
          }
          const existing = filtered.find((l) => l.id === prev.id);
          if (existing) {
            fetchConversationMessages(existing.id);
            return existing;
          }
          fetchConversationMessages(filtered[0].id);
          return filtered[0];
        });
      } else {
        setSelectedLead(null);
        setMessages([]);
      }
    } catch (err: any) {
      console.error('[LeadsView] Error fetching CRM leads:', err);
      setError(err?.message || 'No se pudieron cargar los leads');
      setLeads([]);
      setSelectedLead(null);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, fetchConversationMessages]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    if (selectedLead?.agent_notes || selectedLead?.notes) {
      setAgentNotes(selectedLead.agent_notes || selectedLead.notes || '');
    } else {
      setAgentNotes('');
    }
  }, [selectedLead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Realtime subscription for incoming WhatsApp messages and leads updates
  useEffect(() => {
    if (!supabase) return;

    const leadsSub = supabase
      .channel('realtime-leads-overview')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        () => {
          fetchLeads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(leadsSub);
    };
  }, [fetchLeads]);

  useEffect(() => {
    if (!supabase || !selectedLead?.id) return;

    const leadId = selectedLead.id;
    const chatSub = supabase
      .channel(`realtime-chat-${leadId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `lead_id=eq.${leadId}` },
        (payload: any) => {
          const newRow = payload.new;
          if (!newRow) return;

          setMessages((prev) => {
            if (prev.some((m) => m.id === newRow.id)) return prev;
            const rawSender = newRow.sender || newRow.sender_type || '';
            const normalizedSender = (rawSender === 'user' || rawSender === 'lead') ? 'user' : (rawSender === 'human_agent' || rawSender === 'human') ? 'human_agent' : 'assistant';

            return [
              ...prev,
              {
                id: newRow.id,
                lead_id: newRow.lead_id,
                sender_type: normalizedSender,
                message_type: newRow.message_type || 'text',
                message_text: newRow.content || newRow.message_text || '',
                content: newRow.content || newRow.message_text || '',
                media_url: newRow.media_url || null,
                created_at: newRow.created_at || new Date().toISOString(),
              },
            ];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chatSub);
    };
  }, [selectedLead?.id]);

  const handleUpdateStatus = async (newStatus: CrmLead['status']) => {
    if (!selectedLead || !supabase) return;
    try {
      const isHandover = newStatus === 'handover';
      const handledBy = isHandover ? 'human' : 'ia';

      const { error: updErr } = await supabase
        .from('leads')
        .update({
          status: newStatus,
          handled_by: handledBy,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedLead.id);

      if (!updErr) {
        setSelectedLead((prev) => (prev ? { ...prev, status: newStatus, handled_by: handledBy } : null));
        setLeads((prev) =>
          prev.map((l) => (l.id === selectedLead.id ? { ...l, status: newStatus, handled_by: handledBy } : l))
        );
      }
    } catch (err) {
      console.error('❌ Error updating lead status:', err);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedLead || !supabase) return;
    setSavingNotes(true);
    try {
      const { error: notesErr } = await supabase
        .from('leads')
        .update({ notes: agentNotes, updated_at: new Date().toISOString() })
        .eq('id', selectedLead.id);

      if (!notesErr) {
        setSelectedLead((prev) => (prev ? { ...prev, notes: agentNotes, agent_notes: agentNotes } : null));
        setLeads((prev) =>
          prev.map((l) => (l.id === selectedLead.id ? { ...l, notes: agentNotes, agent_notes: agentNotes } : l))
        );
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
      title: `Ficha Ejecutiva de Prospecto - ${selectedLead.user_name || selectedLead.user_phone}`,
      price: selectedLead.budget_max_usd || 120000,
      currency: 'USD',
      operationType: 'Venta / Consulta Inmobiliaria',
      location: selectedLead.preferred_zone || 'Mendoza / San Rafael',
      bedrooms: 2,
      bathrooms: 1,
      totalAreaM2: 85,
      coveredAreaM2: 70,
      description: `Lead Comercial: ${selectedLead.user_name || selectedLead.user_phone}. Canal: ${selectedLead.channel || 'WHATSAPP'}. Presupuesto máximo: $${selectedLead.budget_max_usd ? Number(selectedLead.budget_max_usd).toLocaleString('en-US') : 'Por definir'} USD. Zona de búsqueda: ${selectedLead.preferred_zone || 'Mendoza'}. Último mensaje: "${selectedLead.last_message || 'Sin mensaje'}"`,
      features: ['Lead Calificado por Aria Prop', 'Atención WhatsApp 24/7', 'Interés Inmobiliario Activo', 'Verificado en CRM'],
      agencyName: 'ARIA PROP INMOBILIARIA',
      agencyPhone: '+54 9 260 401-4372',
      agencyEmail: 'valentinlautaromorales@gmail.com',
    });

    const blob = new Blob([bundle.html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (win) {
      win.focus();
      setTimeout(() => {
        try { win.print(); } catch (_) {}
      }, 500);
    }
  };

  const getSourceBadge = (leadOrSource?: any) => {
    let raw = '';
    if (typeof leadOrSource === 'string') {
      raw = leadOrSource.toLowerCase();
    } else if (leadOrSource && typeof leadOrSource === 'object') {
      raw = (leadOrSource.channel || leadOrSource.source || leadOrSource.origin || '').toLowerCase();
    }

    if (raw.includes('instagram') || raw.includes('insta')) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-pink-300 border border-pink-500/30 flex items-center gap-1 shadow-sm shrink-0 uppercase tracking-wider">
          📸 INSTAGRAM ADS
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 shrink-0 uppercase tracking-wider">
        📱 WHATSAPP
      </span>
    );
  };

  const getHandledByBadge = (handledBy?: 'ia' | 'human', status?: CrmLead['status']) => {
    const isHuman = handledBy === 'human' || status === 'handover';
    if (isHuman) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1 w-fit shadow-sm">
          <User className="w-3 h-3 text-amber-400" /> Modo Humano
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-fit shadow-sm">
        <Sparkles className="w-3 h-3 text-emerald-400" /> Modo IA
      </span>
    );
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

  const filteredLeads = leads.filter((l) => {
    const q = search.toLowerCase();
    return (
      (l.user_name && l.user_name.toLowerCase().includes(q)) ||
      l.user_phone.includes(q) ||
      (l.last_message && l.last_message.toLowerCase().includes(q))
    );
  });

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
              📋 Vista CRM Tabular
            </button>
          </div>

          <button
            onClick={() => fetchLeads()}
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
            {/* LEFT PANEL: Leads List (5 Cols) */}
            <div className="lg:col-span-5 bg-slate-900/90 border border-white/10 rounded-3xl p-4 flex flex-col space-y-4 shadow-xl backdrop-blur-xl">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por teléfono o nombre..."
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {['all', 'qualified', 'active', 'handover', 'closed'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      statusFilter === f
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-white bg-white/5 border border-transparent'
                    }`}
                  >
                    {f === 'all' ? 'Todos' : f === 'qualified' ? 'Calificados' : f === 'active' ? 'Activos' : f === 'handover' ? 'En Espera' : 'Cerrados'}
                  </button>
                ))}
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto divide-y divide-white/5 scrollbar-thin">
                {loading ? (
                  <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-400" />
                    <p>Cargando lista de prospectos...</p>
                  </div>
                ) : error ? (
                  <div className="p-8 text-center space-y-3">
                    <p className="text-xs text-red-400 font-semibold">{error}</p>
                    <button
                      onClick={() => fetchLeads()}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold"
                    >
                      Reintentar
                    </button>
                  </div>
                ) : filteredLeads.length === 0 ? (
                  <div className="p-8 text-center space-y-2 text-slate-400 text-xs my-auto">
                    <MessageSquare className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="font-bold text-slate-300">No hay prospectos registrados</p>
                    <p className="text-[11px] text-slate-500">Los leads entrantes de WhatsApp aparecerán aquí automáticamente.</p>
                  </div>
                ) : (
                  filteredLeads.map((lead) => {
                    const isSelected = selectedLead?.id === lead.id;
                    return (
                      <div
                        key={lead.id}
                        onClick={() => {
                          setSelectedLead(lead);
                          fetchConversationMessages(lead.id);
                        }}
                        className={`p-3.5 transition-all cursor-pointer hover:bg-white/5 rounded-2xl mb-1 ${
                          isSelected ? 'bg-emerald-500/10 border border-emerald-500/30' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                              {lead.user_name ? lead.user_name.charAt(0).toUpperCase() : 'L'}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-extrabold text-xs text-white truncate">
                                {lead.user_name || lead.user_phone}
                              </h4>
                              <span className="text-[10px] text-slate-400 block truncate font-mono">
                                {lead.user_phone}
                              </span>
                            </div>
                          </div>

                          {getSourceBadge(lead)}
                        </div>

                        <p className="text-[11px] text-slate-300 line-clamp-1 mt-2 font-medium">
                          {lead.last_message}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                          {getStatusBadge(lead.status)}
                          <span>
                            {new Date(lead.last_message_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-black text-white text-base">
                            {selectedLead.user_name || `Lead ${selectedLead.user_phone}`}
                          </h3>
                          {getSourceBadge(selectedLead)}
                          {getHandledByBadge(selectedLead.handled_by, selectedLead.status)}
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
                          const isCurrentlyHandover = selectedLead.status === 'handover' || selectedLead.handled_by === 'human';
                          const targetStatus: CrmLead['status'] = isCurrentlyHandover ? 'active' : 'handover';
                          handleUpdateStatus(targetStatus);
                        }}
                        title="Alternar entre respuestas automáticas de la IA y modo atención humana"
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer shadow-md ${
                          selectedLead.status === 'handover' || selectedLead.handled_by === 'human'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                        }`}
                      >
                        {selectedLead.status === 'handover' || selectedLead.handled_by === 'human' ? (
                          <>
                            <Bot className="w-3.5 h-3.5 text-amber-400" />
                            <span>🟠 Modo Humano (Reanudar IA)</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                            <span>🟢 IA Activa (Pausar)</span>
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

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/5">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Presupuesto</span>
                      <span className="text-sm font-extrabold text-white font-mono">
                        {selectedLead.budget_max_usd ? `${Number(selectedLead.budget_max_usd).toLocaleString('en-US')} USD` : 'Por definir'}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/5">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Zona Preferida</span>
                      <span className="text-sm font-extrabold text-emerald-400 truncate block">
                        {selectedLead.preferred_zone || 'Mendoza / San Rafael'}
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
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                        HISTORIAL DE CONVERSACIÓN
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {messages.length} {messages.length === 1 ? 'mensaje' : 'mensajes'}
                      </span>
                    </div>

                    <div className="flex-1 bg-slate-950 border border-white/5 rounded-2xl p-3.5 overflow-y-auto max-h-[300px] space-y-3 scrollbar-thin">
                      {loadingMessages ? (
                        <div className="p-6 text-center text-xs text-slate-400 space-y-2">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto text-emerald-400" />
                          <p>Cargando historial de mensajes...</p>
                        </div>
                      ) : messagesError ? (
                        <div className="p-6 text-center text-xs text-red-400 space-y-2">
                          <p>{messagesError}</p>
                          <button
                            onClick={() => fetchConversationMessages(selectedLead.id)}
                            className="px-3 py-1 bg-emerald-500 text-slate-950 rounded-lg font-bold"
                          >
                            Reintentar
                          </button>
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-500 italic">
                          No hay mensajes registrados para este lead.
                        </div>
                      ) : (
                        messages.map((msg) => {
                          const isUser = msg.sender_type === 'user';
                          const isHumanAgent = msg.sender_type === 'human_agent';

                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}
                            >
                              <div
                                className={`max-w-md p-3 rounded-2xl text-xs leading-relaxed space-y-1 ${
                                  isUser
                                    ? 'bg-slate-900 border border-white/10 text-white rounded-tl-none'
                                    : isHumanAgent
                                    ? 'bg-amber-500/20 border border-amber-500/40 text-amber-100 rounded-tr-none'
                                    : 'bg-emerald-600 text-slate-950 font-medium rounded-tr-none'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2 text-[10px] opacity-75 font-extrabold pb-1 border-b border-black/10">
                                  <span>
                                    {isUser
                                      ? selectedLead.user_name || 'Prospecto'
                                      : isHumanAgent
                                      ? '👤 Asesor Humano'
                                      : '🤖 Aria IA'}
                                  </span>
                                  <span>
                                    {new Date(msg.created_at).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                                <p className="text-xs whitespace-pre-wrap">{msg.content || msg.message_text}</p>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-3 my-auto">
                  <User className="w-10 h-10 text-slate-700" />
                  <p className="text-xs font-semibold">Selecciona un prospecto para ver el historial y gestionar el contacto.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

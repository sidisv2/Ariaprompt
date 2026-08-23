import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Search,
  Phone,
  MessageSquare,
  Send,
  User,
  Bot,
  UserCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Building,
  RefreshCw,
  Sliders,
  ShieldAlert,
  Loader2,
  Check,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useLanguage } from '../../context/LanguageContext';
import { LeadScoringBadge, computeLeadScore } from './LeadScoringBadge';

export interface InboxLeadItem {
  id: string;
  user_phone: string;
  user_name: string | null;
  status: 'active' | 'qualified' | 'handover' | 'closed';
  preferred_zone?: string | null;
  budget_max_usd?: number | null;
  last_message: string | null;
  last_message_at: string;
  total_messages: number;
  channel: 'whatsapp' | 'webchat';
  handled_by?: 'ia' | 'human';
  is_bot_active: boolean;
}

export interface ChatMessage {
  id: string;
  sender_type: 'user' | 'assistant' | 'human_agent' | 'system';
  message_type?: string;
  media_type?: string;
  media_url?: string | null;
  message_text: string;
  content?: string;
  created_at: string;
}

interface LiveInboxViewProps {
  initialLeadId?: string;
}

export const LiveInboxView: React.FC<LiveInboxViewProps> = ({ initialLeadId }) => {
  const { t } = useLanguage();
  const [leads, setLeads] = useState<InboxLeadItem[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(initialLeadId || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Active Conversation State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isBotActive, setIsBotActive] = useState(true);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial Data Fetch
  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    if (selectedLeadId) {
      fetchConversationMessages(selectedLeadId);
    }
  }, [selectedLeadId]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLeads([]);
          setSelectedLeadId(null);
          setLoading(false);
          return;
        }

        let query = supabase.from('leads').select('*, lead_messages(*)');
        if (!(user as any)?.isDemoAccount) {
          query = query.or(`user_id.eq.${user.id},organization_id.eq.${user.id}`);
        }

        const { data, error } = await query.order('updated_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped: InboxLeadItem[] = data.map((item: any) => ({
            id: item.id,
            user_phone: item.phone || item.user_phone || item.name || 'Sin teléfono',
            user_name: item.name || item.user_name || item.phone || 'Cliente',
            status: item.status || 'active',
            preferred_zone: item.preferred_zone || item.preferredZone || null,
            budget_max_usd: item.budget_max_usd || item.budgetMax || null,
            last_message: item.last_message || item.chatHistorySummary || 'Sin mensajes aún',
            last_message_at: item.updated_at || item.created_at || new Date().toISOString(),
            total_messages: item.total_messages || (item.lead_messages ? item.lead_messages.length : 0),
            channel: item.channel || 'whatsapp',
            handled_by: item.handled_by || (item.is_bot_active === false || item.status === 'handover' ? 'human' : 'ia'),
            is_bot_active: item.handled_by === 'human' ? false : item.is_bot_active !== false,
          }));
          setLeads(mapped);
          if (!selectedLeadId && mapped.length > 0) {
            setSelectedLeadId(mapped[0].id);
          }
        } else {
          // Check wa_conversations fallback
          const { data: waConvs } = await supabase
            .from('wa_conversations')
            .select('*')
            .eq('organization_id', user.id)
            .order('last_message_at', { ascending: false });

          if (waConvs && waConvs.length > 0) {
            const mapped: InboxLeadItem[] = waConvs.map((item: any) => ({
              id: item.id,
              user_phone: item.user_phone || 'WhatsApp Lead',
              user_name: item.user_name || item.user_phone || 'Prospecto WhatsApp',
              status: item.status || 'active',
              preferred_zone: item.preferred_zone || null,
              budget_max_usd: item.budget_max_usd || null,
              last_message: item.last_message || 'Mensaje de WhatsApp',
              last_message_at: item.last_message_at || item.created_at || new Date().toISOString(),
              total_messages: 1,
              channel: 'whatsapp',
              is_bot_active: item.is_bot_active !== false,
            }));
            setLeads(mapped);
            if (!selectedLeadId && mapped.length > 0) {
              setSelectedLeadId(mapped[0].id);
            }
          } else {
            setLeads([]);
            setSelectedLeadId(null);
          }
        }
      } else {
        setLeads([]);
        setSelectedLeadId(null);
      }
    } catch (e) {
      console.error('Error fetching inbox leads:', e);
      setLeads([]);
      setSelectedLeadId(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversationMessages = async (leadId: string) => {
    const selected = leads.find((l) => l.id === leadId);
    if (selected) {
      setIsBotActive(selected.is_bot_active);
    }

    try {
      if (supabase) {
        let { data } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('lead_id', leadId)
          .order('created_at', { ascending: true });

        if (!data || data.length === 0) {
          const { data: leadData } = await supabase
            .from('lead_messages')
            .select('*')
            .eq('lead_id', leadId)
            .order('created_at', { ascending: true });
          data = leadData;
        }

        if (!data || data.length === 0) {
          const { data: waData } = await supabase
            .from('wa_messages')
            .select('*')
            .eq('conversation_id', leadId)
            .order('created_at', { ascending: true });
          data = waData;
        }

        if (data && data.length > 0) {
          const mappedMsgs: ChatMessage[] = data.map((m: any) => ({
            id: m.id,
            sender_type: m.sender_type || (m.role === 'user' ? 'user' : 'assistant'),
            message_type: m.message_type || m.media_type || (m.media_url ? 'image' : 'text'),
            media_type: m.media_type || m.message_type,
            media_url: m.media_url || null,
            message_text: m.message_text || m.content || '',
            content: m.content || m.message_text || '',
            created_at: m.created_at || new Date().toISOString(),
          }));
          setMessages(mappedMsgs);
          return;
        }
      }
      setMessages([]);
    } catch (e) {
      console.error('Error fetching messages:', e);
      setMessages([]);
    }
  };

  const handleToggleTakeover = async () => {
    if (!selectedLeadId) return;
    const newBotActiveState = !isBotActive;
    const nextHandledBy: 'ia' | 'human' = newBotActiveState ? 'ia' : 'human';
    const nextStatus = newBotActiveState ? 'active' : 'handover';
    setIsBotActive(newBotActiveState);

    // Update local state list
    setLeads((prev) =>
      prev.map((l) => (l.id === selectedLeadId ? { ...l, is_bot_active: newBotActiveState, handled_by: nextHandledBy, status: nextStatus } : l))
    );

    try {
      if (supabase) {
        await supabase
          .from('leads')
          .update({
            handled_by: nextHandledBy,
            is_bot_active: newBotActiveState,
            status: nextStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedLeadId);

        try {
          await supabase
            .from('wa_conversations')
            .update({
              handled_by: nextHandledBy,
              status: nextStatus,
              updated_at: new Date().toISOString(),
            })
            .eq('id', selectedLeadId);
        } catch (_) {}
      }
    } catch (e) {
      console.error('Error updating bot takeover mode:', e);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedLeadId || sending) return;

    const userText = inputMessage.trim();
    setInputMessage('');
    setSending(true);

    const newMsg: ChatMessage = {
      id: 'human-' + Date.now(),
      sender_type: 'human_agent',
      message_text: userText,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]);

    try {
      if (supabase) {
        await supabase.from('chat_messages').insert({
          lead_id: selectedLeadId,
          sender: 'human_agent',
          sender_type: 'human_agent',
          content: userText,
          message_text: userText,
          created_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Error sending human response:', err);
    } finally {
      setSending(false);
    }
  };

  const activeLead = leads.find((l) => l.id === selectedLeadId);

  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      l.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.user_phone.includes(searchQuery) ||
      l.last_message?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || l.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="h-[calc(100vh-80px)] bg-slate-950 text-white flex flex-col font-sans border-t border-white/10">
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
        {/* ─── LEFT COLUMN: CONVERSATION LIST (4 COLS) ─── */}
        <div className="md:col-span-4 border-r border-white/10 flex flex-col bg-slate-900/60 overflow-hidden">
          {/* Header & Search */}
          <div className="p-4 border-b border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
                <h2 className="font-extrabold text-sm text-white">Bandeja de Entrada en Vivo</h2>
              </div>
              <button
                onClick={fetchLeads}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Actualizar chats"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar prospecto por nombre, teléfono..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:border-emerald-400 outline-none"
              />
            </div>
          </div>

          {/* Leads List */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/5 scrollbar-thin">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-400" />
                <p>Cargando bandeja de entrada...</p>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="p-8 text-center space-y-3 my-auto">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-white text-sm">{t('leads_empty_title')}</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {t('leads_empty_subtitle')}
                </p>
              </div>
            ) : (
              filteredLeads.map((lead) => {
                const isSelected = lead.id === selectedLeadId;
                return (
                  <div
                    key={lead.id}
                    onClick={() => setSelectedLeadId(lead.id)}
                    className={`p-3.5 transition-all cursor-pointer hover:bg-white/5 ${
                      isSelected ? 'bg-emerald-500/10 border-l-4 border-emerald-400' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                          {lead.user_name ? lead.user_name.charAt(0).toUpperCase() : 'P'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-xs text-white truncate">
                            {lead.user_name || lead.user_phone}
                          </h4>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {lead.user_phone}
                          </span>
                        </div>
                      </div>

                      {/* Channel Badge */}
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-black uppercase tracking-wider shrink-0">
                        {lead.channel === 'whatsapp' ? '💬 WhatsApp' : '🌐 Webchat'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 line-clamp-1 mt-2 font-medium">
                      {lead.last_message}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold uppercase ${
                            lead.status === 'handover'
                              ? 'bg-amber-500/20 text-amber-300'
                              : lead.status === 'qualified'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {lead.status === 'handover'
                            ? '👤 Intervención'
                            : lead.status === 'qualified'
                            ? '🎯 Calificado'
                            : '⚡ Frío'}
                        </span>

                        <LeadScoringBadge
                          score={
                            computeLeadScore({
                              status: lead.status,
                              budget_max_usd: lead.budget_max_usd,
                              hasVisitRequested: lead.status === 'handover',
                              totalMessages: lead.total_messages,
                            }).score
                          }
                          size="sm"
                        />
                      </div>

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

        {/* ─── RIGHT COLUMN: REALTIME TIMELINE & TAKEOVER (8 COLS) ─── */}
        <div className="md:col-span-8 flex flex-col bg-slate-950 overflow-hidden">
          {activeLead ? (
            <>
              {/* Header with Human Takeover Toggle */}
              <div className="p-4 border-b border-white/10 bg-slate-900/80 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-black text-sm flex items-center justify-center shrink-0">
                    {activeLead.user_name ? activeLead.user_name.charAt(0).toUpperCase() : 'P'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-sm text-white">
                        {activeLead.user_name || activeLead.user_phone}
                      </h3>
                      <LeadScoringBadge
                        score={
                          computeLeadScore({
                            status: activeLead.status,
                            budget_max_usd: activeLead.budget_max_usd,
                            hasVisitRequested: activeLead.status === 'handover',
                            totalMessages: activeLead.total_messages,
                          }).score
                        }
                        size="sm"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Zona: <strong className="text-slate-200">{activeLead.preferred_zone || 'CABA'}</strong> · Presupuesto: <strong className="text-emerald-400">${activeLead.budget_max_usd?.toLocaleString()} USD</strong> · Visita: <strong className="text-amber-300">Viernes 16:00 hs</strong>
                    </p>
                  </div>
                </div>

                {/* Human Takeover Toggle Switch */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleTakeover}
                    className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-md ${
                      isBotActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {isBotActive ? (
                      <>
                        <Bot className="w-4 h-4 text-emerald-400" />
                        <span>🤖 IA Respondiendo 24/7</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4 text-amber-400" />
                        <span>👤 Intervención Humana (Silenciada)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Message Timeline */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0b141a] scrollbar-thin">
                {messages.map((msg) => {
                  const isUser = msg.sender_type === 'user';
                  const isSystem = msg.sender_type === 'system';
                  const isHumanAgent = msg.sender_type === 'human_agent';

                  if (isSystem) {
                    return (
                      <div
                        key={msg.id}
                        className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] text-center max-w-md mx-auto my-2"
                      >
                        {msg.message_text}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        isUser ? 'items-start' : 'items-end'
                      }`}
                    >
                      <div
                        className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed space-y-1 ${
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
                              ? activeLead.user_name || 'Prospecto'
                              : isHumanAgent
                              ? '👤 Operador Humano'
                              : '🤖 Aria IA 24/7'}
                          </span>
                          <span>
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        {/* Image Thumbnail / Attachment Preview */}
                        {(msg.message_type === 'image' || msg.media_type === 'image' || msg.media_url) && msg.media_url && (
                          <div className="mt-2 rounded-xl overflow-hidden border border-slate-700 max-w-xs cursor-pointer hover:opacity-95 transition shadow-lg bg-slate-950">
                            <a href={msg.media_url} target="_blank" rel="noopener noreferrer" title="Ver imagen completa">
                              <img 
                                src={msg.media_url} 
                                alt="Adjunto del cliente" 
                                className="w-full h-auto object-cover max-h-60 rounded-md hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                              />
                            </a>
                          </div>
                        )}
                        {(msg.message_text || msg.content) && (
                          <p className="pt-0.5 whitespace-pre-wrap">{msg.message_text || msg.content}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Operator Chat Input */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 border-t border-white/10 bg-slate-900/90 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={
                    isBotActive
                      ? 'Escribe para enviar mensaje directo (silenciará a la IA automáticamente)...'
                      : 'Escribe tu respuesta como operador humano...'
                  }
                  className="flex-1 p-3 rounded-2xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:border-emerald-400 outline-none"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || sending}
                  className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-500/20 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-2xl">
                <MessageSquare className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-black text-white text-lg">{t('leads_empty_title')}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t('leads_empty_subtitle')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveInboxView;

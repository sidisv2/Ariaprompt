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
  is_bot_active: boolean;
}

export interface ChatMessage {
  id: string;
  sender_type: 'user' | 'assistant' | 'human_agent' | 'system';
  message_text: string;
  created_at: string;
}

interface LiveInboxViewProps {
  initialLeadId?: string;
}

export const LiveInboxView: React.FC<LiveInboxViewProps> = ({ initialLeadId }) => {
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
        const { data, error } = await supabase
          .from('conversations')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(50);

        if (!error && data && data.length > 0) {
          const mapped: InboxLeadItem[] = data.map((item: any) => ({
            id: item.id,
            user_phone: item.user_phone || '54911' + item.id.substring(0, 7),
            user_name: item.user_name || 'Prospecto Inmobiliario',
            status: item.status || (item.handover_requested ? 'handover' : 'active'),
            preferred_zone: item.preferred_zone || 'Palermo / Belgrano',
            budget_max_usd: item.budget_max_usd || 150000,
            last_message: item.last_message || 'Hola, me interesa ver este departamento.',
            last_message_at: item.updated_at || new Date().toISOString(),
            total_messages: item.total_messages || 4,
            channel: item.channel === 'webchat' ? 'webchat' : 'whatsapp',
            is_bot_active: item.is_bot_active !== false,
          }));
          setLeads(mapped);
          if (!selectedLeadId && mapped.length > 0) {
            setSelectedLeadId(mapped[0].id);
          }
        } else {
          // Fallback Mock Data for Instant Interactive Demo
          const mockLeads: InboxLeadItem[] = [
            {
              id: 'lead-1',
              user_phone: '+54 9 11 4014-3729',
              user_name: 'Valentin Morales (Interesado Palermo)',
              status: 'handover',
              preferred_zone: 'Palermo Hollywood',
              budget_max_usd: 180000,
              last_message: 'Quiero agendar una visita para el viernes por la tarde.',
              last_message_at: new Date(Date.now() - 5 * 60000).toISOString(),
              total_messages: 6,
              channel: 'whatsapp',
              is_bot_active: false,
            },
            {
              id: 'lead-2',
              user_phone: '+54 9 11 5522-8811',
              user_name: 'Carolina Ruiz',
              status: 'qualified',
              preferred_zone: 'Belgrano R',
              budget_max_usd: 250000,
              last_message: '¿Tiene cochera fija y balcón terraza?',
              last_message_at: new Date(Date.now() - 25 * 60000).toISOString(),
              total_messages: 8,
              channel: 'whatsapp',
              is_bot_active: true,
            },
            {
              id: 'lead-3',
              user_phone: '+54 9 260 401-4372',
              user_name: 'Gonzalo Fernández',
              status: 'active',
              preferred_zone: 'Recoleta',
              budget_max_usd: 120000,
              last_message: '¿Aceptan permuta por departamento más chico?',
              last_message_at: new Date(Date.now() - 2 * 3600000).toISOString(),
              total_messages: 3,
              channel: 'webchat',
              is_bot_active: true,
            },
          ];
          setLeads(mockLeads);
          if (!selectedLeadId) setSelectedLeadId('lead-1');
        }
      }
    } catch (e) {
      console.error('Error fetching inbox leads:', e);
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
        const { data } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', leadId)
          .order('created_at', { ascending: true });

        if (data && data.length > 0) {
          const mappedMsgs: ChatMessage[] = data.map((m: any) => ({
            id: m.id,
            sender_type: m.sender_type || (m.role === 'user' ? 'user' : 'assistant'),
            message_text: m.message_text || m.content || '',
            created_at: m.created_at,
          }));
          setMessages(mappedMsgs);
          return;
        }
      }

      // Mock Timeline for selected lead
      const mockTimeline: ChatMessage[] = [
        {
          id: 'msg-1',
          sender_type: 'user',
          message_text: 'Hola! Vi el departamento en Palermo de 3 ambientes a 180.000 USD.',
          created_at: new Date(Date.now() - 15 * 60000).toISOString(),
        },
        {
          id: 'msg-2',
          sender_type: 'assistant',
          message_text:
            '¡Hola Valentin! Claro que sí 🏢 Cuenta con 75 m², balcón corrido al frente y amoblado de categoría. ¿Te gustaría coordinar una visita presencial?',
          created_at: new Date(Date.now() - 14 * 60000).toISOString(),
        },
        {
          id: 'msg-3',
          sender_type: 'user',
          message_text: 'Sí, me interesa ir el viernes a las 16 hs. ¿Hay un asesor disponible?',
          created_at: new Date(Date.now() - 5 * 60000).toISOString(),
        },
        {
          id: 'msg-4',
          sender_type: 'system',
          message_text: '⚠️ Lead ha solicitado atención personalizada. Intervención Humana recomendada.',
          created_at: new Date(Date.now() - 4 * 60000).toISOString(),
        },
      ];
      setMessages(mockTimeline);
    } catch (e) {
      console.error('Error fetching messages:', e);
    }
  };

  const handleToggleTakeover = async () => {
    if (!selectedLeadId) return;
    const newBotActiveState = !isBotActive;
    setIsBotActive(newBotActiveState);

    // Update local state list
    setLeads((prev) =>
      prev.map((l) => (l.id === selectedLeadId ? { ...l, is_bot_active: newBotActiveState } : l))
    );

    try {
      if (supabase) {
        await supabase
          .from('conversations')
          .update({
            is_bot_active: newBotActiveState,
            status: newBotActiveState ? 'active' : 'handover',
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedLeadId);
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
        await supabase.from('messages').insert({
          conversation_id: selectedLeadId,
          sender_type: 'human_agent',
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
              <div className="p-8 text-center text-slate-400 text-xs">
                No hay conversaciones activas.
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
                        <p className="pt-0.5 whitespace-pre-wrap">{msg.message_text}</p>
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
            <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-500 text-xs">
              Selecciona una conversación de la lista para ver el historial y tomar el control humano.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveInboxView;

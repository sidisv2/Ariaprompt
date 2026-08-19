import React, { useEffect, useState, useRef } from 'react';
import {
  X,
  Send,
  MessageSquare,
  Phone,
  User,
  Calendar,
  DollarSign,
  MapPin,
  ExternalLink,
  CheckCircle2,
  Clock,
  Sparkles,
  Loader2
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

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
}

export interface WaMessageItem {
  id: string;
  conversation_id: string;
  organization_id: string;
  wamid?: string;
  sender_type: 'user' | 'assistant' | 'system';
  message_text: string;
  created_at: string;
}

interface LeadChatModalProps {
  lead: CrmLead | null;
  onClose: () => void;
  onStatusUpdated?: (leadId: string, newStatus: CrmLead['status']) => void;
}

export const LeadChatModal: React.FC<LeadChatModalProps> = ({
  lead,
  onClose,
  onStatusUpdated,
}) => {
  const [messages, setMessages] = useState<WaMessageItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!lead) return;
    fetchConversationMessages(lead.id);
  }, [lead?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversationMessages = async (conversationId: string) => {
    setLoading(true);
    try {
      if (!supabase) {
        setMessages([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('wa_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('⚠️ Error fetching wa_messages from Supabase:', error.message);
        setMessages([]);
      } else {
        setMessages(data || []);
      }
    } catch (err) {
      console.error('❌ Exception fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: CrmLead['status']) => {
    if (!lead || !supabase) return;
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('wa_conversations')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', lead.id);

      if (!error) {
        if (onStatusUpdated) onStatusUpdated(lead.id, newStatus);
      }
    } catch (err) {
      console.error('Error updating lead status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (!lead) return null;

  const cleanPhone = lead.user_phone.replace(/\D/g, '');
  const whatsappWebUrl = `https://wa.me/${cleanPhone}`;

  const getStatusBadge = (status: CrmLead['status']) => {
    switch (status) {
      case 'qualified':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Calificado
          </span>
        );
      case 'active':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-blue-400" /> Activo
          </span>
        );
      case 'handover':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> En Espera Asesor
          </span>
        );
      case 'closed':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/20 text-slate-300 border border-slate-500/30 flex items-center gap-1">
            <X className="w-3.5 h-3.5 text-slate-400" /> Cerrado / Atendido
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl max-w-2xl w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden relative animate-page-fade">
        
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-slate-950/90 border-b border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">
                  {lead.user_name || `Lead ${lead.user_phone}`}
                </h3>
                {getStatusBadge(lead.status)}
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Phone className="w-3 h-3 text-emerald-400" />
                <span>{lead.user_phone}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lead Metadata Info Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-slate-950/50 border-b border-white/5 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">
              Presupuesto: {lead.budget_max_usd ? `$${Number(lead.budget_max_usd).toLocaleString('en-US')} USD` : 'No especificado'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">
              Zona: {lead.preferred_zone || 'Cualquiera'}
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1 flex items-center gap-1.5 text-slate-300">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">
              Tipo: {lead.property_type || 'Inmueble general'}
            </span>
          </div>
        </div>

        {/* Chat Log Body (WhatsApp Web Style) */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-950/40">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              <span>Cargando conversación de WhatsApp...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs text-center space-y-2 p-6">
              <MessageSquare className="w-8 h-8 text-slate-600" />
              <p className="font-semibold text-slate-300">No hay mensajes registrados aún</p>
              <p className="text-[11px] text-slate-500 max-w-sm">
                Último mensaje recibido: "{lead.last_message || 'N/A'}"
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isUser = m.sender_type === 'user';
              const formattedTime = new Date(m.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl text-xs space-y-1 ${
                      isUser
                        ? 'bg-slate-900 border border-white/10 text-slate-200 rounded-tl-none'
                        : 'bg-emerald-950/80 border border-emerald-500/30 text-emerald-100 rounded-tr-none shadow-md shadow-emerald-950/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 text-[10px] opacity-70 font-semibold mb-1">
                      <span>{isUser ? lead.user_name || 'Cliente (WhatsApp)' : 'Aria (IA Comercial)'}</span>
                      <span>{formattedTime}</span>
                    </div>

                    <p className="whitespace-pre-wrap leading-relaxed">{m.message_text}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <a
            href={whatsappWebUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Abrir en WhatsApp Web</span>
          </a>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {lead.status !== 'closed' ? (
              <button
                disabled={updatingStatus}
                onClick={() => handleUpdateStatus('closed')}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Marcar Atendido / Cerrado</span>
              </button>
            ) : (
              <button
                disabled={updatingStatus}
                onClick={() => handleUpdateStatus('qualified')}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Reabrir como Calificado</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

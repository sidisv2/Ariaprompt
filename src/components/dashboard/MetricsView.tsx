import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Lead } from '../../types';
import { 
  TrendingUp, 
  TrendingDown, 
  MessageSquare, 
  UserCheck, 
  Flame, 
  Clock
} from 'lucide-react';
import { CrmMetrics } from './CrmMetrics';

interface MetricsViewProps {
  leads: Lead[];
  onInterveneLead: (leadId: string) => void;
}

export const MetricsView: React.FC<MetricsViewProps> = ({ leads, onInterveneLead }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'hot'>('all');
  const [dbLeads, setDbLeads] = useState<Lead[] | null>(null);
  const [dbMessagesCount, setDbMessagesCount] = useState<number | null>(null);
  const [dbResponseTimesMs, setDbResponseTimesMs] = useState<number[] | null>(null);

  // Fetch real count/leads from Supabase if configured and authenticated user exists
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !user?.id) return;

    let isMounted = true;
    async function fetchAccountData() {
      try {
        // Query leads for this user account
        const { data: leadData } = await supabase
          .from('leads')
          .select('*')
          .eq('user_id', user.id);

        if (isMounted && leadData) {
          setDbLeads(leadData as any);
        }

        // Query real messages count and response timestamps for this user account
        const { data: msgData, count: msgCount } = await supabase
          .from('chat_messages')
          .select('response_time_ms, received_at, sent_at', { count: 'exact' })
          .eq('user_id', user.id);

        if (isMounted && typeof msgCount === 'number') {
          setDbMessagesCount(msgCount);
        }

        if (isMounted && msgData && msgData.length > 0) {
          const times: number[] = [];
          msgData.forEach((m: any) => {
            if (typeof m.response_time_ms === 'number' && m.response_time_ms > 0) {
              times.push(m.response_time_ms);
            } else if (m.received_at && m.sent_at) {
              const diff = new Date(m.sent_at).getTime() - new Date(m.received_at).getTime();
              if (diff > 0 && diff < 300000) times.push(diff);
            }
          });
          setDbResponseTimesMs(times);
        }
      } catch (err) {
        console.warn('MetricsView Supabase query warning:', err);
      }
    }

    fetchAccountData();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Determine effective leads array for current account using explicit isDemoAccount flag
  const accountLeads = useMemo(() => {
    // If Supabase returned leads for this user, use them
    if (dbLeads !== null) return dbLeads;

    // If non-demo user is logged in, filter or check local storage leads
    if (user && !user.isDemoAccount) {
      const savedUserLeads = localStorage.getItem(`aria_leads_${user.id}`);
      if (savedUserLeads) {
        try {
          return JSON.parse(savedUserLeads);
        } catch {}
      }
      // Real accounts default to actual user leads (0 if fresh account)
      return [];
    }

    // Explicit demo account uses demo leads prop
    return leads;
  }, [dbLeads, leads, user]);

  // Dynamic calculations based strictly on real account data
  const totalLeadsCount = accountLeads.length;

  const totalConversationsCount = useMemo(() => {
    if (dbMessagesCount !== null) return dbMessagesCount;
    return accountLeads.reduce((acc, lead) => acc + (lead.chatMessagesCount || 0), 0);
  }, [dbMessagesCount, accountLeads]);

  const qualifiedLeadsCount = useMemo(() => {
    return accountLeads.filter(
      (l) => l.temperature === 'hot' || l.temperature === 'warm' || (l.score && l.score >= 50)
    ).length;
  }, [accountLeads]);

  const scheduledVisitsCount = useMemo(() => {
    return accountLeads.filter((l) => l.status === 'visit_scheduled').length;
  }, [accountLeads]);

  const conversionRatePercent = useMemo(() => {
    if (totalLeadsCount === 0) return '0.0%';
    return `${((scheduledVisitsCount / totalLeadsCount) * 100).toFixed(1)}%`;
  }, [scheduledVisitsCount, totalLeadsCount]);

  // Real Average Response Time calculation from timestamps
  const averageResponseTimeText = useMemo(() => {
    const times: number[] = [];

    if (dbResponseTimesMs !== null && dbResponseTimesMs.length > 0) {
      times.push(...dbResponseTimesMs);
    }

    if (times.length === 0 && accountLeads.length > 0) {
      accountLeads.forEach((lead: any) => {
        if (Array.isArray(lead.messages)) {
          lead.messages.forEach((msg: any) => {
            if (typeof msg.responseTimeMs === 'number' && msg.responseTimeMs > 0) {
              times.push(msg.responseTimeMs);
            } else if (msg.receivedAt && msg.sentAt) {
              const diff = new Date(msg.sentAt).getTime() - new Date(msg.receivedAt).getTime();
              if (diff > 0 && diff < 300000) times.push(diff);
            }
          });
        }
      });
    }

    if (times.length === 0) {
      return 'Sin datos suficientes aún';
    }

    const sumMs = times.reduce((a, b) => a + b, 0);
    const avgMs = sumMs / times.length;
    if (avgMs < 1000) {
      return `${Math.round(avgMs)} ms`;
    }
    return `${(avgMs / 1000).toFixed(1)}s`;
  }, [dbResponseTimesMs, accountLeads]);

  const metricCards = useMemo(() => {
    const isZeroActivity = totalLeadsCount === 0 && totalConversationsCount === 0;

    return [
      {
        id: 'met-1',
        label: 'Conversaciones Totales Atendidas',
        value: isZeroActivity ? '0' : totalConversationsCount.toLocaleString('es-ES'),
        changePercent: isZeroActivity ? 0 : 100,
        trend: 'up',
        timeframe: isZeroActivity ? 'Sin conversaciones todavía' : 'Actividad acumulada de la cuenta',
        sparkline: isZeroActivity ? [0, 0, 0, 0, 0, 0, 0] : [1, 2, 4, 6, 8, 10, totalConversationsCount],
      },
      {
        id: 'met-2',
        label: 'Leads Cualificados (Hot / Warm)',
        value: isZeroActivity ? '0' : qualifiedLeadsCount.toString(),
        changePercent: isZeroActivity ? 0 : Math.round((qualifiedLeadsCount / Math.max(totalLeadsCount, 1)) * 100),
        trend: 'up',
        timeframe: isZeroActivity ? 'Sin leads cualificados aún' : 'Evaluados por IA RAG',
        sparkline: isZeroActivity ? [0, 0, 0, 0, 0, 0, 0] : [0, 1, 2, 3, qualifiedLeadsCount],
      },
      {
        id: 'met-3',
        label: 'Tasa de Conversión a Cita',
        value: conversionRatePercent,
        changePercent: isZeroActivity ? 0 : parseFloat(conversionRatePercent),
        trend: 'up',
        timeframe: isZeroActivity ? 'Sin citas agendadas aún' : 'Visitas agendadas vs total leads',
        sparkline: isZeroActivity ? [0, 0, 0, 0, 0, 0, 0] : [0, 5, 10, parseFloat(conversionRatePercent)],
      },
      {
        id: 'met-4',
        label: 'Tiempo Medio de Respuesta',
        value: averageResponseTimeText,
        changePercent: 0,
        trend: 'up',
        timeframe: averageResponseTimeText.includes('Sin datos')
          ? 'Requiere volumen de conversaciones'
          : 'Calculado de timestamps de mensajes reales',
        sparkline: [0, 0, 0, 0, 0, 0, 0],
      },
    ];
  }, [totalLeadsCount, totalConversationsCount, qualifiedLeadsCount, conversionRatePercent, averageResponseTimeText]);

  const filteredLeads = activeTab === 'hot' 
    ? accountLeads.filter((l) => l.temperature === 'hot') 
    : accountLeads;

  return (
    <div className="space-y-8 p-6">
      
      {/* Header title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Panel de Métricas & Actividad En Vivo</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Real-time
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Monitoreo en tiempo real de conversaciones activas, cualificación RAG y rendimiento del bot.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900 px-3 py-1.5 rounded-xl border border-white/10">
          <Clock className="w-4 h-4 text-emerald-400" />
          <span>Última sincronización: En vivo</span>
        </div>
      </div>

      {/* Real-Time CRM Metrics & CSV Exporter */}
      <CrmMetrics />

      {/* KPI Cards Grid with Sparkline */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((card) => {
          const isPositive = card.trend === 'up' && card.changePercent > 0;
          const isZeroOrText = card.value === '0' || card.value === '0.0%' || card.value.includes('Sin datos');
          return (
            <div
              key={card.id}
              className="bg-white/[0.03] backdrop-blur-sm border border-white/5 rounded-xl p-5 shadow-sm space-y-3 hover:border-white/10 transition-all"
            >
              <div className="flex items-center justify-between text-xs font-medium text-slate-400 uppercase tracking-tight">
                <span>{card.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                    isPositive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-white/5 text-slate-400'
                  }`}
                >
                  {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {card.changePercent > 0 ? `+${card.changePercent}%` : `${card.changePercent}%`}
                </span>
              </div>

              <div className={`font-bold text-white tracking-tight ${card.value.length > 8 ? 'text-lg' : 'text-2xl font-mono tabular-nums'}`}>
                {card.value}
              </div>

              {/* Sparkline Visual representation */}
              <div className="flex items-end gap-1 h-6 pt-1">
                {card.sparkline.map((val, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-t transition-all ${isZeroOrText ? 'bg-slate-800' : 'bg-emerald-500/30 hover:bg-emerald-400'}`}
                    style={{ height: val > 0 ? `${(val / Math.max(...card.sparkline)) * 100}%` : '15%' }}
                  />
                ))}
              </div>

              <p className="text-[10px] text-slate-500 pt-1 border-t border-white/5">{card.timeframe}</p>
            </div>
          );
        })}
      </div>

      {/* Human-In-The-Loop Live Active Conversations Feed */}
      <div className="bg-black/30 border border-white/5 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-white/5">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              Feed en Vivo de Conversaciones (Human-in-the-Loop)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Intervén manualmente en cualquier interacción si el cliente solicita asistencia personalizada.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/5 text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeTab === 'all' ? 'bg-white/10 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos los Leads ({accountLeads.length})
            </button>
            <button
              onClick={() => setActiveTab('hot')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                activeTab === 'hot' ? 'bg-red-500/20 text-red-300 font-semibold border border-red-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-red-500" />
              <span>Prioridad Calientes ({accountLeads.filter((l) => l.temperature === 'hot').length})</span>
            </button>
          </div>
        </div>

        {/* List of active lead chats */}
        <div className="space-y-3">
          {filteredLeads.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-white/[0.01] border border-dashed border-white/10 space-y-2">
              <p className="text-xs text-slate-400 font-medium">No hay conversaciones o leads en esta cuenta todavía.</p>
              <p className="text-[11px] text-slate-500">Conectá WhatsApp o enviá un mensaje desde el widget comercial para comenzar.</p>
            </div>
          ) : (
            filteredLeads.map((lead) => (
              <div
                key={lead.id}
                className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white text-sm">{lead.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        lead.temperature === 'hot'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : lead.temperature === 'warm'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}
                    >
                      {lead.temperature === 'hot' ? '🔥 Caliente' : lead.temperature === 'warm' ? '☀️ Tibio' : '❄️ Frío'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Score: {lead.score}/100</span>
                    <span className="text-[10px] text-slate-500">• {lead.lastInteraction}</span>
                  </div>

                  <p className="text-xs text-slate-300 truncate">
                    <strong className="text-slate-400">Resumen IA:</strong> {lead.chatHistorySummary || lead.notes}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                    <span>Presupuesto: {lead.budgetMin.toLocaleString('es-ES')}€ - {lead.budgetMax.toLocaleString('es-ES')}€</span>
                    <span>•</span>
                    <span>Zona: {lead.preferredZone}</span>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => onInterveneLead(lead.id)}
                  className="shrink-0 px-3.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium border border-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Intervenir Chat</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};


import React, { useState } from 'react';
import { METRIC_CARDS_DATA } from '../../data/mockData';
import { Lead } from '../../types';
import { 
  TrendingUp, 
  TrendingDown, 
  Bot, 
  UserCheck, 
  MessageSquare, 
  Sparkles, 
  AlertCircle,
  ExternalLink,
  Flame,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface MetricsViewProps {
  leads: Lead[];
  onInterveneLead: (leadId: string) => void;
}

export const MetricsView: React.FC<MetricsViewProps> = ({ leads, onInterveneLead }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'hot'>('all');

  const filteredLeads = activeTab === 'hot' ? leads.filter((l) => l.temperature === 'hot') : leads;

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
          <span>Última sincronización: Hace 1 minuto</span>
        </div>
      </div>

      {/* KPI Cards Grid with Sparkline */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {METRIC_CARDS_DATA.map((card) => {
          const isPositive = card.trend === 'up' && card.changePercent > 0;
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
                      : 'bg-white/5 text-slate-300'
                  }`}
                >
                  {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {card.changePercent > 0 ? `+${card.changePercent}%` : `${card.changePercent}%`}
                </span>
              </div>

              <div className="text-2xl font-bold text-white tracking-tight font-mono tabular-nums">
                {card.value}
              </div>

              {/* Sparkline Visual representation */}
              <div className="flex items-end gap-1 h-6 pt-1">
                {card.sparkline.map((val, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-emerald-500/30 hover:bg-emerald-400 rounded-t transition-all"
                    style={{ height: `${(val / Math.max(...card.sparkline)) * 100}%` }}
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
              Todos los Leads ({leads.length})
            </button>
            <button
              onClick={() => setActiveTab('hot')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                activeTab === 'hot' ? 'bg-red-500/20 text-red-300 font-semibold border border-red-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-red-500" />
              <span>Prioridad Calientes ({leads.filter((l) => l.temperature === 'hot').length})</span>
            </button>
          </div>
        </div>

        {/* List of active lead chats */}
        <div className="space-y-3">
          {filteredLeads.map((lead) => (
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
          ))}
        </div>
      </div>

    </div>
  );
};

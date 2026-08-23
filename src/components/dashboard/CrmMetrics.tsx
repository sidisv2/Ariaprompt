import React, { useEffect, useState, useCallback } from 'react';
import {
  Users,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Download,
  RefreshCw,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export interface CrmMetricsData {
  totalLeads: number;
  qualifiedLeads: number;
  handedOver: number;
  activeLeads: number;
  closedLeads: number;
  conversionRate: number;
}

interface CrmMetricsProps {
  organizationId?: string;
  onRefreshFinished?: () => void;
}

export const CrmMetrics: React.FC<CrmMetricsProps> = ({
  organizationId,
  onRefreshFinished,
}) => {
  const [metrics, setMetrics] = useState<CrmMetricsData>({
    totalLeads: 0,
    qualifiedLeads: 0,
    handedOver: 0,
    activeLeads: 0,
    closedLeads: 0,
    conversionRate: 0,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (supabase) {
        // Consultar directamente la tabla leads
        let query = supabase.from('leads').select('*');
        if (organizationId) {
          query = query.or(`organization_id.eq.${organizationId},user_id.eq.${organizationId}`);
        }

        const { data: leadsData } = await query;
        if (leadsData && leadsData.length > 0) {
          const totalLeads = leadsData.length;
          const qualifiedLeads = leadsData.filter(
            (l: any) => l.status === 'qualified' || l.status === 'calificado' || l.status === 'in_progress' || l.status === 'new'
          ).length;
          const handedOver = leadsData.filter((l: any) => l.handled_by === 'human' || l.status === 'handover').length;
          const activeLeads = leadsData.filter((l: any) => l.handled_by === 'ia' || !l.handled_by).length;
          const closedLeads = leadsData.filter((l: any) => l.status === 'closed').length;
          const conversionRate = totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0;

          setMetrics({
            totalLeads,
            qualifiedLeads,
            handedOver,
            activeLeads,
            closedLeads,
            conversionRate,
          });
          return;
        }

        // Fallback a wa_conversations
        const { data: convs } = await supabase.from('wa_conversations').select('*');
        if (convs && convs.length > 0) {
          const totalLeads = convs.length;
          const qualifiedLeads = convs.filter((c: any) => c.status === 'qualified' || c.status === 'new').length;
          const handedOver = convs.filter((c: any) => c.status === 'handover' || c.status === 'human_handoff').length;
          const activeLeads = convs.filter((c: any) => c.status === 'active' || !c.status).length;
          const closedLeads = convs.filter((c: any) => c.status === 'closed').length;
          const conversionRate = totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0;

          setMetrics({
            totalLeads,
            qualifiedLeads,
            handedOver,
            activeLeads,
            closedLeads,
            conversionRate,
          });
        }
      }
    } catch (err: any) {
      console.warn('Silent CRM metrics calculation fallback:', err);
    } finally {
      setLoading(false);
      if (onRefreshFinished) onRefreshFinished();
    }
  }, [organizationId, onRefreshFinished]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      let token = '';
      if (supabase) {
        const { data: sessionData } = await supabase.auth.getSession();
        token = sessionData.session?.access_token || '';
      }

      const params = new URLSearchParams({
        action: 'export_leads',
        ...(organizationId ? { organizationId } : {}),
      });

      const exportUrl = `/api/crm?${params.toString()}`;

      // Trigger direct download via fetch blob
      const res = await fetch(exportUrl, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // Fallback: Direct window location trigger
        window.location.href = exportUrl;
      }
    } catch (err) {
      console.error('❌ Error exporting CSV:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar with Action Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Métricas del CRM & Conversión de Leads
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Estadísticas consolidadas de rendimiento comercial y exportación de datos en formato CSV.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Refrescar</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={exporting || metrics.totalLeads === 0}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
            ) : (
              <Download className="w-4 h-4 text-slate-950" />
            )}
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* KPI 4-Card Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Leads */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-white/10 space-y-2 backdrop-blur-xl hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Leads</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          {loading ? (
            <div className="h-8 bg-white/10 rounded w-16 animate-pulse" />
          ) : (
            <p className="text-3xl font-extrabold text-white font-mono">{metrics.totalLeads}</p>
          )}
          <p className="text-[10px] text-slate-500">Registrados en la plataforma</p>
        </div>

        {/* Qualified Leads */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 space-y-2 backdrop-blur-xl shadow-lg shadow-emerald-500/5 hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold">
            <span>Leads Calificados</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          {loading ? (
            <div className="h-8 bg-white/10 rounded w-16 animate-pulse" />
          ) : (
            <p className="text-3xl font-extrabold text-emerald-400 font-mono">{metrics.qualifiedLeads}</p>
          )}
          <p className="text-[10px] text-emerald-500/80">Presupuesto y zona validados</p>
        </div>

        {/* Handed Over */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-amber-500/20 space-y-2 backdrop-blur-xl hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between text-amber-400 text-xs font-semibold">
            <span>Derivados a Humano</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          {loading ? (
            <div className="h-8 bg-white/10 rounded w-16 animate-pulse" />
          ) : (
            <p className="text-3xl font-extrabold text-amber-400 font-mono">{metrics.handedOver}</p>
          )}
          <p className="text-[10px] text-slate-500">Pausados para atención manual</p>
        </div>

        {/* Conversion Rate */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-teal-500/30 space-y-2 backdrop-blur-xl hover:border-teal-500/50 transition-all">
          <div className="flex items-center justify-between text-teal-400 text-xs font-semibold">
            <span>Tasa de Conversión</span>
            <TrendingUp className="w-4 h-4 text-teal-400" />
          </div>
          {loading ? (
            <div className="h-8 bg-white/10 rounded w-20 animate-pulse" />
          ) : (
            <p className="text-3xl font-extrabold text-teal-300 font-mono">
              {metrics.conversionRate}%
            </p>
          )}
          <p className="text-[10px] text-slate-500">Porcentaje de cualificación</p>
        </div>

      </div>

    </div>
  );
};

import { useState, useEffect, useCallback } from 'react';
import { PlanLimits, getPlanLimits, getCurrentPeriod } from '../lib/planLimits';

export interface UsageData {
  agency_id: string;
  plan: PlanLimits;
  period: string;
  leads_count: number;
  leads_limit: number;
  leads_percentage: number;
  properties_count: number;
  properties_limit: number;
  properties_percentage: number;
  warning_leads: boolean;
  limit_reached_leads: boolean;
  warning_properties: boolean;
  limit_reached_properties: boolean;
}

export function useUsage(agencyId?: string | null) {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = useCallback(async () => {
    if (!agencyId) {
      const defaultPlan = getPlanLimits('solo_agent');
      setUsage({
        agency_id: 'guest',
        plan: defaultPlan,
        period: getCurrentPeriod(),
        leads_count: 0,
        leads_limit: defaultPlan.maxLeadsPerMonth,
        leads_percentage: 0,
        properties_count: 0,
        properties_limit: defaultPlan.maxProperties,
        properties_percentage: 0,
        warning_leads: false,
        limit_reached_leads: false,
        warning_properties: false,
        limit_reached_properties: false,
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/usage?agency_id=${encodeURIComponent(agencyId)}`, {
        headers: {
          'x-agency-id': agencyId,
        },
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setUsage(json.data);
          setError(null);
          return;
        }
      }

      // Fallback if API serverless unavailable
      const defaultPlan = getPlanLimits('solo_agent');
      setUsage({
        agency_id: agencyId,
        plan: defaultPlan,
        period: getCurrentPeriod(),
        leads_count: 0,
        leads_limit: defaultPlan.maxLeadsPerMonth,
        leads_percentage: 0,
        properties_count: 0,
        properties_limit: defaultPlan.maxProperties,
        properties_percentage: 0,
        warning_leads: false,
        limit_reached_leads: false,
        warning_properties: false,
        limit_reached_properties: false,
      });
    } catch (err: any) {
      console.warn('useUsage fetch error:', err);
      setError(err.message || 'Error al obtener consumo');
    } finally {
      setLoading(false);
    }
  }, [agencyId]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  return { usage, loading, error, refreshUsage: fetchUsage };
}

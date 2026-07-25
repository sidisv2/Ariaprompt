import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getBackendSupabaseClient } from '../src/lib/backendSupabase';
import { getPlanLimits, getCurrentPeriod } from '../src/lib/planLimits';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-agency-id');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = getBackendSupabaseClient();
  const agencyId = (req.query.agency_id as string) || (req.headers['x-agency-id'] as string);

  if (!supabase || !agencyId) {
    // Return default plan limits info for unauthenticated or memory mode
    const defaultLimits = getPlanLimits('solo_agent');
    return res.status(200).json({
      success: true,
      data: {
        agency_id: agencyId || 'demo_agency',
        plan: defaultLimits,
        period: getCurrentPeriod(),
        leads_count: 0,
        leads_limit: defaultLimits.maxLeadsPerMonth,
        leads_percentage: 0,
        properties_count: 0,
        properties_limit: defaultLimits.maxProperties,
        properties_percentage: 0,
      },
    });
  }

  try {
    const period = getCurrentPeriod();

    // 1. Fetch profile to get plan_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan_id')
      .eq('id', agencyId)
      .single();

    const planLimits = getPlanLimits(profile?.plan_id);

    // 2. Fetch usage_records for this month's leads_count
    const { data: usageRec } = await supabase
      .from('usage_records')
      .select('leads_count')
      .eq('agency_id', agencyId)
      .eq('period', period)
      .single();

    const leadsCount = usageRec?.leads_count || 0;

    // 3. Fetch active properties_count
    const { count: propertiesCount } = await supabase
      .from('propiedades')
      .select('id', { count: 'exact', head: true })
      .eq('agency_id', agencyId);

    const activePropsCount = propertiesCount || 0;

    const leadsPercentage = Math.min(100, Math.round((leadsCount / planLimits.maxLeadsPerMonth) * 100));
    const propertiesPercentage = Math.min(100, Math.round((activePropsCount / planLimits.maxProperties) * 100));

    return res.status(200).json({
      success: true,
      data: {
        agency_id: agencyId,
        plan: planLimits,
        period,
        leads_count: leadsCount,
        leads_limit: planLimits.maxLeadsPerMonth,
        leads_percentage: leadsPercentage,
        properties_count: activePropsCount,
        properties_limit: planLimits.maxProperties,
        properties_percentage: propertiesPercentage,
        warning_leads: leadsPercentage >= 90,
        limit_reached_leads: leadsCount >= planLimits.maxLeadsPerMonth,
        warning_properties: propertiesPercentage >= 90,
        limit_reached_properties: activePropsCount >= planLimits.maxProperties,
      },
    });
  } catch (err: any) {
    console.error('Error fetching usage:', err);
    return res.status(500).json({ error: 'Internal server error fetching usage metrics' });
  }
}

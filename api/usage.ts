import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

function getBackendSupabaseClient() {
  const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim();
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseUrl.includes('your-supabase')) {
    return null;
  }
  try {
    return createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch (err) {
    return null;
  }
}

const PLAN_LIMITS: Record<string, { name: string; maxLeadsPerMonth: number; maxProperties: number }> = {
  normal: { name: 'Gratuito', maxLeadsPerMonth: 5, maxProperties: 3 },
  solo: { name: 'Solo Agent', maxLeadsPerMonth: 100, maxProperties: 20 },
  pro: { name: 'Agency Pro', maxLeadsPerMonth: 500, maxProperties: 100 },
  desarrolladores: { name: 'Desarrolladores', maxLeadsPerMonth: 999999, maxProperties: 999999 },
};

function getPlanLimits(tier?: string | null) {
  const key = (tier || 'normal').toLowerCase();
  return PLAN_LIMITS[key] || PLAN_LIMITS.normal;
}

function getCurrentPeriod(date: Date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-agency-id');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = getBackendSupabaseClient();
  const agencyId = (req.query.agency_id as string) || (req.headers['x-agency-id'] as string);

  if (!supabase || !agencyId) {
    const defaultLimits = getPlanLimits('normal');
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan_id')
      .eq('id', agencyId)
      .single();

    const planLimits = getPlanLimits(profile?.plan_id);

    const { data: usageRec } = await supabase
      .from('usage_records')
      .select('leads_count')
      .eq('agency_id', agencyId)
      .eq('period', period)
      .single();

    const leadsCount = usageRec?.leads_count || 0;

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

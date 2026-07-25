import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getBackendSupabaseClient } from '../src/lib/backendSupabase';
import { INITIAL_LEADS } from '../src/data/mockData';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabase = getBackendSupabaseClient();

  if (req.method === 'GET') {
    if (supabase) {
      try {
        const agencyId = (req.query.agency_id as string) || (req.headers['x-agency-id'] as string);
        let query = supabase.from('leads').select('*').order('created_at', { ascending: false });
        
        if (agencyId) {
          query = query.eq('agency_id', agencyId);
        }

        const { data, error } = await query;
        if (!error && data) {
          return res.status(200).json({ success: true, data, source: 'supabase' });
        }
      } catch (err) {
        console.warn('Vercel API fetch leads fallback:', err);
      }
    }
    return res.status(200).json({ success: true, data: INITIAL_LEADS, source: 'memory' });
  }

  if (req.method === 'POST') {
    const agencyId = (req.body.agency_id as string) || (req.headers['x-agency-id'] as string);
    const newLead = {
      id: req.body.id || `lead-${Date.now()}`,
      created_at: new Date().toISOString(),
      status: 'nuevo',
      temperature: 'warm',
      score: 50,
      ...req.body,
    };

    if (supabase && agencyId) {
      try {
        const { getPlanLimits, getCurrentPeriod, checkLeadLimit } = await import('../src/lib/planLimits');
        const period = getCurrentPeriod();

        // 1. Fetch agency profile to check plan
        const { data: profile } = await supabase
          .from('profiles')
          .select('plan_id')
          .eq('id', agencyId)
          .single();

        // 2. Fetch current month lead usage
        const { data: usageRec } = await supabase
          .from('usage_records')
          .select('leads_count')
          .eq('agency_id', agencyId)
          .eq('period', period)
          .single();

        const currentLeadsCount = usageRec?.leads_count || 0;
        const checkResult = checkLeadLimit(profile?.plan_id, currentLeadsCount);

        if (!checkResult.allowed) {
          return res.status(403).json({
            error: 'LIMIT_EXCEEDED',
            code: 403,
            message: checkResult.error,
          });
        }

        // 3. Insert lead
        const { data, error } = await supabase.from('leads').insert([newLead]).select().single();
        if (!error && data) {
          // 4. Increment usage atomically via RPC or upsert
          await supabase.rpc('increment_lead_usage', {
            p_agency_id: agencyId,
            p_period: period,
          });

          return res.status(200).json({ success: true, data, source: 'supabase' });
        }
      } catch (err) {
        console.warn('Vercel API create lead fallback:', err);
      }
    }

    return res.status(200).json({ success: true, data: newLead, source: 'memory' });
  }

  if (req.method === 'PATCH') {
    const { id } = req.query;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Missing lead id' });
    }

    if (supabase) {
      try {
        const { data, error } = await supabase.from('leads').update(req.body).eq('id', id).select().single();
        if (!error && data) {
          return res.status(200).json({ success: true, data, source: 'supabase' });
        }
      } catch (err) {
        console.warn('Vercel API update lead fallback:', err);
      }
    }

    return res.status(200).json({ success: true, data: { id, ...req.body }, source: 'memory' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

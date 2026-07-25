import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getBackendSupabaseClient } from '../src/lib/backendSupabase';
import { INITIAL_PROPERTIES } from '../src/data/mockData';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabase = getBackendSupabaseClient();

  if (req.method === 'GET') {
    if (supabase) {
      try {
        const agencyId = (req.query.agency_id as string) || (req.headers['x-agency-id'] as string);
        let query = supabase.from('propiedades').select('*').order('created_at', { ascending: false });
        
        if (agencyId) {
          query = query.eq('agency_id', agencyId);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return res.status(200).json({ success: true, data, source: 'supabase' });
        }
      } catch (err) {
        console.warn('Vercel API fetch properties fallback:', err);
      }
    }
    return res.status(200).json({ success: true, data: INITIAL_PROPERTIES, source: 'memory' });
  }

  if (req.method === 'POST') {
    const agencyId = (req.body.agency_id as string) || (req.headers['x-agency-id'] as string);
    const newProperty = {
      id: req.body.id || `prop-${Date.now()}`,
      created_at: new Date().toISOString(),
      documents: [],
      featured: false,
      status: 'available',
      ...req.body,
    };

    if (supabase && agencyId) {
      try {
        const { getPlanLimits, checkPropertyLimit } = await import('../src/lib/planLimits');

        // 1. Fetch profile plan_id
        const { data: profile } = await supabase
          .from('profiles')
          .select('plan_id')
          .eq('id', agencyId)
          .single();

        // 2. Count active properties
        const { count: activePropsCount } = await supabase
          .from('propiedades')
          .select('id', { count: 'exact', head: true })
          .eq('agency_id', agencyId);

        const currentCount = activePropsCount || 0;
        const checkResult = checkPropertyLimit(profile?.plan_id, currentCount);

        if (!checkResult.allowed) {
          return res.status(403).json({
            error: 'LIMIT_EXCEEDED',
            code: 403,
            message: checkResult.error,
          });
        }

        // 3. Insert property
        const { data, error } = await supabase.from('propiedades').insert([newProperty]).select().single();
        if (!error && data) {
          return res.status(200).json({ success: true, data, source: 'supabase' });
        }
      } catch (err) {
        console.warn('Vercel API create property fallback:', err);
      }
    }

    return res.status(200).json({ success: true, data: newProperty, source: 'memory' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

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
    const newProperty = {
      id: req.body.id || `prop-${Date.now()}`,
      created_at: new Date().toISOString(),
      documents: [],
      featured: false,
      status: 'available',
      ...req.body,
    };

    if (supabase) {
      try {
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

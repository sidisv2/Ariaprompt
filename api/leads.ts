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
    const newLead = {
      id: req.body.id || `lead-${Date.now()}`,
      created_at: new Date().toISOString(),
      status: 'nuevo',
      temperature: 'warm',
      score: 50,
      ...req.body,
    };

    if (supabase) {
      try {
        const { data, error } = await supabase.from('leads').insert([newLead]).select().single();
        if (!error && data) {
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

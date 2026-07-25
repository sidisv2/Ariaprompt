import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getBackendSupabaseClient } from '../src/lib/backendSupabase';
import { INITIAL_BOT_CONFIG } from '../src/data/mockData';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabase = getBackendSupabaseClient();

  if (req.method === 'GET') {
    if (supabase) {
      try {
        const userId = (req.query.user_id as string) || (req.headers['x-user-id'] as string);
        if (userId) {
          const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
          if (!error && data) {
            return res.status(200).json({ success: true, data, source: 'supabase' });
          }
        }
      } catch (err) {
        console.warn('Vercel API fetch bot-config fallback:', err);
      }
    }
    return res.status(200).json({ success: true, data: INITIAL_BOT_CONFIG, source: 'memory' });
  }

  if (req.method === 'POST') {
    if (supabase && req.body.user_id) {
      try {
        const { data, error } = await supabase.from('profiles').upsert(req.body, { onConflict: 'id' }).select().single();
        if (!error && data) {
          return res.status(200).json({ success: true, data, source: 'supabase' });
        }
      } catch (err) {
        console.warn('Vercel API save bot-config fallback:', err);
      }
    }
    return res.status(200).json({ success: true, data: { ...INITIAL_BOT_CONFIG, ...req.body }, source: 'memory' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

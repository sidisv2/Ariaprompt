import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getBackendSupabaseClient } from '../src/lib/backendSupabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const supabase = getBackendSupabaseClient();
  return res.status(200).json({ 
    status: 'ok', 
    service: 'PropTech AI Agent Platform Vercel API', 
    supabaseConnected: !!supabase,
    timestamp: new Date().toISOString() 
  });
}

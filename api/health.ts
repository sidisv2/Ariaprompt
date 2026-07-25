import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  
  const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
  const hasSupabase = Boolean(supabaseUrl && !supabaseUrl.includes('placeholder'));

  return res.status(200).json({ 
    status: 'ok', 
    service: 'PropTech AI Agent Platform Vercel API', 
    supabaseConnected: hasSupabase,
    timestamp: new Date().toISOString() 
  });
}

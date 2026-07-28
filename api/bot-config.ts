import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

function getBackendSupabaseClient() {
  const supabaseUrl = (
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ''
  ).trim();

  const supabaseKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ''
  ).trim();

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseUrl.includes('your-supabase')) {
    return null;
  }

  try {
    return createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  } catch (err) {
    console.warn('Backend Supabase initialization warning:', err);
    return null;
  }
}

const INITIAL_BOT_CONFIG = {
  agencyName: 'Aria Prop LATAM',
  botName: 'Aria',
  welcomeMessage: '¡Hola! Soy Aria, tu asistente inmobiliario 24/7. ¿En qué te puedo ayudar hoy?',
  fallbackMessage: 'Disculpa, no entendí tu consulta. Déjame tu teléfono y un asesor se pondrá en contacto.',
  tone: 'professional',
  customRules: 'Responde siempre con amabilidad y solicita datos de contacto si el cliente muestra interés.',
  leadCaptureFields: ['name', 'email', 'phone', 'budget'],
  enabledChannels: {
    widget: true,
    whatsapp: true,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id');

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
    if (supabase && req.body?.user_id) {
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

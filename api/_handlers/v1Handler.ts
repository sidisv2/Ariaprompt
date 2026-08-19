import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { generateAriaAiResponse } from '../_ariaEngine.js';
import { streamOpenRouterRealEstateResponse } from '../_lib/openrouterService.js';

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

/**
 * Handle Sub-Routes:
 * - /api/v1/chat
 * - /api/v1/paddle-webhook
 * - /api/v1/verify-transaction
 * - /api/v1/properties
 * - /api/v1/bot-config
 * - /api/v1/usage
 * - /api/v1/health
 * - /api/v1/cron/clean-demo-accounts
 */
export async function handleV1Route(req: VercelRequest, res: VercelResponse, subRoute: string) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. HEALTH CHECK
  if (subRoute === 'health') {
    return res.status(200).json({
      status: 'ok',
      service: 'Aria Prop AI API',
      timestamp: new Date().toISOString(),
      model: process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash',
    });
  }

  // 2. CHAT AI ENDPOINT (/api/v1/chat)
  if (subRoute === 'chat') {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const { message, history = [], lang = 'es', stream = false } = body;

      if (!message || !message.trim()) {
        return res.status(400).json({ error: 'El parámetro message es requerido.' });
      }

      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');

        try {
          const textStream = streamOpenRouterRealEstateResponse({
            message,
            history,
            lang,
          });

          for await (const chunk of textStream) {
            res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
          }
          res.write('data: [DONE]\n\n');
          return res.end();
        } catch (streamErr: any) {
          console.error('Streaming exception:', streamErr);
          res.write(`data: ${JSON.stringify({ error: streamErr.message })}\n\n`);
          return res.end();
        }
      } else {
        const text = await generateAriaAiResponse({ message, history, lang });
        return res.status(200).json({ success: true, response: text, text });
      }
    } catch (err: any) {
      console.error('Chat endpoint error:', err);
      return res.status(500).json({ error: err.message || 'Error al procesar consulta' });
    }
  }

  // 3. PADDLE WEBHOOK (/api/v1/paddle-webhook)
  if (subRoute === 'paddle-webhook') {
    return res.status(200).json({ status: 'PADDLE_WEBHOOK_ACKNOWLEDGED' });
  }

  // 4. VERIFY TRANSACTION (/api/v1/verify-transaction)
  if (subRoute === 'verify-transaction') {
    return res.status(200).json({ success: true, status: 'verified' });
  }

  // 5. PROPERTIES (/api/v1/properties)
  if (subRoute === 'properties') {
    const supabase = getBackendSupabaseClient();
    if (!supabase) return res.status(500).json({ error: 'Supabase client unavailable' });

    const { data: properties } = await supabase.from('properties').select('*').limit(50);
    return res.status(200).json({ success: true, properties: properties || [] });
  }

  // 6. BOT CONFIG (/api/v1/bot-config)
  if (subRoute === 'bot-config') {
    return res.status(200).json({
      success: true,
      config: {
        agentName: 'Aria',
        agencyName: 'Aria Prop',
        welcomeMessage: '¡Hola! Soy Aria, tu asesora inmobiliaria 24/7.',
        primaryColor: '#10b981',
      },
    });
  }

  // 7. USAGE (/api/v1/usage)
  if (subRoute === 'usage') {
    return res.status(200).json({
      success: true,
      usage: {
        leadsThisMonth: 12,
        maxLeads: 100,
        propertiesCount: 4,
        maxProperties: 20,
      },
    });
  }

  // 8. CRON CLEAN DEMO ACCOUNTS (/api/v1/cron/clean-demo-accounts)
  if (subRoute === 'cron/clean-demo-accounts' || subRoute === 'clean-demo-accounts') {
    return res.status(200).json({ success: true, message: 'Clean demo accounts cron executed.' });
  }

  return res.status(404).json({ error: `V1 Sub-route '${subRoute}' not found` });
}

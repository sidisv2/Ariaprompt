import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import {
  generateOpenRouterRealEstateResponse,
  streamOpenRouterRealEstateResponse,
} from './_lib/openrouterService.js';

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

const MARKET_CATALOG = [
  {
    id: 'mendoza-rent-01',
    title: 'Departamento 2 Ambientes Amoblado en Alquiler - Barrio Bombal',
    type: 'apartment',
    price: 450,
    address: 'Av. España 1450',
    zone: 'Barrio Bombal',
    city: 'Mendoza',
    country: 'Argentina',
    bedrooms: 1,
    areaM2: 52,
    description: 'Excelente departamento totalmente amoblado y equipado listo para ingresar. Edificio moderno con seguridad 24hs.',
  },
  {
    id: 'prop-101',
    title: 'Penthouse de Ultra Lujo con Terraza Privada y Vista a Campo de Golf',
    type: 'penthouse',
    price: 1250000,
    address: 'Campos Elíseos 400',
    zone: 'Polanco',
    city: 'Ciudad de México',
    country: 'México',
    bedrooms: 4,
    areaM2: 380,
    description: 'Residencia de lujo con acabados de mármol importado, domótica integral y piscina privada.',
  },
  {
    id: 'prop-102',
    title: 'Casa Residencial en Barrio Cerrado El Poblado',
    type: 'house',
    price: 680000,
    address: 'Calle 10 Sur 28',
    zone: 'El Poblado',
    city: 'Medellín',
    country: 'Colombia',
    bedrooms: 5,
    areaM2: 420,
    description: 'Moderna casa independiente rodeada de naturaleza con seguridad privada.',
  },
  {
    id: 'prop-103',
    title: 'Departamento Moderno 3 Ambientes en Puerto Madero',
    type: 'apartment',
    price: 390000,
    address: 'Juana Manso 1100',
    zone: 'Puerto Madero',
    city: 'Buenos Aires',
    country: 'Argentina',
    bedrooms: 2,
    areaM2: 95,
    description: 'Piso alto con vista panorámica al río y la reserva ecológica.',
  },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Force SSE headers for Vercel Serverless Function response streaming
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  if (typeof (res as any).flushHeaders === 'function') {
    try { (res as any).flushHeaders(); } catch {}
  }

  const sendChunk = (data: any) => {
    try {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
      if (typeof (res as any).flush === 'function') {
        (res as any).flush();
      }
    } catch (err) {
      console.warn('SSE sendChunk write warning:', err);
    }
  };

  try {
    let body = req.body || {};
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    const { message, history = [], context = 'general', apiKey, lang = 'es' } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      sendChunk({ text: '⚠️ Por favor ingresa una consulta válida.' });
      sendChunk({ done: true });
      return res.end();
    }

    const trimmedMsg = message.trim();

    const catalogContext = MARKET_CATALOG.map(
      (p) =>
        `- [ID: ${p.id}] "${p.title}" (${p.type.toUpperCase()} - ${p.price < 5000 ? 'ALQUILER' : 'VENTA'}) en ${p.address}, ${p.zone}, ${p.city}, ${p.country}. Precio: $${p.price.toLocaleString('en-US')} USD ${p.price < 5000 ? '/mes' : ''}. ${p.bedrooms} hab, ${p.areaM2} m². FUENTE: Catálogo Directo de la Agencia. ${p.description}`
    ).join('\n');

    try {
      const textStream = streamOpenRouterRealEstateResponse({
        message: trimmedMsg,
        history: history.map((h: { sender: string; content: string }) => ({
          sender: h.sender as 'user' | 'bot',
          content: h.content,
        })),
        propertyContext: catalogContext,
        lang,
        contextRole: context,
        agentName: 'Aria',
        agencyName: 'Aria Prop LATAM',
        apiKey,
      });

      let tokenCount = 0;
      for await (const chunkText of textStream) {
        tokenCount++;
        sendChunk({ text: chunkText });
      }

      if (tokenCount === 0) {
        const generatedText = await generateOpenRouterRealEstateResponse({
          message: trimmedMsg,
          history: history.map((h: { sender: string; content: string }) => ({
            sender: h.sender as 'user' | 'bot',
            content: h.content,
          })),
          propertyContext: catalogContext,
          lang,
          contextRole: context,
          agentName: 'Aria',
          agencyName: 'Aria Prop LATAM',
          apiKey,
        });
        sendChunk({ text: generatedText });
      }

      sendChunk({ done: true });
      return res.end();
    } catch (openRouterErr: any) {
      const errMsg = openRouterErr?.message || 'Error al comunicar con la IA de OpenRouter';
      console.error('❌ OpenRouter API Call Error in api/chat:', errMsg);
      sendChunk({ error: errMsg });
      return res.end();
    }
  } catch (globalErr: any) {
    const errMsg = globalErr?.message || 'Error interno del servidor';
    console.error('❌ API Chat Global Error:', errMsg);
    sendChunk({ error: errMsg });
    return res.end();
  }
}

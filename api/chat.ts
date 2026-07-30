import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { INITIAL_BOT_CONFIG } from '../src/data/mockData';
import {
  searchMultiSourceRealEstate,
  MARKET_REAL_ESTATE_DATABASE,
} from '../src/lib/multiSourceRealEstateEngine';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS for Vercel deployment
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Stream SSE headers early to ensure connection remains open and unbuffered on Vercel
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  if (typeof (res as any).flushHeaders === 'function') {
    try { (res as any).flushHeaders(); } catch {}
  }

  const sendChunk = (data: any) => {
    try {
      if (typeof res.write === 'function') {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
        if (typeof (res as any).flush === 'function') {
          (res as any).flush();
        }
      }
    } catch (err) {
      console.warn('SSE sendChunk write warning:', err);
    }
  };

  try {
    const { message, history = [], context = 'general', apiKey, lang = 'es' } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      sendChunk({ text: '⚠️ Por favor ingresa una consulta válida.' });
      sendChunk({ done: true });
      return res.end();
    }

    const trimmedMsg = message.trim();
    const lowerMsg = trimmedMsg.toLowerCase();

    const langNames: Record<string, string> = {
      es: 'Español',
      en: 'English',
      pt: 'Português',
    };
    const targetLangName = langNames[lang] || 'Español';

    const rawKey =
      apiKey ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.VITE_GEMINI_API_KEY ||
      '';
    const cleanApiKey = rawKey.replace(/^["']|["']$/g, '').trim();

    let ai: any = null;
    if (cleanApiKey) {
      try {
        const genAiModule = await import('@google/genai');
        const GoogleGenAI = genAiModule.GoogleGenAI;
        if (GoogleGenAI) {
          ai = new GoogleGenAI({ apiKey: cleanApiKey });
        }
      } catch (err) {
        console.error('GoogleGenAI Dynamic Import Error:', err);
        ai = null;
      }
    }

    const searchResult = searchMultiSourceRealEstate(trimmedMsg);

    const multiSourceCatalogContext = MARKET_REAL_ESTATE_DATABASE.map(
      (p) =>
        `- [ID: ${p.id}] "${p.title}" (${p.type.toUpperCase()} - ${p.price < 5000 ? 'ALQUILER' : 'VENTA'}) en DIRECCIÓN REAL VERIFICADA: ${p.location.address}, ${p.location.zone}, ${p.location.city}, ${p.location.country || ''}. MAPA: ${p.location.googleMapsUrl || '#'}. Precio: $${p.price.toLocaleString('en-US')} USD ${p.price < 5000 ? '/mes' : ''}. ${p.features.bedrooms} hab / ${p.features.rooms || p.features.bedrooms + 1} ambientes, ${p.features.areaM2} m². FUENTE: Catálogo Directo de la Agencia. Descripción: ${p.description}`
    ).join('\n');

    const systemPrompt = `
Eres Aria Prop, el asistente virtual de una plataforma inmobiliaria que opera en toda América.

IDIOMA PREDETERMINADO DE RESPUESTA: ${targetLangName.toUpperCase()}.
Debes responder SIEMPRE en este idioma (${targetLangName}) desde el primer saludo y en todas tus explicaciones.
Excepción: Si el usuario escribe su mensaje en un idioma distinto (ej: si escribe en inglés o portugués), prioriza responder en el idioma utilizado por el usuario en su mensaje.

Tus objetivos, en este orden:
1. Entender qué busca el usuario (comprar o alquilar, tipo de propiedad, zona, presupuesto, ambientes).
2. Consultar únicamente los datos reales disponibles en FUENTE_DE_DATOS y recomendar las opciones que mejor se ajusten.
3. Facilitar el contacto directo o agendar una visita.

## FUENTE_DE_DATOS (Base/índice de la agencia):
${multiSourceCatalogContext}

## REGLAS DE ATRIBUCIÓN Y TRANSPARENCIA (ESTRICTAS):
- NUNCA menciones ni atribuyas publicaciones a fuentes externas como "MercadoLibre", "Zonaprop", "Idealista" o "Properati", ya que las propiedades actuales pertenecen al "Catálogo Directo de la Agencia".
- Presenta las propiedades siempre indicando como fuente: "Catálogo Directo de la Agencia" o "Inventario Verificado Aria Prop".
- SI EL USUARIO PIDE ALQUILER: Muestra exclusivamente propiedades marcadas como ALQUILER (ej. $450 USD/mes). Nunca muestres opciones de venta cuando el usuario pida alquiler.
- SI LA CIUDAD NO ESTÁ EN FUENTE_DE_DATOS (ej. San Rafael): Decí de forma transparente que actualmente no contás con propiedades verificadas en esa ciudad específica dentro del catálogo directo de la agencia, y ofrecé conectar por WhatsApp con un asesor humano para buscar opciones en esa zona.

Responde siempre en ${targetLangName} (o en el idioma del usuario) con mensajes cortos, amables y conversacionales (2-4 líneas).
`;

    if (ai) {
      try {
        const formattedContents = [
          ...history.map((h: { sender: string; content: string }) => ({
            role: h.sender === 'user' ? 'user' : 'model',
            parts: [{ text: h.content }],
          })),
          { role: 'user', parts: [{ text: trimmedMsg }] },
        ];

        const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

        const responseStream = await ai.models.generateContentStream({
          model: modelName,
          contents: formattedContents,
          config: {
            systemInstruction: systemPrompt,
          },
        });

        let receivedAnyText = false;
        for await (const chunk of responseStream) {
          if (chunk.text) {
            receivedAnyText = true;
            sendChunk({ text: chunk.text });
          }
        }

        if (receivedAnyText) {
          sendChunk({ done: true });
          return res.end();
        }
      } catch (geminiErr: any) {
        console.error('Gemini Stream Call Error:', geminiErr?.message || geminiErr);
        sendChunk({
          text: `⚠️ **Aviso de API**: Error en llamada a modelo Gemini (${geminiErr?.message || 'Error de conexión'}). Mostrando respuesta comparativa de contingencia del catálogo directo:\n\n`,
        });
      }
    }

    // Deterministic Dynamic Comparator Fallback
    let responseText = '';
    let primaryPropId: string | undefined;

    if (
      lowerMsg === 'hola' ||
      lowerMsg === 'hola!' ||
      lowerMsg === 'buenas' ||
      lowerMsg === 'buenos dias' ||
      lowerMsg === 'hello' ||
      lowerMsg === 'hi'
    ) {
      responseText = `¡Hola! Soy Aria, tu asistente inmobiliario 24/7. ¿Buscas comprar o alquilar alguna propiedad en particular hoy?`;
    } else {
      const isAlquiler = lowerMsg.includes('alquiler') || lowerMsg.includes('rent') || lowerMsg.includes('renta');

      if (searchResult.exactMatchCount > 0 && searchResult.matchedProperties.length > 0) {
        const topProp = searchResult.matchedProperties[0];
        primaryPropId = topProp.id;
        responseText = `¡Hola! Encontré esta excelente opción en nuestro catálogo verificado:\n\n🏡 **${topProp.title}** en ${topProp.location.zone}, ${topProp.location.city}\n• **Precio:** $${topProp.price.toLocaleString('en-US')} USD ${isAlquiler ? '/mes' : ''}\n• **Ambientes:** ${topProp.features.bedrooms} dormitorios (${topProp.features.areaM2} m²)\n• **Dirección:** ${topProp.location.address}\n\n¿Te gustaría agendar una visita presencial o recibir más detalles por WhatsApp?`;
      } else {
        responseText = `Hola. Actualmente estamos actualizando las propiedades verificadas para esa búsqueda específica en nuestro catálogo directo. ¿Te gustaría que te conecte con un asesor humano por WhatsApp para enviarte las opciones disponibles en la zona?`;
      }
    }

    const words = responseText.split(' ');
    for (const word of words) {
      sendChunk({ text: word + ' ' });
      await new Promise((r) => setTimeout(r, 12));
    }
    sendChunk({ done: true, recommendedPropertyId: primaryPropId });
    return res.end();
  } catch (globalErr: any) {
    console.error('API Chat Global Error:', globalErr);
    try {
      sendChunk({
        text: '⚠️ **Aviso**: Ocurrió una desconexión temporal en el servidor. Tu consulta fue procesada mediante nuestro catálogo directo de contingencia.',
      });
      sendChunk({ done: true });
    } catch {}
    if (typeof res.end === 'function') {
      res.end();
    }
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

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

function buildMemoryAwareResponse(
  message: string,
  history: { sender: string; content: string }[]
) {
  const trimmed = message.trim();
  const lowerMsg = trimmed.toLowerCase();

  const fullUserQuery = [
    ...history.filter((h) => h.sender === 'user').map((h) => h.content),
    trimmed,
  ].join(' ');
  const fullLowerQuery = fullUserQuery.toLowerCase();

  let lastProp: (typeof MARKET_CATALOG)[0] | undefined = undefined;

  for (let i = history.length - 1; i >= 0; i--) {
    const item = history[i];
    if (item.sender === 'bot' || item.sender === 'model') {
      const matched = MARKET_CATALOG.find(
        (p) => item.content.includes(p.title) || item.content.includes(p.address) || item.content.includes(p.id) || item.content.includes(p.zone)
      );
      if (matched) {
        lastProp = matched;
        break;
      }
    }
  }

  if (!lastProp) {
    lastProp = MARKET_CATALOG.find(
      (p) =>
        fullLowerQuery.includes(p.city.toLowerCase()) ||
        fullLowerQuery.includes(p.zone.toLowerCase())
    );
  }

  const isAskingArea = lowerMsg.includes('metro') || lowerMsg.includes('m2') || lowerMsg.includes('superficie') || lowerMsg.includes('calle') || lowerMsg.includes('queda') || lowerMsg.includes('direccion') || lowerMsg.includes('dirección');
  const isAskingPrice = lowerMsg.includes('precio') || lowerMsg.includes('cuanto cuesta') || lowerMsg.includes('cuánto cuesta') || lowerMsg.includes('valor');
  const isAskingBedrooms = lowerMsg.includes('dormitorio') || lowerMsg.includes('habitacion') || lowerMsg.includes('habitación') || lowerMsg.includes('cuarto') || lowerMsg.includes('ambiente');
  const isAskingZoneOptions = lowerMsg.includes('esa zona') || lowerMsg.includes('otra opción') || lowerMsg.includes('otra opcion') || lowerMsg.includes('misma zona') || lowerMsg.includes('disponible');

  if (lastProp) {
    if (isAskingArea) {
      return {
        text: `La propiedad **${lastProp.title}** tiene **${lastProp.areaM2} m²** de superficie y está ubicada sobre la calle **${lastProp.address}** (${lastProp.zone}, ${lastProp.city}).\n\n¿Te gustaría coordinar una visita presencial?`,
        recommendedPropId: lastProp.id,
      };
    }
    if (isAskingPrice) {
      return {
        text: `El precio de **${lastProp.title}** es de **$${lastProp.price.toLocaleString('en-US')} USD** ${lastProp.price < 5000 ? '/mes' : ''}.\n\n¿Deseas conocer las condiciones de ingreso o agendar una visita?`,
        recommendedPropId: lastProp.id,
      };
    }
    if (isAskingBedrooms) {
      return {
        text: `Como mencionamos, **${lastProp.title}** cuenta con **${lastProp.bedrooms} dormitorio(s)** y un diseño con excelente distribución.\n\n¿Quieres que te envíe más fotos o los detalles completos?`,
        recommendedPropId: lastProp.id,
      };
    }
    if (isAskingZoneOptions) {
      const zoneProps = MARKET_CATALOG.filter((p) => p.city.toLowerCase() === lastProp?.city.toLowerCase() || p.zone.toLowerCase() === lastProp?.zone.toLowerCase());
      if (zoneProps.length > 0) {
        const propList = zoneProps.map((p) => `• **${p.title}** ($${p.price.toLocaleString('en-US')} USD) en ${p.address}`).join('\n');
        return {
          text: `En ${lastProp.city} (${lastProp.zone}) tenemos las siguientes opciones disponibles en nuestro catálogo verificado:\n\n${propList}\n\n¿Cuál de ellas te gustaría consultar en detalle?`,
          recommendedPropId: zoneProps[0].id,
        };
      }
    }
  }

  if (
    lowerMsg === 'hola' ||
    lowerMsg === 'hola!' ||
    lowerMsg === 'buenas' ||
    lowerMsg === 'buenos dias' ||
    lowerMsg === 'hello' ||
    lowerMsg === 'hi'
  ) {
    return {
      text: `¡Hola! Soy Aria, tu asistente inmobiliario 24/7. ¿Buscas comprar o alquilar alguna propiedad en particular hoy?`,
      recommendedPropId: undefined,
    };
  }

  const matches = MARKET_CATALOG.filter(
    (p) =>
      fullLowerQuery.includes(p.city.toLowerCase()) ||
      fullLowerQuery.includes(p.zone.toLowerCase()) ||
      fullLowerQuery.includes(p.type.toLowerCase()) ||
      (fullLowerQuery.includes('alquiler') && p.price < 5000)
  );

  if (matches.length > 0) {
    const topProp = matches[0];
    return {
      text: `¡Hola! Encontré esta excelente opción en nuestro catálogo verificado:\n\n🏡 **${topProp.title}** en ${topProp.zone}, ${topProp.city}\n• **Precio:** $${topProp.price.toLocaleString('en-US')} USD ${topProp.price < 5000 ? '/mes' : ''}\n• **Ambientes:** ${topProp.bedrooms} dormitorios (${topProp.areaM2} m²)\n• **Dirección:** ${topProp.address}\n\n¿Te gustaría agendar una visita presencial o recibir más detalles por WhatsApp?`,
      recommendedPropId: topProp.id,
    };
  }

  return {
    text: `Hola. Recordando tu consulta, actualmente estamos actualizando las propiedades verificadas para esa búsqueda específica en nuestro catálogo directo. ¿Te gustaría que te conecte con un asesor humano por WhatsApp para enviarte las opciones disponibles en la zona?`,
    recommendedPropId: undefined,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

  const isSSE = Boolean(req.headers.accept && req.headers.accept.includes('text/event-stream'));
  let accumulatedText = '';

  if (isSSE) {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    if (typeof (res as any).flushHeaders === 'function') {
      try { (res as any).flushHeaders(); } catch {}
    }
  }

  const sendChunk = (data: any) => {
    if (data?.text) {
      accumulatedText += data.text;
    }

    if (isSSE && typeof (res as any).write === 'function') {
      try {
        (res as any).write(`data: ${JSON.stringify(data)}\n\n`);
        if (typeof (res as any).flush === 'function') {
          (res as any).flush();
        }
      } catch (err) {
        console.warn('SSE sendChunk write warning:', err);
      }
    }
  };

  const endResponse = (finalData?: any) => {
    if (isSSE) {
      if (finalData) sendChunk(finalData);
      return res.end();
    } else {
      return res.status(200).json({
        success: true,
        text: accumulatedText,
        done: true,
        ...finalData,
      });
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
      return endResponse({ done: true });
    }

    const trimmedMsg = message.trim();

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

    const catalogContext = MARKET_CATALOG.map(
      (p) =>
        `- [ID: ${p.id}] "${p.title}" (${p.type.toUpperCase()} - ${p.price < 5000 ? 'ALQUILER' : 'VENTA'}) en ${p.address}, ${p.zone}, ${p.city}, ${p.country}. Precio: $${p.price.toLocaleString('en-US')} USD ${p.price < 5000 ? '/mes' : ''}. ${p.bedrooms} hab, ${p.areaM2} m². FUENTE: Catálogo Directo de la Agencia. ${p.description}`
    ).join('\n');

    const systemPrompt = `
Eres Aria Prop, el asistente virtual de una plataforma inmobiliaria que opera en toda América.

IDIOMA PREDETERMINADO DE RESPUESTA: ${targetLangName.toUpperCase()}.
Debes responder SIEMPRE en este idioma (${targetLangName}).

Tus objetivos:
1. Entender qué busca el usuario (comprar o alquilar, tipo de propiedad, zona, presupuesto).
2. Consultar los datos disponibles en FUENTE_DE_DATOS y recomendar opciones.
3. Recordar siempre la información previamente provista en la conversación (historial) y NO volver a preguntar datos que el usuario ya especificó.
4. Facilitar el contacto directo o agendar una visita.

## FUENTE_DE_DATOS:
${catalogContext}

Responde siempre en ${targetLangName} con mensajes cortos, amables y conversacionales (2-4 líneas).
`;

    if (cleanApiKey) {
      try {
        const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${cleanApiKey}`;

        const contents = [
          ...history.map((h: { sender: string; content: string }) => ({
            role: h.sender === 'user' ? 'user' : 'model',
            parts: [{ text: h.content }],
          })),
          { role: 'user', parts: [{ text: trimmedMsg }] },
        ];

        const geminiRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            systemInstruction: { parts: [{ text: systemPrompt }] },
          }),
        });

        if (geminiRes.ok) {
          const json = await geminiRes.json();
          const generatedText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (generatedText) {
            sendChunk({ text: generatedText });
            return endResponse({ done: true });
          }
        }
      } catch (geminiErr: any) {
        console.warn('Gemini REST Call Error:', geminiErr?.message || geminiErr);
      }
    }

    // Deterministic Memory-Aware Fallback Response
    const memoryResult = buildMemoryAwareResponse(trimmedMsg, history);
    responseText = memoryResult.text;
    const primaryPropId = memoryResult.recommendedPropId;

    if (isSSE) {
      const words = responseText.split(' ');
      for (const word of words) {
        sendChunk({ text: word + ' ' });
        await new Promise((r) => setTimeout(r, 12));
      }
      return endResponse({ done: true, recommendedPropertyId: primaryPropId });
    } else {
      accumulatedText = responseText;
      return endResponse({ recommendedPropertyId: primaryPropId });
    }
  } catch (globalErr: any) {
    console.error('API Chat Global Error:', globalErr);
    if (isSSE) {
      try {
        sendChunk({
          text: '⚠️ **Aviso**: Ocurrió una desconexión temporal en el servidor. Tu consulta fue procesada mediante nuestro catálogo directo de contingencia.',
        });
      } catch {}
      return res.end();
    } else {
      return res.status(200).json({
        success: true,
        text: '⚠️ **Aviso**: Ocurrió una desconexión temporal en el servidor. Tu consulta fue procesada mediante nuestro catálogo directo de contingencia.',
        done: true,
      });
    }
  }
}

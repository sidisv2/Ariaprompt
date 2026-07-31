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
  history: { sender: string; content: string }[] = []
) {
  const trimmed = message.trim();
  const lowerMsg = trimmed.toLowerCase();

  const fullUserQuery = [
    ...history.filter((h) => h && h.sender === 'user').map((h) => h.content || (h as any).text || ''),
    trimmed,
  ].join(' ');
  const fullLowerQuery = fullUserQuery.toLowerCase();

  let lastProp: (typeof MARKET_CATALOG)[0] | undefined = undefined;

  for (let i = history.length - 1; i >= 0; i--) {
    const item = history[i];
    if (item && (item.sender === 'bot' || item.sender === 'model')) {
      const textContent = item.content || (item as any).text || '';
      const matched = MARKET_CATALOG.find(
        (p) => textContent.includes(p.title) || textContent.includes(p.address) || textContent.includes(p.id) || textContent.includes(p.zone)
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

  const hasHistory = history && history.length > 0;
  const isAskingArea = hasHistory && (lowerMsg.includes('metro') || lowerMsg.includes('m2') || lowerMsg.includes('superficie') || lowerMsg.includes('calle') || lowerMsg.includes('queda') || lowerMsg.includes('direccion') || lowerMsg.includes('dirección'));
  const isAskingPrice = hasHistory && (lowerMsg.includes('precio') || lowerMsg.includes('cuanto cuesta') || lowerMsg.includes('cuánto cuesta') || lowerMsg.includes('valor'));
  const isAskingBedrooms = hasHistory && (lowerMsg.includes('cuántos dormitorios') || lowerMsg.includes('cuantos dormitorios') || lowerMsg.includes('cuántos cuartos') || lowerMsg.includes('cuantos cuartos') || lowerMsg.includes('dijiste'));
  const isAskingZoneOptions = hasHistory && (lowerMsg.includes('zona') || lowerMsg.includes('opción') || lowerMsg.includes('opcion') || lowerMsg.includes('disponible'));

  if (lastProp && history.length > 0) {
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

  const matches = MARKET_CATALOG.filter((p) => {
    const city = p.city.toLowerCase();
    const zone = p.zone.toLowerCase();
    const type = p.type.toLowerCase();
    const isAlquiler = fullLowerQuery.includes('alquiler') || fullLowerQuery.includes('rent');

    const matchesCityOrZone = fullLowerQuery.includes(city) || fullLowerQuery.includes(zone);
    const matchesType = fullLowerQuery.includes(type);

    if (isAlquiler && p.price >= 5000) return false;
    return matchesCityOrZone || matchesType;
  });

  if (matches.length > 0) {
    const topProp = matches[0];
    return {
      text: `¡Hola! Encontré esta excelente opción en nuestro catálogo verificado:\n\n🏡 **${topProp.title}** en ${topProp.zone}, ${topProp.city}\n• **Precio:** $${topProp.price.toLocaleString('en-US')} USD ${topProp.price < 5000 ? '/mes' : ''}\n• **Ambientes:** ${topProp.bedrooms} dormitorios (${topProp.areaM2} m²)\n• **Dirección:** ${topProp.address}\n\n¿Te gustaría agendar una visita presencial o recibir más detalles por WhatsApp?`,
      recommendedPropId: topProp.id,
    };
  }

  return {
    text: `Hola. Recordando tu consulta sobre propiedades, actualmente estamos actualizando las opciones verificadas para esa zona en nuestro catálogo directo. ¿Te gustaría que te conecte con un asesor humano para enviarte las opciones disponibles?`,
    recommendedPropId: undefined,
  };
}

async function generateAriaAiResponse({
  message,
  history = [],
  lang = 'es',
}: {
  message: string;
  history?: { sender: string; content: string }[];
  lang?: string;
}): Promise<string> {
  const trimmedMsg = message.trim();
  const rawKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    '';
  const cleanApiKey = rawKey.replace(/^["']|["']$/g, '').trim();

  const langNames: Record<string, string> = { es: 'Español', en: 'English', pt: 'Português' };
  const targetLangName = langNames[lang] || 'Español';

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
        if (generatedText) return generatedText;
      }
    } catch (err) {
      console.warn('Gemini REST Call Warning:', err);
    }
  }

  return buildMemoryAwareResponse(trimmedMsg, history).text;
}

export function formatArgentinePhoneForWhatsApp(phone: string): string {
  const clean = phone.replace(/[^0-9]/g, '');

  if (clean.startsWith('549')) {
    const without549 = clean.slice(3);

    if (without549.length === 10) {
      if (without549.startsWith('11')) {
        const area = without549.slice(0, 2);
        const num = without549.slice(2);
        return '54' + area + '15' + num;
      }
      const area = without549.slice(0, 3);
      const num = without549.slice(3);
      return '54' + area + '15' + num;
    }
    if (without549.startsWith('15')) {
      return '54' + without549;
    }
  }

  return clean;
}

export async function sendWhatsAppTextMessage({
  to,
  text,
  phoneNumberId,
}: {
  to: string;
  text: string;
  phoneNumberId?: string;
}): Promise<{ success: boolean; data?: any; error?: string; diagnostic?: any }> {
  const formattedTo = formatArgentinePhoneForWhatsApp(to);

  const rawToken =
    process.env.WHATSAPP_ACCESS_TOKEN ||
    process.env.META_WHATSAPP_ACCESS_TOKEN ||
    process.env.WHATSAPP_TOKEN ||
    process.env.META_ACCESS_TOKEN ||
    '';
  const token = rawToken.replace(/^["']|["']$/g, '').trim();

  const tokenDiagnostic = {
    exists: Boolean(rawToken && rawToken.length > 0),
    rawLength: rawToken.length,
    cleanLength: token.length,
    startsWithEAA: token.startsWith('EAA'),
    prefix: token.length >= 4 ? token.slice(0, 4) : token,
    suffix: token.length >= 4 ? token.slice(-4) : token,
    hasWhitespace: rawToken !== rawToken.trim(),
    hasQuotes: /^["']|["']$/.test(rawToken),
    envKeysFound: [
      'WHATSAPP_ACCESS_TOKEN',
      'META_WHATSAPP_ACCESS_TOKEN',
      'WHATSAPP_TOKEN',
      'META_ACCESS_TOKEN',
    ].filter((k) => Boolean(process.env[k] && process.env[k]!.trim().length > 0)),
    allEnvKeys: Object.keys(process.env).sort(),
  };

  const rawPhoneId =
    phoneNumberId ||
    process.env.WHATSAPP_PHONE_NUMBER_ID ||
    process.env.META_PHONE_NUMBER_ID ||
    '1215379554999227';
  const phoneId = rawPhoneId.replace(/^["']|["']$/g, '').trim();

  if (!token) {
    console.warn('⚠️ Missing WHATSAPP_ACCESS_TOKEN environment variable in Vercel.');
    return {
      success: false,
      error: 'WHATSAPP_ACCESS_TOKEN environment variable is empty or missing in Vercel deployment.',
      diagnostic: tokenDiagnostic,
    };
  }

  const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;

  try {
    console.log(`📱 Sending WhatsApp Message: raw "to"="${to}" -> formatted "to"="${formattedTo}"`);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedTo,
        type: 'text',
        text: {
          preview_url: false,
          body: text,
        },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('❌ Meta Graph API Send Error:', data);
      return { success: false, error: data?.error?.message || 'Meta Graph API Error', data, diagnostic: tokenDiagnostic };
    }

    console.log('✅ Meta WhatsApp Message Sent Successfully:', data);
    return { success: true, data, diagnostic: tokenDiagnostic };
  } catch (err: any) {
    console.error('❌ Network error sending WhatsApp message:', err.message);
    return { success: false, error: err.message, diagnostic: tokenDiagnostic };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. GET Handler: Meta Webhook Initial Verification Challenge
  if (req.method === 'GET') {
    const mode = Array.isArray(req.query['hub.mode']) ? req.query['hub.mode'][0] : req.query['hub.mode'];
    const token = Array.isArray(req.query['hub.verify_token']) ? req.query['hub.verify_token'][0] : req.query['hub.verify_token'];
    const challenge = Array.isArray(req.query['hub.challenge']) ? req.query['hub.challenge'][0] : req.query['hub.challenge'];

    const rawEnvToken = process.env.WEBHOOK_VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN || '';
    const expectedVerifyToken = rawEnvToken.replace(/^["']|["']$/g, '').trim();

    const isValidToken = Boolean(
      token &&
      expectedVerifyToken &&
      token === expectedVerifyToken
    );

    if (mode === 'subscribe' && isValidToken) {
      console.log('✅ Meta Webhook Verification Successful! Returning hub.challenge.');
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.status(200).send(challenge || '');
    } else {
      console.warn(`❌ Meta Webhook Verification Failed. Token mismatch or WEBHOOK_VERIFY_TOKEN missing.`);
      return res.status(403).json({
        error: 'Webhook verification failed',
        message: 'hub.verify_token does not match WEBHOOK_VERIFY_TOKEN environment variable.',
      });
    }
  }

  // 2. POST Handler: Receive Incoming Webhook Event from Meta
  if (req.method === 'POST') {
    // ABSOLUTE FIRST EXECUTABLE LINE: Direct console log without any DB dependency
    console.log("🔥 WEBHOOK POST RECEIVED AT:", new Date().toISOString());
    console.log("📩 RAW REQUEST BODY:", typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}));

    const supabase = getBackendSupabaseClient();

    // FIRST EXECUTABLE LINE: Log raw incoming POST payload immediately to Supabase
    if (supabase) {
      const rawString = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});

      (async () => {
        try {
          await supabase.from('webhook_debug_log').insert({
            received_at: new Date().toISOString(),
            raw_body: rawString,
          });
        } catch {}

        try {
          let parsed = req.body || {};
          if (typeof parsed === 'string') {
            try { parsed = JSON.parse(parsed); } catch { parsed = {}; }
          }
          const fromNum = parsed.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from || 'raw_webhook_post';
          const txtMsg = parsed.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body || rawString.slice(0, 200);

          await supabase.from('chat_messages').insert({
            phone_number: fromNum,
            channel: 'whatsapp_raw_webhook',
            message_text: txtMsg,
            received_at: new Date().toISOString(),
          });
        } catch {}
      })();
    }

    try {
      let body = req.body || {};
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }

      if (body.object !== 'whatsapp_business_account') {
        return res.status(200).json({ status: 'IGNORED_NON_WHATSAPP_EVENT' });
      }

      const entry = body.entry?.[0];
      const change = entry?.changes?.[0]?.value;
      const metadata = change?.metadata;
      const messages = change?.messages;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(200).json({ status: 'STATUS_UPDATE_ACKNOWLEDGED' });
      }

      const incomingMsg = messages[0];
      const fromNumber = incomingMsg.from;
      const msgType = incomingMsg.type;
      const phoneNumberId = metadata?.phone_number_id;

      let textBody = '';
      if (msgType === 'text' && incomingMsg.text?.body) {
        textBody = incomingMsg.text.body;
      } else if (msgType === 'button' && incomingMsg.button?.text) {
        textBody = incomingMsg.button.text;
      } else if (incomingMsg.interactive?.button_reply?.title) {
        textBody = incomingMsg.interactive.button_reply.title;
      } else {
        textBody = 'Hola';
      }

      console.log(`📩 Incoming WhatsApp Message from ${fromNumber}: "${textBody}"`);

      const aiResponse = await generateAriaAiResponse({
        message: textBody,
        history: [],
        lang: 'es',
      });

      console.log(`🤖 Generated Aria AI Response: "${aiResponse}"`);

      const sendResult = await sendWhatsAppTextMessage({
        to: fromNumber,
        text: aiResponse,
        phoneNumberId,
      });

      return res.status(200).json({
        status: 'EVENT_PROCESSED',
        from: fromNumber,
        receivedText: textBody,
        aiResponse,
        sent: sendResult.success,
        metaResult: sendResult.data || sendResult.error,
        tokenDiagnostic: (sendResult as any).diagnostic || null,
      });
    } catch (err: any) {
      console.error('❌ Error processing WhatsApp webhook POST payload:', err);
      return res.status(200).json({ status: 'ERROR_HANDLED', message: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

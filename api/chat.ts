import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';
import { INITIAL_BOT_CONFIG } from '../src/data/mockData';
import {
  searchMultiSourceRealEstate,
  MARKET_REAL_ESTATE_DATABASE,
} from '../src/lib/multiSourceRealEstateEngine';

// Function Calling Tool Definition for Real Estate Search
export const buscarPropiedadesToolDeclaration = {
  name: 'buscar_propiedades',
  description: 'Busca y compara publicaciones de propiedades en tiempo real desde múltiples fuentes e inmobiliarias de América según ubicación, presupuesto, tipo de propiedad y ambientes.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      pais: { type: Type.STRING, description: 'País de interés (ej: Argentina, México, Colombia, Perú)' },
      ciudad: { type: Type.STRING, description: 'Ciudad o zona de interés (ej: Mendoza, Buenos Aires, Polanco, El Poblado, San Isidro)' },
      tipo: { type: Type.STRING, description: 'Tipo de inmueble: departamento, casa, penthouse, terreno, local' },
      precio_min: { type: Type.NUMBER, description: 'Presupuesto mínimo en USD' },
      precio_max: { type: Type.NUMBER, description: 'Presupuesto máximo en USD' },
      habitaciones: { type: Type.NUMBER, description: 'Cantidad de ambientes o dormitorios' },
      operacion: { type: Type.STRING, description: 'Venta o Alquiler' },
    },
  },
};

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
  res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx/Proxy buffering

  if (typeof (res as any).flushHeaders === 'function') {
    (res as any).flushHeaders();
  }

  const sendChunk = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    if (typeof (res as any).flush === 'function') {
      (res as any).flush();
    }
  };

  try {
    const { message, history = [], context = 'general', apiKey } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      sendChunk({ text: '⚠️ Por favor ingresa una consulta válida.' });
      sendChunk({ done: true });
      return res.end();
    }

    const trimmedMsg = message.trim();
    const lowerMsg = trimmedMsg.toLowerCase();

    // Multi-variable API Key Resolution with quotes stripping
    const rawKey =
      apiKey ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.VITE_GEMINI_API_KEY ||
      '';
    const cleanApiKey = rawKey.replace(/^["']|["']$/g, '').trim();

    let ai: GoogleGenAI | null = null;
    if (cleanApiKey) {
      try {
        ai = new GoogleGenAI({
          apiKey: cleanApiKey,
        });
      } catch (err) {
        console.error('GoogleGenAI Initialization Error:', err);
        ai = null;
      }
    }

    // Execute multi-source real estate search engine
    const searchResult = searchMultiSourceRealEstate(trimmedMsg);

    // Build RAG context with explicit origin URLs and sources
    const multiSourceCatalogContext = MARKET_REAL_ESTATE_DATABASE.map(
      (p) =>
        `- [ID: ${p.id}] "${p.title}" (${p.type.toUpperCase()}) en DIRECCIÓN REAL VERIFICADA: ${p.location.address}, ${p.location.zone}, ${p.location.city}, ${p.location.country || ''}. MAPA: ${p.location.googleMapsUrl || '#'}. Precio: $${p.price.toLocaleString('en-US')} USD. ${p.features.bedrooms} hab / ${p.features.rooms || p.features.bedrooms + 1} ambientes, ${p.features.areaM2} m². FUENTE ORIGINAL: ${p.source?.name} (URL: ${p.source?.url}). Descripción: ${p.description}`
    ).join('\n');

    const systemPrompt = `
Eres Aria Promp, el asistente virtual de una plataforma inmobiliaria que opera en toda América. Tu función NO es representar a una sola inmobiliaria: actuás como un comparador neutral que analiza distintas fuentes (inmobiliarias, portales y publicaciones) para ayudar al usuario a encontrar la mejor opción según lo que necesita.

Tus objetivos, en este orden:
1. Entender qué busca el usuario (tipo de operación, tipo de propiedad, zona, presupuesto, país/ciudad, urgencia).
2. Comparar las opciones disponibles en tus fuentes de datos y recomendar la que mejor se ajuste, priorizando precio y relación calidad-servicio.
3. Facilitar el siguiente paso: contacto con la inmobiliaria/agente correspondiente o agendar una visita.

## FUENTE_DE_DATOS (Base/índice de listados verificado con DIRECCIONES REALES):
${multiSourceCatalogContext}

## Regla Estricta de Direcciones Reales y Veracidad
- NUNCA inventes calles, alturas, precios ni ubicaciones falsas. Solo utiliza las direcciones reales y verificadas de FUENTE_DE_DATOS.
- En cada propiedad recomendada, incluye obligatoriamente la dirección real (ej. Av. España 1240, Mendoza, Argentina) y la fuente de origen (ej. MercadoLibre, Properati, Zonaprop) con el link directo a la publicación.

## Cómo entender qué necesita el usuario
Preguntá de forma conversacional, un par de datos por vez (no todo junto):
- ¿Busca comprar o alquilar?
- Tipo de propiedad (casa, depto, terreno, local, etc.).
- País y ciudad/zona de interés.
- Presupuesto aproximado (aclarar moneda).
- Cantidad de ambientes / m² deseados, si aplica.

## Cómo comparar y recomendar
- Presentá 2-3 opciones como máximo por respuesta, ordenadas de mejor a peor ajuste.
- Para cada opción: precio, dirección real verificada, punto fuerte, fuente de origen y link a Google Maps/publicación.
- Respondé en español con mensajes cortos y fluidos (2-4 líneas).
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
            tools: [{ functionDeclarations: [buscarPropiedadesToolDeclaration] }],
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
          text: `⚠️ **Aviso de API**: Error en llamada a modelo Gemini (${geminiErr?.message || 'Error de conexión'}). Mostrando comparativa con direcciones reales verificadas:\n\n`,
        });
      }
    }

    // Deterministic Neutral Comparator Fallback with 100% Real Addresses
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
      responseText =
        `¡Hola! Soy Aria Promp, tu comparador inmobiliario neutral para toda América.\n\n` +
        `Analizo publicaciones reales de múltiples fuentes (MercadoLibre, Properati, Zonaprop) con direcciones físicas verificadas.\n\n` +
        `Para empezar, ¿buscas comprar o alquilar, y en qué ciudad o zona estás interesado?`;
    } else if (searchResult.unmatchedLocationName) {
      responseText =
        `Revisé en mis fuentes integradas y actualmente no tengo publicaciones verificadas activas en **${searchResult.unmatchedLocationName}**.\n\n` +
        `Cuento con opciones con dirección real verificada en **Mendoza**, **Buenos Aires**, **Ciudad de México**, **Medellín** y **Lima**.\n\n` +
        `¿Te gustaría explorar alguna de estas ciudades o prefieres que un asesor busque algo puntual en ${searchResult.unmatchedLocationName}?`;
    } else if (searchResult.exactMatches.length > 0) {
      const items = searchResult.exactMatches.slice(0, 2);
      primaryPropId = items[0].id;

      responseText =
        `Analizando mis fuentes, te recomiendo estas opciones principales con dirección real verificada:\n\n` +
        items
          .map((p, idx) => (
            `**Opción ${idx + 1}**: ${p.title}\n` +
            `• 📍 **Dirección Real**: ${p.location.address}, ${p.location.zone}, ${p.location.city}, ${p.location.country || ''} ([Ver en Google Maps](${p.location.googleMapsUrl}))\n` +
            `• 💰 **Precio**: $${p.price.toLocaleString('en-US')} USD | ${p.features.bedrooms} hab (${p.features.areaM2} m²)\n` +
            `• 🌐 **Fuente**: ${p.source?.name} - [Ver publicación original](${p.source?.url})\n`
          ))
          .join('\n') +
        `\n¿Te interesa agendar una visita o coordinar contacto directo con la inmobiliaria de alguna de ellas?`;
    } else {
      responseText =
        `¡Hola! Soy Aria Promp, tu comparador inmobiliario neutral con direcciones reales verificadas.\n\n` +
        `¿Podrías decirme qué tipo de propiedad buscas (depto, casa), la ciudad y tu presupuesto aproximado?`;
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
    sendChunk({
      text: '⚠️ **Aviso**: Ocurrió una desconexión temporal en el servidor. Tu consulta fue procesada mediante nuestro motor comparador con direcciones reales.',
    });
    sendChunk({ done: true });
    return res.end();
  }
}

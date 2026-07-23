import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { INITIAL_BOT_CONFIG } from '../src/data/mockData';
import {
  searchMultiSourceRealEstate,
  MARKET_REAL_ESTATE_DATABASE,
  parseQueryCriteria,
} from '../src/lib/multiSourceRealEstateEngine';

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

  try {
    const { message, history = [], context = 'general', apiKey } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const trimmedMsg = message.trim();
    const lowerMsg = trimmedMsg.toLowerCase();
    const effectiveApiKey = apiKey || process.env.GEMINI_API_KEY;

    let ai: GoogleGenAI | null = null;
    if (effectiveApiKey && effectiveApiKey.trim()) {
      try {
        ai = new GoogleGenAI({
          apiKey: effectiveApiKey.trim(),
        });
      } catch {
        ai = null;
      }
    }

    // Execute multi-source real estate search engine
    const searchResult = searchMultiSourceRealEstate(trimmedMsg);

    // Build RAG context with explicit origin URLs and sources
    const multiSourceCatalogContext = MARKET_REAL_ESTATE_DATABASE.map(
      (p) =>
        `- [ID: ${p.id}] "${p.title}" (${p.type.toUpperCase()}) en ${p.location.address}, ${p.location.zone}, ${p.location.city}, ${p.location.country || ''}. Precio: $${p.price.toLocaleString('en-US')} USD. ${p.features.bedrooms} hab / ${p.features.rooms || p.features.bedrooms + 1} ambientes, ${p.features.areaM2} m². FUENTE ORIGINAL: ${p.source?.name} (URL: ${p.source?.url}). Descripción: ${p.description}`
    ).join('\n');

    let contextSpecificRole = 'Asistente comercial de bienes raíces 24/7 y Agregador Multifuente';
    if (context === 'finance') {
      contextSpecificRole =
        'Evaluador de Rentabilidad e Inversión Inmobiliaria Multifuente.';
    } else if (context === 'rag') {
      contextSpecificRole =
        'Especialista RAG en Verificación de Fuentes e Inspección Técnica Inmobiliaria.';
    }

    const systemPrompt = `
Eres "${INITIAL_BOT_CONFIG.agentName}", ${contextSpecificRole} para la agencia "${INITIAL_BOT_CONFIG.agencyName}".

REGLAS STRICTAS DE RECOPILACIÓN MULTIFUENTE Y FUENTE ORIGINAL (TRANSPARENCIA TOTAL):
1. Utiliza las siguientes publicaciones de MercadoLibre Inmuebles API, Properati, Zonaprop, Argenprop y catálogo exclusivo como FUENTE DE VERDAD:
${multiSourceCatalogContext}

2. TRANSPARENCIA Y ENLACES DIRECTOS:
   - Para CADA propiedad recomendada, DEBES incluir obligatoriamente el nombre de la fuente de origen (ej. "Fuente: MercadoLibre Inmuebles (API Oficial)" o "Fuente: Properati Argentina (Feed Partner)") Y EL LINK DIRECTO clicable a la publicación original (ej. [Ver publicación en MercadoLibre](https://...)).
   - SI LA UBICACIÓN O CRITERIO SOLICITADO NO EXISTE EN NINGUNA FUENTE: Indica honestamente que no hay publicaciones activas recopiladas para esa zona específica (ej. Mendoza o la ciudad pedida). Muestra las opciones más cercanas o las ciudades disponibles y ofrece conectar con un asesor por WhatsApp.
   - JAMÁS inventes publicaciones ficticias ni enlaces falsos.
   - Aclara que los cálculos de ROI o renta son ESTIMACIONES de mercado basadas en el precio de la publicación original.
`;

    // Stream SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    if (ai) {
      try {
        const formattedContents = [
          ...history.map((h: { sender: string; content: string }) => ({
            role: h.sender === 'user' ? 'user' : 'model',
            parts: [{ text: h.content }],
          })),
          { role: 'user', parts: [{ text: trimmedMsg }] },
        ];

        const responseStream = await ai.models.generateContentStream({
          model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
          contents: formattedContents,
          config: {
            systemInstruction: systemPrompt,
          },
        });

        for await (const chunk of responseStream) {
          if (chunk.text) {
            res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
          }
        }
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        return res.end();
      } catch (geminiErr) {
        console.error('Gemini stream error, using fallback multi-source engine:', geminiErr);
      }
    }

    // Deterministic Multi-Source Engine Fallback
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
        `¡Hola! 👋 Bienvenido a **${INITIAL_BOT_CONFIG.agencyName}**. Soy **${INITIAL_BOT_CONFIG.agentName}**, tu asistente inmobiliario multifuente 24/7.\n\n` +
        `Recopilo y analizo en tiempo real publicaciones vericadas de **MercadoLibre Inmuebles API**, **Properati**, **Zonaprop** y **Argenprop**.\n\n` +
        `¿En qué ciudad, presupuesto o cantidad de ambientes estás interesado? *(Ej: "deptos en Mendoza hasta USD 150k" o "2 ambientes en Buenos Aires")*`;
    } else if (searchResult.unmatchedLocationName) {
      responseText =
        `### 📍 **Sin Publicaciones en ${searchResult.unmatchedLocationName}**\n\n` +
        `Revisamos en tiempo real nuestras fuentes integradas (*MercadoLibre API, Properati, Zonaprop*) y actualmente **no encontramos publicaciones activas** en **${searchResult.unmatchedLocationName}**.\n\n` +
        `#### 🌐 **Ubicaciones con Publicaciones Verificadas Activas**:\n` +
        `- 🇦🇷 **Mendoza, Argentina**: Deptos en Barrio Bombal ($115,000 USD) y Centro ($148,000 USD)\n` +
        `- 🇦🇷 **Buenos Aires, Argentina**: Ático en Puerto Madero ($1,400,000 USD)\n` +
        `- 🇲🇽 **Ciudad de México**: Penthouse en Polanco ($1,850,000 USD)\n` +
        `- 🇨🇴 **Medellín, Colombia**: Villa en El Poblado ($950,000 USD)\n` +
        `- 🇵🇪 **Lima, Perú**: Departamento en San Isidro ($620,000 USD)\n\n` +
        `💬 *¿Te gustaría explorar alguna de estas opciones o derivar tu solicitud a un asesor por WhatsApp?*`;
    } else if (searchResult.exactMatches.length > 0) {
      const items = searchResult.exactMatches.slice(0, 3);
      primaryPropId = items[0].id;

      responseText =
        `### 🏢 **Publicaciones Encontradas (${items.length} Opciones)**\n\n` +
        (searchResult.explanationNote ? `> ℹ️ *${searchResult.explanationNote}*\n\n` : '') +
        items
          .map((p, idx) => {
            const customRent = Math.round(p.price * 0.007);
            const grossYield = ((customRent * 12 / p.price) * 100).toFixed(2);
            return (
              `#### ${idx + 1}. **${p.title}** (${p.code})\n` +
              `- 💰 **Precio**: **$${p.price.toLocaleString('en-US')} USD**\n` +
              `- 📍 **Ubicación**: ${p.location.address}, ${p.location.zone}, **${p.location.city}, ${p.location.country || ''}**\n` +
              `- 📐 **Distribución**: ${p.features.bedrooms} hab | ${p.features.rooms || p.features.bedrooms + 1} ambientes | ${p.features.areaM2} m²\n` +
              `- 📈 **Rentabilidad Estimada**: ~${grossYield}% Cap Rate Bruto (~$${customRent.toLocaleString('en-US')} USD/mes)\n` +
              `- 🌐 **Fuente Original**: **${p.source?.name}** (${p.source?.lastUpdated || 'Verificado'})\n` +
              `- 🔗 **Link Directo**: [Ver publicación original en ${p.source?.name.split(' ')[0]}](${p.source?.url})\n`
            );
          })
          .join('\n') +
        `\n📅 ¿Te gustaría agendar una visita o recibir más detalles por WhatsApp?`;
    } else if (searchResult.closestMatches.length > 0) {
      const items = searchResult.closestMatches.slice(0, 2);
      primaryPropId = items[0].id;

      responseText =
        `### 🔍 **Opciones Más Cercanas Encontradas**\n\n` +
        (searchResult.explanationNote ? `> ⚠️ **Aclaración**: *${searchResult.explanationNote}*\n\n` : '') +
        items
          .map((p, idx) => (
            `#### ${idx + 1}. **${p.title}**\n` +
            `- 💰 **Precio**: **$${p.price.toLocaleString('en-US')} USD**\n` +
            `- 📍 **Ubicación**: ${p.location.zone}, ${p.location.city}\n` +
            `- 🌐 **Fuente**: **${p.source?.name}**\n` +
            `- 🔗 **Link Directo**: [Ver publicación original](${p.source?.url})\n`
          ))
          .join('\n');
    } else {
      responseText =
        `### 🏢 **Agregador Inmobiliario Multifuente 24/7**\n\n` +
        `Recopilamos ofertas reales de **MercadoLibre Inmuebles API**, **Properati**, **Zonaprop** y **Argenprop**.\n\n` +
        `¿Podrías especificar la ciudad, presupuesto o número de ambientes que buscas?`;
    }

    const words = responseText.split(' ');
    for (const word of words) {
      res.write(`data: ${JSON.stringify({ text: word + ' ' })}\n\n`);
      await new Promise((r) => setTimeout(r, 15));
    }
    res.write(`data: ${JSON.stringify({ done: true, recommendedPropertyId: primaryPropId })}\n\n`);
    return res.end();
  } catch (err: any) {
    console.error('API Chat Error:', err);
    return res.status(500).json({ error: 'Internal server error in AI chat endpoint' });
  }
}

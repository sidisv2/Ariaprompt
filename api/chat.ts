import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { INITIAL_PROPERTIES, INITIAL_BOT_CONFIG } from '../src/data/mockData';
import { Property } from '../src/types';

// Helper to match catalog properties by location and filters
function searchCatalogProperties(query: string, properties: Property[]): Property[] {
  const q = query.toLowerCase();

  return properties.filter((p) => {
    const city = p.location.city.toLowerCase();
    const zone = p.location.zone.toLowerCase();
    const address = p.location.address.toLowerCase();
    const title = p.title.toLowerCase();
    const desc = p.description.toLowerCase();
    const type = p.type.toLowerCase();

    const cityMatch = q.includes(city);
    const zoneMatch = q.includes(zone);
    const addressMatch = q.includes(address);
    const titleMatch = q.includes(title);
    const typeMatch = q.includes(type);

    // Country & aliases mapping
    const argentinaMatch = (q.includes('argentina') || q.includes('buenos aires') || q.includes('madero')) && city.includes('buenos aires');
    const mexicoMatch = (q.includes('méxico') || q.includes('mexico') || q.includes('cdmx') || q.includes('polanco')) && city.includes('méxico');
    const colombiaMatch = (q.includes('colombia') || q.includes('medellin') || q.includes('medellín') || q.includes('poblado')) && city.includes('medellín');
    const peruMatch = (q.includes('peru') || q.includes('perú') || q.includes('lima') || q.includes('san isidro')) && city.includes('lima');

    return cityMatch || zoneMatch || addressMatch || titleMatch || typeMatch || argentinaMatch || mexicoMatch || colombiaMatch || peruMatch;
  });
}

// Detect if user is asking for a specific location not in catalog
function detectUnmatchedLocation(query: string): string | null {
  const q = query.toLowerCase();
  const knownExternalLocations = [
    'mendoza', 'córdoba', 'cordoba', 'rosario', 'bariloche', 'salta', 'mar del plata',
    'madrid', 'barcelona', 'valencia', 'sevilla', 'marbella', 'ibiza',
    'miami', 'orlando', 'new york', 'nueva york', 'los angeles',
    'santiago', 'chile', 'valparaiso', 'viña del mar',
    'bogota', 'bogotá', 'cali', 'cartagena',
    'montevideo', 'punta del este', 'uruguay',
    'cancun', 'cancún', 'tulum', 'guadalajara', 'monterrey', 'playa del carmen', 'queretaro'
  ];

  for (const loc of knownExternalLocations) {
    if (q.includes(loc)) {
      return loc.charAt(0).toUpperCase() + loc.slice(1);
    }
  }
  return null;
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

    // Build catalog context for RAG
    const propertyCatalogContext = INITIAL_PROPERTIES.map(
      (p) =>
        `- [ID: ${p.id}] ${p.title} (${p.type.toUpperCase()}) en ${p.location.address}, ${p.location.zone}, ${p.location.city}. Precio: $${p.price.toLocaleString('en-US')} USD. ${p.features.bedrooms} hab, ${p.features.bathrooms} baños, ${p.features.areaM2} m². Código: ${p.code}. Descripción: ${p.description}`
    ).join('\n');

    let contextSpecificRole = 'Asistente comercial de bienes raíces 24/7';
    if (context === 'finance') {
      contextSpecificRole =
        'Evaluador de Rentabilidad e Inversión Inmobiliaria. Tu enfoque principal es calcular el ROI estimado, Cap Rate y apreciación de capital.';
    } else if (context === 'rag') {
      contextSpecificRole =
        'Especialista en Búsqueda RAG de Dossiers y Memorias Técnicas Inmobiliarias.';
    }

    const systemPrompt = `
Eres "${INITIAL_BOT_CONFIG.agentName}", ${contextSpecificRole} para la agencia "${INITIAL_BOT_CONFIG.agencyName}".

REGLAS STRICTAS DE VERACIDAD Y UBICACIÓN (CRÍTICAS):
1. Revisa la siguiente lista de propiedades reales en nuestro catálogo como ÚNICA FUENTE DE VERDAD:
${propertyCatalogContext}

2. VALIDACIÓN DE UBICACIÓN Y CRITERIOS:
   - Si la consulta del usuario especifica una ciudad, zona o país (ej. Mendoza, Argentina, Madrid, Miami, Santiago, Cancún, etc.) Y NO EXISTEN propiedades en nuestro catálogo para esa ubicación: DEBES responder honestamente indicando que NO tenemos propiedades disponibles en esa zona. Informa las ubicaciones que SÍ están disponibles (Polanco en CDMX, Puerto Madero en Buenos Aires, El Poblado en Medellín, San Isidro en Lima) y ofrece conectar con un asesor humano por WhatsApp.
   - NUNCA recomiendes ni muestres una propiedad de otra ubicación (ej. Polanco, CDMX) pretendiendo que está en la ubicación solicitada por el usuario (ej. Mendoza, Argentina).
   - NUNCA inventes o alucines propiedades ficticias ni cifras financieras arbitrarias fuera de los datos reales del catálogo.

3. Estructura tus respuestas en español con Markdown y emojis profesionales.
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
        console.error('Gemini stream error, switching to verified RAG engine:', geminiErr);
      }
    }

    // Deterministic Fallback Engine with Strict Location Search
    const catalogMatches = searchCatalogProperties(trimmedMsg, INITIAL_PROPERTIES);
    const unmatchedLocation = detectUnmatchedLocation(trimmedMsg);

    let responseText = '';
    let selectedProp: Property | null = null;

    if (
      lowerMsg === 'hola' ||
      lowerMsg === 'hola!' ||
      lowerMsg === 'buenas' ||
      lowerMsg === 'buenos dias' ||
      lowerMsg === 'hello' ||
      lowerMsg === 'hi'
    ) {
      responseText =
        `¡Hola! 👋 Bienvenido a **${INITIAL_BOT_CONFIG.agencyName}**. Soy **${INITIAL_BOT_CONFIG.agentName}**, tu asesora de IA 24/7.\n\n` +
        `Actualmente cuento con catálogo exclusivo en **Buenos Aires (Puerto Madero)**, **Ciudad de México (Polanco)**, **Medellín (El Poblado)** y **Lima (San Isidro)**.\n\n` +
        `¿Qué tipo de propiedad estás buscando o en qué zona deseas consultar?`;
    } else if (unmatchedLocation && catalogMatches.length === 0) {
      // HONEST RESPONSE WHEN LOCATION IS NOT IN CATALOG
      responseText =
        `### 📍 **Sin Disponibilidad Actual en ${unmatchedLocation}**\n\n` +
        `Por el momento no contamos con propiedades disponibles en **${unmatchedLocation}** dentro de nuestro catálogo activo.\n\n` +
        `#### 🏠 **Ubicaciones Exclusivas Disponibles en Nuestro Catálogo**:\n` +
        `- 🇦🇷 **Buenos Aires, Argentina**: Ático Dúplex en Puerto Madero ($1,400,000 USD)\n` +
        `- 🇲🇽 **Ciudad de México**: Penthouse de Ultra Lujo en Polanco ($1,850,000 USD)\n` +
        `- 🇨🇴 **Medellín, Colombia**: Casa Campestre en El Poblado ($950,000 USD)\n` +
        `- 🇵🇪 **Lima, Perú**: Departamento Exclusivo en San Isidro ($620,000 USD)\n\n` +
        `💬 *¿Deseas explorar alguna de nuestras opciones disponibles o prefieres que un asesor humano te contacte por WhatsApp para realizar una búsqueda personalizada en ${unmatchedLocation}?*`;
    } else if (catalogMatches.length > 0) {
      // MATCH FOUND IN CATALOG
      selectedProp = catalogMatches[0];
      const customRent = Math.round(selectedProp.price * 0.007);
      const grossYield = ((customRent * 12 / selectedProp.price) * 100).toFixed(2);
      const paybackYears = (selectedProp.price / (customRent * 12)).toFixed(1);

      responseText =
        `### 🏛️ **Coincidencia Encontrada en Nuestro Catálogo**\n\n` +
        `Basado en tu consulta, te presento una opción destacada que coincide con tus criterios:\n\n` +
        `#### 📌 **${selectedProp.title}** (${selectedProp.code})\n` +
        `- **Ubicación**: ${selectedProp.location.address}, ${selectedProp.location.zone}, **${selectedProp.location.city}**\n` +
        `- **Precio de Lista**: **$${selectedProp.price.toLocaleString('en-US')} USD**\n` +
        `- **Distribución**: ${selectedProp.features.bedrooms} hab | ${selectedProp.features.bathrooms} baños | ${selectedProp.features.areaM2} m²\n` +
        `- **Características**: ${selectedProp.description}\n\n` +
        `#### 💰 **Estudio Financiero Real**:\n` +
        `- **Inversión Requerida**: $${selectedProp.price.toLocaleString('en-US')} USD\n` +
        `- **Renta Mensual Estimada**: ~$${customRent.toLocaleString('en-US')} USD/mes\n` +
        `- **Cap Rate Bruto Anual**: **~${grossYield}%**\n` +
        `- **Retorno Estimado**: ~${paybackYears} años\n\n` +
        `📅 ¿Te gustaría agendar una visita a este inmueble en **${selectedProp.location.city}** o recibir el dossier PDF por WhatsApp?`;
    } else {
      // GENERAL QUERY OR NO DIRECT LOCATION SPECIFIED
      selectedProp = INITIAL_PROPERTIES[0];
      responseText =
        `### 🏢 **Asesoría Inmobiliaria 24/7**\n\n` +
        `Para darte la mejor recomendación en nuestro catálogo, disponemos de inmuebles en **Buenos Aires**, **Ciudad de México**, **Medellín** y **Lima**.\n\n` +
        `Por ejemplo, en **${selectedProp.location.city} (${selectedProp.location.zone})** tenemos disponible **${selectedProp.title}** a **$${selectedProp.price.toLocaleString('en-US')} USD**.\n\n` +
        `¿Podrías indicarme la ciudad, presupuesto o número de habitaciones de tu preferencia?`;
    }

    const words = responseText.split(' ');
    for (const word of words) {
      res.write(`data: ${JSON.stringify({ text: word + ' ' })}\n\n`);
      await new Promise((r) => setTimeout(r, 15));
    }
    res.write(`data: ${JSON.stringify({ done: true, recommendedPropertyId: selectedProp?.id })}\n\n`);
    return res.end();
  } catch (err: any) {
    console.error('API Chat Error:', err);
    return res.status(500).json({ error: 'Internal server error in AI chat endpoint' });
  }
}

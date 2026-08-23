import { OpenAI } from 'openai';

export interface PropertyForPrompt {
  id: string;
  title: string;
  type: string;
  operation_type?: string;
  price_usd: number;
  currency?: string;
  province?: string;
  department?: string;
  locality?: string | null;
  zone?: string | null;
  city?: string | null;
  address?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  area_m2?: number | null;
  description?: string | null;
}

export interface ExtractedLeadData {
  budget_max_usd: number | null;
  preferred_zone: string | null;
  property_type: string | null;
  operation_type?: string | null;
  status: 'active' | 'qualified' | 'handover' | 'human_handoff' | 'closed';
  lead_name: string | null;
  preferred_contact_slot?: string | null;
  requested_room_image?: string | null;
  requested_pdf_property_id?: string | null;
  requested_pdf_property_title?: string | null;
  appointment?: {
    requested_date?: string | null;
    property_title?: string | null;
    notes?: string | null;
  } | null;
}

export interface StructuredRealEstateAIResponse {
  replyText: string;
  extractedData: ExtractedLeadData;
}

export interface RealEstateAIOptions {
  message: string;
  history?: Array<{ sender: 'user' | 'assistant' | 'bot'; content: string }>;
  propertyContext?: string;
  propertiesList?: PropertyForPrompt[];
  lang?: 'es' | 'en' | 'pt';
  contextRole?: 'general' | 'finance' | 'rag';
  botTone?: 'friendly' | 'formal' | 'luxury' | 'direct';
  agentName?: string;
  agencyName?: string;
  customInstructions?: string;
  faqKnowledge?: Array<{ question: string; answer: string }>;
  calendarBookingUrl?: string;
  apiKey?: string;
}

const DEFAULT_MODEL = 'google/gemini-2.5-flash';

/**
 * Clean and retrieve OpenRouter API key from environment variables.
 */
export function getOpenRouterApiKey(explicitKey?: string): string {
  const rawKey =
    explicitKey ||
    process.env.OPENROUTER_API_KEY ||
    process.env.VITE_OPENROUTER_API_KEY ||
    '';
  const cleanKey = rawKey.replace(/^["']|["']$/g, '').trim();

  if (!cleanKey) {
    throw new Error('Variable OPENROUTER_API_KEY no detectada en el entorno.');
  }

  return cleanKey;
}

/**
 * Instantiate standard OpenAI SDK client configured for OpenRouter.ai
 */
export function getOpenAIClient(apiKey?: string): OpenAI {
  const key = getOpenRouterApiKey(apiKey);
  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: key,
    defaultHeaders: {
      'HTTP-Referer': 'https://ariaprop.online',
      'X-Title': 'Aria Prop',
    },
  });
}

/**
 * Serializa de forma estructurada e inequívoca las propiedades activas de la organización
 */
export function serializePropertiesForPrompt(properties: PropertyForPrompt[]): string {
  if (!properties || properties.length === 0) {
    return 'No hay propiedades activas cargadas actualmente para esta organización.';
  }

  return properties
    .map((p) => {
      const locParts = [
        p.address,
        p.zone,
        p.locality,
        p.city,
        p.department,
        p.province,
      ].filter(Boolean);

      const ubicacionCompleta = locParts.length > 0 ? locParts.join(', ') : 'Ubicación a confirmar';

      const caracteristicas = [
        p.bedrooms ? `${p.bedrooms} dorm` : null,
        p.bathrooms ? `${p.bathrooms} baños` : null,
        p.area_m2 ? `${p.area_m2} m²` : null,
      ]
        .filter(Boolean)
        .join(', ');

      const formattedPrice = typeof p.price_usd === 'number' 
        ? p.price_usd.toLocaleString('es-AR') 
        : String(p.price_usd || 0);

      const opType = (p.operation_type || 'VENTA').toUpperCase();

      return [
        `- ID: ${p.id}`,
        `  Título: ${p.title}`,
        `  Tipo: ${p.type} (${opType})`,
        `  Ubicación exacta: ${ubicacionCompleta}`,
        caracteristicas ? `  Características: ${caracteristicas}` : null,
        `  Precio: ${p.currency || 'USD'} ${formattedPrice}`,
        p.description ? `  Descripción: ${p.description.slice(0, 150)}` : null,
        `  Link Ficha Web Oficial: https://ariaprop.online/p/${p.id}`,
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n\n');
}

/**
 * Generate structured real estate AI response using Gemini 2.5 Flash via OpenRouter
 */
export async function generateStructuredAriaRealEstateResponse(
  options: RealEstateAIOptions
): Promise<StructuredRealEstateAIResponse> {
  const {
    message,
    history = [],
    propertyContext = '',
    propertiesList = [],
    agentName = 'Aria',
    agencyName = 'Aria Prop LATAM',
    customInstructions = '',
    faqKnowledge = [],
    calendarBookingUrl = '',
    apiKey: explicitKey,
  } = options;

  const apiKey = getOpenRouterApiKey(explicitKey);
  if (!apiKey || apiKey.includes('placeholder')) {
    return {
      replyText: 'Hola, gracias por escribirnos. ¿Qué tipo de propiedad estás buscando y en qué zona?',
      extractedData: {
        budget_max_usd: null,
        preferred_zone: null,
        property_type: null,
        status: 'active',
        lead_name: null,
        appointment: null,
      },
    };
  }

  const openai = getOpenAIClient(apiKey);
  const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
  const trimmedMsg = message.trim();

  // Construir el bloque estructurado de propiedades
  const serializedCatalog = propertiesList.length > 0 
    ? serializePropertiesForPrompt(propertiesList)
    : (propertyContext || 'No hay propiedades activas cargadas actualmente.');

  const formattedFaqs = faqKnowledge.length > 0
    ? faqKnowledge.map((f, i) => `FAQ #${i + 1}: Q: "${f.question}" -> A: "${f.answer}"`).join('\n')
    : 'No hay preguntas frecuentes específicas cargadas.';

  const systemPrompt = `
Sos ${agentName}, asesor inmobiliario humano, profesional, sobrio y directo de "${agencyName}" (Argentina).
Atendés por WhatsApp con voseo argentino natural y profesional ("mirá", "fijate", "contame", "tenemos", "querés", "avisame").

JERARQUÍA GEOGRÁFICA DE ARGENTINA (Fundamental para interpretar zonas):
- La estructura geográfica de Argentina es: País > Provincia > Departamento / Partido / Municipio > Localidad / Distrito / Barrio.
- Equivalencias geográficas clave para este catálogo:
  * Villa Atuel es un distrito del departamento de San Rafael, en la provincia de Mendoza.
  * San Rafael y Godoy Cruz son ambos departamentos de la provincia de Mendoza.
  * Gran Mendoza comprende: Godoy Cruz, Guaymallén, Maipú, Luján de Cuyo, Capital (Ciudad) y Las Heras.
  * Palermo es un barrio de la Ciudad Autónoma de Buenos Aires (CABA / Buenos Aires).
- REGLAS DE MATCHING GEOGRÁFICO:
  * Si te preguntan por una PROVINCIA (ej: "¿tenés algo en Mendoza?"), DEBES considerar y ofrecer TODAS las propiedades de esa provincia (por ejemplo, el lote en Godoy Cruz y la casa en Villa Atuel/San Rafael).
  * Si te preguntan por un DEPARTAMENTO o LOCALIDAD específica (ej: "¿tenés algo en San Rafael?" o "¿algo en Villa Atuel?"), filtrá y respondé con las propiedades de ese departamento o localidad.
  * Si te preguntan por una zona genérica (ej: "¿qué tenés en Godoy Cruz?"), ofrecé tanto casas, departamentos, lotes o terrenos disponibles.

REGLA CRÍTICA — GROUNDING ESTRICTO (PROHIBIDO ALUCINAR):
1. SOLO podés mencionar y cotizar las propiedades listadas textualmente en "CATÁLOGO DISPONIBLE" más abajo. NUNCA inventes, modifiques, redondees ni mezcles precios, ubicaciones o tipos de propiedades.
2. Si el usuario pregunta por una zona donde NO hay propiedades cargadas (ej: "Córdoba", "Rosario", "Neuquén"), decilo explícitamente de forma honesta y breve ("Por el momento no me quedó nada disponible en esa zona"). No ofrezcas propiedades inventadas.
3. Cuando SÍ haya coincidencia en el catálogo:
   - Presentá la propiedad de inmediato con: Título, Tipo (casa, lote, depto), Ubicación exacta, Características principales (ambientes, m²) y PRECIO EXACTO en USD.
   - Adjuntá SIEMPRE el link oficial a la micro-ficha web interactiva para ver todas las fotos: https://ariaprop.online/p/[id]
4. Tono y Estilo:
   - Máximo 1 emoji por mensaje o ninguno.
   - Respuestas concisas de 2 a 3 oraciones. Cero rodeos ni fórmulas robóticas.

CATÁLOGO DISPONIBLE (Única fuente de verdad oficial, no existe nada fuera de esto):
${serializedCatalog}

REGLAS DE NEGOCIO:
${customInstructions || 'Sin reglas especiales adicionales.'}

PREGUNTAS FRECUENTES (FAQ):
${formattedFaqs}

FORMATO DE SALIDA (ESTRICTAMENTE JSON VÁLIDO SIN BLOQUES DE CÓDIGO EXTRA):
{
  "replyText": "Texto de respuesta para el usuario en WhatsApp",
  "extractedData": {
    "budget_max_usd": number | null,
    "preferred_zone": string | null,
    "property_type": string | null,
    "status": "active" | "qualified" | "handover" | "closed",
    "lead_name": string | null,
    "preferred_contact_slot": string | null,
    "requested_room_image": "Fachada" | "Cocina" | "Living" | "Dormitorio" | "Baño" | "Patio/Parque" | "Pileta" | "Plano" | "General" | null,
    "requested_pdf_property_id": string | null,
    "requested_pdf_property_title": string | null,
    "appointment": {
      "requested_date": string | null,
      "property_title": string | null,
      "notes": string | null
    } | null
  }
}
`;

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...history.map((h) => ({
      role: (h.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: h.content,
    })),
    { role: 'user', content: trimmedMsg },
  ];

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature: 0.1,
      max_tokens: 700,
      response_format: { type: 'json_object' },
    });

    const replyRaw = completion.choices?.[0]?.message?.content;
    if (!replyRaw || !replyRaw.trim()) {
      throw new Error('OpenRouter API devolvió una respuesta vacía.');
    }

    try {
      const parsed = JSON.parse(replyRaw);
      return {
        replyText: parsed.replyText || '¡Hola! ¿En qué propiedad o zona estás interesado?',
        extractedData: parsed.extractedData || {
          budget_max_usd: null,
          preferred_zone: null,
          property_type: null,
          status: 'active',
          lead_name: null,
          appointment: null,
        },
      };
    } catch {
      return {
        replyText: replyRaw.replace(/```json|```/g, '').trim(),
        extractedData: {
          budget_max_usd: null,
          preferred_zone: null,
          property_type: null,
          status: 'active',
          lead_name: null,
          appointment: null,
        },
      };
    }
  } catch (err: any) {
    console.error('OpenRouter Exception:', err);
    throw err;
  }
}

/**
 * Backward-compatible generateOpenRouterRealEstateResponse
 */
export async function generateOpenRouterRealEstateResponse(
  options: RealEstateAIOptions
): Promise<string> {
  const res = await generateStructuredAriaRealEstateResponse(options);
  return res.replyText;
}

/**
 * Backward-compatible streamOpenRouterRealEstateResponse
 */
export function streamOpenRouterRealEstateResponse(
  options: RealEstateAIOptions
): AsyncGenerator<string, void, unknown> {
  return generateOpenRouterRealEstateStream(options);
}

/**
 * Backward-compatible extractLeadQualificationOpenRouter
 */
export async function extractLeadQualificationOpenRouter(
  options: RealEstateAIOptions
): Promise<ExtractedLeadData> {
  const res = await generateStructuredAriaRealEstateResponse(options);
  return res.extractedData;
}

/**
 * Generate streaming AI response for playgrounds and live previews
 */
export async function* generateOpenRouterRealEstateStream(
  options: RealEstateAIOptions
): AsyncGenerator<string, void, unknown> {
  const {
    message,
    history = [],
    propertyContext = '',
    propertiesList = [],
    agentName = 'Aria',
    agencyName = 'Aria Prop LATAM',
    apiKey,
  } = options;

  const openai = getOpenAIClient(apiKey);
  const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
  const trimmedMsg = message.trim();

  const serializedCatalog = propertiesList.length > 0 
    ? serializePropertiesForPrompt(propertiesList)
    : (propertyContext || 'No hay propiedades activas.');

  const systemPrompt = `
Sos ${agentName}, asesor inmobiliario de ${agencyName} en Argentina.
Respondé con voseo argentino natural, conciso y profesional.
Máximo 1 emoji o ninguno.
Solo podés mencionar las propiedades de este catálogo:
${serializedCatalog}
`;

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...history.map((h) => ({
      role: (h.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: h.content,
    })),
    { role: 'user', content: trimmedMsg },
  ];

  const stream = await openai.chat.completions.create({
    model,
    messages,
    temperature: 0.1,
    max_tokens: 800,
    stream: true,
  });

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content || '';
    if (text) {
      yield text;
    }
  }
}

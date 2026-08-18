import OpenAI from 'openai';

export interface ChatMessage {
  sender: 'user' | 'bot' | 'model' | 'assistant';
  content: string;
}

export interface RealEstateAIOptions {
  message: string;
  history?: ChatMessage[];
  propertyContext?: string;
  lang?: string;
  contextRole?: 'general' | 'finance' | 'rag' | string;
  agentName?: string;
  agencyName?: string;
  apiKey?: string;
}

export interface LeadQualificationResult {
  qualified: boolean;
  intent: 'buy' | 'rent' | 'invest' | 'unknown';
  budgetMaxUsd?: number;
  zonePreference?: string;
  propertyType?: string;
  contactPhone?: string;
  visitRequested?: boolean;
  summary: string;
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
  return rawKey.replace(/^["']|["']$/g, '').trim();
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
 * Generate commercial real estate AI response using OpenRouter API (google/gemini-2.5-flash)
 */
export async function generateOpenRouterRealEstateResponse(
  options: RealEstateAIOptions
): Promise<string> {
  const {
    message,
    history = [],
    propertyContext = '',
    lang = 'es',
    contextRole = 'general',
    agentName = 'Aria',
    agencyName = 'Aria Prop LATAM',
    apiKey,
  } = options;

  const openai = getOpenAIClient(apiKey);
  const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
  const trimmedMsg = message.trim();

  const langNames: Record<string, string> = { es: 'Español', en: 'English', pt: 'Português' };
  const targetLangName = langNames[lang] || 'Español';

  let roleDescription = 'asesora comercial inmobiliaria 24/7 experta en alta conversión';
  if (contextRole === 'finance') {
    roleDescription = 'evaluadora de rentabilidad, ROI, Cap Rate y apreciación de capital inmobiliario';
  } else if (contextRole === 'rag') {
    roleDescription = 'especialista en dossiers técnicos, planos, acabados y memorias descriptivas del catálogo';
  }

  const systemPrompt = `
Eres "${agentName}", ${roleDescription} para "${agencyName}" en América Latina.

IDIOMA OBLIGATORIO DE RESPUESTA: ${targetLangName.toUpperCase()}.
Debes responder SIEMPRE en ${targetLangName}. (Si el usuario habla en otro idioma, responde en ese mismo idioma).

REGLAS DE ACTUACIÓN COMERCIAL:
1. Actúa como asesora experta, empática y de alta conversión.
2. Califica activamente al cliente: identifica (a) Presupuesto estimado, (b) Zona de interés, (c) Operación (comprar/alquilar) y (d) Número de teléfono/contacto para WhatsApp.
3. Longitud máxima: Responde de forma directa y concisa en un MÁXIMO DE 3 PÁRRAFOS (2 a 4 líneas por párrafo).
4. Recuerda el historial previo y NUNCA repitas preguntas sobre datos ya especificados.
5. Si hay propiedades en la FUENTE DE DATOS que encajen, recomiéndalas por su título, precio y ubicación.

## FUENTE DE DATOS Y CATÁLOGO DE PROPIEDADES (RAG):
${propertyContext || 'No hay propiedades específicas cargadas aún. Invita al cliente a especificar sus criterios.'}
`;

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...history.map((h) => ({
      role: (h.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: h.content,
    })),
    { role: 'user', content: trimmedMsg },
  ];

  const completion = await openai.chat.completions.create({
    model,
    messages,
    temperature: 0.3,
    max_tokens: 800,
  });

  const reply = completion.choices?.[0]?.message?.content;
  if (!reply || !reply.trim()) {
    throw new Error('OpenRouter API returned empty response payload.');
  }

  return reply.trim();
}

/**
 * Extract structured lead qualification JSON from conversation using OpenRouter (google/gemini-2.5-flash)
 */
export async function extractLeadQualificationOpenRouter(options: {
  message: string;
  history?: ChatMessage[];
  apiKey?: string;
}): Promise<LeadQualificationResult | null> {
  const openai = getOpenAIClient(options.apiKey);
  const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;

  const conversationText = [
    ...(options.history || []).map((h) => `${h.sender.toUpperCase()}: ${h.content}`),
    `USER: ${options.message}`,
  ].join('\n');

  const systemPrompt = `
Eres un analizador de datos estructurados para una plataforma inmobiliaria.
Analiza la conversación y extrae la calificación del cliente en formato JSON estricto.

FORMATO DE SALIDA (JSON ÚNICAMENTE, SIN MARKDOWN NI TEXTO ADICIONAL):
{
  "qualified": boolean,
  "intent": "buy" | "rent" | "invest" | "unknown",
  "budgetMaxUsd": number o null,
  "zonePreference": string o null,
  "propertyType": string o null,
  "contactPhone": string o null,
  "visitRequested": boolean,
  "summary": string
}
`;

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: conversationText },
      ],
      temperature: 0.1,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    });

    const rawText = completion.choices?.[0]?.message?.content || '';
    const cleanJson = rawText.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson) as LeadQualificationResult;
  } catch {
    return null;
  }
}

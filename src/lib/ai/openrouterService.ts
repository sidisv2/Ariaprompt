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

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'google/gemini-2.5-flash';
const HTTP_REFERER = 'https://ariaprop.online';
const X_TITLE = 'Aria Prop';

/**
 * Clean and retrieve OpenRouter API key from environment or explicit parameter.
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
 * Returns configured OpenRouter model or defaults to google/gemini-2.5-flash
 */
export function getOpenRouterModel(): string {
  return process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
}

/**
 * Generate commercial real estate AI response using OpenRouter API (google/gemini-2.5-flash)
 */
export async function generateOpenRouterRealEstateResponse(
  options: RealEstateAIOptions
): Promise<{ text: string; source: 'openrouter' | 'fallback' }> {
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

  const cleanKey = getOpenRouterApiKey(apiKey);
  if (!cleanKey) {
    throw new Error('OPENROUTER_API_KEY is missing or empty.');
  }

  const model = getOpenRouterModel();
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

  const formattedMessages = [
    { role: 'system', content: systemPrompt },
    ...history.map((h) => ({
      role: h.sender === 'user' ? 'user' : 'assistant',
      content: h.content,
    })),
    { role: 'user', content: trimmedMsg },
  ];

  const payload = {
    model,
    messages: formattedMessages,
    temperature: 0.3,
    max_tokens: 800,
  };

  const response = await fetch(OPENROUTER_BASE_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${cleanKey}`,
      'HTTP-Referer': HTTP_REFERER,
      'X-Title': X_TITLE,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const replyContent = data?.choices?.[0]?.message?.content;

  if (!replyContent) {
    throw new Error('OpenRouter API returned empty response payload.');
  }

  return {
    text: replyContent.trim(),
    source: 'openrouter',
  };
}

/**
 * Extract structured lead qualification JSON from conversation using OpenRouter (google/gemini-2.5-flash)
 */
export async function extractLeadQualificationOpenRouter(options: {
  message: string;
  history?: ChatMessage[];
  apiKey?: string;
}): Promise<LeadQualificationResult | null> {
  const cleanKey = getOpenRouterApiKey(options.apiKey);
  if (!cleanKey) return null;

  const model = getOpenRouterModel();
  const conversationText = [
    ...options.history.map((h) => `${h.sender.toUpperCase()}: ${h.content}`),
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
    const response = await fetch(OPENROUTER_BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cleanKey}`,
        'HTTP-Referer': HTTP_REFERER,
        'X-Title': X_TITLE,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: conversationText },
        ],
        temperature: 0.1,
        max_tokens: 300,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const rawText = data?.choices?.[0]?.message?.content || '';
    const cleanJson = rawText.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson) as LeadQualificationResult;
  } catch {
    return null;
  }
}

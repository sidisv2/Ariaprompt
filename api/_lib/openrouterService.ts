import OpenAI from 'openai';

export interface ChatMessage {
  sender: 'user' | 'bot' | 'model' | 'assistant';
  content: string;
}

export interface RealEstateAIOptions {
  message: string;
  history?: ChatMessage[];
  propertyContext?: string;
  lang?: 'es' | 'en' | 'pt';
  contextRole?: 'general' | 'finance' | 'rag';
  agentName?: string;
  agencyName?: string;
  botTone?: 'friendly' | 'formal' | 'luxury' | 'direct';
  customInstructions?: string;
  faqKnowledge?: Array<{ question: string; answer: string }>;
  calendarBookingUrl?: string;
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
 * Stream commercial real estate AI response using OpenRouter API
 */
export async function* streamOpenRouterRealEstateResponse(
  options: RealEstateAIOptions
): AsyncGenerator<string, void, unknown> {
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

## GUARDRAILS DE SEGURIDAD Y PRECISIÓN ESTRICTA:
- PROHIBICIÓN ESTRICTA: Jamás inventes propiedades, ubicaciones o precios que no figuren explícitamente en el inventario provisto.
- Si un usuario consulta por una propiedad no disponible o fuera de rango, aclará que no disponés de esa unidad en este momento y ofrecé derivar la búsqueda a un asesor humano.
- En negociaciones de precio, contraofertas o señas, derivar inmediatamente al asesor comercial sin comprometer rebajas.

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

  try {
    const stream = await openai.chat.completions.create({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 800,
      stream: true,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || '';
      if (text) {
        yield text;
      }
    }
  } catch (err: any) {
    const status = err?.status || err?.statusCode;
    const errorMessage = err?.error?.message || err?.message || String(err);
    console.error(`❌ OpenRouter Streaming API Exception [Status ${status || 'N/A'}]:`, errorMessage);

    if (status === 401) {
      throw new Error(`Error de autenticación con OpenRouter (401): API Key no válida o expirada. (${errorMessage})`);
    } else if (status === 402) {
      throw new Error(`Error de saldo en OpenRouter (402): Cuenta sin créditos disponibles. (${errorMessage})`);
    } else if (status === 404) {
      throw new Error(`Modelo no encontrado en OpenRouter (404): '${model}' no existe o no está disponible. (${errorMessage})`);
    } else if (status === 429) {
      throw new Error(`Límite de solicitudes en OpenRouter (429): Rate limit excedido. (${errorMessage})`);
    } else {
      throw new Error(`Fallo en OpenRouter Streaming API (${status || 'Error'}): ${errorMessage}`);
    }
  }
}

/**
 * Generate commercial real estate AI response using OpenRouter API
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

## GUARDRAILS DE SEGURIDAD Y PRECISIÓN ESTRICTA:
- PROHIBICIÓN ESTRICTA: Jamás inventes propiedades, ubicaciones o precios que no figuren explícitamente en el inventario provisto.
- Si un usuario consulta por una propiedad no disponible o fuera de rango, aclará que no disponés de esa unidad en este momento y ofrecé derivar la búsqueda a un asesor humano.
- En negociaciones de precio, contraofertas o señas, derivar inmediatamente al asesor comercial sin comprometer rebajas.

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

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 800,
    });

    const reply = completion.choices?.[0]?.message?.content;
    if (!reply || !reply.trim()) {
      throw new Error('OpenRouter API devolvió una respuesta vacía.');
    }

    return reply.trim();
  } catch (err: any) {
    const status = err?.status || err?.statusCode;
    const errorMessage = err?.error?.message || err?.message || String(err);
    console.error(`❌ OpenRouter API Exception [Status ${status || 'N/A'}]:`, errorMessage);

    if (status === 401) {
      throw new Error(`Error de autenticación con OpenRouter (401): API Key no válida o expirada. (${errorMessage})`);
    } else if (status === 402) {
      throw new Error(`Error de saldo en OpenRouter (402): Cuenta sin créditos disponibles. (${errorMessage})`);
    } else if (status === 404) {
      throw new Error(`Modelo no encontrado en OpenRouter (404): '${model}' no existe o no está disponible. (${errorMessage})`);
    } else if (status === 429) {
      throw new Error(`Límite de solicitudes en OpenRouter (429): Rate limit excedido. (${errorMessage})`);
    } else {
      throw new Error(`Fallo en OpenRouter API (${status || 'Error'}): ${errorMessage}`);
    }
  }
}

/**
 * Generate Structured AI Response containing reply text and extracted lead data
 */
export async function generateStructuredAriaRealEstateResponse(
  options: RealEstateAIOptions
): Promise<StructuredRealEstateAIResponse> {
  const {
    message,
    history = [],
    propertyContext = '',
    lang = 'es',
    contextRole = 'general',
    agentName = 'Aria',
    agencyName = 'Aria Prop LATAM',
    botTone = 'friendly',
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

  const langNames: Record<string, string> = { es: 'Español', en: 'English', pt: 'Português' };
  const targetLangName = langNames[lang] || 'Español';

  let roleDescription = 'asesora comercial inmobiliaria 24/7 experta en alta conversión';
  if (contextRole === 'finance') {
    roleDescription = 'evaluadora de rentabilidad, ROI, Cap Rate y apreciación de capital inmobiliario';
  } else if (contextRole === 'rag') {
    roleDescription = 'especialista en dossiers técnicos, planos, acabados y memorias descriptivas del catálogo';
  }

  const toneGuides: Record<string, string> = {
    friendly: 'Adopta un tono cálido, empático, cercano e informal (tuteo cordial).',
    formal: 'Adopta un tono profesional, ejecutivo, estructurado y respetuoso (trato de usted).',
    luxury: 'Adopta un tono sumamente elegante, refinado, exclusivo y sofisticado enfocado en propiedades de alta gama.',
    direct: 'Adopta un tono ultra-rápido, conciso, directo y enfocado en datos técnicos y precios sin rodeos.',
  };
  const activeToneGuide = toneGuides[botTone] || toneGuides.friendly;

  const formattedFaqs = faqKnowledge.length > 0
    ? faqKnowledge.map((f, i) => `FAQ #${i + 1}: Q: "${f.question}" -> A: "${f.answer}"`).join('\n')
    : 'No hay preguntas frecuentes específicas cargadas.';

  const bookingUrlText = calendarBookingUrl
    ? `ENLACE OFICIAL DE AGENDAMIENTO EN LÍNEA: ${calendarBookingUrl}`
    : 'Informa al usuario que un asesor se comunicará para confirmar la fecha exacta.';

  const systemPrompt = `
Eres Aria, un asesor inmobiliario humano, profesional, sobrio y directo de Argentina (trato de 'vos', natural y comercial: "mirá", "fijate", "contame", "tenemos", "querés", "avisame").

CONOCIMIENTO GEOGRÁFICO INTEGRAL DE ARGENTINA:
- Comprendes perfectamente la jerarquía: País > Provincia > Departamento / Partido / Municipio > Localidad / Distrito / Barrio.
- En Mendoza:
  * San Rafael incluye los distritos: Villa Atuel, Rama Caída, Las Paredes, Cuadro Nacional, etc.
  * Gran Mendoza incluye: Godoy Cruz, Guaymallén, Maipú, Luján de Cuyo, Capital (Ciudad), Las Heras.
- En Buenos Aires:
  * CABA incluye: Palermo, Belgrano, Recoleta, Caballito, etc.

REGLAS DE RESPUESTA Y VENTA DIRECTA:
1. Si el cliente pregunta por una provincia, departamento o zona amplia (ej: "Mendoza", "San Rafael", "Buenos Aires"), presenta de inmediato las opciones disponibles en sus distritos/barrios. NUNCA digas que no hay nada disponible si figura en el catálogo provisto.
2. Respuestas DIRECTAS y COMPLETAS:
   - Menciona el título de la propiedad, tipo (casa, lote, depto), ubicación exacta, características clave (ambientes, baños, m²) y el PRECIO en USD.
   - Incluye SIEMPRE el link a la micro-ficha web interactiva para que el cliente vea la galería de fotos completa: https://ariaprop.online/p/[id]
3. Tono y Estilo:
   - Máximo 1 emoji por mensaje o ninguno.
   - Cero rodeos robóticos. No preguntes "¿te gustaría ver más detalles?" sin antes haberle dado los datos clave y el enlace.
   - Respuestas ágiles de 2 a 3 oraciones.

PAUTAS OBLIGATORIAS DE LENGUAJE HUMANO:
- Tono natural y fluido: Usá un español rioplatense/argentino profesional y cercano (voseo suave: "mirá", "fijate", "contame", "tenemos", "querés", "avisame").
- Respuestas directas y concisas: Máximo 2 a 3 oraciones por mensaje. La gente no lee bloques largos de texto en chat.
- Prohibidos clichés de robot: NUNCA digas frases como "¡Hola! Soy Aria Prop, tu asistente de Inteligencia Artificial", "Espero que este mensaje te encuentre bien", "¿En qué más puedo ayudarte hoy?" ni desgloses viñetas rígidas con títulos tipo 'Descripción:', 'Características:', 'Superficie:'.
- Presentación de opciones al grano:
  * Ejemplo natural: "¡Hola! Sí, en Barrio Buffano tenemos una casa chalet muy linda de 3 dormitorios con 250 m² a $12.000 USD. ¿Querés que te pase más fotos o coordinamos para verla?"
- Manejo de faltantes: Si no hay disponibilidad exacta en una zona, no pidas disculpas robóticas:
  * Ejemplo natural: "Por el momento no me quedó nada en esa zona puntual, pero sí tengo opciones similares cerca en Villa Atuel. ¿Te sirve que te muestre o preferís que te tome los datos y te avise ni bien ingrese una?"
- Emojis: Un emoji por mensaje como máximo (opcional y sutil: 👋, 📍, 🏡).

CALIFICACIÓN COMERCIAL INTELIGENTE:
- Identifica de forma orgánica en la conversación: (a) Presupuesto estimado, (b) Zona o barrio de interés, (c) Tipo de operación (venta/alquiler) e inmueble, y (d) Nombre del cliente.
- Si piden coordinar una visita (Lunes a Viernes 9 a 18 hs, Sábados 9 a 13 hs) o ficha técnica/PDF, propone fecha u horario con naturalidad comercial.

## REGLAS DE NEGOCIO DE LA INMOBILIARIA:
${customInstructions ? customInstructions : 'No hay reglas de negocio especiales especificadas.'}

## PREGUNTAS FRECUENTES (FAQ):
${formattedFaqs}

FORMATO DE SALIDA (ESTRICTAMENTE JSON VÁLIDO SIN MARKDOWN):
{
  "replyText": "Texto de respuesta para el usuario en WhatsApp",
  "extractedData": {
    "budget_max_usd": number | null,
    "preferred_zone": string | null,
    "property_type": string | null,
    "status": "active" | "qualified" | "handover" | "closed",
    "lead_name": string | null,
    "preferred_contact_slot": string | null,
    "requested_pdf_property_id": string | null,
    "requested_room_image": "Fachada" | "Cocina" | "Living" | "Dormitorio" | "Baño" | "Patio/Parque" | "Pileta" | "Plano" | "General" | null,
    "requested_pdf_property_title": string | null,
    "appointment": {
      "requested_date": string | null,
      "property_title": string | null,
      "notes": string | null
    } | null
  }
}

REGLAS DE EXTRACCIÓN:
- budget_max_usd: presupuesto numérico en USD si el usuario lo menciona o null.
- preferred_zone: zona o barrio especificado o null.
- preferred_contact_slot: si el cliente menciona disponibilidad horaria ("por la tarde", "de 8 a 13 hs", "después de las 15", "mañana a la mañana"), mapealo como franja formal (ej. "Mañana (08:00 - 13:00 hs)", "Tarde (14:00 - 18:00 hs)") o null.
- requested_room_image: si el cliente pide expresamente ver fotos de un ambiente puntual ("tenés fotos de la cocina?", "mostrame el patio/pileta", "cómo es el living?", "tenés plano?"), mapealo a ("Fachada" | "Cocina" | "Living" | "Dormitorio" | "Baño" | "Patio/Parque" | "Pileta" | "Plano") o null.
- property_type: tipo de inmueble y operación o null.
- requested_pdf_property_id: ID exacto de la propiedad en el catálogo si el usuario pide ficha, PDF o brochure (o null).
- requested_pdf_property_title: Título de la propiedad si se solicita ficha (o null).
- status:
  * "handover": SI EL USUARIO PIDE EXPLÍCITAMENTE "hablar con una persona", "un asesor humano", "un agente", "hablar con alguien" o atencion humana.
  * "qualified": si ya se identificó al menos la zona, el tipo de inmueble y el presupuesto estimado.
  * "closed": si cerró la operación o no requiere más seguimiento.
  * "active": en conversación inicial o exploratoria.
- lead_name: nombre del prospecto si se identifica en el chat o null.
- appointment:
  * Si el cliente solicita agendar una visita/cita, especifica fecha u horario hábil (Lunes a Viernes 9 a 18 hs, Sábados 9 a 13 hs):
    { "requested_date": "2026-08-25 15:00", "property_title": "Nombre de la propiedad", "notes": "Visita coordinada" }

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

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature: 0.2,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });

    const rawContent = completion.choices?.[0]?.message?.content || '';
    const cleanJson = rawContent.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    const replyText = parsed.replyText || parsed.message || parsed.response || rawContent;
    const apptRaw = parsed.extractedData?.appointment || parsed.appointment;
    const extractedData: ExtractedLeadData = {
      budget_max_usd: typeof parsed.extractedData?.budget_max_usd === 'number' ? parsed.extractedData.budget_max_usd : null,
      preferred_zone: typeof parsed.extractedData?.preferred_zone === 'string' ? parsed.extractedData.preferred_zone : null,
      property_type: typeof parsed.extractedData?.property_type === 'string' ? parsed.extractedData.property_type : null,
      status: ['active', 'qualified', 'handover', 'closed'].includes(parsed.extractedData?.status) ? parsed.extractedData.status : 'active',
      lead_name: typeof parsed.extractedData?.lead_name === 'string' ? parsed.extractedData.lead_name : null,
      requested_pdf_property_id: typeof parsed.extractedData?.requested_pdf_property_id === 'string' ? parsed.extractedData.requested_pdf_property_id : null,
      requested_pdf_property_title: typeof parsed.extractedData?.requested_pdf_property_title === 'string' ? parsed.extractedData.requested_pdf_property_title : null,
      appointment: apptRaw ? {
        requested_date: typeof apptRaw.requested_date === 'string' ? apptRaw.requested_date : null,
        property_title: typeof apptRaw.property_title === 'string' ? apptRaw.property_title : null,
        notes: typeof apptRaw.notes === 'string' ? apptRaw.notes : null,
      } : null,
    };

    return { replyText, extractedData };
  } catch (err: any) {
    console.warn('⚠️ Structured LLM generation fallback, returning standard string response:', err?.message || err);
    const fallbackText = await generateOpenRouterRealEstateResponse(options);
    return {
      replyText: fallbackText,
      extractedData: {
        budget_max_usd: null,
        preferred_zone: null,
        property_type: null,
        status: 'active',
        lead_name: null,
        requested_pdf_property_id: null,
        requested_pdf_property_title: null,
        appointment: null,
      },
    };
  }
}

/**
 * Extract structured lead qualification JSON from conversation using OpenRouter
 */
export async function extractLeadQualificationOpenRouter(options: {
  message: string;
  history?: ChatMessage[];
  apiKey?: string;
}): Promise<LeadQualificationResult | null> {
  try {
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
  } catch (err: any) {
    console.warn('Lead qualification extraction exception:', err?.message || err);
    return null;
  }
}

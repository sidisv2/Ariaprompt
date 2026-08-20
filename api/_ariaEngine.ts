import { createClient } from '@supabase/supabase-js';
import {
  generateOpenRouterRealEstateResponse,
  generateStructuredAriaRealEstateResponse,
  ExtractedLeadData,
} from './_lib/openrouterService.js';
import { notifyAgentLeadQualified, sendHandoverEmailNotification } from './_lib/notificationService.js';

export interface PropertyItem {
  id: string;
  title: string;
  type: string;
  price: number;
  address?: string;
  zone: string;
  city: string;
  country?: string;
  bedrooms: number;
  areaM2: number;
  description?: string;
  operation?: string;
  url?: string;
}

export const MARKET_CATALOG: PropertyItem[] = [
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
    operation: 'ALQUILER',
    description: 'Excelente departamento totalmente amoblado y equipado listo para ingresar. Edificio moderno con seguridad 24hs.',
    url: 'https://ariaprop.online/properties/mendoza-rent-01',
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
    operation: 'VENTA',
    description: 'Residencia de lujo con acabados de mármol importado, domótica integral y piscina privada.',
    url: 'https://ariaprop.online/properties/prop-101',
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
    operation: 'VENTA',
    description: 'Moderna casa independiente rodeada de naturaleza con seguridad privada.',
    url: 'https://ariaprop.online/properties/prop-102',
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
    operation: 'VENTA',
    description: 'Piso alto con vista panorámica al río y la reserva ecológica.',
    url: 'https://ariaprop.online/properties/prop-103',
  },
];

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

export interface ProcessAriaMessageOptions {
  organizationId: string;
  userPhone: string;
  userMessage: string;
  wamid?: string;
}

export interface ProcessAriaMessageResult {
  text: string;
  conversationId: string;
  extractedData?: ExtractedLeadData;
  recommendedPropId?: string;
}

/**
 * Multi-Tenant Structured AI Engine Execution for WhatsApp Automation
 * Connects to Supabase using Service Role Key, retrieves organization properties,
 * reads conversation history, calls OpenRouter (google/gemini-2.5-flash) returning JSON structured response,
 * updates lead metadata in wa_conversations and records messages in wa_messages.
 */
export async function processAriaMessage({
  organizationId,
  userPhone,
  userMessage,
  wamid,
}: ProcessAriaMessageOptions): Promise<ProcessAriaMessageResult> {
  const supabase = getBackendSupabaseClient();
  let conversationId = `conv-${organizationId}-${userPhone}`;
  const history: { sender: 'user' | 'assistant' | 'bot'; content: string }[] = [];
  let catalogContext = '';

  let botName = 'Aria';
  let agencyName = 'Aria Prop';
  let botTone: 'friendly' | 'formal' | 'luxury' | 'direct' = 'friendly';
  let customInstructions = '';
  let faqKnowledge: Array<{ question: string; answer: string }> = [];

  if (supabase) {
    try {
      // 1. Get or create conversation record for (organization_id, user_phone)
      const { data: convData } = await supabase
        .from('wa_conversations')
        .upsert(
          {
            organization_id: organizationId,
            user_phone: userPhone,
            last_message_at: new Date().toISOString(),
          },
          { onConflict: 'organization_id,user_phone' }
        )
        .select('id')
        .single();

      if (convData?.id) {
        conversationId = convData.id;
      }

      // 2. Insert incoming user message into wa_messages
      try {
        await supabase.from('wa_messages').insert({
          conversation_id: conversationId,
          organization_id: organizationId,
          wamid: wamid || undefined,
          sender_type: 'user',
          message_text: userMessage,
          created_at: new Date().toISOString(),
        });
      } catch {}

      // 3. Fetch recent conversation history for this conversation
      const { data: msgHistory } = await supabase
        .from('wa_messages')
        .select('sender_type, message_text')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(10);

      if (msgHistory && Array.isArray(msgHistory)) {
        for (const m of msgHistory) {
          if (m.message_text && m.message_text !== userMessage) {
            history.push({
              sender: m.sender_type === 'user' ? 'user' : 'assistant',
              content: m.message_text,
            });
          }
        }
      }

      // 4. Fetch available properties for this organization
      const { data: dbProps } = await supabase
        .from('properties')
        .select('*')
        .eq('organization_id', organizationId)
        .or('status.eq.available,status.eq.published,status.is.null')
        .limit(20);

      if (dbProps && dbProps.length > 0) {
        catalogContext = dbProps
          .map((p: any) => {
            const priceStr = p.price ? `$${Number(p.price).toLocaleString('en-US')} USD` : 'Consultar precio';
            const link = `https://ariaprop.online/properties/${p.id}`;
            return `- [ID: ${p.id}] "${p.title || 'Propiedad'}" (${(p.type || 'Inmueble').toUpperCase()} - ${p.operation || 'VENTA'}) en ${p.zone || p.location?.zone || ''}, ${p.city || p.location?.city || 'Mendoza'}. Precio: ${priceStr}. ${p.bedrooms || p.features?.bedrooms || 1} hab, ${p.area_m2 || p.features?.areaM2 || 50} m². Ficha: ${link}. ${p.description || ''}`;
          })
          .join('\n');
      }

      // 4b. Fetch organization bot identity & custom business rules
      try {
        const { data: orgConfig } = await supabase
          .from('organizations')
          .select('name, bot_name, bot_tone, custom_prompt_instructions, faq_knowledge')
          .eq('id', organizationId)
          .single();

        if (orgConfig) {
          if (orgConfig.name) agencyName = orgConfig.name;
          if (orgConfig.bot_name) botName = orgConfig.bot_name;
          if (['friendly', 'formal', 'luxury', 'direct'].includes(orgConfig.bot_tone)) {
            botTone = orgConfig.bot_tone;
          }
          if (orgConfig.custom_prompt_instructions) {
            customInstructions = orgConfig.custom_prompt_instructions;
          }
          if (orgConfig.faq_knowledge) {
            try {
              faqKnowledge = typeof orgConfig.faq_knowledge === 'string'
                ? JSON.parse(orgConfig.faq_knowledge)
                : orgConfig.faq_knowledge;
            } catch {}
          }
        }
      } catch {}
    } catch (dbErr) {
      console.warn('⚠️ Supabase context lookup warning in processAriaMessage:', dbErr);
    }
  }

  // Fallback to default catalog if organization has no properties loaded in DB yet
  if (!catalogContext) {
    catalogContext = MARKET_CATALOG.map(
      (p) =>
        `- [ID: ${p.id}] "${p.title}" (${p.type.toUpperCase()} - ${p.operation}) en ${p.address}, ${p.zone}, ${p.city}. Precio: $${p.price.toLocaleString('en-US')} USD. ${p.bedrooms} hab, ${p.areaM2} m². Ficha: ${p.url}. ${p.description}`
    ).join('\n');
  }

  // 5. Generate structured response using OpenRouter (google/gemini-2.5-flash)
  const { replyText, extractedData } = await generateStructuredAriaRealEstateResponse({
    message: userMessage,
    history: history.map((h) => ({ sender: h.sender, content: h.content })),
    propertyContext: catalogContext,
    lang: 'es',
    agentName: botName,
    agencyName: agencyName,
    botTone: botTone,
    customInstructions: customInstructions,
    faqKnowledge: faqKnowledge,
  });

  // 6. Update wa_conversations and wa_messages in Supabase
  if (supabase && conversationId) {
    try {
      let previousStatus = 'active';
      const { data: currentConv } = await supabase
        .from('wa_conversations')
        .select('status')
        .eq('id', conversationId)
        .single();

      if (currentConv?.status) {
        previousStatus = currentConv.status;
      }

      const updateData: Record<string, any> = {
        last_message_at: new Date().toISOString(),
      };

      if (extractedData.budget_max_usd !== null) {
        updateData.budget_max_usd = extractedData.budget_max_usd;
      }
      if (extractedData.preferred_zone !== null) {
        updateData.preferred_zone = extractedData.preferred_zone;
      }
      if (extractedData.property_type !== null) {
        updateData.property_type = extractedData.property_type;
      }
      if (extractedData.lead_name !== null) {
        updateData.user_name = extractedData.lead_name;
      }
      if (extractedData.status) {
        updateData.status = extractedData.status;
      }

      await supabase
        .from('wa_conversations')
        .update(updateData)
        .eq('id', conversationId);

      // Trigger automatic agent notification if lead transitioned to 'qualified' for the first time
      if (extractedData.status === 'qualified' && previousStatus !== 'qualified') {
        notifyAgentLeadQualified({
          organizationId,
          userPhone,
          userName: extractedData.lead_name,
          budgetMaxUsd: extractedData.budget_max_usd,
          preferredZone: extractedData.preferred_zone,
          propertyType: extractedData.property_type,
          conversationId,
          supabaseClient: supabase,
        }).catch((err) => console.warn('⚠️ Agent notification trigger warning:', err));
      }

      // Trigger immediate email notification if lead transitioned to 'handover' or 'human_handoff'
      if ((extractedData.status === 'handover' || extractedData.status === 'human_handoff') && previousStatus !== 'handover') {
        sendHandoverEmailNotification({
          organizationId,
          userPhone,
          userName: extractedData.lead_name,
          budgetMaxUsd: extractedData.budget_max_usd,
          preferredZone: extractedData.preferred_zone,
          propertyType: extractedData.property_type,
          lastMessage: userMessage,
          conversationId,
          supabaseClient: supabase,
        }).catch((err) => console.warn('⚠️ Handover email notification trigger warning:', err));
      }
    } catch (updateErr) {
      console.warn('⚠️ wa_conversations metadata update warning:', updateErr);
    }

    try {
      await supabase.from('wa_messages').insert({
        conversation_id: conversationId,
        organization_id: organizationId,
        sender_type: 'assistant',
        message_text: replyText,
        created_at: new Date().toISOString(),
      });
    } catch {}
  }

  return {
    text: replyText,
    conversationId,
    extractedData,
  };
}

/**
 * Standard Aria AI response generator for web chat and standalone API calls
 */
export async function generateAriaAiResponse({
  message,
  history = [],
  lang = 'es',
}: {
  message: string;
  history?: { sender: string; content: string }[];
  lang?: string;
}): Promise<string> {
  const catalogContext = MARKET_CATALOG.map(
    (p) =>
      `- [ID: ${p.id}] "${p.title}" (${p.type.toUpperCase()} - ${p.operation}) en ${p.address}, ${p.zone}, ${p.city}, ${p.country}. Precio: $${p.price.toLocaleString('en-US')} USD. ${p.bedrooms} hab, ${p.areaM2} m². Ficha: ${p.url}. ${p.description}`
  ).join('\n');

  try {
    return await generateOpenRouterRealEstateResponse({
      message,
      history: history.map((h) => ({ sender: h.sender as 'user' | 'bot', content: h.content })),
      propertyContext: catalogContext,
      lang: (lang as 'es' | 'en' | 'pt') || 'es',
      agentName: 'Aria',
      agencyName: 'Aria Prop LATAM',
    });
  } catch (err: any) {
    console.error('❌ OpenRouter API Error in generateAriaAiResponse:', err?.message || err);
    throw new Error(`OpenRouter API Failure: ${err?.message || 'Failed to generate LLM response'}`);
  }
}

/**
 * Helper to build quick client-side responses with memory
 */
export function buildMemoryAwareResponse(
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

  if (
    lowerMsg === 'hola' ||
    lowerMsg === 'hola!' ||
    lowerMsg === 'buenas' ||
    lowerMsg === 'buenos dias' ||
    lowerMsg === 'hello' ||
    lowerMsg === 'hi'
  ) {
    return {
      text: `¡Hola! Soy Aria, tu asesora comercial inmobiliaria 24/7 en ariaprop.online. ¿Buscas comprar o alquilar alguna propiedad hoy?`,
      recommendedPropId: undefined,
    };
  }

  const matches = MARKET_CATALOG.filter((p) => {
    const city = p.city.toLowerCase();
    const zone = p.zone.toLowerCase();
    const type = p.type.toLowerCase();

    return fullLowerQuery.includes(city) || fullLowerQuery.includes(zone) || fullLowerQuery.includes(type);
  });

  if (matches.length > 0) {
    const topProp = matches[0];
    return {
      text: `¡Hola! Encontré esta excelente opción en nuestro catálogo verificado:\n\n🏡 **${topProp.title}** en ${topProp.zone}, ${topProp.city}\n• **Precio:** $${topProp.price.toLocaleString('en-US')} USD\n• **Ambientes:** ${topProp.bedrooms} dormitorios (${topProp.areaM2} m²)\n• **Ficha:** ${topProp.url}\n\n¿Te gustaría agendar una visita presencial o recibir más detalles?`,
      recommendedPropId: topProp.id,
    };
  }

  return {
    text: `Hola. Con gusto te asesoro sobre nuestro catálogo en ariaprop.online. ¿En qué ciudad o zona estás buscando propiedad y qué presupuesto aproximado tienes?`,
    recommendedPropId: undefined,
  };
}

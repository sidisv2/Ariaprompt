import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { generateStructuredAriaRealEstateResponse, ExtractedLeadData } from '../_lib/openrouterService.js';

function getBackendSupabaseClient() {
  const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
  const supabaseKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ''
  ).trim();
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
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

/**
 * Intelligent rule-based fallback response generator (used if LLM API is unavailable)
 * Evaluates FAQs and business instructions dynamically.
 */
function generateCommercialFallbackResponse(
  message: string,
  agentName: string = 'JULIO',
  agencyName: string = 'Inmobiliaria',
  properties: any[] = [],
  customRules: string = '',
  faqList: any[] = [],
  bookingUrl: string = ''
): { replyText: string; extractedData: ExtractedLeadData; matchedProperties: any[] } {
  const query = message.toLowerCase();

  // 1. Match configured FAQs from Supabase
  if (Array.isArray(faqList) && faqList.length > 0) {
    for (const faq of faqList) {
      if (!faq.question || !faq.answer) continue;
      const qWords = faq.question.toLowerCase().split(' ').filter((w: string) => w.length > 3);
      const hasMatch = qWords.some((w: string) => query.includes(w));
      if (hasMatch) {
        return {
          replyText: faq.answer,
          extractedData: {
            budget_max_usd: null,
            preferred_zone: null,
            property_type: null,
            operation_type: null,
            lead_name: null,
            status: 'active',
          },
          matchedProperties: properties.slice(0, 2),
        };
      }
    }
  }

  // 2. Booking intent
  if (
    query.includes('visita') ||
    query.includes('ver') ||
    query.includes('agendar') ||
    query.includes('cita') ||
    query.includes('conocer') ||
    query.includes('horario')
  ) {
    const bookingMsg = bookingUrl
      ? `¡Con gusto! Podés coordinar una visita presencial directamente desde nuestro calendario oficial aquí: ${bookingUrl} o dejarnos tu número de WhatsApp para contactarte.`
      : `Con mucho gusto podemos coordinar una visita presencial. Por favor dejanos tu número de WhatsApp y un asesor comercial de ${agencyName} te contactará a la brevedad para agendar día y hora.`;

    return {
      replyText: bookingMsg,
      extractedData: {
        budget_max_usd: null,
        preferred_zone: null,
        property_type: null,
        operation_type: null,
        lead_name: null,
        status: 'qualified',
      },
      matchedProperties: properties.slice(0, 2),
    };
  }

  // 3. Greetings
  if (query.includes('hola') || query.includes('buenas') || query.includes('buenos dias') || query.includes('buenas tardes')) {
    return {
      replyText: `¡Hola! 👋 Soy ${agentName} de ${agencyName}. Contame, ¿qué tipo de propiedad estás buscando o en qué zona te gustaría encontrar?`,
      extractedData: {
        budget_max_usd: null,
        preferred_zone: null,
        property_type: null,
        operation_type: null,
        lead_name: null,
        status: 'active',
      },
      matchedProperties: properties.slice(0, 2),
    };
  }

  // 4. Custom business rules fallback
  if (customRules) {
    return {
      replyText: `He tomado nota de tu consulta sobre "${message}". ${customRules}. Si nos compartís tu número de WhatsApp, un asesor comercial de ${agencyName} se pondrá en contacto para brindarte atención personalizada.`,
      extractedData: {
        budget_max_usd: null,
        preferred_zone: null,
        property_type: null,
        operation_type: null,
        lead_name: null,
        status: 'active',
      },
      matchedProperties: properties.slice(0, 2),
    };
  }

  return {
    replyText: `¡Hola! Tomé nota de lo que estás buscando. Dejame tu número de WhatsApp o contame qué zona y presupuesto manejás así te paso las mejores opciones que tenemos disponibles.`,
    extractedData: {
      budget_max_usd: null,
      preferred_zone: null,
      property_type: null,
      operation_type: null,
      lead_name: null,
      status: 'active',
    },
    matchedProperties: properties.slice(0, 2),
  };
}

export async function handleChatRoute(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const {
      message,
      message_type,
      messageType,
      media_url,
      mediaUrl,
      history = [],
      leadId,
      lead_id,
      phone,
      user_phone,
      agencyId,
      agency_id,
      orgId,
      agentName,
      botName,
      agencyName,
      customRules,
      faqList = [],
      bookingUrl,
    } = body;

    const activeMediaType = message_type || messageType || (media_url || mediaUrl ? 'image' : 'text');
    const activeMediaUrl = media_url || mediaUrl || null;

    const activeLeadId = leadId || lead_id;
    const clientPhone = phone || user_phone;

    const targetId = agencyId || agency_id || orgId;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'El mensaje es obligatorio' });
    }

    const supabase = getBackendSupabaseClient();
    let properties: any[] = [];
    let botConfig: any = null;

    if (supabase) {
      try {
        if (targetId) {
          const { data: orgData } = await supabase
            .from('organizations')
            .select('*')
            .or(`id.eq.${targetId},user_id.eq.${targetId}`)
            .maybeSingle();

          if (orgData) {
            botConfig = orgData;
          } else {
            const { data: profData } = await supabase
              .from('profiles')
              .select('*, organizations(*)')
              .eq('id', targetId)
              .maybeSingle();

            if (profData?.organizations) {
              botConfig = profData.organizations;
            }
          }
        }

        // Realizar consulta directa de todas las propiedades activas y públicas disponibles
        let propQuery = supabase
          .from('properties')
          .select('*')
          .neq('is_public', false)
          .in('status', ['available', 'disponible', 'published']);

        if (botConfig?.id || targetId) {
          const activeOrg = botConfig?.id || targetId;
          propQuery = propQuery.or(`organization_id.eq.${activeOrg},user_id.eq.${activeOrg}`);
        }

        const { data: propsData, error: propsErr } = await propQuery.limit(100);
        if (!propsErr && propsData && propsData.length > 0) {
          properties = propsData;
        } else {
          // Fallback global de propiedades activas si no hay filtro de org específico
          const { data: fallbackProps } = await supabase
            .from('properties')
            .select('*')
            .neq('is_public', false)
            .in('status', ['available', 'disponible'])
            .limit(100);
          if (fallbackProps && fallbackProps.length > 0) {
            properties = fallbackProps;
          }
        }
      } catch (err) {
        console.warn('Supabase fetch error in chatHandler:', err);
      }
    }

    const effectiveAgentName = botName || agentName || botConfig?.bot_name || 'JULIO';
    const effectiveAgencyName = agencyName || botConfig?.name || 'Inmobiliaria';
    const effectiveCustomRules = customRules || botConfig?.custom_prompt_instructions || botConfig?.system_prompt || '';
    const effectiveFaqs = faqList.length > 0 ? faqList : (botConfig?.faq_knowledge || []);
    const effectiveBookingUrl = bookingUrl || botConfig?.calendar_booking_url || '';

    const propertyCatalogText = properties
      .map((p) => {
        const rawOp = p.operation_type || p.operation || (Number(p.price) < 5000 ? 'rent' : 'sale');
        const isSale = rawOp === 'sale' || rawOp === 'venta';
        const isTemp = rawOp === 'temporary_rent' || rawOp === 'temporal';
        const opTag = isTemp ? '[ALQUILER TEMPORAL]' : isSale ? '[VENTA]' : '[ALQUILER TRADICIONAL]';
        
        let periodStr = '';
        if (!isSale) {
          const period = p.rental_period || (isTemp ? 'nightly' : 'monthly');
          periodStr = period === 'nightly' ? ' por noche' : period === 'yearly' ? ' por año' : ' por mes';
        }

        const loc = [p.address, p.zone, p.city].filter(Boolean).join(', ') || 'Ubicación céntrica';
        const dorms = p.bedrooms ?? p.features?.bedrooms ?? 2;
        const baths = p.bathrooms ?? p.features?.bathrooms ?? 1;
        const area = p.surface_m2 ?? p.area_m2 ?? p.features?.areaM2 ?? 60;
        const desc = p.description ? ` - ${p.description.slice(0, 120)}` : '';

        return `- [ID: ${p.id} | Código: ${p.code || p.id}] ${opTag} "${p.title}" (${(p.type || 'Inmueble').toUpperCase()}) en ${loc}. Precio: ${Number(p.price).toLocaleString('en-US')} ${p.currency || 'USD'}${periodStr}. ${dorms} hab, ${baths} baños, ${area} m².${desc} Ficha: https://ariaprop.online/properties/${p.id}`;
      })
      .join('\n');

    // 1. Check if lead is handled by Human or IA & Retrieve persistent memory
    let leadRecord: any = null;
    let persistentHistory: Array<{ sender: 'user' | 'assistant'; content: string }> = [];

    if (supabase && (activeLeadId || clientPhone)) {
      try {
        let leadQuery = supabase.from('leads').select('*');
        if (activeLeadId) {
          leadQuery = leadQuery.eq('id', activeLeadId);
        } else if (clientPhone) {
          leadQuery = leadQuery.or(`phone.eq.${clientPhone},user_phone.eq.${clientPhone}`);
        }
        const { data: foundLead } = await leadQuery.maybeSingle();
        if (foundLead) {
          leadRecord = foundLead;
        }

        // Fetch last 15 messages from chat_messages ordered chronologically (created_at ASC)
        const targetLeadIdentifier = leadRecord?.id || activeLeadId;
        if (targetLeadIdentifier) {
          const { data: dbChatMsgs } = await supabase
            .from('chat_messages')
            .select('sender, content, created_at')
            .eq('lead_id', targetLeadIdentifier)
            .order('created_at', { ascending: true })
            .limit(15);

          if (dbChatMsgs && dbChatMsgs.length > 0) {
            persistentHistory = dbChatMsgs.map((m: any) => ({
              sender: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
              content: m.content || '',
            }));
          }
        }
      } catch (leadCheckErr) {
        console.warn('Error checking lead state / chat_messages memory:', leadCheckErr);
      }
    }

    // Persist user incoming message into chat_messages with media_url support
    if (supabase && (leadRecord?.id || activeLeadId)) {
      try {
        await supabase.from('chat_messages').insert({
          lead_id: leadRecord?.id || activeLeadId,
          sender: 'user',
          sender_type: 'user',
          message_type: activeMediaType,
          media_type: activeMediaType,
          media_url: activeMediaUrl,
          content: message || (activeMediaType === 'image' ? 'Foto adjunta' : ''),
          message_text: message || (activeMediaType === 'image' ? 'Foto adjunta' : ''),
          created_at: new Date().toISOString(),
        });
      } catch (insertUserMsgErr) {
        console.warn('Error persisting incoming user message in chat_messages:', insertUserMsgErr);
      }
    }

    // 2. If handled_by is human -> Do NOT invoke LLM, allow human takeover
    const isHumanHandled = leadRecord?.handled_by === 'human' || leadRecord?.status === 'handover';
    if (isHumanHandled) {
      return res.status(200).json({
        success: true,
        handled_by: 'human',
        reply: null,
        message: 'Mensaje recibido. Un asesor humano te responderá en breve.',
        text: 'Mensaje recibido. Un asesor humano te responderá en breve.',
        source: 'human_takeover_queue',
      });
    }

    // Adapt history (combining persistent DB memory with any client passed history)
    const adaptedHistory: Array<{ sender: 'user' | 'assistant'; content: string }> = persistentHistory.length > 0
      ? persistentHistory
      : history.map((h: any) => ({
          sender: (h.sender === 'user' || h.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
          content: h.content || h.text || (h.parts && h.parts[0]?.text) || '',
        }));

    try {
      const response = await generateStructuredAriaRealEstateResponse({
        message,
        history: adaptedHistory,
        propertyContext: propertyCatalogText,
        agentName: effectiveAgentName,
        agencyName: effectiveAgencyName,
        customInstructions: effectiveCustomRules,
        faqKnowledge: effectiveFaqs,
        calendarBookingUrl: effectiveBookingUrl,
      });

      const latencyMs = Date.now() - startTime;

      // Persist assistant message in chat_messages
      if (supabase && (leadRecord?.id || activeLeadId)) {
        try {
          await supabase.from('chat_messages').insert({
            lead_id: leadRecord?.id || activeLeadId,
            sender: 'assistant',
            content: response.replyText,
            created_at: new Date().toISOString(),
          });
        } catch (_) {}
      }

      return res.status(200).json({
        success: true,
        handled_by: 'ia',
        reply: response.replyText,
        replyText: response.replyText,
        text: response.replyText,
        message: response.replyText,
        extractedData: response.extractedData,
        matchedProperties: properties.slice(0, 10), totalCatalogCount: properties.length,
        latencyMs,
        source: 'openrouter_ai',
      });
    } catch (llmErr) {
      console.warn('LLM fallback triggered in chatHandler:', llmErr);
      const fallback = generateCommercialFallbackResponse(
        message,
        effectiveAgentName,
        effectiveAgencyName,
        properties,
        effectiveCustomRules,
        effectiveFaqs,
        effectiveBookingUrl
      );
      const latencyMs = Date.now() - startTime;

      return res.status(200).json({
        success: true,
        reply: fallback.replyText,
        replyText: fallback.replyText,
        text: fallback.replyText,
        message: fallback.replyText,
        extractedData: fallback.extractedData,
        matchedProperties: fallback.matchedProperties,
        latencyMs,
        source: 'smart_commercial_fallback',
      });
    }
  } catch (err: any) {
    console.error('Chat handler error:', err);
    return res.status(500).json({
      error: 'Error al procesar el mensaje en el motor de IA',
      details: err?.message || err,
    });
  }
}

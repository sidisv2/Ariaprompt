import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { generateStructuredAriaRealEstateResponse, PropertyForPrompt } from '../_lib/openrouterService.js';
import { classifyMetaError, markWhatsAppMessageAsRead } from '../_lib/metaResilience.js';

export const maxDuration = 30;

// Set en memoria para deduplicación local instantánea (<1ms) entre peticiones concurrentes
const inMemoryProcessedWamids = new Set<string>();

// Map de Debounce y Locks en memoria para agrupar ráfagas rápidas de mensajes ("Hola", "Quiero un depto", "en San Rafael")
interface PendingDebounceState {
  timer: NodeJS.Timeout;
  messages: Array<{ wamid: string; text: string; mediaUrl: string | null; messageType: string }>;
  fromNumber: string;
  pushName: string;
  businessPhoneNumberId: string;
  org: any;
  resolveCallbacks: Array<() => void>;
}
const activeDebounceStreams = new Map<string, PendingDebounceState>();

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
 * Validates Meta X-Hub-Signature-256 using timing-safe comparison
 */
function validateMetaSignature(rawBody: string, signatureHeader: string | null | undefined, appSecret: string): boolean {
  if (!signatureHeader || !appSecret || !rawBody) return true; // Si no se ha configurado secret en .env, permitir
  try {
    const [algo, signature] = signatureHeader.split('=');
    if (algo !== 'sha256' || !signature) return false;
    const hmac = crypto.createHmac('sha256', appSecret);
    const digest = hmac.update(rawBody).digest('hex');
    const sigBuffer = Buffer.from(signature, 'utf8');
    const digestBuffer = Buffer.from(digest, 'utf8');
    if (sigBuffer.length !== digestBuffer.length) return false;
    return crypto.timingSafeEqual(sigBuffer, digestBuffer);
  } catch {
    return false;
  }
}

/**
 * Intenta reclamar atómicamente el WAMID en Supabase.
 * Retorna true si es el primer reclamo (debe procesarse).
 * Retorna false si es duplicado.
 */
async function tryClaimMessage(supabase: any, wamid: string): Promise<boolean> {
  if (!wamid) return true;

  // 1. Verificación en memoria
  if (inMemoryProcessedWamids.has(wamid)) {
    return false;
  }
  inMemoryProcessedWamids.add(wamid);
  if (inMemoryProcessedWamids.size > 1000) {
    const firstKey = inMemoryProcessedWamids.keys().next().value;
    if (firstKey) inMemoryProcessedWamids.delete(firstKey);
  }

  // 2. Inserción atómica UNIQUE en Supabase
  if (supabase) {
    try {
      const { error } = await supabase
        .from('processed_messages')
        .insert({
          wamid,
          created_at: new Date().toISOString(),
        });

      if (error) {
        if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
          return false;
        }
      }
    } catch (e: any) {
      console.warn('[whatsappHandler] Warn en tryClaimMessage:', e.message);
    }
  }

  return true;
}

/**
 * Worker de Conversación y Envío Outbound con Debounce Agrupado
 */
async function processDebouncedConversation(streamKey: string, state: PendingDebounceState, supabase: any) {
  const { messages, fromNumber, pushName, businessPhoneNumberId, org } = state;
  activeDebounceStreams.delete(streamKey);

  const orgId = org?.id || '13d92ac1-1b4a-4d3f-8418-abff914b0500';
  const userId = org?.user_id || orgId;
  const botName = org?.bot_name || 'Aria';
  const agencyName = org?.name || 'Inmobiliaria';
  const customRules = org?.custom_prompt_instructions || org?.system_prompt || '';
  const faqList = org?.faq_knowledge || [];
  const bookingUrl = org?.calendar_booking_url || '';
  const accessToken = (org?.meta_access_token || org?.wa_access_token || process.env.META_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN || '').trim();

  // 1. Unificar los textos de los mensajes agrupados por debounce
  const combinedUserText = messages.map(m => m.text).join(' ');
  const latestMessage = messages[messages.length - 1];

  console.log(`⚡ [Conversation Worker] Procesando bloque agrupado (${messages.length} msgs) para ${fromNumber}: "${combinedUserText}"`);

  let conversationHistory: Array<{ sender: 'user' | 'assistant'; content: string }> = [];
  let existingLeadId: string | null = null;
  let leadRecord: any = null;

  // 2. Persistir Lead y Mensajes Inbound
  if (supabase) {
    try {
      const clientName = pushName ? pushName.trim() : `WhatsApp (${fromNumber.slice(-4)})`;

      const { data: foundLead } = await supabase
        .from('leads')
        .select('*')
        .eq('phone', fromNumber)
        .maybeSingle();

      if (foundLead) {
        leadRecord = foundLead;
        existingLeadId = foundLead.id;

        await supabase
          .from('leads')
          .update({
            last_message: combinedUserText,
            organization_id: foundLead.organization_id || orgId,
            user_id: foundLead.user_id || userId,
            name: foundLead.name && !foundLead.name.includes('WhatsApp') ? foundLead.name : clientName,
            channel: 'WHATSAPP',
            updated_at: new Date().toISOString(),
          })
          .eq('id', foundLead.id);
      } else {
        const { data: newLead } = await supabase
          .from('leads')
          .insert({
            organization_id: orgId,
            user_id: userId,
            phone: fromNumber,
            name: clientName,
            channel: 'WHATSAPP',
            source: 'whatsapp',
            status: 'new',
            handled_by: 'ia',
            last_message: combinedUserText,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select('*')
          .single();

        if (newLead) {
          leadRecord = newLead;
          existingLeadId = newLead.id;
        }
      }

      // Persistir cada mensaje inbound en chat_messages
      if (existingLeadId) {
        for (const msg of messages) {
          await supabase.from('chat_messages').insert({
            lead_id: existingLeadId,
            sender: 'user',
            message_type: msg.messageType,
            media_url: msg.mediaUrl,
            content: msg.text,
            message_text: msg.text,
            created_at: new Date().toISOString(),
          });
        }

        // Cargar historial de los últimos 20 mensajes cronológicos
        const { data: pastMsgs } = await supabase
          .from('chat_messages')
          .select('sender, content, message_text, created_at')
          .eq('lead_id', existingLeadId)
          .order('created_at', { ascending: true })
          .limit(20);

        if (pastMsgs && pastMsgs.length > 0) {
          conversationHistory = pastMsgs
            .filter((m: any) => (m.content || m.message_text) && (m.content || m.message_text) !== combinedUserText)
            .map((m: any) => ({
              sender: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
              content: m.content || m.message_text || '',
            }));
        }
      }
    } catch (dbErr) {
      console.error('[Conversation Worker] Error en persistencia de Lead / Mensajes:', dbErr);
    }
  }

  // 3. Marcar como leído en Meta
  if (accessToken && businessPhoneNumberId && latestMessage.wamid) {
    markWhatsAppMessageAsRead({
      wamid: latestMessage.wamid,
      phoneNumberId: businessPhoneNumberId,
      accessToken,
    }).catch(() => {});
  }

  // Si está en Handover humano, no responder con IA
  const isHumanTakeover = leadRecord?.handled_by === 'human' || leadRecord?.status === 'handover';
  if (isHumanTakeover) {
    console.log(`👤 Lead ${fromNumber} está en modo Intervención Humana.`);
    return;
  }

  // 4. Cargar Propiedades Activas
  let rawProperties: any[] = [];
  if (supabase) {
    try {
      let propQuery = supabase
        .from('properties')
        .select('*')
        .in('status', ['available', 'active', 'disponible', 'published', 'Disponible', 'Publicada']);

      if (orgId && orgId !== 'org-default') {
        propQuery = propQuery.or(`organization_id.eq.${orgId},user_id.eq.${userId},organization_id.is.null`);
      }

      const { data: propsData } = await propQuery;
      if (propsData && propsData.length > 0) {
        rawProperties = propsData;
      }
    } catch (e) {
      console.error('[Conversation Worker] Error obteniendo propiedades:', e);
    }
  }

  const propertiesListForPrompt: PropertyForPrompt[] = rawProperties.map((p) => {
    let displayType = p.type || 'Inmueble';
    if (p.type === 'house') displayType = 'Casa';
    else if (p.type === 'apartment' || p.type === 'depto') displayType = 'Departamento';
    else if (p.type === 'land' || p.type === 'lote') displayType = 'Lote / Terreno';

    return {
      id: p.id,
      title: p.title || 'Propiedad disponible',
      type: displayType,
      operation_type: p.operation_type === 'rent' ? 'Alquiler' : (p.operation_type || 'Venta'),
      price_usd: Number(p.price || p.price_usd || 0),
      currency: p.currency || 'USD',
      province: p.state || p.province || 'Mendoza',
      department: p.city || p.department || 'San Rafael',
      locality: p.zone || p.locality || null,
      zone: p.zone || null,
      city: p.city || null,
      address: p.address || null,
      bedrooms: p.bedrooms ?? p.rooms ?? null,
      bathrooms: p.bathrooms ?? null,
      area_m2: p.area_m2 ?? p.surface_m2 ?? p.surface_total ?? null,
      description: p.description || null,
    };
  });

  // 5. Generar Respuesta con IA
  let botReplyText = '';
  try {
    const aiResponse = await generateStructuredAriaRealEstateResponse({
      message: combinedUserText,
      history: conversationHistory,
      propertiesList: propertiesListForPrompt,
      agentName: botName,
      agencyName,
      customInstructions: customRules,
      faqKnowledge: Array.isArray(faqList) ? faqList : [],
      calendarBookingUrl: bookingUrl,
    });

    botReplyText = aiResponse.replyText;
  } catch (aiErr) {
    console.error('[Conversation Worker] Error en OpenRouter:', aiErr);
    botReplyText = `¡Hola! Gracias por comunicarte con ${agencyName}. Soy ${botName}. ¿En qué tipo de propiedad estás interesado o en qué zona buscas?`;
  }

  // 6. Persistir Respuesta Outbound en CRM
  if (supabase && existingLeadId) {
    try {
      await supabase.from('chat_messages').insert({
        lead_id: existingLeadId,
        sender: 'assistant',
        message_type: 'text',
        content: botReplyText,
        message_text: botReplyText,
        created_at: new Date().toISOString(),
      });

      await supabase.from('wa_messages').insert([
        {
          conversation_id: existingLeadId,
          organization_id: orgId,
          sender_type: 'bot',
          message_text: botReplyText,
          created_at: new Date().toISOString(),
        },
      ]);

      await supabase
        .from('leads')
        .update({
          last_message: botReplyText,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingLeadId);
    } catch (msgLogErr) {
      console.error('[Conversation Worker] Error guardando outbound en CRM:', msgLogErr);
    }
  }

  // 7. Enviar Outbound a Meta WhatsApp Cloud API con Clasificación de Errores y Backoff
  if (accessToken && businessPhoneNumberId) {
    try {
      const metaSendUrl = `https://graph.facebook.com/v20.0/${businessPhoneNumberId}/messages`;
      const sendRes = await fetch(metaSendUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: fromNumber,
          type: 'text',
          text: { body: botReplyText },
        }),
      });

      const responseData = await sendRes.json().catch(() => ({}));

      if (!sendRes.ok) {
        const errorInfo = classifyMetaError(responseData, sendRes.status);
        console.error(`🚨 [Meta Graph API Error Class]:`, errorInfo);

        if (errorInfo.action === 'spam_restriction_halt') {
          console.warn(`🛑 Meta restricción de calidad (131048). Deteniendo envío sin reintentos agresivos.`);
        }
      } else {
        console.log(`✅ [Outbound Sent] WhatsApp response successfully delivered to ${fromNumber} (wamid: ${responseData.messages?.[0]?.id || 'N/A'})`);
      }
    } catch (netErr) {
      console.error('[Outbound Send Exception]:', netErr);
    }
  }
}

export async function handleWhatsAppRoute(req: VercelRequest, res: VercelResponse, subRoute: string = 'webhook') {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Hub-Signature-256');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabase = getBackendSupabaseClient();

  // SUB-ROUTE: WEBHOOK (/api/webhook/whatsapp, /api/whatsapp/webhook, /api/whatsapp-webhook)
  if (subRoute === 'webhook' || subRoute === 'whatsapp-webhook') {
    // A) GET: Meta Verification Handshake
    if (req.method === 'GET') {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      const expectedToken = (
        process.env.WHATSAPP_VERIFY_TOKEN ||
        process.env.META_WEBHOOK_VERIFY_TOKEN ||
        'aria_prop_whatsapp_webhook_secret_verify_token_2026'
      ).trim();

      if (mode === 'subscribe' && token) {
        const verifyToken = String(token).trim();
        let isValid = verifyToken === expectedToken;

        if (!isValid && supabase) {
          try {
            const { data: orgWithToken } = await supabase
              .from('organizations')
              .select('id')
              .or(`meta_webhook_verify_token.eq.${verifyToken},wa_verify_token.eq.${verifyToken}`)
              .maybeSingle();

            if (orgWithToken) {
              isValid = true;
            }
          } catch {}
        }

        if (isValid) {
          console.log('✅ Meta WhatsApp Webhook Handshake verificado exitosamente.');
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          return res.status(200).send(challenge || '');
        } else {
          console.error(`❌ Meta Webhook Verification Fallida. Token recibido: "${verifyToken}"`);
          return res.status(403).send('Forbidden');
        }
      }

      return res.status(200).json({ status: 'ok', service: 'whatsapp-webhook' });
    }

    // B) POST: Ingesta Rápida (<200ms) + Deduplicación Atómica + Debounce Stream
    if (req.method === 'POST') {
      try {
        const signatureHeader = req.headers['x-hub-signature-256'] as string | undefined;
        const appSecret = (process.env.META_APP_SECRET || process.env.WHATSAPP_APP_SECRET || '').trim();

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
        const wamid = incomingMsg.id;
        const businessPhoneNumberId = metadata?.phone_number_id;
        const pushName = change?.contacts?.[0]?.profile?.name || '';

        if (!fromNumber || !businessPhoneNumberId) {
          return res.status(200).json({ status: 'MISSING_SENDER_OR_PHONE_ID' });
        }

        // 1. DEDUPLICACIÓN ATÓMICA POR WAMID (P0)
        if (wamid) {
          const isFirstClaim = await tryClaimMessage(supabase, wamid);
          if (!isFirstClaim) {
            console.log(`🛑 [Idempotency Guard] WAMID ya procesado o en curso descartado: ${wamid}`);
            return res.status(200).json({ status: 'DUPLICATE_MESSAGE_SKIPPED', wamid });
          }
        }

        // Extraer contenido de texto
        let messageText = '';
        let mediaUrl: string | null = null;
        let messageType = 'text';

        if (msgType === 'text' && incomingMsg.text?.body) {
          messageText = incomingMsg.text.body;
        } else if (msgType === 'interactive' && incomingMsg.interactive?.button_reply?.title) {
          messageText = incomingMsg.interactive.button_reply.title;
        } else if (incomingMsg.interactive?.list_reply?.title) {
          messageText = incomingMsg.interactive.list_reply.title;
        } else {
          messageText = 'Hola';
        }

        // 2. Mapeo de Organización por phone_number_id
        let org: any = null;
        if (supabase) {
          try {
            const { data: orgData } = await supabase
              .from('organizations')
              .select('*')
              .or(`meta_phone_number_id.eq.${businessPhoneNumberId},wa_phone_number_id.eq.${businessPhoneNumberId}`)
              .maybeSingle();

            if (orgData) {
              org = orgData;
            } else {
              const { data: fallbackOrg } = await supabase
                .from('organizations')
                .select('*')
                .or('wa_connected.eq.true,id.eq.13d92ac1-1b4a-4d3f-8418-abff914b0500,user_id.eq.13d92ac1-1b4a-4d3f-8418-abff914b0500')
                .order('updated_at', { ascending: false })
                .limit(1)
                .maybeSingle();

              if (fallbackOrg) org = fallbackOrg;
            }
          } catch (err) {
            console.warn('Warn fetching org:', err);
          }
        }

        const orgId = org?.id || '13d92ac1-1b4a-4d3f-8418-abff914b0500';
        const debounceKey = `${orgId}_${fromNumber}`;
        const debounceDelay = Number(process.env.WHATSAPP_DEBOUNCE_MS || 1200);

        // 3. DEBOUNCE STREAMING & CONVERSATION LOCK POR USUARIO
        const messageItem = { wamid, text: messageText, mediaUrl, messageType };
        let streamState = activeDebounceStreams.get(debounceKey);

        if (streamState) {
          clearTimeout(streamState.timer);
          streamState.messages.push(messageItem);
          console.log(`⏱️ [Debounce] Agrupando mensaje concurrente de ${fromNumber} (total acumulados: ${streamState.messages.length})`);
        } else {
          streamState = {
            timer: setTimeout(() => {}, 0),
            messages: [messageItem],
            fromNumber,
            pushName,
            businessPhoneNumberId,
            org,
            resolveCallbacks: [],
          };
          activeDebounceStreams.set(debounceKey, streamState);
        }

        // Programar ejecución diferida del worker al cerrarse la ventana de debounce
        streamState.timer = setTimeout(() => {
          processDebouncedConversation(debounceKey, streamState!, supabase).catch(console.error);
        }, debounceDelay);

        // RESPUESTA RÁPIDA 200 OK A META (<100ms)
        return res.status(200).json({ status: 'INGESTED_AND_QUEUED', wamid });
      } catch (err: any) {
        console.error('Error in WhatsApp POST Webhook:', err);
        return res.status(200).json({ status: 'ERROR_HANDLED', message: err?.message });
      }
    }
  }

  // SUB-ROUTE: STATUS & OAUTH CONFIG
  if (subRoute === 'oauth' || subRoute === 'connect' || subRoute === 'verify' || subRoute === 'disconnect' || subRoute.includes('connect') || subRoute.includes('oauth')) {
    let targetOrgId = req.query.orgId || (req.query as any)?.organization_id || '';
    let userId = '';

    const authHeader = req.headers.authorization;
    if (authHeader && supabase) {
      try {
        const token = authHeader.replace('Bearer ', '').trim();
        const { data: userData } = await supabase.auth.getUser(token);
        if (userData?.user?.id) {
          userId = userData.user.id;
          const { data: orgData } = await supabase
            .from('organizations')
            .select('id')
            .or(`user_id.eq.${userId},id.eq.${userId}`)
            .maybeSingle();
          if (orgData?.id) targetOrgId = orgData.id;
        }
      } catch {}
    }

    if (req.method === 'GET') {
      let isConnected = false;
      let organization: any = null;

      if (supabase && (targetOrgId || userId)) {
        try {
          const { data: orgData } = await supabase
            .from('organizations')
            .select('*')
            .or(`id.eq.${targetOrgId || userId},user_id.eq.${userId || targetOrgId}`)
            .maybeSingle();

          if (orgData && (orgData.meta_phone_number_id || orgData.wa_phone_number_id)) {
            isConnected = true;
            organization = {
              id: orgData.id,
              name: orgData.name || 'Tu Inmobiliaria',
              meta_phone_number_id: orgData.meta_phone_number_id || orgData.wa_phone_number_id,
              meta_waba_id: orgData.meta_waba_id || orgData.wa_waba_id,
              meta_webhook_verify_token: orgData.meta_webhook_verify_token || orgData.wa_verify_token,
              wa_connected: true,
              updated_at: orgData.updated_at,
            };
          }
        } catch {}
      }

      return res.status(200).json({
        success: true,
        isConnected,
        wa_connected: isConnected,
        organization,
      });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const action = body.action || subRoute;

      if (action === 'disconnect') {
        if (supabase && (targetOrgId || userId)) {
          try {
            await supabase
              .from('organizations')
              .update({
                meta_phone_number_id: null,
                meta_waba_id: null,
                meta_access_token: null,
                meta_webhook_verify_token: null,
                wa_connected: false,
                updated_at: new Date().toISOString(),
              })
              .or(`id.eq.${targetOrgId || userId},user_id.eq.${userId || targetOrgId}`);

            return res.status(200).json({ success: true, message: 'WhatsApp disconnected successfully' });
          } catch (err: any) {
            return res.status(500).json({ error: err.message });
          }
        }
        return res.status(200).json({ success: true });
      }

      if (action === 'connect') {
        const phoneId = body.phone_number_id || body.phoneNumberId;
        const wabaId = body.waba_id || body.wabaId;
        const accessToken = body.access_token || body.accessToken;

        if (supabase && (targetOrgId || userId)) {
          try {
            const { data: updatedOrg, error: updErr } = await supabase
              .from('organizations')
              .update({
                meta_phone_number_id: phoneId,
                meta_waba_id: wabaId,
                meta_access_token: accessToken,
                wa_connected: true,
                updated_at: new Date().toISOString(),
              })
              .or(`id.eq.${targetOrgId || userId},user_id.eq.${userId || targetOrgId}`)
              .select()
              .single();

            if (updErr) {
              return res.status(400).json({ error: updErr.message });
            }

            return res.status(200).json({
              success: true,
              message: 'WhatsApp connected successfully',
              organization: updatedOrg,
            });
          } catch (err: any) {
            return res.status(500).json({ error: err.message });
          }
        }
        return res.status(200).json({ success: true });
      }
    }
  }

  
  // SUB-ROUTE: SEND MESSAGE / HUMAN TAKEOVER OUTBOUND (/api/whatsapp/send, /api/whatsapp/messages, /api/whatsapp/outbound)
  if (subRoute === 'send' || subRoute === 'messages' || subRoute === 'outbound' || subRoute.endsWith('/messages')) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const { leadId, message, content, phone: explicitPhone, orgId: explicitOrgId } = body;
      const textToSend = (content || message || '').trim();

      if (!textToSend) {
        return res.status(400).json({ error: 'El contenido del mensaje no puede estar vacío.' });
      }

      if (!supabase) {
        return res.status(500).json({ error: 'Supabase no inicializado en el servidor.' });
      }

      // 1. Obtener el lead
      let targetLead: any = null;
      if (leadId) {
        const { data: leadData } = await supabase
          .from('leads')
          .select('*')
          .eq('id', leadId)
          .maybeSingle();
        targetLead = leadData;
      } else if (explicitPhone) {
        const { data: leadData } = await supabase
          .from('leads')
          .select('*')
          .eq('phone', explicitPhone)
          .maybeSingle();
        targetLead = leadData;
      }

      if (!targetLead && !explicitPhone) {
        return res.status(404).json({ error: 'Lead no encontrado para el envío.' });
      }

      const recipientPhone = targetLead?.phone || explicitPhone;
      const organizationId = targetLead?.organization_id || explicitOrgId || '13d92ac1-1b4a-4d3f-8418-abff914b0500';

      // 2. Obtener credenciales de la organización
      const { data: orgData } = await supabase
        .from('organizations')
        .select('*')
        .or(`id.eq.${organizationId},user_id.eq.${organizationId}`)
        .maybeSingle();

      const businessPhoneNumberId = orgData?.meta_phone_number_id || orgData?.wa_phone_number_id || process.env.META_WA_PHONE_NUMBER_ID || process.env.META_PHONE_NUMBER_ID;
      const accessToken = (orgData?.meta_access_token || orgData?.wa_access_token || process.env.META_WA_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN || '').trim();

      if (!businessPhoneNumberId || !accessToken) {
        return res.status(400).json({ error: 'Faltan credenciales de WhatsApp Business (Phone Number ID o Access Token) en la organización.' });
      }

      // 3. Enviar a Meta WhatsApp Cloud API
      const metaSendUrl = `https://graph.facebook.com/v20.0/${businessPhoneNumberId}/messages`;
      const sendRes = await fetch(metaSendUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: recipientPhone,
          type: 'text',
          text: { body: textToSend },
        }),
      });

      const responseData = await sendRes.json().catch(() => ({}));

      if (!sendRes.ok) {
        console.error('🚨 [Human Takeover Send] Error Meta Cloud API:', responseData);
        return res.status(sendRes.status || 400).json({
          error: responseData.error?.message || 'Error enviando mensaje vía Meta Cloud API',
          details: responseData,
        });
      }

      const wamid = responseData.messages?.[0]?.id || null;

      // 4. Persistir mensaje en chat_messages con sender = 'human_agent'
      if (targetLead?.id) {
        await supabase.from('chat_messages').insert({
          lead_id: targetLead.id,
          sender: 'human_agent',
          message_type: 'text',
          content: textToSend,
          message_text: textToSend,
          created_at: new Date().toISOString(),
        });

        await supabase.from('wa_messages').insert([
          {
            conversation_id: targetLead.id,
            organization_id: organizationId,
            wamid: wamid || undefined,
            sender_type: 'human_agent',
            message_text: textToSend,
            created_at: new Date().toISOString(),
          },
        ]);

        // 5. Activar Human Takeover en el Lead (handled_by = 'human')
        await supabase
          .from('leads')
          .update({
            handled_by: 'human',
            is_bot_active: false,
            status: 'handover',
            last_message: textToSend,
            updated_at: new Date().toISOString(),
          })
          .eq('id', targetLead.id);
      }

      console.log(`✅ [Human Takeover Sent] Mensaje humano entregado con éxito a ${recipientPhone} (wamid: ${wamid})`);
      return res.status(200).json({
        success: true,
        wamid,
        leadId: targetLead?.id,
        handled_by: 'human',
        message: textToSend,
      });
    } catch (err: any) {
      console.error('[Human Takeover Send Exception]:', err);
      return res.status(500).json({ error: err.message || 'Error interno del servidor' });
    }
  }

  return res.status(404).json({ error: `Sub-route '${subRoute}' not found` });
}

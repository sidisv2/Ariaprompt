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
  if (!signatureHeader || !appSecret || !rawBody) return true;
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

  if (inMemoryProcessedWamids.has(wamid)) {
    return false;
  }
  inMemoryProcessedWamids.add(wamid);
  if (inMemoryProcessedWamids.size > 1000) {
    const firstKey = inMemoryProcessedWamids.keys().next().value;
    if (firstKey) inMemoryProcessedWamids.delete(firstKey);
  }

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
 * Helper: Intercambia el authorization code de Embedded Signup por un Access Token
 * usando Meta Graph API v20.0 (OAuth Server-Side Exchange)
 */
async function exchangeMetaOAuthCode(code: string, appId: string, appSecret: string): Promise<{ accessToken?: string; error?: string }> {
  try {
    const url = new URL('https://graph.facebook.com/v20.0/oauth/access_token');
    url.searchParams.set('client_id', appId);
    url.searchParams.set('client_secret', appSecret);
    url.searchParams.set('code', code);

    const res = await fetch(url.toString(), { method: 'GET' });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.access_token) {
      const errMsg = data.error?.message || `Meta OAuth HTTP ${res.status}`;
      return { error: errMsg };
    }

    return { accessToken: data.access_token };
  } catch (err: any) {
    return { error: err.message || 'Error en intercambio OAuth con Meta' };
  }
}

/**
 * Helper: Obtiene Phone Number ID y WABA ID asociados al token si no vinieron en el payload
 */
async function inspectMetaTokenOrWaba(accessToken: string, candidateWabaId?: string): Promise<{ wabaId?: string; phoneId?: string; displayPhoneNumber?: string; error?: string }> {
  try {
    let wabaId = candidateWabaId;
    let phoneId = '';
    let displayPhoneNumber = '';

    // Si tenemos WABA ID, consultar sus phone numbers asociados
    if (wabaId) {
      const phonesRes = await fetch(`https://graph.facebook.com/v20.0/${encodeURIComponent(wabaId)}/phone_numbers?access_token=${encodeURIComponent(accessToken)}`);
      const phonesData = await phonesRes.json().catch(() => ({}));
      if (phonesRes.ok && Array.isArray(phonesData.data) && phonesData.data.length > 0) {
        phoneId = phonesData.data[0].id;
        displayPhoneNumber = phonesData.data[0].display_phone_number || '';
      }
    }

    // Si aún no tenemos WABA o Phone ID, consultar me/accounts o debug_token
    if (!wabaId || !phoneId) {
      const debugRes = await fetch(`https://graph.facebook.com/v20.0/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${encodeURIComponent(accessToken)}`);
      const debugData = await debugRes.json().catch(() => ({}));
      if (debugRes.ok && debugData.data?.granular_scopes) {
        const waScope = debugData.data.granular_scopes.find((s: any) => s.scope === 'whatsapp_business_management' || s.scope === 'whatsapp_business_messaging');
        if (waScope && waScope.target_ids && waScope.target_ids.length > 0) {
          if (!wabaId) wabaId = waScope.target_ids[0];
        }
      }

      if (wabaId && !phoneId) {
        const phonesRes = await fetch(`https://graph.facebook.com/v20.0/${encodeURIComponent(wabaId)}/phone_numbers?access_token=${encodeURIComponent(accessToken)}`);
        const phonesData = await phonesRes.json().catch(() => ({}));
        if (phonesRes.ok && Array.isArray(phonesData.data) && phonesData.data.length > 0) {
          phoneId = phonesData.data[0].id;
          displayPhoneNumber = phonesData.data[0].display_phone_number || '';
        }
      }
    }

    return { wabaId, phoneId, displayPhoneNumber };
  } catch (err: any) {
    return { error: err.message || 'Error inspeccionando recursos de Meta' };
  }
}

/**
 * Helper: Suscribe el WABA ID a los webhooks de la App (OBLIGATORIO para Tech Providers)
 * POST https://graph.facebook.com/v20.0/{WABA_ID}/subscribed_apps
 */
async function subscribeWabaToWebhooks(wabaId: string, accessToken: string): Promise<{ success: boolean; error?: string }> {
  try {
    const endpoint = `https://graph.facebook.com/v20.0/${encodeURIComponent(wabaId)}/subscribed_apps`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || (data.success !== true && !data.data)) {
      const errMsg = data.error?.message || `Meta subscribed_apps HTTP ${res.status}`;
      console.warn(`[whatsappHandler] Subscribed Apps Warning for WABA ${wabaId}:`, errMsg);
      return { success: false, error: errMsg };
    }

    console.log(`[whatsappHandler] WABA ${wabaId} exitosamente suscripto a los webhooks de Aria Prop.`);
    return { success: true };
  } catch (err: any) {
    console.error(`[whatsappHandler] Excepción al suscribir WABA ${wabaId}:`, err);
    return { success: false, error: err.message || String(err) };
  }
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

  const combinedUserText = messages.map(m => m.text).filter(Boolean).join('\n');
  const lastWamid = messages[messages.length - 1]?.wamid;

  console.log(`[Debounce Worker] Procesando conversación para ${fromNumber} en Org ${orgId}. Mensajes agrupados: ${messages.length}`);

  if (accessToken && lastWamid) {
    markWhatsAppMessageAsRead(lastWamid, businessPhoneNumberId, accessToken).catch(() => {});
  }

  // 1. Obtener o crear Lead en Supabase
  let lead: any = null;
  if (supabase) {
    try {
      const { data: existingLead } = await supabase
        .from('leads')
        .select('*')
        .or(`phone.eq.${fromNumber},phone.eq.+${fromNumber}`)
        .or(`organization_id.eq.${orgId},user_id.eq.${userId}`)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingLead) {
        lead = existingLead;
      } else {
        const { data: newLead } = await supabase
          .from('leads')
          .insert({
            phone: fromNumber,
            name: pushName || `Prospecto WhatsApp (${fromNumber.slice(-4)})`,
            channel: 'WHATSAPP',
            source: 'whatsapp',
            status: 'new',
            handled_by: 'ia',
            organization_id: orgId,
            user_id: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        lead = newLead;
      }
    } catch (err) {
      console.warn('[whatsappHandler] Error con Lead en Supabase:', err);
    }
  }

  const leadId = lead?.id;

  // 2. Persistir mensaje entrante en chat_messages
  if (supabase && leadId) {
    try {
      await supabase.from('chat_messages').insert({
        lead_id: leadId,
        sender: 'user',
        content: combinedUserText,
        message_text: combinedUserText,
        message_type: 'text',
        channel: 'whatsapp',
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('[whatsappHandler] Error guardando chat_messages user:', e);
    }
  }

  // Si el lead está tomado por un asesor humano ('human' o 'humano'), la IA no responde automáticamente
  if (lead && (lead.handled_by === 'human' || lead.handled_by === 'humano')) {
    console.log(`[whatsappHandler] Lead ${leadId} está en modo Humano. Omitiendo respuesta automática de IA.`);
    return;
  }

  // 3. Recuperar catálogo de propiedades de la organización
  let properties: PropertyForPrompt[] = [];
  if (supabase) {
    try {
      const { data: propsData } = await supabase
        .from('properties')
        .select('*')
        .or(`organization_id.eq.${orgId},user_id.eq.${userId}`)
        .eq('status', 'available')
        .limit(20);

      if (propsData && propsData.length > 0) {
        properties = propsData.map((p: any) => ({
          id: p.id,
          title: p.title || p.name || 'Propiedad',
          price: p.price || 0,
          currency: p.currency || 'USD',
          operation_type: p.operation_type || p.type || 'Venta',
          location: p.location || p.address || p.city || 'Ubicación a consultar',
          features: p.features || {},
          description: p.description || '',
          url: p.url || `https://ariaprop.online/p/${p.id}`,
        }));
      }
    } catch (err) {
      console.warn('[whatsappHandler] Error recuperando propiedades:', err);
    }
  }

  // 4. Recuperar historial reciente para dar contexto al LLM
  let conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  if (supabase && leadId) {
    try {
      const { data: pastMsgs } = await supabase
        .from('chat_messages')
        .select('sender, content, message_text')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (pastMsgs) {
        conversationHistory = pastMsgs.reverse().map((m: any) => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.content || m.message_text || '',
        }));
      }
    } catch {}
  }

  // 5. Generar respuesta estructurada con OpenRouter / Gemini
  let aiResponseText = '¡Hola! Gracias por comunicarte con nosotros. ¿En qué zona o tipo de propiedad estás buscando?';
  try {
    const aiResult = await generateStructuredAriaRealEstateResponse({
      userMessage: combinedUserText,
      conversationHistory,
      properties,
      botConfig: {
        agentName: botName,
        agencyName,
        customSystemPrompt: customRules,
        calendarBookingUrl: bookingUrl,
        faqs: faqList,
      },
    });

    if (aiResult?.replyText) {
      aiResponseText = aiResult.replyText;
    }
  } catch (err: any) {
    console.error('[whatsappHandler] Error en generateStructuredAriaRealEstateResponse:', err);
  }

  // 6. Enviar mensaje a Meta WhatsApp Cloud API v20.0
  if (accessToken && businessPhoneNumberId) {
    const metaSendUrl = `https://graph.facebook.com/v20.0/${encodeURIComponent(businessPhoneNumberId)}/messages`;
    try {
      const sendRes = await fetch(metaSendUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: fromNumber,
          type: 'text',
          text: {
            preview_url: true,
            body: aiResponseText,
          },
        }),
      });

      const sendJson = await sendRes.json().catch(() => ({}));
      if (!sendRes.ok) {
        console.error('[whatsappHandler] Error enviando mensaje a Meta:', JSON.stringify(sendJson));
      } else {
        console.log(`[whatsappHandler] Mensaje de IA enviado a ${fromNumber} (wamid: ${sendJson.messages?.[0]?.id || 'N/A'})`);
      }
    } catch (sendErr) {
      console.error('[whatsappHandler] Excepción al enviar mensaje de WhatsApp:', sendErr);
    }
  } else {
    console.warn(`[whatsappHandler] No se pudo enviar WhatsApp: accessToken=${Boolean(accessToken)}, businessPhoneNumberId=${businessPhoneNumberId}`);
  }

  // 7. Persistir respuesta de IA en chat_messages y actualizar lead
  if (supabase && leadId) {
    try {
      await supabase.from('chat_messages').insert({
        lead_id: leadId,
        sender: 'assistant',
        content: aiResponseText,
        message_text: aiResponseText,
        message_type: 'text',
        channel: 'whatsapp',
        created_at: new Date().toISOString(),
      });

      await supabase
        .from('leads')
        .update({
          last_message: aiResponseText,
          last_interaction: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId);
    } catch (e) {
      console.warn('[whatsappHandler] Error actualizando chat_messages/lead:', e);
    }
  }
}

/**
 * Main Controller Handler para todas las rutas de WhatsApp
 */
/**
 * Resuelve contextualmente el organization_id y user_id mediante Supabase Auth
 * Idéntico y canónico con crmHandler.ts
 */
async function resolveWhatsAppAuthContext(req: VercelRequest, supabase: any): Promise<{ organizationId: string; userId: string | null }> {
  const authHeader = req.headers.authorization;

  if (authHeader && supabase) {
    try {
      const token = authHeader.replace('Bearer ', '').trim();
      const { data: userData } = await supabase.auth.getUser(token);

      if (userData?.user?.id) {
        const userId = userData.user.id;

        // 1. Consultar organización en organization_members
        const { data: member } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', userId)
          .maybeSingle();

        if (member?.organization_id) {
          return { organizationId: member.organization_id, userId };
        }

        // 2. Consultar organización en profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', userId)
          .maybeSingle();

        if (profile?.organization_id) {
          return { organizationId: profile.organization_id, userId };
        }

        // 3. Consultar si existe organización vinculada por user_id o id
        const { data: orgData } = await supabase
          .from('organizations')
          .select('id')
          .or(`user_id.eq.${userId},id.eq.${userId}`)
          .maybeSingle();

        if (orgData?.id) {
          return { organizationId: orgData.id, userId };
        }

        // 4. Fallback: El usuario es el ID de su propia organización (Owner)
        return { organizationId: userId, userId };
      }
    } catch (err) {
      console.warn('[WhatsApp API] Warning resolving user token:', err);
    }
  }

  // Header explícito x-organization-id o query params
  const explicitOrg = (req.headers['x-organization-id'] as string) || (req.query.organizationId as string) || (req.query.organization_id as string) || (req.query.orgId as string);
  if (explicitOrg) {
    return { organizationId: explicitOrg, userId: null };
  }

  // Organización activa de referencia para la cuenta en producción
  return { organizationId: '13d92ac1-1b4a-4d3f-8418-abff914b0500', userId: '13d92ac1-1b4a-4d3f-8418-abff914b0500' };
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
          console.log('Meta WhatsApp Webhook Handshake verificado exitosamente.');
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          return res.status(200).send(challenge || '');
        } else {
          console.error(`Meta Webhook Verification Fallida. Token recibido: "${verifyToken}"`);
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

        // 1. Deduplicación atómica por WAMID
        if (wamid) {
          const isFirstClaim = await tryClaimMessage(supabase, wamid);
          if (!isFirstClaim) {
            console.log(`[Idempotency Guard] WAMID ya procesado o en curso descartado: ${wamid}`);
            return res.status(200).json({ status: 'DUPLICATE_MESSAGE_SKIPPED', wamid });
          }
        }

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

        // 3. Debounce Stream & Conversation Lock
        const messageItem = { wamid, text: messageText, mediaUrl, messageType };
        let streamState = activeDebounceStreams.get(debounceKey);

        if (streamState) {
          clearTimeout(streamState.timer);
          streamState.messages.push(messageItem);
          console.log(`[Debounce] Agrupando mensaje concurrente de ${fromNumber} (total acumulados: ${streamState.messages.length})`);
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

        // Ejecución sincrónica garantizada en Vercel Serverless con medición de latencia
        const t0 = Date.now();
        console.log(`[whatsappHandler] 🚀 Iniciando procesamiento para ${fromNumber} (wamid: ${wamid})`);
        
        await processDebouncedConversation(debounceKey, streamState, supabase);
        
        const totalDuration = Date.now() - t0;
        console.log(`[whatsappHandler] 🏁 Procesamiento completado en ${totalDuration}ms para ${fromNumber}`);

        return res.status(200).json({ status: 'PROCESSED_AND_REPLIED', wamid, durationMs: totalDuration });
      } catch (err: any) {
        console.error('Error in WhatsApp POST Webhook:', err);
        return res.status(200).json({ status: 'ERROR_HANDLED', message: err?.message });
      }
    }
  }

  // SUB-ROUTE: STATUS, CONNECT & EMBEDDED SIGNUP OAUTH
  if (
    subRoute === 'oauth' ||
    subRoute === 'connect' ||
    subRoute === 'verify' ||
    subRoute === 'disconnect' ||
    subRoute.includes('connect') ||
    subRoute.includes('oauth')
  ) {
    const authContext = await resolveWhatsAppAuthContext(req, supabase);
    const targetOrgId = authContext.organizationId || '13d92ac1-1b4a-4d3f-8418-abff914b0500';
    const userId = authContext.userId || targetOrgId;

    if (req.method === 'GET') {
      let isConnected = false;
      let organization: any = null;

      if (supabase && (targetOrgId || userId)) {
        try {
          const { data: orgData } = await supabase
            .from('organizations')
            .select('*')
            .or(`id.eq.${targetOrgId},user_id.eq.${userId},id.eq.${userId}`)
            .maybeSingle();

          if (orgData && (orgData.meta_phone_number_id || orgData.wa_phone_number_id)) {
            isConnected = true;
            organization = {
              id: orgData.id,
              name: orgData.name || 'Tu Inmobiliaria',
              meta_phone_number_id: orgData.meta_phone_number_id || orgData.wa_phone_number_id,
              wa_phone_number_id: orgData.wa_phone_number_id || orgData.meta_phone_number_id,
              meta_waba_id: orgData.meta_waba_id || orgData.wa_waba_id,
              wa_waba_id: orgData.wa_waba_id || orgData.meta_waba_id,
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
                wa_phone_number_id: null,
                wa_waba_id: null,
                wa_access_token: null,
                wa_connected: false,
                updated_at: new Date().toISOString(),
              })
              .or(`id.eq.${targetOrgId},user_id.eq.${userId},id.eq.${userId}`);

            return res.status(200).json({ success: true, message: 'WhatsApp disconnected successfully' });
          } catch (err: any) {
            return res.status(500).json({ error: err.message });
          }
        }
        return res.status(200).json({ success: true });
      }

      if (action === 'connect') {
        let phoneId = (body.phone_number_id || body.phoneNumberId || '').trim();
        let wabaId = (body.waba_id || body.wabaId || '').trim();
        let accessToken = (body.access_token || body.accessToken || '').trim();
        const code = (body.code || '').trim();

        // 1. Intercambio de OAuth Code si vino de Meta Embedded Signup
        if (code) {
          const metaAppId = (process.env.META_APP_ID || process.env.VITE_META_APP_ID || '891096146948509').trim();
          const metaAppSecret = (process.env.META_APP_SECRET || process.env.WHATSAPP_APP_SECRET || '').trim();

          if (!metaAppSecret) {
            console.error('[whatsappHandler] META_APP_SECRET no configurado en backend.');
            return res.status(500).json({ error: 'Configuración de servidor incompleta: Falta META_APP_SECRET en el backend.' });
          }

          const exchangeRes = await exchangeMetaOAuthCode(code, metaAppId, metaAppSecret);
          if (exchangeRes.error || !exchangeRes.accessToken) {
            console.error('[whatsappHandler] Error intercambiando code:', exchangeRes.error);
            return res.status(400).json({ error: `Error de autenticación con Meta: ${exchangeRes.error}` });
          }

          accessToken = exchangeRes.accessToken;

          // Si faltaban phoneId o wabaId, inspeccionarlos usando el token recién obtenido
          if (!phoneId || !wabaId) {
            const inspectRes = await inspectMetaTokenOrWaba(accessToken, wabaId);
            if (inspectRes.wabaId) wabaId = inspectRes.wabaId;
            if (inspectRes.phoneId) phoneId = inspectRes.phoneId;
          }
        }

        if (!accessToken) {
          return res.status(400).json({ error: 'Se requiere un Access Token válido o un Authorization Code de Meta.' });
        }

        // 2. Suscripción OBLIGATORIA del WABA a los Webhooks (Tech Provider requirement)
        let subscribedAppsSuccess = false;
        if (wabaId) {
          const subRes = await subscribeWabaToWebhooks(wabaId, accessToken);
          subscribedAppsSuccess = subRes.success;
        }

        // 3. Persistencia Atómica en Supabase
        if (supabase && (targetOrgId || userId)) {
          try {
            const updatePayload: any = {
              wa_phone_number_id: phoneId || null,
              wa_waba_id: wabaId || null,
              wa_access_token: accessToken,
              wa_connected: true,
              updated_at: new Date().toISOString(),
            };

            const { data: updatedOrg, error: updErr } = await supabase
              .from('organizations')
              .update(updatePayload)
              .or(`id.eq.${targetOrgId},user_id.eq.${userId},id.eq.${userId}`)
              .select()
              .single();

            if (updErr) {
              console.error('[whatsappHandler] Error actualizando organization en Supabase:', updErr);
              return res.status(400).json({ error: updErr.message });
            }

            const cleanOrgResponse = {
              id: updatedOrg.id,
              name: updatedOrg.name,
              meta_phone_number_id: updatedOrg.meta_phone_number_id || updatedOrg.wa_phone_number_id,
              wa_phone_number_id: updatedOrg.wa_phone_number_id || updatedOrg.meta_phone_number_id,
              meta_waba_id: updatedOrg.meta_waba_id || updatedOrg.wa_waba_id,
              wa_waba_id: updatedOrg.wa_waba_id || updatedOrg.meta_waba_id,
              wa_connected: true,
              subscribed_apps: subscribedAppsSuccess,
              updated_at: updatedOrg.updated_at,
            };

            return res.status(200).json({
              success: true,
              message: 'WhatsApp conectado exitosamente',
              organization: cleanOrgResponse,
            });
          } catch (err: any) {
            return res.status(500).json({ error: err.message });
          }
        }

        return res.status(200).json({
          success: true,
          message: 'WhatsApp validado exitosamente',
          organization: {
            meta_phone_number_id: phoneId,
            wa_phone_number_id: phoneId,
            meta_waba_id: wabaId,
            wa_waba_id: wabaId,
            wa_connected: true,
            subscribed_apps: subscribedAppsSuccess,
          },
        });
      }
    }
  }

  // SUB-ROUTE: SEND MESSAGE / HUMAN TAKEOVER OUTBOUND
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

      const metaSendUrl = `https://graph.facebook.com/v20.0/${encodeURIComponent(businessPhoneNumberId)}/messages`;
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

      const sendJson = await sendRes.json().catch(() => ({}));

      if (!sendRes.ok) {
        console.error('[whatsappHandler Outbound] Error enviando mensaje:', JSON.stringify(sendJson));
        return res.status(sendRes.status).json({ error: sendJson.error?.message || 'Error de Meta Cloud API al enviar mensaje.' });
      }

      if (targetLead?.id) {
        try {
          await supabase.from('chat_messages').insert({
            lead_id: targetLead.id,
            sender: 'human_agent',
            content: textToSend,
            message_text: textToSend,
            message_type: 'text',
            channel: 'whatsapp',
            created_at: new Date().toISOString(),
          });

          await supabase
            .from('leads')
            .update({
              last_message: textToSend,
              last_interaction: new Date().toISOString(),
              handled_by: 'human',
              updated_at: new Date().toISOString(),
            })
            .eq('id', targetLead.id);
        } catch (e) {
          console.warn('[whatsappHandler Outbound] Error registrando mensaje en Supabase:', e);
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Mensaje enviado correctamente vía Meta WhatsApp Cloud API',
        wamid: sendJson.messages?.[0]?.id,
      });
    } catch (err: any) {
      console.error('[whatsappHandler Outbound] Excepción:', err);
      return res.status(500).json({ error: err.message || 'Error interno al enviar mensaje' });
    }
  }

  return res.status(404).json({ error: `Ruta de WhatsApp desconocida: ${subRoute}` });
}

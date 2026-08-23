import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { generateStructuredAriaRealEstateResponse, PropertyForPrompt } from '../_lib/openrouterService.js';

// En Vercel Serverless Function, permitir duración de hasta 30 segundos
export const maxDuration = 30;

// Set en memoria para deduplicación local instantánea entre peticiones simultáneas en la misma instancia
const inMemoryProcessedWamids = new Set<string>();

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
 * Intenta reclamar atómicamente el WAMID.
 * Devuelve true si este request es el primero y debe procesarse.
 * Devuelve false si el WAMID ya fue procesado o está siendo procesado (duplicado).
 */
async function tryClaimMessage(supabase: any, wamid: string): Promise<boolean> {
  if (!wamid) return true;

  // 1. Verificación en memoria (cero latencia para requests concurrentes dentro de la misma instancia)
  if (inMemoryProcessedWamids.has(wamid)) {
    return false;
  }
  inMemoryProcessedWamids.add(wamid);

  // Mantener el Set en un tamaño manejable (últimos 500 wamids)
  if (inMemoryProcessedWamids.size > 500) {
    const firstKey = inMemoryProcessedWamids.keys().next().value;
    if (firstKey) inMemoryProcessedWamids.delete(firstKey);
  }

  // 2. Verificación atómica en Supabase con UNIQUE INSERT
  if (supabase) {
    try {
      const { error } = await supabase
        .from('processed_messages')
        .insert({
          wamid,
          created_at: new Date().toISOString(),
        });

      if (error) {
        // Código 23505 = unique_violation en PostgreSQL (ya existía)
        if (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
          return false;
        }
        console.warn('[whatsappHandler] Error al insertar en processed_messages (dejando pasar):', error.message);
      }
    } catch (e: any) {
      console.warn('[whatsappHandler] Excepción en tryClaimMessage:', e.message);
    }
  }

  return true;
}

export async function handleWhatsAppRoute(req: VercelRequest, res: VercelResponse, subRoute: string = 'webhook') {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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

    // B) POST: Recepción de Mensajes Entrantes
    if (req.method === 'POST') {
      try {
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

        // Filtrar eventos de estado (sent, delivered, read)
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
          return res.status(200).json({ status: 'STATUS_UPDATE_ACKNOWLEDGED' });
        }

        const incomingMsg = messages[0];
        const fromNumber = incomingMsg.from;
        const msgType = incomingMsg.type;
        const wamid = incomingMsg.id;
        const businessPhoneNumberId = metadata?.phone_number_id;
        const pushName = change?.contacts?.[0]?.profile?.name || '';

        console.log('📩 [WhatsApp Webhook Inbound]:', {
          from: fromNumber,
          phone_number_id: businessPhoneNumberId,
          type: msgType,
          wamid: wamid,
          pushName,
        });

        if (!fromNumber || !businessPhoneNumberId) {
          return res.status(200).json({ status: 'MISSING_SENDER_OR_PHONE_ID' });
        }

        // 🔒 GUARD DE IDEMPOTENCIA ATÓMICO (Evita respuestas duplicadas por reintentos de Meta en <300ms)
        if (wamid) {
          const isFirstClaim = await tryClaimMessage(supabase, wamid);
          if (!isFirstClaim) {
            console.log('🛑 [whatsappHandler] Mensaje duplicado ignorado (wamid ya procesado o en curso):', wamid);
            return res.status(200).json({ status: 'DUPLICATE_MESSAGE_SKIPPED', wamid });
          }
        }

        // Extraer texto y multimedia del mensaje
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

        // 2. Buscar la inmobiliaria correspondiente en Supabase
        let org: any = null;
        if (supabase) {
          try {
            // A) Buscar por Phone Number ID exacto
            const { data: orgData } = await supabase
              .from('organizations')
              .select('*')
              .or(`meta_phone_number_id.eq.${businessPhoneNumberId},wa_phone_number_id.eq.${businessPhoneNumberId}`)
              .maybeSingle();

            if (orgData) {
              org = orgData;
            } else {
              // B) Fallback: Buscar organización activa con wa_connected o por usuario Valentin
              const { data: fallbackOrg } = await supabase
                .from('organizations')
                .select('*')
                .or('wa_connected.eq.true,id.eq.13d92ac1-1b4a-4d3f-8418-abff914b0500,user_id.eq.13d92ac1-1b4a-4d3f-8418-abff914b0500')
                .order('updated_at', { ascending: false })
                .limit(1)
                .maybeSingle();

              if (fallbackOrg) {
                console.log('ℹ️ Usando organización identificada:', fallbackOrg.id);
                org = fallbackOrg;
              }
            }
          } catch (err) {
            console.warn('Error fetching organization in WhatsApp Webhook:', err);
          }
        }

        const orgId = org?.id || '13d92ac1-1b4a-4d3f-8418-abff914b0500';
        const userId = org?.user_id || orgId;
        const botName = org?.bot_name || 'Aria';
        const agencyName = org?.name || 'Inmobiliaria';
        const customRules = org?.custom_prompt_instructions || org?.system_prompt || '';
        const faqList = org?.faq_knowledge || [];
        const bookingUrl = org?.calendar_booking_url || '';
        const accessToken = (org?.meta_access_token || org?.wa_access_token || process.env.META_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN || '').trim();

        console.log('[whatsappHandler] organizationId resuelto:', orgId, 'userId:', userId);

        // 3. Buscar o crear Lead y chequear handled_by & Memoria persistente
        let conversationHistory: Array<{ sender: 'user' | 'assistant'; content: string }> = [];
        let existingConvId: string | null = null;
        let leadRecord: any = null;

        if (supabase) {
          try {
            const clientName = pushName ? pushName.trim() : `WhatsApp (${fromNumber.slice(-4)})`;

            // Buscar si ya existe el lead
            const { data: foundLead } = await supabase
              .from('leads')
              .select('*')
              .eq('phone', fromNumber)
              .maybeSingle();

            if (foundLead) {
              leadRecord = foundLead;
              existingConvId = foundLead.id;

              const { data: updatedLead, error: upErr } = await supabase
                .from('leads')
                .update({
                  last_message: messageText,
                  organization_id: foundLead.organization_id || orgId,
                  user_id: foundLead.user_id || userId,
                  name: foundLead.name && !foundLead.name.includes('WhatsApp') ? foundLead.name : clientName,
                  channel: 'WHATSAPP',
                  updated_at: new Date().toISOString(),
                })
                .eq('id', foundLead.id)
                .select('*')
                .single();

              console.log('[whatsappHandler] upsert lead resultado (update):', { leadData: updatedLead, leadError: upErr });
            } else {
              // Insertar nuevo lead con columnas válidas del schema
              const { data: newLead, error: insErr } = await supabase
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
                  last_message: messageText,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .select('*')
                .single();

              console.log('[whatsappHandler] upsert lead resultado (insert):', { leadData: newLead, leadError: insErr });
              if (newLead) {
                leadRecord = newLead;
                existingConvId = newLead.id;
              }
            }

            // Persistir mensaje entrante del usuario en chat_messages
            if (existingConvId) {
              const { error: msgErr } = await supabase.from('chat_messages').insert({
                lead_id: existingConvId,
                sender: 'user',
                sender_type: 'user',
                message_type: messageType,
                media_type: messageType,
                media_url: mediaUrl,
                content: messageText,
                message_text: messageText,
                created_at: new Date().toISOString(),
              });
              console.log('[whatsappHandler] insert incoming message resultado:', { messagesError: msgErr });
            }

            // Recuperar los últimos 15 mensajes del historial de conversación (user y assistant)
            if (existingConvId) {
              const { data: pastMsgs } = await supabase
                .from('chat_messages')
                .select('sender, sender_type, content, message_text, created_at')
                .eq('lead_id', existingConvId)
                .order('created_at', { ascending: true })
                .limit(20);

              if (pastMsgs && pastMsgs.length > 0) {
                conversationHistory = pastMsgs
                  .filter((m: any) => (m.content || m.message_text) && (m.content || m.message_text) !== messageText)
                  .map((m: any) => ({
                    sender: (m.sender === 'user' || m.sender_type === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
                    content: m.content || m.message_text || '',
                  }));
                console.log(`[whatsappHandler] Historial cargado (${conversationHistory.length} turnos previos).`);
              }
            }
          } catch (convErr) {
            console.error('Error fetching or creating lead / chat_messages:', convErr);
          }
        }

        // Si el lead está asignado a humano ('human'), NO generar respuesta automática
        const isHumanTakeover = leadRecord?.handled_by === 'human' || leadRecord?.status === 'handover';
        if (isHumanTakeover) {
          console.log(`👤 Lead ${fromNumber} está en modo Intervención Humana.`);
          return res.status(200).json({ status: 'HUMAN_TAKEOVER_ACTIVE_MESSAGE_RECORDED' });
        }

        // 4. Buscar TODAS las propiedades activas de la organización/usuario (SIN FILTROS QUE EXCLUYAN ALQUILERES NI LÍMITE RESTRICTIVO)
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

            const { data: propsData, error: propErr } = await propQuery;
            if (!propErr && propsData && propsData.length > 0) {
              rawProperties = propsData;
            } else {
              const { data: allAvailable } = await supabase
                .from('properties')
                .select('*')
                .in('status', ['available', 'active', 'disponible', 'Disponible']);
              if (allAvailable && allAvailable.length > 0) {
                rawProperties = allAvailable;
              }
            }
          } catch (e) {
            console.error('[whatsappHandler] Error trayendo propiedades de Supabase:', e);
          }
        }

        console.log(`[whatsappHandler] properties fetched: ${rawProperties.length}`, 
          rawProperties.map(p => `[${p.id}] ${p.title} (${p.operation_type || 'venta'}) - ${p.zone || p.city} - USD ${p.price}`)
        );

        // Mapear a formato PropertyForPrompt estructurado (1 a 1 sin mezclar campos)
        const propertiesListForPrompt: PropertyForPrompt[] = rawProperties.map((p) => {
          let displayType = p.type || 'Inmueble';
          if (p.type === 'house') displayType = 'Casa';
          else if (p.type === 'apartment' || p.type === 'depto') displayType = 'Departamento';
          else if (p.type === 'land' || p.type === 'lote') displayType = 'Lote / Terreno';

          const opType = p.operation_type === 'rent' ? 'Alquiler' : (p.operation_type || 'Venta');

          return {
            id: p.id,
            title: p.title || 'Propiedad disponible',
            type: displayType,
            operation_type: opType,
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

        // 5. Generar respuesta con IA inyectando el array estructurado y fresco
        let botReplyText = '';
        try {
          const aiResponse = await generateStructuredAriaRealEstateResponse({
            message: messageText,
            history: conversationHistory,
            propertiesList: propertiesListForPrompt,
            agentName: botName,
            agencyName,
            customInstructions: customRules,
            faqKnowledge: Array.isArray(faqList) ? faqList : [],
            calendarBookingUrl: bookingUrl,
          });

          botReplyText = aiResponse.replyText;
          console.log(`[whatsappHandler] AI response generada, longitud: ${botReplyText?.length}`);
        } catch (aiErr) {
          console.warn('Fallback local para WhatsApp Meta:', aiErr);
          if (messageText.toLowerCase().includes('visita') && bookingUrl) {
            botReplyText = `¡Hola! Podés coordinar tu visita directamente desde nuestro calendario oficial aquí: ${bookingUrl}`;
          } else {
            botReplyText = `¡Hola! Gracias por comunicarte con ${agencyName}. Soy ${botName}. ¿En qué tipo de propiedad estás interesado o en qué zona buscas?`;
          }
        }

        // 6. Guardar respuesta del bot en CRM (chat_messages, wa_messages y leads)
        if (supabase && existingConvId) {
          try {
            const { error: botMsgErr } = await supabase.from('chat_messages').insert({
              lead_id: existingConvId,
              sender: 'assistant',
              sender_type: 'assistant',
              message_type: 'text',
              content: botReplyText,
              message_text: botReplyText,
              created_at: new Date().toISOString(),
            });

            await supabase.from('wa_messages').insert([
              {
                conversation_id: existingConvId,
                organization_id: orgId,
                wamid: wamid || undefined,
                sender_type: 'user',
                message_text: messageText,
                created_at: new Date().toISOString(),
              },
              {
                conversation_id: existingConvId,
                organization_id: orgId,
                sender_type: 'bot',
                message_text: botReplyText,
                created_at: new Date().toISOString(),
              },
            ]);

            const { error: leadUpdateErr } = await supabase
              .from('leads')
              .update({
                last_message: botReplyText,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingConvId);

            console.log('[whatsappHandler] insert bot message resultado:', { botMsgErr, leadUpdateErr });
          } catch (dbLogErr) {
            console.error('Error saving bot messages to CRM:', dbLogErr);
          }
        }

        // 7. Enviar respuesta vía WhatsApp Cloud API
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

            if (!sendRes.ok) {
              const metaErr = await sendRes.json().catch(() => ({}));
              console.error('Error sending message via Meta Cloud API:', metaErr);
            } else {
              console.log(`✅ [whatsappHandler] WhatsApp response sent successfully to ${fromNumber}`);
            }
          } catch (sendEx) {
            console.error('Exception sending WhatsApp message to Meta:', sendEx);
          }
        }

        return res.status(200).json({ status: 'success' });
      } catch (err: any) {
        console.error('Error in WhatsApp POST Webhook:', err);
        return res.status(200).json({ status: 'ERROR_HANDLED', message: err?.message });
      }
    }
  }

  // SUB-ROUTE: STATUS & OAUTH CONFIG (/api/whatsapp/oauth, /api/whatsapp/connect, etc.)
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

    // GET Status
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

    // POST: Connect / Disconnect / Verify
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const action = body.action || subRoute;

      // ACTION 1: DISCONNECT
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

      // ACTION 2: CONNECT / SAVE
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

  return res.status(404).json({ error: `Sub-route '${subRoute}' not found` });
}

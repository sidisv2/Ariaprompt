import { sendWhatsAppTextMessage } from '../_lib/whatsappClient.js';
﻿import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { generateStructuredAriaRealEstateResponse } from '../_lib/openrouterService.js';

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
      const mode = req.query['hub.mode'] || (req.query as any)?.mode;
      const verifyToken = req.query['hub.verify_token'] || (req.query as any)?.verify_token;
      const challenge = req.query['hub.challenge'] || (req.query as any)?.challenge;

      if (mode === 'subscribe') {
        const globalToken = (
          process.env.META_WEBHOOK_VERIFY_TOKEN ||
          process.env.WHATSAPP_VERIFY_TOKEN ||
          process.env.WEBHOOK_VERIFY_TOKEN ||
          'aria_prop_whatsapp_webhook_secret_verify_token_2026'
        ).trim();

        // Verificar si coincide con el global o si alguna organización configuró un verify token específico
        let isValid = verifyToken === globalToken;

        if (!isValid && supabase && verifyToken) {
          try {
            const { data: orgWithToken } = await supabase
              .from('organizations')
              .select('id')
              .or(`meta_webhook_verify_token.eq.${verifyToken},wa_verify_token.eq.${verifyToken}`)
              .limit(1)
              .maybeSingle();

            if (orgWithToken) {
              isValid = true;
            }
          } catch {}
        }

        if (isValid) {
          console.log('✓ Meta WhatsApp Webhook Handshake verificado exitosamente.');
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          return res.status(200).send(challenge || '');
        } else {
          console.error(`✗ Meta Webhook Verification Fallida. Token recibido: "${verifyToken}"`);
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

        // Soporte unificado para Webhooks de Meta Lead Ads (Instagram / Facebook Ads)
        if (body.object === 'page' || body.object === 'instagram') {
          const leadgenEntry = body.entry?.[0];
          const leadgenChange = leadgenEntry?.changes?.[0];

          if (leadgenChange?.field === 'leadgen' && supabase) {
            try {
              const leadgenId = leadgenChange.value?.leadgen_id;
              const pageId = leadgenChange.value?.page_id;
              const formId = leadgenChange.value?.form_id;

              // Insertar lead pendiente en CRM con source instagram_ads
              const { data: newLead } = await supabase
                .from('leads')
                .insert({
                  user_name: 'Lead de Instagram Ads',
                  name: 'Lead de Instagram Ads',
                  source: 'instagram_ads',
                  outbound_status: 'pending',
                  status: 'new',
                  handled_by: 'ia',
                  notes: `Lead captado vía Instagram Ads (Leadgen ID: ${leadgenId}, Form: ${formId})`,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .select('*')
                .single();

              return res.status(200).json({ status: 'INSTAGRAM_LEAD_INGESTED', lead: newLead });
            } catch (leadgenErr) {
              console.error('Error ingesting Instagram Leadgen:', leadgenErr);
              return res.status(200).json({ status: 'LEADGEN_ERROR' });
            }
          }
          return res.status(200).json({ status: 'PAGE_EVENT_ACKNOWLEDGED' });
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

        if (!fromNumber || !businessPhoneNumberId) {
          return res.status(200).json({ status: 'MISSING_SENDER_OR_PHONE_ID' });
        }

        // Extraer texto y multimedia del mensaje
        let messageText = '';
        let mediaUrl: string | null = null;
        let messageType = 'text';

        if (msgType === 'text' && incomingMsg.text?.body) {
          messageText = incomingMsg.text.body;
        } else if (msgType === 'image') {
          messageType = 'image';
          messageText = incomingMsg.image?.caption || 'Foto enviada';
          mediaUrl = incomingMsg.image?.link || (incomingMsg.image?.id ? `https://graph.facebook.com/v21.0/${incomingMsg.image.id}` : null);
        } else if (msgType === 'audio' || msgType === 'voice') {
          messageType = 'audio';
          messageText = 'Mensaje de voz';
          mediaUrl = incomingMsg.audio?.link || incomingMsg.voice?.link || (incomingMsg.audio?.id ? `https://graph.facebook.com/v21.0/${incomingMsg.audio.id}` : null);
        } else if (msgType === 'button' && incomingMsg.button?.text) {
          messageText = incomingMsg.button.text;
        } else if (incomingMsg.interactive?.button_reply?.title) {
          messageText = incomingMsg.interactive.button_reply.title;
        } else if (incomingMsg.interactive?.list_reply?.title) {
          messageText = incomingMsg.interactive.list_reply.title;
        } else {
          messageText = 'Hola';
        }

        // 1. Deduplicación por WAMID
        if (supabase && wamid) {
          try {
            const { data: existingProc } = await supabase
              .from('processed_messages')
              .select('id')
              .eq('wamid', wamid)
              .maybeSingle();

            if (existingProc) {
              return res.status(200).json({ status: 'DUPLICATE_MESSAGE_SKIPPED' });
            }

            await supabase.from('processed_messages').insert({
              wamid,
              created_at: new Date().toISOString(),
            });
          } catch {}
        }

        // 2. Buscar la inmobiliaria correspondiente en Supabase
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
            }
          } catch (err) {
            console.warn('Error fetching organization by phone number id:', err);
          }
        }

        // 🔒 Verificación de Suscripción Activa (Paywall Backend & Protección de Cuota de IA)
        if (org) {
          const subStatus = (org.subscription_status || org.status || 'active').toLowerCase();
          const isTrial = org.is_trial_active === true || (org.trial_ends_at && new Date(org.trial_ends_at).getTime() > Date.now());
          
          if (subStatus === 'canceled' || subStatus === 'expired' || subStatus === 'unpaid' || subStatus === 'past_due') {
            if (!isTrial) {
              console.warn(`⚠️ Mensaje de WhatsApp omitido: Organización ${org.id} tiene la suscripción inactiva (${subStatus}).`);
              return res.status(200).json({ status: 'SUBSCRIPTION_INACTIVE_SKIPPED', organizationId: org.id });
            }
          }
        }

        const orgId = org?.id || 'org-default';
        const botName = org?.bot_name || 'Aria';
        const agencyName = org?.name || 'Inmobiliaria';
        const customRules = org?.custom_prompt_instructions || org?.system_prompt || '';
        const faqList = org?.faq_knowledge || [];
        const bookingUrl = org?.calendar_booking_url || '';
        const accessToken = org?.meta_access_token || org?.wa_access_token || process.env.META_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN || '';

        // 3. Buscar o crear Lead y chequear handled_by & Memoria persistente (últimos 15 mensajes)
        let conversationHistory: Array<{ sender: 'user' | 'assistant'; content: string }> = [];
        let existingConvId: string | null = null;
        let leadRecord: any = null;

        if (supabase && orgId) {
          try {
            // Buscar en tabla leads
            const { data: foundLead } = await supabase
              .from('leads')
              .select('*')
              .or(`organization_id.eq.${orgId},user_id.eq.${orgId}`)
              .or(`phone.eq.${fromNumber},user_phone.eq.${fromNumber}`)
              .maybeSingle();

            if (foundLead) {
              leadRecord = foundLead;
              existingConvId = foundLead.id;

              // Si el lead tenía outbound_status pending o contacted, marcar como replied
              if (foundLead.outbound_status === 'contacted' || foundLead.outbound_status === 'pending') {
                await supabase
                  .from('leads')
                  .update({ outbound_status: 'replied', updated_at: new Date().toISOString() })
                  .eq('id', foundLead.id);
              }
            } else {
              // Crear lead automáticamente
              const { data: newLead } = await supabase
                .from('leads')
                .insert({
                  organization_id: orgId,
                  user_id: orgId,
                  user_phone: fromNumber,
                  phone: fromNumber,
                  user_name: `WhatsApp ${fromNumber.slice(-4)}`,
                  name: `WhatsApp ${fromNumber.slice(-4)}`,
                  status: 'active',
                  handled_by: 'ia',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .select('*')
                .single();

              if (newLead) {
                leadRecord = newLead;
                existingConvId = newLead.id;
              }
            }

            // Persistir mensaje entrante del usuario en chat_messages con soporte multimedia
            if (existingConvId) {
              await supabase.from('chat_messages').insert({
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
            }

            // Recuperar últimos 15 mensajes de chat_messages cronológicamente (created_at ASC)
            if (existingConvId) {
              const { data: pastMsgs } = await supabase
                .from('chat_messages')
                .select('sender, content, message_text, created_at')
                .eq('lead_id', existingConvId)
                .order('created_at', { ascending: true })
                .limit(15);

              if (pastMsgs && pastMsgs.length > 0) {
                conversationHistory = pastMsgs.map((m: any) => ({
                  sender: (m.sender === 'user' || m.sender_type === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
                  content: m.content || m.message_text || '',
                }));
              }
            }
          } catch (convErr) {
            console.warn('Error fetching or creating lead / chat_messages:', convErr);
          }
        }

        // Si el lead está asignado a humano ('human'), NO generar respuesta automática
        const isHumanTakeover = leadRecord?.handled_by === 'human' || leadRecord?.status === 'handover';
        if (isHumanTakeover) {
          console.log(`ℹ️ Lead ${fromNumber} está en modo Intervención Humana. Mensaje guardado en chat_messages sin respuesta de IA.`);
          return res.status(200).json({ status: 'HUMAN_TAKEOVER_ACTIVE_MESSAGE_RECORDED' });
        }

        // 4. Buscar todas las propiedades activas y públicas de la inmobiliaria
        let properties: any[] = [];
        if (supabase) {
          try {
            let propQuery = supabase
              .from('properties')
              .select('*')
              .neq('is_public', false)
              .in('status', ['available', 'disponible', 'published']);

            if (orgId && orgId !== 'org-default') {
              propQuery = propQuery.or(`organization_id.eq.${orgId},user_id.eq.${orgId}`);
            }

            const { data: propsData } = await propQuery.limit(100);
            if (propsData && propsData.length > 0) {
              properties = propsData;
            } else {
              const { data: fallbackProps } = await supabase
                .from('properties')
                .select('*')
                .neq('is_public', false)
                .in('status', ['available', 'disponible'])
                .limit(100);
              if (fallbackProps) properties = fallbackProps;
            }
          } catch (e) {
            console.warn('Error fetching properties in whatsappHandler:', e);
          }
        }

        const propertyCatalogText = properties
          .map((p) => {
            const coverImage = (Array.isArray(p.images) && p.images[0]) || p.image_url || null;
            const imgNote = coverImage ? ` [Foto Portada: ${coverImage}]` : '';
            return `- [ID: ${p.id}] "${p.title}" (${(p.type || 'Inmueble').toUpperCase()} - ${(p.operation_type || p.operation || 'VENTA').toUpperCase()}) en ${p.zone || p.location?.zone || 'Zona'}. Precio: ${p.price} USD. ${p.bedrooms || 2} hab.${imgNote} Ficha Interactiva y Galería: https://ariaprop.online/p/${p.id}`;
          })
          .join('\n');

        // 5. Generar respuesta con IA
        let botReplyText = '';
        try {
          const aiResponse = await generateStructuredAriaRealEstateResponse({
            message: messageText,
            history: conversationHistory,
            propertyContext: propertyCatalogText,
            agentName: botName,
            agencyName,
            customInstructions: customRules,
            faqKnowledge: Array.isArray(faqList) ? faqList : [],
            calendarBookingUrl: bookingUrl,
          });

          botReplyText = aiResponse.replyText;
        } catch (aiErr) {
          console.warn('Fallback local para WhatsApp Meta:', aiErr);
          if (messageText.toLowerCase().includes('visita') && bookingUrl) {
            botReplyText = `¡Hola! Podés coordinar tu visita directamente desde nuestro calendario oficial aquí: ${bookingUrl}`;
          } else {
            botReplyText = `¡Hola! Gracias por comunicarte con ${agencyName}. Soy ${botName}. ¿En qué tipo de propiedad estás interesado o en qué zona buscas?`;
          }
        }

        // 6. Guardar mensaje del usuario y respuesta en el CRM (Supabase)
        if (supabase && existingConvId) {
          try {
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

            await supabase.from('wa_conversations').update({
              last_message_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }).eq('id', existingConvId);
          } catch (dbLogErr) {
            console.warn('Error saving messages to CRM:', dbLogErr);
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
              console.log(`✓ WhatsApp response sent successfully to ${fromNumber}`);
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
                wa_phone_number_id: null,
                wa_waba_id: null,
                wa_access_token: null,
                wa_connected: false,
                updated_at: new Date().toISOString(),
              })
              .or(`id.eq.${targetOrgId || userId},user_id.eq.${userId || targetOrgId}`);
          } catch {}
        }
        return res.status(200).json({ success: true, message: 'WhatsApp desconectado correctamente' });
      }

      // ACTION 2: VERIFY CREDENTIALS
      if (action === 'verify-credentials') {
        const phoneId = (body.phoneNumberId || body.meta_phone_number_id || body.phone_number_id || '').trim();
        const token = (body.accessToken || body.meta_access_token || body.access_token || '').trim();

        if (!phoneId || !token) {
          return res.status(400).json({ success: false, error: 'Phone Number ID y Access Token son requeridos' });
        }

        try {
          const metaRes = await fetch(`https://graph.facebook.com/v20.0/${phoneId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const metaData = await metaRes.json().catch(() => ({}));

          if (metaRes.ok && (metaData.id || metaData.verified_name || metaData.display_phone_number)) {
            return res.status(200).json({
              success: true,
              verified: true,
              phoneNumberId: metaData.id || phoneId,
              verifiedName: metaData.verified_name || 'Línea de WhatsApp Business Verificada',
              displayPhoneNumber: metaData.display_phone_number || phoneId,
              qualityRating: metaData.quality_rating || 'GREEN',
            });
          } else {
            return res.status(400).json({
              success: false,
              verified: false,
              error: metaData.error?.message || 'Meta Graph API no pudo verificar las credenciales.',
              details: metaData.error,
            });
          }
        } catch (verifyEx: any) {
          return res.status(500).json({ success: false, error: verifyEx.message });
        }
      }

      // ACTION 3: CONNECT / SAVE
      const phoneId = (body.meta_phone_number_id || body.phoneNumberId || body.phone_number_id || '').trim();
      const wabaId = (body.meta_waba_id || body.wabaId || body.waba_id || '').trim();
      const token = (body.meta_access_token || body.accessToken || body.access_token || '').trim();
      const verifyToken = (body.meta_webhook_verify_token || body.webhook_verify_token || 'aria_prop_whatsapp_webhook_secret_verify_token_2026').trim();

      if (!phoneId || !token) {
        return res.status(400).json({ success: false, error: 'Phone Number ID y Access Token son requeridos' });
      }

      const payload = {
        meta_phone_number_id: phoneId,
        meta_waba_id: wabaId || null,
        meta_access_token: token,
        meta_webhook_verify_token: verifyToken,
        wa_phone_number_id: phoneId,
        wa_waba_id: wabaId || null,
        wa_access_token: token,
        wa_connected: true,
        updated_at: new Date().toISOString(),
      };

      if (supabase && (targetOrgId || userId)) {
        try {
          const { data: existing } = await supabase
            .from('organizations')
            .select('id')
            .or(`id.eq.${targetOrgId || userId},user_id.eq.${userId || targetOrgId}`)
            .maybeSingle();

          if (existing?.id) {
            await supabase.from('organizations').update(payload).eq('id', existing.id);
            targetOrgId = existing.id;
          } else {
            const { data: inserted } = await supabase
              .from('organizations')
              .insert([{ ...payload, id: userId || undefined, user_id: userId || undefined }])
              .select('id')
              .single();
            if (inserted?.id) targetOrgId = inserted.id;
          }
        } catch (saveErr) {
          console.warn('Error saving organization credentials:', saveErr);
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Credenciales de Meta WhatsApp Cloud API guardadas exitosamente',
        organization: {
          id: targetOrgId || 'org_active',
          meta_phone_number_id: phoneId,
          meta_waba_id: wabaId,
          wa_connected: true,
        },
      });
    }
  }

  return res.status(404).json({ error: `Sub-route '${subRoute}' not found` });
}

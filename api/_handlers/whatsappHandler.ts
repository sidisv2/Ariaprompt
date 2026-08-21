import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { processAriaMessage } from '../_ariaEngine.js';
import { sendWhatsAppTextMessage } from '../_lib/whatsappClient.js';
import { sendHandoverEmailNotification } from '../../lib/notifications/email.js';
import { sendAdvisorWhatsAppAlert } from '../../lib/notifications/advisorAlerts.js';
import { processIncomingVoiceMessage } from '../../lib/whatsapp/audioProcessor.js';

function getBackendSupabaseClient() {
  const supabaseUrl = (
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    ''
  ).trim();

  const supabaseKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    ''
  ).trim();

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

/**
 * Handle Sub-Routes:
 * - /api/whatsapp/webhook (GET: Meta verification handshake, POST: Incoming WhatsApp message)
 * - /api/whatsapp/oauth   (GET: Organization status, POST: Connect / Disconnect Embedded Signup)
 */
export async function handleWhatsAppRoute(req: VercelRequest, res: VercelResponse, subRoute: string) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabase = getBackendSupabaseClient();

  // ROUTE 1: META WHATSAPP WEBHOOK (/api/whatsapp/webhook)
  if (subRoute === 'webhook' || subRoute === 'whatsapp-webhook') {
    // GET: Meta Webhook Handshake
    if (req.method === 'GET') {
      const mode = Array.isArray(req.query['hub.mode']) ? req.query['hub.mode'][0] : req.query['hub.mode'];
      const rawQueryToken = Array.isArray(req.query['hub.verify_token']) ? req.query['hub.verify_token'][0] : req.query['hub.verify_token'];
      const token = (typeof rawQueryToken === 'string' ? rawQueryToken : '').replace(/^["']|["']$/g, '').trim();
      const challenge = Array.isArray(req.query['hub.challenge']) ? req.query['hub.challenge'][0] : req.query['hub.challenge'];

      if (mode === 'subscribe') {
        const rawEnvToken =
          process.env.META_WEBHOOK_VERIFY_TOKEN ||
          process.env.META_WA_VERIFY_TOKEN ||
          process.env.WHATSAPP_VERIFY_TOKEN ||
          process.env.META_VERIFY_TOKEN ||
          process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ||
          process.env.WEBHOOK_VERIFY_TOKEN ||
          'aria_prop_whatsapp_webhook_secret_verify_token_2026';
        const expectedToken = (rawEnvToken || '').replace(/^["']|["']$/g, '').trim();

        if (token && expectedToken && token === expectedToken) {
          console.log('✅ Meta Webhook Verification Handshake Successful!');
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          return res.status(200).send(challenge || '');
        } else {
          console.error(`❌ Meta Webhook Verification Failed: Token Mismatch. Esperado: "${expectedToken}", Recibido: "${token}"`);
          return res.status(403).send('Forbidden');
        }
      }

      return res.status(200).json({ status: 'ok', service: 'whatsapp-webhook' });
    }

    // POST: Incoming WhatsApp Event
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

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
          return res.status(200).json({ status: 'STATUS_UPDATE_ACKNOWLEDGED' });
        }

        const incomingMsg = messages[0];
        const fromNumber = incomingMsg.from;
        const msgType = incomingMsg.type;
        const wamid = incomingMsg.id;
        const phoneNumberId = metadata?.phone_number_id;

        let organizationId = '00000000-0000-0000-0000-000000000000';
        let tenantAccessToken: string | undefined = undefined;

        if (supabase && phoneNumberId) {
          const { data: orgData } = await supabase
            .from('organizations')
            .select('id, wa_access_token')
            .eq('wa_phone_number_id', phoneNumberId)
            .single();

          if (orgData) {
            organizationId = orgData.id;
            if (orgData.wa_access_token) {
              tenantAccessToken = orgData.wa_access_token;
            }
          }
        }

        let textBody = '';
        let isVoiceNote = false;
        let audioMediaId = incomingMsg.audio?.id || incomingMsg.voice?.id;

        if ((msgType === 'audio' || msgType === 'voice') && audioMediaId) {
          isVoiceNote = true;
          const tokenToUse = tenantAccessToken || process.env.WHATSAPP_TOKEN || process.env.META_ACCESS_TOKEN || '';
          const transcribedText = await processIncomingVoiceMessage(audioMediaId, tokenToUse);
          textBody = `🎙️ [Nota de voz]: ${transcribedText}`;
        } else if (msgType === 'text' && incomingMsg.text?.body) {
          textBody = incomingMsg.text.body;
        } else if (msgType === 'button' && incomingMsg.button?.text) {
          textBody = incomingMsg.button.text;
        } else if (incomingMsg.interactive?.button_reply?.title) {
          textBody = incomingMsg.interactive.button_reply.title;
        } else {
          textBody = 'Hola';
        }

        // 1. Idempotency & Deduplication Check (processed_messages)
        if (supabase && wamid) {
          try {
            const { data: existingProc } = await supabase
              .from('processed_messages')
              .select('id')
              .eq('wamid', wamid)
              .maybeSingle();

            if (existingProc) {
              console.log(`ℹ️ [DEDUPLICATION] Message wamid "${wamid}" already processed. Skipping duplicate execution.`);
              return res.status(200).json({ status: 'EVENT_RECEIVED', duplicate: true });
            }

            await supabase.from('processed_messages').insert({
              wamid,
              organization_id: organizationId,
              created_at: new Date().toISOString(),
            });
          } catch (dedupErr) {
            console.warn('⚠️ Webhook deduplication check notice:', dedupErr);
          }
        }

        let conversationStatus = 'active';
        let botStatus = 'active';
        let existingConvId: string | null = null;
        let lastHumanInteractionAt: string | null = null;

        if (supabase) {
          try {
            const { data: conv } = await supabase
              .from('wa_conversations')
              .select('id, status, bot_status, last_human_interaction_at, updated_at')
              .eq('organization_id', organizationId)
              .eq('user_phone', fromNumber)
              .maybeSingle();

            if (conv) {
              existingConvId = conv.id;
              conversationStatus = conv.status || 'active';
              botStatus = conv.bot_status || conv.status || 'active';
              lastHumanInteractionAt = conv.last_human_interaction_at || conv.updated_at || null;
            }
          } catch {}
        }

        const cleanLowerMsg = textBody.toLowerCase().trim();
        const isHumanTakeoverKeyword =
          cleanLowerMsg.includes('quiero hablar con un asesor') ||
          cleanLowerMsg.includes('hablar con una persona') ||
          cleanLowerMsg.includes('asesor real') ||
          cleanLowerMsg.includes('asesor humano') ||
          cleanLowerMsg.includes('hablar con alguien') ||
          cleanLowerMsg.includes('atencion humana') ||
          cleanLowerMsg.includes('contactar un asesor');

        const isReactivationKeyword =
          cleanLowerMsg === 'activar bot' ||
          cleanLowerMsg === 'reiniciar ia' ||
          cleanLowerMsg === 'hablar con bot' ||
          cleanLowerMsg === 'reiniciar bot';

        if (isHumanTakeoverKeyword) {
          conversationStatus = 'handover';
          botStatus = 'human_takeover';

          let assignedAdvisorId: string | null = null;
          if (supabase && organizationId) {
            try {
              const { data: advisor } = await supabase
                .from('advisors')
                .select('id')
                .eq('organization_id', organizationId)
                .eq('status', 'active')
                .maybeSingle();
              if (advisor) assignedAdvisorId = advisor.id;
            } catch {}
          }

          if (supabase && existingConvId) {
            try {
              await supabase.from('wa_conversations').update({
                status: 'handover',
                bot_status: 'human_takeover',
                last_human_interaction_at: new Date().toISOString(),
                ...(assignedAdvisorId ? { assigned_advisor_id: assignedAdvisorId } : {}),
                updated_at: new Date().toISOString(),
              }).eq('id', existingConvId);
            } catch {}
          }
        } else if (isReactivationKeyword && supabase && existingConvId) {
          conversationStatus = 'active';
          botStatus = 'active';
          await supabase
            .from('wa_conversations')
            .update({ status: 'active', bot_status: 'active', updated_at: new Date().toISOString() })
            .eq('id', existingConvId);
        }

        const isPausedOrHandover = conversationStatus === 'handover' || conversationStatus === 'closed' || botStatus === 'human_takeover' || botStatus === 'paused';

        if (isPausedOrHandover && !isReactivationKeyword) {
          const lastTime = lastHumanInteractionAt ? new Date(lastHumanInteractionAt).getTime() : 0;
          const hoursElapsed = lastTime > 0 ? (Date.now() - lastTime) / (1000 * 60 * 60) : 3;

          if (hoursElapsed >= 2) {
            console.log(`⏱️ [AUTO-REACTIVATION] >2h elapsed (${hoursElapsed.toFixed(1)}h). Auto-reactivating AI bot.`);
            conversationStatus = 'active';
            botStatus = 'active';
            if (supabase && existingConvId) {
              try {
                await supabase.from('wa_conversations').update({
                  status: 'active',
                  bot_status: 'active',
                  updated_at: new Date().toISOString(),
                }).eq('id', existingConvId);
              } catch {}
            }
          } else {
            if (supabase && existingConvId) {
              try {
                await supabase.from('wa_messages').insert({
                  conversation_id: existingConvId,
                  organization_id: organizationId,
                  wamid: wamid || undefined,
                  sender_type: 'user',
                  message_text: textBody,
                  created_at: new Date().toISOString(),
                });
              } catch {}

              try {
                await supabase.from('wa_conversations').update({
                  last_message_at: new Date().toISOString(),
                }).eq('id', existingConvId);
              } catch {}
            }

            sendHandoverEmailNotification({
              organizationId,
              userPhone: fromNumber,
              lastMessage: textBody,
              conversationId: existingConvId,
              supabaseClient: supabase,
            }).catch((err) => console.warn('⚠️ Handover email trigger warning:', err));

            try {
              sendAdvisorWhatsAppAlert({
                orgId: organizationId,
                leadPhone: fromNumber,
                lastMessage: textBody,
                reason: 'handover',
                supabaseClient: supabase,
              }).catch((err) => console.warn('⚠️ Handover advisor WhatsApp alert trigger warning:', err));
            } catch (alertErr) {
              console.warn('⚠️ Handover advisor WhatsApp alert isolated exception:', alertErr);
            }

            return res.status(200).json({
              status: 'HANDOVER_HUMAN_ACTIVE',
              conversationStatus,
              botStatus,
              message: 'User message logged, AI auto-reply bypassed during takeover window.',
            });
          }
        }

        const { text: aiResponseText, conversationId } = await processAriaMessage({
          organizationId,
          userPhone: fromNumber,
          userMessage: textBody,
          wamid,
        });

        const sendResult = await sendWhatsAppTextMessage({
          to: fromNumber,
          text: aiResponseText,
          phoneNumberId,
          accessToken: tenantAccessToken,
        });

        return res.status(200).json({
          status: 'EVENT_PROCESSED',
          from: fromNumber,
          organizationId,
          conversationId,
          sent: sendResult.success,
        });
      } catch (err: any) {
        console.error('❌ Exception in WhatsApp Webhook POST:', err);
        return res.status(200).json({ status: 'ERROR_LOGGED', error: err.message });
      }
    }
  }

  // ROUTE 2: META OAUTH & CREDENTIALS MANAGEMENT (/api/whatsapp/oauth, /api/whatsapp/disconnect, /api/whatsapp/connect)
  if (subRoute === 'oauth' || subRoute === 'connect' || subRoute === 'disconnect' || subRoute === 'verify') {
    if (!supabase) {
      return res.status(200).json({
        success: true,
        organization: {
          id: 'demo-org',
          name: 'Tu Inmobiliaria',
          wa_phone_number_id: null,
          wa_waba_id: null,
          wa_connected: false,
          updated_at: new Date().toISOString(),
        },
      });
    }

    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    // 1. Resolve active user and organization
    let userId: string | null = null;
    let organizationId: string | null = (req.query.organization_id as string) || null;

    if (token) {
      try {
        const { data: userData } = await supabase.auth.getUser(token);
        if (userData?.user) {
          userId = userData.user.id;
          const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', userData.user.id)
            .maybeSingle();

          if (profile?.organization_id) {
            organizationId = profile.organization_id;
          } else {
            // Check if organization exists by user_id
            const { data: userOrg } = await supabase
              .from('organizations')
              .select('id')
              .eq('user_id', userData.user.id)
              .maybeSingle();
            if (userOrg?.id) {
              organizationId = userOrg.id;
            }
          }
        }
      } catch (authEx) {
        console.warn('⚠️ Token auth resolution notice:', authEx);
      }
    }

    if (req.method === 'GET') {
      let foundOrg: any = null;

      if (organizationId) {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('id, name, wa_phone_number_id, wa_waba_id, wa_connected, updated_at')
          .eq('id', organizationId)
          .maybeSingle();

        if (orgData) {
          foundOrg = orgData;
        }
      }

      // If not found yet but user is authenticated, query organizations by user_id
      if (!foundOrg && userId) {
        const { data: userOrg } = await supabase
          .from('organizations')
          .select('id, name, wa_phone_number_id, wa_waba_id, wa_connected, updated_at')
          .eq('user_id', userId)
          .maybeSingle();

        if (userOrg) {
          foundOrg = userOrg;
        }
      }

      // If still not found, check if there's any active connected organization in database as fallback
      if (!foundOrg) {
        const { data: anyConnectedOrg } = await supabase
          .from('organizations')
          .select('id, name, wa_phone_number_id, wa_waba_id, wa_connected, updated_at')
          .eq('wa_connected', true)
          .limit(1)
          .maybeSingle();

        if (anyConnectedOrg) {
          foundOrg = anyConnectedOrg;
        }
      }

      const isConnected = Boolean(
        foundOrg &&
        foundOrg.wa_connected === true &&
        foundOrg.wa_phone_number_id &&
        String(foundOrg.wa_phone_number_id).trim().length > 0
      );

      if (isConnected && foundOrg) {
        return res.status(200).json({
          success: true,
          isConnected: true,
          organization: {
            id: foundOrg.id,
            name: foundOrg.name || 'Mi Inmobiliaria',
            wa_phone_number_id: foundOrg.wa_phone_number_id,
            wa_waba_id: foundOrg.wa_waba_id || null,
            wa_connected: true,
            updated_at: foundOrg.updated_at,
          },
        });
      }

      return res.status(200).json({
        success: true,
        isConnected: false,
        organization: null,
      });
    }

    if (req.method === 'POST') {
      const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) || {};
      const action = body.action || (subRoute === 'disconnect' ? 'disconnect' : 'connect');
      const targetOrgId = body.organizationId || organizationId;

      // ACTION 1: VERIFY CREDENTIALS DIRECTLY WITH META GRAPH API
      if (action === 'verify-credentials' || subRoute === 'verify') {
        const rawPhoneId = (body.phoneNumberId || body.phone_number_id || '').trim();
        const rawAccessToken = (body.accessToken || body.access_token || '').trim();

        if (!rawPhoneId || !/^\d{12,20}$/.test(rawPhoneId)) {
          return res.status(400).json({
            success: false,
            error: 'El Phone Number ID debe ser un identificador numérico de Meta de 15 a 17 dígitos (no ingreses tu número de teléfono).',
          });
        }

        if (!rawAccessToken || rawAccessToken.length < 20) {
          return res.status(400).json({
            success: false,
            error: 'Ingresa un Access Token válido de Meta Business Manager (System User Token o Permanent Token).',
          });
        }

        try {
          const verifyUrl = `https://graph.facebook.com/v20.0/${rawPhoneId}?fields=id,display_phone_number,verified_name,quality_rating`;
          const metaRes = await fetch(verifyUrl, {
            headers: {
              'Authorization': `Bearer ${rawAccessToken}`,
              'Content-Type': 'application/json',
            },
          });

          const metaData = await metaRes.json().catch(() => ({}));

          if (!metaRes.ok || metaData.error) {
            const errorMsg = metaData.error?.message || (metaData.error?.type ? `[${metaData.error.type}]: Error en Meta API` : `HTTP ${metaRes.status}`);
            return res.status(400).json({
              success: false,
              error: `Meta Graph API: ${errorMsg}`,
              details: metaData.error,
            });
          }

          const lineName = metaData.verified_name || metaData.display_phone_number || 'Línea WhatsApp Business (Meta)';

          return res.status(200).json({
            success: true,
            verified: true,
            verifiedName: lineName,
            displayPhoneNumber: metaData.display_phone_number || null,
            qualityRating: metaData.quality_rating || 'GREEN',
            phoneNumberId: metaData.id || rawPhoneId,
          });
        } catch (err: any) {
          return res.status(500).json({
            success: false,
            error: `Excepción al conectar con Graph API de Meta: ${err.message || String(err)}`,
          });
        }
      }

      // ACTION 2: DISCONNECT
      if (action === 'disconnect' || subRoute === 'disconnect') {
        if (targetOrgId) {
          try {
            const { error: updateErr } = await supabase
              .from('organizations')
              .update({
                wa_connected: false,
                wa_access_token: null,
                wa_phone_number_id: null,
                wa_waba_id: null,
                updated_at: new Date().toISOString(),
              })
              .eq('id', targetOrgId);

            if (updateErr) {
              console.warn('⚠️ Supabase disconnect error:', updateErr);
            }
          } catch (ex: any) {
            console.warn('⚠️ Disconnect exception:', ex);
          }
        }

        return res.status(200).json({
          success: true,
          message: 'Cuenta de WhatsApp Business desconectada correctamente.',
          wa_connected: false,
        });
      }

      // ACTION 3: CONNECT / SAVE (MANUAL O EMBEDDED SIGNUP)
      const code = body.code;
      let wabaId = (body.wabaId || body.waba_id || '').trim();
      let phoneNumberId = (body.phoneNumberId || body.phone_number_id || '').trim();
      let accessToken = (body.accessToken || body.access_token || '').trim();

      const appId = (process.env.META_APP_ID || process.env.VITE_META_APP_ID || '891096146948509').trim();
      const appSecret = (process.env.META_APP_SECRET || process.env.WHATSAPP_APP_SECRET || 'cb334e158d0866dcaf9b0224cedb0493').trim();

      if (code && appId && appSecret) {
        try {
          const tokenUrl = `https://graph.facebook.com/v20.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${code}`;
          const metaRes = await fetch(tokenUrl);
          const metaData = await metaRes.json().catch(() => ({}));
          if (metaData.error) {
            console.error('[Meta Token Exchange Error]:', metaData.error);
          }
          if (metaData.access_token) {
            accessToken = metaData.access_token;
            console.log('✅ Meta System User Access Token Exchanged Successfully');
          }
        } catch (err) {
          console.error('[Meta Token Exchange Exception]:', err);
        }
      }

      if (!phoneNumberId || !/^\d{10,20}$/.test(phoneNumberId)) {
        return res.status(400).json({
          success: false,
          error: 'Phone Number ID inválido. Debe contener únicamente dígitos numéricos proporcionados por Meta (15 a 17 dígitos).',
        });
      }

      let saveOrgId = targetOrgId;

      if (saveOrgId) {
        try {
          const updatePayload: Record<string, any> = {
            wa_phone_number_id: phoneNumberId,
            wa_waba_id: wabaId || null,
            wa_connected: true,
            wa_connected_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          if (accessToken) {
            updatePayload.wa_access_token = accessToken;
          }

          const { error: orgUpdateErr } = await supabase
            .from('organizations')
            .update(updatePayload)
            .eq('id', saveOrgId);

          if (orgUpdateErr) {
            console.warn('⚠️ organizations update with all fields warning, attempting safe fallback:', orgUpdateErr.message);
            // Safe fallback without optional columns
            const fallbackPayload: Record<string, any> = {
              wa_phone_number_id: phoneNumberId,
              wa_connected: true,
              updated_at: new Date().toISOString(),
            };
            const { error: fallbackErr } = await supabase
              .from('organizations')
              .update(fallbackPayload)
              .eq('id', saveOrgId);

            if (fallbackErr) {
              console.error('❌ Error in fallback update organizations:', fallbackErr);
            }
          }

          // Verify update immediately in database
          const { data: verifiedSavedOrg } = await supabase
            .from('organizations')
            .select('id, name, wa_phone_number_id, wa_waba_id, wa_connected, updated_at')
            .eq('id', saveOrgId)
            .maybeSingle();

          console.log('🔍 [DB Verification after Connect]:', verifiedSavedOrg);

          // Also update profile if user is known
          if (userId) {
            try {
              await supabase
                .from('profiles')
                .update({
                  wa_phone_number_id: phoneNumberId,
                  wa_status: 'connected',
                  updated_at: new Date().toISOString(),
                })
                .eq('id', userId);
            } catch {}
          }
        } catch (dbErr: any) {
          console.error('❌ Exception actualizando Supabase:', dbErr);
        }
      } else {
        // Create new organization if none existed
        try {
          const { data: newOrg, error: createOrgErr } = await supabase
            .from('organizations')
            .insert({
              name: 'Mi Inmobiliaria',
              wa_phone_number_id: phoneNumberId,
              wa_waba_id: wabaId || null,
              ...(accessToken ? { wa_access_token: accessToken } : {}),
              wa_connected: true,
              wa_connected_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select('id')
            .maybeSingle();

          if (createOrgErr) {
            console.warn('⚠️ createOrgErr, trying minimal insert:', createOrgErr.message);
            const { data: minimalOrg } = await supabase
              .from('organizations')
              .insert({
                name: 'Mi Inmobiliaria',
                wa_phone_number_id: phoneNumberId,
                wa_connected: true,
              })
              .select('id')
              .maybeSingle();
            saveOrgId = minimalOrg?.id;
          } else {
            saveOrgId = newOrg?.id;
          }

          if (userId && saveOrgId) {
            try {
              await supabase
                .from('profiles')
                .update({
                  organization_id: saveOrgId,
                  wa_phone_number_id: phoneNumberId,
                  wa_status: 'connected',
                  updated_at: new Date().toISOString(),
                })
                .eq('id', userId);
            } catch {}
          }
        } catch (createEx: any) {
          console.warn('⚠️ Excepción al crear organización:', createEx);
        }
      }

      return res.status(200).json({
        success: true,
        message: 'WhatsApp guardado correctamente',
        organization: {
          id: saveOrgId || 'org-connected',
          name: 'Tu Inmobiliaria',
          wa_phone_number_id: phoneNumberId,
          wa_waba_id: wabaId || null,
          wa_connected: true,
          updated_at: new Date().toISOString(),
        },
      });
    }
  }

  return res.status(404).json({ error: `Sub-route '${subRoute}' not found` });
}

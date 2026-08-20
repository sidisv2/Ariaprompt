import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { processAriaMessage } from '../_ariaEngine.js';
import { sendWhatsAppTextMessage } from '../_lib/whatsappClient.js';
import { sendHandoverEmailNotification } from '../../lib/notifications/email.js';
import { sendAdvisorWhatsAppAlert } from '../../lib/notifications/advisorAlerts.js';
import { processIncomingVoiceMessage } from '../../lib/whatsapp/audioProcessor.js';

function getBackendSupabaseClient() {
  const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
  const supabaseKey = (process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim();
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
      const rawEnvToken =
        process.env.WHATSAPP_VERIFY_TOKEN ||
        process.env.META_VERIFY_TOKEN ||
        process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ||
        process.env.WEBHOOK_VERIFY_TOKEN ||
        'aria_prop_whatsapp_webhook_secret_verify_token_2026';
      const expectedToken = (rawEnvToken || '').replace(/^["']|["']$/g, '').trim();

      const mode = Array.isArray(req.query['hub.mode']) ? req.query['hub.mode'][0] : req.query['hub.mode'];
      const rawQueryToken = Array.isArray(req.query['hub.verify_token']) ? req.query['hub.verify_token'][0] : req.query['hub.verify_token'];
      const token = (typeof rawQueryToken === 'string' ? rawQueryToken : '').replace(/^["']|["']$/g, '').trim();
      const challenge = Array.isArray(req.query['hub.challenge']) ? req.query['hub.challenge'][0] : req.query['hub.challenge'];

      if (mode === 'subscribe' && token && expectedToken && token === expectedToken) {
        console.log('✅ Meta Webhook Verification Handshake Successful!');
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.status(200).send(challenge || '');
      } else {
        console.error(`❌ Token Mismatch. Esperado: "${expectedToken}", Recibido: "${token}"`);
        return res.status(403).send('Forbidden');
      }
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

  // ROUTE 2: META OAUTH EMBEDDED SIGNUP (/api/whatsapp/oauth)
  if (subRoute === 'oauth') {
    const defaultPhone = process.env.WHATSAPP_PHONE_ID || process.env.META_PHONE_NUMBER_ID || '5491140143729';

    if (!supabase) {
      return res.status(200).json({
        success: true,
        organization: {
          id: 'demo-org',
          name: 'Inmobiliaria Demo',
          wa_phone_number_id: defaultPhone,
          wa_waba_id: 'waba-demo-id',
          wa_connected: true,
          updated_at: new Date().toISOString(),
        },
      });
    }

    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    let organizationId: string | null = (req.query.organization_id as string) || null;

    if (token) {
      try {
        const { data: userData } = await supabase.auth.getUser(token);
        if (userData?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', userData.user.id)
            .single();

          if (profile?.organization_id) {
            organizationId = profile.organization_id;
          }
        }
      } catch {}
    }

    if (req.method === 'GET') {
      if (organizationId) {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('id, name, wa_phone_number_id, wa_waba_id, wa_connected, updated_at')
          .eq('id', organizationId)
          .maybeSingle();

        if (orgData) {
          return res.status(200).json({
            success: true,
            organization: {
              id: orgData.id,
              name: orgData.name,
              wa_phone_number_id: orgData.wa_phone_number_id || defaultPhone,
              wa_waba_id: orgData.wa_waba_id || 'waba-connected-id',
              wa_connected: orgData.wa_connected !== false,
              updated_at: orgData.updated_at,
            },
          });
        }
      }

      return res.status(200).json({
        success: true,
        organization: {
          id: organizationId || 'demo-org',
          name: 'Tu Inmobiliaria',
          wa_phone_number_id: defaultPhone,
          wa_waba_id: 'waba-connected-id',
          wa_connected: true,
          updated_at: new Date().toISOString(),
        },
      });
    }

    if (req.method === 'POST') {
      const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) || {};
      const action = body.action || 'connect';
      const targetOrgId = body.organizationId || organizationId;

      if (action === 'disconnect') {
        if (targetOrgId) {
          try {
            await supabase
              .from('organizations')
              .update({
                wa_connected: false,
                wa_access_token: null,
                updated_at: new Date().toISOString(),
              })
              .eq('id', targetOrgId);
          } catch {}
        }

        return res.status(200).json({
          success: true,
          message: 'WhatsApp Business account disconnected.',
          wa_connected: false,
        });
      }

      const code = body.code;
      let wabaId = body.wabaId || body.waba_id || process.env.META_WABA_ID || '1056979960613159';
      let phoneNumberId = body.phoneNumberId || body.phone_number_id || process.env.WHATSAPP_PHONE_ID || process.env.META_PHONE_NUMBER_ID || '5491140143729';
      let accessToken = process.env.META_SYSTEM_USER_TOKEN || process.env.WHATSAPP_TOKEN || '';

      const appId = (process.env.META_APP_ID || process.env.VITE_META_APP_ID || '891096146948509').trim();
      const appSecret = (process.env.META_APP_SECRET || process.env.WHATSAPP_APP_SECRET || 'cb334e158d0866dcaf9b0224cedb0493').trim();

      if (code && appId && appSecret) {
        try {
          const tokenUrl = `https://graph.facebook.com/v20.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${code}`;
          const metaRes = await fetch(tokenUrl);
          const metaData = await metaRes.json();
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

      if (targetOrgId) {
        try {
          await supabase
            .from('organizations')
            .update({
              wa_phone_number_id: phoneNumberId,
              wa_waba_id: wabaId,
              ...(accessToken ? { wa_access_token: accessToken } : {}),
              wa_connected: true,
              updated_at: new Date().toISOString(),
            })
            .eq('id', targetOrgId);
        } catch (dbErr) {
          console.warn('⚠️ Supabase organization update warning:', dbErr);
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Cuenta de WhatsApp Business vinculada exitosamente',
        organization: {
          id: targetOrgId || 'org-connected',
          name: 'Tu Inmobiliaria',
          wa_phone_number_id: phoneNumberId,
          wa_waba_id: wabaId,
          wa_connected: true,
          updated_at: new Date().toISOString(),
        },
      });
    }
  }

  return res.status(404).json({ error: `Sub-route '${subRoute}' not found` });
}

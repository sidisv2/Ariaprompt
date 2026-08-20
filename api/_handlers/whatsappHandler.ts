import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { processAriaMessage } from '../_ariaEngine.js';
import { sendWhatsAppTextMessage } from '../_lib/whatsappClient.js';
import { sendHandoverEmailNotification } from '../../lib/notifications/email.js';
import { sendTelegramLeadAlert } from '../../lib/notifications/telegram.js';
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
      const mode = Array.isArray(req.query['hub.mode']) ? req.query['hub.mode'][0] : req.query['hub.mode'];
      const token = Array.isArray(req.query['hub.verify_token']) ? req.query['hub.verify_token'][0] : req.query['hub.verify_token'];
      const challenge = Array.isArray(req.query['hub.challenge']) ? req.query['hub.challenge'][0] : req.query['hub.challenge'];

      const rawEnvToken = process.env.META_VERIFY_TOKEN || process.env.WEBHOOK_VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN || 'aria_prop_whatsapp_webhook_secret_verify_token_2026';
      const expectedVerifyToken = rawEnvToken.replace(/^["']|["']$/g, '').trim();

      const isValidToken = Boolean(token && expectedVerifyToken && token === expectedVerifyToken);

      if (mode === 'subscribe' && isValidToken) {
        console.log('✅ Meta Webhook Verification Handshake Successful!');
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.status(200).send(challenge || '');
      } else {
        console.warn('❌ Meta Webhook Verification Failed: Token Mismatch.');
        return res.status(403).json({
          error: 'Webhook verification failed',
          message: 'hub.verify_token does not match META_VERIFY_TOKEN',
        });
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

        let conversationStatus = 'active';
        let existingConvId: string | null = null;

        if (supabase) {
          const { data: conv } = await supabase
            .from('wa_conversations')
            .select('id, status')
            .eq('organization_id', organizationId)
            .eq('user_phone', fromNumber)
            .single();

          if (conv) {
            existingConvId = conv.id;
            conversationStatus = conv.status || 'active';
          }
        }

        const cleanLowerMsg = textBody.toLowerCase().trim();
        const isReactivationKeyword =
          cleanLowerMsg === 'activar bot' ||
          cleanLowerMsg === 'reiniciar ia' ||
          cleanLowerMsg === 'hablar con bot' ||
          cleanLowerMsg === 'reiniciar bot';

        if (isReactivationKeyword && supabase && existingConvId) {
          conversationStatus = 'active';
          await supabase
            .from('wa_conversations')
            .update({ status: 'active', updated_at: new Date().toISOString() })
            .eq('id', existingConvId);
        }

        if ((conversationStatus === 'handover' || conversationStatus === 'closed') && !isReactivationKeyword) {
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

          // Asynchronously trigger email & Telegram notifications without delaying Meta's 200 OK response
          sendHandoverEmailNotification({
            organizationId,
            userPhone: fromNumber,
            lastMessage: textBody,
            conversationId: existingConvId,
            supabaseClient: supabase,
          }).catch((err) => console.warn('⚠️ Handover email trigger warning:', err));

          sendTelegramLeadAlert({
            orgId: organizationId,
            phone: fromNumber,
            lastMessage: textBody,
            reason: 'handover',
            supabaseClient: supabase,
          }).catch((err) => console.warn('⚠️ Handover Telegram trigger warning:', err));

          return res.status(200).json({
            status: 'HANDOVER_HUMAN_ACTIVE',
            conversationStatus,
            message: 'User message logged, AI auto-reply bypassed.',
          });
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
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase service is not configured' });
    }

    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    let organizationId: string | null = (req.query.organization_id as string) || null;

    if (token) {
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
    }

    if (req.method === 'GET') {
      if (!organizationId) {
        return res.status(400).json({ success: false, error: 'Missing organizationId' });
      }

      const { data: orgData, error } = await supabase
        .from('organizations')
        .select('id, name, wa_phone_number_id, wa_waba_id, wa_connected, updated_at')
        .eq('id', organizationId)
        .single();

      if (error || !orgData) {
        return res.status(404).json({ success: false, error: 'Organization not found' });
      }

      return res.status(200).json({
        success: true,
        organization: {
          id: orgData.id,
          name: orgData.name,
          wa_phone_number_id: orgData.wa_phone_number_id,
          wa_waba_id: orgData.wa_waba_id,
          wa_connected: Boolean(orgData.wa_connected),
          updated_at: orgData.updated_at,
        },
      });
    }

    if (req.method === 'POST') {
      const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) || {};
      const action = body.action || 'connect';
      const targetOrgId = body.organizationId || organizationId;

      if (!targetOrgId) {
        return res.status(400).json({ success: false, error: 'Missing target organizationId' });
      }

      if (action === 'disconnect') {
        await supabase
          .from('organizations')
          .update({
            wa_connected: false,
            wa_access_token: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', targetOrgId);

        return res.status(200).json({
          success: true,
          message: 'WhatsApp Business account disconnected.',
          wa_connected: false,
        });
      }

      const code = body.code;
      let wabaId = body.wabaId || process.env.META_WABA_ID || 'waba-embedded-signup';
      let phoneNumberId = body.phoneNumberId || process.env.META_PHONE_NUMBER_ID || '1029384756';
      let accessToken = process.env.META_SYSTEM_USER_TOKEN || '';

      const appId = (process.env.META_APP_ID || process.env.VITE_META_APP_ID || '').trim();
      const appSecret = (process.env.META_APP_SECRET || '').trim();

      if (code && appId && appSecret) {
        try {
          const tokenUrl = `https://graph.facebook.com/v20.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${code}`;
          const metaRes = await fetch(tokenUrl);
          const metaData = await metaRes.json();
          if (metaData.access_token) {
            accessToken = metaData.access_token;
          }
        } catch (err) {
          console.warn('⚠️ Token exchange warning:', err);
        }
      }

      const { data: updatedOrg, error: updateErr } = await supabase
        .from('organizations')
        .update({
          wa_phone_number_id: phoneNumberId,
          wa_waba_id: wabaId,
          ...(accessToken ? { wa_access_token: accessToken } : {}),
          wa_connected: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetOrgId)
        .select('*')
        .single();

      if (updateErr) {
        return res.status(500).json({ success: false, error: updateErr.message });
      }

      return res.status(200).json({
        success: true,
        message: 'WhatsApp Embedded Signup completed.',
        organization: {
          id: updatedOrg.id,
          wa_phone_number_id: updatedOrg.wa_phone_number_id,
          wa_waba_id: updatedOrg.wa_waba_id,
          wa_connected: Boolean(updatedOrg.wa_connected),
          updated_at: updatedOrg.updated_at,
        },
      });
    }
  }

  return res.status(404).json({ error: `Sub-route '${subRoute}' not found` });
}

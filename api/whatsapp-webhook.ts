import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { processAriaMessage } from './_ariaEngine.js';

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

export interface SendWhatsAppTextMessageOptions {
  to: string;
  text: string;
  phoneNumberId?: string;
  accessToken?: string;
}

/**
 * Send text message using Meta WhatsApp Cloud API Graph v20.0
 */
export async function sendWhatsAppTextMessage(options: SendWhatsAppTextMessageOptions): Promise<{
  success: boolean;
  data?: any;
  error?: any;
}> {
  const { to, text, phoneNumberId: overridePhoneId, accessToken: overrideToken } = options;

  const phoneId = (
    overridePhoneId ||
    process.env.META_PHONE_NUMBER_ID ||
    process.env.WHATSAPP_PHONE_NUMBER_ID ||
    ''
  ).replace(/^["']|["']$/g, '').trim();

  const token = (
    overrideToken ||
    process.env.META_SYSTEM_USER_TOKEN ||
    process.env.WHATSAPP_TOKEN ||
    process.env.META_WA_TOKEN ||
    ''
  ).replace(/^["']|["']$/g, '').trim();

  if (!phoneId) {
    console.error('❌ Cannot send WhatsApp message: Missing Phone Number ID.');
    return { success: false, error: 'Missing Meta Phone Number ID' };
  }

  if (!token) {
    console.error('❌ Cannot send WhatsApp message: Missing Meta System User Access Token.');
    return { success: false, error: 'Missing Meta Access Token' };
  }

  const endpoint = `https://graph.facebook.com/v20.0/${phoneId}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: {
      preview_url: true,
      body: text,
    },
  };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error(`❌ Meta WhatsApp Cloud API HTTP ${res.status} Error:`, JSON.stringify(data));
      return { success: false, data, error: data.error?.message || `HTTP ${res.status}` };
    }

    console.log(`✅ WhatsApp Message successfully sent to ${to} (wamid: ${data.messages?.[0]?.id || 'N/A'})`);
    return { success: true, data };
  } catch (err: any) {
    console.error('❌ Exception sending Meta WhatsApp Cloud API request:', err);
    return { success: false, error: err.message || String(err) };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. GET Handler: Meta Webhook Verification Handshake
  if (req.method === 'GET') {
    const mode = Array.isArray(req.query['hub.mode']) ? req.query['hub.mode'][0] : req.query['hub.mode'];
    const token = Array.isArray(req.query['hub.verify_token']) ? req.query['hub.verify_token'][0] : req.query['hub.verify_token'];
    const challenge = Array.isArray(req.query['hub.challenge']) ? req.query['hub.challenge'][0] : req.query['hub.challenge'];

    const rawEnvToken = process.env.META_VERIFY_TOKEN || process.env.WEBHOOK_VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN || '';
    const expectedVerifyToken = rawEnvToken.replace(/^["']|["']$/g, '').trim();

    const isValidToken = Boolean(
      token &&
      expectedVerifyToken &&
      token === expectedVerifyToken
    );

    if (mode === 'subscribe' && isValidToken) {
      console.log('✅ Meta Webhook Verification Successful! Returning hub.challenge.');
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.status(200).send(challenge || '');
    } else {
      console.warn(`❌ Meta Webhook Verification Failed. Token mismatch.`);
      return res.status(403).json({
        error: 'Webhook verification failed',
        message: 'hub.verify_token does not match META_VERIFY_TOKEN environment variable.',
      });
    }
  }

  // 2. POST Handler: Incoming Meta WhatsApp Cloud API Webhook Event
  if (req.method === 'POST') {
    console.log("🔥 WEBHOOK POST RECEIVED AT:", new Date().toISOString());

    const rawBodyString = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
    const supabase = getBackendSupabaseClient();

    // Log raw incoming payload to webhook_debug_log for auditing
    if (supabase) {
      try {
        await supabase.from('webhook_debug_log').insert({
          received_at: new Date().toISOString(),
          raw_body: rawBodyString,
        });
      } catch {}
    }

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

      // Status updates or read receipts are acknowledged with HTTP 200 immediately
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(200).json({ status: 'STATUS_UPDATE_ACKNOWLEDGED' });
      }

      const incomingMsg = messages[0];
      const fromNumber = incomingMsg.from;
      const msgType = incomingMsg.type;
      const wamid = incomingMsg.id;
      const phoneNumberId = metadata?.phone_number_id;

      let textBody = '';
      if (msgType === 'text' && incomingMsg.text?.body) {
        textBody = incomingMsg.text.body;
      } else if (msgType === 'button' && incomingMsg.button?.text) {
        textBody = incomingMsg.button.text;
      } else if (incomingMsg.interactive?.button_reply?.title) {
        textBody = incomingMsg.interactive.button_reply.title;
      } else {
        textBody = 'Hola';
      }

      console.log(`📩 Incoming WhatsApp Message from ${fromNumber} (PhoneId: ${phoneNumberId}): "${textBody}"`);

      // Multi-Tenant Lookup: Identify organization in Supabase via wa_phone_number_id
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

      // Check existing conversation status in Supabase for handover or closed states
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

      // Handover / Paused Mode Check: If status is 'handover' or 'closed', log incoming message without bot auto-response
      if ((conversationStatus === 'handover' || conversationStatus === 'closed') && !isReactivationKeyword) {
        console.log(`👤 Handover/Closed Active for ${fromNumber} (Status: ${conversationStatus}). Skipping AI automated reply.`);

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

        return res.status(200).json({
          status: 'HANDOVER_HUMAN_ACTIVE',
          conversationStatus,
          message: 'User message logged, AI auto-reply bypassed for human agent handover.',
        });
      }

      // Process message using AI Engine (RAG property context + OpenRouter LLM)
      const { text: aiResponseText, conversationId } = await processAriaMessage({
        organizationId,
        userPhone: fromNumber,
        userMessage: textBody,
        wamid,
      });

      console.log(`🤖 Generated Aria AI Response: "${aiResponseText}"`);

      // Send response back to user via Meta Cloud API
      const sendResult = await sendWhatsAppTextMessage({
        to: fromNumber,
        text: aiResponseText,
        phoneNumberId,
        accessToken: tenantAccessToken,
      });

      // Always return HTTP 200 to Meta to avoid retry loops
      return res.status(200).json({
        status: 'EVENT_PROCESSED',
        from: fromNumber,
        organizationId,
        conversationId,
        receivedText: textBody,
        aiResponse: aiResponseText,
        sent: sendResult.success,
        metaResult: sendResult.data || sendResult.error,
      });
    } catch (err: any) {
      console.error('❌ Error processing WhatsApp webhook POST payload:', err);
      // Always return 200 to Meta even on internal error to acknowledge receipt
      return res.status(200).json({ status: 'ERROR_HANDLED', message: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

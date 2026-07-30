import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateAriaAiResponse } from './_ariaEngine';

export async function sendWhatsAppTextMessage({
  to,
  text,
  phoneNumberId,
}: {
  to: string;
  text: string;
  phoneNumberId?: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  const token = (process.env.WHATSAPP_ACCESS_TOKEN || '').trim();
  const phoneId = (phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || '').trim();

  if (!token || !phoneId) {
    console.warn('⚠️ Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID environment variables.');
    return {
      success: false,
      error: 'WhatsApp Cloud API credentials not configured in environment variables.',
    };
  }

  const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to.replace(/[^0-9]/g, ''),
        type: 'text',
        text: {
          preview_url: false,
          body: text,
        },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('❌ Meta Graph API Send Error:', data);
      return { success: false, error: data?.error?.message || 'Meta Graph API Error', data };
    }

    console.log('✅ Meta WhatsApp Message Sent Successfully:', data);
    return { success: true, data };
  } catch (err: any) {
    console.error('❌ Network error sending WhatsApp message:', err.message);
    return { success: false, error: err.message };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. GET Handler: Meta Webhook Initial Verification Challenge
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const expectedVerifyToken = (
      process.env.WEBHOOK_VERIFY_TOKEN ||
      process.env.WHATSAPP_VERIFY_TOKEN ||
      ''
    ).trim();

    if (!expectedVerifyToken) {
      console.warn('⚠️ WEBHOOK_VERIFY_TOKEN environment variable is not configured.');
      return res.status(500).json({
        error: 'Configuration Error',
        message: 'WEBHOOK_VERIFY_TOKEN environment variable is missing on server.',
      });
    }

    if (mode === 'subscribe' && token && token === expectedVerifyToken) {
      console.log('✅ Meta Webhook Verification Successful! Returning hub.challenge.');
      return res.status(200).send(challenge);
    } else {
      console.warn('❌ Meta Webhook Verification Failed. Token mismatch or missing mode.');
      return res.status(403).json({
        error: 'Webhook verification failed',
        message: 'hub.verify_token does not match WEBHOOK_VERIFY_TOKEN environment variable.',
      });
    }
  }

  // 2. POST Handler: Receive Incoming Webhook Event from Meta
  if (req.method === 'POST') {
    try {
      let body = req.body || {};
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }

      // Check if event is from WhatsApp Business Account
      if (body.object !== 'whatsapp_business_account') {
        return res.status(200).json({ status: 'IGNORED_NON_WHATSAPP_EVENT' });
      }

      const entry = body.entry?.[0];
      const change = entry?.changes?.[0]?.value;
      const metadata = change?.metadata;
      const messages = change?.messages;

      // Status updates or empty messages array
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(200).json({ status: 'STATUS_UPDATE_ACKNOWLEDGED' });
      }

      const incomingMsg = messages[0];
      const fromNumber = incomingMsg.from; // Sender's WhatsApp ID e.g. "5491122334455"
      const msgType = incomingMsg.type;
      const phoneNumberId = metadata?.phone_number_id;

      // Extract message text content
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

      console.log(`📩 Incoming WhatsApp Message from ${fromNumber}: "${textBody}"`);

      // Generate AI response using shared RAG engine
      const aiResponse = await generateAriaAiResponse({
        message: textBody,
        history: [],
        lang: 'es',
      });

      console.log(`🤖 Generated Aria AI Response: "${aiResponse}"`);

      // Send response back to user via Meta Graph API
      const sendResult = await sendWhatsAppTextMessage({
        to: fromNumber,
        text: aiResponse,
        phoneNumberId,
      });

      return res.status(200).json({
        status: 'EVENT_PROCESSED',
        from: fromNumber,
        receivedText: textBody,
        aiResponse,
        sent: sendResult.success,
        metaResult: sendResult.data || sendResult.error,
      });
    } catch (err: any) {
      console.error('❌ Error processing WhatsApp webhook POST payload:', err);
      // Meta requires 200 OK to prevent continuous retry loops on error
      return res.status(200).json({ status: 'ERROR_HANDLED', message: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

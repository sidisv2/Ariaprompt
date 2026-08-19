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

import { createClient } from '@supabase/supabase-js';

export interface SendTemplateParams {
  orgId: string;
  phone: string;
  templateName: string;
  languageCode?: string;
  components?: any[];
  supabaseClient?: any;
}

export interface SendTemplateResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Dispatch Meta WhatsApp Cloud API HSM Template Message
 */
export async function sendTemplateMessage({
  orgId,
  phone,
  templateName,
  languageCode = 'es',
  components = [],
  supabaseClient,
}: SendTemplateParams): Promise<SendTemplateResult> {
  const cleanPhone = phone.replace(/\D/g, '');
  if (!cleanPhone) {
    return { success: false, error: 'Número de teléfono inválido.' };
  }

  let accessToken = process.env.WHATSAPP_TOKEN || process.env.META_ACCESS_TOKEN || '';
  let phoneNumberId = process.env.WHATSAPP_PHONE_ID || process.env.META_PHONE_NUMBER_ID || '';

  // 1. Fetch organization Meta credentials if Supabase client provided
  if (supabaseClient && orgId) {
    try {
      const { data: orgData } = await supabaseClient
        .from('organizations')
        .select('wa_access_token, wa_phone_number_id')
        .eq('id', orgId)
        .single();

      if (orgData?.wa_access_token) accessToken = orgData.wa_access_token;
      if (orgData?.wa_phone_number_id) phoneNumberId = orgData.wa_phone_number_id;
    } catch (err) {
      console.warn('⚠️ Could not fetch organization Meta credentials from DB:', err);
    }
  }

  if (!accessToken || !phoneNumberId) {
    console.warn(`⚠️ Template dispatch skipped for Org ${orgId}: Missing Meta Access Token or Phone ID.`);
    return {
      success: false,
      error: 'Organización sin credenciales oficiales de WhatsApp Meta Cloud API configuradas.',
    };
  }

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: cleanPhone,
    type: 'template',
    template: {
      name: templateName,
      language: {
        code: languageCode,
      },
      ...(components.length > 0 ? { components } : {}),
    },
  };

  try {
    const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const resData: any = await response.json();

    if (response.ok && resData.messages?.[0]?.id) {
      const messageId = resData.messages[0].id;
      console.log(`✅ HSM Template '${templateName}' sent to +${cleanPhone} (wamid: ${messageId})`);
      return { success: true, messageId };
    } else {
      const errorMsg = resData.error?.message || `Meta API Error ${response.status}`;
      console.error(`❌ Meta Graph API Template Error [${response.status}]:`, resData.error || resData);
      return { success: false, error: errorMsg };
    }
  } catch (err: any) {
    console.error('❌ Exception dispatching HSM Template:', err);
    return { success: false, error: err.message || String(err) };
  }
}

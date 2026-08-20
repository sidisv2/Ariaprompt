import { sendWhatsAppTextMessage } from '../../api/_lib/whatsappClient';

export interface AdvisorAlertParams {
  orgId: string;
  leadPhone: string;
  leadName?: string | null;
  reason: 'handover' | 'qualified';
  lastMessage?: string | null;
  supabaseClient?: any;
}

/**
 * Sends an internal WhatsApp text alert to the agency's advisor phone number (advisor_alert_phone)
 */
export async function sendAdvisorWhatsAppAlert({
  orgId,
  leadPhone,
  leadName,
  reason,
  lastMessage,
  supabaseClient,
}: AdvisorAlertParams): Promise<{ success: boolean; error?: string }> {
  const cleanLeadPhone = leadPhone.replace(/\D/g, '');
  if (!cleanLeadPhone || !supabaseClient || !orgId) {
    return { success: false, error: 'Parámetros insuficientes.' };
  }

  try {
    const { data: orgData } = await supabaseClient
      .from('organizations')
      .select('advisor_alert_phone, wa_access_token, wa_phone_number_id')
      .eq('id', orgId)
      .single();

    if (!orgData?.advisor_alert_phone) {
      return { success: false, error: 'Organización sin teléfono de alerta de asesor configurado.' };
    }

    const cleanAdvisorPhone = orgData.advisor_alert_phone.replace(/\D/g, '');
    if (!cleanAdvisorPhone) {
      return { success: false, error: 'Teléfono de asesor inválido.' };
    }

    const isHandover = reason === 'handover';
    const nameStr = leadName || `Lead +${cleanLeadPhone}`;
    const msgStr = lastMessage ? `"${lastMessage}"` : 'Sin mensaje';

    const alertBody = isHandover
      ? `🚨 ALERTA ARIAPROP - ASESOR SOLICITADO\n\nEl prospecto ${nameStr} (+${cleanLeadPhone}) solicitó atención humana.\nÚltimo mensaje: ${msgStr}\n\nAbrir en CRM: https://ariaprop.online/dashboard/leads`
      : `⭐ ALERTA ARIAPROP - NUEVO LEAD CUALIFICADO\n\nSe ha cualificado al prospecto ${nameStr} (+${cleanLeadPhone}).\nÚltimo mensaje: ${msgStr}\n\nAbrir en CRM: https://ariaprop.online/dashboard/leads`;

    const token = orgData.wa_access_token || process.env.WHATSAPP_TOKEN || process.env.META_ACCESS_TOKEN || '';
    const phoneId = orgData.wa_phone_number_id || process.env.WHATSAPP_PHONE_ID || process.env.META_PHONE_NUMBER_ID || '';

    if (token && phoneId) {
      const res = await sendWhatsAppTextMessage({
        to: cleanAdvisorPhone,
        text: alertBody,
        accessToken: token,
        phoneNumberId: phoneId,
      });
      if (res.success) {
        console.log(`✅ Advisor WhatsApp alert sent to +${cleanAdvisorPhone}`);
        return { success: true };
      }
    }
  } catch (err: any) {
    console.warn('⚠️ Exception sending advisor WhatsApp alert:', err);
  }

  return { success: false, error: 'No se pudo despachar la alerta al asesor.' };
}

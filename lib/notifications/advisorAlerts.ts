import { sendWhatsAppTextMessage } from '../../api/_lib/whatsappClient.js';

export interface AdvisorAlertParams {
  orgId?: string;
  userId?: string;
  leadPhone: string;
  leadName?: string | null;
  reason?: 'handover' | 'qualified' | 'visit_request' | string;
  propertyTitle?: string | null;
  propertyCode?: string | null;
  budget?: string | number | null;
  requestedDate?: string | null;
  lastMessage?: string | null;
  conversationId?: string | null;
  leadId?: string | null;
  supabaseClient?: any;
}

/**
 * Sends an executive WhatsApp alert to the real estate agency's advisor phone
 */
export async function sendAdvisorWhatsAppAlert({
  orgId,
  userId,
  leadPhone,
  leadName,
  reason = 'qualified',
  propertyTitle,
  propertyCode,
  budget,
  requestedDate,
  lastMessage,
  conversationId,
  leadId,
  supabaseClient,
}: AdvisorAlertParams): Promise<{ success: boolean; error?: string }> {
  const cleanLeadPhone = leadPhone.replace(/\D/g, '');
  if (!cleanLeadPhone) {
    return { success: false, error: 'Número de teléfono del lead inválido.' };
  }

  let advisorPhone = '5491140143729'; // Fallback support phone
  let token = process.env.WHATSAPP_TOKEN || process.env.META_ACCESS_TOKEN || '';
  let phoneId = process.env.WHATSAPP_PHONE_ID || process.env.META_PHONE_NUMBER_ID || '';

  if (supabaseClient) {
    try {
      if (orgId) {
        const { data: orgData } = await supabaseClient
          .from('organizations')
          .select('advisor_alert_phone, wa_access_token, wa_phone_number_id')
          .eq('id', orgId)
          .maybeSingle();

        if (orgData?.advisor_alert_phone) {
          advisorPhone = orgData.advisor_alert_phone;
        }
        if (orgData?.wa_access_token) token = orgData.wa_access_token;
        if (orgData?.wa_phone_number_id) phoneId = orgData.wa_phone_number_id;
      }

      if ((advisorPhone === '5491140143729' || !orgId) && userId) {
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('advisor_alert_phone, notification_phone, phone')
          .eq('id', userId)
          .maybeSingle();

        if (profile) {
          advisorPhone =
            profile.advisor_alert_phone ||
            profile.notification_phone ||
            profile.phone ||
            advisorPhone;
        }
      }
    } catch (dbErr) {
      console.warn('⚠️ Exception querying advisor phone from DB:', dbErr);
    }
  }

  const cleanAdvisorPhone = advisorPhone.replace(/\D/g, '') || '5491140143729';
  const nameStr = leadName || `Prospecto +${cleanLeadPhone}`;
  const msgStr = lastMessage ? lastMessage.trim() : 'Sin mensaje reciente';
  const propStr = propertyTitle ? propertyTitle : 'Consulta General de Inmuebles';
  const codeStr = propertyCode ? propertyCode : 'N/A';
  const budgetStr = budget ? `$${budget}` : 'A convenir';
  const dateStr = requestedDate ? requestedDate : 'A coordinar';

  const alertBody = `🚨 ¡NUEVO LEAD CALIFICADO EN ARIA PROP! 🚨

👤 Nombre / Contacto: ${nameStr}
📱 Teléfono: +${cleanLeadPhone}
🏠 Propiedad de Interés: ${propStr} (Ref: ${codeStr})
💰 Presupuesto / Condición: ${budgetStr}
📅 Visita Solicitada: ${dateStr}
💬 Último mensaje: "${msgStr}"

👉 Ver conversación completa en tu panel: https://ariaprop.online/dashboard/leads`;

  try {
    if (token && phoneId) {
      const res = await sendWhatsAppTextMessage({
        to: cleanAdvisorPhone,
        text: alertBody,
        accessToken: token,
        phoneNumberId: phoneId,
      });

      if (res.success) {
        console.log(`✅ Executive WhatsApp Advisor Alert dispatched to +${cleanAdvisorPhone}`);

        // Register advisor_notified_at in DB
        if (supabaseClient) {
          const nowStr = new Date().toISOString();
          if (conversationId) {
            await supabaseClient
              .from('wa_conversations')
              .update({ advisor_notified_at: nowStr })
              .eq('id', conversationId);
          }
          if (leadId) {
            await supabaseClient
              .from('leads')
              .update({ advisor_notified_at: nowStr })
              .eq('id', leadId);
          }
        }

        return { success: true };
      }
    } else {
      console.log(`ℹ️ [SIMULATED ADVISOR ALERT] To: +${cleanAdvisorPhone}\n${alertBody}`);
    }
  } catch (err: any) {
    console.warn('⚠️ Exception dispatching advisor WhatsApp alert:', err);
  }

  return { success: false, error: 'No se pudo despachar la alerta al asesor.' };
}

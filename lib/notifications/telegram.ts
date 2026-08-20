import { sendAdvisorWhatsAppAlert } from './advisorAlerts';

/**
 * Deprecated Telegram Alert fallback -> redirects to Advisor WhatsApp Text Alert
 */
export async function sendTelegramLeadAlert(params: any) {
  return sendAdvisorWhatsAppAlert({
    orgId: params.orgId,
    leadPhone: params.phone,
    leadName: params.leadName,
    reason: params.reason,
    lastMessage: params.lastMessage,
    supabaseClient: params.supabaseClient,
  });
}

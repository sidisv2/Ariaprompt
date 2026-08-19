import { sendWhatsAppTextMessage } from '../whatsapp-webhook.js';

export interface NotifyQualifiedLeadOptions {
  organizationId: string;
  userPhone: string;
  userName?: string | null;
  budgetMaxUsd?: number | null;
  preferredZone?: string | null;
  propertyType?: string | null;
  conversationId: string;
  supabaseClient?: any;
}

/**
 * Dispatch automatic internal WhatsApp alert to agent when a lead is qualified
 */
export async function notifyAgentLeadQualified({
  organizationId,
  userPhone,
  userName,
  budgetMaxUsd,
  preferredZone,
  propertyType,
  conversationId,
  supabaseClient,
}: NotifyQualifiedLeadOptions): Promise<{ success: boolean; error?: string }> {
  if (!supabaseClient) {
    return { success: false, error: 'No Supabase client provided' };
  }

  try {
    // 1. Fetch organization alert phone or owner phone
    const { data: orgData } = await supabaseClient
      .from('organizations')
      .select('name, wa_phone_number_id, wa_access_token, alert_phone, owner_phone')
      .eq('id', organizationId)
      .single();

    let targetAgentPhone =
      orgData?.alert_phone ||
      orgData?.owner_phone ||
      process.env.AGENT_ALERT_PHONE ||
      '';

    if (!targetAgentPhone) {
      // Fallback: try fetching profile phone for this org
      const { data: profileData } = await supabaseClient
        .from('profiles')
        .select('phone')
        .eq('organization_id', organizationId)
        .not('phone', 'is', null)
        .limit(1)
        .single();

      if (profileData?.phone) {
        targetAgentPhone = profileData.phone;
      }
    }

    if (!targetAgentPhone) {
      console.log(`ℹ️ Qualified Lead notification skipped for Org ${organizationId}: No agent phone registered.`);
      return { success: false, error: 'No agent phone registered' };
    }

    const cleanAgentPhone = targetAgentPhone.replace(/\D/g, '');
    const budgetStr = budgetMaxUsd ? `$${Number(budgetMaxUsd).toLocaleString('en-US')} USD` : 'No especificado';
    const nameStr = userName || `Lead ${userPhone}`;
    const crmUrl = `https://ariaprop.online/dashboard/leads?id=${conversationId}`;

    const notificationText = `🔥 ¡NUEVO LEAD CALIFICADO EN ARIA PROP!

👤 Prospecto: ${nameStr}
📱 WhatsApp: ${userPhone}
💰 Presupuesto: ${budgetStr}
📍 Zona de Interés: ${preferredZone || 'No especificada'}
🏠 Inmueble / Operación: ${propertyType || 'Inmueble general'}

🔗 Ver conversación y gestionar en el CRM:
${crmUrl}`;

    console.log(`📲 Sending Qualified Lead Alert to Agent (${cleanAgentPhone})...`);

    const result = await sendWhatsAppTextMessage({
      to: cleanAgentPhone,
      text: notificationText,
      phoneNumberId: orgData?.wa_phone_number_id,
      accessToken: orgData?.wa_access_token,
    });

    return { success: result.success, error: result.error };
  } catch (err: any) {
    console.error('❌ Error sending qualified lead notification:', err);
    return { success: false, error: err.message || String(err) };
  }
}

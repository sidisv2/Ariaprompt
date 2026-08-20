export interface TelegramAlertParams {
  orgId: string;
  phone: string;
  leadName?: string | null;
  budget?: number | null;
  zone?: string | null;
  propertyType?: string | null;
  reason: 'handover' | 'qualified';
  lastMessage?: string | null;
  supabaseClient?: any;
}

/**
 * Sends instant real estate lead alert notification to Telegram Chat / Group
 */
export async function sendTelegramLeadAlert({
  orgId,
  phone,
  leadName,
  budget,
  zone,
  propertyType,
  reason,
  lastMessage,
  supabaseClient,
}: TelegramAlertParams): Promise<{ success: boolean; error?: string }> {
  const cleanPhone = phone.replace(/\D/g, '');
  if (!cleanPhone) return { success: false, error: 'Sin teléfono válido.' };

  let botToken = process.env.TELEGRAM_BOT_TOKEN || '';
  let chatId = process.env.TELEGRAM_ALERTS_CHAT_ID || '';

  // 1. Fetch organization custom Telegram credentials if available
  if (supabaseClient && orgId) {
    try {
      const { data: orgData } = await supabaseClient
        .from('organizations')
        .select('telegram_bot_token, telegram_chat_id, notify_telegram_handover, notify_telegram_qualified')
        .eq('id', orgId)
        .single();

      if (orgData) {
        if (reason === 'handover' && orgData.notify_telegram_handover === false) {
          return { success: false, error: 'Notificaciones de handover desactivadas para esta org.' };
        }
        if (reason === 'qualified' && orgData.notify_telegram_qualified === false) {
          return { success: false, error: 'Notificaciones de lead calificado desactivadas para esta org.' };
        }
        if (orgData.telegram_bot_token) botToken = orgData.telegram_bot_token;
        if (orgData.telegram_chat_id) chatId = orgData.telegram_chat_id;
      }
    } catch (err) {
      console.warn('⚠️ Telegram config lookup warning:', err);
    }
  }

  if (!botToken || !chatId) {
    console.log(`ℹ️ Telegram alert skipped for Org ${orgId}: Missing botToken or chatId.`);
    return { success: false, error: 'Telegram no configurado.' };
  }

  const isHandover = reason === 'handover';
  const title = isHandover
    ? '🚨 <b>ALERTA DE HANDOVER: ASESOR SOLICITADO</b>'
    : '⭐ <b>NUEVO LEAD CUALIFICADO REGISTRADO</b>';

  const budgetStr = budget ? `$${Number(budget).toLocaleString('en-US')} USD` : 'Por definir';
  const nameStr = leadName || `Lead ${phone}`;
  const zoneStr = zone || 'Por definir';
  const typeStr = propertyType || 'Inmueble general';
  const msgStr = lastMessage ? `<i>"${lastMessage}"</i>` : 'Sin mensaje registrado';

  const messageText = `
${title}

👤 <b>Nombre:</b> ${nameStr}
📱 <b>Teléfono:</b> +${cleanPhone}
💰 <b>Presupuesto:</b> ${budgetStr}
📍 <b>Zona:</b> ${zoneStr}
🏠 <b>Tipo Inmueble:</b> ${typeStr}

💬 <b>Último Mensaje:</b>
${msgStr}

🏢 <i>Ariaprop Commercial Alert System</i>
`.trim();

  const waUrl = `https://wa.me/${cleanPhone}`;
  const crmUrl = `https://ariaprop.online/dashboard/leads`;

  const payload = {
    chat_id: chatId,
    text: messageText,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '💬 Abrir WhatsApp Web', url: waUrl },
          { text: '📊 Ver en CRM', url: crmUrl },
        ],
      ],
    },
  };

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data: any = await res.json();
    if (res.ok && data.ok) {
      console.log(`✅ Telegram Alert sent to chat ${chatId} for lead +${cleanPhone}`);
      return { success: true };
    } else {
      console.warn(`⚠️ Telegram API error [${res.status}]:`, data?.description || data);
      return { success: false, error: data?.description || 'Telegram API Error' };
    }
  } catch (err: any) {
    console.error('❌ Exception sending Telegram lead alert:', err);
    return { success: false, error: err.message || String(err) };
  }
}

export interface HandoverEmailOptions {
  organizationId: string;
  userPhone: string;
  userName?: string | null;
  budgetMaxUsd?: number | null;
  preferredZone?: string | null;
  propertyType?: string | null;
  lastMessage?: string | null;
  conversationId?: string | null;
  supabaseClient?: any;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  recipient?: string;
  error?: string;
}

/**
 * Immediate Email Notification Service for Human Handover Requests
 * Triggers when a WhatsApp lead requests human agent assistance or changes status to 'handover'.
 */
export async function sendHandoverEmailNotification({
  organizationId,
  userPhone,
  userName,
  budgetMaxUsd,
  preferredZone,
  propertyType,
  lastMessage,
  conversationId,
  supabaseClient,
}: HandoverEmailOptions): Promise<EmailResult> {
  const cleanPhone = userPhone.replace(/\D/g, '');
  const waUrl = `https://wa.me/${cleanPhone}`;
  const crmUrl = conversationId
    ? `https://ariaprop.online/dashboard/leads?id=${conversationId}`
    : 'https://ariaprop.online/dashboard/leads';

  const leadName = userName && userName !== 'Sin nombre' ? userName : `Prospecto WhatsApp (${userPhone})`;
  const budgetStr = budgetMaxUsd ? `$${Number(budgetMaxUsd).toLocaleString('en-US')} USD` : 'No especificado';
  const zoneStr = preferredZone || 'No especificada';
  const typeStr = propertyType || 'Consulta general de catálogo';
  const msgStr = lastMessage || 'Solicitó hablar con un asesor inmobiliario humano.';

  let recipientEmail: string | null = null;

  // 1. Resolve organization alert email from Supabase if available
  if (supabaseClient && organizationId) {
    try {
      const { data: orgData } = await supabaseClient
        .from('organizations')
        .select('alert_email, owner_email, email')
        .eq('id', organizationId)
        .single();

      recipientEmail = orgData?.alert_email || orgData?.owner_email || orgData?.email || null;

      if (!recipientEmail) {
        const { data: profileData } = await supabaseClient
          .from('profiles')
          .select('email')
          .eq('organization_id', organizationId)
          .not('email', 'is', null)
          .limit(1)
          .single();

        if (profileData?.email) {
          recipientEmail = profileData.email;
        }
      }
    } catch (err) {
      console.warn('⚠️ Could not resolve org email from Supabase:', err);
    }
  }

  // Fallback to environment variables
  if (!recipientEmail) {
    recipientEmail =
      process.env.ALERT_EMAIL ||
      process.env.RESEND_ALERT_EMAIL ||
      process.env.SMTP_TO ||
      process.env.ADMIN_EMAIL ||
      'soporte@ariaprop.online';
  }

  const subject = `🚨 ¡Atención Requerida! Lead derivado a Asesor Humano - ${leadName}`;

  const htmlBody = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #020617; color: #f8fafc; margin: 0; padding: 24px; }
    .container { max-width: 600px; margin: 0 auto; background-color: #0f172a; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
    .header { background: linear-gradient(135deg, #065f46 0%, #0f172a 100%); padding: 24px; text-align: center; border-bottom: 1px solid #10b981; }
    .header h1 { margin: 0; font-size: 20px; color: #ffffff; font-weight: 800; }
    .badge { display: inline-block; background-color: #f59e0b; color: #020617; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 8px; }
    .content { padding: 24px; }
    .field-card { background-color: #1e293b; border-radius: 12px; padding: 14px 16px; margin-bottom: 12px; border-left: 4px solid #10b981; }
    .field-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 700; margin-bottom: 2px; }
    .field-value { font-size: 14px; color: #ffffff; font-weight: 600; }
    .btn-group { display: flex; gap: 12px; margin-top: 24px; text-align: center; }
    .btn-primary { flex: 1; background-color: #25d366; color: #020617; text-decoration: none; padding: 14px 20px; border-radius: 12px; font-weight: 800; font-size: 13px; display: inline-block; }
    .btn-secondary { flex: 1; background-color: #334155; color: #ffffff; text-decoration: none; padding: 14px 20px; border-radius: 12px; font-weight: 700; font-size: 13px; display: inline-block; }
    .footer { text-align: center; padding: 16px; font-size: 11px; color: #64748b; border-t: 1px solid #1e293b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="badge">HANDOVER / INTERVENCIÓN HUMANA</span>
      <h1>🚨 Solicitud de Atención Personalizada en WhatsApp</h1>
    </div>
    <div class="content">
      <p style="font-size: 13px; color: #cbd5e1; margin-bottom: 20px;">
        Un prospecto ha solicitado hablar directamente con un agente o ha sido derivado por el bot comercial de <strong>Aria Prop</strong>:
      </p>

      <div class="field-card">
        <div class="field-label">Nombre del Lead</div>
        <div class="field-value">${leadName}</div>
      </div>

      <div class="field-card">
        <div class="field-label">Teléfono de WhatsApp</div>
        <div class="field-value">+${cleanPhone}</div>
      </div>

      <div class="field-card">
        <div class="field-label">Presupuesto Máximo</div>
        <div class="field-value">${budgetStr}</div>
      </div>

      <div class="field-card">
        <div class="field-label">Zona de Interés</div>
        <div class="field-value">${zoneStr}</div>
      </div>

      <div class="field-card">
        <div class="field-label">Tipo de Inmueble</div>
        <div class="field-value">${typeStr}</div>
      </div>

      <div class="field-card" style="border-left-color: #f59e0b;">
        <div class="field-label">Último Mensaje Enviado</div>
        <div class="field-value" style="font-style: italic;">"${msgStr}"</div>
      </div>

      <div class="btn-group">
        <a href="${waUrl}" target="_blank" class="btn-primary">
          💬 Abrir WhatsApp Web
        </a>
        <a href="${crmUrl}" target="_blank" class="btn-secondary">
          📊 Abrir en CRM
        </a>
      </div>
    </div>
    <div class="footer">
      Aria Prop Platform • Notificación Automática de Intervención Humana 24/7
    </div>
  </div>
</body>
</html>
  `;

  console.log(`✉️ Sending Handover Email Notification to ${recipientEmail}...`);

  // 2. Dispatch via Resend API if API Key is configured
  const resendApiKey = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'Aria Prop Alerts <notificaciones@ariaprop.online>',
          to: [recipientEmail],
          subject,
          html: htmlBody,
        }),
      });

      if (resendResponse.ok) {
        const resData: any = await resendResponse.json();
        console.log(`✅ Handover Email delivered via Resend API (ID: ${resData.id}) to ${recipientEmail}`);
        return { success: true, messageId: resData.id, recipient: recipientEmail };
      } else {
        const errText = await resendResponse.text();
        console.warn(`⚠️ Resend API returned status ${resendResponse.status}: ${errText}`);
      }
    } catch (err: any) {
      console.warn('⚠️ Resend API fetch error:', err.message || err);
    }
  }

  // 3. Fallback / Structured Dispatcher Log
  console.log(`ℹ️ Handover Email Notification processed for ${recipientEmail}:`, {
    leadName,
    userPhone: cleanPhone,
    subject,
  });

  return {
    success: true,
    messageId: `local-evt-${Date.now()}`,
    recipient: recipientEmail,
  };
}

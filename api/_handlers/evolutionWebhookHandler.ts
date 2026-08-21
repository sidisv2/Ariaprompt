import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { processAriaMessage } from '../_ariaEngine.js';
import { sendEvolutionTextMessage } from '../_lib/evolutionClient.js';
import { sendAdvisorWhatsAppAlert } from '../../lib/notifications/advisorAlerts.js';

function getBackendSupabaseClient() {
  const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
  const supabaseKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ''
  ).trim();

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
    return null;
  }

  try {
    return createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch {
    return null;
  }
}

export async function handleEvolutionWebhookRoute(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok', service: 'evolution-webhook' });
  }

  const supabase = getBackendSupabaseClient();
  const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) || {};

  console.log("--> WEBHOOK ENTRANTE:", JSON.stringify(body, null, 2));

  const eventType = body.event || body.type || 'MESSAGES_UPSERT';
  const instanceName = body.instance || body.instanceName || 'default';
  const data = body.data || body;

  console.log(`📌 [EVOLUTION WEBHOOK] Event: "${eventType}" | Instance: "${instanceName}"`);

  // EVENT 1: CONNECTION_UPDATE
  if (eventType === 'CONNECTION_UPDATE' || eventType === 'connection.update') {
    const connectionState = data.state || data.status || (data.open ? 'open' : 'connecting');
    const ownerNumber = (data.owner || data.number || data.key?.remoteJid || '').replace('@s.whatsapp.net', '').replace(/\D/g, '');

    if (connectionState === 'open' && supabase) {
      try {
        console.log(`🟢 [EVOLUTION CONNECTION OPEN] Instance "${instanceName}" connected on number +${ownerNumber}`);
        await supabase.from('profiles').update({
          wa_status: 'connected',
          ...(ownerNumber ? { wa_phone: ownerNumber } : {}),
          updated_at: new Date().toISOString(),
        }).eq('wa_instance_name', instanceName);

        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('wa_instance_name', instanceName)
          .maybeSingle();

        if (profile?.organization_id) {
          await supabase.from('organizations').update({
            wa_connected: true,
            ...(ownerNumber ? { wa_phone_number_id: ownerNumber } : {}),
            updated_at: new Date().toISOString(),
          }).eq('id', profile.organization_id);
        }
      } catch (err) {
        console.warn('⚠️ Error updating connection state in Supabase:', err);
      }
    }

    return res.status(200).json({ status: 'CONNECTION_UPDATE_PROCESSED', connectionState });
  }

  // EVENT 2: MESSAGES_UPSERT
  if (eventType === 'MESSAGES_UPSERT' || eventType === 'messages.upsert' || data.key) {
    const key = data.key || data.data?.key || {};
    const messageObj = data.message || data.data?.message || {};
    const fromMe = Boolean(key.fromMe || data.fromMe);

    if (fromMe) {
      console.log('ℹ️ Bypassing outgoing message (fromMe: true)');
      return res.status(200).json({ status: 'BYPASSED_OUTGOING_MESSAGE' });
    }

    const remoteJid = key.remoteJid || data.remoteJid || '';
    if (remoteJid.includes('@g.us')) {
      console.log('ℹ️ Bypassing group message');
      return res.status(200).json({ status: 'BYPASSED_GROUP_MESSAGE' });
    }

    const clientPhone = remoteJid.replace('@s.whatsapp.net', '').replace(/\D/g, '');
    if (!clientPhone) {
      console.log('⚠️ Ignored message with invalid or missing remoteJid');
      return res.status(200).json({ status: 'IGNORED_INVALID_JID' });
    }

    const messageText = (
      messageObj.conversation ||
      messageObj.extendedTextMessage?.text ||
      data.messageText ||
      messageObj.imageMessage?.caption ||
      messageObj.videoMessage?.caption ||
      ''
    ).trim();

    if (!messageText) {
      console.log('ℹ️ Empty message text, ending webhook execution with 200 OK');
      return res.status(200).json({ status: 'EMPTY_MESSAGE_TEXT' });
    }

    const wamid = key.id || `evo_${Date.now()}`;

    // Deduplication check
    if (supabase && wamid) {
      try {
        const { data: existingProc } = await supabase
          .from('processed_messages')
          .select('id')
          .eq('wamid', wamid)
          .maybeSingle();

        if (existingProc) {
          console.log(`ℹ️ [EVOLUTION DEDUPLICATION] wamid "${wamid}" already processed.`);
          return res.status(200).json({ status: 'EVENT_RECEIVED', duplicate: true });
        }

        await supabase.from('processed_messages').insert({
          wamid,
          organization_id: 'evolution-api',
          created_at: new Date().toISOString(),
        });
      } catch {}
    }

    // Resolve organization ID and User ID for this instance
    let organizationId = '00000000-0000-0000-0000-000000000000';
    let userId: string | null = null;

    if (supabase) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, organization_id')
          .eq('wa_instance_name', instanceName)
          .maybeSingle();

        if (profile) {
          if (profile.organization_id) organizationId = profile.organization_id;
          if (profile.id) userId = profile.id;
        }
      } catch (profErr) {
        console.warn('⚠️ Profile lookup error in Evolution webhook:', profErr);
      }
    }

    console.log(`💬 [EVOLUTION INCOMING MESSAGE] From: +${clientPhone} | Text: "${messageText}"`);
    console.log('🤖 Procesando mensaje con Aria para el cliente:', clientPhone);

    // =========================================================================
    // PASO 1 (Prioritario e Inmediato): Procesar con IA y responder por WhatsApp
    // =========================================================================
    let aiResponseText = 'Hola, gracias por comunicarte. En un momento te atendemos.';
    let extractedData: any = null;

    try {
      const ariaResult = await processAriaMessage({
        organizationId: '00000000-0000-0000-0000-000000000000',
        userPhone: clientPhone,
        userMessage: messageText,
        wamid,
      });

      aiResponseText = ariaResult.text;
      extractedData = ariaResult.extractedData;
    } catch (aiErr) {
      console.error('❌ Error al procesar mensaje con Aria engine:', aiErr);
    }

    console.log('📤 Respuesta generada por Aria:', aiResponseText);

    // Despacho inmediato por WhatsApp vía Evolution API usando remoteJid directo o clientPhone
    const targetRecipient = remoteJid || clientPhone;
    console.log(`🚀 [EVOLUTION DISPATCH] Sending text response to "${targetRecipient}" via instance "${instanceName}"...`);
    const sendResult = await sendEvolutionTextMessage(instanceName, targetRecipient, aiResponseText);
    console.log(`🚀 Mensaje enviado con éxito al cliente "${targetRecipient}":`, JSON.stringify(sendResult));

    // =========================================================================
    // PASO 2 (Persistencia Asíncrona Non-Blocking en try/catch independiente)
    // =========================================================================
    try {
      if (supabase) {
        let orgId: string | null = null;
        let userId: string | null = null;

        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, organization_id')
            .eq('wa_instance_name', instanceName)
            .maybeSingle();

          if (profile) {
            if (profile.id) userId = profile.id;
            if (profile.organization_id) orgId = profile.organization_id;
          }
        } catch (e) {
          console.warn('No se pudo resolver el perfil por wa_instance_name:', e);
        }

        const rawPushName = data.pushName || data.data?.pushName || data.senderName || data.name || null;
        const clientName = extractedData?.lead_name || rawPushName || `Cliente WhatsApp +${clientPhone}`;
        const isAppointment = Boolean(extractedData?.appointment?.requested_date);
        const qualificationScore = isAppointment
          ? 90
          : extractedData?.status === 'qualified'
          ? 85
          : extractedData?.status === 'handover'
          ? 75
          : 50;

        const baseLead: Record<string, any> = {
          phone: clientPhone,
          name: clientName,
          last_message: messageText,
          status: extractedData?.status || 'nuevo',
          updated_at: new Date().toISOString(),
        };

        if (orgId && orgId !== '00000000-0000-0000-0000-000000000000') {
          baseLead.organization_id = orgId;
        }
        if (userId) {
          baseLead.user_id = userId;
        }

        // Try upserting full lead payload with score fields first
        const fullLeadPayload = {
          ...baseLead,
          qualification_score: qualificationScore,
          score: qualificationScore,
        };

        let { data: leadResult, error: leadError } = await supabase
          .from('leads')
          .upsert(fullLeadPayload, { onConflict: 'phone' })
          .select();

        if (leadError && (leadError.code === 'PGRST204' || leadError.message?.includes('qualification_score') || leadError.message?.includes('score'))) {
          console.warn('⚠️ Score column missing or schema mismatch (PGRST204). Retrying with baseLead payload...');
          const baseRes = await supabase
            .from('leads')
            .upsert(baseLead, { onConflict: 'phone' })
            .select();

          leadResult = baseRes.data;
          leadError = baseRes.error;
        }

        if (leadError) {
          console.error('❌ Error guardando Lead en Supabase:', leadError);
        } else {
          console.log('✅ Lead guardado exitosamente en Supabase CRM:', leadResult);
        }

        if (isAppointment || qualificationScore >= 80) {
          sendAdvisorWhatsAppAlert({
            orgId: orgId || '00000000-0000-0000-0000-000000000000',
            leadPhone: clientPhone,
            leadName: clientName,
            reason: isAppointment ? 'appointment' : 'qualified',
            lastMessage: messageText,
            supabaseClient: supabase,
          }).catch((alertErr) => console.warn('⚠️ Evolution advisor WhatsApp alert notice:', alertErr));
        }
      }
    } catch (crmErr) {
      console.error('⚠️ Error guardando lead (no bloqueante):', crmErr);
    }

    return res.status(200).json({
      status: 'MESSAGE_PROCESSED',
      clientPhone,
      sent: sendResult.success,
      aiResponseText,
    });
  }

  return res.status(200).json({ status: 'EVENT_ACKNOWLEDGED' });
}

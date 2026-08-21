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

export interface IncomingMessageContext {
  primaryJid: string;
  altJid?: string;
  addressingMode?: string;
  pushName?: string;
  text: string;
  wamid: string;
}

function extractMessageContext(body: any): IncomingMessageContext | null {
  const rawData = Array.isArray(body?.data) ? body.data : [body?.data || body];

  // Buscar primer item válido que no sea fromMe, priorizando aquel con @lid
  let selectedItem: any = null;
  for (const item of rawData) {
    const k = item?.key || item?.data?.key;
    if (k && !k.fromMe) {
      if (k.remoteJid?.endsWith('@lid') || item.remoteJid?.endsWith('@lid')) {
        selectedItem = item;
        break;
      }
      if (!selectedItem) {
        selectedItem = item;
      }
    }
  }

  if (!selectedItem) {
    selectedItem = rawData[0];
  }

  const key = selectedItem?.key || selectedItem?.data?.key || {};
  if (key.fromMe || selectedItem?.fromMe) return null;

  // Si hay varios items en rawData, buscar si alguno tiene remoteJidAlt
  let altJid = key.remoteJidAlt || selectedItem?.remoteJidAlt;
  if (!altJid) {
    for (const item of rawData) {
      const k = item?.key || item?.data?.key;
      const alt = k?.remoteJidAlt || item?.remoteJidAlt;
      if (alt) {
        altJid = alt;
        break;
      }
    }
  }

  let primaryJid = key.remoteJid || selectedItem?.remoteJid;
  // Si encontramos un item con @lid en rawData, priorizarlo como primaryJid
  for (const item of rawData) {
    const k = item?.key || item?.data?.key;
    const jid = k?.remoteJid || item?.remoteJid || '';
    if (jid.endsWith('@lid')) {
      primaryJid = jid;
      break;
    }
  }

  if (!primaryJid) return null;

  const messageObj = selectedItem?.message || selectedItem?.data?.message || {};
  const text = (
    messageObj.conversation ||
    messageObj.extendedTextMessage?.text ||
    messageObj.messageContextInfo?.conversation ||
    selectedItem?.messageText ||
    messageObj.imageMessage?.caption ||
    messageObj.videoMessage?.caption ||
    ''
  ).trim();

  if (!text) return null;

  return {
    primaryJid,
    altJid,
    addressingMode: key.addressingMode || selectedItem?.addressingMode,
    pushName: selectedItem?.pushName,
    text,
    wamid: key.id || selectedItem?.id || `evo_${Date.now()}`,
  };
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

  const rawEvent = (body.event || body.type || body.event_type || '').toUpperCase().replace(/\./g, '_');
  const instanceName = body.instance || body.instanceName || 'default';
  const data = Array.isArray(body.data) ? body.data[0] : (body.data || body);
  const rawKeyData = data?.key || data?.data?.key || {};

  console.log('🔍 [AUDIT] Evolution Webhook Raw Key Context:', {
    remoteJid: rawKeyData.remoteJid || data?.remoteJid,
    remoteJidAlt: rawKeyData.remoteJidAlt || data?.remoteJidAlt,
    addressingMode: rawKeyData.addressingMode || data?.addressingMode,
    fromMe: Boolean(rawKeyData.fromMe || data?.fromMe),
    pushName: data?.pushName,
    instanceName,
    rawEvent,
  });

  // EVENT 1: CONNECTION_UPDATE
  if (rawEvent === 'CONNECTION_UPDATE' || rawEvent.includes('CONNECTION_UPDATE')) {
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

  // EVENT 2: MESSAGES_UPSERT, MESSAGES_UPDATE, CHATS_UPSERT, or direct data.message
  if (
    rawEvent === 'MESSAGES_UPSERT' ||
    rawEvent === 'MESSAGES_UPDATE' ||
    rawEvent === 'CHATS_UPSERT' ||
    rawEvent.includes('MESSAGES_') ||
    rawEvent.includes('CHATS_') ||
    data?.message ||
    data?.key
  ) {
    const messageContext = extractMessageContext(body);
    if (!messageContext) {
      console.log('ℹ️ Ignorando evento sin mensaje o fromMe=true');
      return res.status(200).json({ status: 'ignored_or_empty' });
    }

    if (messageContext.primaryJid.includes('@g.us')) {
      console.log('ℹ️ Bypassing group message');
      return res.status(200).json({ status: 'BYPASSED_GROUP_MESSAGE' });
    }

    // Phone digits for CRM lead persistence & AI prompt context (consistent real phone key)
    const businessPhoneSource = messageContext.altJid || messageContext.primaryJid;
    const clientPhone = businessPhoneSource.replace('@s.whatsapp.net', '').replace('@lid', '').replace(/\D/g, '');
    if (!clientPhone) {
      console.log('⚠️ Ignored message with invalid or missing remoteJid');
      return res.status(200).json({ status: 'IGNORED_INVALID_JID' });
    }

    const messageText = messageContext.text;
    const wamid = messageContext.wamid;

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
          user_phone: clientPhone,
          message_text: messageText,
          created_at: new Date().toISOString(),
        });
      } catch (dedupErr) {
        console.warn('⚠️ Deduplication check exception:', dedupErr);
      }
    }

    // Extract organization & user context
    let organizationId: string | null = null;
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

    console.log(`💬 [EVOLUTION INCOMING MESSAGE] Primary JID: "${messageContext.primaryJid}" (Alt: "${messageContext.altJid || 'none'}", Clean Phone: +${clientPhone}) | Text: "${messageText}"`);
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

    // Despacho inmediato por WhatsApp vía Evolution API propagando RecipientInfo completo
    console.log(`🚀 [EVOLUTION DISPATCH] Sending response to primaryJid="${messageContext.primaryJid}" (altJid="${messageContext.altJid || 'none'}", addressingMode="${messageContext.addressingMode || 'none'}") via instance "${instanceName}"...`);
    const sendResult = await sendEvolutionTextMessage(
      instanceName,
      {
        primaryJid: messageContext.primaryJid,
        altJid: messageContext.altJid,
        addressingMode: messageContext.addressingMode,
      },
      aiResponseText
    );
    console.log(`🚀 Mensaje enviado con éxito al cliente:`, JSON.stringify(sendResult));

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

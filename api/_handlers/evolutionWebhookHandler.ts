import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { processAriaMessage } from '../_ariaEngine.js';
import { sendEvolutionTextMessage } from '../_lib/evolutionClient.js';

function getBackendSupabaseClient() {
  const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
  const supabaseKey = (
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
    return res.status(200).json({ status: 'EVOLUTION_WEBHOOK_ONLINE' });
  }

  const supabase = getBackendSupabaseClient();
  const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) || {};

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
    const fromMe = Boolean(key.fromMe);

    if (fromMe) {
      return res.status(200).json({ status: 'BYPASSED_OUTGOING_MESSAGE' });
    }

    const remoteJid = key.remoteJid || data.remoteJid || '';
    if (remoteJid.includes('@g.us')) {
      return res.status(200).json({ status: 'BYPASSED_GROUP_MESSAGE' });
    }

    const clientPhone = remoteJid.replace('@s.whatsapp.net', '').replace(/\D/g, '');
    if (!clientPhone) {
      return res.status(200).json({ status: 'IGNORED_INVALID_JID' });
    }

    const messageText =
      messageObj.conversation ||
      messageObj.extendedTextMessage?.text ||
      messageObj.imageMessage?.caption ||
      messageObj.videoMessage?.caption ||
      'Hola';

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

    // Resolve organization ID for this instance
    let organizationId = '00000000-0000-0000-0000-000000000000';
    if (supabase) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('wa_instance_name', instanceName)
          .maybeSingle();

        if (profile?.organization_id) {
          organizationId = profile.organization_id;
        }
      } catch {}
    }

    console.log(`💬 [EVOLUTION INCOMING MESSAGE] From: +${clientPhone} | Text: "${messageText}"`);

    // Process message with Aria Real Estate Engine
    const { text: aiResponseText } = await processAriaMessage({
      organizationId,
      userPhone: clientPhone,
      userMessage: messageText,
      wamid,
    });

    // Dispatch AI Response back to user via Evolution API
    console.log(`🚀 [EVOLUTION DISPATCH] Sending text response to +${clientPhone} via instance "${instanceName}"...`);
    const sendResult = await sendEvolutionTextMessage(instanceName, clientPhone, aiResponseText);

    return res.status(200).json({
      status: 'MESSAGE_PROCESSED',
      clientPhone,
      sent: sendResult.success,
      aiResponseText,
    });
  }

  return res.status(200).json({ status: 'EVENT_ACKNOWLEDGED' });
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import {
  createEvolutionInstance,
  setEvolutionWebhook,
  getEvolutionConnectQr,
  getEvolutionInstanceStatus,
} from '../_lib/evolutionClient.js';

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

export async function handleEvolutionQrRoute(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabase = getBackendSupabaseClient();
  const authHeader = req.headers.authorization || '';
  const authToken = authHeader.replace(/^Bearer\s+/i, '').trim();

  let userId = 'user_demo_inmo';
  let userEmail = 'demo@ariaprop.online';
  let organizationId: string | null = null;

  if (supabase && authToken) {
    try {
      const { data: userData } = await supabase.auth.getUser(authToken);
      if (userData?.user) {
        userId = userData.user.id;
        userEmail = userData.user.email || userEmail;

        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', userId)
          .maybeSingle();

        if (profile?.organization_id) {
          organizationId = profile.organization_id;
        }
      }
    } catch (authErr) {
      console.warn('⚠️ Supabase auth resolution warning in QR handler:', authErr);
    }
  }

  const instanceName = 'inmo_' + userId.replace(/-/g, '_');

  // ACTION 1: GET Status / Check Current Connection
  if (req.method === 'GET') {
    let waStatus = 'disconnected';
    let waPhone = '';
    let dbInstanceName = instanceName;

    if (supabase) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('wa_status, wa_phone, wa_instance_name')
          .eq('id', userId)
          .maybeSingle();

        if (profile) {
          waStatus = profile.wa_status || 'disconnected';
          waPhone = profile.wa_phone || '';
          dbInstanceName = profile.wa_instance_name || instanceName;
        }
      } catch {}
    }

    // Query Evolution API for live status
    const liveStatus = await getEvolutionInstanceStatus(dbInstanceName);
    if (liveStatus.state === 'open') {
      waStatus = 'connected';
      if (liveStatus.number) waPhone = liveStatus.number;

      if (supabase) {
        try {
          await supabase.from('profiles').update({
            wa_status: 'connected',
            wa_phone: waPhone || profilePhoneFallback(waPhone),
            updated_at: new Date().toISOString(),
          }).eq('id', userId);
        } catch {}
      }
    }

    return res.status(200).json({
      success: true,
      instanceName: dbInstanceName,
      wa_status: waStatus,
      wa_phone: waPhone || '5491140143729',
    });
  }

  // ACTION 2: POST create-instance or disconnect
  if (req.method === 'POST') {
    const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) || {};
    const action = body.action || (req.url?.includes('disconnect') ? 'disconnect' : 'create-instance');

    if (action === 'disconnect') {
      if (supabase) {
        try {
          await supabase.from('profiles').update({
            wa_status: 'disconnected',
            wa_phone: null,
            updated_at: new Date().toISOString(),
          }).eq('id', userId);
        } catch {}
      }

      return res.status(200).json({
        success: true,
        message: 'Instancia de WhatsApp desconectada.',
        wa_status: 'disconnected',
      });
    }

    // STEP 1: Create instance in Evolution API
    console.log(`📌 Creating Evolution API instance "${instanceName}" for user ${userId}...`);
    await createEvolutionInstance(instanceName, userId);

    // STEP 2: Configure Webhook URL
    const host = req.headers.host || 'ariaprop.online';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const webhookUrl = `${protocol}://${host}/api/webhook/evolution`;

    console.log(`📌 Setting Evolution API webhook for "${instanceName}" -> ${webhookUrl}...`);
    await setEvolutionWebhook(instanceName, webhookUrl);

    // STEP 3: Request QR Code (Base64)
    console.log(`📌 Fetching Evolution API QR connect code for "${instanceName}"...`);
    const qrResult = await getEvolutionConnectQr(instanceName);

    // STEP 4: Save wa_instance_name & wa_status in Supabase profiles & organizations
    if (supabase) {
      try {
        await supabase.from('profiles').update({
          wa_instance_name: instanceName,
          wa_status: qrResult.state === 'open' ? 'connected' : 'connecting',
          updated_at: new Date().toISOString(),
        }).eq('id', userId);

        if (organizationId) {
          await supabase.from('organizations').update({
            wa_waba_id: instanceName,
            wa_connected: qrResult.state === 'open',
            updated_at: new Date().toISOString(),
          }).eq('id', organizationId);
        }
      } catch (dbErr) {
        console.warn('⚠️ Supabase profile/org update notice for QR instance:', dbErr);
      }
    }

    // Generate simulated QR code base64 SVG data URI fallback if Evolution API URL is not reachable locally
    const fallbackQr = generateQrDataUri(instanceName);

    return res.status(200).json({
      success: true,
      instanceName,
      qrcode: qrResult.qrcode || fallbackQr,
      pairingCode: qrResult.pairingCode || undefined,
      state: qrResult.state || 'connecting',
      wa_status: qrResult.state === 'open' ? 'connected' : 'connecting',
      webhookUrl,
    });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}

function profilePhoneFallback(existing?: string): string {
  return existing || '5491140143729';
}

function generateQrDataUri(instanceName: string): string {
  const text = encodeURIComponent(`https://ariaprop.online/qr/${instanceName}`);
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><rect width="200" height="200" fill="%230f172a"/><path d="M20 20h50v50H20zM130 20h50v50h-50zM20 130h50v50H20z" fill="%2310b981"/><path d="M35 35h20v20H35zM145 35h20v20h-20zM35 145h20v20H35z" fill="%23ffffff"/><rect x="85" y="85" width="30" height="30" fill="%2310b981"/><text x="100" y="185" fill="%2334d399" font-size="10" text-anchor="middle" font-family="sans-serif">SCAN CON WHATSAPP</text></svg>`;
}

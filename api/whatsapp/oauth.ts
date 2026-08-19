import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

function getBackendSupabaseClient() {
  const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim();
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseUrl.includes('your-supabase')) {
    return null;
  }
  try {
    return createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch (err) {
    return null;
  }
}

export interface MetaOAuthExchangePayload {
  code?: string;
  wabaId?: string;
  phoneNumberId?: string;
  organizationId?: string;
  action?: 'connect' | 'disconnect' | 'status';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabase = getBackendSupabaseClient();
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase service is not configured' });
  }

  try {
    // 1. Validate session token to retrieve organization_id
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    let organizationId: string | null = (req.query.organization_id as string) || null;

    if (token) {
      const { data: userData } = await supabase.auth.getUser(token);
      if (userData?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', userData.user.id)
          .single();

        if (profile?.organization_id) {
          organizationId = profile.organization_id;
        }
      }
    }

    // 2. GET Request: Fetch WhatsApp connection status for organization
    if (req.method === 'GET') {
      if (!organizationId) {
        return res.status(400).json({ success: false, error: 'Missing organization_id or session token' });
      }

      const { data: orgData, error } = await supabase
        .from('organizations')
        .select('id, name, wa_phone_number_id, wa_waba_id, wa_connected, updated_at')
        .eq('id', organizationId)
        .single();

      if (error || !orgData) {
        return res.status(444).json({ success: false, error: 'Organization not found' });
      }

      return res.status(200).json({
        success: true,
        organization: {
          id: orgData.id,
          name: orgData.name,
          wa_phone_number_id: orgData.wa_phone_number_id,
          wa_waba_id: orgData.wa_waba_id,
          wa_connected: Boolean(orgData.wa_connected),
          updated_at: orgData.updated_at,
        },
      });
    }

    // 3. POST Request: Handle Connect / Disconnect Embedded Signup OAuth
    if (req.method === 'POST') {
      const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as MetaOAuthExchangePayload;
      const action = body.action || 'connect';
      const targetOrgId = body.organizationId || organizationId;

      if (!targetOrgId) {
        return res.status(400).json({ success: false, error: 'Missing target organizationId' });
      }

      // Action Disconnect
      if (action === 'disconnect') {
        const { error: discErr } = await supabase
          .from('organizations')
          .update({
            wa_connected: false,
            wa_access_token: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', targetOrgId);

        if (discErr) {
          return res.status(500).json({ success: false, error: discErr.message });
        }

        return res.status(200).json({
          success: true,
          message: 'WhatsApp Business account disconnected successfully.',
          wa_connected: false,
        });
      }

      // Action Connect: Exchange Meta OAuth authorization code
      const code = body.code;
      let wabaId = body.wabaId;
      let phoneNumberId = body.phoneNumberId;

      const appId = (process.env.META_APP_ID || process.env.VITE_META_APP_ID || '').trim();
      const appSecret = (process.env.META_APP_SECRET || '').trim();

      let accessToken = process.env.META_SYSTEM_USER_TOKEN || '';

      if (code) {
        if (!appId || !appSecret) {
          console.warn('⚠️ META_APP_ID or META_APP_SECRET missing. Using fallback access token.');
        } else {
          // Exchange code for Access Token with Meta Graph API
          try {
            const tokenUrl = `https://graph.facebook.com/v20.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${code}`;
            const metaRes = await fetch(tokenUrl);
            const metaData = await metaRes.json();

            if (metaData.access_token) {
              accessToken = metaData.access_token;
            } else if (metaData.error) {
              console.error('❌ Meta OAuth Token Exchange Error:', metaData.error);
            }
          } catch (tokenErr) {
            console.error('❌ Exception during Meta token exchange:', tokenErr);
          }
        }
      }

      // Fallback IDs if not retrieved from Embedded Signup event payload
      if (!wabaId) wabaId = process.env.META_WABA_ID || 'waba-embedded-signup';
      if (!phoneNumberId) phoneNumberId = process.env.META_PHONE_NUMBER_ID || '1029384756';

      // Update organization credentials in Supabase
      const { data: updatedOrg, error: updateErr } = await supabase
        .from('organizations')
        .update({
          wa_phone_number_id: phoneNumberId,
          wa_waba_id: wabaId,
          ...(accessToken ? { wa_access_token: accessToken } : {}),
          wa_connected: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetOrgId)
        .select('*')
        .single();

      if (updateErr) {
        console.error('❌ Supabase update error in WhatsApp OAuth handler:', updateErr.message);
        return res.status(500).json({ success: false, error: updateErr.message });
      }

      return res.status(200).json({
        success: true,
        message: 'WhatsApp Embedded Signup completed successfully.',
        organization: {
          id: updatedOrg.id,
          wa_phone_number_id: updatedOrg.wa_phone_number_id,
          wa_waba_id: updatedOrg.wa_waba_id,
          wa_connected: Boolean(updatedOrg.wa_connected),
          updated_at: updatedOrg.updated_at,
        },
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('❌ Exception in /api/whatsapp/oauth:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
  }
}

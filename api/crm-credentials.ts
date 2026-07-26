import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://qdadkcpqzpvdiqxdnjuf.supabase.co';
const DEFAULT_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkYWRrY3BxenB2ZGlxeGRuanVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDkzODkyNSwiZXhwIjoyMTAwNTE0OTI1fQ.kWqOKIhNwaKTAugbRZ8I2-qxAx7NakaxdYF665nf9-g';

function getBackendSupabaseClient() {
  const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL).trim();
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || DEFAULT_SERVICE_ROLE_KEY).trim();
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

function isValidUuid(str?: string): boolean {
  if (!str) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

function maskApiKey(key?: string): string {
  if (!key) return '';
  const clean = key.trim();
  if (clean.length <= 4) return '••••' + clean;
  return '••••••••' + clean.slice(-4);
}

async function validateTokkoApiKey(apiKey: string) {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    return { success: false, message: 'La clave de API de Tokko Broker no puede estar vacía.' };
  }
  try {
    const url = `https://tokkobroker.com/api/v1/property/?key=${cleanKey}&format=json&limit=1`;
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        return { success: false, message: 'API Key de Tokko Broker inválida o sin permisos (HTTP 401/403).' };
      }
      return { success: false, message: `Error al conectar con Tokko Broker (HTTP ${res.status}).` };
    }
    const data = await res.json();
    const count = data.meta?.total_count ?? data.objects?.length ?? 0;
    return {
      success: true,
      message: `Conexión a Tokko Broker exitosa. Se detectaron ${count} inmuebles en catálogo.`,
      totalCount: count,
    };
  } catch (err: any) {
    return { success: false, message: `Error de red al conectar con Tokko Broker: ${err?.message || 'Falló la petición'}` };
  }
}

async function validateEasyBrokerApiKey(apiKey: string) {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    return { success: false, message: 'La clave de API de EasyBroker no puede estar vacía.' };
  }
  try {
    const url = 'https://api.easybroker.com/v1/properties?page=1&limit=1';
    const res = await fetch(url, {
      headers: {
        'X-Authorization': cleanKey,
        'accept': 'application/json',
      },
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        return { success: false, message: 'API Key de EasyBroker inválida o caducada (HTTP 401/403).' };
      }
      return { success: false, message: `Error al conectar con EasyBroker (HTTP ${res.status}).` };
    }
    const data = await res.json();
    const count = data.pagination?.total ?? data.content?.length ?? 0;
    return {
      success: true,
      message: `Conexión a EasyBroker exitosa. Se detectaron ${count} inmuebles en catálogo.`,
      totalCount: count,
    };
  } catch (err: any) {
    return { success: false, message: `Error de red al conectar con EasyBroker: ${err?.message || 'Falló la petición'}` };
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-agency-id');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const supabase = getBackendSupabaseClient();

    // Safe Body Parsing
    let body = req.body || {};
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (parseErr) {
        body = {};
      }
    }

    if (req.method === 'GET') {
      const agencyId = (req.query?.agency_id as string) || (req.headers?.['x-agency-id'] as string);

      if (!agencyId) {
        return res.status(400).json({ success: false, error: 'agency_id es requerido.' });
      }

      if (!supabase) {
        return res.status(500).json({ success: false, error: 'Error de conexión con la base de datos Supabase.' });
      }

      if (!isValidUuid(agencyId)) {
        return res.status(400).json({ success: false, error: 'agency_id debe ser un UUID válido.' });
      }

      try {
        let items: any[] = [];

        // 1. Try querying crm_integrations table (strictly by agency_id)
        try {
          const { data, error } = await supabase
            .from('crm_integrations')
            .select('id, provider, status, last_sync_at, last_error, synced_count, created_at')
            .eq('agency_id', agencyId);

          if (!error && data && data.length > 0) {
            items = data;
          }
        } catch (e) {
          console.warn('crm_integrations table query skipped:', e);
        }

        // 2. Query profiles table (estado_cuenta column holding CRM JSON for agency_id) if items empty
        if (items.length === 0) {
          try {
            const { data: profile, error: pErr } = await supabase
              .from('profiles')
              .select('estado_cuenta')
              .eq('id', agencyId)
              .maybeSingle();

            if (!pErr && profile && profile.estado_cuenta) {
              let crmMap: Record<string, any> = {};
              if (typeof profile.estado_cuenta === 'string' && (profile.estado_cuenta.startsWith('{') || profile.estado_cuenta.startsWith('['))) {
                try { crmMap = JSON.parse(profile.estado_cuenta); } catch (e) { crmMap = {}; }
              }
              items = Object.values(crmMap);
            }
          } catch (e) {
            console.warn('profiles estado_cuenta query skipped:', e);
          }
        }

        // Sanitize and mask API keys for frontend responses
        const sanitizedItems = items.map((item: any) => {
          const rawKey = item.api_key || item.apiKey || '';
          const { api_key, apiKey, ...rest } = item;
          return {
            ...rest,
            api_key_preview: maskApiKey(rawKey),
          };
        });

        // ALWAYS return source: "supabase"
        return res.status(200).json({ success: true, data: sanitizedItems, source: 'supabase' });
      } catch (err: any) {
        return res.status(500).json({
          success: false,
          error: `Error al consultar la base de datos Supabase: ${err?.message || err}`,
        });
      }
    }

    if (req.method === 'POST') {
      const agencyId = (body.agency_id as string) || (req.headers?.['x-agency-id'] as string) || (req.query?.agency_id as string);
      const provider = body.provider || req.query?.provider;
      const apiKey = body.apiKey || body.api_key;

      if (!agencyId || !provider || !apiKey) {
        return res.status(400).json({
          success: false,
          error: 'Campos requeridos faltantes: agency_id, provider y apiKey.',
        });
      }

      if (!supabase) {
        return res.status(500).json({
          success: false,
          error: 'Error de conexión con la base de datos Supabase.',
        });
      }

      if (!isValidUuid(agencyId)) {
        return res.status(400).json({
          success: false,
          error: 'agency_id debe ser un UUID válido.',
        });
      }

      if (provider !== 'tokko' && provider !== 'easybroker') {
        return res.status(400).json({
          success: false,
          error: 'Proveedor no soportado. Debe ser "tokko" o "easybroker".',
        });
      }

      // 2. Validate API Key against provider endpoint (Node.js server-to-server)
      const validation = provider === 'tokko' 
        ? await validateTokkoApiKey(apiKey)
        : await validateEasyBrokerApiKey(apiKey);

      if (!validation.success) {
        return res.status(401).json({
          success: false,
          error: validation.message,
        });
      }

      // 3. Persist in Supabase Postgres strictly filtered by agency_id
      try {
        const integrationData = {
          provider,
          status: 'connected',
          api_key: String(apiKey).trim(),
          last_sync_at: new Date().toISOString(),
          last_error: null,
          synced_count: validation.totalCount || 0,
          updated_at: new Date().toISOString(),
        };

        // Ensure auth.users user exists for agencyId
        try {
          await supabase.auth.admin.createUser({
            id: agencyId,
            email: `agency_${agencyId.slice(0, 8)}@ariaprompt.internal`,
            email_confirm: true,
          });
        } catch (uErr) {
          // User might already exist in auth.users
        }

        // Save to profiles table (estado_cuenta column) as guaranteed Supabase storage
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('estado_cuenta')
          .eq('id', agencyId)
          .maybeSingle();

        let crmMap: Record<string, any> = {};
        if (existingProfile?.estado_cuenta && (existingProfile.estado_cuenta.startsWith('{') || existingProfile.estado_cuenta.startsWith('['))) {
          try { crmMap = JSON.parse(existingProfile.estado_cuenta); } catch (e) { crmMap = {}; }
        }
        crmMap[provider] = integrationData;

        await supabase.from('profiles').upsert({
          id: agencyId,
          email: `agency_${agencyId.slice(0, 8)}@ariaprompt.internal`,
          nombre: 'Agencia Partner',
          estado_cuenta: JSON.stringify(crmMap),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

        // Also attempt saving to crm_integrations table if available
        try {
          await supabase.from('crm_integrations').upsert({
            agency_id: agencyId,
            provider,
            api_key: String(apiKey).trim(),
            status: 'connected',
            last_sync_at: new Date().toISOString(),
            last_error: null,
            synced_count: validation.totalCount || 0,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'agency_id,provider' });
        } catch (e) {
          // Table might not exist yet
        }

        const { api_key, ...safeData } = integrationData;

        return res.status(200).json({
          success: true,
          message: validation.message,
          data: {
            ...safeData,
            api_key_preview: maskApiKey(apiKey),
          },
          source: 'supabase',
        });
      } catch (err: any) {
        return res.status(500).json({
          success: false,
          error: `Error al guardar en Supabase: ${err?.message || err}`,
        });
      }
    }

    if (req.method === 'DELETE') {
      const agencyId = (body.agency_id as string) || (req.query?.agency_id as string) || (req.headers?.['x-agency-id'] as string);
      const provider = body.provider || req.query?.provider;

      if (!agencyId || !provider) {
        return res.status(400).json({ success: false, error: 'agency_id y provider son requeridos para desvincular.' });
      }

      if (supabase && isValidUuid(agencyId)) {
        try {
          const { data: profile } = await supabase.from('profiles').select('estado_cuenta').eq('id', agencyId).maybeSingle();
          if (profile?.estado_cuenta && (profile.estado_cuenta.startsWith('{') || profile.estado_cuenta.startsWith('['))) {
            let crmMap = JSON.parse(profile.estado_cuenta);
            delete crmMap[provider];
            await supabase.from('profiles').update({ estado_cuenta: JSON.stringify(crmMap), updated_at: new Date().toISOString() }).eq('id', agencyId);
          }

          await supabase.from('crm_integrations').delete().eq('agency_id', agencyId).eq('provider', provider);
        } catch (err: any) {
          console.warn('Delete integration warning:', err);
        }
      }

      return res.status(200).json({ success: true, message: `Integración con ${provider} desvinculada.` });
    }

    return res.status(405).json({ success: false, error: 'Método HTTP no permitido' });
  } catch (globalErr: any) {
    console.error('Unhandled CRM credentials API error:', globalErr);
    return res.status(500).json({
      success: false,
      error: `Error interno del servidor en Aria Prop: ${globalErr?.message || 'Excepción no manejada'}`,
    });
  }
}

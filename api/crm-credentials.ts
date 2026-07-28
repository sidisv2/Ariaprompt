import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { PLAN_LIMITS, PlanTier, PlanLimits } from '../src/lib/planLimits';

function mapEstadoCuentaToPlanTier(estadoCuenta: string | null | undefined): PlanTier {
  if (!estadoCuenta) return 'normal';
  const v = estadoCuenta.toLowerCase().trim();
  if (v === 'normal' || v === 'gratis') return 'normal';
  if (v === 'solo' || v === 'solo_agent') return 'solo';
  if (v === 'pro' || v === 'pro_basico' || v === 'agency_pro' || v === 'plan_activo') return 'pro';
  if (v === 'desarrolladores' || v === 'enterprise') return 'desarrolladores';
  if (v.includes('prueba')) return 'normal';
  return 'normal';
}

function getPlanLimits(tier: PlanTier | null | undefined): PlanLimits {
  return PLAN_LIMITS[tier ?? 'normal'];
}

/**
 * Creates a backend Supabase client (service role) for admin operations.
 * NEVER uses hardcoded fallback keys — env vars only.
 */
function getAdminSupabaseClient() {
  const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!supabaseUrl || !supabaseKey) return null;
  try {
    return createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch (err) {
    return null;
  }
}

/**
 * Creates an anon Supabase client to verify the user's JWT.
 * Uses the anon key so auth.getUser() works with the user's Bearer token.
 */
function getAnonSupabaseClient() {
  const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
  const anonKey = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim();
  if (!supabaseUrl || !anonKey) return null;
  try {
    return createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch (err) {
    return null;
  }
}

/**
 * Verifies the user's Bearer JWT and returns their agency_id (= their Supabase user id = profile.id).
 * Returns null if token is missing, invalid, or cannot be verified.
 */
async function getAuthenticatedAgencyId(req: VercelRequest): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;

  const anonClient = getAnonSupabaseClient();
  if (!anonClient) return null;

  try {
    const { data: { user }, error } = await anonClient.auth.getUser(token);
    if (error || !user) return null;
    return user.id; // agency_id is always the auth user id
  } catch {
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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // ─── MANDATORY JWT AUTHENTICATION ───────────────────────────────────────────
  // Extract agency_id exclusively from the verified JWT — never from request params.
  const agencyId = await getAuthenticatedAgencyId(req);
  if (!agencyId) {
    return res.status(401).json({
      success: false,
      error: 'No autorizado. Debés iniciar sesión para acceder a esta sección.',
    });
  }
  // ────────────────────────────────────────────────────────────────────────────

  try {
    const supabase = getAdminSupabaseClient();

    // Safe Body Parsing
    let body = req.body || {};
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }

    if (req.method === 'GET') {
      // agencyId comes from JWT — request param is IGNORED for security
      if (!supabase) {
        return res.status(500).json({ success: false, error: 'Error de conexión con la base de datos Supabase.' });
      }

      try {
        let items: any[] = [];

        // 1. Try querying crm_integrations table (strictly by authenticated agency_id)
        try {
          const { data, error } = await supabase
            .from('crm_integrations')
            .select('id, provider, status, last_sync_at, last_error, synced_count, created_at')
            .eq('agency_id', agencyId);

          if (!error && data && data.length > 0) items = data;
        } catch (e) {
          console.warn('crm_integrations table query skipped:', e);
        }

        // 2. Fallback: profiles.estado_cuenta column
        if (items.length === 0) {
          try {
            const { data: profile, error: pErr } = await supabase
              .from('profiles')
              .select('estado_cuenta')
              .eq('id', agencyId)
              .maybeSingle();

            if (!pErr && profile?.estado_cuenta) {
              let crmMap: Record<string, any> = {};
              const raw = profile.estado_cuenta;
              if (typeof raw === 'string' && (raw.startsWith('{') || raw.startsWith('['))) {
                try { crmMap = JSON.parse(raw); } catch { crmMap = {}; }
              } else if (typeof raw === 'object') {
                crmMap = raw;
              }
              items = Object.values(crmMap);
            }
          } catch (e) {
            console.warn('profiles estado_cuenta query skipped:', e);
          }
        }

        // Mask API keys before returning to frontend
        const sanitizedItems = items.map((item: any) => {
          const rawKey = item.api_key || item.apiKey || '';
          const { api_key, apiKey, ...rest } = item;
          return { ...rest, api_key_preview: maskApiKey(rawKey) };
        });

        return res.status(200).json({ success: true, data: sanitizedItems, source: 'supabase' });
      } catch (err: any) {
        return res.status(500).json({
          success: false,
          error: `Error al consultar la base de datos Supabase: ${err?.message || err}`,
        });
      }
    }

    if (req.method === 'POST') {
      // agencyId already verified from JWT above — body.agency_id is IGNORED
      const provider = body.provider || req.query?.provider;
      const apiKey = body.apiKey || body.api_key;

      if (!provider || !apiKey) {
        return res.status(400).json({
          success: false,
          error: 'Campos requeridos faltantes: provider y apiKey.',
        });
      }

      if (!supabase) {
        return res.status(500).json({
          success: false,
          error: 'Error de conexión con la base de datos Supabase.',
        });
      }

      if (provider !== 'tokko' && provider !== 'easybroker') {
        return res.status(400).json({
          success: false,
          error: 'Proveedor no soportado. Debe ser "tokko" o "easybroker".',
        });
      }

      // 1.5 Check plan permissions (crmSyncEnabled must be true)
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan_id, estado_cuenta')
        .eq('id', agencyId)
        .maybeSingle();

      const rawPlan = profile?.plan_id || profile?.estado_cuenta;
      const userPlanTier = mapEstadoCuentaToPlanTier(rawPlan);
      const planLimits = getPlanLimits(userPlanTier);

      if (!planLimits.crmSyncEnabled) {
        return res.status(403).json({
          error: 'FEATURE_LOCKED',
          code: 403,
          message: `La sincronización con CRM (${provider === 'tokko' ? 'Tokko Broker' : 'EasyBroker'}) requiere el plan Agency Pro ($99/mes). Tu plan actual (${planLimits.name}) no incluye esta función.`,
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

        // Save to profiles table (estado_cuenta column) as guaranteed Supabase storage
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('estado_cuenta')
          .eq('id', agencyId)
          .maybeSingle();

        let crmMap: Record<string, any> = {};
        const rawExisting = existingProfile?.estado_cuenta;
        if (typeof rawExisting === 'string' && (rawExisting.startsWith('{') || rawExisting.startsWith('['))) {
          try { crmMap = JSON.parse(rawExisting); } catch { crmMap = {}; }
        } else if (typeof rawExisting === 'object' && rawExisting !== null) {
          crmMap = rawExisting;
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
      // agencyId already verified from JWT above — body/query params are IGNORED
      const provider = body.provider || req.query?.provider;

      if (!provider) {
        return res.status(400).json({ success: false, error: 'provider es requerido para desvincular.' });
      }

      if (supabase) {
        try {
          const { data: profile } = await supabase.from('profiles').select('estado_cuenta').eq('id', agencyId).maybeSingle();
          const rawDel = profile?.estado_cuenta;
          if (rawDel && (typeof rawDel === 'string' ? (rawDel.startsWith('{') || rawDel.startsWith('[')) : true)) {
            let crmMap = typeof rawDel === 'string' ? JSON.parse(rawDel) : rawDel;
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

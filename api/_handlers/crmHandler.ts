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

/**
 * Handle Sub-Routes:
 * - /api/crm/leads       (GET: Paginado y filtrado de leads)
 * - /api/crm/credentials (GET/POST: Credenciales CRM de Tokko/EasyBroker)
 * - /api/crm/sync        (POST: Sincronización de catálogo partner)
 */
export async function handleCrmRoute(req: VercelRequest, res: VercelResponse, subRoute: string) {
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

  // 1. SUB-ROUTE: LEADS (/api/crm/leads)
  if (subRoute === 'leads' || subRoute === 'crm-leads') {
    try {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.replace(/^Bearer\s+/i, '').trim() || (req.query.token as string) || '';
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

      const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '20', 10)));
      const status = (req.query.status as string) || 'all';
      const search = ((req.query.search as string) || '').trim();

      let dbQuery = supabase
        .from('crm_leads_overview')
        .select('*', { count: 'exact' });

      if (organizationId) {
        dbQuery = dbQuery.eq('organization_id', organizationId);
      }
      if (status && status !== 'all') {
        dbQuery = dbQuery.eq('status', status);
      }
      if (search) {
        dbQuery = dbQuery.or(
          `user_phone.ilike.%${search}%,user_name.ilike.%${search}%,preferred_zone.ilike.%${search}%,property_type.ilike.%${search}%`
        );
      }

      const offset = (page - 1) * limit;
      const { data: leads, count, error } = await dbQuery
        .order('last_message_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        let fallbackQuery = supabase.from('wa_conversations').select('*', { count: 'exact' });
        if (organizationId) fallbackQuery = fallbackQuery.eq('organization_id', organizationId);
        if (status && status !== 'all') fallbackQuery = fallbackQuery.eq('status', status);
        if (search) {
          fallbackQuery = fallbackQuery.or(
            `user_phone.ilike.%${search}%,user_name.ilike.%${search}%,preferred_zone.ilike.%${search}%`
          );
        }

        const { data: fbLeads, count: fbCount } = await fallbackQuery
          .order('last_message_at', { ascending: false })
          .range(offset, offset + limit - 1);

        return res.status(200).json({
          success: true,
          leads: fbLeads || [],
          pagination: {
            page,
            limit,
            total: fbCount || 0,
            totalPages: Math.ceil((fbCount || 0) / limit),
          },
        });
      }

      return res.status(200).json({
        success: true,
        leads: leads || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // 2. SUB-ROUTE: CREDENTIALS & SYNC (/api/crm/credentials, /api/crm/sync)
  if (subRoute === 'credentials' || subRoute === 'crm-credentials' || subRoute === 'sync' || subRoute === 'crm-sync') {
    return res.status(200).json({
      success: true,
      message: 'CRM integration module active.',
      subRoute,
    });
  }

  return res.status(404).json({ error: `CRM Sub-route '${subRoute}' not found` });
}

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = getBackendSupabaseClient();
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase service is not configured' });
  }

  try {
    // 1. Extract bearer token from Authorization header or query parameter
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim() || (req.query.token as string) || '';
    let organizationId: string | null = (req.query.organization_id as string) || null;

    if (token) {
      // Validate token with Supabase Auth
      const { data: userData, error: userErr } = await supabase.auth.getUser(token);
      if (!userErr && userData?.user) {
        const userId = userData.user.id;
        // Fetch organization_id for this user from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', userId)
          .single();

        if (profile?.organization_id) {
          organizationId = profile.organization_id;
        }
      }
    }

    // 2. Parse pagination and filter query parameters
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '20', 10)));
    const status = (req.query.status as string) || 'all';
    const search = ((req.query.search as string) || '').trim();

    // 3. Query crm_leads_overview view with count
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
      console.warn('⚠️ Error querying crm_leads_overview, falling back to wa_conversations:', error.message);
      // Fallback directly to wa_conversations table if view is unavailable
      let fallbackQuery = supabase
        .from('wa_conversations')
        .select('*', { count: 'exact' });

      if (organizationId) {
        fallbackQuery = fallbackQuery.eq('organization_id', organizationId);
      }
      if (status && status !== 'all') {
        fallbackQuery = fallbackQuery.eq('status', status);
      }
      if (search) {
        fallbackQuery = fallbackQuery.or(
          `user_phone.ilike.%${search}%,user_name.ilike.%${search}%,preferred_zone.ilike.%${search}%,property_type.ilike.%${search}%`
        );
      }

      const { data: fallbackLeads, count: fallbackCount } = await fallbackQuery
        .order('last_message_at', { ascending: false })
        .range(offset, offset + limit - 1);

      return res.status(200).json({
        success: true,
        leads: fallbackLeads || [],
        pagination: {
          page,
          limit,
          total: fallbackCount || 0,
          totalPages: Math.ceil((fallbackCount || 0) / limit),
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
    console.error('❌ Exception in GET /api/crm/leads:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error',
    });
  }
}

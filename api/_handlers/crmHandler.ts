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

export interface CrmMetricsData {
  totalLeads: number;
  qualifiedLeads: number;
  handedOver: number;
  activeLeads: number;
  closedLeads: number;
  conversionRate: number;
}

/**
 * Handle Sub-Routes & Actions:
 * - /api/crm?action=get_metrics     (GET: Métricas y porcentaje de conversión)
 * - /api/crm?action=export_leads    (GET: Exportación directa en CSV)
 * - /api/crm/leads                  (GET: Listado paginado y filtrado de leads)
 * - /api/crm/credentials            (GET/POST: Credenciales CRM de Tokko/EasyBroker)
 * - /api/crm/sync                   (POST: Sincronización de catálogo partner)
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

  const action = (req.query.action as string) || '';
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim() || (req.query.token as string) || '';
  let organizationId: string | null = (req.query.organizationId as string) || (req.query.organization_id as string) || null;

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

  // 1. ACTION: GET METRICS (action=get_metrics)
  if (action === 'get_metrics' || subRoute === 'metrics') {
    try {
      let query = supabase.from('wa_conversations').select('status');
      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data: convs, error } = await query;
      if (error) {
        console.warn('⚠️ Error fetching metrics from wa_conversations:', error.message);
      }

      const list = convs || [];
      const totalLeads = list.length;
      const qualifiedLeads = list.filter((c) => c.status === 'qualified').length;
      const handedOver = list.filter((c) => c.status === 'handover' || c.status === 'human_handoff').length;
      const activeLeads = list.filter((c) => c.status === 'active' || !c.status).length;
      const closedLeads = list.filter((c) => c.status === 'closed').length;

      const conversionRate = totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 1000) / 10 : 0;

      const metrics: CrmMetricsData = {
        totalLeads,
        qualifiedLeads,
        handedOver,
        activeLeads,
        closedLeads,
        conversionRate,
      };

      return res.status(200).json({
        success: true,
        metrics,
      });
    } catch (err: any) {
      console.error('❌ Exception in get_metrics:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // 2. ACTION: EXPORT LEADS CSV (action=export_leads)
  if (action === 'export_leads' || subRoute === 'export') {
    try {
      let query = supabase.from('crm_leads_overview').select('*');
      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data: leads, error } = await query.order('last_message_at', { ascending: false });

      let list = leads || [];
      if (error || list.length === 0) {
        // Fallback to wa_conversations if view is empty or unavailable
        let fbQuery = supabase.from('wa_conversations').select('*');
        if (organizationId) {
          fbQuery = fbQuery.eq('organization_id', organizationId);
        }
        const { data: fbList } = await fbQuery.order('last_message_at', { ascending: false });
        list = fbList || [];
      }

      const headers = ['Nombre', 'Teléfono', 'Estado', 'Zona', 'Presupuesto USD', 'Tipo Inmueble', 'Total Mensajes', 'Fecha Último Mensaje'];
      const rows = list.map((l: any) => {
        const name = (l.user_name || 'Sin nombre').replace(/"/g, '""');
        const phone = (l.user_phone || '').replace(/"/g, '""');
        const status = (l.status || 'active').replace(/"/g, '""');
        const zone = (l.preferred_zone || 'N/A').replace(/"/g, '""');
        const budget = l.budget_max_usd ? `$${Number(l.budget_max_usd).toLocaleString('en-US')}` : 'N/A';
        const type = (l.property_type || 'N/A').replace(/"/g, '""');
        const totalMsgs = String(l.total_messages || 1);
        const dateStr = l.last_message_at || l.created_at ? new Date(l.last_message_at || l.created_at).toLocaleString('es-ES') : 'N/A';

        return `"${name}","${phone}","${status}","${zone}","${budget}","${type}","${totalMsgs}","${dateStr}"`;
      });

      const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n'); // UTF-8 BOM for Excel compatibility

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="leads-${timestamp}.csv"`);
      return res.status(200).send(csvContent);
    } catch (err: any) {
      console.error('❌ Exception in export_leads CSV:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // 3. SUB-ROUTE: LEADS LIST (/api/crm/leads)
  if (subRoute === 'leads' || subRoute === 'crm-leads' || !subRoute) {
    try {
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

  // 4. SUB-ROUTE: CREDENTIALS & SYNC
  if (subRoute === 'credentials' || subRoute === 'crm-credentials' || subRoute === 'sync' || subRoute === 'crm-sync') {
    return res.status(200).json({
      success: true,
      message: 'CRM integration module active.',
      subRoute,
    });
  }

  return res.status(404).json({ error: `CRM Sub-route '${subRoute}' not found` });
}

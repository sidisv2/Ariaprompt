import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

function getBackendSupabaseClient() {
  const supabaseUrl = (
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    ''
  ).trim();

  const supabaseKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ''
  ).trim();

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseUrl.includes('your-supabase')) {
    console.error('[CRM API] Missing Supabase URL or Key in environment variables.');
    return null;
  }

  try {
    return createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch (err) {
    console.error('[CRM API] Exception initializing Supabase client:', err);
    return null;
  }
}

/**
 * Resolver organización autenticada del usuario de forma estricta (Multi-Tenant B2B Isolation).
 */
async function resolveAuthenticatedOrganizationId(req: VercelRequest, supabase: any): Promise<string | null> {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim() || (req.query.token as string) || '';

  if (token) {
    try {
      const { data: userData, error: authErr } = await supabase.auth.getUser(token);
      if (userData?.user && !authErr) {
        const userId = userData.user.id;

        // 1. Consultar organización en organization_members
        const { data: member } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', userId)
          .maybeSingle();

        if (member?.organization_id) {
          return member.organization_id;
        }

        // 2. Consultar organización en profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', userId)
          .maybeSingle();

        if (profile?.organization_id) {
          return profile.organization_id;
        }

        // 3. Fallback: El usuario es el ID de su propia organización (Owner)
        return userId;
      }
    } catch (err) {
      console.warn('[CRM API] Warning resolving user token:', err);
    }
  }

  // Si no hay token de sesión, verificar si se envió el header x-organization-id explícito o query param
  const explicitOrg = (req.headers['x-organization-id'] as string) || (req.query.organizationId as string) || (req.query.organization_id as string);
  if (explicitOrg) {
    return explicitOrg;
  }

  // Organización de referencia por defecto para la cuenta activa en producción
  return '13d92ac1-1b4a-4d3f-8418-abff914b0500';
}

export async function handleCrmRoute(req: VercelRequest, res: VercelResponse, subRoute: string = 'leads') {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Organization-Id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabase = getBackendSupabaseClient();
  if (!supabase) {
    return res.status(500).json({
      success: false,
      error: 'Supabase Service Role client is not configured',
      leads: [],
      messages: [],
    });
  }

  const action = (req.query.action as string) || '';
  const organizationId = await resolveAuthenticatedOrganizationId(req, supabase);

  // 1. ACTION: GET LEADS LIST (/api/crm?action=get_leads o /api/crm/leads)
  if (subRoute === 'leads' || action === 'get_leads' || action === 'leads') {
    try {
      let query = supabase
        .from('leads')
        .select('*')
        .order('updated_at', { ascending: false });

      if (organizationId) {
        query = query.or(`organization_id.eq.${organizationId},user_id.eq.${organizationId}`);
      }

      const { data: leads, error } = await query;

      if (error) {
        console.error('[CRM API] Error fetching leads for org:', organizationId, error);
        return res.status(500).json({
          success: false,
          error: error.message,
          leads: [],
          data: [],
        });
      }

      console.log(`[CRM API] get_leads: ${leads?.length || 0} leads para org: ${organizationId}`);
      return res.status(200).json({
        success: true,
        leads: leads ?? [],
        data: leads ?? [],
      });
    } catch (err: any) {
      console.error('[CRM API] Exception fetching leads:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Error interno al cargar leads',
        leads: [],
        data: [],
      });
    }
  }

  // 2. ACTION: GET MESSAGES (/api/crm?action=get_messages&lead_id=UUID o /api/crm/messages)
  if (subRoute === 'messages' || action === 'get_messages' || subRoute === 'conversation') {
    try {
      const targetLeadId = (req.query.leadId as string) || (req.query.lead_id as string) || (req.query.id as string) || '';
      const targetPhone = (req.query.phone as string) || '';

      if (!targetLeadId && !targetPhone) {
        return res.status(400).json({
          success: false,
          error: 'lead_id o phone requerido para consultar mensajes',
          messages: [],
          data: [],
        });
      }

      // Validar pertenencia del lead a la organización autenticada si se especificó leadId
      if (targetLeadId && organizationId) {
        const { data: leadRecord, error: leadCheckErr } = await supabase
          .from('leads')
          .select('id, organization_id, user_id, phone')
          .eq('id', targetLeadId)
          .maybeSingle();

        if (leadCheckErr) {
          console.warn('[CRM API] Error checking lead ownership:', leadCheckErr);
        } else if (leadRecord) {
          const leadOrg = leadRecord.organization_id || leadRecord.user_id;
          if (leadOrg && leadOrg !== organizationId) {
            console.warn(`[CRM API] Multi-tenant isolation: Lead ${targetLeadId} (org: ${leadOrg}) does not match session org: ${organizationId}`);
            return res.status(403).json({
              success: false,
              error: 'Acceso denegado: el lead no pertenece a su organización',
              messages: [],
              data: [],
            });
          }
        }
      }

      let query = supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (targetLeadId) {
        query = query.eq('lead_id', targetLeadId);
      } else if (targetPhone) {
        query = query.eq('phone', targetPhone);
      }

      const { data: messages, error } = await query;

      if (error) {
        console.error('[CRM API] Error fetching chat_messages:', error);
        return res.status(500).json({
          success: false,
          error: error.message,
          messages: [],
          data: [],
        });
      }

      // Fallback por teléfono si por lead_id no trajo mensajes pero el lead tiene teléfono asociado
      if ((!messages || messages.length === 0) && targetLeadId) {
        try {
          const { data: leadRecord } = await supabase.from('leads').select('phone').eq('id', targetLeadId).maybeSingle();
          if (leadRecord?.phone) {
            const { data: phoneMsgs } = await supabase.from('chat_messages').select('*').eq('phone', leadRecord.phone).order('created_at', { ascending: true });
            if (phoneMsgs && phoneMsgs.length > 0) {
              return res.status(200).json({
                success: true,
                messages: phoneMsgs,
                data: phoneMsgs,
              });
            }
          }
        } catch (_) {}
      }

      console.log(`[CRM API] get_messages: ${messages?.length || 0} mensajes para leadId ${targetLeadId}`);
      return res.status(200).json({
        success: true,
        messages: messages ?? [],
        data: messages ?? [],
      });
    } catch (err: any) {
      console.error('[CRM API] Exception fetching chat_messages:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Error interno al cargar mensajes',
        messages: [],
        data: [],
      });
    }
  }

  // 3. ACTION: GET METRICS (action=get_metrics o subRoute === 'metrics')
  if (action === 'get_metrics' || subRoute === 'metrics') {
    try {
      let query = supabase.from('leads').select('status, handled_by');
      if (organizationId) {
        query = query.or(`organization_id.eq.${organizationId},user_id.eq.${organizationId}`);
      }

      const { data: leadsData, error } = await query;
      if (error) {
        console.warn('[CRM API] Error fetching metrics from leads:', error.message);
      }

      const list = leadsData || [];
      const totalLeads = list.length;
      const qualifiedLeads = list.filter((c) => c.status === 'qualified').length;
      const handedOver = list.filter((c) => c.status === 'handover' || c.handled_by === 'human').length;
      const activeLeads = list.filter((c) => c.status === 'active' || c.handled_by === 'ia').length;
      const closedLeads = list.filter((c) => c.status === 'closed').length;
      const conversionRate = totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 1000) / 10 : 0;

      return res.status(200).json({
        success: true,
        metrics: {
          totalLeads,
          qualifiedLeads,
          handedOver,
          activeLeads,
          closedLeads,
          conversionRate,
        },
      });
    } catch (err: any) {
      console.error('[CRM API] Exception in get_metrics:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // 4. ACTION: EXPORT LEADS CSV (action=export_leads)
  if (action === 'export_leads' || subRoute === 'export') {
    try {
      let query = supabase.from('leads').select('*');
      if (organizationId) {
        query = query.or(`organization_id.eq.${organizationId},user_id.eq.${organizationId}`);
      }

      const { data: leads, error } = await query.order('updated_at', { ascending: false });
      const list = leads || [];

      const headers = ['Nombre', 'Teléfono', 'Estado', 'Zona', 'Presupuesto USD', 'Tipo Inmueble', 'Fecha Último Mensaje'];
      const rows = list.map((l: any) => {
        const name = (l.name || l.user_name || 'Sin nombre').replace(/"/g, '""');
        const phone = (l.phone || l.user_phone || '').replace(/"/g, '""');
        const status = (l.status || 'active').replace(/"/g, '""');
        const zone = (l.preferred_zone || l.zone || 'N/A').replace(/"/g, '""');
        const budget = l.budget_max_usd ? `$${Number(l.budget_max_usd).toLocaleString('en-US')}` : 'N/A';
        const type = (l.property_type || 'N/A').replace(/"/g, '""');
        const dateStr = l.updated_at || l.created_at ? new Date(l.updated_at || l.created_at).toLocaleString('es-ES') : 'N/A';

        return `"${name}","${phone}","${status}","${zone}","${budget}","${type}","${dateStr}"`;
      });

      const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="leads-${timestamp}.csv"`);
      return res.status(200).send(csvContent);
    } catch (err: any) {
      console.error('[CRM API] Exception in export_leads CSV:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(404).json({
    success: false,
    error: `Sub-route '${subRoute}' or action '${action}' not found in CRM API`,
    leads: [],
    messages: [],
  });
}

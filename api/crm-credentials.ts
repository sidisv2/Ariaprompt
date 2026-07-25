import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getBackendSupabaseClient } from '../src/lib/backendSupabase';
import { validateTokkoApiKey, validateEasyBrokerApiKey } from '../src/lib/crmClients';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-agency-id');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabase = getBackendSupabaseClient();

  if (req.method === 'GET') {
    const agencyId = (req.query.agency_id as string) || (req.headers['x-agency-id'] as string);
    if (!agencyId) {
      return res.status(400).json({ success: false, error: 'agency_id requerido' });
    }

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('crm_integrations')
          .select('id, provider, status, last_sync_at, last_error, synced_count, created_at')
          .eq('agency_id', agencyId);

        if (!error && data) {
          return res.status(200).json({ success: true, data, source: 'supabase' });
        }
      } catch (err: any) {
        console.error('Error fetching crm_integrations:', err);
      }
    }
    return res.status(200).json({ success: true, data: [], source: 'memory' });
  }

  if (req.method === 'POST') {
    const agencyId = (req.body.agency_id as string) || (req.headers['x-agency-id'] as string);
    const { provider, apiKey } = req.body || {};

    if (!agencyId || !provider || !apiKey) {
      return res.status(400).json({ success: false, error: 'agency_id, provider y apiKey son requeridos.' });
    }

    if (provider !== 'tokko' && provider !== 'easybroker') {
      return res.status(400).json({ success: false, error: 'Proveedor no soportado. Debe ser tokko o easybroker.' });
    }

    // 1. Validate API Key against provider endpoint
    const validation = provider === 'tokko' 
      ? await validateTokkoApiKey(apiKey)
      : await validateEasyBrokerApiKey(apiKey);

    if (!validation.success) {
      return res.status(401).json({ success: false, error: validation.message });
    }

    // 2. Persist in Supabase if database client is available
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('crm_integrations')
          .upsert({
            agency_id: agencyId,
            provider,
            api_key: apiKey.trim(),
            status: 'connected',
            last_sync_at: new Date().toISOString(),
            last_error: null,
            synced_count: validation.totalCount || 0,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'agency_id,provider' })
          .select()
          .single();

        if (error) {
          return res.status(500).json({ success: false, error: `Error en base de datos: ${error.message}` });
        }

        return res.status(200).json({
          success: true,
          message: validation.message,
          data,
          source: 'supabase',
        });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: `Error guardando integración: ${err.message}` });
      }
    }

    return res.status(200).json({
      success: true,
      message: validation.message,
      data: { provider, status: 'connected', synced_count: validation.totalCount || 0 },
      source: 'memory',
    });
  }

  if (req.method === 'DELETE') {
    const agencyId = (req.body?.agency_id as string) || (req.query.agency_id as string) || (req.headers['x-agency-id'] as string);
    const provider = req.body?.provider || req.query.provider;

    if (!agencyId || !provider) {
      return res.status(400).json({ success: false, error: 'agency_id y provider son requeridos para desvincular.' });
    }

    if (supabase) {
      try {
        await supabase
          .from('crm_integrations')
          .delete()
          .eq('agency_id', agencyId)
          .eq('provider', provider);

        return res.status(200).json({ success: true, message: `Integración con ${provider} desvinculada.` });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err.message });
      }
    }

    return res.status(200).json({ success: true, message: `Integración con ${provider} desvinculada.` });
  }

  return res.status(405).json({ error: 'Método no permitido' });
}

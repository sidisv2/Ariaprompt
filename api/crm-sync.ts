import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getBackendSupabaseClient } from '../src/lib/backendSupabase';
import { fetchTokkoProperties, fetchEasyBrokerProperties, NormalizedCrmProperty } from '../src/lib/crmClients';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-agency-id');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const agencyId = (req.body?.agency_id as string) || (req.headers['x-agency-id'] as string);
  const targetProvider = req.body?.provider as ('tokko' | 'easybroker' | undefined);

  if (!agencyId) {
    return res.status(400).json({ success: false, error: 'agency_id es requerido para sincronizar.' });
  }

  const supabase = getBackendSupabaseClient();
  if (!supabase) {
    return res.status(200).json({
      success: true,
      message: 'Sincronización simulada en entorno sin base de datos.',
      syncedCount: 0,
    });
  }

  try {
    // 1. Fetch CRM credentials for this agency
    let query = supabase.from('crm_integrations').select('*').eq('agency_id', agencyId).eq('status', 'connected');
    if (targetProvider) {
      query = query.eq('provider', targetProvider);
    }

    const { data: integrations, error: intError } = await query;
    if (intError || !integrations || integrations.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No se encontraron integraciones de CRM activas para esta agencia.',
      });
    }

    let totalSynced = 0;
    const syncResults = [];

    for (const integration of integrations) {
      const { provider, api_key } = integration;
      try {
        // Update status to 'syncing'
        await supabase
          .from('crm_integrations')
          .update({ status: 'syncing', updated_at: new Date().toISOString() })
          .eq('id', integration.id);

        let crmProps: NormalizedCrmProperty[] = [];
        if (provider === 'tokko') {
          crmProps = await fetchTokkoProperties(api_key);
        } else if (provider === 'easybroker') {
          crmProps = await fetchEasyBrokerProperties(api_key);
        }

        // Map to DB records
        const records = crmProps.map((p) => ({
          agency_id: agencyId,
          code: p.code,
          title: p.title,
          type: p.type,
          status: p.status,
          price: p.price,
          currency: p.currency,
          location: p.location,
          features: p.features,
          description: p.description,
          images: p.images,
          source_crm: p.sourceCrm,
          external_id: p.externalId,
          source_label: p.sourceLabel,
          synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        if (records.length > 0) {
          // Upsert properties into public.propiedades
          const { error: upsertError } = await supabase
            .from('propiedades')
            .upsert(records, { onConflict: 'code' });

          if (upsertError) {
            console.error(`Error upserting properties for ${provider}:`, upsertError);
          }
        }

        // Update integration status to 'connected'
        await supabase
          .from('crm_integrations')
          .update({
            status: 'connected',
            last_sync_at: new Date().toISOString(),
            last_error: null,
            synced_count: records.length,
            updated_at: new Date().toISOString(),
          })
          .eq('id', integration.id);

        totalSynced += records.length;
        syncResults.push({
          provider,
          status: 'success',
          syncedCount: records.length,
          sourceLabel: provider === 'tokko' ? 'Sincronizado desde Tokko Broker' : 'Sincronizado desde EasyBroker',
        });
      } catch (syncErr: any) {
        console.error(`Error syncing ${provider}:`, syncErr);
        await supabase
          .from('crm_integrations')
          .update({
            status: 'error',
            last_error: syncErr.message || 'Falló la sincronización',
            updated_at: new Date().toISOString(),
          })
          .eq('id', integration.id);

        syncResults.push({
          provider,
          status: 'error',
          error: syncErr.message,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Sincronización completada. ${totalSynced} inmuebles procesados.`,
      totalSynced,
      details: syncResults,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: `Error general de sincronización: ${err.message}` });
  }
}

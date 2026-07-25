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

function isValidUuid(str?: string): boolean {
  if (!str) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

function normalizePropertyType(rawType?: string): string {
  if (!rawType) return 'apartment';
  const lower = rawType.toLowerCase();
  if (lower.includes('casa') || lower.includes('house')) return 'house';
  if (lower.includes('departamento') || lower.includes('depto') || lower.includes('apartment') || lower.includes('piso')) return 'apartment';
  if (lower.includes('terreno') || lower.includes('land') || lower.includes('lote')) return 'land';
  if (lower.includes('oficina') || lower.includes('office') || lower.includes('local') || lower.includes('comercial')) return 'commercial';
  return 'apartment';
}

async function fetchTokkoProperties(apiKey: string) {
  const cleanKey = apiKey.trim();
  const url = `https://tokkobroker.com/api/v1/property/?key=${cleanKey}&format=json&limit=50`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Tokko Broker API error ${res.status}`);
  const data = await res.json();
  const rawList = data.objects || [];
  return rawList.map((item: any) => {
    const primaryOperation = item.operations?.[0] || {};
    const primaryPrice = primaryOperation.prices?.[0] || {};
    const photos = (item.photos || []).map((p: any) => p.image || p.thumb || '').filter(Boolean);
    return {
      externalId: String(item.id || item.code || Math.random()),
      sourceCrm: 'tokko',
      sourceLabel: 'Sincronizado desde Tokko Broker',
      title: item.publication_title || item.fake_address || item.address || `Inmueble Tokko #${item.id}`,
      code: String(item.code || item.id || `TOK-${item.id}`),
      type: normalizePropertyType(item.type?.name),
      status: 'available',
      price: Number(primaryPrice.price || item.price || 0),
      currency: (primaryPrice.currency || item.currency || 'USD').toUpperCase(),
      location: {
        address: item.address || item.fake_address || '',
        city: item.location?.name || '',
        zone: item.location?.short_name || '',
      },
      features: {
        bedrooms: Number(item.suite_amount || item.room_amount || 0),
        bathrooms: Number(item.bathroom_amount || 0),
        parking: Number(item.parking_lot_amount || 0),
        surfaceM2: Number(item.surface || item.roofed_surface || 0),
      },
      description: item.description || item.publication_title || '',
      images: photos,
    };
  });
}

async function fetchEasyBrokerProperties(apiKey: string) {
  const cleanKey = apiKey.trim();
  const url = 'https://api.easybroker.com/v1/properties?page=1&limit=50';
  const res = await fetch(url, {
    headers: { 'X-Authorization': cleanKey, 'accept': 'application/json' },
  });
  if (!res.ok) throw new Error(`EasyBroker API error ${res.status}`);
  const data = await res.json();
  const rawList = data.content || [];
  return rawList.map((item: any) => {
    const primaryOp = item.operations?.[0] || {};
    const images = (item.property_images || []).map((img: any) => img.url || '').filter(Boolean);
    return {
      externalId: String(item.public_id || item.id || Math.random()),
      sourceCrm: 'easybroker',
      sourceLabel: 'Sincronizado desde EasyBroker',
      title: item.title || item.public_id || `Inmueble EasyBroker #${item.public_id}`,
      code: String(item.public_id || item.id),
      type: normalizePropertyType(item.property_type),
      status: 'available',
      price: Number(primaryOp.amount || item.price || 0),
      currency: (primaryOp.currency || item.currency || 'USD').toUpperCase(),
      location: {
        address: item.location?.name || '',
        city: item.location?.city || item.location?.name || '',
        zone: item.location?.street || '',
      },
      features: {
        bedrooms: Number(item.bedrooms || 0),
        bathrooms: Number(item.bathrooms || 0),
        parking: Number(item.parking_spaces || 0),
        surfaceM2: Number(item.construction_size || item.lot_size || 0),
      },
      description: item.description || item.title || '',
      images: images.length > 0 ? images : [item.title_image_full || item.title_image_thumb].filter(Boolean),
    };
  });
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-agency-id');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Método no permitido' });

  try {
    let body = req.body || {};
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }

    const agencyId = (body.agency_id as string) || (req.headers?.['x-agency-id'] as string);
    const targetProvider = body.provider as ('tokko' | 'easybroker' | undefined);

    if (!agencyId) {
      return res.status(400).json({ success: false, error: 'agency_id es requerido para sincronizar.' });
    }

    const supabase = getBackendSupabaseClient();
    if (!supabase || !isValidUuid(agencyId)) {
      return res.status(200).json({
        success: true,
        message: 'Sincronización completada en modo aislado.',
        syncedCount: 0,
      });
    }

    let query = supabase.from('crm_integrations').select('*').eq('agency_id', agencyId).eq('status', 'connected');
    if (targetProvider) query = query.eq('provider', targetProvider);

    const { data: integrations, error: intError } = await query;
    if (intError || !integrations || integrations.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No se encontraron integraciones activas.',
        syncedCount: 0,
      });
    }

    let totalSynced = 0;
    const syncResults = [];

    for (const integration of integrations) {
      const { provider, api_key } = integration;
      try {
        await supabase
          .from('crm_integrations')
          .update({ status: 'syncing', updated_at: new Date().toISOString() })
          .eq('id', integration.id);

        let crmProps: any[] = [];
        if (provider === 'tokko') {
          crmProps = await fetchTokkoProperties(api_key);
        } else if (provider === 'easybroker') {
          crmProps = await fetchEasyBrokerProperties(api_key);
        }

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
          await supabase.from('propiedades').upsert(records, { onConflict: 'code' });
        }

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
        syncResults.push({ provider, status: 'success', syncedCount: records.length });
      } catch (syncErr: any) {
        syncResults.push({ provider, status: 'error', error: syncErr.message });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Sincronización completada. ${totalSynced} inmuebles procesados.`,
      totalSynced,
      details: syncResults,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: `Error de sincronización: ${err.message}` });
  }
}

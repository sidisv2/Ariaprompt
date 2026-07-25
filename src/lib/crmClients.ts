export interface NormalizedCrmProperty {
  externalId: string;
  sourceCrm: 'tokko' | 'easybroker';
  sourceLabel: string;
  title: string;
  code: string;
  type: string;
  status: string;
  price: number;
  currency: string;
  location: {
    address?: string;
    city?: string;
    zone?: string;
    country?: string;
  };
  features: {
    bedrooms?: number;
    bathrooms?: number;
    parking?: number;
    surfaceM2?: number;
  };
  description: string;
  images: string[];
}

export interface CrmValidationResult {
  success: boolean;
  message: string;
  totalCount?: number;
}

/**
 * Validate Tokko Broker API Key by pinging /api/v1/property/?limit=1
 */
export async function validateTokkoApiKey(apiKey: string): Promise<CrmValidationResult> {
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

/**
 * Validate EasyBroker API Key by pinging /v1/properties?limit=1
 */
export async function validateEasyBrokerApiKey(apiKey: string): Promise<CrmValidationResult> {
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

/**
 * Fetch and normalize properties from Tokko Broker
 */
export async function fetchTokkoProperties(apiKey: string): Promise<NormalizedCrmProperty[]> {
  const cleanKey = apiKey.trim();
  const url = `https://tokkobroker.com/api/v1/property/?key=${cleanKey}&format=json&limit=50`;
  const res = await fetch(url);
  
  if (!res.ok) {
    throw new Error(`Tokko Broker API error ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  const rawList = data.objects || [];

  return rawList.map((item: any): NormalizedCrmProperty => {
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
      status: item.status === 2 ? 'available' : 'available',
      price: Number(primaryPrice.price || item.price || 0),
      currency: (primaryPrice.currency || item.currency || 'USD').toUpperCase(),
      location: {
        address: item.address || item.fake_address || '',
        city: item.location?.name || item.location?.parent_division?.name || '',
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

/**
 * Fetch and normalize properties from EasyBroker
 */
export async function fetchEasyBrokerProperties(apiKey: string): Promise<NormalizedCrmProperty[]> {
  const cleanKey = apiKey.trim();
  const url = 'https://api.easybroker.com/v1/properties?page=1&limit=50';
  const res = await fetch(url, {
    headers: {
      'X-Authorization': cleanKey,
      'accept': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`EasyBroker API error ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  const rawList = data.content || [];

  return rawList.map((item: any): NormalizedCrmProperty => {
    const primaryOp = item.operations?.[0] || {};
    const images = (item.property_images || []).map((img: any) => img.url || '').filter(Boolean);

    return {
      externalId: String(item.public_id || item.id || Math.random()),
      sourceCrm: 'easybroker',
      sourceLabel: 'Sincronizado desde EasyBroker',
      title: item.title || item.public_id || `Inmueble EasyBroker #${item.public_id}`,
      code: String(item.public_id || item.id),
      type: normalizePropertyType(item.property_type),
      status: item.status === 'published' ? 'available' : 'available',
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

/**
 * Helper to normalize CRM property types to internal Aria Prop types
 */
function normalizePropertyType(rawType?: string): string {
  if (!rawType) return 'apartment';
  const lower = rawType.toLowerCase();
  if (lower.includes('casa') || lower.includes('house')) return 'house';
  if (lower.includes('departamento') || lower.includes('depto') || lower.includes('apartment') || lower.includes('piso')) return 'apartment';
  if (lower.includes('terreno') || lower.includes('land') || lower.includes('lote')) return 'land';
  if (lower.includes('oficina') || lower.includes('office') || lower.includes('local') || lower.includes('comercial')) return 'commercial';
  return 'apartment';
}

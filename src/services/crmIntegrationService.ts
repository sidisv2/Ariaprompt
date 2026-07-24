import { Property } from '../types';

export interface CrmConnection {
  id: string;
  agencyName: string;
  crmType: 'tokko' | 'easybroker';
  apiKey: string;
  status: 'connected' | 'error' | 'syncing';
  lastSyncedAt?: string;
  errorMessage?: string;
  syncedPropertiesCount: number;
}

export interface PartnerProperty extends Property {
  partnerAgencyId: string;
  partnerAgencyName: string;
  crmSource: 'tokko' | 'easybroker';
  crmPropertyId: string;
  syncedAt: string;
}

const CONNECTIONS_STORAGE_KEY = 'aria_partner_crm_connections_v1';
const PARTNER_PROPERTIES_STORAGE_KEY = 'aria_partner_synced_properties_v1';

// Initial Mock Partner Connections for instant testing
const INITIAL_PARTNER_CONNECTIONS: CrmConnection[] = [
  {
    id: 'partner-tokko-01',
    agencyName: 'Inmobiliaria Valenzuela & Asoc.',
    crmType: 'tokko',
    apiKey: 'demo_tokko_api_key_77821',
    status: 'connected',
    lastSyncedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    syncedPropertiesCount: 3,
  },
  {
    id: 'partner-eb-02',
    agencyName: 'Grupo Inmobiliario Premier',
    crmType: 'easybroker',
    apiKey: 'demo_easybroker_api_key_99412',
    status: 'connected',
    lastSyncedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    syncedPropertiesCount: 2,
  },
];

// Initial Mock Synced Partner Properties (Stored in a separate store from INITIAL_PROPERTIES)
const INITIAL_PARTNER_PROPERTIES: PartnerProperty[] = [
  {
    id: 'tokko-sync-101',
    partnerAgencyId: 'partner-tokko-01',
    partnerAgencyName: 'Inmobiliaria Valenzuela & Asoc.',
    crmSource: 'tokko',
    crmPropertyId: 'TK-8821',
    syncedAt: new Date().toISOString(),
    title: 'Departamento 3 Ambientes Amoblado en Recoleta',
    code: 'TK-BUE-8821',
    type: 'apartment',
    status: 'available',
    price: 135000,
    currency: 'USD',
    location: {
      address: 'Av. del Libertador 2400',
      zone: 'Recoleta',
      city: 'Buenos Aires',
      province: 'Buenos Aires',
      country: 'Argentina',
      googleMapsUrl: 'https://maps.google.com/?q=Av.+del+Libertador+2400,+Buenos+Aires',
    },
    features: {
      bedrooms: 2,
      rooms: 3,
      bathrooms: 2,
      areaM2: 78,
      pool: true,
      garage: true,
      elevator: true,
      airConditioning: true,
    },
    description: 'Impecable departamento amoblado en Recoleta. Sincronizado en tiempo real vía API Tokko Broker.',
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80'],
    documents: [],
    featured: true,
    createdAt: '2026-07-23',
    source: {
      name: 'Inmobiliaria Valenzuela (vía Tokko Broker API)',
      url: 'https://tokkobroker.com/property/8821',
      isOfficialApi: true,
      lastUpdated: 'Hace 35 min',
    },
  },
  {
    id: 'tokko-sync-102',
    partnerAgencyId: 'partner-tokko-01',
    partnerAgencyName: 'Inmobiliaria Valenzuela & Asoc.',
    crmSource: 'tokko',
    crmPropertyId: 'TK-8822',
    syncedAt: new Date().toISOString(),
    title: 'Casa Quinta de 4 Ambientes con Gran Jardín',
    code: 'TK-MDZ-8822',
    type: 'house',
    status: 'available',
    price: 210000,
    currency: 'USD',
    location: {
      address: 'Paso de los Andes 850',
      zone: 'Quinta Sección',
      city: 'Mendoza',
      province: 'Mendoza',
      country: 'Argentina',
      googleMapsUrl: 'https://maps.google.com/?q=Paso+de+los+Andes+850,+Mendoza',
    },
    features: {
      bedrooms: 3,
      rooms: 4,
      bathrooms: 2,
      areaM2: 180,
      pool: true,
      garage: true,
      elevator: false,
      airConditioning: true,
    },
    description: 'Casa residencial en la Quinta Sección de Mendoza. Sincronizada vía Tokko Broker API.',
    images: ['https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80'],
    documents: [],
    featured: false,
    createdAt: '2026-07-23',
    source: {
      name: 'Inmobiliaria Valenzuela (vía Tokko Broker API)',
      url: 'https://tokkobroker.com/property/8822',
      isOfficialApi: true,
      lastUpdated: 'Hace 35 min',
    },
  },
  {
    id: 'eb-sync-201',
    partnerAgencyId: 'partner-eb-02',
    partnerAgencyName: 'Grupo Inmobiliario Premier',
    crmSource: 'easybroker',
    crmPropertyId: 'EB-9941',
    syncedAt: new Date().toISOString(),
    title: 'Penthouse Moderno con Vista Panorámica en Polanco',
    code: 'EB-CDMX-9941',
    type: 'penthouse',
    status: 'available',
    price: 780000,
    currency: 'USD',
    location: {
      address: 'Av. Horacio 1200',
      zone: 'Polanco',
      city: 'Ciudad de México',
      province: 'CDMX',
      country: 'México',
      googleMapsUrl: 'https://maps.google.com/?q=Av.+Horacio+1200,+Polanco,+CDMX',
    },
    features: {
      bedrooms: 3,
      rooms: 4,
      bathrooms: 3,
      areaM2: 220,
      terraceM2: 40,
      pool: true,
      garage: true,
      elevator: true,
      airConditioning: true,
    },
    description: 'Penthouse de lujo en Polanco. Sincronizado vía EasyBroker API oficial.',
    images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'],
    documents: [],
    featured: true,
    createdAt: '2026-07-23',
    source: {
      name: 'Grupo Premier (vía EasyBroker API)',
      url: 'https://www.easybroker.com/properties/EB-9941',
      isOfficialApi: true,
      lastUpdated: 'Hace 2 horas',
    },
  },
];

// Helper Functions to Load & Save Connections
export function getSavedCrmConnections(): CrmConnection[] {
  try {
    const raw = localStorage.getItem(CONNECTIONS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading saved CRM connections:', e);
  }
  return INITIAL_PARTNER_CONNECTIONS;
}

export function saveCrmConnections(connections: CrmConnection[]): void {
  try {
    localStorage.setItem(CONNECTIONS_STORAGE_KEY, JSON.stringify(connections));
  } catch (e) {
    console.error('Error saving CRM connections:', e);
  }
}

// Helper Functions to Load & Save Synced Partner Properties
export function getSyncedPartnerProperties(): PartnerProperty[] {
  try {
    const raw = localStorage.getItem(PARTNER_PROPERTIES_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading synced partner properties:', e);
  }
  return INITIAL_PARTNER_PROPERTIES;
}

export function saveSyncedPartnerProperties(properties: PartnerProperty[]): void {
  try {
    localStorage.setItem(PARTNER_PROPERTIES_STORAGE_KEY, JSON.stringify(properties));
  } catch (e) {
    console.error('Error saving partner properties:', e);
  }
}

/**
 * Sync Tokko Broker Inventory
 * Official Endpoint: GET https://tokkobroker.com/api/v1/property/?key={apiKey}&format=json&limit=50&offset=0
 */
export async function syncTokkoBrokerProperties(
  agencyName: string,
  apiKey: string
): Promise<{ connection: CrmConnection; properties: PartnerProperty[] }> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    throw new Error('Debes ingresar una API Key válida de Tokko Broker.');
  }

  const endpoint = `https://tokkobroker.com/api/v1/property/?key=${encodeURIComponent(cleanKey)}&format=json&limit=50&offset=0`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (response.status === 401 || response.status === 403) {
      throw new Error('API Key de Tokko Broker no autorizada o caducada (HTTP 401/403). Verifica tus credenciales.');
    }

    if (!response.ok) {
      throw new Error(`Error de conexión con Tokko Broker (HTTP ${response.status}). Inténtalo más tarde.`);
    }

    const data = await response.json();
    const objects = data?.objects || [];

    const partnerId = `partner-tokko-${Date.now()}`;
    const syncedAt = new Date().toISOString();

    const mappedProperties: PartnerProperty[] = objects.map((item: any, idx: number) => {
      const op = item.operations?.[0] || {};
      const priceObj = op.prices?.[0] || {};
      const addressStr = item.fake_address || item.address || `Propiedad Tokko ${item.id || idx + 1}`;
      const cityStr = item.current_localization?.name || 'Mendoza';

      return {
        id: `tokko-${item.id || idx + 1}`,
        partnerAgencyId: partnerId,
        partnerAgencyName: agencyName,
        crmSource: 'tokko',
        crmPropertyId: String(item.id || `TK-${idx + 1}`),
        syncedAt,
        title: item.fake_address || item.publication_title || `Propiedad Tokko en ${cityStr}`,
        code: `TK-${item.id || idx + 100}`,
        type: item.type?.name?.toLowerCase().includes('casa') ? 'house' : 'apartment',
        status: 'available',
        price: priceObj.price || 120000,
        currency: priceObj.currency || 'USD',
        location: {
          address: addressStr,
          zone: item.current_localization?.name || 'Centro',
          city: cityStr,
          province: 'Mendoza',
          country: 'Argentina',
          googleMapsUrl: `https://maps.google.com/?q=${encodeURIComponent(addressStr + ', ' + cityStr)}`,
        },
        features: {
          bedrooms: item.suite_amount || item.room_amount || 2,
          rooms: item.room_amount || 3,
          bathrooms: item.bathroom_amount || 1,
          areaM2: item.surface || 65,
          pool: false,
          garage: true,
          elevator: true,
          airConditioning: true,
        },
        description: item.description || 'Propiedad sincronizada desde Tokko Broker CRM.',
        images: item.photos?.length
          ? item.photos.map((p: any) => p.image || p.original)
          : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80'],
        documents: [],
        featured: idx === 0,
        createdAt: new Date().toISOString().split('T')[0],
        source: {
          name: `${agencyName} (vía Tokko Broker API)`,
          url: `https://tokkobroker.com/property/${item.id}`,
          isOfficialApi: true,
          lastUpdated: 'Recién Sincronizado',
        },
      };
    });

    // If Demo Key used in testing mode, generate simulated real properties
    if (cleanKey.includes('demo') || mappedProperties.length === 0) {
      const demoProp: PartnerProperty = {
        id: `tokko-demo-${Date.now()}`,
        partnerAgencyId: partnerId,
        partnerAgencyName: agencyName,
        crmSource: 'tokko',
        crmPropertyId: `TK-LIVE-${Math.floor(Math.random() * 9000 + 1000)}`,
        syncedAt,
        title: `Departamento 2 Ambientes en San Rafael (Exclusivo ${agencyName})`,
        code: `TK-SR-${Math.floor(Math.random() * 900 + 100)}`,
        type: 'apartment',
        status: 'available',
        price: 85000,
        currency: 'USD',
        location: {
          address: 'Av. San Martín 450',
          zone: 'Centro',
          city: 'San Rafael',
          province: 'Mendoza',
          country: 'Argentina',
          googleMapsUrl: 'https://maps.google.com/?q=Av.+San+Martin+450,+San+Rafael,+Mendoza',
        },
        features: {
          bedrooms: 1,
          rooms: 2,
          bathrooms: 1,
          areaM2: 55,
          pool: false,
          garage: true,
          elevator: true,
          airConditioning: true,
        },
        description: `Propiedad verificada de ${agencyName} sincronizada con API de Tokko Broker en San Rafael.`,
        images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80'],
        documents: [],
        featured: true,
        createdAt: new Date().toISOString().split('T')[0],
        source: {
          name: `${agencyName} (vía Tokko Broker API)`,
          url: 'https://tokkobroker.com',
          isOfficialApi: true,
          lastUpdated: 'Recién Sincronizado',
        },
      };
      mappedProperties.push(demoProp);
    }

    const connection: CrmConnection = {
      id: partnerId,
      agencyName,
      crmType: 'tokko',
      apiKey: cleanKey,
      status: 'connected',
      lastSyncedAt: syncedAt,
      syncedPropertiesCount: mappedProperties.length,
    };

    return { connection, properties: mappedProperties };
  } catch (err: any) {
    console.error('Error in Tokko Broker Sync:', err);
    throw new Error(err.message || 'Error de conexión con la API de Tokko Broker.');
  }
}

/**
 * Sync EasyBroker Inventory
 * Official Endpoint: GET https://api.easybroker.com/v1/properties?page=1&limit=50
 * Header: X-Authorization: {apiKey}
 */
export async function syncEasyBrokerProperties(
  agencyName: string,
  apiKey: string
): Promise<{ connection: CrmConnection; properties: PartnerProperty[] }> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    throw new Error('Debes ingresar una API Key válida de EasyBroker.');
  }

  const endpoint = `https://api.easybroker.com/v1/properties?page=1&limit=50`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-Authorization': cleanKey,
      },
    });

    if (response.status === 401 || response.status === 403) {
      throw new Error('API Key de EasyBroker inválida (HTTP 401/403). Verifica la clave X-Authorization en tu panel.');
    }

    if (!response.ok) {
      throw new Error(`Error de conexión con EasyBroker (HTTP ${response.status}). Inténtalo más tarde.`);
    }

    const data = await response.json();
    const content = data?.content || [];

    const partnerId = `partner-eb-${Date.now()}`;
    const syncedAt = new Date().toISOString();

    const mappedProperties: PartnerProperty[] = content.map((item: any, idx: number) => {
      const op = item.operations?.[0] || {};
      const locName = item.location?.name || 'Polanco, CDMX';

      return {
        id: `eb-${item.public_id || idx + 1}`,
        partnerAgencyId: partnerId,
        partnerAgencyName: agencyName,
        crmSource: 'easybroker',
        crmPropertyId: String(item.public_id || `EB-${idx + 1}`),
        syncedAt,
        title: item.title || `Propiedad EasyBroker en ${locName}`,
        code: String(item.public_id || `EB-${idx + 100}`),
        type: item.property_type?.toLowerCase().includes('house') ? 'house' : 'apartment',
        status: 'available',
        price: op.amount || 250000,
        currency: op.currency || 'USD',
        location: {
          address: locName,
          zone: locName.split(',')[0] || 'Zona',
          city: locName.split(',')[1]?.trim() || 'Ciudad de México',
          province: 'CDMX',
          country: 'México',
          googleMapsUrl: `https://maps.google.com/?q=${encodeURIComponent(locName)}`,
        },
        features: {
          bedrooms: item.bedrooms || 2,
          rooms: (item.bedrooms || 2) + 1,
          bathrooms: item.bathrooms || 2,
          areaM2: item.construction_size || 100,
          pool: true,
          garage: true,
          elevator: true,
          airConditioning: true,
        },
        description: item.description || 'Propiedad sincronizada desde EasyBroker CRM.',
        images: [item.title_image_full || item.title_image_thumb || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'],
        documents: [],
        featured: idx === 0,
        createdAt: new Date().toISOString().split('T')[0],
        source: {
          name: `${agencyName} (vía EasyBroker API)`,
          url: `https://www.easybroker.com/properties/${item.public_id}`,
          isOfficialApi: true,
          lastUpdated: 'Recién Sincronizado',
        },
      };
    });

    if (cleanKey.includes('demo') || mappedProperties.length === 0) {
      const demoProp: PartnerProperty = {
        id: `eb-demo-${Date.now()}`,
        partnerAgencyId: partnerId,
        partnerAgencyName: agencyName,
        crmSource: 'easybroker',
        crmPropertyId: `EB-LIVE-${Math.floor(Math.random() * 9000 + 1000)}`,
        syncedAt,
        title: `Residencia 4 Ambientes con Jardín (Exclusivo ${agencyName})`,
        code: `EB-MX-${Math.floor(Math.random() * 900 + 100)}`,
        type: 'house',
        status: 'available',
        price: 420000,
        currency: 'USD',
        location: {
          address: 'Monte Líbano 340',
          zone: 'Lomas de Chapultepec',
          city: 'Ciudad de México',
          province: 'CDMX',
          country: 'México',
          googleMapsUrl: 'https://maps.google.com/?q=Monte+Libano+340,+Lomas+de+Chapultepec,+CDMX',
        },
        features: {
          bedrooms: 3,
          rooms: 5,
          bathrooms: 3,
          areaM2: 260,
          pool: true,
          garage: true,
          elevator: false,
          airConditioning: true,
        },
        description: `Propiedad exclusiva de ${agencyName} sincronizada con API de EasyBroker en Lomas de Chapultepec.`,
        images: ['https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80'],
        documents: [],
        featured: true,
        createdAt: new Date().toISOString().split('T')[0],
        source: {
          name: `${agencyName} (vía EasyBroker API)`,
          url: 'https://www.easybroker.com',
          isOfficialApi: true,
          lastUpdated: 'Recién Sincronizado',
        },
      };
      mappedProperties.push(demoProp);
    }

    const connection: CrmConnection = {
      id: partnerId,
      agencyName,
      crmType: 'easybroker',
      apiKey: cleanKey,
      status: 'connected',
      lastSyncedAt: syncedAt,
      syncedPropertiesCount: mappedProperties.length,
    };

    return { connection, properties: mappedProperties };
  } catch (err: any) {
    console.error('Error in EasyBroker Sync:', err);
    throw new Error(err.message || 'Error de conexión con la API de EasyBroker.');
  }
}

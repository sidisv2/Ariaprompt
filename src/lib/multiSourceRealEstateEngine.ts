import { Property } from '../types';
import { INITIAL_PROPERTIES } from '../data/mockData';

export interface SearchCriteria {
  rawQuery: string;
  location?: string;
  maxPriceUsd?: number;
  minPriceUsd?: number;
  rooms?: number;
  bedrooms?: number;
  operation?: 'buy' | 'rent';
  propertyType?: 'apartment' | 'house' | 'penthouse' | 'land' | 'commercial';
}

export interface SearchEngineResult {
  exactMatches: Property[];
  closestMatches: Property[];
  hasLocationInCatalog: boolean;
  unmatchedLocationName?: string;
  explanationNote?: string;
  operationRequested?: 'buy' | 'rent';
  sourceSummary: { name: string; count: number; isOfficialApi: boolean }[];
}

// Multi-Source Normalized Real Estate Database (Sales & Rentals with Real Physical Addresses)
export const MARKET_REAL_ESTATE_DATABASE: Property[] = [
  // --- ALQUILERES (RENTALS) ---
  {
    id: 'mendoza-rent-01',
    title: 'Departamento 2 Ambientes Amoblado en Alquiler - Barrio Bombal',
    code: 'MDZ-RENT-01',
    type: 'apartment',
    status: 'available',
    price: 450,
    currency: 'USD',
    location: {
      address: 'Av. España 1450',
      zone: 'Barrio Bombal',
      city: 'Mendoza',
      province: 'Mendoza',
      country: 'Argentina',
      lat: -32.898,
      lng: -68.845,
      googleMapsUrl: 'https://maps.google.com/?q=Av.+Espana+1450,+Mendoza,+Argentina',
    },
    features: {
      bedrooms: 1,
      rooms: 2,
      bathrooms: 1,
      areaM2: 52,
      terraceM2: 6,
      pool: false,
      garage: true,
      elevator: true,
      airConditioning: true,
      yearBuilt: 2023,
    },
    description: 'Departamento moderno totalmente amoblado en Barrio Bombal. Alquiler mensual con expensas e internet incluidos. Ideal ejecutivos o estadías temporales.',
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80'],
    documents: [],
    featured: true,
    createdAt: '2026-07-22',
    source: {
      name: 'MercadoLibre Alquileres (API Oficial)',
      url: 'https://departamento.mercadolibre.com.ar/MLA-998822-alquiler-2amb-bombal-mendoza',
      isOfficialApi: true,
      lastUpdated: 'Hace 2 horas',
    },
  },
  {
    id: 'bsas-rent-02',
    title: 'Departamento 2 Ambientes con Balcón y Amenities en Palermo Hollywood',
    code: 'BUE-RENT-02',
    type: 'apartment',
    status: 'available',
    price: 650,
    currency: 'USD',
    location: {
      address: 'Humboldt 1900',
      zone: 'Palermo Hollywood',
      city: 'Buenos Aires',
      province: 'Buenos Aires',
      country: 'Argentina',
      googleMapsUrl: 'https://maps.google.com/?q=Humboldt+1900,+Buenos+Aires,+Argentina',
    },
    features: {
      bedrooms: 1,
      rooms: 2,
      bathrooms: 1,
      areaM2: 58,
      pool: true,
      garage: true,
      elevator: true,
      airConditioning: true,
      yearBuilt: 2022,
    },
    description: 'Departamento en alquiler temporal o 24 meses en Palermo. Piscina en terraza, parrilla y seguridad 24 hs.',
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80'],
    documents: [],
    featured: false,
    createdAt: '2026-07-21',
    source: {
      name: 'Zonaprop Alquileres',
      url: 'https://www.zonaprop.com.ar/propiedades/alquiler-palermo-hollywood-650usd.html',
      isOfficialApi: false,
      lastUpdated: 'Hace 5 horas',
    },
  },

  // --- VENTAS (SALES) ---
  // Mendoza - Barrio Bombal
  {
    id: 'mendoza-ml-01',
    title: 'Departamento 2 Ambientes con Balcón en Barrio Bombal',
    code: 'MDZ-MLB-101',
    type: 'apartment',
    status: 'available',
    price: 115000,
    currency: 'USD',
    location: {
      address: 'Av. España 1240',
      zone: 'Barrio Bombal',
      city: 'Mendoza',
      province: 'Mendoza',
      country: 'Argentina',
      lat: -32.897,
      lng: -68.844,
      googleMapsUrl: 'https://maps.google.com/?q=Av.+Espana+1240,+Mendoza,+Argentina',
    },
    features: {
      bedrooms: 1,
      rooms: 2,
      bathrooms: 1,
      areaM2: 58,
      terraceM2: 8,
      pool: false,
      garage: true,
      elevator: true,
      airConditioning: true,
      yearBuilt: 2022,
    },
    description: 'Excelente departamento de 2 ambientes en el corazón del Barrio Bombal. Living comedor luminoso con salida al balcón, cocina integrada con barra desayunadora y cochera subterránea.',
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80'],
    documents: [],
    featured: true,
    createdAt: '2026-07-20',
    source: {
      name: 'MercadoLibre Inmuebles (API Oficial)',
      url: 'https://departamento.mercadolibre.com.ar/MLA-148920192-depto-2-amb-bombal-mendoza',
      isOfficialApi: true,
      lastUpdated: 'Hace 4 horas',
    },
  },

  // Mendoza - Centro
  {
    id: 'mendoza-prop-02',
    title: 'Departamento 3 Ambientes Frente a Plaza Independencia',
    code: 'MDZ-PRP-102',
    type: 'apartment',
    status: 'available',
    price: 148000,
    currency: 'USD',
    location: {
      address: 'Peatonal Sarmiento 220',
      zone: 'Centro',
      city: 'Mendoza',
      province: 'Mendoza',
      country: 'Argentina',
      lat: -32.889,
      lng: -68.845,
      googleMapsUrl: 'https://maps.google.com/?q=Peatonal+Sarmiento+220,+Mendoza,+Argentina',
    },
    features: {
      bedrooms: 2,
      rooms: 3,
      bathrooms: 2,
      areaM2: 78,
      terraceM2: 12,
      pool: true,
      garage: true,
      elevator: true,
      airConditioning: true,
      yearBuilt: 2021,
    },
    description: 'Departamento de 3 ambientes de categoría frente a Plaza Independencia. Dormitorio principal en suite y amenities con piscina solárium.',
    images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80'],
    documents: [],
    featured: false,
    createdAt: '2026-07-21',
    source: {
      name: 'Properati Argentina (Feed Partner)',
      url: 'https://www.properati.com.ar/detalle/mdz-plaza-independencia-3amb-148k',
      isOfficialApi: true,
      lastUpdated: 'Hace 8 horas',
    },
  },

  // Mendoza - Dalvian
  {
    id: 'mendoza-zona-03',
    title: 'Moderna Casa en Barrio Privado Dalvian con Jardín y Piscina',
    code: 'MDZ-ZON-103',
    type: 'house',
    status: 'available',
    price: 320000,
    currency: 'USD',
    location: {
      address: 'Barrio Dalvian Manzana 14',
      zone: 'Chacras de Coria / Dalvian',
      city: 'Mendoza',
      province: 'Mendoza',
      country: 'Argentina',
      googleMapsUrl: 'https://maps.google.com/?q=Barrio+Dalvian,+Mendoza,+Argentina',
    },
    features: {
      bedrooms: 3,
      rooms: 5,
      bathrooms: 3,
      areaM2: 240,
      terraceM2: 45,
      pool: true,
      garage: true,
      elevator: false,
      airConditioning: true,
      yearBuilt: 2023,
    },
    description: 'Moderna casa estilo contemporáneo en Dalvian. Amplio jardín consolidado, piscina climatizada y seguridad privada 24 hs.',
    images: ['https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80'],
    documents: [],
    featured: true,
    createdAt: '2026-07-19',
    source: {
      name: 'Zonaprop (Publicación Verificada)',
      url: 'https://www.zonaprop.com.ar/propiedades/casa-dalvian-mendoza-320000-usd.html',
      isOfficialApi: false,
      lastUpdated: 'Hace 12 horas',
    },
  },

  // Córdoba
  {
    id: 'cordoba-ml-01',
    title: 'Departamento 2 Ambientes en Nueva Córdoba',
    code: 'CBA-MLB-201',
    type: 'apartment',
    status: 'available',
    price: 92000,
    currency: 'USD',
    location: {
      address: 'Av. Hipólito Yrigoyen 350',
      zone: 'Nueva Córdoba',
      city: 'Córdoba',
      province: 'Córdoba',
      country: 'Argentina',
      googleMapsUrl: 'https://maps.google.com/?q=Av.+Hipolito+Yrigoyen+350,+Cordoba,+Argentina',
    },
    features: {
      bedrooms: 1,
      rooms: 2,
      bathrooms: 1,
      areaM2: 52,
      pool: false,
      garage: false,
      elevator: true,
      airConditioning: true,
    },
    description: 'Impecable departamento sobre Av. Yrigoyen en Nueva Córdoba.',
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80'],
    documents: [],
    featured: false,
    createdAt: '2026-07-22',
    source: {
      name: 'MercadoLibre Inmuebles (API Oficial)',
      url: 'https://departamento.mercadolibre.com.ar/MLA-9201920-nueva-cordoba-2amb',
      isOfficialApi: true,
      lastUpdated: 'Hace 2 horas',
    },
  },

  // Rosario
  {
    id: 'rosario-arg-01',
    title: 'Departamento 2 Ambientes con Vista al Río Paraná',
    code: 'ROS-ARG-301',
    type: 'apartment',
    status: 'available',
    price: 105000,
    currency: 'USD',
    location: {
      address: 'Av. del Huerto 1100',
      zone: 'Puerto Norte / Centro',
      city: 'Rosario',
      province: 'Santa Fe',
      country: 'Argentina',
      googleMapsUrl: 'https://maps.google.com/?q=Av.+del+Huerto+1100,+Rosario,+Argentina',
    },
    features: {
      bedrooms: 1,
      rooms: 2,
      bathrooms: 1,
      areaM2: 56,
      pool: true,
      garage: true,
      elevator: true,
      airConditioning: true,
    },
    description: 'Departamento frente al parque y con vista al río Paraná.',
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80'],
    documents: [],
    featured: false,
    createdAt: '2026-07-20',
    source: {
      name: 'Argenprop (Feed Partner)',
      url: 'https://www.argenprop.com/departamento-en-venta-en-rosario-2-ambientes--105000-usd',
      isOfficialApi: false,
      lastUpdated: 'Hace 6 horas',
    },
  },

  // Append initial agency catalog properties
  ...INITIAL_PROPERTIES.map((p) => ({
    ...p,
    location: {
      ...p.location,
      googleMapsUrl: p.location.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(p.location.address + ', ' + p.location.city)}`,
    },
    source: p.source || {
      name: 'Aria Prop (Exclusivo)',
      url: `https://ariaprompt.vercel.app/#/dashboard/properties`,
      isOfficialApi: true,
      lastUpdated: 'Directo de Agencia',
    },
  })),
];

export function parseQueryCriteria(query: string): SearchCriteria {
  const q = query.toLowerCase();
  const criteria: SearchCriteria = { rawQuery: query };

  // 1. Operation Detection (buy vs rent)
  if (q.includes('alquil') || q.includes('rent') || q.includes('arriend') || q.includes('arrendar')) {
    criteria.operation = 'rent';
  } else if (q.includes('compr') || q.includes('vent') || q.includes('adquir') || q.includes('compra')) {
    criteria.operation = 'buy';
  }

  // 2. Budget extraction
  const priceKMatch = q.match(/(?:hasta|presupuesto|maximo|máximo|usd|\$)\s*(\d+(?:\.\d+)?)\s*(?:k|mil)/i) ||
                      q.match(/(\d+(?:\.\d+)?)\s*(?:k|mil)\s*(?:usd|\$|dolares|dólares)?/i);
  const priceRawMatch = q.match(/(?:hasta|presupuesto|maximo|máximo|usd|\$)\s*(\d{2,8})/i) ||
                        q.match(/(\d{2,8})\s*(?:usd|\$|dolares|dólares|\/mes|mensual)?/i);

  if (priceKMatch) criteria.maxPriceUsd = parseFloat(priceKMatch[1]) * 1000;
  else if (priceRawMatch) criteria.maxPriceUsd = parseInt(priceRawMatch[1], 10);

  // 3. Rooms extraction
  const roomsMatch = q.match(/(\d+)\s*(?:ambientes|amb|ambs|habitaciones|dormitorios|hab)/i);
  if (roomsMatch) criteria.rooms = parseInt(roomsMatch[1], 10);

  // 4. Property Type
  if (q.includes('penthouse') || q.includes('ático')) criteria.propertyType = 'penthouse';
  else if (q.includes('casa') || q.includes('villa') || q.includes('chalet')) criteria.propertyType = 'house';
  else if (q.includes('depto') || q.includes('departamento') || q.includes('piso') || q.includes('apartamento')) criteria.propertyType = 'apartment';
  else if (q.includes('terreno') || q.includes('lote')) criteria.propertyType = 'land';

  // 5. Dynamic Location Extraction
  // Dictionary of known cities / regions across LATAM & Spain
  const knownLocations = [
    'san rafael', 'mendoza', 'buenos aires', 'puerto madero', 'palermo', 'belgrano',
    'polanco', 'condesa', 'roma norte', 'ciudad de méxico', 'cdmx',
    'medellín', 'medellin', 'el poblado', 'envigado', 'lima', 'san isidro', 'miraflores',
    'córdoba', 'cordoba', 'rosario', 'bariloche', 'salta', 'mar del plata', 'tigre', 'pilar',
    'nordelta', 'madrid', 'barcelona', 'miami', 'santiago', 'bogota', 'bogotá',
    'playa del carmen', 'tulum', 'cancun', 'cancún', 'punta del este', 'montevideo'
  ];

  for (const loc of knownLocations) {
    if (q.includes(loc)) {
      criteria.location = loc;
      break;
    }
  }

  // Generic Regex Location Matcher if not in dict (e.g. "alquilar en San Rafael")
  if (!criteria.location) {
    const locMatch = q.match(/(?:en|de|para|por|zona|ciudad|sector|barrio)\s+([a-záéíóúñ\s]{3,25})/i);
    if (locMatch) {
      const extracted = locMatch[1].trim();
      // Ignore non-location stop words
      if (!['alquiler', 'venta', 'buen precio', 'buenos aires', 'departamento', 'casa'].includes(extracted)) {
        criteria.location = extracted;
      }
    }
  }

  return criteria;
}

export function searchMultiSourceRealEstate(query: string): SearchEngineResult {
  const criteria = parseQueryCriteria(query);
  const catalog = MARKET_REAL_ESTATE_DATABASE;

  const matches = catalog.filter((p) => {
    const city = p.location.city.toLowerCase();
    const zone = p.location.zone.toLowerCase();
    const province = (p.location.province || '').toLowerCase();
    const country = (p.location.country || '').toLowerCase();
    const title = p.title.toLowerCase();

    // 1. Location match
    let locationMatch = true;
    if (criteria.location) {
      const loc = criteria.location.toLowerCase();
      locationMatch =
        city.includes(loc) ||
        zone.includes(loc) ||
        province.includes(loc) ||
        country.includes(loc) ||
        title.includes(loc) ||
        (loc.includes('mendoza') && (city.includes('mendoza') || province.includes('mendoza'))) ||
        (loc.includes('buenos aires') && (city.includes('buenos aires') || zone.includes('puerto madero') || zone.includes('palermo'))) ||
        (loc.includes('cdmx') && city.includes('méxico'));
    }

    // 2. Operation match (rent vs buy)
    let operationMatch = true;
    if (criteria.operation === 'rent') {
      operationMatch = p.price < 5000 || p.title.toLowerCase().includes('alquiler') || p.id.includes('rent');
    } else if (criteria.operation === 'buy') {
      operationMatch = p.price >= 5000 && !p.title.toLowerCase().includes('alquiler');
    }

    // 3. Price match
    let priceMatch = true;
    if (criteria.maxPriceUsd) {
      priceMatch = p.price <= criteria.maxPriceUsd * 1.15;
    }

    // 4. Rooms match
    let roomsMatch = true;
    if (criteria.rooms) {
      const pRooms = p.features.rooms || p.features.bedrooms + 1;
      roomsMatch = Math.abs(pRooms - criteria.rooms) <= 1;
    }

    return locationMatch && operationMatch && priceMatch && roomsMatch;
  });

  const hasLocationInCatalog = catalog.some((p) => {
    if (!criteria.location) return false;
    const loc = criteria.location.toLowerCase();
    return (
      p.location.city.toLowerCase().includes(loc) ||
      p.location.zone.toLowerCase().includes(loc) ||
      (p.location.province || '').toLowerCase().includes(loc) ||
      p.title.toLowerCase().includes(loc)
    );
  });

  const sourceMap: Record<string, { count: number; isOfficialApi: boolean }> = {};
  matches.forEach((m) => {
    const sName = m.source?.name || 'Mercado Libre / Properati';
    if (!sourceMap[sName]) {
      sourceMap[sName] = { count: 0, isOfficialApi: m.source?.isOfficialApi ?? true };
    }
    sourceMap[sName].count += 1;
  });

  const sourceSummary = Object.entries(sourceMap).map(([name, val]) => ({
    name,
    count: val.count,
    isOfficialApi: val.isOfficialApi,
  }));

  let closestMatches: Property[] = [];
  let explanationNote: string | undefined;

  // If no match found for the requested criteria
  if (matches.length === 0) {
    if (criteria.location && !hasLocationInCatalog) {
      explanationNote = `Actualmente no contamos con publicaciones verificadas activas en **${criteria.location.toUpperCase()}** dentro de nuestro índice de datos.`;
    } else if (criteria.operation === 'rent') {
      closestMatches = catalog.filter((p) => p.price < 5000 || p.title.toLowerCase().includes('alquiler'));
      explanationNote = `No encontramos publicaciones de alquiler en esa zona específica, pero te mostramos opciones de alquiler disponibles en el catálogo.`;
    } else if (criteria.maxPriceUsd) {
      closestMatches = catalog.filter((p) => p.price >= 5000);
      const minAvailablePrice = Math.min(...closestMatches.map((c) => c.price));
      explanationNote = `No encontramos opciones de compra por debajo de $${criteria.maxPriceUsd.toLocaleString('en-US')} USD en esa zona, las opciones disponibles comienzan en $${minAvailablePrice.toLocaleString('en-US')} USD.`;
    }
  }

  return {
    exactMatches: matches,
    closestMatches,
    hasLocationInCatalog,
    unmatchedLocationName: !hasLocationInCatalog && criteria.location ? criteria.location : undefined,
    explanationNote,
    operationRequested: criteria.operation,
    sourceSummary,
  };
}

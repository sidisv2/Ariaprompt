import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

function getBackendSupabaseClient() {
  const supabaseUrl = (
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ''
  ).trim();

  const supabaseKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ''
  ).trim();

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseUrl.includes('your-supabase')) {
    return null;
  }

  try {
    return createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  } catch (err) {
    console.warn('Backend Supabase initialization warning:', err);
    return null;
  }
}

type PlanTier = 'normal' | 'solo' | 'pro' | 'desarrolladores';

interface PlanLimits {
  id: PlanTier;
  name: string;
  monthlyPriceUsd: number;
  annualPriceUsd: number;
  description: string;
  maxAgents: number;
  maxLeadsPerMonth: number;
  maxProperties: number;
  pdfVaultEnabled: boolean;
  crmSyncEnabled: boolean;
}

interface Property {
  id: string;
  title: string;
  code: string;
  type: string;
  status: string;
  price: number;
  location: {
    address: string;
    city: string;
    zone: string;
    lat: number;
    lng: number;
  };
  features: {
    bedrooms: number;
    bathrooms: number;
    areaM2: number;
    terraceM2: number;
    pool: boolean;
    garage: boolean;
    elevator: boolean;
    airConditioning: boolean;
    yearBuilt: number;
  };
  description: string;
  images: string[];
  documents: { id: string; name: string; sizeKb: number; type: string; url: string; uploadedAt: string }[];
  featured: boolean;
  createdAt: string;
}

const PLAN_LIMITS: Record<string, PlanLimits> & Record<PlanTier, PlanLimits> = {
  normal: {
    id: 'normal',
    name: 'Gratuito',
    monthlyPriceUsd: 0,
    annualPriceUsd: 0,
    description: 'Acceso gratuito con funciones limitadas para explorar la plataforma.',
    maxAgents: 1,
    maxLeadsPerMonth: 5,
    maxProperties: 3,
    pdfVaultEnabled: false,
    crmSyncEnabled: false,
  },
  solo: {
    id: 'solo',
    name: 'Solo Agent',
    monthlyPriceUsd: 35,
    annualPriceUsd: 29,
    description: 'Ideal para corredores y agentes inmobiliarios independientes.',
    maxAgents: 1,
    maxLeadsPerMonth: 100,
    maxProperties: 20,
    pdfVaultEnabled: true,
    crmSyncEnabled: false,
  },
  pro: {
    id: 'pro',
    name: 'Agency Pro',
    monthlyPriceUsd: 99,
    annualPriceUsd: 79,
    description: 'Para agencias en crecimiento con WhatsApp y sincronización CRM.',
    maxAgents: 5,
    maxLeadsPerMonth: 500,
    maxProperties: 100,
    pdfVaultEnabled: true,
    crmSyncEnabled: true,
  },
  desarrolladores: {
    id: 'desarrolladores',
    name: 'Desarrolladores',
    monthlyPriceUsd: 0,
    annualPriceUsd: 0,
    description: 'Para desarrolladoras, promotoras y redes inmobiliarias. Todo ilimitado.',
    maxAgents: 999999,
    maxLeadsPerMonth: 999999,
    maxProperties: 999999,
    pdfVaultEnabled: true,
    crmSyncEnabled: true,
  },
};

const INITIAL_PROPERTIES: Property[] = [
  {
    id: 'prop-101',
    title: 'Penthouse de Ultra Lujo con Terraza Privada y Vista a Campo de Golf',
    code: 'CDMX-POL-01',
    type: 'penthouse',
    status: 'available',
    price: 1850000,
    location: {
      address: 'Av. Campos Elíseos 345',
      city: 'Ciudad de México',
      zone: 'Polanco',
      lat: 19.428,
      lng: -99.191,
    },
    features: {
      bedrooms: 4,
      bathrooms: 5,
      areaM2: 520,
      terraceM2: 110,
      pool: true,
      garage: true,
      elevator: true,
      airConditioning: true,
      yearBuilt: 2024,
    },
    description: 'Espectacular Penthouse en el corazón de Polanco. Acabados en mármol de Carrara, cocina italiana Dada, helipuerto en torre, doble filtro de seguridad 24/7 y terraza solárium con jacuzzi privado.',
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
    ],
    documents: [
      { id: 'doc-1', name: 'Plano_Arquitectonico_Polanco.pdf', sizeKb: 3420, type: 'blueprint', url: '#', uploadedAt: '2026-06-10' },
      { id: 'doc-2', name: 'Dossier_Informativo_Calidades.pdf', sizeKb: 8900, type: 'dossier', url: '#', uploadedAt: '2026-06-11' },
    ],
    featured: true,
    createdAt: '2026-06-01',
  },
  {
    id: 'prop-102',
    title: 'Casa Campestre Moderna con Piscina Climatizada y Vista Panorámica',
    code: 'MDE-POB-02',
    type: 'villa',
    status: 'available',
    price: 950000,
    location: {
      address: 'Loma del Campestre 88',
      city: 'Medellín',
      zone: 'El Poblado',
      lat: 6.208,
      lng: -75.567,
    },
    features: {
      bedrooms: 5,
      bathrooms: 6,
      areaM2: 680,
      terraceM2: 150,
      pool: true,
      garage: true,
      elevator: false,
      airConditioning: true,
      yearBuilt: 2023,
    },
    description: 'Residencia inteligente en las lomas de El Poblado con vista abierta sobre el valle de Aburrá. Diseño bioclimático, domótica Lutron, piscina infinita climatizada y cava de vinos subterránea.',
    images: [
      'https://images.unsplash.com/photo-1600585154497-12c8ab7fb75d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
    ],
    documents: [
      { id: 'doc-3', name: 'Plano_ElPoblado_Medellin.pdf', sizeKb: 2150, type: 'blueprint', url: '#', uploadedAt: '2026-06-15' },
    ],
    featured: true,
    createdAt: '2026-06-05',
  },
  {
    id: 'prop-103',
    title: 'Departamento Exclusivo Frente al Golf con Acabados Finos',
    code: 'LIM-SIS-03',
    type: 'apartment',
    status: 'available',
    price: 620000,
    location: {
      address: 'Av. Pezet 540',
      city: 'Lima',
      zone: 'San Isidro',
      lat: -12.097,
      lng: -77.037,
    },
    features: {
      bedrooms: 3,
      bathrooms: 4,
      areaM2: 280,
      terraceM2: 45,
      pool: true,
      garage: true,
      elevator: true,
      airConditioning: true,
      yearBuilt: 2022,
    },
    description: 'Elegante departamento con ascensor directo a piso en la zona más prestigiosa de San Isidro. Vista despejada al Lima Golf Club, acabados en madera estructurada y 3 estacionamientos subterráneos.',
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600566753366-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
    ],
    documents: [
      { id: 'doc-4', name: 'Memoria_Calidades_SanIsidro.pdf', sizeKb: 4100, type: 'dossier', url: '#', uploadedAt: '2026-06-20' },
    ],
    featured: false,
    createdAt: '2026-06-12',
  },
];

function mapEstadoCuentaToPlanTier(estadoCuenta: string | null | undefined): PlanTier {
  if (!estadoCuenta) return 'normal';
  const v = estadoCuenta.toLowerCase().trim();
  if (v === 'normal' || v === 'gratis') return 'normal';
  if (v === 'solo' || v === 'solo_agent') return 'solo';
  if (v === 'pro' || v === 'pro_basico' || v === 'agency_pro' || v === 'plan_activo') return 'pro';
  if (v === 'desarrolladores' || v === 'enterprise') return 'desarrolladores';
  if (v.includes('prueba')) return 'normal';
  return 'normal';
}

function getPlanLimits(tier: PlanTier | null | undefined): PlanLimits {
  return PLAN_LIMITS[tier ?? 'normal'];
}

function checkPropertyLimit(
  tier: PlanTier | null | undefined,
  currentPropertiesCount: number,
): { allowed: boolean; error?: string } {
  const plan = getPlanLimits(tier);
  if (currentPropertiesCount >= plan.maxProperties) {
    const nextPlan = tier === 'normal' ? 'Solo Agent' : tier === 'solo' ? 'Agency Pro' : 'Desarrolladores';
    return {
      allowed: false,
      error: `Alcanzaste el límite de ${plan.maxProperties} propiedades en tu plan ${plan.name}. Actualizá a ${nextPlan} para publicar más.`,
    };
  }
  return { allowed: true };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabase = getBackendSupabaseClient();

  if (req.method === 'GET') {
    if (supabase) {
      try {
        const agencyId = (req.query.agency_id as string) || (req.headers['x-agency-id'] as string);
        let query = supabase.from('propiedades').select('*').order('created_at', { ascending: false });
        
        if (agencyId) {
          query = query.eq('agency_id', agencyId);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return res.status(200).json({ success: true, data, source: 'supabase' });
        }
      } catch (err) {
        console.warn('Vercel API fetch properties fallback:', err);
      }
    }
    return res.status(200).json({ success: true, data: INITIAL_PROPERTIES, source: 'memory' });
  }

  if (req.method === 'POST') {
    const agencyId = (req.body.agency_id as string) || (req.headers['x-agency-id'] as string);
    const newProperty = {
      id: req.body.id || `prop-${Date.now()}`,
      created_at: new Date().toISOString(),
      documents: [],
      featured: false,
      status: 'available',
      ...req.body,
    };

    if (supabase && agencyId) {
      try {
        // 1. Fetch profile plan_id
        const { data: profile } = await supabase
          .from('profiles')
          .select('plan_id')
          .eq('id', agencyId)
          .single();

        // 2. Count active properties
        const { count: activePropsCount } = await supabase
          .from('propiedades')
          .select('id', { count: 'exact', head: true })
          .eq('agency_id', agencyId);

        const currentCount = activePropsCount || 0;
        const checkResult = checkPropertyLimit(mapEstadoCuentaToPlanTier(profile?.plan_id), currentCount);

        if (!checkResult.allowed) {
          return res.status(403).json({
            error: 'LIMIT_EXCEEDED',
            code: 403,
            message: checkResult.error,
          });
        }

        // 3. Insert property
        const { data, error } = await supabase.from('propiedades').insert([newProperty]).select().single();
        if (!error && data) {
          return res.status(200).json({ success: true, data, source: 'supabase' });
        }
      } catch (err) {
        console.warn('Vercel API create property fallback:', err);
      }
    }

    return res.status(200).json({ success: true, data: newProperty, source: 'memory' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
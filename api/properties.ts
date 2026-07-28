import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { INITIAL_PROPERTIES } from '../src/data/mockData';

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
      error: `Alcanzaste el l\u00edmite de ${plan.maxProperties} propiedades en tu plan ${plan.name}. Actualiz\u00e1 a ${nextPlan} para publicar m\u00e1s.`,
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
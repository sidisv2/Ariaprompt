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

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  temperature: 'hot' | 'warm' | 'cold';
  status: string;
  budgetMin: number;
  budgetMax: number;
  preferredZone: string;
  notes: string;
  score: number;
  lastInteraction: string;
  createdAt: string;
  agentId: string;
  chatMessagesCount: number;
  chatHistorySummary: string;
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

const INITIAL_LEADS: Lead[] = [
  {
    id: 'lead-01',
    name: 'Mateo Morales',
    email: 'mmorales@investments.mx',
    phone: '+52 55 4123 9876',
    temperature: 'hot',
    status: 'visit_scheduled',
    budgetMin: 1500000,
    budgetMax: 2200000,
    preferredZone: 'Polanco / Lomas de Chapultepec (CDMX)',
    notes: 'Inversor privado buscando Penthouse en CDMX. Ha solicitado visitar la propiedad CDMX-POL-01 este viernes a las 11:00 AM.',
    score: 95,
    lastInteraction: 'Hace 8 min',
    createdAt: '2026-07-20',
    agentId: 'prop-agent-001',
    chatMessagesCount: 18,
    chatHistorySummary: 'Preguntó por la cuota de mantenimiento de la torre y los estacionamientos. Confirmó visita presencial con Aria Prop.',
  },
  {
    id: 'lead-02',
    name: 'Camila Restrepo',
    email: 'camila.restrepo@techcapital.co',
    phone: '+57 300 882 1900',
    temperature: 'hot',
    status: 'offer_made',
    budgetMin: 800000,
    budgetMax: 1100000,
    preferredZone: 'El Poblado / Llanogrande (Medellín)',
    notes: 'Directora de Fondo Regional. Interesada en la Casa MDE-POB-02. Solicitó borradores de escrituración.',
    score: 91,
    lastInteraction: 'Hace 30 min',
    createdAt: '2026-07-18',
    agentId: 'prop-agent-001',
    chatMessagesCount: 22,
    chatHistorySummary: 'Consultó sobre el área del lote y avalúo catastral. Coordinó llamada con el dueño.',
  },
  {
    id: 'lead-03',
    name: 'Gonzalo Silva',
    email: 'gsilva@patrimonios.cl',
    phone: '+56 9 8765 4321',
    temperature: 'warm',
    status: 'contacted',
    budgetMin: 500000,
    budgetMax: 750000,
    preferredZone: 'San Isidro (Lima) / Vitacura (Santiago)',
    notes: 'Busca departamento de inversión de renta alta en Lima o Santiago.',
    score: 72,
    lastInteraction: 'Hace 2 horas',
    createdAt: '2026-07-21',
    agentId: 'prop-agent-001',
    chatMessagesCount: 11,
    chatHistorySummary: 'Consultó el retorno anual de alquileres en San Isidro y gastos comunes.',
  },
  {
    id: 'lead-04',
    name: 'Sofía Benítez',
    email: 'sbenitez@grupo.ar',
    phone: '+54 9 11 5432 1098',
    temperature: 'cold',
    status: 'new',
    budgetMin: 300000,
    budgetMax: 500000,
    preferredZone: 'Puerto Madero / Nordelta (Buenos Aires)',
    notes: 'Entró por widget buscando catálogo general. Aún evaluando opciones de inversión.',
    score: 38,
    lastInteraction: 'Hace 1 día',
    createdAt: '2026-07-21',
    agentId: 'prop-agent-001',
    chatMessagesCount: 5,
    chatHistorySummary: 'Consultó formas de pago y transferencias internacionales.',
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

function getCurrentPeriod(date: Date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function checkLeadLimit(
  tier: PlanTier | null | undefined,
  currentLeadsCount: number,
): { allowed: boolean; error?: string } {
  const plan = getPlanLimits(tier);
  if (currentLeadsCount >= plan.maxLeadsPerMonth) {
    return {
      allowed: false,
      error: `Alcanzaste el límite de ${plan.maxLeadsPerMonth} leads este mes en tu plan ${plan.name}. Mejorá tu plan para seguir recibiendo consultas.`,
    };
  }
  return { allowed: true };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabase = getBackendSupabaseClient();

  if (req.method === 'GET') {
    if (supabase) {
      try {
        const agencyId = (req.query.agency_id as string) || (req.headers['x-agency-id'] as string);
        let query = supabase.from('leads').select('*').order('created_at', { ascending: false });
        
        if (agencyId) {
          query = query.eq('agency_id', agencyId);
        }

        const { data, error } = await query;
        if (!error && data) {
          return res.status(200).json({ success: true, data, source: 'supabase' });
        }
      } catch (err) {
        console.warn('Vercel API fetch leads fallback:', err);
      }
    }
    return res.status(200).json({ success: true, data: INITIAL_LEADS, source: 'memory' });
  }

  if (req.method === 'POST') {
    const agencyId = (req.body.agency_id as string) || (req.headers['x-agency-id'] as string);
    const newLead = {
      id: req.body.id || `lead-${Date.now()}`,
      created_at: new Date().toISOString(),
      status: 'nuevo',
      temperature: 'warm',
      score: 50,
      ...req.body,
    };

    if (supabase && agencyId) {
      try {
        const period = getCurrentPeriod();

        // 1. Fetch agency profile to check plan
        const { data: profile } = await supabase
          .from('profiles')
          .select('plan_id')
          .eq('id', agencyId)
          .single();

        // 2. Fetch current month lead usage
        const { data: usageRec } = await supabase
          .from('usage_records')
          .select('leads_count')
          .eq('agency_id', agencyId)
          .eq('period', period)
          .single();

        const currentLeadsCount = usageRec?.leads_count || 0;
        const checkResult = checkLeadLimit(mapEstadoCuentaToPlanTier(profile?.plan_id), currentLeadsCount);

        if (!checkResult.allowed) {
          return res.status(403).json({
            error: 'LIMIT_EXCEEDED',
            code: 403,
            message: checkResult.error,
          });
        }

        // 3. Insert lead
        const { data, error } = await supabase.from('leads').insert([newLead]).select().single();
        if (!error && data) {
          // 4. Increment usage atomically via RPC or upsert
          await supabase.rpc('increment_lead_usage', {
            p_agency_id: agencyId,
            p_period: period,
          });

          return res.status(200).json({ success: true, data, source: 'supabase' });
        }
      } catch (err) {
        console.warn('Vercel API create lead fallback:', err);
      }
    }

    return res.status(200).json({ success: true, data: newLead, source: 'memory' });
  }

  if (req.method === 'PATCH') {
    const { id } = req.query;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Missing lead id' });
    }

    if (supabase) {
      try {
        const { data, error } = await supabase.from('leads').update(req.body).eq('id', id).select().single();
        if (!error && data) {
          return res.status(200).json({ success: true, data, source: 'supabase' });
        }
      } catch (err) {
        console.warn('Vercel API update lead fallback:', err);
      }
    }

    return res.status(200).json({ success: true, data: { id, ...req.body }, source: 'memory' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
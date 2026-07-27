// ─── Plan Tier Types ────────────────────────────────────────────────────────
/**
 * Unified plan tier IDs used throughout the application.
 * Maps to public.profiles.estado_cuenta values via mapEstadoCuentaToPlanTier().
 */
export type PlanTier = 'normal' | 'solo' | 'pro' | 'desarrolladores';

export interface PlanLimits {
  id: PlanTier;
  name: string;
  monthlyPriceUsd: number;
  annualPriceUsd: number;
  description: string;
  maxAgents: number;
  maxLeadsPerMonth: number;
  maxProperties: number;
  /** Whether the private PDF Vault feature is enabled */
  pdfVaultEnabled: boolean;
  /** Whether CRM sync (Tokko/EasyBroker) is enabled */
  crmSyncEnabled: boolean;
}

// ─── Plan Definitions ────────────────────────────────────────────────────────

export const PLAN_LIMITS: Record<string, PlanLimits> & Record<PlanTier, PlanLimits> = {
  /** Free / Demo tier — default for every new signup */
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
  /** Solo Agent — $35/mes */
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
  /** Agency Pro — $99/mes */
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
  /** Developers / White-label — unlimited */
  desarrolladores: {
    id: 'desarrolladores',
    name: 'Desarrolladores',
    monthlyPriceUsd: 0, // Custom pricing
    annualPriceUsd: 0,
    description: 'Para desarrolladoras, promotoras y redes inmobiliarias. Todo ilimitado.',
    maxAgents: 999999,
    maxLeadsPerMonth: 999999,
    maxProperties: 999999,
    pdfVaultEnabled: true,
    crmSyncEnabled: true,
  },
};

// ─── Backward-Compatible Aliases ─────────────────────────────────────────────
// Pricing/marketing components that still reference old keys continue to work.
// These point to the same objects — do NOT use in new code.
(PLAN_LIMITS as Record<string, PlanLimits>)['solo_agent'] = PLAN_LIMITS.solo;
(PLAN_LIMITS as Record<string, PlanLimits>)['agency_pro'] = PLAN_LIMITS.pro;
(PLAN_LIMITS as Record<string, PlanLimits>)['enterprise']  = PLAN_LIMITS.desarrolladores;

// ─── Supabase Estado Cuenta → PlanTier Mapper ─────────────────────────────────

/**
 * Converts the raw `estado_cuenta` value stored in public.profiles
 * to a unified PlanTier. Always returns a valid PlanTier.
 *
 * Supabase values: 'gratis' | 'prueba_activa' | 'prueba_7dias' | 'pro_basico' | 'plan_activo'
 * New direct values: 'normal' | 'solo' | 'pro' | 'desarrolladores'
 */
export function mapEstadoCuentaToPlanTier(estadoCuenta: string | null | undefined): PlanTier {
  if (!estadoCuenta) return 'normal';
  const v = estadoCuenta.toLowerCase().trim();
  // Direct new-style IDs
  if (v === 'normal' || v === 'gratis') return 'normal';
  if (v === 'solo' || v === 'solo_agent') return 'solo';
  if (v === 'pro' || v === 'pro_basico' || v === 'agency_pro' || v === 'plan_activo') return 'pro';
  if (v === 'desarrolladores' || v === 'enterprise') return 'desarrolladores';
  // Trial → show as normal (limited) until confirmed paid
  if (v.includes('prueba')) return 'normal';
  return 'normal';
}

/**
 * Returns the PlanLimits for a given PlanTier.
 * Defaults to 'normal' if the tier is null/undefined.
 */
export function getPlanLimits(tier: PlanTier | null | undefined): PlanLimits {
  return PLAN_LIMITS[tier ?? 'normal'];
}

// ─── Period Helpers ───────────────────────────────────────────────────────────

export function getCurrentPeriod(date: Date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// ─── Limit Check Helpers ──────────────────────────────────────────────────────

export function checkLeadLimit(
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

export function checkPropertyLimit(
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

export function checkVaultAccess(tier: PlanTier | null | undefined): { allowed: boolean; error?: string } {
  const plan = getPlanLimits(tier);
  if (!plan.pdfVaultEnabled) {
    return {
      allowed: false,
      error: `La Bóveda de Documentos requiere un plan superior. Actualizá a Solo Agent o Agency Pro.`,
    };
  }
  return { allowed: true };
}

export function checkCrmAccess(tier: PlanTier | null | undefined): { allowed: boolean; error?: string } {
  const plan = getPlanLimits(tier);
  if (!plan.crmSyncEnabled) {
    return {
      allowed: false,
      error: `La sincronización CRM (Tokko / EasyBroker) requiere el plan Agency Pro o superior.`,
    };
  }
  return { allowed: true };
}

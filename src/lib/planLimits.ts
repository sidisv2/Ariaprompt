// ─── Plan Tier Types ────────────────────────────────────────────────────────
/**
 * Unified plan tier IDs used throughout the application.
 * Maps to public.profiles.estado_cuenta values via mapEstadoCuentaToPlanTier().
 */
export type PlanTier = 'normal' | 'solo' | 'pro' | 'desarrolladores';

export interface PlanLimits {
  id: PlanTier;
  name: string;
  emoji: string;
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
    emoji: '⚡',
    monthlyPriceUsd: 0,
    annualPriceUsd: 0,
    description: 'Acceso gratuito con funciones limitadas para explorar la plataforma.',
    maxAgents: 1,
    maxLeadsPerMonth: 5,
    maxProperties: 50,
    pdfVaultEnabled: false,
    crmSyncEnabled: false,
  },
  /** Starter tier alias */
  starter: {
    id: 'normal',
    name: 'Gratuito / Starter',
    emoji: '⚡',
    monthlyPriceUsd: 0,
    annualPriceUsd: 0,
    description: 'Acceso gratuito con funciones limitadas para explorar la plataforma.',
    maxAgents: 1,
    maxLeadsPerMonth: 5,
    maxProperties: 50,
    pdfVaultEnabled: false,
    crmSyncEnabled: false,
  },
  /** Solo Agent — $35/mes */
  solo: {
    id: 'solo',
    name: 'Solo Agent',
    emoji: '👤',
    monthlyPriceUsd: 35,
    annualPriceUsd: 29,
    description: 'Ideal para corredores y agentes inmobiliarios independientes.',
    maxAgents: 1,
    maxLeadsPerMonth: 100,
    maxProperties: 50,
    pdfVaultEnabled: true,
    crmSyncEnabled: false,
  },
  /** Agency Pro — $99/mes */
  pro: {
    id: 'pro',
    name: 'Agency Pro',
    emoji: '🏢',
    monthlyPriceUsd: 99,
    annualPriceUsd: 79,
    description: 'Para agencias en crecimiento con WhatsApp y sincronización CRM.',
    maxAgents: 5,
    maxLeadsPerMonth: 500,
    maxProperties: 200,
    pdfVaultEnabled: true,
    crmSyncEnabled: true,
  },
  /** Developers / White-label — unlimited */
  desarrolladores: {
    id: 'desarrolladores',
    name: 'Desarrolladores',
    emoji: '👑',
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
(PLAN_LIMITS as Record<string, PlanLimits>)['solo_agent'] = PLAN_LIMITS.solo;
(PLAN_LIMITS as Record<string, PlanLimits>)['agency_pro'] = PLAN_LIMITS.pro;
(PLAN_LIMITS as Record<string, PlanLimits>)['enterprise']  = PLAN_LIMITS.desarrolladores;
(PLAN_LIMITS as Record<string, PlanLimits>)['unlimited']   = PLAN_LIMITS.desarrolladores;
(PLAN_LIMITS as Record<string, PlanLimits>)['free']        = PLAN_LIMITS.normal;
(PLAN_LIMITS as Record<string, PlanLimits>)['gratis']      = PLAN_LIMITS.normal;

// ─── Supabase Estado Cuenta -> PlanTier Mapper ───────────────────────────────

/**
 * Converts the raw `estado_cuenta` value stored in public.profiles
 * to a unified PlanTier. Always returns a valid PlanTier.
 */
export function mapEstadoCuentaToPlanTier(estadoCuenta: string | null | undefined): PlanTier {
  if (!estadoCuenta) return 'normal';
  const v = String(estadoCuenta).toLowerCase().trim();
  if (v === 'normal' || v === 'gratis' || v === 'free' || v === 'starter') return 'normal';
  if (v === 'solo' || v === 'solo_agent') return 'solo';
  if (v === 'pro' || v === 'pro_basico' || v === 'agency_pro' || v === 'plan_activo') return 'pro';
  if (v === 'desarrolladores' || v === 'enterprise' || v === 'owner' || v === 'superadmin' || v === 'agency_unlimited' || v === 'unlimited') return 'desarrolladores';
  return 'normal';
}

/**
 * Returns the PlanLimits for a given PlanTier or arbitrary tier string safely.
 * Never throws undefined. Always returns a valid PlanLimits fallback.
 */
export function getPlanLimits(tier: PlanTier | string | null | undefined): PlanLimits {
  if (!tier) return PLAN_LIMITS.normal;
  const cleanKey = String(tier).toLowerCase().trim();
  return PLAN_LIMITS[cleanKey] || PLAN_LIMITS[mapEstadoCuentaToPlanTier(cleanKey)] || PLAN_LIMITS.normal;
}

/**
 * Returns formatted emoji labels for badges, sidebar, and headers safely.
 */
export function getPlanEmojiLabel(tier: PlanTier | string | null | undefined, isOwner: boolean = false): { emoji: string; title: string; fullLabel: string } {
  if (isOwner) {
    return { emoji: '👑', title: 'Owner / Enterprise', fullLabel: '👑 SuperAdmin Owner' };
  }
  const cleanTier = String(tier || '').toLowerCase().trim();
  switch (cleanTier) {
    case 'solo':
    case 'solo_agent':
      return { emoji: '👤', title: 'Solo Agent', fullLabel: '👤 Plan Solo Agent' };
    case 'pro':
    case 'agency_pro':
    case 'pro_basico':
      return { emoji: '🏢', title: 'Agency Pro', fullLabel: '🏢 Plan Agency Pro' };
    case 'desarrolladores':
    case 'enterprise':
    case 'unlimited':
      return { emoji: '👑', title: 'Enterprise', fullLabel: '👑 Desarrolladores / Enterprise' };
    case 'normal':
    case 'starter':
    case 'gratis':
    case 'free':
    default:
      return { emoji: '⚡', title: 'Invitado Express', fullLabel: '⚡ Invitado Express' };
  }
}

// ─── Period Helpers ──────────────────────────────────────────────────────────

export function getCurrentPeriod(date: Date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// ─── Limit Check Helpers ─────────────────────────────────────────────────────

export function checkLeadLimit(
  tier: PlanTier | string | null | undefined,
  currentLeadsCount: number,
): { allowed: boolean; error?: string } {
  const plan = getPlanLimits(tier);
  const maxAllowed = plan?.maxLeadsPerMonth ?? 100;
  if (currentLeadsCount >= maxAllowed) {
    return {
      allowed: false,
      error: `Alcanzaste el límite de ${maxAllowed} leads este mes en tu plan ${plan?.name || 'actual'}. Mejorá tu plan para seguir recibiendo consultas.`,
    };
  }
  return { allowed: true };
}

export function checkPropertyLimit(
  tier: PlanTier | string | null | undefined,
  currentPropertiesCount: number,
): { allowed: boolean; error?: string } {
  const plan = getPlanLimits(tier);
  const maxAllowed = plan?.maxProperties ?? 50;
  if (currentPropertiesCount >= maxAllowed) {
    const nextPlan = tier === 'normal' || tier === 'starter' ? 'Solo Agent' : tier === 'solo' ? 'Agency Pro' : 'Desarrolladores';
    return {
      allowed: false,
      error: `Alcanzaste el límite de ${maxAllowed} propiedades en tu plan ${plan?.name || 'actual'}. Actualizá a ${nextPlan} para publicar más.`,
    };
  }
  return { allowed: true };
}

export function checkVaultAccess(tier: PlanTier | string | null | undefined): { allowed: boolean; error?: string } {
  const plan = getPlanLimits(tier);
  if (!plan?.pdfVaultEnabled) {
    return {
      allowed: false,
      error: `La Bóveda de Documentos requiere un plan superior. Actualizá a Solo Agent o Agency Pro.`,
    };
  }
  return { allowed: true };
}

export function checkCrmAccess(tier: PlanTier | string | null | undefined): { allowed: boolean; error?: string } {
  const plan = getPlanLimits(tier);
  if (!plan?.crmSyncEnabled) {
    return {
      allowed: false,
      error: `La sincronización CRM (Tokko / EasyBroker) requiere el plan Agency Pro o superior.`,
    };
  }
  return { allowed: true };
}

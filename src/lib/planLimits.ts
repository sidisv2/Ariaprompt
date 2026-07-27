import { PlanTier } from '../types';

export interface PlanLimits {
  id: PlanTier;
  name: string;
  maxActiveAgents: number;
  maxLeadsPerMonth: number;
  maxProperties: number;
  annualPriceUsd: number;
  monthlyPriceUsd: number;
  ragAccess: boolean;
  integrationsAccess: boolean;
  whiteLabel: boolean;
  description: string;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  normal: {
    id: 'normal',
    name: 'Gratuito / Prueba',
    maxActiveAgents: 1,
    maxLeadsPerMonth: 5,
    maxProperties: 3,
    annualPriceUsd: 0,
    monthlyPriceUsd: 0,
    ragAccess: false,
    integrationsAccess: false,
    whiteLabel: false,
    description: 'Plan gratuito inicial con un agente en modo demo y límites básicos.',
  },
  solo: {
    id: 'solo',
    name: 'Solo Agent',
    maxActiveAgents: 1,
    maxLeadsPerMonth: 100,
    maxProperties: 20,
    annualPriceUsd: 29,
    monthlyPriceUsd: 35,
    ragAccess: true,
    integrationsAccess: false,
    whiteLabel: false,
    description: 'Ideal para corredores y agentes inmobiliarios independientes.',
  },
  pro: {
    id: 'pro',
    name: 'Agency Pro',
    maxActiveAgents: 5,
    maxLeadsPerMonth: 500,
    maxProperties: 100,
    annualPriceUsd: 79,
    monthlyPriceUsd: 99,
    ragAccess: true,
    integrationsAccess: true,
    whiteLabel: false,
    description: 'Para agencias en crecimiento con WhatsApp y sincronización CRM.',
  },
  desarrolladores: {
    id: 'desarrolladores',
    name: 'Enterprise / Desarrolladores',
    maxActiveAgents: 999999,
    maxLeadsPerMonth: 999999,
    maxProperties: 999999,
    annualPriceUsd: 0,
    monthlyPriceUsd: 0,
    ragAccess: true,
    integrationsAccess: true,
    whiteLabel: true,
    description: 'Agentes e integraciones ilimitadas con opciones de marca blanca.',
  },
};

export function normalizePlanTier(planId?: string | null): PlanTier {
  if (!planId) return 'normal';
  const normalized = planId.toLowerCase().trim();
  if (normalized.includes('desarroll') || normalized.includes('enterprise') || normalized.includes('custom') || normalized === 'agency') return 'desarrolladores';
  if (normalized.includes('agency_pro') || normalized === 'agency-pro' || normalized === 'pro' || normalized.includes('pro')) return 'pro';
  if (normalized.includes('solo_agent') || normalized === 'solo-agent' || normalized === 'solo' || normalized === 'starter') return 'solo';
  return 'normal';
}

export function getPlanLimits(planId?: string | null): PlanLimits {
  return PLAN_LIMITS[normalizePlanTier(planId)];
}

export function getCurrentPeriod(date: Date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function checkLeadLimit(planId: string | null | undefined, currentLeadsCount: number): { allowed: boolean; error?: string } {
  const plan = getPlanLimits(planId);
  if (currentLeadsCount >= plan.maxLeadsPerMonth) {
    return {
      allowed: false,
      error: `Alcanzaste el límite de ${plan.maxLeadsPerMonth} leads este mes en tu plan ${plan.name}. Actualizá tu plan para seguir recibiendo leads.`,
    };
  }
  return { allowed: true };
}

export function checkPropertyLimit(planId: string | null | undefined, currentPropertiesCount: number): { allowed: boolean; error?: string } {
  const plan = getPlanLimits(planId);
  if (currentPropertiesCount >= plan.maxProperties) {
    const nextPlanName = plan.id === 'normal' ? 'Solo Agent' : plan.id === 'solo' ? 'Agency Pro' : 'Enterprise';
    const nextPlanMax = plan.id === 'normal' ? `${PLAN_LIMITS.solo.maxProperties}` : plan.id === 'solo' ? `${PLAN_LIMITS.pro.maxProperties}` : 'ilimitadas';
    return {
      allowed: false,
      error: `Alcanzaste el límite de ${plan.maxProperties} propiedades activas en tu plan ${plan.name}. Actualizá tu plan a ${nextPlanName} para publicar hasta ${nextPlanMax} propiedades.`,
    };
  }
  return { allowed: true };
}

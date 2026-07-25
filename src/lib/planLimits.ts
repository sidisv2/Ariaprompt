export interface PlanLimits {
  id: string;
  name: string;
  maxLeadsPerMonth: number;
  maxProperties: number;
  annualPriceUsd: number;
  monthlyPriceUsd: number;
  description: string;
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  solo_agent: {
    id: 'solo_agent',
    name: 'Solo Agent',
    maxLeadsPerMonth: 100,
    maxProperties: 20,
    annualPriceUsd: 29,
    monthlyPriceUsd: 35,
    description: 'Ideal para corredores y agentes inmobiliarios independientes.',
  },
  agency_pro: {
    id: 'agency_pro',
    name: 'Agency Pro',
    maxLeadsPerMonth: 500,
    maxProperties: 100,
    annualPriceUsd: 79,
    monthlyPriceUsd: 99,
    description: 'Para agencias en crecimiento con WhatsApp y sincronización CRM.',
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    maxLeadsPerMonth: 999999,
    maxProperties: 999999,
    annualPriceUsd: 0,
    monthlyPriceUsd: 0,
    description: 'Para desarrolladoras, promotoras y redes inmobiliarias multi-sucursal.',
  },
};

export function getPlanLimits(planId?: string | null): PlanLimits {
  if (!planId) return PLAN_LIMITS.solo_agent;
  const normalized = planId.toLowerCase().trim();
  if (normalized.includes('pro')) return PLAN_LIMITS.agency_pro;
  if (normalized.includes('enterprise')) return PLAN_LIMITS.enterprise;
  return PLAN_LIMITS.solo_agent;
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
    const nextPlanName = plan.id === 'solo_agent' ? 'Agency Pro' : 'Enterprise';
    const nextPlanMax = plan.id === 'solo_agent' ? `${PLAN_LIMITS.agency_pro.maxProperties}` : 'ilimitadas';
    return {
      allowed: false,
      error: `Alcanzaste el límite de ${plan.maxProperties} propiedades activas en tu plan ${plan.name}. Actualizá tu plan a ${nextPlanName} para publicar hasta ${nextPlanMax} propiedades.`,
    };
  }
  return { allowed: true };
}

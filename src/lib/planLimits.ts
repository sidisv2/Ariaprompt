export interface PlanLimits {
  id: string;
  name: string;
  maxLeadsPerMonth: number;
  maxProperties: number;
  annualPriceUsd: number;
  monthlyPriceUsd: number;
  paddleProductId?: string;
  paddleMonthlyPriceId?: string;
  paddleAnnualPriceId?: string;
  mercadoPagoMonthlyUrl?: string;
  mercadoPagoAnnualUrl?: string;
  checkoutType?: 'mercadopago' | 'paddle' | 'contact';
  description: string;
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  solo_agent: {
    id: 'solo_agent',
    name: 'Solo Agent',
    maxLeadsPerMonth: 100,
    maxProperties: 20,
    annualPriceUsd: 348,
    monthlyPriceUsd: 35,
    paddleProductId: 'pro_01kyh5v65p257b3z7g8ez1z0y7',
    paddleMonthlyPriceId: 'pri_01kyh5xs672hj75v57tyf8mqg1',
    paddleAnnualPriceId: 'pri_01kyh5zsndbhkhswrbfmwj4xvb',
    mercadoPagoMonthlyUrl: 'https://mpago.la/17xmopC',
    mercadoPagoAnnualUrl: 'https://mpago.la/29pqoZr',
    checkoutType: 'mercadopago',
    description: 'Ideal para corredores y agentes inmobiliarios independientes.',
  },
  agency_pro: {
    id: 'agency_pro',
    name: 'Agency Pro',
    maxLeadsPerMonth: 500,
    maxProperties: 100,
    annualPriceUsd: 948,
    monthlyPriceUsd: 99,
    paddleProductId: 'pro_01kyh6139a37ta2r7axc2qh5k8',
    paddleMonthlyPriceId: 'pri_01kyh63dg2h0jkwvd1bh6jde47',
    paddleAnnualPriceId: 'pri_01kyh64fj85g1j12vgar9ct9yz',
    mercadoPagoMonthlyUrl: 'https://mpago.la/1UhRK7X',
    mercadoPagoAnnualUrl: 'https://mpago.la/1z8gxgW',
    checkoutType: 'mercadopago',
    description: 'Para agencias en crecimiento con WhatsApp y sincronización CRM.',
  },
  enterprise: {
    id: 'enterprise',
    name: 'Desarrolladores / Colaboradores',
    maxLeadsPerMonth: 999999,
    maxProperties: 999999,
    annualPriceUsd: 0,
    monthlyPriceUsd: 0,
    checkoutType: 'contact',
    description: 'Para desarrolladores y colaboradores que quieren aportar al proyecto AriaPrompt.',
  },
};

export function getPlanLimits(planId?: string | null): PlanLimits {
  if (!planId) return PLAN_LIMITS.solo_agent;
  const normalized = planId.toLowerCase().trim();
  if (normalized.includes('pro')) return PLAN_LIMITS.agency_pro;
  if (normalized.includes('enterprise') || normalized.includes('developer') || normalized.includes('custom') || normalized.includes('desarroll')) return PLAN_LIMITS.enterprise;
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

export type BillingCycle = 'monthly' | 'annual';

export function getPaddlePriceId(planId: string, billingCycle: BillingCycle): string | undefined {
  const plan = getPlanLimits(planId);
  return billingCycle === 'annual' ? plan.paddleAnnualPriceId : plan.paddleMonthlyPriceId;
}

export function getMercadoPagoCheckoutUrl(planId: string, billingCycle: BillingCycle): string | undefined {
  const plan = getPlanLimits(planId);
  return billingCycle === 'annual' ? plan.mercadoPagoAnnualUrl : plan.mercadoPagoMonthlyUrl;
}

export const DEVELOPER_WHATSAPP_URL = 'https://wa.me/5492604014372?text=Hola!%20Me%20interesa%20el%20plan%20Enterprise%20/%20Desarrolladores%20de%20AriaPrompt.%20Quisiera%20recibir%20m%C3%A1s%20informaci%C3%B3n.';

import { useAuth } from '../context/AuthContext';
import { PlanTier, PLAN_LIMITS, getPlanLimits, PlanLimits } from '../lib/planLimits';

export interface SubscriptionHookResult {
  user: ReturnType<typeof useAuth>['user'];
  userPlan: PlanTier;
  rawPlan: PlanTier;
  isOwner: boolean;
  isAdmin: boolean;
  canAccessAllFeatures: boolean;
  limits: PlanLimits;
  upgradeSubscription: (targetPlan: PlanTier) => Promise<{ success: boolean; error?: string }>;
}

export function useSubscription(): SubscriptionHookResult {
  const { user, updateUserPlan } = useAuth();

  const isOwner = Boolean(
    user && (user.isOwner || user.email?.toLowerCase().trim() === 'valentinlautaromorales@gmail.com')
  );
  const isAdmin = Boolean(user?.isAdmin || isOwner);

  const rawPlan: PlanTier = user?.plan || 'normal';
  const currentPlan: PlanTier = isOwner ? 'desarrolladores' : rawPlan;

  const limits = getPlanLimits(currentPlan);

  const upgradeSubscription = async (targetPlan: PlanTier) => {
    if (updateUserPlan) {
      return await updateUserPlan(targetPlan);
    }
    return { success: false, error: 'Función de actualización de plan no disponible' };
  };

  return {
    user,
    userPlan: currentPlan,
    rawPlan,
    isOwner,
    isAdmin,
    canAccessAllFeatures: isOwner || currentPlan === 'desarrolladores' || currentPlan === 'pro',
    limits,
    upgradeSubscription,
  };
}

export default useSubscription;

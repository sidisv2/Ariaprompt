import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, saveUserProfile, UserProfile, getUserProfile } from '../lib/supabase';
import { AppRoute, UserPreferences } from '../types';
import { PlanTier, mapEstadoCuentaToPlanTier } from '../lib/planLimits';
import { LogoutConfirmModal } from '../components/common/LogoutConfirmModal';

export interface AppUser {
  id: string;
  email: string;
  nombre: string;
  avatarUrl?: string;
  createdAt: string;
  role?: 'user' | 'admin';
  /** Real plan tier from public.profiles.estado_cuenta mapped through mapEstadoCuentaToPlanTier(). Defaults to 'normal'. */
  plan: PlanTier;
  /** Explicit demo account flag */
  isDemoAccount?: boolean;
  isOwner?: boolean;
  isAdmin?: boolean;
  canAccessAllFeatures?: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'dark',
  language: 'es',
  notificationsEmail: true,
  notificationsWhatsapp: true,
  defaultCurrency: 'USD',
};

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
  userPreferences: UserPreferences;
  authModalOpen: boolean;
  logoutModalOpen: boolean;
  modalTab: 'login' | 'signup';
  pendingPlan: string | null;
  pendingRoute: AppRoute | null;
  signUp: (data: { email: string; password: string; nombre: string }) => Promise<{ success: boolean; error?: string }>;
  signIn: (data: { email: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  signInAsDemoUser: () => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  requestSignOut: () => void;
  confirmSignOut: () => Promise<void>;
  cancelSignOut: () => void;
  updateUserProfile: (updates: { nombre?: string; avatarUrl?: string }) => Promise<{ success: boolean; error?: string }>;
  updateUserPlan: (newPlan: PlanTier) => Promise<{ success: boolean; error?: string }>;
  updateUserPreferences: (prefs: Partial<UserPreferences>) => void;
  requireAuthForPayment: (options?: { planId?: string; targetRoute?: AppRoute; onAuthenticated?: () => void }) => boolean;
  openAuthModal: (tab?: 'login' | 'signup', planId?: string, targetRoute?: AppRoute) => void;
  closeAuthModal: () => void;
  /** Returns a human-readable label for the current user plan badge. */
  getPlanBadgeLabel: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_SESSION_KEY = 'aria_prop_mock_session_user';
const LOCAL_STORAGE_PREFS_KEY = 'aria_user_preferences';

export const AuthProvider: React.FC<{ children: ReactNode; onRouteChange?: (route: AppRoute) => void }> = ({
  children,
  onRouteChange,
}) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState<boolean>(false);
  const [modalTab, setModalTab] = useState<'login' | 'signup'>('login');
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);
  const [pendingRoute, setPendingRoute] = useState<AppRoute | null>(null);
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);

  const [userPreferences, setUserPreferences] = useState<UserPreferences>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_PREFS_KEY);
      return stored ? { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) } : DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  });

  const updateUserPreferences = (prefs: Partial<UserPreferences>) => {
    setUserPreferences((prev) => {
      const updated = { ...prev, ...prefs };
      try {
        localStorage.setItem(LOCAL_STORAGE_PREFS_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Error saving preferences:', e);
      }
      return updated;
    });
  };

  const updateUserProfile = async (updates: { nombre?: string; avatarUrl?: string }): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Usuario no autenticado' };

    const updatedUser = {
      ...user,
      nombre: updates.nombre !== undefined ? updates.nombre : user.nombre,
      avatarUrl: updates.avatarUrl !== undefined ? updates.avatarUrl : user.avatarUrl,
    };

    setUser(updatedUser);

    try {
      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(updatedUser));
    } catch (e) {
      console.warn('Error updating session in localStorage:', e);
    }

    return { success: true };
  };

  useEffect(() => {
    let mounted = true;

    async function loadInitialSession() {
      if (isSupabaseConfigured) {
        try {
          const { data } = await supabase.auth.getSession();
          if (data.session && mounted) {
            setSession(data.session);
            await mapSupabaseUserToAppUser(data.session.user);
          } else if (mounted) {
            // Fallback to local session storage (e.g. demo mode or offline session)
            const stored = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
            if (stored) {
              const parsed = JSON.parse(stored);
              setUser({ ...parsed, role: 'user', plan: parsed.plan || 'normal' });
            }
          }
        } catch (err) {
          console.warn('Supabase session load error:', err);
        }
      } else {
        try {
          const stored = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
          if (stored && mounted) {
            const parsed = JSON.parse(stored);
            setUser({ ...parsed, role: 'user', plan: parsed.plan || 'normal' });
          }
        } catch (err) {
          console.warn('Error reading local mock auth session:', err);
        }
      }

      if (mounted) setLoading(false);
    }

    loadInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      setSession(newSession);

      if (event === 'SIGNED_IN' && newSession?.user) {
        await mapSupabaseUserToAppUser(newSession.user);
        // Auto-navigate to dashboard after OAuth redirect OR modal login.
        // Guard: only redirect if the user is currently on the landing / root page
        // to avoid forcefully ejecting someone from e.g. /dashboard/leads on reload.
        const isOnMarketingPage =
          window.location.pathname === '/' ||
          window.location.pathname === '' ||
          window.location.pathname === '/app';
        if (isOnMarketingPage && onRouteChange) onRouteChange('dashboard-metrics');
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      try { authListener.subscription.unsubscribe(); } catch {}
    };
  }, []);

  const mapSupabaseUserToAppUser = async (sbUser: SupabaseUser) => {
    const meta = sbUser.user_metadata as Record<string, string | undefined>;
    const rawEmail = (sbUser.email ?? '').toLowerCase().trim();
    const isOwnerUser = rawEmail === 'valentinlautaromorales@gmail.com';

    const nombre = isOwnerUser ? 'Valentin' : (meta?.nombre ?? meta?.full_name ?? meta?.name ?? sbUser.email?.split('@')[0] ?? 'Usuario');
    const avatarUrl =
      meta?.avatar_url ??
      meta?.picture ??
      `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=10b981&color=fff`;

    // Fetch real plan and is_demo_account flag from public.profiles
    let plan: PlanTier = isOwnerUser ? 'desarrolladores' : 'normal';
    let isDemoAccount = Boolean(meta?.is_demo_account);

    if (isOwnerUser) {
      plan = 'desarrolladores';
    } else if (isSupabaseConfigured) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('estado_cuenta, is_demo_account')
          .eq('id', sbUser.id)
          .maybeSingle();

        if (profile) {
          plan = mapEstadoCuentaToPlanTier(profile.estado_cuenta as string | null);
          isDemoAccount = Boolean(profile.is_demo_account || meta?.is_demo_account);
        } else {
          // First login (Google or email) — create profile row with 'normal' plan
          plan = 'normal';
          await saveUserProfile({
            id: sbUser.id,
            email: sbUser.email ?? '',
            nombre,
            fecha_registro: sbUser.created_at ?? new Date().toISOString(),
            avatar_url: avatarUrl,
            estado_cuenta: 'gratis', // Supabase column value for 'normal'
            plan_id: 'normal',
            is_demo_account: isDemoAccount,
          });
        }
      } catch (e) {
        console.warn('Could not fetch plan from profiles, defaulting to normal:', e);
        plan = 'normal';
      }
    }

    const appUser: AppUser = {
      id: sbUser.id,
      email: sbUser.email ?? '',
      nombre,
      avatarUrl,
      createdAt: sbUser.created_at ?? new Date().toISOString(),
      role: isOwnerUser ? 'admin' : 'user',
      plan,
      isDemoAccount,
      isOwner: isOwnerUser,
      isAdmin: isOwnerUser,
      canAccessAllFeatures: isOwnerUser,
    };

    setUser(appUser);
  };

  const handlePostAuthAction = () => {
    if (pendingCallback) {
      pendingCallback();
      setPendingCallback(null);
    }

    if (pendingRoute && onRouteChange) {
      onRouteChange(pendingRoute);
      setPendingRoute(null);
    } else if (onRouteChange) {
      onRouteChange('dashboard-metrics');
    }
  };

  // Public Sign Up: STRICTLY ASSIGNS ROLE 'user'
  const signUp = async ({ email, password, nombre }: { email: string; password: string; nombre: string }) => {
    setLoading(true);

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nombre,
              full_name: nombre,
            },
          },
        });

        if (error) {
          setLoading(false);
          return { success: false, error: error.message };
        }

        if (data.user) {
          await mapSupabaseUserToAppUser(data.user);
        }

        setAuthModalOpen(false);
        handlePostAuthAction();
        setLoading(false);
        return { success: true };
      } catch (err: any) {
        setLoading(false);
        return { success: false, error: err.message || 'Error al registrar usuario' };
      }
    } else {
      await new Promise((resolve) => setTimeout(resolve, 600));

      const mockUser: AppUser = {
        id: `usr_${Date.now()}`,
        email,
        nombre: nombre || email.split('@')[0],
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre || email)}&background=10b981&color=fff`,
        createdAt: new Date().toISOString(),
        role: 'user',
        plan: 'normal', // Default plan for all new signups
      };

      setUser(mockUser);
      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(mockUser));

      setAuthModalOpen(false);
      handlePostAuthAction();
      setLoading(false);
      return { success: true };
    }
  };

  // Sign In method: STRICTLY REGULAR USER
  const signIn = async ({ email, password }: { email: string; password: string }) => {
    setLoading(true);

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setLoading(false);
          return { success: false, error: error.message };
        }

        if (data.user) {
          await mapSupabaseUserToAppUser(data.user);
        }

        setAuthModalOpen(false);
        handlePostAuthAction();
        setLoading(false);
        return { success: true };
      } catch (err: any) {
        setLoading(false);
        return { success: false, error: err.message || 'Credenciales incorrectas' };
      }
    } else {
      await new Promise((resolve) => setTimeout(resolve, 600));

      const mockUser: AppUser = {
        id: `usr_${Date.now()}`,
        email,
        nombre: email.split('@')[0],
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=10b981&color=fff`,
        createdAt: new Date().toISOString(),
        role: 'user',
        plan: 'normal',
      };

      setUser(mockUser);
      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(mockUser));

      setAuthModalOpen(false);
      handlePostAuthAction();
      setLoading(false);
      return { success: true };
    }
  };

  // Sign In as Demo User: Creates an isolated, unique ephemeral demo account per visitor
  const signInAsDemoUser = async () => {
    setLoading(true);
    const demoTimestamp = Date.now();
    const demoRandom = Math.random().toString(36).substring(2, 7);
    const ephemeralDemoEmail = `demo_${demoTimestamp}_${demoRandom}@ariaprop.com`;
    const ephemeralDemoPassword = `DemoPassword_${demoTimestamp}!`;

    if (isSupabaseConfigured) {
      try {
        // Create an isolated ephemeral user in Supabase Auth with a unique UUID / agency_id
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email: ephemeralDemoEmail,
          password: ephemeralDemoPassword,
          options: {
            data: {
              nombre: 'Inmobiliaria Demo (Modo Prueba)',
              is_demo_account: true,
            },
          },
        });

        if (!signUpErr && signUpData.user) {
          await mapSupabaseUserToAppUser(signUpData.user);
          setAuthModalOpen(false);
          handlePostAuthAction();
          setLoading(false);
          return { success: true };
        }

        // If Supabase Auth fails or rate limits (429), fallback to local demo user session
        const mockDemoUser: AppUser = {
          id: `usr_demo_${demoTimestamp}_${demoRandom}`,
          email: ephemeralDemoEmail,
          nombre: 'Inmobiliaria Demo LATAM',
          avatarUrl: `https://ui-avatars.com/api/?name=Demo+LATAM&background=10b981&color=fff`,
          createdAt: new Date().toISOString(),
          role: 'user',
          plan: 'normal',
          isDemoAccount: true,
        };

        setUser(mockDemoUser);
        localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(mockDemoUser));
        setAuthModalOpen(false);
        handlePostAuthAction();
        setLoading(false);
        return { success: true };
      } catch (err: any) {
        console.warn('Supabase Auth demo error, fallback to local demo:', err);
        const mockDemoUser: AppUser = {
          id: `usr_demo_${demoTimestamp}_${demoRandom}`,
          email: ephemeralDemoEmail,
          nombre: 'Inmobiliaria Demo LATAM',
          avatarUrl: `https://ui-avatars.com/api/?name=Demo+LATAM&background=10b981&color=fff`,
          createdAt: new Date().toISOString(),
          role: 'user',
          plan: 'normal',
        };

        setUser(mockDemoUser);
        localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(mockDemoUser));
        setAuthModalOpen(false);
        handlePostAuthAction();
        setLoading(false);
        return { success: true };
      }
    } else {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const mockDemoUser: AppUser = {
        id: `usr_demo_${demoTimestamp}_${demoRandom}`,
        email: ephemeralDemoEmail,
        nombre: 'Inmobiliaria Demo LATAM',
        avatarUrl: `https://ui-avatars.com/api/?name=Demo+LATAM&background=10b981&color=fff`,
        createdAt: new Date().toISOString(),
        role: 'user',
        plan: 'normal',
      };

      setUser(mockDemoUser);
      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(mockDemoUser));

      setAuthModalOpen(false);
      handlePostAuthAction();
      setLoading(false);
      return { success: true };
    }
  };

  // Sign In with Google OAuth
  const signInWithGoogle = async () => {
    setLoading(true);
    if (isSupabaseConfigured) {
      try {
        // redirectTo: /app — so Supabase returns the user directly to the workspace.
        // detectSessionInUrl:true (configured in supabase.ts) handles the #access_token hash.
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/app`,
            queryParams: {
              access_type: 'offline',
              prompt: 'select_account', // Always show Google account picker
            },
          },
        });
        if (error) {
          setLoading(false);
          return { success: false, error: error.message };
        }
        // Browser navigates away to Google — execution stops here.
        return { success: true };
      } catch (err: any) {
        setLoading(false);
        return { success: false, error: err.message || 'Error conectando con Google OAuth' };
      }
    } else {
      await new Promise((resolve) => setTimeout(resolve, 700));

      const mockUser: AppUser = {
        id: `usr_google_${Date.now()}`,
        email: 'usuario.google@gmail.com',
        nombre: 'Usuario Google',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        createdAt: new Date().toISOString(),
        role: 'user',
        plan: 'normal',
      };

      setUser(mockUser);
      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(mockUser));

      setAuthModalOpen(false);
      handlePostAuthAction();
      setLoading(false);
      return { success: true };
    }
  };

  // Immediate Sign Out with Complete Multi-Tenant State Cleansing
  const signOut = async () => {
    setLoading(true);
    if (isSupabaseConfigured) {
      try { await supabase.auth.signOut(); } catch {}
    }
    setUser(null);
    setSession(null);
    try {
      // Clear all auth-related and plan-related keys
      const KEYS_TO_REMOVE = [
        LOCAL_STORAGE_SESSION_KEY,
        LOCAL_STORAGE_PREFS_KEY,
        'aria_partner_crm_connections_v1',
        'aria_partner_synced_properties_v1',
        'aria_selected_plan',
        'aria_user_profile',
        'aria_has_connected_crm',
        'aria_agency_id',
      ];
      KEYS_TO_REMOVE.forEach((k) => { try { localStorage.removeItem(k); } catch {} });
      sessionStorage.clear();
    } catch (e) {
      console.warn('Error clearing storage on logout:', e);
    }
    setLoading(false);
    if (onRouteChange) onRouteChange('marketing');
  };

  // Request Sign Out (Triggers Confirmation Modal)
  const requestSignOut = () => {
    setLogoutModalOpen(true);
  };

  const cancelSignOut = () => {
    setLogoutModalOpen(false);
  };

  const confirmSignOut = async () => {
    setLogoutModalOpen(false);
    await signOut();
  };

  const requireAuthForPayment = (options?: { planId?: string; targetRoute?: AppRoute; onAuthenticated?: () => void }): boolean => {
    if (user) {
      if (options?.onAuthenticated) options.onAuthenticated();
      if (options?.targetRoute && onRouteChange) onRouteChange(options.targetRoute);
      return true;
    }

    if (options?.planId) setPendingPlan(options.planId);
    if (options?.targetRoute) setPendingRoute(options.targetRoute);
    if (options?.onAuthenticated) setPendingCallback(() => options.onAuthenticated!);

    setModalTab('login');
    setAuthModalOpen(true);
    return false;
  };

  const openAuthModal = (tab: 'login' | 'signup' = 'login', planId?: string, targetRoute?: AppRoute) => {
    setModalTab(tab);
    if (planId) setPendingPlan(planId);
    if (targetRoute) setPendingRoute(targetRoute);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  const updateUserPlan = async (newPlan: PlanTier): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Usuario no autenticado' };

    try {
      const estadoCuentaMap: Record<PlanTier, string> = {
        normal: 'gratis',
        solo: 'solo_agent',
        pro: 'agency_pro',
        desarrolladores: 'enterprise',
      };
      const estadoCuenta = estadoCuentaMap[newPlan] || 'agency_pro';

      if (isSupabaseConfigured && supabase && user.id) {
        await supabase
          .from('profiles')
          .update({
            estado_cuenta: estadoCuenta,
            plan_id: newPlan,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        await supabase
          .from('organizations')
          .update({
            plan: newPlan,
            plan_tier: estadoCuenta,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
      }

      const updatedUser: AppUser = {
        ...user,
        plan: newPlan,
      };
      setUser(updatedUser);

      const storedSession = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
      if (storedSession) {
        try {
          const parsed = JSON.parse(storedSession);
          localStorage.setItem(
            LOCAL_STORAGE_SESSION_KEY,
            JSON.stringify({ ...parsed, plan: newPlan })
          );
        } catch (e) {}
      }

      return { success: true };
    } catch (err: any) {
      console.error('Error in updateUserPlan:', err);
      return { success: false, error: err?.message || 'Error al actualizar el plan' };
    }
  };

  /** Maps PlanTier to a short human-readable badge label. */
  const getPlanBadgeLabel = (): string => {
    if (!user) return '';
    if (user.isOwner || user.email.toLowerCase().trim() === 'valentinlautaromorales@gmail.com') {
      return '👑 OWNER';
    }
    switch (user.plan) {
      case 'pro':            return 'Pro';
      case 'solo':           return 'Solo';
      case 'desarrolladores': return 'Enterprise';
      case 'normal':
      default:               return 'Gratis';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        userPreferences,
        authModalOpen,
        logoutModalOpen,
        modalTab,
        pendingPlan,
        pendingRoute,
        signUp,
        signIn,
        signInAsDemoUser,
        signInWithGoogle,
        signOut,
        requestSignOut,
        confirmSignOut,
        cancelSignOut,
        updateUserProfile,
        updateUserPlan,
        updateUserPreferences,
        requireAuthForPayment,
        openAuthModal,
        closeAuthModal,
        getPlanBadgeLabel,
      }}
    >
      {children}

      {/* Global Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={logoutModalOpen}
        onClose={cancelSignOut}
        onConfirm={confirmSignOut}
      />
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

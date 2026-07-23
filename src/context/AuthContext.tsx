import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, saveUserProfile, UserProfile, getUserProfile } from '../lib/supabase';
import { AppRoute, UserPreferences } from '../types';
import { LogoutConfirmModal } from '../components/common/LogoutConfirmModal';

export interface AppUser {
  id: string;
  email: string;
  nombre: string;
  avatarUrl?: string;
  createdAt: string;
  role?: 'user' | 'admin';
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
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  requestSignOut: () => void;
  confirmSignOut: () => Promise<void>;
  cancelSignOut: () => void;
  updateUserProfile: (updates: { nombre?: string; avatarUrl?: string }) => Promise<{ success: boolean; error?: string }>;
  updateUserPreferences: (prefs: Partial<UserPreferences>) => void;
  requireAuthForPayment: (options?: { planId?: string; targetRoute?: AppRoute; onAuthenticated?: () => void }) => boolean;
  openAuthModal: (tab?: 'login' | 'signup', planId?: string, targetRoute?: AppRoute) => void;
  closeAuthModal: () => void;
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
          }
        } catch (err) {
          console.warn('Supabase session load error:', err);
        }
      } else {
        try {
          const stored = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
          if (stored && mounted) {
            const parsed = JSON.parse(stored);
            setUser({ ...parsed, role: 'user' });
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
    const nombre =
      (sbUser.user_metadata as any)?.nombre ||
      (sbUser.user_metadata as any)?.full_name ||
      (sbUser.user_metadata as any)?.name ||
      sbUser.email?.split('@')[0] ||
      'Usuario';

    const avatarUrl =
      (sbUser.user_metadata as any)?.avatar_url ||
      (sbUser.user_metadata as any)?.picture ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=10b981&color=fff`;

    const appUser: AppUser = {
      id: sbUser.id,
      email: sbUser.email || '',
      nombre,
      avatarUrl,
      createdAt: sbUser.created_at || new Date().toISOString(),
      role: 'user', // Always user for public signups
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
        role: 'user', // STRICTLY REGULAR USER
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
      };

      setUser(mockUser);
      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(mockUser));

      setAuthModalOpen(false);
      handlePostAuthAction();
      setLoading(false);
      return { success: true };
    }
  };

  // Sign In with Google OAuth (Prominent)
  const signInWithGoogle = async () => {
    setLoading(true);
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (error) {
          setLoading(false);
          return { success: false, error: error.message };
        }
        setLoading(false);
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
      };

      setUser(mockUser);
      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(mockUser));

      setAuthModalOpen(false);
      handlePostAuthAction();
      setLoading(false);
      return { success: true };
    }
  };

  // Immediate Sign Out
  const signOut = async () => {
    setLoading(true);
    if (isSupabaseConfigured) {
      try { await supabase.auth.signOut(); } catch {}
    }
    setUser(null);
    setSession(null);
    try { localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY); } catch {}
    setLoading(false);
    if (onRouteChange) {
      onRouteChange('marketing');
    }
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
        signInWithGoogle,
        signOut,
        requestSignOut,
        confirmSignOut,
        cancelSignOut,
        updateUserProfile,
        updateUserPreferences,
        requireAuthForPayment,
        openAuthModal,
        closeAuthModal,
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

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, saveUserProfile, UserProfile, getUserProfile } from '../lib/supabase';
import { AppRoute, UserPreferences } from '../types';

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
  modalTab: 'login' | 'signup';
  pendingPlan: string | null;
  pendingRoute: AppRoute | null;
  signUp: (data: { email: string; password: string; nombre: string }) => Promise<{ success: boolean; error?: string }>;
  signIn: (data: { email: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
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
  const [userPreferences, setUserPreferences] = useState<UserPreferences>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_PREFS_KEY);
      return stored ? { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) } : DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  });

  // Save preferences changes to localStorage
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

  // Update user profile function (nombre, avatar)
  const updateUserProfile = async (updates: { nombre?: string; avatarUrl?: string }): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Usuario no autenticado' };

    const updatedUser: AppUser = {
      ...user,
      nombre: updates.nombre !== undefined ? updates.nombre : user.nombre,
      avatarUrl: updates.avatarUrl !== undefined ? updates.avatarUrl : user.avatarUrl,
    };

    setUser(updatedUser);

    // Persist in local storage session
    try {
      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(updatedUser));
    } catch (e) {
      console.warn('Could not update local storage user session:', e);
    }

    // Save to Supabase profile table
    const profile: UserProfile = {
      id: updatedUser.id,
      email: updatedUser.email,
      nombre: updatedUser.nombre,
      fecha_registro: updatedUser.createdAt,
      avatar_url: updatedUser.avatarUrl,
    };

    const result = await saveUserProfile(profile);

    // Also update Supabase auth metadata if configured
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.updateUser({
          data: {
            nombre: updatedUser.nombre,
            full_name: updatedUser.nombre,
            avatar_url: updatedUser.avatarUrl,
          },
        });
      } catch (err) {
        console.warn('Error updating Supabase auth metadata:', err);
      }
    }

    return result;
  };

  // Auth modal state
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [modalTab, setModalTab] = useState<'login' | 'signup'>('login');
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);
  const [pendingRoute, setPendingRoute] = useState<AppRoute | null>(null);
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);

  // 1. Initialize & listen to Supabase Auth state changes
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
          console.warn('Error fetching Supabase session:', err);
        }
      } else {
        // Fallback local session for seamless demo/testing without Supabase keys
        try {
          const stored = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
          if (stored && mounted) {
            const parsed = JSON.parse(stored);
            const storedRole = localStorage.getItem('aria_prop_mock_role') || parsed.role || undefined;
            setUser({ ...parsed, role: storedRole });
          }
        } catch (err) {
          console.warn('Error reading local mock auth session:', err);
        }
      }

      if (mounted) setLoading(false);
    }

    loadInitialSession();

    // Global listener for Supabase Auth state change
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

  // Helper to map Supabase user to AppUser & save to profiles table
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
    };

    // Try to retrieve role from profiles table (if present)
    try {
      const profile = await getUserProfile(sbUser.id);
      const role = (profile as any)?.role || 'user';
      setUser({ ...appUser, role });

      // Ensure profile saved
      const profilePayload: UserProfile = {
        id: appUser.id,
        email: appUser.email,
        nombre: appUser.nombre,
        fecha_registro: appUser.createdAt,
        avatar_url: appUser.avatarUrl,
      };
      await saveUserProfile(profilePayload);
    } catch (err) {
      setUser({ ...appUser, role: 'user' });
    }
  };

  // Execute post-authentication action if user had a pending payment selection
  const handlePostAuthAction = () => {
    if (pendingCallback) {
      pendingCallback();
      setPendingCallback(null);
    }

    if (pendingRoute && onRouteChange) {
      onRouteChange(pendingRoute);
      setPendingRoute(null);
    } else if (pendingPlan && onRouteChange) {
      onRouteChange('dashboard-checkout');
    }
  };

  // Sign Up method
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
      // Local Mock Fallback when Supabase is not configured
      await new Promise((resolve) => setTimeout(resolve, 800)); // smooth simulation

      const mockUser: AppUser = {
        id: `usr_${Date.now()}`,
        email,
        nombre: nombre || email.split('@')[0],
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre || email)}&background=10b981&color=fff`,
        createdAt: new Date().toISOString(),
        role: email === 'admin@admin.com' ? 'admin' : 'user',
      };

      setUser(mockUser);
      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(mockUser));
      localStorage.setItem('aria_prop_mock_role', mockUser.role || 'user');

      // Save to local profile storage
      await saveUserProfile({
        id: mockUser.id,
        email: mockUser.email,
        nombre: mockUser.nombre,
        fecha_registro: mockUser.createdAt,
        avatar_url: mockUser.avatarUrl,
      });

      setAuthModalOpen(false);
      handlePostAuthAction();
      setLoading(false);
      return { success: true };
    }
  };

  // Sign In method
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
      // Local Mock Fallback
      await new Promise((resolve) => setTimeout(resolve, 800));

      const mockUser: AppUser = {
        id: `usr_${Date.now()}`,
        email,
        nombre: email.split('@')[0],
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=10b981&color=fff`,
        createdAt: new Date().toISOString(),
        role: (email === 'admin@admin.com' || email === 'admin' || password === 'admin') ? 'admin' : 'user',
      };

      setUser(mockUser);
      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(mockUser));
      localStorage.setItem('aria_prop_mock_role', mockUser.role || 'user');

      setAuthModalOpen(false);
      handlePostAuthAction();
      setLoading(false);
      return { success: true };
    }
  };

  // Sign In with Google OAuth
  const signInWithGoogle = async () => {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (error) return { success: false, error: error.message };
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || 'Error con Google OAuth' };
      }
    } else {
      // Mock Google OAuth resolution
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 900));

      const mockUser: AppUser = {
        id: `usr_google_${Date.now()}`,
        email: 'usuario.google@gmail.com',
        nombre: 'Usuario Google LATAM',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        createdAt: new Date().toISOString(),
        role: 'user',
      };

      setUser(mockUser);
      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(mockUser));
      localStorage.setItem('aria_prop_mock_role', mockUser.role || 'user');

      setAuthModalOpen(false);
      handlePostAuthAction();
      setLoading(false);
      return { success: true };
    }
  };

  // Sign Out
  const signOut = async () => {
    setLoading(true);
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    try { localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY); } catch {}
    try { localStorage.removeItem('aria_prop_mock_role'); } catch {}
    setLoading(false);
  };

  // Require Auth Guard before payments or subscriptions
  const requireAuthForPayment = (options?: { planId?: string; targetRoute?: AppRoute; onAuthenticated?: () => void }): boolean => {
    if (user) {
      // User is already logged in, proceed directly!
      if (options?.onAuthenticated) options.onAuthenticated();
      if (options?.targetRoute && onRouteChange) onRouteChange(options.targetRoute);
      return true;
    }

    // User is NOT logged in: Block payment and trigger Auth Modal!
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
        modalTab,
        pendingPlan,
        pendingRoute,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        updateUserProfile,
        updateUserPreferences,
        requireAuthForPayment,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
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

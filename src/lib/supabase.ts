/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

// Environment variables for Supabase
const env = (import.meta as unknown as { env: Record<string, string> }).env || {};
const supabaseUrl = (env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (env.VITE_SUPABASE_ANON_KEY || '').trim();

// Fallback dummy values to prevent crashes if env vars are missing or invalid
const dummyUrl = 'https://placeholder-supabase-project.supabase.co';
const dummyKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

const isValidHttpUrl = (urlStr: string) => {
  if (!urlStr) return false;
  try {
    const parsed = new URL(urlStr);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-supabase-url.supabase.co' &&
  supabaseUrl !== 'https://your-supabase-project.supabase.co' &&
  isValidHttpUrl(supabaseUrl)
);

let _supabase: ReturnType<typeof createClient> | null = null;
try {
  const validUrl = isSupabaseConfigured && isValidHttpUrl(supabaseUrl) ? supabaseUrl : dummyUrl;
  const validKey = isSupabaseConfigured ? supabaseAnonKey : dummyKey;

  _supabase = createClient(validUrl, validKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
} catch (err) {
  // eslint-disable-next-line no-console
  console.warn('Supabase client initialization failed, falling back to mock. Error:', err);
  _supabase = null as any;
}

export const supabase = _supabase as any;

export interface UserProfile {
  id: string;
  email: string;
  nombre: string;
  fecha_registro: string;
  avatar_url?: string;
  estado_cuenta?: 'gratis' | 'prueba_activa' | 'prueba_7dias' | 'pro_basico' | 'plan_activo';
  plan_id?: string;
  fecha_fin_prueba?: string;
}

/**
 * Gets user profile from Supabase 'profiles' or 'usuarios' table or localStorage.
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!isSupabaseConfigured || !supabase) {
    try {
      const stored = localStorage.getItem('aria_user_profiles') || '{}';
      const profilesMap = JSON.parse(stored);
      return profilesMap[userId] || null;
    } catch {
      return null;
    }
  }

  try {
    const { data: pData } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (pData) return pData as UserProfile;

    const { data: uData } = await supabase.from('usuarios').select('*').eq('id', userId).maybeSingle();
    if (uData) return uData as UserProfile;

    return null;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('getUserProfile error', e);
    return null;
  }
}

/**
 * Saves or updates user profile in Supabase 'profiles' or 'usuarios' table.
 */
export async function saveUserProfile(profile: UserProfile): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    // Local storage fallback for seamless testing
    try {
      const stored = localStorage.getItem('aria_user_profiles') || '{}';
      const profilesMap = JSON.parse(stored);
      profilesMap[profile.id] = { ...profilesMap[profile.id], ...profile };
      localStorage.setItem('aria_user_profiles', JSON.stringify(profilesMap));
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  try {
    const payload: any = {
      id: profile.id,
      email: profile.email,
      nombre: profile.nombre,
      fecha_registro: profile.fecha_registro,
      avatar_url: profile.avatar_url,
      ...(profile.estado_cuenta ? { estado_cuenta: profile.estado_cuenta } : {}),
      ...(profile.plan_id ? { plan_id: profile.plan_id } : {}),
      ...(profile.fecha_fin_prueba ? { fecha_fin_prueba: profile.fecha_fin_prueba } : {}),
    };

    // Try saving to 'profiles' table first
    const { error: errorProfiles } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' });

    if (errorProfiles) {
      // Fallback try 'usuarios' table
      const { error: errorUsuarios } = await supabase
        .from('usuarios')
        .upsert(payload, { onConflict: 'id' });

      if (errorUsuarios) {
        // eslint-disable-next-line no-console
        console.warn('Could not save to profiles or usuarios table in Supabase:', errorUsuarios.message);
        return { success: false, error: errorUsuarios.message };
      }
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

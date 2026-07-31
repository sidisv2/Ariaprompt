import { createClient } from '@supabase/supabase-js';

// Configuration check
const supabaseUrl = (
  import.meta.env?.VITE_SUPABASE_URL ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
  ''
).trim();

const supabaseAnonKey = (
  import.meta.env?.VITE_SUPABASE_ANON_KEY ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
  ''
).trim();

export const isSupabaseConfigured =
  Boolean(supabaseUrl && supabaseAnonKey) &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseUrl.includes('your-supabase');

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export interface UserProfile {
  id: string;
  email: string;
  nombre: string;
  agency_name?: string;
  estado_cuenta?: string;
  plan_id?: string;
  fecha_registro?: string;
  avatar_url?: string;
  is_demo_account?: boolean;
}

/**
 * Gets user profile from Supabase 'profiles' table or localStorage.
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
    return null;
  } catch (e) {
    console.warn('getUserProfile error', e);
    return null;
  }
}

/**
 * Saves or updates user profile in Supabase 'profiles' table.
 */
export async function saveUserProfile(profile: UserProfile): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
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
    // Only send fields that match the public.profiles schema columns exactly:
    // id, email, nombre, agency_name, estado_cuenta, plan_id, fecha_registro, is_demo_account, updated_at
    const payload: Record<string, any> = {
      id: profile.id,
      email: profile.email,
      nombre: profile.nombre,
      updated_at: new Date().toISOString(),
    };

    if (profile.agency_name) payload.agency_name = profile.agency_name;
    if (profile.estado_cuenta) payload.estado_cuenta = profile.estado_cuenta;
    if (profile.plan_id) payload.plan_id = profile.plan_id;
    if (profile.fecha_registro) payload.fecha_registro = profile.fecha_registro;
    if (profile.is_demo_account !== undefined) payload.is_demo_account = profile.is_demo_account;

    const { error: errorProfiles } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' });

    if (errorProfiles) {
      console.warn('Could not save to profiles table in Supabase:', errorProfiles.message);
      return { success: false, error: errorProfiles.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

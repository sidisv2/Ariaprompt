import { supabase } from './supabase';

/**
 * Upload a file to user-files/{userId}/{filename}
 */
export async function uploadUserFile(userId: string, file: File, onProgress?: (p: number) => void) {
  const path = `${userId}/${file.name}`;
  if (!supabase) {
    // fallback: store a tiny representation in localStorage
    try {
      const key = `local_user_files_${userId}`;
      const stored = JSON.parse(localStorage.getItem(key) || '[]');
      stored.push({ name: file.name, size: file.size, created_at: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(stored));
      return { path };
    } catch (e) {
      throw e;
    }
  }

  // If you want private files, keep bucket as private and use download() for secure access
  const { data, error } = await supabase.storage.from('user-files').upload(path, file, { upsert: true });
  if (error) throw error;
  return data;
}

/**
 * List files for a user
 */
export async function listUserFiles(userId: string) {
  if (!supabase) {
    const key = `local_user_files_${userId}`;
    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
      return [];
    }
  }
  const { data, error } = await supabase.storage.from('user-files').list(userId, { limit: 100, offset: 0 });
  if (error) throw error;
  return data;
}

/**
 * Get a public URL (if you want to expose, otherwise use download for private)
 */
export function getPublicUrl(path: string) {
  if (!supabase) return null;
  return supabase.storage.from('user-files').getPublicUrl(path).data?.publicUrl || null;
}

/**
 * Download a file (private)
 */
export async function downloadUserFile(path: string) {
  if (!supabase) throw new Error('Supabase no configurado para descargas');
  const { data, error } = await supabase.storage.from('user-files').download(path);
  if (error) throw error;
  return data;
}

/**
 * Remove a file (ensure path includes userId prefix)
 */
export async function deleteUserFile(path: string) {
  if (!supabase) {
    // remove from localStorage list
    try {
      const [userId, ...rest] = path.split('/');
      const key = `local_user_files_${userId}`;
      const stored = JSON.parse(localStorage.getItem(key) || '[]');
      const name = rest.join('/');
      const filtered = stored.filter((s: any) => s.name !== name);
      localStorage.setItem(key, JSON.stringify(filtered));
      return true;
    } catch (e) {
      throw e;
    }
  }
  const { error } = await supabase.storage.from('user-files').remove([path]);
  if (error) throw error;
  return true;
}

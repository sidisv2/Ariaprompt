import { supabase, isSupabaseConfigured } from './supabase';
import { UserFile } from '../types';

const BUCKET_NAME = 'user-files';
const LOCAL_STORAGE_FILES_KEY = 'aria_user_files_db';
const DEFAULT_SIGNED_URL_EXPIRATION = 3600; // 60 minutes

/**
 * Helper to classify file types
 */
export function getFileTypeCategory(mimeType: string, filename: string): 'image' | 'pdf' | 'document' | 'other' {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
    return 'image';
  }
  if (mimeType === 'application/pdf' || ext === 'pdf') {
    return 'pdf';
  }
  if (
    mimeType.includes('word') ||
    mimeType.includes('document') ||
    mimeType.includes('sheet') ||
    ['doc', 'docx', 'xls', 'xlsx', 'txt', 'csv'].includes(ext)
  ) {
    return 'document';
  }
  return 'other';
}

/**
 * Formats bytes to human-readable size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Generates a fresh temporary Signed URL for a private file in Supabase Storage.
 * Expire token automatically after expiresInSeconds (default 60 minutes).
 */
export async function getSignedUrlForFile(
  storagePath: string,
  expiresInSeconds: number = DEFAULT_SIGNED_URL_EXPIRATION
): Promise<string | null> {
  if (isSupabaseConfigured && storagePath) {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(storagePath, expiresInSeconds);

      if (!error && data?.signedUrl) {
        return data.signedUrl;
      } else if (error) {
        console.warn('Error al generar Signed URL en Supabase Storage:', error.message);
      }
    } catch (e) {
      console.warn('Excepción al generar Signed URL:', e);
    }
  }
  return null;
}

/**
 * Uploads a file to private Supabase Storage bucket 'user-files' under path `user-files/{userId}/{filename}`
 */
export async function uploadFileToSupabase(
  userId: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ success: boolean; fileData?: UserFile; error?: string }> {
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `${userId}/${timestamp}_${sanitizedName}`;

  if (isSupabaseConfigured) {
    try {
      if (onProgress) onProgress(30);

      // Upload file to PRIVATE Supabase Storage bucket
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (onProgress) onProgress(80);

      if (error) {
        console.warn('Supabase storage upload error:', error.message);
        return { success: false, error: `Error en Supabase Storage: ${error.message}` };
      }

      // Generate a temporary Signed URL with expiration token for initial display
      const signedUrl = await getSignedUrlForFile(storagePath, DEFAULT_SIGNED_URL_EXPIRATION);

      const newFile: UserFile = {
        id: `file_${timestamp}`,
        userId,
        name: file.name,
        sizeBytes: file.size,
        type: getFileTypeCategory(file.type, file.name),
        mimeType: file.type || 'application/octet-stream',
        url: signedUrl || '',
        uploadedAt: new Date().toISOString(),
        storagePath,
      };

      if (onProgress) onProgress(100);

      // Save file record into local cache as well for instant UI updates
      saveFileToLocalList(userId, newFile);

      return { success: true, fileData: newFile };
    } catch (err: any) {
      console.warn('Excepción en Supabase Storage:', err);
      return { success: false, error: `Excepción en Supabase Storage: ${err?.message || 'Error de conexión'}` };
    }
  } else {
    return uploadFileToLocalStorage(userId, file, onProgress);
  }
}

/**
 * Local Storage Fallback for uploads when Supabase Storage is not initialized
 */
async function uploadFileToLocalStorage(
  userId: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ success: boolean; fileData?: UserFile; error?: string }> {
  return new Promise(async (resolve) => {
    if (onProgress) onProgress(40);

    let dataUrl = '';
    if (typeof FileReader !== 'undefined') {
      const reader = new FileReader();
      reader.onload = () => {
        if (onProgress) onProgress(90);
        dataUrl = reader.result as string;
        finishUpload(dataUrl);
      };
      reader.onerror = () => {
        resolve({ success: false, error: 'Error al leer el archivo en el navegador' });
      };
      reader.readAsDataURL(file);
    } else {
      // Node environment fallback using Buffer
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        dataUrl = `data:${file.type || 'application/octet-stream'};base64,${buffer.toString('base64')}`;
        finishUpload(dataUrl);
      } catch (err: any) {
        resolve({ success: false, error: 'Error procesando buffer de archivo' });
      }
    }

    function finishUpload(url: string) {
      const newFile: UserFile = {
        id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId,
        name: file.name,
        sizeBytes: file.size,
        type: getFileTypeCategory(file.type, file.name),
        mimeType: file.type || 'application/octet-stream',
        url: url,
        uploadedAt: new Date().toISOString(),
        storagePath: `${userId}/${file.name}`,
      };

      saveFileToLocalList(userId, newFile);

      if (onProgress) onProgress(100);
      resolve({ success: true, fileData: newFile });
    }
  });
}

const memoryFileStore = new Map<string, UserFile[]>();

/**
 * Saves file metadata to local list for persistence across sessions
 */
function saveFileToLocalList(userId: string, newFile: UserFile) {
  try {
    const existing = fetchUserFilesFromLocalStorage(userId);
    const updated = [newFile, ...existing.filter((f) => f.id !== newFile.id)];
    const key = `${LOCAL_STORAGE_FILES_KEY}_${userId}`;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(updated));
    }
    memoryFileStore.set(key, updated);
  } catch (e) {
    console.warn('Could not persist file to localStorage:', e);
  }
}

/**
 * Reads local list of user files
 */
function fetchUserFilesFromLocalStorage(userId: string): UserFile[] {
  try {
    const key = `${LOCAL_STORAGE_FILES_KEY}_${userId}`;
    if (typeof localStorage !== 'undefined') {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    }
    return memoryFileStore.get(key) || [];
  } catch {
    return [];
  }
}

/**
 * Fetches all files owned by a specific user from private Supabase Storage and local cache.
 * Generates fresh temporary Signed URLs for all files from the private bucket.
 */
export async function getUserFiles(userId: string): Promise<UserFile[]> {
  const localFiles = fetchUserFilesFromLocalStorage(userId);

  if (isSupabaseConfigured) {
    try {
      // List user's private directory in bucket 'user-files'
      const { data, error } = await supabase.storage.from(BUCKET_NAME).list(userId, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      });

      if (!error && data) {
        const remoteFilesProms = data.map(async (item) => {
          const path = `${userId}/${item.name}`;
          // Generate fresh Signed URL with expiration token for private file access
          const signedUrl = await getSignedUrlForFile(path, DEFAULT_SIGNED_URL_EXPIRATION);

          // Remove timestamp prefix if present in name
          const cleanName = item.name.includes('_') ? item.name.substring(item.name.indexOf('_') + 1) : item.name;

          return {
            id: item.id || `sb_${item.name}`,
            userId,
            name: cleanName,
            sizeBytes: item.metadata?.size || 1024 * 50,
            type: getFileTypeCategory(item.metadata?.mimetype || '', item.name),
            mimeType: item.metadata?.mimetype || 'application/octet-stream',
            url: signedUrl || '',
            uploadedAt: item.created_at || new Date().toISOString(),
            storagePath: path,
          };
        });

        const remoteFiles = await Promise.all(remoteFilesProms);

        // Merge and deduplicate by storagePath or name
        const combined = [...remoteFiles];
        for (const lf of localFiles) {
          if (!combined.some((rf) => rf.storagePath === lf.storagePath || rf.name === lf.name)) {
            combined.push(lf);
          }
        }
        return combined.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      }
    } catch (e) {
      console.warn('Error reading files from Supabase Storage bucket:', e);
    }
  }

  return localFiles;
}

/**
 * Deletes a file from private Supabase Storage bucket 'user-files' and local list
 */
export async function deleteUserFile(
  userId: string,
  fileId: string,
  storagePath: string
): Promise<{ success: boolean; error?: string }> {
  // 1. Remove from local storage list
  try {
    const key = `${LOCAL_STORAGE_FILES_KEY}_${userId}`;
    const local = fetchUserFilesFromLocalStorage(userId);
    const filtered = local.filter((f) => f.id !== fileId && f.storagePath !== storagePath);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(filtered));
    }
    memoryFileStore.set(key, filtered);
  } catch (e) {
    console.warn('Error removing file from local storage:', e);
  }

  // 2. Remove from Supabase Storage if configured
  if (isSupabaseConfigured && storagePath) {
    try {
      const { error } = await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
      if (error) {
        console.warn('Error deleting from Supabase storage:', error.message);
      }
    } catch (err: any) {
      console.warn('Exception removing file from Supabase:', err);
    }
  }

  return { success: true };
}

/**
 * Trigger browser file download using a fresh temporary Signed URL from private storage.
 */
export async function downloadFileToDevice(fileUrl: string, fileName: string, storagePath?: string) {
  let targetUrl = fileUrl;

  // Request a fresh Signed URL on-demand right before downloading if storagePath is provided
  if (isSupabaseConfigured && storagePath) {
    const freshSignedUrl = await getSignedUrlForFile(storagePath, DEFAULT_SIGNED_URL_EXPIRATION);
    if (freshSignedUrl) {
      targetUrl = freshSignedUrl;
    }
  }

  const link = document.createElement('a');
  link.href = targetUrl;
  link.download = fileName;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * SQL instructions for bucket creation and Supabase RLS security policies for PRIVATE storage bucket
 */
export const SUPABASE_STORAGE_RLS_SQL = `-- 1. Crear el bucket PRIVADO 'user-files' en Supabase Storage (public = false)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-files', 'user-files', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- 2. Habilitar la política RLS para que CADA USUARIO solo pueda LEER y GENERAR SIGNED URLs de sus propios archivos
CREATE POLICY "Permitir lectura y signed URLs solo a archivos de su propio user_id"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'user-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 3. Habilitar la política RLS para que CADA USUARIO solo pueda SUBIR archivos a su propia carpeta
CREATE POLICY "Permitir insercion solo en carpeta de su propio user_id"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 4. Habilitar la política RLS para que CADA USUARIO solo pueda ELIMINAR sus propios archivos
CREATE POLICY "Permitir eliminacion solo de archivos de su propio user_id"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'user-files' AND (storage.foldername(name))[1] = auth.uid()::text);
`;

/**
 * SQL instructions for database tables (leads, propiedades, profiles) Multi-Tenant RLS Policies
 */
export const SUPABASE_MULTI_TENANT_RLS_SQL = `-- HABILITAR RLS EN TABLAS DE BASE DE DATOS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.propiedades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS RLS TABLA 'leads' (4 cláusulas separadas)
CREATE POLICY "Leads_Select_Policy" ON public.leads FOR SELECT TO authenticated USING (auth.uid() = agency_id);
CREATE POLICY "Leads_Insert_Policy" ON public.leads FOR INSERT TO authenticated WITH CHECK (auth.uid() = agency_id);
CREATE POLICY "Leads_Update_Policy" ON public.leads FOR UPDATE TO authenticated USING (auth.uid() = agency_id) WITH CHECK (auth.uid() = agency_id);
CREATE POLICY "Leads_Delete_Policy" ON public.leads FOR DELETE TO authenticated USING (auth.uid() = agency_id);

-- POLÍTICAS RLS TABLA 'propiedades' (4 cláusulas separadas)
CREATE POLICY "Propiedades_Select_Policy" ON public.propiedades FOR SELECT TO authenticated USING (auth.uid() = agency_id);
CREATE POLICY "Propiedades_Insert_Policy" ON public.propiedades FOR INSERT TO authenticated WITH CHECK (auth.uid() = agency_id);
CREATE POLICY "Propiedades_Update_Policy" ON public.propiedades FOR UPDATE TO authenticated USING (auth.uid() = agency_id) WITH CHECK (auth.uid() = agency_id);
CREATE POLICY "Propiedades_Delete_Policy" ON public.propiedades FOR DELETE TO authenticated USING (auth.uid() = agency_id);
`;

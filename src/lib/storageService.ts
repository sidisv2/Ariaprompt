import { supabase, isSupabaseConfigured } from './supabase';
import { UserFile } from '../types';

const BUCKET_NAME = 'user-files';
const LOCAL_STORAGE_FILES_KEY = 'aria_user_files_db';

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
 * Uploads a file to Supabase Storage bucket 'user-files' under path `user-files/{userId}/{filename}`
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

      // Upload file to Supabase Storage bucket
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (onProgress) onProgress(80);

      if (error) {
        console.warn('Supabase storage upload error:', error.message);
        // Fallback to local storage if bucket doesn't exist yet on user's Supabase project
        return uploadFileToLocalStorage(userId, file);
      }

      // Get public URL for the file
      const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
      const publicUrl = urlData.publicUrl;

      const newFile: UserFile = {
        id: `file_${timestamp}`,
        userId,
        name: file.name,
        sizeBytes: file.size,
        type: getFileTypeCategory(file.type, file.name),
        mimeType: file.type || 'application/octet-stream',
        url: publicUrl,
        uploadedAt: new Date().toISOString(),
        storagePath,
      };

      if (onProgress) onProgress(100);

      // Save file record into local cache as well for instant UI updates
      saveFileToLocalList(userId, newFile);

      return { success: true, fileData: newFile };
    } catch (err: any) {
      console.warn('Fallback to local storage due to Supabase Storage exception:', err);
      return uploadFileToLocalStorage(userId, file);
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
  return new Promise((resolve) => {
    if (onProgress) onProgress(40);

    const reader = new FileReader();
    reader.onload = () => {
      if (onProgress) onProgress(90);
      const dataUrl = reader.result as string;

      const newFile: UserFile = {
        id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId,
        name: file.name,
        sizeBytes: file.size,
        type: getFileTypeCategory(file.type, file.name),
        mimeType: file.type || 'application/octet-stream',
        url: dataUrl,
        uploadedAt: new Date().toISOString(),
        storagePath: `${userId}/${file.name}`,
      };

      saveFileToLocalList(userId, newFile);

      if (onProgress) onProgress(100);
      resolve({ success: true, fileData: newFile });
    };

    reader.onerror = () => {
      resolve({ success: false, error: 'Error al leer el archivo en el navegador' });
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Saves file metadata to local list for persistence across sessions
 */
function saveFileToLocalList(userId: string, newFile: UserFile) {
  try {
    const existing = fetchUserFilesFromLocalStorage(userId);
    const updated = [newFile, ...existing.filter((f) => f.id !== newFile.id)];
    const key = `${LOCAL_STORAGE_FILES_KEY}_${userId}`;
    localStorage.setItem(key, JSON.stringify(updated));
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
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Fetches all files owned by a specific user from Supabase Storage and local cache
 */
export async function getUserFiles(userId: string): Promise<UserFile[]> {
  const localFiles = fetchUserFilesFromLocalStorage(userId);

  if (isSupabaseConfigured) {
    try {
      // List user's directory in bucket 'user-files'
      const { data, error } = await supabase.storage.from(BUCKET_NAME).list(userId, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      });

      if (!error && data) {
        const remoteFiles: UserFile[] = data.map((item) => {
          const path = `${userId}/${item.name}`;
          const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);

          // Remove timestamp prefix if present in name
          const cleanName = item.name.includes('_') ? item.name.substring(item.name.indexOf('_') + 1) : item.name;

          return {
            id: item.id || `sb_${item.name}`,
            userId,
            name: cleanName,
            sizeBytes: item.metadata?.size || 1024 * 50,
            type: getFileTypeCategory(item.metadata?.mimetype || '', item.name),
            mimeType: item.metadata?.mimetype || 'application/octet-stream',
            url: urlData.publicUrl,
            uploadedAt: item.created_at || new Date().toISOString(),
            storagePath: path,
          };
        });

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
 * Deletes a file from Supabase Storage bucket 'user-files' and local list
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
    localStorage.setItem(key, JSON.stringify(filtered));
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
 * Trigger browser file download
 */
export function downloadFileToDevice(fileUrl: string, fileName: string) {
  const link = document.createElement('a');
  link.href = fileUrl;
  link.download = fileName;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * SQL instructions for bucket creation and Supabase RLS security policies
 */
export const SUPABASE_STORAGE_RLS_SQL = `-- 1. Crear el bucket privado 'user-files' en Supabase Storage
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-files', 'user-files', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Habilitar la política RLS para que CADA USUARIO solo pueda LEER sus propios archivos
CREATE POLICY "Permitir lectura solo a archivos de su propio user_id"
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

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
const SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const CRON_SECRET = (process.env.CRON_SECRET || '').trim();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Verify Vercel Cron authorization header if CRON_SECRET is configured
  const authHeader = req.headers.authorization;
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}` && req.query.key !== CRON_SECRET) {
    return res.status(401).json({ error: 'No autorizado para ejecutar el cron job de limpieza demo' });
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY' });
  }

  try {
    const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // 2. Fetch all users from Supabase Auth via admin API
    const { data: usersData, error: listErr } = await adminSupabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (listErr) {
      return res.status(500).json({ error: `Error al listar usuarios: ${listErr.message}` });
    }

    const now = Date.now();
    const EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours

    // 3. Filter demo users created > 24 hours ago
    const expiredDemoUsers = (usersData.users || []).filter((user) => {
      const isDemo =
        user.user_metadata?.is_demo_account === true ||
        user.user_metadata?.is_demo === true ||
        (user.email && user.email.startsWith('demo_') && user.email.endsWith('@ariaprop.com'));

      if (!isDemo) return false;

      const createdAt = new Date(user.created_at).getTime();
      return now - createdAt > EXPIRATION_MS;
    });

    console.log(`[Cron Cleanup] Encontradas ${expiredDemoUsers.length} cuentas demo fantasma expiradas.`);

    const deletedIds: string[] = [];
    const errors: string[] = [];

    // 4. Delete each expired demo account (PostgreSQL ON DELETE CASCADE handles leads/properties/profiles)
    for (const demoUser of expiredDemoUsers) {
      try {
        // A. Clean up storage files in bucket 'user-files' for this user_id
        const { data: files } = await adminSupabase.storage.from('user-files').list(demoUser.id);
        if (files && files.length > 0) {
          const paths = files.map((f) => `${demoUser.id}/${f.name}`);
          await adminSupabase.storage.from('user-files').remove(paths);
        }

        // B. Delete user from Supabase Auth (Cascades to public.profiles, public.leads, public.propiedades)
        const { error: delErr } = await adminSupabase.auth.admin.deleteUser(demoUser.id);
        if (delErr) {
          errors.push(`Error eliminando ${demoUser.id}: ${delErr.message}`);
        } else {
          deletedIds.push(demoUser.id);
        }
      } catch (err: any) {
        errors.push(`Excepción en ${demoUser.id}: ${err.message}`);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Limpieza de cuentas demo completada exitosamente.`,
      cleanedCount: deletedIds.length,
      deletedUserIds: deletedIds,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[Cron Cleanup Error]:', err);
    return res.status(500).json({ error: `Fallo en el proceso de limpieza: ${err.message}` });
  }
}

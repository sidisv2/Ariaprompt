import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qdadkcpqzpvdiqxdnjuf.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkYWRrY3BxenB2ZGlxeGRuanVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDkzODkyNSwiZXhwIjoyMTAwNTE0OTI1fQ.kWqOKIhNwaKTAugbRZ8I2-qxAx7NakaxdYF665nf9-g';

const supabase = createClient(supabaseUrl, serviceKey);

async function inspectProfiles() {
  console.log('Fetching all rows from public.profiles...');
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*');

  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }

  console.log(`Total profiles found: ${profiles?.length || 0}\n`);
  console.log('--- PROFILES TABLE CONTENT ---');
  console.log(JSON.stringify(profiles, null, 2));

  // Check auth.users table as well
  console.log('\nFetching users from auth.users (via admin auth)...');
  const { data: authUsers, error: authErr } = await supabase.auth.admin.listUsers();
  if (authErr) {
    console.error('Error fetching auth users:', authErr);
  } else {
    console.log(`Total auth users found: ${authUsers.users.length}`);
    authUsers.users.forEach(u => {
      console.log(`- ID: ${u.id} | Email: ${u.email} | Provider: ${u.app_metadata?.provider} | Created: ${u.created_at}`);
    });
  }
}

inspectProfiles();

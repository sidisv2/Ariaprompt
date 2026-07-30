import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qdadkcpqzpvdiqxdnjuf.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkYWRrY3BxenB2ZGlxeGRuanVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDkzODkyNSwiZXhwIjoyMTAwNTE0OTI1fQ.kWqOKIhNwaKTAugbRZ8I2-qxAx7NakaxdYF665nf9-g';

const supabase = createClient(supabaseUrl, serviceKey);

async function testProfileCreation() {
  console.log('Testing profile upsert for google oauth user...');

  const googleUser = {
    id: '5cab573c-794f-4657-9d40-86b46cadb28c', // craquea54@gmail.com
    email: 'craquea54@gmail.com',
    nombre: 'Valentin Google Test',
    estado_cuenta: 'gratis',
    plan_id: 'normal',
    fecha_registro: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(googleUser, { onConflict: 'id' })
    .select();

  if (error) {
    console.error('Error upserting profile:', error);
    return;
  }

  console.log('Profile created/updated successfully in Supabase DB:');
  console.log(JSON.stringify(data, null, 2));

  // Read back profile from Supabase
  const { data: readBack } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', googleUser.id)
    .single();

  console.log('\nVerified Profile read from Supabase DB:');
  console.log(`ID: ${readBack.id}`);
  console.log(`Email: ${readBack.email}`);
  console.log(`estado_cuenta: ${readBack.estado_cuenta}`);
  console.log(`plan_id: ${readBack.plan_id}`);
}

testProfileCreation();

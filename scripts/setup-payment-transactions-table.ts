import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qdadkcpqzpvdiqxdnjuf.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkYWRrY3BxenB2ZGlxeGRuanVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDkzODkyNSwiZXhwIjoyMTAwNTE0OTI1fQ.kWqOKIhNwaKTAugbRZ8I2-qxAx7NakaxdYF665nf9-g';

const supabase = createClient(supabaseUrl, serviceKey);

async function testPaymentTransactionsTable() {
  console.log('Checking if public.payment_transactions table exists...');
  const { data, error } = await supabase.from('payment_transactions').select('*').limit(1);

  if (error) {
    console.log('⚠️ payment_transactions table error:', error.message);
    if (error.code === 'PGRST301' || error.message.includes('does not exist')) {
      console.log('Table public.payment_transactions needs to be created in Supabase SQL editor or via RPC.');
    }
  } else {
    console.log('✅ public.payment_transactions table exists and is accessible!');
    console.log('Sample rows:', data);
  }
}

testPaymentTransactionsTable();

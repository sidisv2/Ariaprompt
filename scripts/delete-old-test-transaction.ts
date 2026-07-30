import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qdadkcpqzpvdiqxdnjuf.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkYWRrY3BxenB2ZGlxeGRuanVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDkzODkyNSwiZXhwIjoyMTAwNTE0OTI1fQ.kWqOKIhNwaKTAugbRZ8I2-qxAx7NakaxdYF665nf9-g';

const supabase = createClient(supabaseUrl, serviceKey);

async function deleteOldTestTxn() {
  console.log('🧹 Cleaning up test transaction txn_01hv8wptq8987qeep44cyrewp9 from public.payment_transactions...');
  const { error } = await supabase
    .from('payment_transactions')
    .delete()
    .eq('txn_id', 'txn_01hv8wptq8987qeep44cyrewp9');

  if (error) {
    console.error('❌ Failed to delete test transaction:', error.message);
  } else {
    console.log('✅ Deleted test transaction txn_01hv8wptq8987qeep44cyrewp9 successfully. Table is clean!');
  }
}

deleteOldTestTxn();

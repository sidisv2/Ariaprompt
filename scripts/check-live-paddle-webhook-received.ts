import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qdadkcpqzpvdiqxdnjuf.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkYWRrY3BxenB2ZGlxeGRuanVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDkzODkyNSwiZXhwIjoyMTAwNTE0OTI1fQ.kWqOKIhNwaKTAugbRZ8I2-qxAx7NakaxdYF665nf9-g';

const supabase = createClient(supabaseUrl, serviceKey);

async function checkLiveWebhookData() {
  console.log('🔍 Checking public.payment_transactions for recent live Paddle webhooks...');
  const { data: txs, error: txErr } = await supabase
    .from('payment_transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (txErr) {
    console.error('❌ Error querying payment_transactions:', txErr.message);
    return;
  }

  console.log(`\n📋 Recent Transactions Found: ${txs?.length || 0}`);
  if (txs && txs.length > 0) {
    console.log(JSON.stringify(txs, null, 2));

    // Test verify endpoint for the latest transaction
    const latestTxnId = txs[0].txn_id;
    console.log(`\n🌐 Testing GET https://ariaprop.online/api/verify-transaction?txn_id=${latestTxnId}...`);
    const res = await fetch(`https://ariaprop.online/api/verify-transaction?txn_id=${latestTxnId}`);
    const json = await res.json();
    console.log('📡 Response:', JSON.stringify(json, null, 2));
  } else {
    console.log('ℹ️ No live transactions recorded yet in payment_transactions table.');
  }
}

checkLiveWebhookData();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qdadkcpqzpvdiqxdnjuf.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkYWRrY3BxenB2ZGlxeGRuanVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDkzODkyNSwiZXhwIjoyMTAwNTE0OTI1fQ.kWqOKIhNwaKTAugbRZ8I2-qxAx7NakaxdYF665nf9-g';

const supabase = createClient(supabaseUrl, serviceKey);

async function runE2EPaddleTest() {
  console.log('🔍 Testing Supabase table public.payment_transactions status...');
  
  const { data: testSelect, error: selectError } = await supabase
    .from('payment_transactions')
    .select('*')
    .limit(1);

  if (selectError) {
    console.log('\n❌ TABLE MISSING: public.payment_transactions does not exist yet in Supabase.');
    console.log('📌 ACTION REQUIRED: Please execute Section 14 in Supabase SQL Editor (dashboard.supabase.com).\n');
    return;
  }

  console.log('✅ Table public.payment_transactions is ACTIVE in Supabase!');

  // Create a real test transaction ID
  const testTxnId = `txn_live_paddle_test_${Date.now()}`;
  const testEmail = 'demo.agencia@ariaprop.online';
  const testPlan = 'pro';
  const testAmount = 99;

  console.log(`\n🚀 Inserting test transaction "${testTxnId}" into payment_transactions...`);

  const { data: insertedRow, error: insertErr } = await supabase
    .from('payment_transactions')
    .upsert({
      txn_id: testTxnId,
      customer_email: testEmail,
      plan_id: testPlan,
      amount: testAmount,
      currency: 'USD',
      status: 'completed',
      raw_event: { event_type: 'transaction.completed', source: 'e2e_verification_test' },
      created_at: new Date().toISOString()
    }, { onConflict: 'txn_id' })
    .select('*')
    .single();

  if (insertErr) {
    console.error('❌ Insert failed:', insertErr.message);
    return;
  }

  console.log('✅ INSERT SUCCESSFUL! Recorded row in payment_transactions:');
  console.log(JSON.stringify(insertedRow, null, 2));

  // Verify API endpoint /api/verify-transaction
  console.log(`\n🌐 Testing GET https://ariaprop.online/api/verify-transaction?txn_id=${testTxnId}...`);
  try {
    const res = await fetch(`https://ariaprop.online/api/verify-transaction?txn_id=${testTxnId}`);
    const json = await res.json();

    console.log('📡 Response from /api/verify-transaction:');
    console.log(JSON.stringify(json, null, 2));

    if (json.verified === true && json.txn_id === testTxnId && json.amount === testAmount) {
      console.log('\n🎉 E2E TEST PASSED POSITIVELY! Server confirmed transaction with verified: true!');
    } else {
      console.error('\n❌ Verification check failed:', json);
    }
  } catch (err: any) {
    console.error('❌ Failed to call verify-transaction endpoint:', err.message);
  }
}

runE2EPaddleTest();

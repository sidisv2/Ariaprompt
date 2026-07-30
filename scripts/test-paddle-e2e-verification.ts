import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qdadkcpqzpvdiqxdnjuf.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkYWRrY3BxenB2ZGlxeGRuanVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDkzODkyNSwiZXhwIjoyMTAwNTE0OTI1fQ.kWqOKIhNwaKTAugbRZ8I2-qxAx7NakaxdYF665nf9-g';

const supabase = createClient(supabaseUrl, serviceKey);

async function runE2EPaddleTest() {
  console.log('🔍 STEP 0: Testing Supabase table public.payment_transactions status...');
  
  const { data: testSelect, error: selectError } = await supabase
    .from('payment_transactions')
    .select('*')
    .limit(1);

  if (selectError) {
    console.log('\n❌ TABLE MISSING: public.payment_transactions does not exist yet in Supabase.');
    console.log('📌 ACTION REQUIRED: Please execute Section 14 in Supabase SQL Editor (dashboard.supabase.com).\n');
    return;
  }

  console.log('✅ Table public.payment_transactions is ACTIVE and accessible in Supabase!\n');

  // Create a test transaction ID
  const testTxnId = `txn_real_paddle_e2e_${Date.now()}`;
  const testEmail = 'demo.agencia@ariaprop.online';
  const testPlan = 'pro';
  const testAmount = 99;

  console.log(`🚀 STEP 1: Executing INSERT into public.payment_transactions for txn_id "${testTxnId}"...`);

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

  console.log('✅ STEP 1 COMPLETE: Insert executed successfully.');

  console.log(`\n📋 STEP 2: Executing SELECT query on public.payment_transactions for txn_id "${testTxnId}"...`);
  const { data: selectedRow, error: selectRowErr } = await supabase
    .from('payment_transactions')
    .select('*')
    .eq('txn_id', testTxnId)
    .single();

  if (selectRowErr || !selectedRow) {
    console.error('❌ SELECT failed to retrieve inserted row:', selectRowErr?.message);
    return;
  }

  console.log('✅ STEP 2 COMPLETE: SELECT confirmed row exists in Supabase:');
  console.log(JSON.stringify(selectedRow, null, 2));

  // Verify API endpoint /api/verify-transaction
  console.log(`\n🌐 STEP 3: Executing GET https://ariaprop.online/api/verify-transaction?txn_id=${testTxnId}...`);
  try {
    const res = await fetch(`https://ariaprop.online/api/verify-transaction?txn_id=${testTxnId}`);
    const json = await res.json();

    console.log('📡 Response from /api/verify-transaction:');
    console.log(JSON.stringify(json, null, 2));

    if (json.verified === true && json.txn_id === testTxnId && json.amount === testAmount) {
      console.log('\n🎉 STEP 3 COMPLETE: Positive verification test PASSED! Server confirmed verified: true!');
    } else {
      console.error('\n❌ STEP 3 FAILED: Verification check did not return expected true response:', json);
    }
  } catch (err: any) {
    console.error('❌ STEP 3 FAILED: Request error:', err.message);
  }

  // STEP 4: Cleanup
  console.log(`\n🧹 STEP 4: Cleaning up test record "${testTxnId}" from public.payment_transactions...`);
  const { error: delErr } = await supabase
    .from('payment_transactions')
    .delete()
    .eq('txn_id', testTxnId);

  if (delErr) {
    console.warn('⚠️ Cleanup warning:', delErr.message);
  } else {
    console.log('✅ STEP 4 COMPLETE: Test record deleted. Table is clean.');
  }
}

runE2EPaddleTest();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qdadkcpqzpvdiqxdnjuf.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkYWRrY3BxenB2ZGlxeGRuanVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDkzODkyNSwiZXhwIjoyMTAwNTE0OTI1fQ.kWqOKIhNwaKTAugbRZ8I2-qxAx7NakaxdYF665nf9-g';

const supabase = createClient(supabaseUrl, serviceKey);

async function testAmountParsingFix() {
  console.log('🔍 Testing amount parsing fix with non-35 transaction values...');
  
  const testTxnId = `txn_agency_pro_test_${Date.now()}`;
  const testEmail = 'demo.agency.pro@ariaprop.online';
  const testPlan = 'pro';
  // Simulate Agency Pro ($99 USD -> raw "9900" cents in Paddle)
  const rawPaddleStringCents = "9900"; 
  const numVal = parseFloat(rawPaddleStringCents);
  const parsedAmount = numVal > 500 ? numVal / 100 : numVal; // 99

  console.log(`🚀 STEP 1: Inserting Agency Pro transaction "${testTxnId}" with parsedAmount: $${parsedAmount} USD...`);

  const { data: insertedRow, error: insertErr } = await supabase
    .from('payment_transactions')
    .upsert({
      txn_id: testTxnId,
      customer_email: testEmail,
      plan_id: testPlan,
      amount: parsedAmount,
      currency: 'USD',
      status: 'completed',
      raw_event: {
        event_type: 'transaction.completed',
        data: {
          id: testTxnId,
          details: { totals: { grand_total: "9900" } }
        }
      },
      created_at: new Date().toISOString()
    }, { onConflict: 'txn_id' })
    .select('*')
    .single();

  if (insertErr) {
    console.error('❌ Insert failed:', insertErr.message);
    return;
  }

  console.log('✅ STEP 1 COMPLETE: Recorded row in payment_transactions:');
  console.log(JSON.stringify(insertedRow, null, 2));

  console.log(`\n🌐 STEP 2: Executing GET https://ariaprop.online/api/verify-transaction?txn_id=${testTxnId}...`);
  const res = await fetch(`https://ariaprop.online/api/verify-transaction?txn_id=${testTxnId}`);
  const json = await res.json();

  console.log('📡 Response from /api/verify-transaction:');
  console.log(JSON.stringify(json, null, 2));

  if (json.verified === true && json.amount === 99) {
    console.log('\n🎉 SUCCESS: Verified amount is $99 USD (Agency Pro) and NOT $35!');
  } else {
    console.error('\n❌ FAILED: Amount did not match $99:', json);
  }

  // STEP 3: Cleanup
  console.log(`\n🧹 STEP 3: Deleting test transaction "${testTxnId}"...`);
  await supabase.from('payment_transactions').delete().eq('txn_id', testTxnId);
  console.log('✅ STEP 3 COMPLETE: Test transaction deleted.');
}

testAmountParsingFix();

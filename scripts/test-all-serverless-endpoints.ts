async function testAllServerlessEndpoints() {
  console.log('🧪 Testing ALL 11 Vercel Serverless Endpoints individually for bundling integrity...\n');

  const baseUrl = 'https://ariaprop.online';

  const endpoints = [
    { name: '1. Health Check', url: `${baseUrl}/api/health`, method: 'GET' },
    { name: '2. Bot Config', url: `${baseUrl}/api/bot-config`, method: 'GET' },
    { name: '3. Chat AI Handler', url: `${baseUrl}/api/chat`, method: 'POST', body: JSON.stringify({ message: 'Hola' }), headers: { 'Content-Type': 'application/json' } },
    { name: '4. CRM Credentials', url: `${baseUrl}/api/crm-credentials`, method: 'GET' },
    { name: '5. CRM Sync', url: `${baseUrl}/api/crm-sync`, method: 'GET' },
    { name: '6. Leads Manager', url: `${baseUrl}/api/leads`, method: 'GET' },
    { name: '7. Paddle Webhook', url: `${baseUrl}/api/paddle-webhook`, method: 'POST', body: JSON.stringify({ event: 'test' }), headers: { 'Content-Type': 'application/json' } },
    { name: '8. Properties Manager', url: `${baseUrl}/api/properties`, method: 'GET' },
    { name: '9. Usage Tracker', url: `${baseUrl}/api/usage`, method: 'GET' },
    { name: '10. Verify Transaction', url: `${baseUrl}/api/verify-transaction?txn_id=non_existent_test_id`, method: 'GET' },
    { name: '11. Cron Clean Demo', url: `${baseUrl}/api/cron/clean-demo-accounts`, method: 'GET' },
  ];

  let passedCount = 0;
  let failed500Count = 0;

  for (const ep of endpoints) {
    try {
      const options: RequestInit = {
        method: ep.method,
        headers: ep.headers || {},
        body: ep.body || undefined,
      };

      const res = await fetch(ep.url, options);
      const text = await res.text();

      let json: any = null;
      try {
        json = JSON.parse(text);
      } catch {}

      const status = res.status;
      const is500 = status === 500;
      const icon = is500 ? '❌ FAIL (500 Module Error)' : '✅ OK';

      console.log(`--------------------------------------------------`);
      console.log(`${icon} [${ep.name}] ${ep.method} ${ep.url}`);
      console.log(`   HTTP Status: ${status} ${res.statusText}`);
      console.log(`   Response Snippet: ${text.slice(0, 150)}`);

      if (is500) {
        failed500Count++;
      } else {
        passedCount++;
      }
    } catch (err: any) {
      console.error(`❌ ERROR fetching ${ep.name}:`, err.message);
    }
  }

  console.log(`\n==================================================`);
  console.log(`📊 TEST RESULTS SUMMARY:`);
  console.log(`   Total Endpoints Tested: ${endpoints.length}`);
  console.log(`   Passed (No 500 Bundling Errors): ${passedCount}/${endpoints.length}`);
  console.log(`   Failed (HTTP 500 Errors): ${failed500Count}/${endpoints.length}`);
  console.log(`==================================================\n`);
}

testAllServerlessEndpoints();

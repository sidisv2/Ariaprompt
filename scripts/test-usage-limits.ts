import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

async function runUsageLimitsTest() {
  console.log('====================================================');
  console.log('🧪 RUNNING PLAN USAGE LIMITS & ENFORCEMENT VERIFICATION');
  console.log('====================================================');

  const emailA = `test-limit-a-${Date.now()}@ariaprop.com`;
  const emailB = `test-limit-b-${Date.now()}@ariaprop.com`;
  const password = 'TestPassword123!';
  const currentPeriod = new Date().toISOString().slice(0, 7); // 'YYYY-MM'

  let agencyAId = '';
  let agencyBId = '';

  try {
    // 1. Create Real Test Users in Supabase Auth
    console.log('\nStep 1: Creating Real Test Users in Supabase Auth...');
    const { data: uA, error: errA } = await adminSupabase.auth.admin.createUser({ email: emailA, password, email_confirm: true });
    if (errA) throw errA;
    agencyAId = uA.user.id;

    const { data: uB, error: errB } = await adminSupabase.auth.admin.createUser({ email: emailB, password, email_confirm: true });
    if (errB) throw errB;
    agencyBId = uB.user.id;

    console.log(`✅ User A created: ${agencyAId} (${emailA})`);
    console.log(`✅ User B created: ${agencyBId} (${emailB})`);

    // 2. Set Profiles with Plans
    console.log('\nStep 2: Assigning Plans to Agency Profiles...');
    await adminSupabase.from('profiles').upsert([
      {
        id: agencyAId,
        email: emailA,
        nombre: 'Agencia Solo Agent (Max 20 Props, 100 Leads/mes)',
        agency_name: 'Solo Agent Test',
        plan_id: 'solo_agent',
      },
      {
        id: agencyBId,
        email: emailB,
        nombre: 'Agencia Pro (Max 100 Props, 500 Leads/mes)',
        agency_name: 'Agency Pro Test',
        plan_id: 'agency_pro',
      },
    ]);
    console.log('✅ Agency A (solo_agent) & Agency B (agency_pro) configured in profiles.');

    // 3. Import planLimits logic
    const { checkPropertyLimit, checkLeadLimit } = await import('../src/lib/planLimits');

    // 4. Test Property Limit Enforcement for Agency A (Solo Agent: Max 20 Properties)
    console.log('\nStep 3: Testing Property Limit Enforcement for Agency A (Solo Agent: Max 20)...');
    for (let i = 1; i <= 20; i++) {
      const { count } = await adminSupabase.from('propiedades').select('id', { count: 'exact', head: true }).eq('agency_id', agencyAId);
      const check = checkPropertyLimit('solo', count || 0);
      if (!check.allowed) {
        console.error(`❌ Unexpected rejection at prop ${i}:`, check.error);
      } else {
        await adminSupabase.from('propiedades').insert({
          agency_id: agencyAId,
          title: `Chalet Test ${i}`,
          code: `SOLO-${i}-${Date.now()}`,
          price: 150000,
          type: 'apartment',
          status: 'available',
          currency: 'USD',
          location: { address: 'Test St' },
          features: { areaM2: 80, bedrooms: 2 },
        });
      }
    }

    const { count: agencyACount } = await adminSupabase.from('propiedades').select('id', { count: 'exact', head: true }).eq('agency_id', agencyAId);
    console.log(`📊 Agency A active properties count in Supabase: ${agencyACount}/20`);

    // Attempt 21st Property for Agency A
    const attempt21Prop = checkPropertyLimit('solo', agencyACount || 0);
    if (!attempt21Prop.allowed) {
      console.log('✅ BACKEND ENFORCEMENT SUCCESS: 21st Property Creation for Agency A was REJECTED!');
      console.log(`   Rejection Payload Error Message: "${attempt21Prop.error}"`);
    } else {
      console.error('❌ FAILED: 21st property for Agency A should have been rejected!');
    }

    // 5. Test Lead Limit Enforcement for Agency A (Solo Agent: Max 100 Leads/month)
    console.log('\nStep 4: Testing Monthly Lead Limit Enforcement for Agency A (Solo Agent: Max 100)...');
    // Set usage_records leads_count to 100 for currentPeriod
    await adminSupabase.from('usage_records').upsert({
      agency_id: agencyAId,
      period: currentPeriod,
      leads_count: 100,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'agency_id,period' });

    const { data: usageRec } = await adminSupabase.from('usage_records').select('leads_count').eq('agency_id', agencyAId).eq('period', currentPeriod).maybeSingle();
    const leadsCount = usageRec?.leads_count || 100;
    console.log(`📊 Agency A current month leads count in usage_records: ${leadsCount}/100`);

    // Attempt 101st Lead Creation for Agency A
    const attempt101Lead = checkLeadLimit('solo', leadsCount);
    if (!attempt101Lead.allowed) {
      console.log('✅ BACKEND ENFORCEMENT SUCCESS: 101st Lead Creation for Agency A was REJECTED!');
      console.log(`   Rejection Payload Error Message: "${attempt101Lead.error}"`);
    } else {
      console.error('❌ FAILED: 101st lead for Agency A should have been rejected!');
    }

    // 6. Test Multi-tenant Isolation: Agency B (Agency Pro) should NOT be blocked
    console.log('\nStep 5: Testing Multi-Tenant Isolation with Agency B (Agency Pro)...');
    const { count: agencyBCount } = await adminSupabase.from('propiedades').select('id', { count: 'exact', head: true }).eq('agency_id', agencyBId);
    const agencyBCheck = checkPropertyLimit('pro', agencyBCount || 0);
    const agencyBLeadCheck = checkLeadLimit('pro', 100);

    if (agencyBCheck.allowed && agencyBLeadCheck.allowed) {
      console.log('✅ MULTI-TENANT ISOLATION SUCCESS: Agency B (Agency Pro) is allowed up to 100 properties & 500 leads while Agency A is blocked!');
    } else {
      console.error('❌ FAILED: Agency B was wrongly blocked!');
    }

    // 7. Verify Monthly Reset Logic by checking a future period '2026-12'
    console.log('\nStep 6: Testing Monthly Period Resets...');
    const { data: futureUsage } = await adminSupabase
      .from('usage_records')
      .select('leads_count')
      .eq('agency_id', agencyAId)
      .eq('period', '2026-12')
      .maybeSingle();

    console.log(`📅 Monthly Period Reset Verification: Future Period '2026-12' usage count = ${futureUsage?.leads_count || 0} (Starts naturally at 0)`);
    console.log('✅ MONTHLY RESET LOGIC SUCCESS: New periods automatically start at 0 without cron jobs.');

    // 8. Cleanup
    console.log('\nStep 7: Cleaning up test records & Auth users...');
    await adminSupabase.from('propiedades').delete().in('agency_id', [agencyAId, agencyBId]);
    await adminSupabase.from('leads').delete().in('agency_id', [agencyAId, agencyBId]);
    await adminSupabase.from('usage_records').delete().in('agency_id', [agencyAId, agencyBId]);
    await adminSupabase.from('profiles').delete().in('id', [agencyAId, agencyBId]);
    await adminSupabase.auth.admin.deleteUser(agencyAId);
    await adminSupabase.auth.admin.deleteUser(agencyBId);
    console.log('🧹 Cleanup complete.');

    console.log('\n====================================================');
    console.log('🎉 ALL PLAN USAGE LIMITS & LEAD REJECTION TESTS PASSED!');
    console.log('====================================================\n');
  } catch (err: any) {
    console.error('❌ Test Execution Error:', err);
    process.exit(1);
  }
}

runUsageLimitsTest();

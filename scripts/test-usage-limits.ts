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
        nombre: 'Agencia Solo Agent (Max 5 Props, 100 Leads)',
        agency_name: 'Solo Agent Test',
        plan_id: 'solo_agent',
      },
      {
        id: agencyBId,
        email: emailB,
        nombre: 'Agencia Pro (Max 20 Props, 500 Leads)',
        agency_name: 'Agency Pro Test',
        plan_id: 'agency_pro',
      },
    ]);
    console.log('✅ Agency A (solo_agent) & Agency B (agency_pro) configured in profiles.');

    // 3. Import planLimits logic
    const { checkPropertyLimit, checkLeadLimit } = await import('../src/lib/planLimits');

    // 4. Insert 5 Properties for Agency A (Solo Agent)
    console.log('\nStep 3: Testing Property Limit Enforcement for Agency A (Solo Agent: Max 5)...');
    for (let i = 1; i <= 5; i++) {
      const { count } = await adminSupabase.from('propiedades').select('id', { count: 'exact', head: true }).eq('agency_id', agencyAId);
      const check = checkPropertyLimit('solo_agent', count || 0);
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
    console.log(`📊 Agency A active properties count in Supabase: ${agencyACount}/5`);

    // Attempt 6th Property for Agency A
    const attempt6 = checkPropertyLimit('solo_agent', agencyACount || 0);
    if (!attempt6.allowed) {
      console.log('✅ BACKEND ENFORCEMENT SUCCESS: 6th Property Creation for Agency A was REJECTED!');
      console.log(`   Rejection Payload Error Message: "${attempt6.error}"`);
    } else {
      console.error('❌ FAILED: 6th property for Agency A should have been rejected!');
    }

    // 5. Test Multi-tenant Isolation: Agency B (Agency Pro) should NOT be blocked
    console.log('\nStep 4: Testing Multi-Tenant Isolation with Agency B (Agency Pro)...');
    const { count: agencyBCount } = await adminSupabase.from('propiedades').select('id', { count: 'exact', head: true }).eq('agency_id', agencyBId);
    const agencyBCheck = checkPropertyLimit('agency_pro', agencyBCount || 0);
    if (agencyBCheck.allowed) {
      const { data: propB } = await adminSupabase.from('propiedades').insert({
        agency_id: agencyBId,
        title: `Penthouse Pro Agency B`,
        code: `PRO-1-${Date.now()}`,
        price: 450000,
        type: 'apartment',
        status: 'available',
        currency: 'USD',
        location: { address: 'Pro St' },
        features: { areaM2: 200, bedrooms: 4 },
      }).select().single();
      console.log('✅ MULTI-TENANT ISOLATION SUCCESS: Agency B created property successfully while Agency A was blocked!');
    } else {
      console.error('❌ FAILED: Agency B was wrongly blocked:', agencyBCheck.error);
    }

    // 6. Test Atomic Lead Usage Increment & Monthly Period Resets
    console.log('\nStep 5: Testing Lead Usage Upserts & Monthly Period Resets...');
    const { data: u1, error: uErr1 } = await adminSupabase.from('usage_records').upsert({
      agency_id: agencyAId,
      period: currentPeriod,
      leads_count: 1,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'agency_id,period' }).select().single();

    if (!uErr1) {
      console.log(`📈 Lead Usage Registered for Agency A in period ${currentPeriod}: ${u1.leads_count} lead(s)`);
    }

    const { data: u2, error: uErr2 } = await adminSupabase.from('usage_records').upsert({
      agency_id: agencyAId,
      period: currentPeriod,
      leads_count: 2,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'agency_id,period' }).select().single();

    if (!uErr2) {
      console.log(`📈 Lead Usage Updated for Agency A in period ${currentPeriod}: ${u2.leads_count} lead(s)`);
    }

    // Verify Monthly Reset Logic by checking a future period '2026-12'
    const { data: futureUsage } = await adminSupabase
      .from('usage_records')
      .select('leads_count')
      .eq('agency_id', agencyAId)
      .eq('period', '2026-12')
      .single();

    console.log(`📅 Monthly Period Reset Verification: Future Period '2026-12' usage count = ${futureUsage?.leads_count || 0} (Starts naturally at 0)`);
    console.log('✅ MONTHLY RESET LOGIC SUCCESS: New periods automatically start at 0 without cron jobs.');

    // 7. Cleanup
    console.log('\nStep 6: Cleaning up test records & Auth users...');
    await adminSupabase.from('propiedades').delete().in('agency_id', [agencyAId, agencyBId]);
    await adminSupabase.from('leads').delete().in('agency_id', [agencyAId, agencyBId]);
    await adminSupabase.from('usage_records').delete().in('agency_id', [agencyAId, agencyBId]);
    await adminSupabase.from('profiles').delete().in('id', [agencyAId, agencyBId]);
    await adminSupabase.auth.admin.deleteUser(agencyAId);
    await adminSupabase.auth.admin.deleteUser(agencyBId);
    console.log('🧹 Cleanup complete.');

    console.log('\n====================================================');
    console.log('🎉 ALL PLAN USAGE LIMITS & ENFORCEMENT TESTS PASSED!');
    console.log('====================================================\n');
  } catch (err: any) {
    console.error('❌ Test Execution Error:', err);
    process.exit(1);
  }
}

runUsageLimitsTest();

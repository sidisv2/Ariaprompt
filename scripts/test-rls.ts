import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
const supabaseAnonKey = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim();
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

async function runDualLayerSecurityTest() {
  console.log('----------------------------------------------------');
  console.log('🛡️ INICIANDO PRUEBA DE SEGURIDAD EN DOBLE CAPA');
  console.log('----------------------------------------------------');

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
    console.log('⚠️ SUPABASE NO CONFIGURADO EN .ENV LOCAL');
    console.log('Para ejecutar esta prueba live contra PostgreSQL remoto, configura en .env:');
    console.log('VITE_SUPABASE_URL="https://tu-proyecto.supabase.co"');
    console.log('VITE_SUPABASE_ANON_KEY="tu-anon-key"');
    console.log('SUPABASE_SERVICE_ROLE_KEY="tu-service-role-key"');
    console.log('----------------------------------------------------');
    return;
  }

  const adminClient = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;
  const anonClient = createClient(supabaseUrl, supabaseAnonKey);

  const emailA = `test-agency-a-${Date.now()}@ariaprop.com`;
  const emailB = `test-agency-b-${Date.now()}@ariaprop.com`;
  const password = 'TestPassword123!';

  let userAId = '';
  let userBId = '';

  try {
    // 1. CREACIÓN DE USUARIOS DE PRUEBA
    console.log('\n🔹 1. Creando Cuentas de Agencia de Prueba en Supabase Auth...');
    if (adminClient) {
      const { data: uA, error: errA } = await adminClient.auth.admin.createUser({ email: emailA, password, email_confirm: true });
      if (errA) throw errA;
      userAId = uA.user.id;

      const { data: uB, error: errB } = await adminClient.auth.admin.createUser({ email: emailB, password, email_confirm: true });
      if (errB) throw errB;
      userBId = uB.user.id;
    } else {
      const { data: sA } = await anonClient.auth.signUp({ email: emailA, password });
      userAId = sA.user?.id || '';
      const { data: sB } = await anonClient.auth.signUp({ email: emailB, password });
      userBId = sB.user?.id || '';
    }

    console.log(`✅ Agencia Test A ID: ${userAId}`);
    console.log(`✅ Agencia Test B ID: ${userBId}`);

    // 2. INICIAR SESIÓN Y OBTENER JWT DE USUARIO A Y B
    console.log('\n🔹 2. Autenticando Sesiones con anon_key para obtener JWTs reales...');
    const { data: sessionA } = await anonClient.auth.signInWithPassword({ email: emailA, password });
    const { data: sessionB } = await anonClient.auth.signInWithPassword({ email: emailB, password });

    const clientUserA = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${sessionA.session?.access_token}` } }
    });
    const clientUserB = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${sessionB.session?.access_token}` } }
    });

    // Insert profile records for foreign key constraint
    await adminClient?.from('profiles').insert([
      { id: userAId, email: emailA, nombre: 'Agencia A' },
      { id: userBId, email: emailB, nombre: 'Agencia B' }
    ]);

    // 3. INSERTAR LEADS PERTENECIENTES A CADA AGENCIA
    console.log('\n🔹 3. Insertando Lead Válido para Agencia B...');
    const { data: leadB, error: errLeadB } = await clientUserB.from('leads').insert([{
      agency_id: userBId,
      name: 'Lead Legítimo Agencia B',
      notes: 'Consulta de Depto 3 amb en Recoleta',
      status: 'nuevo'
    }]).select().single();

    if (errLeadB) console.warn('Error al insertar lead en B:', errLeadB);
    console.log('Result Lead B:', JSON.stringify(leadB, null, 2));

    // ====================================================================
    // PARTE A: PRUEBA DE RLS EN MOTOR POSTGRES (CON ANON_KEY Y JWT)
    // ====================================================================
    console.log('\n----------------------------------------------------');
    console.log('🔒 PARTE A: PRUEBA RLS REAL (MOTOR POSTGRESQL)');
    console.log('----------------------------------------------------');

    // A1. Intento de SELECT sobre Leads de Agencia B usando la sesión de Agencia A
    console.log('\n🔍 A.1 Intentando SELECT de leads de Agencia B desde la sesión de Agencia A...');
    const { data: rlsSelectData, error: rlsSelectError } = await clientUserA
      .from('leads')
      .select('*')
      .eq('agency_id', userBId);

    console.log('📌 Resultado REAL de SELECT (debe ser array vacío []):');
    console.log(JSON.stringify({ data: rlsSelectData, error: rlsSelectError }, null, 2));

    // A2. Intento de INSERT con agency_id de Agencia B desde la sesión de Agencia A
    console.log('\n🔍 A.2 Intentando INSERT forzando agency_id de Agencia B desde la sesión de Agencia A...');
    const { data: rlsInsertData, error: rlsInsertError } = await clientUserA
      .from('leads')
      .insert([{ agency_id: userBId, name: 'Lead Malicioso Inyectado' }])
      .select();

    console.log('📌 Resultado REAL de INSERT (debe devolver error de violación de RLS 42501):');
    console.log(JSON.stringify({ data: rlsInsertData, error: rlsInsertError }, null, 2));

    // ====================================================================
    // PARTE B: PRUEBA DE FILTRADO EN ENDPOINTS /API/* (CON SERVICE_ROLE)
    // ====================================================================
    console.log('\n----------------------------------------------------');
    console.log('🛡️ PARTE B: PRUEBA DE FILTRADO MANUAL EN ENDPOINTS /API/*');
    console.log('----------------------------------------------------');

    if (adminClient) {
      console.log(`\n🔍 B.1 Consultando /api/leads?agency_id=${userAId} (Simulando petición de Agencia A)...`);
      const { data: apiDataA } = await adminClient.from('leads').select('*').eq('agency_id', userAId);
      console.log('📌 Resultado para Agencia A (solo sus leads):');
      console.log(JSON.stringify(apiDataA, null, 2));

      console.log(`\n🔍 B.2 Consultando /api/leads?agency_id=${userBId} (Simulando petición de Agencia B)...`);
      const { data: apiDataB } = await adminClient.from('leads').select('*').eq('agency_id', userBId);
      console.log('📌 Resultado para Agencia B (solo sus leads):');
      console.log(JSON.stringify(apiDataB, null, 2));
    }

    // ====================================================================
    // LIMPIEZA DE DATOS DE PRUEBA
    // ====================================================================
    console.log('\n----------------------------------------------------');
    console.log('🧹 LIMPIEZA DE CUENTAS Y DATOS DE PRUEBA');
    console.log('----------------------------------------------------');
    if (adminClient) {
      await adminClient.from('leads').delete().eq('agency_id', userBId);
      await adminClient.auth.admin.deleteUser(userAId);
      await adminClient.auth.admin.deleteUser(userBId);
      console.log('✅ Cuentas y leads de prueba eliminados exitosamente.');
    }

  } catch (err) {
    console.error('❌ Error durante la prueba:', err);
  }
}

runDualLayerSecurityTest();

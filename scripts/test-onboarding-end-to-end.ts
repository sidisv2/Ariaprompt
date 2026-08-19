import fetch from 'node-fetch';

async function testOnboardingFlow() {
  console.log('====================================================');
  console.log('🧪 ONBOARDING END-TO-END AUDIT');
  console.log('====================================================\n');

  const BASE = 'https://ariaprop.online';

  // Step 1: Account Registration / Auth Check
  console.log('👉 PASO 1: Registro / Verificación de Auth...');
  try {
    const resAuth = await fetch(`${BASE}/api/bot-config?agency_id=test_onboarding_usr`);
    console.log('   Paso 1 HTTP Status:', resAuth.status);
    const bodyAuth = await resAuth.text();
    console.log('   Paso 1 Body:', bodyAuth.slice(0, 300));
  } catch (err: any) {
    console.log('   ❌ Paso 1 Error:', err.message);
  }

  // Step 2: Connect Tokko API Key
  console.log('\n👉 PASO 2: Guardar API Key de Tokko Broker (/api/crm-credentials)...');
  try {
    const resTokko = await fetch(`${BASE}/api/crm-credentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agencyId: 'test_agency_01',
        crmType: 'tokko',
        apiKey: 'test_tokko_key_12345',
      }),
    });
    console.log('   Paso 2 HTTP Status:', resTokko.status);
    const bodyTokko = await resTokko.text();
    console.log('   Paso 2 Body:', bodyTokko.slice(0, 300));
  } catch (err: any) {
    console.log('   ❌ Paso 2 Error:', err.message);
  }

  // Step 3: Property Catalog Upload
  console.log('\n👉 PASO 3: Cargar propiedad en Catálogo (/api/properties)...');
  try {
    const resProp = await fetch(`${BASE}/api/properties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Depto Test Onboarding',
        code: 'ONB-01',
        type: 'apartment',
        price: 120000,
        currency: 'USD',
        location: { address: 'Av. Corrientes 1234', city: 'Buenos Aires', zone: 'Centro' },
      }),
    });
    console.log('   Paso 3 HTTP Status:', resProp.status);
    const bodyProp = await resProp.text();
    console.log('   Paso 3 Body:', bodyProp.slice(0, 300));
  } catch (err: any) {
    console.log('   ❌ Paso 3 Error:', err.message);
  }

  // Step 4: WhatsApp Configuration
  console.log('\n👉 PASO 4: Configurar número de WhatsApp...');
  try {
    const resWa = await fetch(`${BASE}/api/bot-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        whatsappNumber: '+5491122334455',
        autoScheduleVisits: true,
      }),
    });
    console.log('   Paso 4 HTTP Status:', resWa.status);
    const bodyWa = await resWa.text();
    console.log('   Paso 4 Body:', bodyWa.slice(0, 300));
  } catch (err: any) {
    console.log('   ❌ Paso 4 Error:', err.message);
  }
}

testOnboardingFlow();

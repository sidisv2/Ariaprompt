import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import {
  generateOpenRouterRealEstateResponse,
  extractLeadQualificationOpenRouter,
  getOpenRouterApiKey,
  getOpenRouterModel,
} from '../src/lib/ai/openrouterService';

async function runOpenRouterSmokeTest() {
  console.log('================================================================');
  console.log('🤖 ARIA PROP - OPENROUTER LLM ENGINE SMOKE TEST');
  console.log('================================================================\n');

  const apiKey = getOpenRouterApiKey();
  const model = getOpenRouterModel();

  console.log('🔑 API Key detected:', apiKey ? `Yes (${apiKey.slice(0, 8)}...${apiKey.slice(-4)})` : 'No (Missing)');
  console.log('🎯 Target Model:', model);
  console.log('🌐 Base Endpoint: https://openrouter.ai/api/v1/chat/completions');
  console.log('🏷️ Custom Headers: HTTP-Referer="https://ariaprop.online", X-Title="Aria Prop"');
  console.log('⚙️ Parameters: temperature=0.3, max_tokens=800\n');

  if (!apiKey) {
    console.warn('⚠️ WARNING: OPENROUTER_API_KEY is not set in environment.');
    console.warn('   Testing fallback / mock engine mode...\n');
  }

  // --- TEST 1: OpenRouter Completion with RAG Context ---
  console.log('--- TEST 1: OpenRouter Real Estate Completion (RAG Injection) ---');
  const sampleRAGContext = `
- [ID: mendoza-01] "Departamento 2 Ambientes en Barrio Bombal" (ALQUILER) en Av. España 1450, Mendoza, Argentina. Precio: $450 USD/mes. 1 hab, 52 m². Amoblado y equipado.
- [ID: polanco-101] "Penthouse de Ultra Lujo" (VENTA) en Campos Elíseos 400, Polanco, CDMX, México. Precio: $1,250,000 USD. 4 hab, 380 m². Terraza privada y vista al campo de golf.
  `.trim();

  const userQuery = 'Hola, busco alquilar un departamento amoblado en Mendoza de alrededor de 500 dólares al mes. Mi celular es +5492615551234.';

  try {
    const startTime = Date.now();
    const response = await generateOpenRouterRealEstateResponse({
      message: userQuery,
      history: [],
      propertyContext: sampleRAGContext,
      lang: 'es',
      agentName: 'Aria',
      agencyName: 'Aria Prop',
      apiKey,
    });
    const elapsedMs = Date.now() - startTime;

    console.log(`✅ TEST 1 SUCCESS (${elapsedMs} ms) | Source: ${response.source}`);
    console.log('--- AI RESPONSE BODY ---');
    console.log(response.text);
    console.log('------------------------\n');
  } catch (err: any) {
    console.error('❌ TEST 1 FAILED:', err?.message || err);
    console.log('');
  }

  // --- TEST 2: Structured Lead Qualification Extraction (JSON) ---
  console.log('--- TEST 2: Structured Lead Qualification Extraction (JSON) ---');
  try {
    const history = [
      { sender: 'user' as const, content: 'Busco un departamento en Polanco para comprar.' },
      { sender: 'bot' as const, content: '¡Excelente! En Polanco tenemos opciones exclusivas. ¿Cuál es tu presupuesto estimado?' },
      { sender: 'user' as const, content: 'Tengo hasta 1.3 millones de dólares. Quisiera agendar una visita esta semana.' },
    ];

    const startTime = Date.now();
    const qualification = await extractLeadQualificationOpenRouter({
      message: 'Mi teléfono de contacto es +5215512345678',
      history,
      apiKey,
    });
    const elapsedMs = Date.now() - startTime;

    if (qualification) {
      console.log(`✅ TEST 2 SUCCESS (${elapsedMs} ms)`);
      console.log('--- STRUCTURED QUALIFICATION JSON ---');
      console.log(JSON.stringify(qualification, null, 2));
      console.log('-------------------------------------\n');
    } else {
      console.warn('⚠️ TEST 2 RETURNED NULL (OpenRouter key missing or extraction unsupported)');
    }
  } catch (err: any) {
    console.error('❌ TEST 2 FAILED:', err?.message || err);
  }

  console.log('================================================================');
  console.log('✨ SMOKE TEST COMPLETE');
  console.log('================================================================');
}

runOpenRouterSmokeTest();

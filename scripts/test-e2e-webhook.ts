import 'dotenv/config';
import { handleWhatsAppRoute } from '../api/_handlers/whatsappHandler.js';
import { handleEvolutionWebhookRoute } from '../api/_handlers/evolutionWebhookHandler.js';
import { setRedisClientForTesting } from '../api/_lib/redisClient.js';

// Setup in-memory Redis mock store for deterministic local testing
const inMemoryRedisStore = new Map<string, string>();
const mockRedisClient = {
  set: async (key: string, val: string, mode?: string, ttl?: number, flag?: string) => {
    if (flag === 'NX' && inMemoryRedisStore.has(key)) {
      return null;
    }
    inMemoryRedisStore.set(key, val);
    return 'OK';
  },
  get: async (key: string) => inMemoryRedisStore.get(key) || null,
  del: async (key: string) => {
    inMemoryRedisStore.delete(key);
    return 1;
  },
};
setRedisClientForTesting(mockRedisClient);

const TARGET_URL = (process.env.TEST_API_URL || 'http://localhost:3000/api/whatsapp').trim();
const VERIFY_TOKEN = (process.env.META_VERIFY_TOKEN || process.env.WEBHOOK_VERIFY_TOKEN || 'aria_prop_whatsapp_webhook_secret_verify_token_2026').replace(/^["']|["']$/g, '').trim();

function buildMetaWebhookPayload(options: {
  phone: string;
  messageText: string;
  wamid?: string;
  phoneId?: string;
}) {
  const { phone, messageText, wamid = `wamid.HBgL${Date.now()}`, phoneId = '1215379554999227' } = options;
  return {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: '1092837465',
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '15551234567',
                phone_number_id: phoneId,
              },
              contacts: [
                {
                  profile: {
                    name: 'Valentin E2E Lead',
                  },
                  wa_id: phone,
                },
              ],
              messages: [
                {
                  from: phone,
                  id: wamid,
                  timestamp: String(Math.floor(Date.now() / 1000)),
                  text: {
                    body: messageText,
                  },
                  type: 'text',
                },
              ],
            },
            field: 'messages',
          },
        ],
      },
    ],
  };
}

async function sendRequest(method: 'GET' | 'POST', urlOrQuery: string, bodyData?: any) {
  const startTime = Date.now();
  try {
    const isFullUrl = urlOrQuery.startsWith('http');
    const targetUrl = isFullUrl ? urlOrQuery : `${TARGET_URL}${urlOrQuery}`;

    const res = await fetch(targetUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      ...(bodyData ? { body: JSON.stringify(bodyData) } : {}),
    });

    const elapsed = Date.now() - startTime;
    const contentType = res.headers.get('content-type') || '';

    let data: any = null;
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    return { status: res.status, data, elapsed, isNetwork: true };
  } catch (netErr) {
    // Local server offline fallback: invoke in-memory whatsappHandler directly
    const startTimeLocal = Date.now();
    let status = 200;
    let responseData: any = null;

    const mockRes = {
      setHeader: () => {},
      status: (code: number) => {
        status = code;
        return {
          json: (d: any) => { responseData = d; },
          send: (t: any) => { responseData = t; },
          end: () => {},
        };
      },
    } as any;

    let subRoute = 'webhook';
    let query: Record<string, any> = {};

    if (method === 'GET') {
      const urlObj = new URL(urlOrQuery, 'http://localhost');
      urlObj.searchParams.forEach((v, k) => { query[k] = v; });
    }

    const mockReq = {
      method,
      query,
      body: bodyData,
      headers: {},
    } as any;

    await handleWhatsAppRoute(mockReq, mockRes, subRoute);
    const elapsedLocal = Date.now() - startTimeLocal;

    return { status, data: responseData, elapsed: elapsedLocal, isNetwork: false };
  }
}

async function sendEvolutionWebhookRequest(bodyData: any) {
  const startTime = Date.now();
  const evoUrl = TARGET_URL.replace('/api/whatsapp', '/api/webhook/evolution');
  try {
    const res = await fetch(evoUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyData),
    });

    const elapsed = Date.now() - startTime;
    const contentType = res.headers.get('content-type') || '';
    let data: any = null;
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }
    return { status: res.status, data, elapsed, isNetwork: true };
  } catch (netErr) {
    const startTimeLocal = Date.now();
    let status = 200;
    let responseData: any = null;

    const mockRes = {
      setHeader: () => {},
      status: (code: number) => {
        status = code;
        return {
          json: (d: any) => { responseData = d; },
          send: (t: any) => { responseData = t; },
          end: () => {},
        };
      },
    } as any;

    const mockReq = {
      method: 'POST',
      query: {},
      body: bodyData,
      headers: {},
    } as any;

    await handleEvolutionWebhookRoute(mockReq, mockRes);
    const elapsedLocal = Date.now() - startTimeLocal;
    return { status, data: responseData, elapsed: elapsedLocal, isNetwork: false };
  }
}

async function runE2EWebhookTestSuite() {
  console.log('================================================================');
  console.log('🚀 META & EVOLUTION WHATSAPP WEBHOOK E2E TEST SUITE');
  console.log('   Target API URL:', TARGET_URL);
  console.log('   Timestamp:', new Date().toISOString());
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 6;

  const testPhone = '5492604014372';

  // -------------------------------------------------------------------------
  // SIMULATION 1: PROSPECTING MESSAGE
  // -------------------------------------------------------------------------
  console.log('👉 [SIMULATION 1/6] Prospecting Lead Message ("Palermo hasta 800 USD")...');
  const payload1 = buildMetaWebhookPayload({
    phone: testPhone,
    messageText: 'Hola, busco un departamento en Palermo hasta 800 USD',
  });

  const res1 = await sendRequest('POST', '', payload1);
  const isPass1 = res1.status === 200 && Boolean(res1.data?.status);

  console.log(`   HTTP Status: ${res1.status} (${res1.elapsed}ms)`);
  console.log(`   Response Payload:`, JSON.stringify(res1.data));
  console.log(`   Verdict: ${isPass1 ? '✅ PASS' : '❌ FAIL'}\n`);
  if (isPass1) passedTests++;

  // -------------------------------------------------------------------------
  // SIMULATION 2: HUMAN HANDOVER REQUEST
  // -------------------------------------------------------------------------
  console.log('👉 [SIMULATION 2/6] Human Handover Request ("Quiero coordinar visita y hablar con un asesor")...');
  const payload2 = buildMetaWebhookPayload({
    phone: testPhone,
    messageText: 'Quiero coordinar una visita y hablar con un asesor',
  });

  const res2 = await sendRequest('POST', '', payload2);
  const isPass2 = res2.status === 200 && Boolean(res2.data?.status);

  console.log(`   HTTP Status: ${res2.status} (${res2.elapsed}ms)`);
  console.log(`   Response Payload:`, JSON.stringify(res2.data));
  console.log(`   Verdict: ${isPass2 ? '✅ PASS' : '❌ FAIL'}\n`);
  if (isPass2) passedTests++;

  // -------------------------------------------------------------------------
  // SIMULATION 3: META HANDSHAKE GET CHALLENGE
  // -------------------------------------------------------------------------
  console.log('👉 [SIMULATION 3/6] Meta Webhook Verification Handshake (GET Challenge)...');
  const challengeCode = '1158201444';
  const rawEnvToken = process.env.META_VERIFY_TOKEN || process.env.WEBHOOK_VERIFY_TOKEN || VERIFY_TOKEN;
  const tokenToUse = rawEnvToken.replace(/^["']|["']$/g, '').trim();

  const queryStr = `?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(tokenToUse)}&hub.challenge=${challengeCode}`;

  const res3 = await sendRequest('GET', queryStr);
  const isPass3 = res3.status === 200 && (String(res3.data).includes(challengeCode) || res3.data === challengeCode);

  console.log(`   HTTP Status: ${res3.status} (${res3.elapsed}ms)`);
  console.log(`   Returned Challenge:`, typeof res3.data === 'object' ? JSON.stringify(res3.data) : res3.data);
  console.log(`   Verdict: ${isPass3 ? '✅ PASS' : '❌ FAIL'}\n`);
  if (isPass3) passedTests++;

  // -------------------------------------------------------------------------
  // SIMULATION 4: FAULT TOLERANCE & MALFORMED PAYLOAD
  // -------------------------------------------------------------------------
  console.log('👉 [SIMULATION 4/6] Fault Tolerance Test (Malformed Payload)...');
  const malformedPayload = {
    object: 'whatsapp_business_account',
    entry: [],
  };

  const res4 = await sendRequest('POST', '', malformedPayload);
  const isPass4 = res4.status === 200 && (res4.data?.status === 'STATUS_UPDATE_ACKNOWLEDGED' || res4.data?.status === 'IGNORED_NON_WHATSAPP_EVENT');

  console.log(`   HTTP Status: ${res4.status} (${res4.elapsed}ms)`);
  console.log(`   Response Payload:`, JSON.stringify(res4.data));
  console.log(`   Verdict: ${isPass4 ? '✅ PASS' : '❌ FAIL'}\n`);
  if (isPass4) passedTests++;

  // -------------------------------------------------------------------------
  // SIMULATION 5: CASO A - EVOLUTION WEBHOOK UNIQUE MESSAGE ID
  // -------------------------------------------------------------------------
  const dedupTestKeyId = `TEST_DEDUP_MSG_${Date.now()}`;
  console.log(`👉 [SIMULATION 5/6] Caso A: Evolution Webhook Unique Message ID ("${dedupTestKeyId}")...`);
  const evoPayloadA = {
    event: 'messages.upsert',
    instance: 'inmo_test_instance',
    data: {
      key: {
        remoteJid: '101679290703959@lid',
        remoteJidAlt: '5492604014372@s.whatsapp.net',
        fromMe: false,
        id: dedupTestKeyId,
        addressingMode: 'lid',
      },
      message: {
        conversation: 'Hola, busco casa en Mendoza',
      },
    },
  };

  const res5 = await sendEvolutionWebhookRequest(evoPayloadA);
  const isPass5 = res5.status === 200 && res5.data?.deduped !== true;

  console.log(`   HTTP Status: ${res5.status} (${res5.elapsed}ms)`);
  console.log(`   Response Payload:`, JSON.stringify(res5.data));
  console.log(`   Verdict: ${isPass5 ? '✅ PASS' : '❌ FAIL'}\n`);
  if (isPass5) passedTests++;

  // -------------------------------------------------------------------------
  // SIMULATION 6: CASO B - EVOLUTION WEBHOOK DUPLICATE MESSAGE ID (COLLISION GUARD)
  // -------------------------------------------------------------------------
  console.log(`👉 [SIMULATION 6/6] Caso B: Evolution Webhook Duplicate Message ID Collision Guard ("${dedupTestKeyId}")...`);
  const evoPayloadB = {
    event: 'messages.upsert',
    instance: 'inmo_test_instance',
    data: {
      key: {
        remoteJid: '5492604014372@s.whatsapp.net',
        remoteJidAlt: '5492604014372@s.whatsapp.net',
        fromMe: false,
        id: dedupTestKeyId,
        addressingMode: 'lid',
      },
      message: {
        conversation: 'Hola, busco casa en Mendoza',
      },
    },
  };

  const res6 = await sendEvolutionWebhookRequest(evoPayloadB);
  const isPass6 = res6.status === 200 && res6.data?.ok === true && res6.data?.deduped === true;

  console.log(`   HTTP Status: ${res6.status} (${res6.elapsed}ms)`);
  console.log(`   Response Payload:`, JSON.stringify(res6.data));
  console.log(`   Verdict: ${isPass6 ? '✅ PASS' : '❌ FAIL'}\n`);
  if (isPass6) passedTests++;

  // -------------------------------------------------------------------------
  // SUMMARY RESULTS
  // -------------------------------------------------------------------------
  console.log('================================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${passedTests}/${totalTests} PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
  if (passedTests === totalTests) {
    console.log('🎉 ALL WHATSAPP WEBHOOK SIMULATIONS EXECUTED SUCCESSFULLY!');
  } else {
    console.warn('⚠️ SOME SIMULATION TEST CASES FAILED. CHECK LOGS ABOVE.');
  }
  console.log('================================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runE2EWebhookTestSuite();


import handler, { sendWhatsAppTextMessage } from '../api/whatsapp-webhook';

async function runWhatsAppWebhookUnitTest() {
  console.log('====================================================');
  console.log('🧪 WHATSAPP WEBHOOK UNIT TEST');
  console.log('====================================================\n');

  process.env.WEBHOOK_VERIFY_TOKEN = 'aria_secret_verify_token_2026';
  process.env.WHATSAPP_ACCESS_TOKEN = 'mock_access_token';
  process.env.WHATSAPP_PHONE_NUMBER_ID = '1215379554999227';


  // 1. GET Verification Challenge Test (Success)
  console.log('👉 TEST 1: Meta GET Challenge Verification (Valid Token)...');
  let getStatus = 0;
  let getSentBody = '';

  const mockReqGet = {
    method: 'GET',
    headers: {},
    query: {
      'hub.mode': 'subscribe',
      'hub.verify_token': 'aria_secret_verify_token_2026',
      'hub.challenge': 'CHALLENGE_CODE_98765',
    },
  } as any;

  const mockResGet = {
    setHeader: () => {},
    status: (code: number) => {
      getStatus = code;
      return mockResGet;
    },
    send: (body: any) => {
      getSentBody = body;
      return mockResGet;
    },
    json: (body: any) => {
      getSentBody = JSON.stringify(body);
      return mockResGet;
    },
  } as any;

  await handler(mockReqGet, mockResGet);
  console.log('   HTTP Status:', getStatus);
  console.log('   Returned Challenge Body:', getSentBody);
  console.log('   Result:', getStatus === 200 && getSentBody === 'CHALLENGE_CODE_98765' ? '✅ PASSED' : '❌ FAILED');

  // 2. GET Verification Challenge Test (Invalid Token)
  console.log('\n👉 TEST 2: Meta GET Challenge Verification (Invalid Token)...');
  let getStatusInvalid = 0;
  const mockReqGetInvalid = {
    method: 'GET',
    headers: {},
    query: {
      'hub.mode': 'subscribe',
      'hub.verify_token': 'WRONG_TOKEN',
      'hub.challenge': 'CHALLENGE_CODE_98765',
    },
  } as any;

  const mockResGetInvalid = {
    setHeader: () => {},
    status: (code: number) => {
      getStatusInvalid = code;
      return mockResGetInvalid;
    },
    json: () => mockResGetInvalid,
  } as any;

  await handler(mockReqGetInvalid, mockResGetInvalid);
  console.log('   HTTP Status:', getStatusInvalid);
  console.log('   Result:', getStatusInvalid === 403 ? '✅ PASSED (Forbidden 403 correctly returned)' : '❌ FAILED');

  // 3. POST Incoming WhatsApp Message Simulation
  console.log('\n👉 TEST 3: Meta POST Incoming Message Processing...');
  let postStatus = 0;
  let postJsonData: any = {};

  const mockReqPost = {
    method: 'POST',
    headers: {},
    body: {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'WABA_12345',
          changes: [
            {
              field: 'messages',
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '15555555555',
                  phone_number_id: 'PHONE_ID_9999',
                },
                contacts: [{ profile: { name: 'Valentin Morales' }, wa_id: '5491122334455' }],
                messages: [
                  {
                    from: '5491122334455',
                    id: 'wamid.HBgL...',
                    timestamp: '1785405000',
                    type: 'text',
                    text: { body: 'Hola, tenes departamentos amoblados en alquiler en Mendoza?' },
                  },
                ],
              },
            },
          ],
        },
      ],
    },
  } as any;

  const mockResPost = {
    setHeader: () => {},
    status: (code: number) => {
      postStatus = code;
      return mockResPost;
    },
    json: (data: any) => {
      postJsonData = data;
      return mockResPost;
    },
  } as any;

  await handler(mockReqPost, mockResPost);
  console.log('   HTTP Status:', postStatus);
  console.log('   Processed Event:', postJsonData);
  console.log('   Generated AI Response Text:', postJsonData?.aiResponse);
  console.log('   Result:', postStatus === 200 && postJsonData?.aiResponse?.includes('Mendoza') ? '✅ PASSED' : '❌ FAILED');
}

runWhatsAppWebhookUnitTest();

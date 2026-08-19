import { handleV1Route as v1Handler } from '../api/_handlers/v1Handler';
import { handleCrmRoute as crmHandler } from '../api/_handlers/crmHandler';

async function debugHandlers() {
  console.log('🐞 Debugging handlers locally...');

  // Mock res object
  const createMockRes = (name: string) => ({
    setHeader: (k: string, v: string) => {},
    status: (code: number) => ({
      json: (data: any) => console.log(`[${name}] Status ${code}:`, JSON.stringify(data)),
      end: () => console.log(`[${name}] Status ${code} End`),
    }),
  });

  console.log('\n--- Testing v1Handler usage ---');
  try {
    await v1Handler({ method: 'GET', query: {}, headers: {} } as any, createMockRes('usage') as any, 'usage');
  } catch (err: any) {
    console.error('❌ v1Handler Error:', err);
  }

  console.log('\n--- Testing crmHandler credentials ---');
  try {
    await crmHandler({ method: 'GET', query: {}, headers: {} } as any, createMockRes('crmCredentials') as any, 'credentials');
  } catch (err: any) {
    console.error('❌ crmHandler Error:', err);
  }

  console.log('\n--- Testing v1Handler chat ---');
  try {
    await v1Handler({ method: 'POST', body: { message: 'hi' }, query: {}, headers: {} } as any, createMockRes('chat') as any, 'chat');
  } catch (err: any) {
    console.error('❌ v1Handler Error:', err);
  }
}

debugHandlers();

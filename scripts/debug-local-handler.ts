import usageHandler from '../api/usage';
import crmCredentialsHandler from '../api/crm-credentials';
import chatHandler from '../api/chat';

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

  console.log('\n--- Testing usageHandler ---');
  try {
    await usageHandler({ method: 'GET', query: {}, headers: {} } as any, createMockRes('usage') as any);
  } catch (err: any) {
    console.error('❌ usageHandler Error:', err);
  }

  console.log('\n--- Testing crmCredentialsHandler ---');
  try {
    await crmCredentialsHandler({ method: 'GET', query: {}, headers: {} } as any, createMockRes('crmCredentials') as any);
  } catch (err: any) {
    console.error('❌ crmCredentialsHandler Error:', err);
  }

  console.log('\n--- Testing chatHandler ---');
  try {
    await chatHandler({ method: 'POST', body: { message: 'hi' }, query: {}, headers: {} } as any, createMockRes('chat') as any);
  } catch (err: any) {
    console.error('❌ chatHandler Error:', err);
  }
}

debugHandlers();

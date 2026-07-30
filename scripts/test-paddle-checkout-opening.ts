import { chromium } from 'playwright';

async function testCheckoutOpening() {
  console.log('🧪 Probando apertura del modal de checkout de Paddle en https://ariaprop.online/dashboard/checkout...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  const consoleLogs: string[] = [];
  page.on('console', (msg) => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));

  try {
    await page.goto('https://ariaprop.online/dashboard/checkout', { waitUntil: 'networkidle', timeout: 30000 });

    // Look for payment buttons or plan cards
    console.log('👉 Buscando botones de pago...');
    
    // Check if there is any "Something went wrong" text
    const errorTextBefore = await page.content();
    if (errorTextBefore.includes('Something went wrong')) {
      console.error('❌ Error detectado antes del clic!');
    } else {
      console.log('✅ Sin errores previos en la página.');
    }

    // Print relevant console logs
    console.log('\n📜 Console logs del cliente:');
    consoleLogs.filter(l => l.includes('Paddle') || l.includes('error')).forEach(l => console.log('  ', l));

  } catch (err: any) {
    console.error('❌ Error en prueba Playwright:', err.message);
  } finally {
    await browser.close();
  }
}

testCheckoutOpening();

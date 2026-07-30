import { chromium } from 'playwright';

async function diagnosePaddleCheckoutError() {
  console.log('======================================================================');
  console.log('🔍 DIAGNÓSTICO PROFUNDO CON AUTH COMPLETA Y SELECCIÓN DE PADDLE');
  console.log('======================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  const consoleLogs: { type: string; text: string }[] = [];
  const networkRequests: { url: string; method: string; status?: number; responseBody?: string }[] = [];

  page.on('console', (msg) => {
    consoleLogs.push({ type: msg.type(), text: msg.text() });
    console.log(`[CLIENT CONSOLE ${msg.type().toUpperCase()}] ${msg.text()}`);
  });

  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('paddle') || url.includes('checkout') || url.includes('prices') || url.includes('transactions')) {
      let bodyText = '';
      try {
        bodyText = await response.text();
      } catch (e) {
        bodyText = '[Could not read body]';
      }
      networkRequests.push({
        url: url,
        method: response.request().method(),
        status: response.status(),
        responseBody: bodyText,
      });
      console.log(`\n🌐 HTTP RESPONSE: ${response.request().method()} ${url} [Status: ${response.status()}]`);
      console.log(`   BODY: ${bodyText.slice(0, 800)}`);
    }
  });

  try {
    console.log('👉 PASO 1: Ir a la home...');
    await page.goto('https://ariaprop.online/', { waitUntil: 'networkidle', timeout: 30000 });

    console.log('👉 PASO 2: Setear auth de usuario en localStorage y sessionStorage...');
    await page.evaluate(() => {
      const user = {
        id: 'usr_production_valentin',
        email: 'valentin@ariaprop.online',
        name: 'Valentin Morales',
        agencyName: 'Aria Proptech',
      };
      localStorage.setItem('aria_proptech_user', JSON.stringify(user));
      sessionStorage.setItem('aria_proptech_user', JSON.stringify(user));
    });

    console.log('👉 PASO 3: Ir a https://ariaprop.online/dashboard/checkout...');
    await page.goto('https://ariaprop.online/dashboard/checkout', { waitUntil: 'networkidle', timeout: 30000 });

    console.log('👉 PASO 4: Buscar la tarjeta de opción de pago "Tarjeta Crédito / Débito"...');
    const cardPaymentBtn = page.locator('text=Tarjeta Crédito / Débito').first();
    
    if (await cardPaymentBtn.count() > 0) {
      console.log('👉 PASO 5: Haciendo clic en "Tarjeta Crédito / Débito"...');
      await cardPaymentBtn.click();
      await page.waitForTimeout(2000);

      // Check if Auth Modal appeared
      const emailInput = page.locator('input[type="email"], input[placeholder*="correo"]').first();
      if (await emailInput.count() > 0 && await emailInput.isVisible()) {
        console.log('👉 PASO 6: Llenando formulario de Auth modal con valentin@ariaprop.online...');
        await emailInput.fill('valentin@ariaprop.online');
        const submitBtn = page.locator('button[type="submit"], button:has-text("Continuar")').first();
        if (await submitBtn.count() > 0) {
          await submitBtn.click();
          await page.waitForTimeout(3000);
        }
      }
    } else {
      console.log('⚠️ No se encontró la tarjeta de pago.');
    }

    console.log('👉 PASO 7: Esperando 5 segundos adicionales para capturar iframe o modal de Paddle...');
    await page.waitForTimeout(5000);

    await page.screenshot({ path: 'test-results/paddle-authenticated-checkout.png', fullPage: true });

  } catch (err: any) {
    console.error('❌ Excepción durante la prueba:', err.message);
  } finally {
    console.log('\n==================================================');
    console.log('📜 RESUMEN DE RESPUESTAS HTTP DE PADDLE:');
    console.log('==================================================');
    networkRequests.forEach((r) => {
      console.log(`\nURL: ${r.url}`);
      console.log(`Status: ${r.status}`);
      console.log(`Body: ${r.responseBody}`);
    });

    await browser.close();
  }
}

diagnosePaddleCheckoutError();

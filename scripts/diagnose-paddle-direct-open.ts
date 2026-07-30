import { chromium } from 'playwright';

async function testPaddleSuccessUrlFormat() {
  console.log('======================================================================');
  console.log('🧪 PRUEBA EN VIVO: TESTING SUCCESS_URL EN PADDLE.CHECKOUT.OPEN');
  console.log('======================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  page.on('console', (msg) => {
    console.log(`[CLIENT CONSOLE ${msg.type().toUpperCase()}] ${msg.text()}`);
  });

  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('paddle') || url.includes('checkout') || url.includes('transaction')) {
      let bodyText = '';
      try { bodyText = await response.text(); } catch {}
      console.log(`🌐 [HTTP ${response.status()}] ${url}`);
      if (bodyText) console.log(`   BODY: ${bodyText.slice(0, 500)}`);
    }
  });

  try {
    await page.goto('https://ariaprop.online/dashboard/checkout', { waitUntil: 'networkidle', timeout: 30000 });

    const codeToRun = `
      (function() {
        var Paddle = window.Paddle;
        if (!Paddle) return { error: 'Paddle not loaded' };
        try {
          if (Paddle.Environment && typeof Paddle.Environment.set === 'function') {
            Paddle.Environment.set('production');
          }
          if (typeof Paddle.Initialize === 'function') {
            Paddle.Initialize({ token: 'live_3335c4da3b502375ca2b1d960e2' });
          }
          Paddle.Checkout.open({
            items: [{ priceId: 'pri_01kyh63dg2h0jkwvd1bh6jde47', quantity: 1 }],
            settings: {
              displayMode: 'overlay',
              theme: 'dark',
              locale: 'es',
              successUrl: 'https://ariaprop.online/checkout/success'
            },
            eventCallback: function(event) {
              console.log('🔔 PADDLE EVENT CALLBACK:', JSON.stringify(event));
            }
          });
          return { success: true };
        } catch (e) {
          return { error: e.message || String(e) };
        }
      })()
    `;

    const res = await page.evaluate(codeToRun);
    console.log('👉 RESULTADO:', JSON.stringify(res, null, 2));

    await page.waitForTimeout(5000);

  } catch (err: any) {
    console.error('❌ Error:', err.message);
  } finally {
    await browser.close();
  }
}

testPaddleSuccessUrlFormat();

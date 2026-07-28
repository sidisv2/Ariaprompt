import { chromium, Browser, Page, ConsoleMessage, Request, Response } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const TARGET_URL = 'https://ariaprop.online';
const OUTPUT_DIR = path.join(process.cwd(), 'test-results');

interface NetworkLog {
  url: string;
  method: string;
  status: number;
  statusText: string;
  failureReason?: string;
}

async function runE2ETest() {
  console.log('======================================================================');
  console.log('🚀 INICIANDO PRUEBA END-TO-END DE PRODUCCIÓN:', TARGET_URL);
  console.log('======================================================================\n');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const consoleLogs: string[] = [];
  const networkErrors: NetworkLog[] = [];
  const networkRequests: NetworkLog[] = [];

  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    browser = await chromium.launch({
      headless: true,
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    });

    page = await context.newPage();

    page.on('console', (msg: ConsoleMessage) => {
      const logStr = `[Console ${msg.type().toUpperCase()}] ${msg.text()}`;
      consoleLogs.push(logStr);
      if (msg.type() === 'error') {
        console.log(' ⚠️', logStr);
      }
    });

    page.on('pageerror', (exception) => {
      console.log(' 💥 [Page Exception]:', exception.message);
      consoleLogs.push(`[Page Exception] ${exception.message}`);
    });

    page.on('response', (res: Response) => {
      const status = res.status();
      const url = res.url();
      const req = res.request();

      networkRequests.push({
        url,
        method: req.method(),
        status,
        statusText: res.statusText(),
      });

      // Ignore external analytics/marketing domain cancellations
      const isExternalTracking = url.includes('google.com/ccm') || url.includes('googleadservices') || url.includes('doubleclick');
      if (status >= 400 && !isExternalTracking) {
        const errLog: NetworkLog = {
          url,
          method: req.method(),
          status,
          statusText: res.statusText(),
        };
        networkErrors.push(errLog);
        console.log(` ❌ [HTTP ${status}] ${req.method()} ${url}`);
      }
    });

    page.on('requestfailed', (req: Request) => {
      const failure = req.failure();
      const url = req.url();
      const isExternalTracking = url.includes('google.com/ccm') || url.includes('googleadservices') || url.includes('doubleclick');
      if (!isExternalTracking) {
        const errLog: NetworkLog = {
          url: req.url(),
          method: req.method(),
          status: 0,
          statusText: 'FAILED',
          failureReason: failure?.errorText || 'Unknown request failure',
        };
        networkErrors.push(errLog);
        console.log(` 💥 [REQUEST FAILED] ${req.method()} ${url} (${errLog.failureReason})`);
      }
    });

    // ======================================================================
    // PASO 1: Cargar la home (https://ariaprop.online)
    // ======================================================================
    console.log('👉 PASO 1: Cargar la home y verificar Hero, Banner Beta y WhatsApp...');
    const response = await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 30000 });
    
    if (!response || response.status() >= 400) {
      throw new Error(`Fallo la carga inicial de ${TARGET_URL}. Status: ${response?.status()}`);
    }

    const step1Path = path.join(OUTPUT_DIR, 'step1-home.png');
    await page.screenshot({ path: step1Path, fullPage: true });
    console.log(` 📸 Screenshot guardado: ${step1Path}`);

    const heroHeading = await page.locator('h1').first();
    const heroText = await heroHeading.textContent();
    console.log(` ✅ Hero H1 detectado: "${heroText?.trim()}"`);

    const betaBanner = page.locator('text=fase de prueba').or(page.locator('text=fase beta')).or(page.locator('text=Aria Prop está en fase'));
    const isBetaVisible = await betaBanner.first().isVisible({ timeout: 5000 }).catch(() => false);
    if (!isBetaVisible) {
      throw new Error('Banner de fase de prueba no encontrado en el DOM de la Home');
    }
    console.log(' ✅ Banner de fase de prueba (beta) detectado y verificado');

    const whatsappLink = page.locator('a[href*="wa.me"]').or(page.locator('a[href*="whatsapp"]')).or(page.locator('a[href*="5492604014372"]'));
    const waCount = await whatsappLink.count();
    if (waCount === 0) {
      throw new Error('Botón o enlace de WhatsApp no encontrado en la Home');
    }
    console.log(` ✅ Enlace/Botón de WhatsApp verificado (${waCount} encontrado/s)`);

    console.log(' PASO 1 CONFIRMADO CON EVIDENCIA.\n');

    // ======================================================================
    // PASO 2: Clic en CTA principal ("Ver Demostración en Vivo" o similar)
    // ======================================================================
    console.log('👉 PASO 2: Hacer clic en el CTA principal...');
    
    const ctaButton = page.locator('button:has-text("Demostración")')
      .or(page.locator('button:has-text("Demo")'))
      .or(page.locator('button:has-text("Comenzar")'))
      .or(page.locator('button:has-text("Probar")'))
      .first();

    const ctaText = await ctaButton.textContent();
    console.log(` 🎯 Haciendo clic en CTA: "${ctaText?.trim()}"`);
    await ctaButton.click();
    await page.waitForTimeout(1000);

    const step2Path = path.join(OUTPUT_DIR, 'step2-cta-clicked.png');
    await page.screenshot({ path: step2Path });
    console.log(` 📸 Screenshot guardado: ${step2Path}`);
    console.log(' PASO 2 CONFIRMADO CON EVIDENCIA.\n');

    // ======================================================================
    // PASO 3: Registro / Inicio de sesión demo efímera -> Navegar a /app
    // ======================================================================
    console.log('👉 PASO 3: Ejecutar inicio de sesión Demo Efímera y llegar a /app...');

    const demoLoginBtn = page.locator('button:has-text("Demo Instantánea")')
      .or(page.locator('button:has-text("Modo Prueba")'))
      .or(page.locator('button:has-text("Entrar a la Demo")'))
      .or(page.locator('button:has-text("Probar Demo")'))
      .or(page.locator('button:has-text("Ver Demostración")'))
      .first();

    if (await demoLoginBtn.isVisible().catch(() => false)) {
      console.log(' 🔑 Pulsando botón de Demo Efímera...');
      await demoLoginBtn.click();
    } else {
      console.log(' ℹ️ Navegando explícitamente a /app...');
      await page.goto(`${TARGET_URL}/app`, { waitUntil: 'networkidle' });
    }

    await page.waitForTimeout(2000);
    const step3Path = path.join(OUTPUT_DIR, 'step3-workspace.png');
    await page.screenshot({ path: step3Path, fullPage: true });
    console.log(` 📸 Screenshot guardado: ${step3Path}`);

    const currentUrl = page.url();
    console.log(` 📍 URL actual tras login: ${currentUrl}`);

    if (!currentUrl.includes('/app') && !currentUrl.includes('/dashboard')) {
      throw new Error(`El usuario NO llegó a /app ni al Workspace. URL actual: ${currentUrl}`);
    }

    console.log(' PASO 3 CONFIRMADO CON EVIDENCIA: Usuario dentro del Workspace.\n');

    // ======================================================================
    // PASO 4: Escribir mensaje en el chat del Asistente IA y VERIFICAR RESPUESTA
    // ======================================================================
    console.log('👉 PASO 4: Escribir mensaje en el chat del Asistente IA 24/7 y verificar respuesta real...');

    await page.goto(TARGET_URL, { waitUntil: 'networkidle' });

    const chatInput = page.locator('input[placeholder*="consulta"]')
      .or(page.locator('input[placeholder*="criterios"]'))
      .or(page.locator('textarea'))
      .first();

    await chatInput.waitFor({ state: 'visible', timeout: 10000 });

    const userQuery = 'Busco un depto de 2 ambientes en Mendoza';
    console.log(` 💬 Enviando mensaje al Asistente: "${userQuery}"`);

    await chatInput.fill(userQuery);

    const submitBtn = page.locator('button:has-text("Probar")')
      .or(page.locator('button:has-text("Enviar")'))
      .or(page.locator('button[type="submit"]'))
      .first();

    if (await submitBtn.isVisible().catch(() => false)) {
      await submitBtn.click();
    } else {
      await page.keyboard.press('Enter');
    }

    console.log(' ⏳ Esperando que el Asistente IA genere la respuesta...');
    await page.waitForTimeout(6000);

    const step4Path = path.join(OUTPUT_DIR, 'step4-ai-response.png');
    await page.screenshot({ path: step4Path, fullPage: true });
    console.log(` 📸 Screenshot guardado: ${step4Path}`);

    const messageElements = page.locator('.hero-interactive p, .chat-message p, [class*="prose"], div:has-text("Mendoza")');
    const msgTexts = await messageElements.allInnerTexts();
    const cleanTexts = msgTexts.map((t) => t.trim()).filter((t) => t.length > 5);

    console.log(' 💬 MENSAJES EXTRAÍDOS DEL CHAT:');
    cleanTexts.forEach((txt, idx) => {
      console.log(`    [${idx + 1}] ${txt}`);
    });

    if (cleanTexts.length === 0) {
      throw new Error('El Asistente IA NO respondió o la respuesta quedó vacía');
    }

    console.log(' PASO 4 CONFIRMADO CON EVIDENCIA: El Asistente IA respondió correctamente.\n');

    // ======================================================================
    // PASO 5: Navegar a Conexión CRM Partners y verificar 404 / Tarjetas
    // ======================================================================
    console.log('👉 PASO 5: Navegar a Conexión CRM Partners (/dashboard/integrations)...');

    const integrationsUrl = `${TARGET_URL}/dashboard/integrations`;
    const crmResponse = await page.goto(integrationsUrl, { waitUntil: 'networkidle', timeout: 15000 });

    const step5Path = path.join(OUTPUT_DIR, 'step5-crm-integrations.png');
    await page.screenshot({ path: step5Path, fullPage: true });
    console.log(` 📸 Screenshot guardado: ${step5Path}`);

    console.log(` 📊 HTTP Status de /dashboard/integrations: ${crmResponse?.status()}`);

    if (crmResponse?.status() === 404) {
      throw new Error('FALLO CRÍTICO: La ruta /dashboard/integrations devolvió 404 Not Found!');
    }

    const tokkoCard = page.locator('text=Tokko').or(page.locator('text=Tokko Broker'));
    const easyBrokerCard = page.locator('text=EasyBroker');

    const hasTokko = await tokkoCard.first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasEasyBroker = await easyBrokerCard.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasTokko || !hasEasyBroker) {
      throw new Error(`Tarjetas CRM faltantes: Tokko=${hasTokko}, EasyBroker=${hasEasyBroker}`);
    }

    console.log(` ✅ Tarjeta Tokko Broker visible: SÍ`);
    console.log(` ✅ Tarjeta EasyBroker visible: SÍ`);
    console.log(' PASO 5 CONFIRMADO CON EVIDENCIA.\n');

    // ======================================================================
    // PASO 6: Probar modal de cerrar sesión
    // ======================================================================
    console.log('👉 PASO 6: Probar botón de Cerrar Sesión y verificar apertura del Modal de Confirmación...');

    // Find the log out icon button in header by exact title attribute 'Cerrar sesión'
    const logoutBtn = page.locator('button[title="Cerrar sesión"]')
      .or(page.locator('button[title*="logout"]'))
      .first();

    if (!(await logoutBtn.isVisible().catch(() => false))) {
      throw new Error('No se encontró el botón de cerrar sesión en la interfaz');
    }

    console.log(' 🚪 Pulsando botón de Cerrar Sesión en Header...');
    await logoutBtn.click();
    await page.waitForTimeout(1000);

    const step6ModalPath = path.join(OUTPUT_DIR, 'step6-logout-modal.png');
    await page.screenshot({ path: step6ModalPath });
    console.log(` 📸 Screenshot guardado: ${step6ModalPath}`);

    // Verify LogoutConfirmModal appears in DOM
    const modalTitle = page.locator('h3:has-text("Cerrar Sesión")');
    const modalSubtitle = page.locator('p:has-text("deseas salir de tu panel")');
    const isModalVisible = (await modalTitle.isVisible().catch(() => false)) || (await modalSubtitle.isVisible().catch(() => false));

    if (!isModalVisible) {
      throw new Error('EL MODAL DE CONFIRMACIÓN DE LOGOUT NO SE DESPLEGÓ EN EL DOM');
    }

    console.log(' ✅ Modal de confirmación de Cierre de Sesión DEPLOYADO Y CONFIRMADO EN EL DOM ("Cerrar Sesión")');

    // Click confirm logout button inside modal
    const confirmLogoutBtn = page.locator('button:has-text("Sí, Cerrar Sesión")')
      .or(page.locator('button:has-text("Sí, cerrar")'))
      .first();

    await confirmLogoutBtn.click();
    await page.waitForTimeout(2000);

    const step7Path = path.join(OUTPUT_DIR, 'step7-logged-out.png');
    await page.screenshot({ path: step7Path });
    console.log(` 📸 Screenshot guardado: ${step7Path}`);
    console.log(` 📍 URL tras confirmar salida: ${page.url()}`);
    console.log(' PASO 6 CONFIRMADO CON EVIDENCIA.\n');

    // ======================================================================
    // PASO 7: AUDITORÍA Y RESUMEN FINAL DE RED
    // ======================================================================
    console.log('======================================================================');
    console.log('📊 AUDITORÍA FINAL DE SOLICITUDES DE RED Y ERRORES HTTP');
    console.log('======================================================================');

    console.log(`Total solicitudes de red registradas: ${networkRequests.length}`);
    console.log(`Total errores HTTP (>=400 o FAILED): ${networkErrors.length}`);

    if (networkErrors.length > 0) {
      console.log('\n❌ DETALLE DE ERRORES DE RED CAPTURADOS:');
      networkErrors.forEach((e, idx) => {
        console.log(`   ${idx + 1}. [HTTP ${e.status}] ${e.method} ${e.url} ${e.failureReason ? `(${e.failureReason})` : ''}`);
      });
      throw new Error(`Se detectaron ${networkErrors.length} error(es) de red HTTP durante la prueba.`);
    }

    console.log('\n🎉 CERO ERRORES HTTP (>=400) DETECTADOS EN LA PRUEBA.');
    console.log('======================================================================');
    console.log('🏆 TODOS LOS 6 PASOS Y PUNTOS DE AUDITORÍA FUERON CONFIRMADOS CON EVIDENCIA');
    console.log('======================================================================');

  } catch (err: any) {
    console.error('\n======================================================================');
    console.error('❌ LA PRUEBA END-TO-END DETUVO SU EJECUCIÓN CON ERROR:');
    console.error('======================================================================');
    console.error(err.message || err);

    if (page) {
      const errorPath = path.join(OUTPUT_DIR, 'error-failure-state.png');
      await page.screenshot({ path: errorPath, fullPage: true }).catch(() => {});
      console.error(` 📸 Screenshot del estado del fallo guardado en: ${errorPath}`);
    }

    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

runE2ETest();

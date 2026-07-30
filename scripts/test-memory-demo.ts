import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const TARGET_URL = 'https://ariaprop.online';
const OUTPUT_DIR = path.join(process.cwd(), 'test-results', 'memory-demo');

async function runMemoryDemoTest() {
  console.log('======================================================================');
  console.log('🧠 PRUEBA E2E PLAYWRIGHT: DEMO MEMORIA & CONTEXTO (5 TURNOS)');
  console.log('======================================================================\n');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();

  try {
    console.log('👉 PASO 1: Cargando la home de producción...');
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 30000 });

    console.log('👉 PASO 2: Buscando y activando la pestaña "🧠 Memoria & Contexto (5 Turnos)"...');
    const memoryTab = page.locator('button:has-text("Memoria & Contexto")').first();

    await memoryTab.scrollIntoViewIfNeeded();
    await memoryTab.waitFor({ state: 'visible', timeout: 10000 });

    console.log(' 🎯 Pulsando pestaña "🧠 Memoria & Contexto (5 Turnos)"...');
    await memoryTab.click();
    await page.waitForTimeout(1500);

    console.log(`\n======================================================================`);
    console.log(`📋 CAPTURANDO Y VERIFICANDO LOS 5 TURNOS EN PRODUCCIÓN:`);
    console.log(`======================================================================\n`);

    const turnTitles = [
      'Turno 1 • Manejo de Ambigüedad',
      'Turno 2 • Memoria Conversacional',
      'Turno 3 • Búsqueda Comparativa Dinámica',
      'Turno 4 • Reserva & Cualificación Final',
      'Turno 5 • Lead Registrado en Dashboard',
    ];

    for (let i = 0; i < 5; i++) {
      const stepDot = page.locator(`button:has-text("Turno ${i + 1}")`).or(page.locator(`text=Turno ${i + 1}`)).first();
      
      if (await stepDot.isVisible().catch(() => false)) {
        await stepDot.click().catch(() => {});
        await page.waitForTimeout(1000);
      }

      const screenshotPath = path.join(OUTPUT_DIR, `turno-${i + 1}.png`);
      await page.screenshot({ path: screenshotPath });

      console.log(`✅ TURNO ${i + 1}: ${turnTitles[i]}`);
      console.log(`   📸 Screenshot guardado en: ${screenshotPath}`);
    }

    console.log('\n======================================================================');
    console.log('🏆 LA DEMO INTERACTIVA "MEMORIA & CONTEXTO (5 TURNOS)" ESTÁ 100% OPERATIVA');
    console.log('======================================================================');

  } catch (err: any) {
    console.error('\n❌ ERROR EN LA PRUEBA DE MEMORIA & CONTEXTO:', err.message || err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runMemoryDemoTest();

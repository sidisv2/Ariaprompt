import { chromium, FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalSetup(config: FullConfig) {
  const baseURL =
    process.env.PLAYWRIGHT_BASE_URL ||
    config.projects[0].use.baseURL ||
    'http://localhost:3000';

  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;

  if (!email || !password) {
    console.warn('[E2E Setup] Credenciales E2E_USER_EMAIL o E2E_USER_PASSWORD no definidas. Generando estado de auth inicial...');
    const authDir = path.resolve('./playwright/.auth');
    fs.mkdirSync(authDir, { recursive: true });
    const storageState = path.join(authDir, 'user.json');
    if (!fs.existsSync(storageState)) {
      fs.writeFileSync(storageState, JSON.stringify({ cookies: [], origins: [] }), 'utf8');
    }
    return;
  }

  const authDir = path.resolve('./playwright/.auth');
  fs.mkdirSync(authDir, { recursive: true });
  const storageState = path.join(authDir, 'user.json');

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log(`[E2E] Login en ${baseURL}/login`);

  await page.goto(`${baseURL}/login`, {
    waitUntil: 'domcontentloaded',
  });

  const emailInput = page.locator('input[type="email"], input[name="email"], [data-testid="login-email"]').first();
  const passwordInput = page.locator('input[type="password"], input[name="password"], [data-testid="login-password"]').first();
  const submitButton = page.locator('button[type="submit"], [data-testid="login-submit"]').first();

  await emailInput.fill(email);
  await passwordInput.fill(password);
  await submitButton.click();

  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
  await page.waitForLoadState('networkidle');

  if (!page.url().includes('/dashboard')) {
    throw new Error(`[E2E] Login fallido. URL actual: ${page.url()}`);
  }

  await context.storageState({ path: storageState });
  await browser.close();

  console.log(`[E2E] Estado de autenticación guardado en ${storageState}`);
}

export default globalSetup;

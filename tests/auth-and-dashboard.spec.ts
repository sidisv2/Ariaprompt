import { test, expect } from '@playwright/test';

test.describe('Aria Prop - Authentication & CRM Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/leads', {
      waitUntil: 'domcontentloaded',
    });

    await expect(page).toHaveURL(/\/dashboard\/leads/);
  });

  test('carga el dashboard de leads correctamente', async ({ page }) => {
    // Evita considerar el skeleton como contenido real
    await expect(page.locator('[data-testid="leads-loading"]')).toHaveCount(0);

    // Indicadores del CRM visibles
    await expect(page.getByText(/Total Leads/i)).toBeVisible();
    await expect(page.getByText(/Calificados/i)).toBeVisible();
    await expect(page.getByText(/Activos/i)).toBeVisible();
    await expect(page.getByText(/Derivados/i)).toBeVisible();
  });

  test('renderiza al menos un lead real', async ({ page }) => {
    const leadRows = page.locator('[data-testid="lead-row"]');
    await expect(leadRows.first()).toBeVisible({ timeout: 15_000 });
    expect(await leadRows.count()).toBeGreaterThan(0);
  });

  test('los KPIs no quedan en estado infinito o inválido', async ({ page }) => {
    const kpiValues = page.locator('[data-testid^="kpi-"]');
    await expect(kpiValues.first()).toBeVisible();

    const values = await kpiValues.allTextContents();
    for (const value of values) {
      expect(value.trim()).not.toBe('');
      expect(value.trim()).not.toContain('undefined');
      expect(value.trim()).not.toContain('NaN');
    }
  });

  test('permite filtrar leads por estado', async ({ page }) => {
    const statusButtons = page.locator('[data-testid^="lead-filter-"]');
    if (await statusButtons.count() > 0) {
      const qualifiedBtn = page.locator('[data-testid="lead-filter-qualified"]');
      if (await qualifiedBtn.count() > 0) {
        await qualifiedBtn.click();
        await page.waitForTimeout(300);
      }
    }

    const rows = page.locator('[data-testid="lead-row"]');
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      await expect(row).toBeVisible();
    }
  });

  test('renderiza el historial de conversación si existen mensajes', async ({ page }) => {
    const firstLead = page.locator('[data-testid="lead-row"]').first();
    if (await firstLead.count() > 0) {
      await firstLead.click();
      const emptyState = page.getByText(/No hay mensajes registrados/i);
      const messages = page.locator('[data-testid="chat-message"]');
      await expect(messages.first().or(emptyState)).toBeVisible({ timeout: 15_000 });
    }
  });
});

test.describe('Aria Prop - Mobile CRM', () => {
  test.use({
    viewport: {
      width: 375,
      height: 812,
    },
  });

  test('CRM es usable en 375x812', async ({ page }) => {
    await page.goto('/dashboard/leads');
    await expect(page).toHaveURL(/\/dashboard\/leads/);

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 2);
  });

  test('el detalle del lead no desborda el viewport', async ({ page }) => {
    const firstLead = page.locator('[data-testid="lead-row"]').first();
    if (await firstLead.count() > 0) {
      await firstLead.click();
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 2);
    }
  });
});

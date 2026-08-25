import { test, expect } from '@playwright/test';

function buildE2ERunId() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

test.describe('Aria Prop - Webhook → Supabase → CRM UI', () => {
  test('un lead recibido por webhook termina visible en el CRM', async ({ page, request }) => {
    const webhookUrl = process.env.E2E_WEBHOOK_URL || '/api/whatsapp';
    const webhookSecret = process.env.E2E_WEBHOOK_SECRET;

    if (!webhookSecret) {
      test.skip(true, 'E2E_WEBHOOK_SECRET no configurado');
      return;
    }

    const runId = buildE2ERunId();
    const phone = `549261${Date.now().toString().slice(-7)}`;

    const payload = {
      object: 'whatsapp_business_account',
      e2e: true,
      e2e_run_id: runId,
      entry: [
        {
          id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '15550234567',
                  phone_number_id: 'PHONE_NUMBER_ID',
                },
                contacts: [
                  {
                    profile: {
                      name: `E2E Test ${runId}`,
                    },
                    wa_id: phone,
                  },
                ],
                messages: [
                  {
                    from: phone,
                    id: `wamid.e2e.${runId}`,
                    timestamp: Math.floor(Date.now() / 1000).toString(),
                    text: {
                      body: `E2E Aria Prop ${runId}`,
                    },
                    type: 'text',
                  },
                ],
              },
              field: 'messages',
            },
          ],
        },
      ],
    };

    const response = await request.post(webhookUrl, {
      headers: {
        'content-type': 'application/json',
        'x-e2e-test-secret': webhookSecret,
      },
      data: payload,
    });

    expect(
      response.ok(),
      `Webhook respondió ${response.status()}: ${await response.text()}`
    ).toBeTruthy();

    await page.goto('/dashboard/leads', {
      waitUntil: 'domcontentloaded',
    });

    const leadRow = page.locator('[data-testid="lead-row"]');
    await expect(
      leadRow.filter({ hasText: runId })
    ).toBeVisible({ timeout: 30_000 });

    const row = leadRow.filter({ hasText: runId });
    await expect(row).toContainText(phone);
  });
});

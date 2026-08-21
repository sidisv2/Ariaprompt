import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getEvolutionConfig, setEvolutionWebhook, getEvolutionInstanceStatus } from './_lib/evolutionClient.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { baseUrl, apiKey } = getEvolutionConfig();
  if (!baseUrl) {
    return res.status(500).json({
      success: false,
      error: 'EVOLUTION_API_URL no está configurado en las variables de entorno.',
    });
  }

  try {
    // 1. Fetch available instances from Evolution API
    let instances: any[] = [];
    try {
      const instRes = await fetch(`${baseUrl}/instance/fetchInstances`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { apikey: apiKey } : {}),
        },
      });
      const instData = await instRes.json().catch(() => []);
      if (Array.isArray(instData)) {
        instances = instData;
      } else if (instData && Array.isArray(instData.instances)) {
        instances = instData.instances;
      }
    } catch (e: any) {
      console.warn('⚠️ Error fetching instances from Evolution API:', e?.message);
    }

    // Determine target instance name
    const queryInstance = typeof req.query.instance === 'string' ? req.query.instance.trim() : '';
    let instanceName = queryInstance;

    if (!instanceName && instances.length > 0) {
      // Pick first active or connected instance, or fallback to first instance
      const openInst = instances.find(
        (i: any) => i.connectionStatus === 'open' || i.instance?.status === 'open' || i.status === 'open'
      );
      instanceName =
        openInst?.name ||
        openInst?.instance?.name ||
        instances[0]?.name ||
        instances[0]?.instance?.name ||
        '';
    }

    if (!instanceName) {
      instanceName = 'aria-default';
    }

    // 2. Fetch current connection status
    const statusResult = await getEvolutionInstanceStatus(instanceName);

    // 3. Find current webhook configuration for instance
    let webhookConfig: any = null;
    let fetchWebhookSuccess = false;

    try {
      const whRes = await fetch(`${baseUrl}/webhook/find/${instanceName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { apikey: apiKey } : {}),
        },
      });
      const whData = await whRes.json().catch(() => ({}));
      console.log(`📌 Webhook config for "${instanceName}":`, JSON.stringify(whData));
      webhookConfig = whData;
      fetchWebhookSuccess = whRes.ok;
    } catch (whErr: any) {
      console.warn(`⚠️ Error fetching webhook config for "${instanceName}":`, whErr?.message);
    }

    // 4. Check if webhook is enabled and configured correctly
    const targetWebhookUrl = 'https://ariaprop.online/api/webhook/evolution';
    const isWebhookEnabled =
      webhookConfig?.enabled === true ||
      webhookConfig?.webhook?.enabled === true ||
      webhookConfig?.url === targetWebhookUrl ||
      webhookConfig?.webhook?.url === targetWebhookUrl;

    let autoFixed = false;
    let fixResult: any = null;

    if (!isWebhookEnabled || !fetchWebhookSuccess) {
      console.log(`🛠️ Webhook disabled or not configured on "${instanceName}". Triggering auto-fix to "${targetWebhookUrl}"...`);
      const syncRes = await setEvolutionWebhook(instanceName, targetWebhookUrl);
      autoFixed = syncRes.success;
      fixResult = syncRes;

      // Re-fetch webhook config after repair
      if (syncRes.success) {
        try {
          const whRefetch = await fetch(`${baseUrl}/webhook/find/${instanceName}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(apiKey ? { apikey: apiKey } : {}),
            },
          });
          webhookConfig = await whRefetch.json().catch(() => ({}));
        } catch {}
      }
    }

    return res.status(200).json({
      success: true,
      instanceName,
      connectionStatus: statusResult.state || 'unknown',
      ownerNumber: statusResult.number || null,
      webhookConfig,
      autoFixed,
      fixResult,
      fetchedInstancesCount: instances.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('❌ Exception in test-evolution-status handler:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Error al ejecutar diagnóstico de Evolution API',
    });
  }
}

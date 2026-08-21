import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getEvolutionConfig } from './_lib/evolutionClient.js';

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

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const rawPhone = (req.query.phone as string) || body.phone || '5492604014372';
  const rawText = (req.query.text as string) || body.text || '🚀 Prueba de conexión exitosa desde Aria Prop!';
  const rawInstance = (req.query.instance as string) || body.instance || '';

  const cleanPhone = rawPhone.replace('@s.whatsapp.net', '').replace(/\D/g, '').trim();
  if (!cleanPhone) {
    return res.status(400).json({
      success: false,
      error: 'Número de teléfono de destino no válido.',
    });
  }

  let instanceName = rawInstance.trim();

  // If no instance name provided, query available instances from Railway
  if (!instanceName) {
    try {
      const instRes = await fetch(`${baseUrl}/instance/fetchInstances`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { apikey: apiKey } : {}),
        },
      });
      const instData = await instRes.json().catch(() => []);
      let instancesList: any[] = [];
      if (Array.isArray(instData)) {
        instancesList = instData;
      } else if (instData && Array.isArray(instData.instances)) {
        instancesList = instData.instances;
      }

      if (instancesList.length > 0) {
        const openInst = instancesList.find(
          (i: any) => i.connectionStatus === 'open' || i.instance?.status === 'open' || i.status === 'open'
        );
        instanceName =
          openInst?.name ||
          openInst?.instance?.name ||
          instancesList[0]?.name ||
          instancesList[0]?.instance?.name ||
          '';
      }
    } catch {}
  }

  if (!instanceName) {
    instanceName = 'inmo_13d92ac1_1b4a_4d3f_8418_abff914b0500';
  }

  const sendUrl = `${baseUrl}/message/sendText/${instanceName}`;
  const sendPayload = {
    number: cleanPhone,
    text: rawText,
  };

  console.log(`📌 [TEST SEND WHATSAPP] Requesting URL: "${sendUrl}" for phone "${cleanPhone}"...`);

  try {
    const fetchRes = await fetch(sendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { apikey: apiKey } : {}),
      },
      body: JSON.stringify(sendPayload),
    });

    const responseBody = await fetchRes.json().catch(() => ({}));
    console.log(`📌 [TEST SEND WHATSAPP] Status ${fetchRes.status} Response:`, JSON.stringify(responseBody));

    return res.status(200).json({
      success: fetchRes.ok || fetchRes.status === 200 || fetchRes.status === 201,
      httpStatus: fetchRes.status,
      instanceName,
      targetPhone: cleanPhone,
      textSent: rawText,
      evolutionResponseBody: responseBody,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('❌ Exception in test-send-whatsapp handler:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Error de comunicación con Evolution API al enviar mensaje.',
    });
  }
}

import QRCode from 'qrcode';

export interface EvolutionConfig {
  baseUrl: string;
  apiKey: string;
}

export function getEvolutionConfig(): EvolutionConfig {
  const baseUrl = (
    process.env.EVOLUTION_API_URL ||
    process.env.VITE_EVOLUTION_API_URL ||
    'https://evolution-api-production-2f52.up.railway.app'
  ).replace(/\/+$/, '');

  const apiKey = (
    process.env.EVOLUTION_API_KEY ||
    process.env.VITE_EVOLUTION_API_KEY ||
    ''
  ).trim();

  return { baseUrl, apiKey };
}

/**
 * Creates a new WhatsApp Baileys instance in Evolution API
 */
export async function createEvolutionInstance(
  instanceName: string,
  token: string,
  options?: { qrcode?: boolean; number?: string }
): Promise<{ success: boolean; data?: any; error?: string }> {
  const { baseUrl, apiKey } = getEvolutionConfig();
  if (!baseUrl) {
    return { success: false, error: 'EVOLUTION_API_URL not configured' };
  }

  const cleanNumber = options?.number ? options.number.replace(/\D/g, '') : undefined;

  try {
    const res = await fetch(`${baseUrl}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { apikey: apiKey } : {}),
      },
      body: JSON.stringify({
        instanceName,
        token,
        qrcode: options?.qrcode ?? true,
        ...(cleanNumber ? { number: cleanNumber } : {}),
        integration: 'WHATSAPP-BAILEYS',
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok || data.instance || data.status === 201) {
      return { success: true, data };
    }
    return { success: false, error: data.message || data.error || `HTTP ${res.status}` };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error connecting to Evolution API' };
  }
}

/**
 * Sets up instance webhooks for MESSAGES_UPSERT, CONNECTION_UPDATE and SEND_MESSAGE.
 * Formatted strictly for Evolution API v2 requiring nested "webhook" object wrapper.
 */
export async function setEvolutionWebhook(
  instanceName: string,
  webhookUrl: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  const { baseUrl, apiKey } = getEvolutionConfig();
  if (!baseUrl) {
    return { success: false, error: 'EVOLUTION_API_URL no configurado' };
  }

  const cleanInstance = (instanceName || '').trim();
  if (!cleanInstance) {
    return { success: false, error: 'Nombre de instancia de WhatsApp no válido' };
  }

  const payload = {
    webhook: {
      enabled: true,
      url: webhookUrl,
      byEvents: false,
      base64: false,
      events: [
        'MESSAGES_UPSERT',
        'CONNECTION_UPDATE',
        'SEND_MESSAGE',
      ],
    },
  };

  const targetUrl = `${baseUrl}/webhook/set/${cleanInstance}`;
  console.log(`📌 [EVOLUTION WEBHOOK SET] Calling URL: "${targetUrl}"...`);
  console.log(`📌 [EVOLUTION WEBHOOK SET] Payload:`, JSON.stringify(payload, null, 2));

  try {
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { apikey: apiKey } : {}),
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    console.log(`📌 [EVOLUTION WEBHOOK SET] Response Status [${res.status}]:`, JSON.stringify(data));

    const isSuccess =
      res.ok ||
      res.status === 200 ||
      res.status === 201 ||
      data.status === 'SUCCESS' ||
      data.status === 200 ||
      Boolean(data.webhook);

    if (isSuccess) {
      return { success: true, data };
    }

    const errorMsg =
      data?.message ||
      data?.error ||
      (Array.isArray(data?.response?.message) ? data.response.message.join(', ') : data?.response?.message) ||
      `HTTP ${res.status}: Bad Request`;

    return { success: false, error: String(errorMsg), data };
  } catch (err: any) {
    console.error(`❌ Exception setting Evolution Webhook:`, err);
    return { success: false, error: err?.message || 'Error de comunicación al configurar webhook en Evolution API' };
  }
}

/**
 * Connects to instance and retrieves current QR Code (DataURL) or pairing code
 */
export async function getEvolutionConnectQr(instanceName: string): Promise<{ success: boolean; qr?: string; qrcode?: string; pairingCode?: string; state?: string; error?: string }> {
  const { baseUrl, apiKey } = getEvolutionConfig();
  if (!baseUrl) {
    return { success: false, error: 'EVOLUTION_API_URL not configured' };
  }

  try {
    const res = await fetch(`${baseUrl}/instance/connect/${instanceName}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { apikey: apiKey } : {}),
      },
    });

    const data = await res.json().catch(() => ({}));
    const rawQr: string | null = data.base64 || data.qrcode?.base64 || data.code || data.qrcode?.code || null;
    const pairingCode: string | null = data.pairingCode || data.pairing_code || null;
    const state = data.instance?.state || data.state || 'connecting';

    let qrDataUrl: string | undefined = undefined;

    if (rawQr && typeof rawQr === 'string') {
      const trimmed = rawQr.trim();
      if (trimmed.startsWith('data:image')) {
        qrDataUrl = trimmed;
      } else if (trimmed.startsWith('iVBORw0KGgo') || (trimmed.length > 100 && !trimmed.includes(' '))) {
        qrDataUrl = `data:image/png;base64,${trimmed}`;
      } else {
        try {
          qrDataUrl = await QRCode.toDataURL(trimmed);
        } catch (qrErr) {
          console.warn('⚠️ Error generating QR DataURL from code text:', qrErr);
        }
      }
    }

    return {
      success: res.ok || Boolean(qrDataUrl || pairingCode),
      qr: qrDataUrl,
      qrcode: qrDataUrl,
      pairingCode: pairingCode || undefined,
      state,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error fetching QR code from Evolution API' };
  }
}

/**
 * Normalizes destination number for outgoing text dispatch in Evolution API v2.
 * Extracts clean digits from JID or raw number (e.g. "5492604014372@s.whatsapp.net" -> "5492604014372").
 */
export function formatRecipientForSending(rawJidOrNumber: string): string {
  const clean = (rawJidOrNumber || '').replace('@s.whatsapp.net', '').replace(/\D/g, '');
  return clean;
}

/**
 * Dispatches WhatsApp text message via Evolution API v2
 */
export async function sendEvolutionTextMessage(
  instanceName: string,
  number: string,
  text: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  const { baseUrl, apiKey } = getEvolutionConfig();
  if (!baseUrl) {
    return { success: false, error: 'EVOLUTION_API_URL no configurado' };
  }

  const cleanRecipient = formatRecipientForSending(number);
  if (!cleanRecipient) {
    return { success: false, error: 'Destino no válido' };
  }

  const sendPayload = {
    number: cleanRecipient,
    text,
    delay: 1200,
    linkPreview: false,
  };

  console.log(`📌 Evolution sendText Request for "${instanceName}" to "${cleanRecipient}"...`);

  try {
    const res = await fetch(`${baseUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { apikey: apiKey } : {}),
      },
      body: JSON.stringify(sendPayload),
    });

    const data = await res.json().catch(() => ({}));
    console.log(`📌 Evolution sendText Response Status:`, res.status, JSON.stringify(data));

    if (res.ok || res.status === 200 || res.status === 201) {
      return { success: true, data };
    }

    // If Argentina number with 549... fails, retry sending without 9 (54 + area + number) for Baileys routing
    if (cleanRecipient.startsWith('549') && cleanRecipient.length >= 12) {
      const altRecipient = '54' + cleanRecipient.slice(3);
      console.log(`⏱️ Retrying Argentina sendText with alternative number format: "${altRecipient}"...`);
      const resAlt = await fetch(`${baseUrl}/message/sendText/${instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { apikey: apiKey } : {}),
        },
        body: JSON.stringify({
          ...sendPayload,
          number: altRecipient,
        }),
      });

      const dataAlt = await resAlt.json().catch(() => ({}));
      console.log(`📌 Evolution sendText Alt Response Status:`, resAlt.status, JSON.stringify(dataAlt));
      if (resAlt.ok || resAlt.status === 200 || resAlt.status === 201) {
        return { success: true, data: dataAlt };
      }
    }

    return { success: false, error: data?.message || data?.error || `HTTP ${res.status}`, data };
  } catch (err: any) {
    console.error(`❌ Exception in sendEvolutionTextMessage:`, err);
    return { success: false, error: err?.message || 'Error enviando mensaje por Evolution API' };
  }
}

export async function getEvolutionInstanceStatus(instanceName: string): Promise<{ state: 'open' | 'connecting' | 'close' | 'disconnected'; number?: string }> {
  const { baseUrl, apiKey } = getEvolutionConfig();
  if (!baseUrl) {
    return { state: 'disconnected' };
  }

  try {
    const res = await fetch(`${baseUrl}/instance/connectionState/${instanceName}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { apikey: apiKey } : {}),
      },
    });

    const data = await res.json().catch(() => ({}));
    const state = data.instance?.state || data.state || 'disconnected';
    const number = data.instance?.owner || data.owner || undefined;
    return { state: state === 'open' ? 'open' : state === 'connecting' ? 'connecting' : 'disconnected', number };
  } catch {
    return { state: 'disconnected' };
  }
}

/**
 * Normalizes phone numbers, ensuring correct international format (e.g. 54911... for Argentina)
 */
export function normalizePhoneNumber(phone: string): string {
  let clean = phone.replace(/\D/g, '');
  if (clean.startsWith('54') && !clean.startsWith('549') && clean.length >= 10) {
    clean = '549' + clean.slice(2);
  }
  return clean;
}

/**
 * Requests an 8-digit Pairing Code for phone linking from Evolution API with 3 retries and logging.
 */
export async function getEvolutionPairingCode(
  instanceName: string,
  phoneNumber: string
): Promise<{ success: boolean; pairingCode?: string; error?: string }> {
  const { baseUrl, apiKey } = getEvolutionConfig();
  if (!baseUrl) {
    return { success: false, error: 'EVOLUTION_API_URL no configurado' };
  }

  const cleanNumber = normalizePhoneNumber(phoneNumber);
  if (!cleanNumber) {
    return { success: false, error: 'Número de teléfono no válido' };
  }

  console.log(`📌 Requesting Evolution API pairing code for instance "${instanceName}" and phone +${cleanNumber}...`);

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${baseUrl}/instance/connect/${instanceName}?number=${cleanNumber}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { apikey: apiKey } : {}),
        },
      });

      const data = await res.json().catch(() => ({}));
      console.log(`📌 [Attempt ${attempt}/3] Evolution API connect response for +${cleanNumber}:`, JSON.stringify(data));

      const rawCandidate: string | null =
        data.pairingCode ||
        data.pairing_code ||
        data.code ||
        data.instance?.pairingCode ||
        null;

      if (rawCandidate && typeof rawCandidate === 'string') {
        const trimmed = rawCandidate.trim();
        // Ensure string is a short pairing code without @ or 2@
        if (!trimmed.startsWith('2@') && !trimmed.includes('@') && trimmed.length <= 16) {
          console.log(`✅ [Attempt ${attempt}/3] Evolution API pairing code received: "${trimmed}"`);
          return { success: true, pairingCode: trimmed };
        }
      }
    } catch (err) {
      console.warn(`⚠️ [Attempt ${attempt}/3] Exception fetching pairing code:`, err);
    }

    if (attempt < 3) {
      console.log(`⏱️ Pairing code not ready on attempt ${attempt}. Waiting 1.5s before retry...`);
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  return {
    success: false,
    error: 'No se pudo generar el código de vinculación de 8 dígitos en Evolution API. Verifica el número de teléfono.',
  };
}

/**
 * Logouts and cleans up instance in Evolution API
 */
export async function logoutEvolutionInstance(instanceName: string): Promise<{ success: boolean }> {
  const { baseUrl, apiKey } = getEvolutionConfig();
  if (!baseUrl) {
    return { success: false };
  }

  try {
    await fetch(`${baseUrl}/instance/logout/${instanceName}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { apikey: apiKey } : {}),
      },
    }).catch(() => {});

    await fetch(`${baseUrl}/instance/delete/${instanceName}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { apikey: apiKey } : {}),
      },
    }).catch(() => {});

    return { success: true };
  } catch {
    return { success: false };
  }
}

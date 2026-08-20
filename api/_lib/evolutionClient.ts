/**
 * Evolution API Helper Client for WhatsApp Baileys Integration
 * Handles QR instance creation, webhook configuration, QR code fetching, and text message dispatch.
 */

export interface EvolutionConfig {
  baseUrl: string;
  apiKey: string;
}

export function getEvolutionConfig(): EvolutionConfig {
  const baseUrl = (
    process.env.EVOLUTION_API_URL ||
    process.env.VITE_EVOLUTION_API_URL ||
    'https://evolution-api.up.railway.app'
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
export async function createEvolutionInstance(instanceName: string, token: string): Promise<{ success: boolean; data?: any; error?: string }> {
  const { baseUrl, apiKey } = getEvolutionConfig();
  if (!baseUrl) {
    return { success: false, error: 'EVOLUTION_API_URL not configured' };
  }

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
        qrcode: true,
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
 * Sets up instance webhooks for MESSAGES_UPSERT and CONNECTION_UPDATE
 */
export async function setEvolutionWebhook(instanceName: string, webhookUrl: string): Promise<{ success: boolean; data?: any; error?: string }> {
  const { baseUrl, apiKey } = getEvolutionConfig();
  if (!baseUrl) {
    return { success: false, error: 'EVOLUTION_API_URL not configured' };
  }

  try {
    const res = await fetch(`${baseUrl}/webhook/set/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { apikey: apiKey } : {}),
      },
      body: JSON.stringify({
        url: webhookUrl,
        enabled: true,
        webhook_by_events: true,
        events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE'],
      }),
    });

    const data = await res.json().catch(() => ({}));
    return { success: res.ok, data };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error setting Evolution webhook' };
  }
}

/**
 * Connects to instance and retrieves current QR Code (Base64) or pairing code
 */
export async function getEvolutionConnectQr(instanceName: string): Promise<{ success: boolean; qrcode?: string; pairingCode?: string; state?: string; error?: string }> {
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
    const qrcode = data.base64 || data.qrcode?.base64 || data.code || null;
    const pairingCode = data.pairingCode || data.pairing_code || null;
    const state = data.instance?.state || data.state || 'connecting';

    return {
      success: res.ok || Boolean(qrcode || pairingCode),
      qrcode: qrcode || undefined,
      pairingCode: pairingCode || undefined,
      state,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error fetching QR code from Evolution API' };
  }
}

/**
 * Dispatches WhatsApp text message via Evolution API
 */
export async function sendEvolutionTextMessage(instanceName: string, number: string, text: string): Promise<{ success: boolean; data?: any; error?: string }> {
  const { baseUrl, apiKey } = getEvolutionConfig();
  if (!baseUrl) {
    return { success: false, error: 'EVOLUTION_API_URL not configured' };
  }

  const cleanNumber = number.replace(/\D/g, '');
  if (!cleanNumber) {
    return { success: false, error: 'Invalid destination phone number' };
  }

  try {
    const res = await fetch(`${baseUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { apikey: apiKey } : {}),
      },
      body: JSON.stringify({
        number: cleanNumber,
        text,
      }),
    });

    const data = await res.json().catch(() => ({}));
    return { success: res.ok, data };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error sending Evolution text message' };
  }
}

/**
 * Checks current connection state of Evolution API instance
 */
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

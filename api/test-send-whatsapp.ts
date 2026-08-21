import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const phone = (req.query.phone as string) || '5492604014372';
  const text = (req.query.text as string) || '🚀 Prueba de conexión directa desde Aria Prop!';
  const instance = (req.query.instance as string) || 'inmo_13d92ac1_1b4a_4d3f_8418_abff914b0500';

  const cleanPhone = phone.replace('@s.whatsapp.net', '').replace(/\D/g, '').trim();
  const baseUrl = process.env.EVOLUTION_API_URL || 'https://evolution-api-production-2f52.up.railway.app';
  const apiKey = process.env.EVOLUTION_API_KEY || '';
  const url = `${baseUrl}/message/sendText/${instance}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { apikey: apiKey } : {}),
      },
      body: JSON.stringify({
        number: cleanPhone,
        text: text,
      }),
    });

    const data = await response.json().catch(() => ({}));
    return res.status(200).json({
      success: response.ok || response.status === 200 || response.status === 201,
      httpStatus: response.status,
      targetPhone: cleanPhone,
      instanceUsed: instance,
      evolutionResponse: data,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Error invocando Evolution API',
    });
  }
}

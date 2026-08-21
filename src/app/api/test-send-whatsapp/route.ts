export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get('phone') || '5492604014372';
  const text = searchParams.get('text') || '🚀 Prueba de conexión directa desde Aria Prop!';
  const instance = searchParams.get('instance') || 'inmo_13d92ac1_1b4a_4d3f_8418_abff914b0500';

  const cleanPhone = phone.replace('@s.whatsapp.net', '').replace(/\D/g, '').trim();
  const baseUrl = process.env.EVOLUTION_API_URL || 'https://evolution-api-production-2f52.up.railway.app';
  const apiKey = process.env.EVOLUTION_API_KEY || '';
  const url = `${baseUrl}/message/sendText/${instance}`;

  try {
    const res = await fetch(url, {
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

    const data = await res.json().catch(() => ({}));
    return Response.json({
      success: res.ok || res.status === 200 || res.status === 201,
      httpStatus: res.status,
      targetPhone: cleanPhone,
      instanceUsed: instance,
      evolutionResponse: data,
    });
  } catch (err: any) {
    return Response.json(
      {
        success: false,
        error: err.message || 'Error invocando Evolution API',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}

import OpenAI from 'openai';

/**
 * Downloads WhatsApp voice message audio from Meta Cloud API
 * and transcribes it into text using OpenRouter / Gemini Multimodal API.
 */
export async function processIncomingVoiceMessage(
  mediaId: string,
  accessToken: string
): Promise<string> {
  if (!mediaId || !accessToken) {
    console.warn('⚠️ processIncomingVoiceMessage missing mediaId or accessToken');
    return 'Nota de voz recibida (sin transcripción disponibles).';
  }

  try {
    // Step 1: Query Meta Graph API for media URL
    const metaUrlRes = await fetch(`https://graph.facebook.com/v20.0/${mediaId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!metaUrlRes.ok) {
      console.warn(`⚠️ Meta Media Graph API error [${metaUrlRes.status}]`);
      return 'Nota de voz recibida.';
    }

    const metaUrlData: any = await metaUrlRes.json();
    const downloadUrl = metaUrlData?.url;

    if (!downloadUrl) {
      console.warn('⚠️ Meta Media API returned no download URL');
      return 'Nota de voz recibida.';
    }

    // Step 2: Download binary audio stream
    const audioRes = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!audioRes.ok) {
      console.warn(`⚠️ Download Meta audio stream error [${audioRes.status}]`);
      return 'Nota de voz recibida.';
    }

    const arrayBuffer = await audioRes.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = metaUrlData?.mime_type || 'audio/ogg';

    // Step 3: Transcribe audio using OpenRouter Multimodal Gemini 2.5 Flash
    const openrouterKey = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY || '';

    if (openrouterKey && base64Audio) {
      try {
        const openai = new OpenAI({
          baseURL: 'https://openrouter.ai/api/v1',
          apiKey: openrouterKey,
          defaultHeaders: {
            'HTTP-Referer': 'https://ariaprop.online',
            'X-Title': 'Ariaprop Real Estate Voice Processor',
          },
        });

        const model = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash';

        const completion = await openai.chat.completions.create({
          model,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Transcripción directa y exacta del audio enviado por el cliente en WhatsApp. Devuelve ÚNICAMENTE el texto transcripto en español sin comentarios adicionales ni markdown:',
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType};base64,${base64Audio}`,
                  },
                },
              ],
            },
          ],
          temperature: 0.1,
          max_tokens: 500,
        });

        const transcribed = completion.choices?.[0]?.message?.content?.trim();
        if (transcribed) {
          console.log(`🎙️ Voice Message Transcribed (${mediaId}): "${transcribed}"`);
          return transcribed;
        }
      } catch (transcribeErr) {
        console.warn('⚠️ Voice transcription OpenRouter fallback warning:', transcribeErr);
      }
    }

    return 'Cliente envió una nota de voz consultando por inmuebles.';
  } catch (err: any) {
    console.error('❌ Exception in processIncomingVoiceMessage:', err);
    return 'Nota de voz recibida.';
  }
}

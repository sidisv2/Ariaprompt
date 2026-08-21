import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

export interface ProcessedAudioResult {
  transcription: string;
  mediaUrl?: string;
  mediaType: 'audio' | 'voice';
  mimeType?: string;
}

function getBackendSupabaseClient() {
  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const supabaseKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    ''
  ).trim();

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
    return null;
  }
  try {
    return createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch {
    return null;
  }
}

/**
 * Downloads WhatsApp voice message audio from Meta Cloud API,
 * stores it in Supabase Storage (`whatsapp-media` bucket),
 * and transcribes it into text using Groq Whisper / OpenAI Whisper / Gemini Multimodal.
 */
export async function processIncomingVoiceMessage(
  mediaId: string,
  accessToken: string,
  organizationId?: string
): Promise<ProcessedAudioResult> {
  const fallbackResult: ProcessedAudioResult = {
    transcription: 'Nota de voz recibida.',
    mediaType: 'audio',
  };

  if (!mediaId || !accessToken) {
    console.warn('⚠️ processIncomingVoiceMessage missing mediaId or accessToken');
    return fallbackResult;
  }

  try {
    // Step 1: Query Meta Graph API for media download URL
    const metaUrlRes = await fetch(`https://graph.facebook.com/v20.0/${mediaId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!metaUrlRes.ok) {
      console.warn(`⚠️ Meta Media Graph API error [${metaUrlRes.status}]`);
      return fallbackResult;
    }

    const metaUrlData: any = await metaUrlRes.json();
    const downloadUrl = metaUrlData?.url;
    const mimeType = metaUrlData?.mime_type || 'audio/ogg';

    if (!downloadUrl) {
      console.warn('⚠️ Meta Media API returned no download URL');
      return fallbackResult;
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
      return fallbackResult;
    }

    const arrayBuffer = await audioRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Audio = buffer.toString('base64');

    // Step 3: Upload audio buffer to Supabase Storage (`whatsapp-media` bucket)
    let mediaUrl: string | undefined = undefined;
    const supabase = getBackendSupabaseClient();

    if (supabase) {
      try {
        const fileExt = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('mp3') ? 'mp3' : 'ogg';
        const fileName = `${organizationId || 'general'}/${Date.now()}-${mediaId}.${fileExt}`;

        // Ensure bucket exists or upload directly
        const { error: uploadError } = await supabase.storage
          .from('whatsapp-media')
          .upload(fileName, buffer, {
            contentType: mimeType,
            upsert: true,
          });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('whatsapp-media')
            .getPublicUrl(fileName);

          if (publicUrlData?.publicUrl) {
            mediaUrl = publicUrlData.publicUrl;
            console.log(`✅ Audio uploaded to Supabase Storage: ${mediaUrl}`);
          }
        } else {
          console.warn('⚠️ Audio upload to Supabase Storage warning:', uploadError.message);
        }
      } catch (storageEx) {
        console.warn('⚠️ Audio storage exception:', storageEx);
      }
    }

    // Step 4: Transcribe Audio using Whisper (Groq / OpenAI) or Gemini Multimodal
    let transcribedText = '';

    // Strategy A: Groq Whisper API (whisper-large-v3)
    const groqKey = process.env.GROQ_API_KEY || '';
    if (groqKey && !transcribedText) {
      try {
        const formData = new FormData();
        const blob = new Blob([buffer], { type: mimeType });
        formData.append('file', blob, `audio.${mimeType.includes('mp3') ? 'mp3' : 'ogg'}`);
        formData.append('model', 'whisper-large-v3');
        formData.append('language', 'es');
        formData.append('response_format', 'json');

        const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${groqKey}`,
          },
          body: formData,
        });

        if (groqRes.ok) {
          const groqData: any = await groqRes.json();
          if (groqData?.text) {
            transcribedText = groqData.text.trim();
            console.log(`🎙️ Groq Whisper-large-v3 Transcription: "${transcribedText}"`);
          }
        }
      } catch (groqErr) {
        console.warn('⚠️ Groq Whisper transcription notice:', groqErr);
      }
    }

    // Strategy B: OpenAI Whisper API (whisper-1)
    const openaiKey = process.env.OPENAI_API_KEY || '';
    if (openaiKey && !transcribedText) {
      try {
        const formData = new FormData();
        const blob = new Blob([buffer], { type: mimeType });
        formData.append('file', blob, `audio.ogg`);
        formData.append('model', 'whisper-1');
        formData.append('language', 'es');

        const oaiRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openaiKey}`,
          },
          body: formData,
        });

        if (oaiRes.ok) {
          const oaiData: any = await oaiRes.json();
          if (oaiData?.text) {
            transcribedText = oaiData.text.trim();
            console.log(`🎙️ OpenAI Whisper-1 Transcription: "${transcribedText}"`);
          }
        }
      } catch (oaiErr) {
        console.warn('⚠️ OpenAI Whisper transcription notice:', oaiErr);
      }
    }

    // Strategy C: OpenRouter Multimodal Gemini 2.5 Flash
    const openrouterKey = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY || '';
    if (openrouterKey && !transcribedText && base64Audio) {
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
                  text: 'Transcripción directa y exacta del audio de WhatsApp. Devuelve ÚNICAMENTE el texto en español sin comentarios adicionales ni markdown:',
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

        const resText = completion.choices?.[0]?.message?.content?.trim();
        if (resText) {
          transcribedText = resText;
          console.log(`🎙️ OpenRouter Multimodal Audio Transcription: "${transcribedText}"`);
        }
      } catch (openrouterErr) {
        console.warn('⚠️ OpenRouter Multimodal voice transcription notice:', openrouterErr);
      }
    }

    const finalTranscription = transcribedText || 'Nota de voz recibida (audio procesado).';

    return {
      transcription: finalTranscription,
      mediaUrl,
      mediaType: 'audio',
      mimeType,
    };
  } catch (err: any) {
    console.error('❌ Exception in processIncomingVoiceMessage:', err);
    return fallbackResult;
  }
}

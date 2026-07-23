// src/pages/api/chat.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = process.env.GEMINI_API_URL;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-lite';

const SYSTEM_PROMPTS: Record<string, string> = {
  general: `Eres Aria Prop, un asistente inmobiliario en español que ayuda a agendar visitas, describir inmuebles y cualificar leads. Responde con claridad y busca agendar cuando aplique.`,
  finance: `Eres un analista financiero inmobiliario: calcula ROI, cashflow, periodos de recuperación y provee recomendaciones de inversión.`,
  rag: `Eres un asistente que responde usando documentos técnicos aportados por el usuario. Cita la fuente y responde de forma precisa.`,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!GEMINI_API_KEY || !GEMINI_API_URL) return res.status(500).json({ error: 'AI key not configured' });

  try {
    const { message, history = [], context = 'general' } = req.body || {};
    const system = SYSTEM_PROMPTS[context] || SYSTEM_PROMPTS.general;

    // Gemini payload adapted to official REST-like structure
    const payload: any = {
      systemInstruction: { parts: [{ text: system }] },
      contents: [
        ...history.slice(-12).map((h: any) => ({
          role: h.sender === 'user' ? 'user' : 'model',
          parts: [{ text: h.content }],
        })),
        { role: 'user', parts: [{ text: message }] },
      ],
      generationConfig: { temperature: 0.2, maxOutputTokens: 800 },
      model: GEMINI_MODEL,
    };

    const r = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GEMINI_API_KEY}` },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const txt = await r.text().catch(() => `status ${r.status}`);
      return res.status(502).json({ error: `AI provider error: ${txt}` });
    }

    const json = await r.json();
    // Try common response shapes
    const text = json?.candidates?.[0]?.content || json?.output?.text || json?.choices?.[0]?.message?.content || JSON.stringify(json);
    return res.status(200).json({ text });
  } catch (err: any) {
    console.error('chat api error', err);
    return res.status(500).json({ error: 'Internal error contacting AI provider' });
  }
}

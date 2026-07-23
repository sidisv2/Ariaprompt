import { useState } from 'react';

export function useChat(options?: { initialContext?: 'general' | 'finance' | 'rag' }) {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'agent'; text: string }>>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async (message: string, context: string = options?.initialContext || 'general', history: any[] = []) => {
    setError(null);
    if (!message || !message.trim()) return null;

    // Format history for payload
    const formattedHistory = history.map((m) => ({
      sender: m.sender,
      content: m.text,
    }));

    // Optimistic UI: add user message and agent placeholder
    setMessages((prev) => [
      ...prev,
      { sender: 'user', text: message },
      { sender: 'agent', text: '' },
    ]);
    setIsTyping(true);

    try {
      const storedApiKey = localStorage.getItem('gemini_api_key') || undefined;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history: formattedHistory, context, apiKey: storedApiKey }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error((payload && payload.error) || `AI error ${res.status}`);
      }

      if (!res.body) {
        throw new Error('No se pudo abrir el canal de respuesta de la IA.');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.replace('data: ', ''));
              if (data.text) {
                fullText += data.text;
                setMessages((prev) => {
                  const copy = [...prev];
                  const lastIndex = copy.length - 1;
                  if (lastIndex >= 0 && copy[lastIndex].sender === 'agent') {
                    copy[lastIndex] = { ...copy[lastIndex], text: fullText };
                  }
                  return copy;
                });
              }
            } catch {
              // ignore partial parse errors
            }
          }
        }
      }

      if (!fullText.trim()) {
        fullText = 'Respuesta recibida de Aria AI.';
        setMessages((prev) => {
          const copy = [...prev];
          const lastIndex = copy.length - 1;
          if (lastIndex >= 0 && copy[lastIndex].sender === 'agent') {
            copy[lastIndex] = { ...copy[lastIndex], text: fullText };
          }
          return copy;
        });
      }

      return fullText;
    } catch (err: any) {
      const errMsg = err?.message || 'Error al contactar la IA';

      setMessages((prev) => {
        const copy = [...prev];
        const lastIndex = copy.length - 1;
        if (lastIndex >= 0 && copy[lastIndex].sender === 'agent') {
          copy[lastIndex] = {
            ...copy[lastIndex],
            text: `⚠️ **Error de Conexión IA**: ${errMsg}. Por favor vuelve a intentarlo.`,
          };
        }
        return copy;
      });

      setError(errMsg);
      return null;
    } finally {
      setIsTyping(false);
    }
  };

  return { messages, setMessages, isTyping, error, send };
}

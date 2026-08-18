import { useState } from 'react';
import { INITIAL_BOT_CONFIG } from '../data/mockData';
import { useLanguage } from '../context/LanguageContext';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'agent';
  content: string;
  text?: string;
  timestamp: string;
  recommendedPropertyId?: string;
}

export function useChat(options?: { initialContext?: string }) {
  const { lang } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'bot',
      content: INITIAL_BOT_CONFIG.welcomeMessage,
      text: INITIAL_BOT_CONFIG.welcomeMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = async (text: string, overrideContext?: string, _historyArg?: any) => {
    if (!text.trim()) return;
    const ctx = overrideContext || options?.initialContext || 'general';

    const userMessageId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMessageId,
      sender: 'user',
      content: text,
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    const botMessageId = `bot-${Date.now()}`;
    const placeholderBotMsg: ChatMessage = {
      id: botMessageId,
      sender: 'bot',
      content: '',
      text: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, placeholderBotMsg]);

    const historyPayload = messages
      .filter((m) => m.content && m.content !== INITIAL_BOT_CONFIG.welcomeMessage)
      .map((m) => ({ sender: m.sender === 'user' ? 'user' : 'bot', content: m.content || m.text || '' }));

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: historyPayload, context: ctx, lang }),
      });

      if (!response.ok) {
        let errDetails = `Error de servidor HTTP ${response.status}`;
        try {
          const errJson = await response.json();
          if (errJson.error || errJson.details) {
            errDetails = `${errJson.error || 'Error'}: ${errJson.details || ''}`;
          }
        } catch {}
        throw new Error(errDetails);
      }

      if (!response.body) {
        throw new Error('Servidor devolvió respuesta vacía.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulatedText = '';
      let buffer = '';
      let recommendedPropId: string | undefined = undefined;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;

        if (value) {
          buffer += decoder.decode(value, { stream: !done });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() || '';

          for (const part of parts) {
            const line = part.trim();
            if (line.startsWith('data: ')) {
              try {
                const jsonStr = line.replace('data: ', '').trim();
                if (jsonStr) {
                  const parsed = JSON.parse(jsonStr);
                  if (parsed.error) {
                    accumulatedText = `⚠️ **Error de la IA**: ${parsed.error}${parsed.details ? ` (${parsed.details})` : ''}. Por favor, reintente en unos momentos.`;
                    setMessages((prev) =>
                      prev.map((m) => (m.id === botMessageId ? { ...m, content: accumulatedText, text: accumulatedText } : m))
                    );
                    setIsTyping(false);
                    return;
                  }
                  if (parsed.text) {
                    accumulatedText += parsed.text;
                    setMessages((prev) =>
                      prev.map((m) => (m.id === botMessageId ? { ...m, content: accumulatedText, text: accumulatedText } : m))
                    );
                  }
                  if (parsed.recommendedPropertyId) {
                    recommendedPropId = parsed.recommendedPropertyId;
                  }
                }
              } catch (e) {
                console.warn('SSE Chunk JSON Parse warning:', e);
              }
            }
          }
        }
      }

      // Handle remaining buffer text if any
      if (buffer.trim().startsWith('data: ')) {
        try {
          const jsonStr = buffer.trim().replace('data: ', '').trim();
          if (jsonStr) {
            const parsed = JSON.parse(jsonStr);
            if (parsed.error) {
              accumulatedText = `⚠️ **Error de la IA**: ${parsed.error}${parsed.details ? ` (${parsed.details})` : ''}. Por favor, reintente en unos momentos.`;
            } else if (parsed.text) {
              accumulatedText += parsed.text;
            }
          }
        } catch {}
      }

      if (!accumulatedText.trim()) {
        const fallbackErr = '⚠️ **Error de conexión con el motor de IA**: No se recibió respuesta. Por favor, reintente en unos momentos.';
        setMessages((prev) =>
          prev.map((m) => (m.id === botMessageId ? { ...m, content: fallbackErr, text: fallbackErr } : m))
        );
      } else if (recommendedPropId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === botMessageId ? { ...m, recommendedPropertyId: recommendedPropId } : m))
        );
      }
    } catch (err: any) {
      console.error('❌ Chat API Fetch error:', err);
      const errorMsg = `⚠️ **Error de conexión con el motor de IA**: ${err?.message || 'No fue posible comunicar con el servidor'}. Por favor, intente nuevamente.`;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMessageId
            ? {
                ...m,
                content: errorMsg,
                text: errorMsg,
              }
            : m
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  const clearMessages = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'bot',
        content: INITIAL_BOT_CONFIG.welcomeMessage,
        text: INITIAL_BOT_CONFIG.welcomeMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return {
    messages,
    isTyping,
    sendMessage,
    send: sendMessage,
    clearMessages,
    resetMessages: clearMessages,
  };
}

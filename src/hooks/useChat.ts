import { useState } from 'react';
import { INITIAL_BOT_CONFIG } from '../data/mockData';
import { useLanguage } from '../context/LanguageContext';
import { generateStructuredAriaRealEstateResponse } from '../../api/_lib/openrouterService';

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

    const historyPayload: { sender: 'user' | 'assistant'; content: string }[] = messages
      .filter((m) => m.content && m.content !== INITIAL_BOT_CONFIG.welcomeMessage)
      .map((m) => ({ sender: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant', content: m.content || m.text || '' }));

    try {
      let replyText = '';
      let recommendedPropId: string | undefined = undefined;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
        },
        body: JSON.stringify({ message: text, history: historyPayload, context: ctx, lang }),
      });

      const contentType = response.headers.get('content-type') || '';

      if (response.ok) {
        if (contentType.includes('application/json')) {
          const data = await response.json();
          if (data.replyText || data.response || data.text) {
            replyText = data.replyText || data.response || data.text;
          }
          if (data.matchedProperties && data.matchedProperties.length > 0) {
            recommendedPropId = data.matchedProperties[0].id;
          }
        } else if (response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let done = false;
          let buffer = '';

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
                      if (parsed.text) {
                        replyText += parsed.text;
                        setMessages((prev) =>
                          prev.map((m) =>
                            m.id === botMessageId
                              ? { ...m, content: replyText, text: replyText }
                              : m
                          )
                        );
                      }
                      if (parsed.recommendedPropertyId) {
                        recommendedPropId = parsed.recommendedPropertyId;
                      }
                    }
                  } catch (e) {
                    console.warn('SSE Chunk parse warning:', e);
                  }
                }
              }
            }
          }
        }
      } else {
        console.warn(`HTTP ${response.status} from /api/chat, triggering client fallback engine...`);
      }

      // If server response didn't produce text, use client-side OpenRouter / Gemini Real Estate Engine fallback
      if (!replyText.trim()) {
        const clientRes = await generateStructuredAriaRealEstateResponse({
          message: text,
          history: historyPayload,
          agentName: 'Aria',
          agencyName: 'Aria Prop',
        });
        replyText = clientRes.replyText;
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMessageId
            ? {
                ...m,
                content: replyText,
                text: replyText,
                recommendedPropertyId: recommendedPropId || m.recommendedPropertyId,
              }
            : m
        )
      );
    } catch (err: any) {
      console.warn('⚠️ Server /api/chat error, executing client real estate fallback:', err);
      try {
        const clientRes = await generateStructuredAriaRealEstateResponse({
          message: text,
          history: historyPayload,
          agentName: 'Aria',
          agencyName: 'Aria Prop',
        });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMessageId
              ? { ...m, content: clientRes.replyText, text: clientRes.replyText }
              : m
          )
        );
      } catch (fallbackErr) {
        const defaultReply =
          '¡Hola! Soy Aria, tu asesora virtual inmobiliaria. Puedo ayudarte a buscar propiedades en venta o alquiler, cualificar tu presupuesto o agendar una visita. ¿Qué tipo de propiedad estás buscando?';
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMessageId ? { ...m, content: defaultReply, text: defaultReply } : m
          )
        );
      }
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

import { useState } from 'react';
import { INITIAL_BOT_CONFIG } from '../data/mockData';
import {
  searchMultiSourceRealEstate,
  SearchEngineResult,
} from '../lib/multiSourceRealEstateEngine';

function generateClientFallbackText(message: string, context: string): string {
  const trimmed = message.trim();
  const lowerMsg = trimmed.toLowerCase();

  if (
    lowerMsg === 'hola' ||
    lowerMsg === 'hola!' ||
    lowerMsg === 'buenas' ||
    lowerMsg === 'buenos dias' ||
    lowerMsg === 'hello' ||
    lowerMsg === 'hi'
  ) {
    return (
      `¡Hola! Soy Aria Promp, tu comparador inmobiliario neutral para toda América.\n\n` +
      `Analizo en tiempo real publicaciones de múltiples fuentes (MercadoLibre, Properati, Zonaprop) para ayudarte a encontrar la mejor opción.\n\n` +
      `Para empezar, ¿buscas comprar o alquilar, y en qué ciudad o zona estás interesado?`
    );
  }

  const searchResult: SearchEngineResult = searchMultiSourceRealEstate(trimmed);

  if (searchResult.unmatchedLocationName) {
    return (
      `Revisé en mis fuentes integradas y actualmente no tengo publicaciones verificadas activas en **${searchResult.unmatchedLocationName}**.\n\n` +
      `Cuento con opciones disponibles en **Mendoza**, **Buenos Aires**, **Ciudad de México**, **Medellín** y **Lima**.\n\n` +
      `¿Te gustaría explorar alguna de estas ciudades o prefieres que un asesor busque algo puntual en ${searchResult.unmatchedLocationName}?`
    );
  }

  if (searchResult.exactMatches.length > 0) {
    const items = searchResult.exactMatches.slice(0, 2);
    return (
      `Analizando mis fuentes, te recomiendo estas opciones principales:\n\n` +
      items
        .map((p, idx) => (
          `**Opción ${idx + 1}**: ${p.title}\n` +
          `• **Precio**: $${p.price.toLocaleString('en-US')} USD | ${p.features.bedrooms} hab (${p.features.areaM2} m²)\n` +
          `• **Ubicación**: ${p.location.zone}, ${p.location.city}\n` +
          `• **Punto fuerte**: Excelente relación m²/precio\n` +
          `• **Fuente**: ${p.source?.name} - [Ver publicación original](${p.source?.url})\n`
        ))
        .join('\n') +
      `\n¿Te interesa agendar una visita o coordinar contacto directo con la inmobiliaria de alguna de ellas?`
    );
  }

  if (searchResult.closestMatches.length > 0) {
    const items = searchResult.closestMatches.slice(0, 2);
    return (
      `Analizando las opciones más cercanas en mi catálogo:\n\n` +
      items
        .map((p, idx) => (
          `**Opción ${idx + 1}**: ${p.title}\n` +
          `• **Precio**: $${p.price.toLocaleString('en-US')} USD\n` +
          `• **Ubicación**: ${p.location.zone}, ${p.location.city}\n` +
          `• **Fuente**: ${p.source?.name} - [Ver publicación original](${p.source?.url})\n`
        ))
        .join('\n')
    );
  }

  return (
    `¡Hola! Soy Aria Promp, tu comparador inmobiliario neutral.\n\n` +
    `¿Podrías decirme qué tipo de propiedad buscas (depto, casa), la ciudad y tu presupuesto aproximado?`
  );
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'agent';
  content: string;
  text?: string;
  timestamp: string;
  recommendedPropertyId?: string;
}

export function useChat(options?: { initialContext?: string }) {
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

    try {
      const history = messages
        .filter((m) => m.content && m.content !== INITIAL_BOT_CONFIG.welcomeMessage)
        .map((m) => ({ sender: m.sender === 'user' ? 'user' : 'bot', content: m.content || m.text || '' }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history, context: ctx }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`API response error status ${response.status}`);
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
            if (parsed.text) {
              accumulatedText += parsed.text;
            }
          }
        } catch {}
      }

      // If text stream ended up empty, apply fallback message so bubble is NEVER empty
      if (!accumulatedText.trim()) {
        const fallbackText = generateClientFallbackText(text, ctx);
        const searchResult = searchMultiSourceRealEstate(text);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMessageId
              ? {
                  ...m,
                  content: fallbackText,
                  text: fallbackText,
                  recommendedPropertyId: searchResult.exactMatches.length > 0 ? searchResult.exactMatches[0].id : undefined,
                }
              : m
          )
        );
      } else if (recommendedPropId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === botMessageId ? { ...m, recommendedPropertyId: recommendedPropId } : m))
        );
      }
    } catch (err) {
      console.warn('Streaming fetch failed, applying client-side fallback:', err);

      const fallbackText = generateClientFallbackText(text, ctx);
      const searchResult = searchMultiSourceRealEstate(text);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMessageId
            ? {
                ...m,
                content: fallbackText,
                text: fallbackText,
                recommendedPropertyId: searchResult.exactMatches.length > 0 ? searchResult.exactMatches[0].id : undefined,
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

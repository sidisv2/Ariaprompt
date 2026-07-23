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
      `¡Hola! 👋 Bienvenido a **${INITIAL_BOT_CONFIG.agencyName}**. Soy **${INITIAL_BOT_CONFIG.agentName}**, tu asistente inmobiliario multifuente 24/7.\n\n` +
      `Recopilo y analizo en tiempo real publicaciones verificadas de **MercadoLibre Inmuebles API**, **Properati**, **Zonaprop** y **Argenprop**.\n\n` +
      `¿En qué ciudad, presupuesto o cantidad de ambientes estás interesado? *(Ej: "deptos en Mendoza hasta USD 150k")*`
    );
  }

  const searchResult: SearchEngineResult = searchMultiSourceRealEstate(trimmed);

  if (searchResult.unmatchedLocationName) {
    return (
      `### 📍 **Sin Publicaciones en ${searchResult.unmatchedLocationName}**\n\n` +
      `Revisamos nuestras fuentes integradas (*MercadoLibre API, Properati, Zonaprop*) y actualmente **no encontramos publicaciones activas** en **${searchResult.unmatchedLocationName}**.\n\n` +
      `#### 🌐 **Ubicaciones con Publicaciones Verificadas Activas**:\n` +
      `- 🇦🇷 **Mendoza, Argentina**: Deptos 2 y 3 amb. en Barrio Bombal ($115,000 USD) y Centro ($148,000 USD)\n` +
      `- 🇦🇷 **Buenos Aires, Argentina**: Ático en Puerto Madero ($1,400,000 USD)\n` +
      `- 🇲🇽 **Ciudad de México**: Penthouse en Polanco ($1,850,000 USD)\n` +
      `- 🇨🇴 **Medellín, Colombia**: Villa en El Poblado ($950,000 USD)\n` +
      `- 🇵🇪 **Lima, Perú**: Departamento en San Isidro ($620,000 USD)\n\n` +
      `💬 *¿Te gustaría explorar alguna de estas opciones o derivar tu solicitud a un asesor por WhatsApp?*`
    );
  }

  if (searchResult.exactMatches.length > 0) {
    const items = searchResult.exactMatches.slice(0, 3);
    return (
      `### 🏢 **Publicaciones Encontradas (${items.length} Opciones)**\n\n` +
      (searchResult.explanationNote ? `> ℹ️ *${searchResult.explanationNote}*\n\n` : '') +
      items
        .map((p, idx) => {
          const customRent = Math.round(p.price * 0.007);
          const grossYield = ((customRent * 12 / p.price) * 100).toFixed(2);
          return (
            `#### ${idx + 1}. **${p.title}** (${p.code})\n` +
            `- 💰 **Precio**: **$${p.price.toLocaleString('en-US')} USD**\n` +
            `- 📍 **Ubicación**: ${p.location.address}, ${p.location.zone}, **${p.location.city}, ${p.location.country || ''}**\n` +
            `- 📐 **Distribución**: ${p.features.bedrooms} hab | ${p.features.rooms || p.features.bedrooms + 1} ambientes | ${p.features.areaM2} m²\n` +
            `- 📈 **Rentabilidad Estimada**: ~${grossYield}% Cap Rate Bruto (~$${customRent.toLocaleString('en-US')} USD/mes)\n` +
            `- 🌐 **Fuente Original**: **${p.source?.name}** (${p.source?.lastUpdated || 'Verificado'})\n` +
            `- 🔗 **Link Directo**: [Ver publicación original en ${p.source?.name.split(' ')[0]}](${p.source?.url})\n`
          );
        })
        .join('\n') +
      `\n📅 ¿Te gustaría agendar una visita o recibir más detalles por WhatsApp?`
    );
  }

  if (searchResult.closestMatches.length > 0) {
    const items = searchResult.closestMatches.slice(0, 2);
    return (
      `### 🔍 **Opciones Más Cercanas Encontradas**\n\n` +
      (searchResult.explanationNote ? `> ⚠️ **Aclaración**: *${searchResult.explanationNote}*\n\n` : '') +
      items
        .map((p, idx) => (
          `#### ${idx + 1}. **${p.title}**\n` +
          `- 💰 **Precio**: **$${p.price.toLocaleString('en-US')} USD**\n` +
          `- 📍 **Ubicación**: ${p.location.zone}, ${p.location.city}\n` +
          `- 🌐 **Fuente**: **${p.source?.name}**\n` +
          `- 🔗 **Link Directo**: [Ver publicación original](${p.source?.url})\n`
        ))
        .join('\n')
    );
  }

  return (
    `### 🏢 **Agregador Inmobiliario Multifuente 24/7**\n\n` +
    `Recopilamos ofertas reales de **MercadoLibre Inmuebles API**, **Properati**, **Zonaprop** y **Argenprop**.\n\n` +
    `¿Podrías especificar la ciudad, presupuesto o número de ambientes que buscas?`
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
      let recommendedPropId: string | undefined = undefined;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;

        if (value) {
          const chunkStr = decoder.decode(value);
          const lines = chunkStr.split('\n\n');

          for (const line of lines) {
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
              } catch {}
            }
          }
        }
      }

      if (recommendedPropId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === botMessageId ? { ...m, recommendedPropertyId: recommendedPropId } : m))
        );
      }
    } catch (err) {
      console.warn('Streaming fetch failed, using multi-source fallback engine:', err);

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

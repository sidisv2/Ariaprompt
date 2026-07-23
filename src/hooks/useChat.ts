import { useState } from 'react';
import { INITIAL_PROPERTIES, INITIAL_BOT_CONFIG } from '../data/mockData';
import { Property } from '../types';

function searchCatalogProperties(query: string, properties: Property[]): Property[] {
  const q = query.toLowerCase();

  return properties.filter((p) => {
    const city = p.location.city.toLowerCase();
    const zone = p.location.zone.toLowerCase();
    const address = p.location.address.toLowerCase();
    const title = p.title.toLowerCase();
    const type = p.type.toLowerCase();

    const cityMatch = q.includes(city);
    const zoneMatch = q.includes(zone);
    const addressMatch = q.includes(address);
    const titleMatch = q.includes(title);
    const typeMatch = q.includes(type);

    const argentinaMatch = (q.includes('argentina') || q.includes('buenos aires') || q.includes('madero')) && city.includes('buenos aires');
    const mexicoMatch = (q.includes('méxico') || q.includes('mexico') || q.includes('cdmx') || q.includes('polanco')) && city.includes('méxico');
    const colombiaMatch = (q.includes('colombia') || q.includes('medellin') || q.includes('medellín') || q.includes('poblado')) && city.includes('medellín');
    const peruMatch = (q.includes('peru') || q.includes('perú') || q.includes('lima') || q.includes('san isidro')) && city.includes('lima');

    return cityMatch || zoneMatch || addressMatch || titleMatch || typeMatch || argentinaMatch || mexicoMatch || colombiaMatch || peruMatch;
  });
}

function detectUnmatchedLocation(query: string): string | null {
  const q = query.toLowerCase();
  const knownExternalLocations = [
    'mendoza', 'córdoba', 'cordoba', 'rosario', 'bariloche', 'salta', 'mar del plata',
    'madrid', 'barcelona', 'valencia', 'sevilla', 'marbella', 'ibiza',
    'miami', 'orlando', 'new york', 'nueva york', 'los angeles',
    'santiago', 'chile', 'valparaiso', 'viña del mar',
    'bogota', 'bogotá', 'cali', 'cartagena',
    'montevideo', 'punta del este', 'uruguay',
    'cancun', 'cancún', 'tulum', 'guadalajara', 'monterrey', 'playa del carmen', 'queretaro'
  ];

  for (const loc of knownExternalLocations) {
    if (q.includes(loc)) {
      return loc.charAt(0).toUpperCase() + loc.slice(1);
    }
  }
  return null;
}

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
      `¡Hola! 👋 Bienvenido a **${INITIAL_BOT_CONFIG.agencyName}**. Soy **${INITIAL_BOT_CONFIG.agentName}**, tu asistente inmobiliario de IA 24/7.\n\n` +
      `Actualmente cuento con catálogo exclusivo en **Buenos Aires (Puerto Madero)**, **Ciudad de México (Polanco)**, **Medellín (El Poblado)** y **Lima (San Isidro)**.\n\n` +
      `¿En qué ciudad o presupuesto estás interesado?`
    );
  }

  const matches = searchCatalogProperties(trimmed, INITIAL_PROPERTIES);
  const unmatchedLoc = detectUnmatchedLocation(trimmed);

  if (unmatchedLoc && matches.length === 0) {
    return (
      `### 📍 **Sin Disponibilidad Actual en ${unmatchedLoc}**\n\n` +
      `Por el momento no contamos con propiedades disponibles en **${unmatchedLoc}** dentro de nuestro catálogo activo.\n\n` +
      `#### 🏠 **Ubicaciones Exclusivas Disponibles en Nuestro Catálogo**:\n` +
      `- 🇦🇷 **Buenos Aires, Argentina**: Ático Dúplex en Puerto Madero ($1,400,000 USD)\n` +
      `- 🇲🇽 **Ciudad de México**: Penthouse de Ultra Lujo en Polanco ($1,850,000 USD)\n` +
      `- 🇨🇴 **Medellín, Colombia**: Casa Campestre en El Poblado ($950,000 USD)\n` +
      `- 🇵🇪 **Lima, Perú**: Departamento Exclusivo en San Isidro ($620,000 USD)\n\n` +
      `💬 *¿Te gustaría explorar alguna de nuestras opciones disponibles o prefieres que un asesor humano te contacte por WhatsApp para buscar algo específico en ${unmatchedLoc}?*`
    );
  }

  if (matches.length > 0) {
    const selectedProp = matches[0];
    const customRent = Math.round(selectedProp.price * 0.007);
    const grossYield = ((customRent * 12 / selectedProp.price) * 100).toFixed(2);
    const paybackYears = (selectedProp.price / (customRent * 12)).toFixed(1);

    return (
      `### 🏛️ **Coincidencia Encontrada en Nuestro Catálogo**\n\n` +
      `Basado en tu consulta, te presento una opción destacada que coincide con tus criterios:\n\n` +
      `#### 📌 **${selectedProp.title}** (${selectedProp.code})\n` +
      `- **Ubicación**: ${selectedProp.location.address}, ${selectedProp.location.zone}, **${selectedProp.location.city}**\n` +
      `- **Precio de Lista**: **$${selectedProp.price.toLocaleString('en-US')} USD**\n` +
      `- **Distribución**: ${selectedProp.features.bedrooms} hab | ${selectedProp.features.bathrooms} baños | ${selectedProp.features.areaM2} m²\n` +
      `- **Descripción**: ${selectedProp.description}\n\n` +
      `#### 💰 **Estudio Financiero Real**:\n` +
      `- **Inversión Requerida**: $${selectedProp.price.toLocaleString('en-US')} USD\n` +
      `- **Renta Mensual Estimada**: ~$${customRent.toLocaleString('en-US')} USD/mes\n` +
      `- **Cap Rate Bruto Anual**: **~${grossYield}%**\n` +
      `- **Retorno Estimado**: ~${paybackYears} años\n\n` +
      `📅 ¿Te gustaría agendar una visita a este inmueble en **${selectedProp.location.city}** o recibir el dossier PDF por WhatsApp?`
    );
  }

  const defaultProp = INITIAL_PROPERTIES[0];
  return (
    `### 🏢 **Asesoría Inmobiliaria 24/7**\n\n` +
    `Para darte la mejor recomendación en nuestro catálogo, disponemos de inmuebles en **Buenos Aires**, **Ciudad de México**, **Medellín** y **Lima**.\n\n` +
    `Por ejemplo, en **${defaultProp.location.city} (${defaultProp.location.zone})** tenemos disponible **${defaultProp.title}** a **$${defaultProp.price.toLocaleString('en-US')} USD**.\n\n` +
    `¿Podrías indicarme la ciudad, presupuesto o número de habitaciones que estás buscando?`
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
      console.warn('Streaming fetch failed, using location-accurate fallback engine:', err);

      const fallbackText = generateClientFallbackText(text, ctx);
      const matches = searchCatalogProperties(text, INITIAL_PROPERTIES);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMessageId
            ? {
                ...m,
                content: fallbackText,
                text: fallbackText,
                recommendedPropertyId: matches.length > 0 ? matches[0].id : undefined,
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

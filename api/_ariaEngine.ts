export const MARKET_CATALOG = [
  {
    id: 'mendoza-rent-01',
    title: 'Departamento 2 Ambientes Amoblado en Alquiler - Barrio Bombal',
    type: 'apartment',
    price: 450,
    address: 'Av. España 1450',
    zone: 'Barrio Bombal',
    city: 'Mendoza',
    country: 'Argentina',
    bedrooms: 1,
    areaM2: 52,
    description: 'Excelente departamento totalmente amoblado y equipado listo para ingresar. Edificio moderno con seguridad 24hs.',
  },
  {
    id: 'prop-101',
    title: 'Penthouse de Ultra Lujo con Terraza Privada y Vista a Campo de Golf',
    type: 'penthouse',
    price: 1250000,
    address: 'Campos Elíseos 400',
    zone: 'Polanco',
    city: 'Ciudad de México',
    country: 'México',
    bedrooms: 4,
    areaM2: 380,
    description: 'Residencia de lujo con acabados de mármol importado, domótica integral y piscina privada.',
  },
  {
    id: 'prop-102',
    title: 'Casa Residencial en Barrio Cerrado El Poblado',
    type: 'house',
    price: 680000,
    address: 'Calle 10 Sur 28',
    zone: 'El Poblado',
    city: 'Medellín',
    country: 'Colombia',
    bedrooms: 5,
    areaM2: 420,
    description: 'Moderna casa independiente rodeada de naturaleza con seguridad privada.',
  },
  {
    id: 'prop-103',
    title: 'Departamento Moderno 3 Ambientes en Puerto Madero',
    type: 'apartment',
    price: 390000,
    address: 'Juana Manso 1100',
    zone: 'Puerto Madero',
    city: 'Buenos Aires',
    country: 'Argentina',
    bedrooms: 2,
    areaM2: 95,
    description: 'Piso alto con vista panorámica al río y la reserva ecológica.',
  },
];

export function buildMemoryAwareResponse(
  message: string,
  history: { sender: string; content: string }[] = []
) {
  const trimmed = message.trim();
  const lowerMsg = trimmed.toLowerCase();

  const fullUserQuery = [
    ...history.filter((h) => h && h.sender === 'user').map((h) => h.content || (h as any).text || ''),
    trimmed,
  ].join(' ');
  const fullLowerQuery = fullUserQuery.toLowerCase();

  let lastProp: (typeof MARKET_CATALOG)[0] | undefined = undefined;

  for (let i = history.length - 1; i >= 0; i--) {
    const item = history[i];
    if (item && (item.sender === 'bot' || item.sender === 'model')) {
      const textContent = item.content || (item as any).text || '';
      const matched = MARKET_CATALOG.find(
        (p) => textContent.includes(p.title) || textContent.includes(p.address) || textContent.includes(p.id) || textContent.includes(p.zone)
      );
      if (matched) {
        lastProp = matched;
        break;
      }
    }
  }

  if (!lastProp) {
    lastProp = MARKET_CATALOG.find(
      (p) =>
        fullLowerQuery.includes(p.city.toLowerCase()) ||
        fullLowerQuery.includes(p.zone.toLowerCase())
    );
  }

  const hasHistory = history && history.length > 0;
  const isAskingArea = hasHistory && (lowerMsg.includes('metro') || lowerMsg.includes('m2') || lowerMsg.includes('superficie') || lowerMsg.includes('calle') || lowerMsg.includes('queda') || lowerMsg.includes('direccion') || lowerMsg.includes('dirección'));
  const isAskingPrice = hasHistory && (lowerMsg.includes('precio') || lowerMsg.includes('cuanto cuesta') || lowerMsg.includes('cuánto cuesta') || lowerMsg.includes('valor'));
  const isAskingBedrooms = hasHistory && (lowerMsg.includes('cuántos dormitorios') || lowerMsg.includes('cuantos dormitorios') || lowerMsg.includes('cuántos cuartos') || lowerMsg.includes('cuantos cuartos') || lowerMsg.includes('dijiste'));
  const isAskingZoneOptions = hasHistory && (lowerMsg.includes('zona') || lowerMsg.includes('opción') || lowerMsg.includes('opcion') || lowerMsg.includes('disponible'));

  if (lastProp && history.length > 0) {
    if (isAskingArea) {
      return {
        text: `La propiedad **${lastProp.title}** tiene **${lastProp.areaM2} m²** de superficie y está ubicada sobre la calle **${lastProp.address}** (${lastProp.zone}, ${lastProp.city}).\n\n¿Te gustaría coordinar una visita presencial?`,
        recommendedPropId: lastProp.id,
      };
    }
    if (isAskingPrice) {
      return {
        text: `El precio de **${lastProp.title}** es de **$${lastProp.price.toLocaleString('en-US')} USD** ${lastProp.price < 5000 ? '/mes' : ''}.\n\n¿Deseas conocer las condiciones de ingreso o agendar una visita?`,
        recommendedPropId: lastProp.id,
      };
    }
    if (isAskingBedrooms) {
      return {
        text: `Como mencionamos, **${lastProp.title}** cuenta con **${lastProp.bedrooms} dormitorio(s)** y un diseño con excelente distribución.\n\n¿Quieres que te envíe más fotos o los detalles completos?`,
        recommendedPropId: lastProp.id,
      };
    }
    if (isAskingZoneOptions) {
      const zoneProps = MARKET_CATALOG.filter((p) => p.city.toLowerCase() === lastProp?.city.toLowerCase() || p.zone.toLowerCase() === lastProp?.zone.toLowerCase());
      if (zoneProps.length > 0) {
        const propList = zoneProps.map((p) => `• **${p.title}** ($${p.price.toLocaleString('en-US')} USD) en ${p.address}`).join('\n');
        return {
          text: `En ${lastProp.city} (${lastProp.zone}) tenemos las siguientes opciones disponibles en nuestro catálogo verificado:\n\n${propList}\n\n¿Cuál de ellas te gustaría consultar en detalle?`,
          recommendedPropId: zoneProps[0].id,
        };
      }
    }
  }

  if (
    lowerMsg === 'hola' ||
    lowerMsg === 'hola!' ||
    lowerMsg === 'buenas' ||
    lowerMsg === 'buenos dias' ||
    lowerMsg === 'hello' ||
    lowerMsg === 'hi'
  ) {
    return {
      text: `¡Hola! Soy Aria, tu asistente inmobiliario 24/7. ¿Buscas comprar o alquilar alguna propiedad en particular hoy?`,
      recommendedPropId: undefined,
    };
  }

  const matches = MARKET_CATALOG.filter((p) => {
    const city = p.city.toLowerCase();
    const zone = p.zone.toLowerCase();
    const type = p.type.toLowerCase();
    const isAlquiler = fullLowerQuery.includes('alquiler') || fullLowerQuery.includes('rent');

    const matchesCityOrZone = fullLowerQuery.includes(city) || fullLowerQuery.includes(zone);
    const matchesType = fullLowerQuery.includes(type);

    if (isAlquiler && p.price >= 5000) return false;
    return matchesCityOrZone || matchesType;
  });

  if (matches.length > 0) {
    const topProp = matches[0];
    return {
      text: `¡Hola! Encontré esta excelente opción en nuestro catálogo verificado:\n\n🏡 **${topProp.title}** en ${topProp.zone}, ${topProp.city}\n• **Precio:** $${topProp.price.toLocaleString('en-US')} USD ${topProp.price < 5000 ? '/mes' : ''}\n• **Ambientes:** ${topProp.bedrooms} dormitorios (${topProp.areaM2} m²)\n• **Dirección:** ${topProp.address}\n\n¿Te gustaría agendar una visita presencial o recibir más detalles?`,
      recommendedPropId: topProp.id,
    };
  }

  return {
    text: `Hola. Recordando tu consulta sobre propiedades, actualmente estamos actualizando las opciones verificadas para esa zona en nuestro catálogo directo. ¿Te gustaría que te conecte con un asesor humano para enviarte las opciones disponibles?`,
    recommendedPropId: undefined,
  };
}

export async function generateAriaAiResponse({
  message,
  history = [],
  lang = 'es',
}: {
  message: string;
  history?: { sender: string; content: string }[];
  lang?: string;
}): Promise<string> {
  const trimmedMsg = message.trim();

  const catalogContext = MARKET_CATALOG.map(
    (p) =>
      `- [ID: ${p.id}] "${p.title}" (${p.type.toUpperCase()} - ${p.price < 5000 ? 'ALQUILER' : 'VENTA'}) en ${p.address}, ${p.zone}, ${p.city}, ${p.country}. Precio: $${p.price.toLocaleString('en-US')} USD ${p.price < 5000 ? '/mes' : ''}. ${p.bedrooms} hab, ${p.areaM2} m². FUENTE: Catálogo Directo de la Agencia. ${p.description}`
  ).join('\n');

  // 1. Primary LLM Provider: OpenRouter API (google/gemini-2.5-flash)
  const openRouterKey = (
    process.env.OPENROUTER_API_KEY ||
    process.env.VITE_OPENROUTER_API_KEY ||
    ''
  ).replace(/^["']|["']$/g, '').trim();

  if (openRouterKey) {
    try {
      const model = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash';
      const langNames: Record<string, string> = { es: 'Español', en: 'English', pt: 'Português' };
      const targetLangName = langNames[lang] || 'Español';

      const systemPrompt = `
Eres Aria Prop, la asesora virtual comercial 24/7 de una plataforma inmobiliaria de alta conversión que opera en toda América.

IDIOMA PREDETERMINADO DE RESPUESTA: ${targetLangName.toUpperCase()}.
Debes responder SIEMPRE en este idioma (${targetLangName}).

Tus objetivos:
1. Calificar activamente al cliente: identificar presupuesto, zona de interés, tipo de operación (alquiler/compra) y número de contacto.
2. Responder de forma directa, empática y en un MÁXIMO DE 3 PÁRRAFOS (2-4 líneas cada uno).
3. Consultar la FUENTE DE DATOS y recomendar propiedades relevantes del catálogo.
4. Recordar la información previa proporcionada en la conversación y NO volver a preguntar datos ya especificados.

## FUENTE DE DATOS Y CATÁLOGO DE PROPIEDADES (RAG):
${catalogContext}
`;

      const formattedMessages = [
        { role: 'system', content: systemPrompt },
        ...history.map((h) => ({
          role: h.sender === 'user' ? 'user' : 'assistant',
          content: h.content,
        })),
        { role: 'user', content: trimmedMsg },
      ];

      const openRouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterKey}`,
          'HTTP-Referer': 'https://ariaprop.online',
          'X-Title': 'Aria Prop',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: formattedMessages,
          temperature: 0.3,
          max_tokens: 800,
        }),
      });

      if (openRouterRes.ok) {
        const json = await openRouterRes.json();
        const reply = json?.choices?.[0]?.message?.content;
        if (reply && reply.trim()) {
          return reply.trim();
        }
      }
    } catch (openRouterErr) {
      console.warn('OpenRouter API Call Warning in shared engine:', openRouterErr);
    }
  }

  // 2. Secondary LLM Fallback: Direct Google Gemini REST API
  const rawKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    '';
  const cleanApiKey = rawKey.replace(/^["']|["']$/g, '').trim();

  const langNames: Record<string, string> = { es: 'Español', en: 'English', pt: 'Português' };
  const targetLangName = langNames[lang] || 'Español';

  const systemPrompt = `
Eres Aria Prop, el asistente virtual de una plataforma inmobiliaria que opera en toda América.

IDIOMA PREDETERMINADO DE RESPUESTA: ${targetLangName.toUpperCase()}.
Debes responder SIEMPRE en este idioma (${targetLangName}).

Tus objetivos:
1. Entender qué busca el usuario (comprar o alquilar, tipo de propiedad, zona, presupuesto).
2. Consultar los datos disponibles en FUENTE_DE_DATOS y recomendar opciones.
3. Recordar siempre la información previamente provista en la conversación (historial) y NO volver a preguntar datos que el usuario ya especificó.
4. Facilitar el contacto directo o agendar una visita.

## FUENTE_DE_DATOS:
${catalogContext}

Responde siempre en ${targetLangName} con mensajes cortos, amables y conversacionales (2-4 líneas).
`;

  if (cleanApiKey) {
    try {
      const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${cleanApiKey}`;

      const contents = [
        ...history.map((h: { sender: string; content: string }) => ({
          role: h.sender === 'user' ? 'user' : 'model',
          parts: [{ text: h.content }],
        })),
        { role: 'user', parts: [{ text: trimmedMsg }] },
      ];

      const geminiRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: systemPrompt }] },
        }),
      });

      if (geminiRes.ok) {
        const json = await geminiRes.json();
        const generatedText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (generatedText) return generatedText;
      }
    } catch (err) {
      console.warn('Gemini REST Call Warning in shared engine:', err);
    }
  }

  // 3. Tertiary Deterministic Fallback Engine
  return buildMemoryAwareResponse(trimmedMsg, history).text;
}

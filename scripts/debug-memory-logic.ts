const MARKET_CATALOG = [
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
    description: 'Excelente departamento totalmente amoblado y equipado listo para ingresar.',
  },
];

function buildMemoryAwareResponse(
  message: string,
  history: { sender: string; content: string }[]
) {
  const trimmed = message.trim();
  const lowerMsg = trimmed.toLowerCase();

  const fullUserQuery = [
    ...history.filter((h) => h.sender === 'user').map((h) => h.content),
    trimmed,
  ].join(' ');
  const fullLowerQuery = fullUserQuery.toLowerCase();

  let lastProp: (typeof MARKET_CATALOG)[0] | undefined = undefined;

  for (let i = history.length - 1; i >= 0; i--) {
    const item = history[i];
    if (item.sender === 'bot' || item.sender === 'model') {
      const matched = MARKET_CATALOG.find(
        (p) => item.content.includes(p.title) || item.content.includes(p.address) || item.content.includes(p.id) || item.content.includes(p.zone)
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

  console.log('🔍 Memory Debug: lastProp =', lastProp?.title);
  console.log('🔍 Memory Debug: fullLowerQuery =', fullLowerQuery);

  const isAskingArea = lowerMsg.includes('metro') || lowerMsg.includes('m2') || lowerMsg.includes('superficie') || lowerMsg.includes('calle') || lowerMsg.includes('queda') || lowerMsg.includes('direccion') || lowerMsg.includes('dirección');
  const isAskingPrice = lowerMsg.includes('precio') || lowerMsg.includes('cuanto cuesta') || lowerMsg.includes('cuánto cuesta') || lowerMsg.includes('valor');
  const isAskingBedrooms = lowerMsg.includes('dormitorio') || lowerMsg.includes('habitacion') || lowerMsg.includes('habitación') || lowerMsg.includes('cuarto') || lowerMsg.includes('ambiente');
  const isAskingZoneOptions = lowerMsg.includes('esa zona') || lowerMsg.includes('otra opción') || lowerMsg.includes('otra opcion') || lowerMsg.includes('misma zona') || lowerMsg.includes('disponible') || lowerMsg.includes('opción') || lowerMsg.includes('opcion');

  if (lastProp) {
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

  return { text: 'Fallback default' };
}

// Test Turn 2
const historyTurn1 = [
  { sender: 'user', content: 'Hola, estoy buscando un departamento de 2 dormitorios en Mendoza con presupuesto de 450 USD para alquilar.' },
  { sender: 'bot', content: '¡Hola! Encontré esta excelente opción en nuestro catálogo verificado:\n\n🏡 **Departamento 2 Ambientes Amoblado en Alquiler - Barrio Bombal** en Barrio Bombal, Mendoza\n• **Precio:** $450 USD /mes\n• **Ambientes:** 1 dormitorios (52 m²)\n• **Dirección:** Av. España 1450' }
];

console.log('\n--- Testing Turn 2 ---');
console.log(buildMemoryAwareResponse('¿Tienen alguna opción disponible en esa zona?', historyTurn1));

console.log('\n--- Testing Turn 3 ---');
console.log(buildMemoryAwareResponse('¿Cuántos metros cuadrados tiene y en qué calle queda?', historyTurn1));

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { INITIAL_PROPERTIES, INITIAL_BOT_CONFIG } from '../src/data/mockData';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS for Vercel deployment
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, history = [], context = 'general', apiKey } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const trimmedMsg = message.trim().toLowerCase();
    const effectiveApiKey = apiKey || process.env.GEMINI_API_KEY;

    let ai: GoogleGenAI | null = null;
    if (effectiveApiKey && effectiveApiKey.trim()) {
      try {
        ai = new GoogleGenAI({
          apiKey: effectiveApiKey.trim(),
        });
      } catch {
        ai = null;
      }
    }

    // Build RAG context from properties
    const propertyCatalogContext = INITIAL_PROPERTIES.map(
      (p) =>
        `- [ID: ${p.id}] ${p.title} (${p.type.toUpperCase()}) en ${p.location.zone}, ${p.location.city}. Precio: $${p.price.toLocaleString('en-US')} USD. ${p.features.bedrooms} hab, ${p.features.bathrooms} baños, ${p.features.areaM2} m². Terraza: ${p.features.terraceM2 || 0}m², Piscina: ${p.features.pool ? 'Sí' : 'No'}, Garaje: ${p.features.garage ? 'Sí' : 'No'}. Código: ${p.code}. Descripción: ${p.description}`
    ).join('\n');

    let contextSpecificRole = 'Asistente comercial de bienes raíces 24/7';
    if (context === 'finance') {
      contextSpecificRole =
        'Evaluador de Rentabilidad e Inversión Inmobiliaria. Tu enfoque principal es calcular el ROI estimado, tasa de retorno anual (Cap Rate), proyección de flujo de caja y apreciación de capital para compradores e inversionistas.';
    } else if (context === 'rag') {
      contextSpecificRole =
        'Especialista en Búsqueda RAG de Dossiers y Memorias Técnicas. Tu objetivo es responder preguntas con alta precisión sobre planos, calidades de construcción, acabados y metrajes a partir de los documentos técnicos del catálogo.';
    }

    const systemPrompt = `
Eres "${INITIAL_BOT_CONFIG.agentName}", ${contextSpecificRole} para la agencia "${INITIAL_BOT_CONFIG.agencyName}" en Latinoamérica.
Tu objetivo es brindar asesoramiento inmobiliario de ultra alto nivel para clientes, compradores e inversionistas exigentes.

REGLAS DE ACTUACIÓN:
1. Responde de forma altamente profesional, elocuente, sofisticada y descriptiva en español latinoamericano (o inglés si la consulta fue hecha en inglés).
2. Utiliza la siguiente lista de propiedades en catálogo como fuente de verdad para recomendar inmuebles cuando coincidan con los criterios del cliente:
${propertyCatalogContext}

3. Estructura tus respuestas en secciones claras usando Markdown con emojis descriptivos:
   - 🏛️ **Análisis Ejecutivo de la Propiedad** (Ubicación premium, distribución de m², acabados y amenidades principales).
   - 💰 **Evaluación Financiera & Proyección de Rentabilidad** (Precio de adquisición en USD, estimación de canon de arrendamiento mensual, ROI Bruto % y plusvalía estimada a 5 años).
   - 📄 **Dossier Técnico & Planos** (Detalles sobre memorias de calidades, eficiencia energética y planos de planta).
   - 📅 **Coordinación de Visita Virtual o Presencial** (Invitación directa a agendar cita por WhatsApp).
4. SÉ ALTAMENTE DESCRIPTIVO Y COMPLETO. Proporciona argumentos sólidos de inversión, comparativas de mercado y consejos de valor.
`;

    // SSE Stream headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    if (ai) {
      try {
        const formattedContents = [
          ...history.map((h: { sender: string; content: string }) => ({
            role: h.sender === 'user' ? 'user' : 'model',
            parts: [{ text: h.content }],
          })),
          { role: 'user', parts: [{ text: message }] },
        ];

        const responseStream = await ai.models.generateContentStream({
          model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
          contents: formattedContents,
          config: {
            systemInstruction: systemPrompt,
          },
        });

        for await (const chunk of responseStream) {
          if (chunk.text) {
            res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
          }
        }
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        return res.end();
      } catch (geminiErr) {
        console.error('Gemini stream error, falling back to smart RAG engine:', geminiErr);
      }
    }

    // Smart simulated RAG fallback engine (when Gemini key is missing or errored)
    const matchingProp =
      INITIAL_PROPERTIES.find(
        (p) =>
          message.toLowerCase().includes(p.location.city.toLowerCase()) ||
          message.toLowerCase().includes(p.type) ||
          message.toLowerCase().includes('lujo') ||
          message.toLowerCase().includes('madrid')
      ) || INITIAL_PROPERTIES[0];

    let customPrice = matchingProp.price;
    let customRent = Math.round(matchingProp.price * 0.0075);

    const priceKMatch = message.match(
      /(?:costo|costó|precio|compr[ae]|valio|valió|depto|propiedad|valor)?\s*(?:de\s*)?\$?\s*(\d+(?:\.\d+)?)\s*(?:k|mil)/i
    );
    const priceRawMatch = message.match(
      /(?:costo|costó|precio|compr[ae]|valio|valió|valor)?\s*(?:de\s*)?\$?\s*(\d{5,8})/i
    );
    if (priceKMatch) {
      customPrice = parseFloat(priceKMatch[1]) * 1000;
    } else if (priceRawMatch) {
      customPrice = parseInt(priceRawMatch[1], 10);
    }

    const rentMatch = message.match(
      /(?:renta|alquiler|arriendo|canon|rento)?\s*(?:mensual|mes|de)?\s*\$?\s*(\d{3,6})\s*(?:usd|dolares|dólares|\/mes|mensuales)?/i
    );
    if (rentMatch && parseInt(rentMatch[1], 10) < customPrice) {
      customRent = parseInt(rentMatch[1], 10);
    }

    const grossYield = ((customRent * 12 / customPrice) * 100).toFixed(2);
    const netRent = Math.round(customRent * 0.85);
    const paybackYears = (customPrice / (customRent * 12)).toFixed(1);

    let responseText = '';

    if (
      trimmedMsg === 'hola' ||
      trimmedMsg === 'hola!' ||
      trimmedMsg === 'buenas' ||
      trimmedMsg === 'buenos dias' ||
      trimmedMsg === 'hello' ||
      trimmedMsg === 'hi'
    ) {
      responseText =
        `¡Hola! 👋 Bienvenido a **${INITIAL_BOT_CONFIG.agencyName}**. Soy **${INITIAL_BOT_CONFIG.agentName}**, tu asistente inmobiliario de IA 24/7.\n\n` +
        `¿En qué puedo ayudarte hoy?\n` +
        `- 🏠 **Buscar propiedades** en venta o alquiler por zona o presupuesto.\n` +
        `- 📊 **Calcular el ROI y flujo de caja** de una inversión inmobiliaria especificando precio y alquiler.\n` +
        `- 📄 **Consultar memorias técnicas y dossiers PDF** de nuestro catálogo.\n\n` +
        `¿Qué tipo de propiedad estás buscando o qué consulta deseas realizar?`;
    } else if (context === 'finance') {
      responseText =
        `### 📊 **Análisis Financiero & Cálculo de ROI Personalizado**\n\n` +
        `Procesando tus datos específicos: **Precio de Adquisición: $${customPrice.toLocaleString('en-US')} USD** y **Canon de Arriendo: $${customRent.toLocaleString('en-US')} USD/mes**.\n\n` +
        `#### 📈 **Métricas Financieras Calculadas Exactas**:\n` +
        `1. **Precio de Compra**: **$${customPrice.toLocaleString('en-US')} USD**\n` +
        `2. **Ingreso Anual por Renta**: **$${(customRent * 12).toLocaleString('en-US')} USD / año**\n` +
        `3. **ROI Bruto Anual (Cap Rate)**: **${grossYield}% Anual** ${parseFloat(grossYield) >= 8 ? '🔥 *(¡Excelente rendimiento por encima de la media de mercado!)*' : '👍 *(Rendimiento estable para la zona)*'}\n` +
        `4. **Gastos Operativos Estimados (HOA/Impuestos 15%)**: ~$${Math.round(customRent * 0.15).toLocaleString('en-US')} USD/mes\n` +
        `5. **Flujo de Caja Neto Libre (Cash Flow)**: **$${netRent.toLocaleString('en-US')} USD / mes** ($${(netRent * 12).toLocaleString('en-US')} USD/año)\n` +
        `6. **Período de Recuperación de Inversión**: **${paybackYears} Años**\n\n` +
        `#### 🏢 **Proyección de Valorización Patrimonial a 5 Años**:\n` +
        `- **Año 1 (+5.0%)**: $${Math.round(customPrice * 1.05).toLocaleString('en-US')} USD\n` +
        `- **Año 3 (+15.0%)**: $${Math.round(customPrice * 1.15).toLocaleString('en-US')} USD\n` +
        `- **Año 5 (+25.0%)**: **$${Math.round(customPrice * 1.25).toLocaleString('en-US')} USD** (Ganancia de capital de +$${Math.round(customPrice * 0.25).toLocaleString('en-US')} USD)\n\n` +
        `🔒 *Puedes agendar una llamada directa para estructurar el plan de financiamiento.*`;
    } else if (context === 'rag') {
      responseText =
        `### 📄 **Informe RAG Técnico Personalizado**\n\n` +
        `Analizando especificaciones para inmuebles en el catálogo (**${matchingProp.title}**):\n\n` +
        `- **Superficie Construida**: ${matchingProp.features.areaM2} m² (${matchingProp.features.bedrooms} hab / ${matchingProp.features.bathrooms} baños).\n` +
        `- **Ubicación Exacta**: ${matchingProp.location.address}, ${matchingProp.location.zone}, ${matchingProp.location.city}.\n` +
        `- **Memoria de Calidades**: Aislamiento térmico-acústico de alto rendimiento, carpintería exterior con puente térmico, climatización domótica y suelos de roble natural.\n` +
        `- **Certificación Energética**: Etiqueta A++.\n` +
        `- **Amenidades**: Terraza privativa de ${matchingProp.features.terraceM2 || 0}m², piscina climatizada y doble plaza de garaje subterránea.\n\n` +
        `📅 ¿Te gustaría agendar una visita guiada presencial o recibir el dossier PDF completo por WhatsApp?`;
    } else {
      responseText =
        `### 🏛️ **Análisis Ejecutivo Inmobiliario Personalizado**\n\n` +
        `Estimado cliente, analizando tu consulta para inmuebles destacados en el rango de **$${customPrice.toLocaleString('en-US')} USD**:\n\n` +
        `#### 📌 **Propiedad Recomendada del Catálogo**:\n` +
        `- **Título**: **${matchingProp.title}** (${matchingProp.code})\n` +
        `- **Ubicación**: ${matchingProp.location.zone}, ${matchingProp.location.city}\n` +
        `- **Precio de Lista**: **$${matchingProp.price.toLocaleString('en-US')} USD**\n` +
        `- **Distribución**: ${matchingProp.features.bedrooms} recámaras | ${matchingProp.features.bathrooms} baños | ${matchingProp.features.areaM2} m²\n\n` +
        `#### 💰 **Estudio Financiero & Retorno Estimado**:\n` +
        `| Criterio Financiero | Valor Calculado (USD) |\n` +
        `| :--- | :--- |\n` +
        `| **Inversión Inicial** | $${customPrice.toLocaleString('en-US')} USD |\n` +
        `| **Renta Bruta Estimada** | $${(customRent * 12).toLocaleString('en-US')} USD / año |\n` +
        `| **ROI Bruto Anual** | **~${grossYield}% Anual** |\n` +
        `| **Tiempo de Retorno** | **${paybackYears} Años** |\n` +
        `| **Plusvalía Proyectada (5 Años)** | **$${Math.round(customPrice * 1.25).toLocaleString('en-US')} USD (+25%)** |\n\n` +
        `📅 ¿Deseas coordinar una visita presencial o recibir más detalles por WhatsApp?`;
    }

    const words = responseText.split(' ');
    for (const word of words) {
      res.write(`data: ${JSON.stringify({ text: word + ' ' })}\n\n`);
      await new Promise((r) => setTimeout(r, 15));
    }
    res.write(`data: ${JSON.stringify({ done: true, recommendedPropertyId: matchingProp.id })}\n\n`);
    return res.end();
  } catch (err: any) {
    console.error('API Chat Error:', err);
    return res.status(500).json({ error: 'Internal server error in AI chat endpoint' });
  }
}

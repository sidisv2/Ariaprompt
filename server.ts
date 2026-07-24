import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { INITIAL_PROPERTIES, INITIAL_LEADS, INITIAL_BOT_CONFIG } from './src/data/mockData.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // In-memory data store for live sessions & interactive demos
  let properties = [...INITIAL_PROPERTIES];
  let leads = [...INITIAL_LEADS];
  let botConfig = { ...INITIAL_BOT_CONFIG };

  // Helper for lazy Gemini initialization
  function getGeminiClient(customApiKey?: string) {
    const apiKey = customApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      return null;
    }
    return new GoogleGenAI({
      apiKey: apiKey.trim(),
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  // --- API ROUTES ---
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'PropTech AI Agent Platform', timestamp: new Date().toISOString() });
  });

  // Get Properties
  app.get('/api/properties', (req, res) => {
    res.json({ success: true, data: properties });
  });

  // Create Property
  app.post('/api/properties', (req, res) => {
    const newProperty = {
      id: `prop-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      documents: [],
      featured: false,
      status: 'available' as const,
      ...req.body,
    };
    properties.unshift(newProperty);
    res.json({ success: true, data: newProperty });
  });

  // Get Leads
  app.get('/api/leads', (req, res) => {
    res.json({ success: true, data: leads });
  });

  // Update Lead Status / Temperature
  app.patch('/api/leads/:id', (req, res) => {
    const { id } = req.params;
    const leadIndex = leads.findIndex((l) => l.id === id);
    if (leadIndex !== -1) {
      leads[leadIndex] = { ...leads[leadIndex], ...req.body };
      res.json({ success: true, data: leads[leadIndex] });
    } else {
      res.status(404).json({ error: 'Lead not found' });
    }
  });

  // Get/Update Bot Config
  app.get('/api/bot-config', (req, res) => {
    res.json({ success: true, data: botConfig });
  });

  app.post('/api/bot-config', (req, res) => {
    botConfig = { ...botConfig, ...req.body };
    res.json({ success: true, data: botConfig });
  });

  // Streaming AI Chat Endpoint (RAG Injection with Gemini)
  app.post('/api/chat', async (req, res) => {
    const { message, history = [], context = 'general', apiKey, lang = 'es' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const langNames: Record<string, string> = {
      es: 'Español',
      en: 'English',
      pt: 'Português',
    };
    const targetLangName = langNames[lang] || 'Español';

    const trimmedMsg = message.trim().toLowerCase();
    const ai = getGeminiClient(apiKey);

    // Prepare RAG Context from active properties
    const propertyCatalogContext = properties
      .map(
        (p) =>
          `- [ID: ${p.id}] ${p.title} (${p.type.toUpperCase()}) en ${p.location.zone}, ${p.location.city}. Precio: $${p.price.toLocaleString('en-US')} USD. ${p.features.bedrooms} hab, ${p.features.bathrooms} baños, ${p.features.areaM2} m². Terraza: ${p.features.terraceM2 || 0}m², Piscina: ${p.features.pool ? 'Sí' : 'No'}, Garaje: ${p.features.garage ? 'Sí' : 'No'}. Código: ${p.code}. Descripción: ${p.description}`
      )
      .join('\n');

    let contextSpecificRole = 'Asistente comercial de bienes raíces 24/7';
    if (context === 'finance') {
      contextSpecificRole = 'Evaluador de Rentabilidad e Inversión Inmobiliaria. Tu enfoque principal es calcular el ROI estimado, tasa de retorno anual (Cap Rate), proyección de flujo de caja y apreciación de capital para compradores e inversionistas.';
    } else if (context === 'rag') {
      contextSpecificRole = 'Especialista en Búsqueda RAG de Dossiers y Memorias Técnicas. Tu objetivo es responder preguntas con alta precisión sobre planos, calidades de construcción, acabados y metrajes a partir de los documentos técnicos del catálogo.';
    }

    const systemPrompt = `
Eres "${botConfig.agentName}", ${contextSpecificRole} para la agencia "${botConfig.agencyName}" en Latinoamérica.

IDIOMA PREDETERMINADO DE RESPUESTA: ${targetLangName.toUpperCase()}.
Debes responder SIEMPRE en este idioma (${targetLangName}) desde el primer saludo y en todas tus explicaciones.
Excepción: Si el usuario escribe su mensaje en un idioma distinto (ej: si escribe en inglés o portugués), prioriza responder en el idioma utilizado por el usuario en su mensaje.

REGLAS DE ACTUACIÓN:
1. Responde de forma altamente profesional, elocuente y sofisticada en ${targetLangName}.
2. Utiliza la siguiente lista de propiedades en catálogo como fuente de verdad para recomendar inmuebles cuando coincidan con los criterios del cliente:
${propertyCatalogContext}

3. Estructura tus respuestas en secciones claras usando Markdown con emojis descriptivos:
   - 🏛️ **Análisis Ejecutivo de la Propiedad** (Ubicación premium, distribución de m², acabados y amenidades principales).
   - 💰 **Evaluación Financiera & Proyección de Rentabilidad** (Precio de adquisición en USD, estimación de canon de arrendamiento mensual, ROI Bruto % y plusvalía estimada a 5 años).
   - 📄 **Dossier Técnico & Planos** (Detalles sobre memorias de calidades, eficiencia energética y planos de planta).
   - 📅 **Coordinación de Visita Virtual o Presencial** (Invitación directa a agendar cita por WhatsApp).
4. SÉ ALTAMENTE DESCRIPTIVO Y COMPLETO. Proporciona argumentos sólidos de inversión, comparativas de mercado y consejos de valor en ${targetLangName}. Evita respuestas escuetas.
`;

    if (!ai) {
      // Fallback simulated streaming response if no API key is provided
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const matchingProp = properties.find((p) =>
        message.toLowerCase().includes(p.location.city.toLowerCase()) ||
        message.toLowerCase().includes(p.type) ||
        message.toLowerCase().includes('lujo') ||
        message.toLowerCase().includes('madrid')
      ) || properties[0];

      // Extract custom user financial values if provided (e.g. 123k usd, 1000usd/mes)
      let customPrice = matchingProp.price;
      let customRent = Math.round(matchingProp.price * 0.0075);

      const priceKMatch = message.match(/(?:costo|costó|precio|compr[ae]|valio|valió|depto|propiedad|valor)?\s*(?:de\s*)?\$?\s*(\d+(?:\.\d+)?)\s*(?:k|mil)/i);
      const priceRawMatch = message.match(/(?:costo|costó|precio|compr[ae]|valio|valió|valor)?\s*(?:de\s*)?\$?\s*(\d{5,8})/i);
      if (priceKMatch) {
        customPrice = parseFloat(priceKMatch[1]) * 1000;
      } else if (priceRawMatch) {
        customPrice = parseInt(priceRawMatch[1], 10);
      }

      const rentMatch = message.match(/(?:renta|alquiler|arriendo|canon|rento)?\s*(?:mensual|mes|de)?\s*\$?\s*(\d{3,6})\s*(?:usd|dolares|dólares|\/mes|mensuales)?/i);
      if (rentMatch && parseInt(rentMatch[1], 10) < customPrice) {
        customRent = parseInt(rentMatch[1], 10);
      }

      const grossYield = ((customRent * 12 / customPrice) * 100).toFixed(2);
      const netRent = Math.round(customRent * 0.85);
      const netYield = ((netRent * 12 / customPrice) * 100).toFixed(2);
      const paybackYears = (customPrice / (customRent * 12)).toFixed(1);

      let fallbackText = '';

      // Handle simple greetings cleanly
      if (trimmedMsg === 'hola' || trimmedMsg === 'hola!' || trimmedMsg === 'buenas' || trimmedMsg === 'buenos dias' || trimmedMsg === 'buenas tardes') {
        fallbackText = `¡Hola! 👋 Bienvenido a **${botConfig.agencyName}**. Soy **${botConfig.agentName}**, tu asistente inmobiliario de IA 24/7.\n\n` +
          `¿En qué puedo ayudarte hoy?\n` +
          `- 🏠 **Buscar propiedades** en venta o alquiler por zona o presupuesto.\n` +
          `- 📊 **Calcular el ROI y flujo de caja** de una inversión inmobiliaria especificando precio y alquiler.\n` +
          `- 📄 **Consultar memorias técnicas y dossiers PDF** de nuestro catálogo.\n\n` +
          `¿Qué tipo de propiedad estás buscando o qué consulta deseas realizar?`;
      } else if (context === 'finance') {
        fallbackText = `### 📊 **Análisis Financiero & Cálculo de ROI Personalizado**\n\n` +
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
          `🔒 *Los suscriptores pueden descargar el informe financiero en PDF en su directorio privado.*`;
      } else if (context === 'rag') {
        fallbackText = `### 📄 **Informe RAG Técnico Personalizado**\n\n` +
          `Analizando especificaciones para inmuebles en el rango de **$${customPrice.toLocaleString('en-US')} USD** (${matchingProp.title}):\n\n` +
          `- **Metraje Privativo**: ${matchingProp.features.areaM2} m² (Distribución de ${matchingProp.features.bedrooms} habitaciones / ${matchingProp.features.bathrooms} baños).\n` +
          `- **Memoria de Calidades**: Aislamiento acústico de triple cristal, pavimento de roble natural y climatización domótica.\n` +
          `- **Certificación Energética**: Etiqueta A++ (Consumo ultra eficiente).\n\n` +
          `🔒 *Los suscriptores tienen habilitada la descarga directa del expediente técnico en su directorio privado.*`;
      } else {
        fallbackText = `### 🏛️ **Análisis Ejecutivo Inmobiliario Personalizado**\n\n` +
          `Estimado cliente, analizando tu consulta para un departamento valorado en **$${customPrice.toLocaleString('en-US')} USD**:\n\n` +
          `#### 📌 **Resumen Ejecutivo**:\n` +
          `- **Valor de Inmueble Analizado**: **$${customPrice.toLocaleString('en-US')} USD**\n` +
          `- **Alquiler Mensual Ingresado**: **$${customRent.toLocaleString('en-US')} USD / mes**\n` +
          `- **Ubicación de Referencia**: ${matchingProp.location.zone} (${matchingProp.location.city})\n\n` +
          `#### 💰 **Estudio Financiero & Proyección de Rentabilidad**:\n` +
          `| Criterio Financiero | Valor Calculado (USD) |\n` +
          `| :--- | :--- |\n` +
          `| **Inversión Inicial** | $${customPrice.toLocaleString('en-US')} USD |\n` +
          `| **Renta Bruta Anual** | $${(customRent * 12).toLocaleString('en-US')} USD / año |\n` +
          `| **ROI Bruto Anual** | **~${grossYield}% Anual** |\n` +
          `| **ROI Neto Estimado** | **~${netYield}% Anual** |\n` +
          `| **Tiempo de Retorno (Payback)** | **${paybackYears} Años** |\n` +
          `| **Plusvalía Proyectada (5 Años)** | **$${Math.round(customPrice * 1.25).toLocaleString('en-US')} USD (+25%)** |\n\n` +
          `¿Te gustaría coordinar una reunión financiera o agendar una asesoría de inversión personalizada?`;
      }

      const words = fallbackText.split(' ');
      for (const word of words) {
        res.write(`data: ${JSON.stringify({ text: word + ' ' })}\n\n`);
        await new Promise((r) => setTimeout(r, 20));
      }
      res.write(`data: ${JSON.stringify({ done: true, recommendedPropertyId: matchingProp.id })}\n\n`);
      return res.end();
    }

    try {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Format conversation history for Gemini chat
      const formattedContents = [
        ...history.map((h: { sender: string; content: string }) => ({
          role: h.sender === 'user' ? 'user' : 'model',
          parts: [{ text: h.content }],
        })),
        { role: 'user', parts: [{ text: message }] },
      ];

      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
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
      res.end();
    } catch (err: unknown) {
      console.error('Gemini API Streaming Error:', err);
      res.write(`data: ${JSON.stringify({ error: 'Error procesando la respuesta de la IA' })}\n\n`);
      res.end();
    }
  });

  // Embedded Widget Script generator
  app.get(['/embed/script.js', '/embed/aria-widget.js', '/aria-widget.js'], (req, res) => {
    const host = req.headers.host || 'localhost:3000';
    const protocol = req.protocol || 'http';
    const script = `
(function() {
  var agentId = document.currentScript.getAttribute('data-agent-id') || 'prop-agent-001';
  var iframe = document.createElement('iframe');
  iframe.src = '${protocol}://${host}/embed/chat/' + agentId;
  iframe.style.position = 'fixed';
  iframe.style.bottom = '20px';
  iframe.style.right = '20px';
  iframe.style.width = '380px';
  iframe.style.height = '620px';
  iframe.style.border = 'none';
  iframe.style.borderRadius = '16px';
  iframe.style.boxShadow = '0 20px 40px rgba(0,0,0,0.4)';
  iframe.style.zIndex = '999999';
  iframe.allow = 'camera; microphone';
  document.body.appendChild(iframe);
})();
`;
    res.setHeader('Content-Type', 'application/javascript');
    res.send(script);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PropTech AI Agent Enterprise Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

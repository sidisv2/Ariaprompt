import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { INITIAL_PROPERTIES, INITIAL_LEADS, INITIAL_BOT_CONFIG } from './src/data/mockData.js';
import { generateOpenRouterRealEstateResponse } from './src/lib/ai/openrouterService.js';

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

  // Optional Supabase DB initialization if credentials exist
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  let supabaseClient: any = null;

  if (supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder')) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      supabaseClient = createClient(supabaseUrl, supabaseKey);
      console.log('✅ Supabase Client initialized in server.ts');
    } catch (e) {
      console.warn('⚠️ Supabase initialization skipped:', e);
    }
  }

  // --- API ROUTES ---
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      service: 'PropTech AI Agent Platform', 
      supabaseConnected: !!supabaseClient,
      timestamp: new Date().toISOString() 
    });
  });

  // Get Properties (Fetch from Supabase DB if connected, fallback to in-memory)
  app.get('/api/properties', async (req, res) => {
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient.from('propiedades').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return res.json({ success: true, data, source: 'supabase' });
        }
      } catch (err) {
        console.warn('Supabase fetch properties fallback:', err);
      }
    }
    res.json({ success: true, data: properties, source: 'memory' });
  });

  // Create Property
  app.post('/api/properties', async (req, res) => {
    const newProperty = {
      id: `prop-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      documents: [],
      featured: false,
      status: 'available' as const,
      ...req.body,
    };

    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient.from('propiedades').insert([newProperty]).select().single();
        if (!error && data) {
          properties.unshift(data);
          return res.json({ success: true, data, source: 'supabase' });
        }
      } catch (err) {
        console.warn('Supabase insert property fallback:', err);
      }
    }

    properties.unshift(newProperty);
    res.json({ success: true, data: newProperty, source: 'memory' });
  });

  // Get Leads
  app.get('/api/leads', async (req, res) => {
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient.from('leads').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return res.json({ success: true, data, source: 'supabase' });
        }
      } catch (err) {
        console.warn('Supabase fetch leads fallback:', err);
      }
    }
    res.json({ success: true, data: leads, source: 'memory' });
  });

  // Update Lead Status / Temperature
  app.patch('/api/leads/:id', async (req, res) => {
    const { id } = req.params;

    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient.from('leads').update(req.body).eq('id', id).select().single();
        if (!error && data) {
          const idx = leads.findIndex((l) => l.id === id);
          if (idx !== -1) leads[idx] = { ...leads[idx], ...data };
          return res.json({ success: true, data, source: 'supabase' });
        }
      } catch (err) {
        console.warn('Supabase update lead fallback:', err);
      }
    }

    const leadIndex = leads.findIndex((l) => l.id === id);
    if (leadIndex !== -1) {
      leads[leadIndex] = { ...leads[leadIndex], ...req.body };
      res.json({ success: true, data: leads[leadIndex], source: 'memory' });
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

    try {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const responseText = await generateOpenRouterRealEstateResponse({
        message: trimmedMsg,
        history,
        propertyContext: propertyCatalogContext,
        lang,
        contextRole: context,
        agentName: botConfig.agentName,
        agencyName: botConfig.agencyName,
        apiKey,
      });

      res.write(`data: ${JSON.stringify({ text: responseText })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (err: any) {
      console.error('❌ OpenRouter Express Chat Error:', err?.message || err);
      res.write(`data: ${JSON.stringify({ error: 'Error calling OpenRouter API', details: err?.message || 'LLM error' })}\n\n`);
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

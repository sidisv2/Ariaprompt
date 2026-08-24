import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { INITIAL_PROPERTIES, INITIAL_LEADS, INITIAL_BOT_CONFIG } from './src/data/mockData.js';
import { generateOpenRouterRealEstateResponse } from './api/_lib/openrouterService.js';

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

  // Open Graph Property Meta Tag Endpoint (/api/og/property)
  app.get('/api/og/property', async (req, res) => {
    try {
      const handleOgPropertyRoute = (await import('./api/og/property.js')).default;
      return handleOgPropertyRoute(req, res);
    } catch (err: any) {
      console.error('❌ Express /api/og/property error:', err);
      res.status(500).send('Error generating Open Graph metadata');
    }
  });

  // Crawler Bot Interceptor for /properties/:id
  app.get(['/properties/:id', '/properties/:id/*'], async (req, res, next) => {
    const userAgent = req.headers['user-agent'] || '';
    const CRAWLER_REGEX = /WhatsApp|TelegramBot|facebookexternalhit|Twitterbot|LinkedInBot|Discordbot|Slackbot|googlebot/i;

    if (CRAWLER_REGEX.test(userAgent)) {
      try {
        const handleOgPropertyRoute = (await import('./api/og/property.js')).default;
        req.query = req.query || {};
        req.query.id = req.params.id;
        return handleOgPropertyRoute(req, res);
      } catch (err) {
        console.warn('⚠️ Crawler OG interceptor fallback:', err);
      }
    }
    next();
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

  // AI Chat Endpoint (/api/chat)
  app.post('/api/chat', async (req, res) => {
    try {
      const { handleChatRoute } = await import('./api/_handlers/chatHandler.js');
      return handleChatRoute(req as any, res as any);
    } catch (err: any) {
      console.error('❌ Express /api/chat error:', err);
      res.status(500).json({ error: 'Error calling AI Chat handler', details: err?.message });
    }
  });


  // CRM API Endpoints (/api/crm, /api/crm/*)
  app.all(['/api/crm', '/api/crm/:route*'], async (req, res) => {
    try {
      const { handleCrmRoute } = await import('./api/_handlers/crmHandler.js');
      const routeParam = req.params?.route ? `${req.params.route}${req.params[0] || ''}` : (req.path.replace(/^\/api\/crm\/?/, '') || 'leads');
      const cleanSubRoute = routeParam || 'leads';
      return handleCrmRoute(req as any, res as any, cleanSubRoute);
    } catch (err: any) {
      console.error('❌ Express /api/crm error:', err);
      res.status(500).json({ success: false, error: 'Error calling CRM handler', details: err?.message, leads: [], messages: [] });
    }
  });

  // WhatsApp Meta Cloud API Endpoints (/api/whatsapp/*, /api/whatsapp-webhook)
  app.all(['/api/whatsapp', '/api/whatsapp/:route*', '/api/whatsapp-webhook', '/api/webhook/whatsapp', '/api/webhook/whatsapp/:route*'], async (req, res) => {
    try {
      const { handleWhatsAppRoute } = await import('./api/_handlers/whatsappHandler.js');
      const routeParam = req.params?.route ? `${req.params.route}${req.params[0] || ''}` : (req.path.replace(/^\/api\/whatsapp\/?/, '') || 'webhook');
      const cleanSubRoute = routeParam || 'webhook';
      return handleWhatsAppRoute(req as any, res as any, cleanSubRoute);
    } catch (err: any) {
      console.error('❌ Express /api/whatsapp error:', err);
      res.status(500).json({ success: false, error: 'Error calling WhatsApp handler', details: err?.message });
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

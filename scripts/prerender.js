import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.resolve(__dirname, '../dist');
const BASE_URL = 'https://ariaprompt.vercel.app';

const PUBLIC_ROUTES = [
  {
    path: '/',
    title: 'Aria Prop - Agente de IA Inmobiliario 24/7 en América',
    description: 'Automatiza la atención de tus inmuebles, cualifica leads de alta intención y agenda visitas 24/7 en WhatsApp y Web con la IA de Aria Prop.',
    ogTitle: 'Aria Prop - Asistente Virtual 24/7 para Agencias Inmobiliarias',
    ogDescription: 'Responde a tus prospectos en menos de 5 segundos, califica presupuesto y coordina citas directo en Google Calendar.',
    ogImage: `${BASE_URL}/assets/og-home.jpg`,
    contentHtml: `
      <div id="static-prerender-wrapper" class="bg-slate-950 text-slate-100 min-h-screen font-sans">
        <main class="max-w-7xl mx-auto px-4 py-8 space-y-8">
          <header class="space-y-4">
            <span class="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">IA Inmobiliaria 24/7 en América</span>
            <h1 class="text-3xl sm:text-5xl font-black tracking-tight text-white">Aria Prop: El Asistente Virtual 24/7 para Agencias Inmobiliarias</h1>
            <p class="text-slate-300 text-sm sm:text-base max-w-2xl">Captura, cualifica y agenda visitas con compradores e inversionistas en tiempo real sin perder prospectos fuera de horario.</p>
          </header>
          <section class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div class="p-5 rounded-2xl bg-slate-900 border border-white/10 space-y-2">
              <h2 class="text-base font-bold text-emerald-400">Atención Inmobiliaria Inmediata en América</h2>
              <ul class="space-y-1.5 text-slate-300">
                <li>• <strong>Respuesta en &lt; 5 segundos:</strong> Calificación instantánea de presupuesto y tipo de inmueble.</li>
                <li>• <strong>Sincronización RAG:</strong> Conexión con catálogo directo de propiedades y memorias técnicas PDF.</li>
                <li>• <strong>Integraciones CRM:</strong> Tokko Broker, EasyBroker, WhatsApp API y Google Calendar.</li>
              </ul>
            </div>
            <div class="p-5 rounded-2xl bg-slate-900 border border-white/10 space-y-2">
              <h2 class="text-base font-bold text-emerald-400">Confían más de 500+ Agencias en LATAM</h2>
              <p class="text-slate-300">Aumenta un +85% las visitas agendadas y reduce el tiempo de respuesta de horas a segundos.</p>
            </div>
          </section>
        </main>
      </div>
    `,
  },
  {
    path: '/app',
    title: 'Workspace Aria AI & Motor Inmobiliario | Aria Prop',
    description: 'Conoce cómo funciona el motor RAG de Aria Prop: lectura de dossieres PDF, cálculo automático de ROI y atención omnicanal en WhatsApp.',
    ogTitle: 'Tecnología RAG & IA Inmobiliaria 24/7 | Aria Prop',
    ogDescription: 'Explora el motor atómico de inteligencia inmobiliaria para cualificar prospectos y analizar estados de inversión.',
    ogImage: `${BASE_URL}/assets/og-app.jpg`,
    contentHtml: `
      <div id="static-prerender-wrapper" class="bg-slate-950 text-slate-100 min-h-screen font-sans">
        <main class="max-w-7xl mx-auto px-4 py-8 space-y-8">
          <header class="space-y-4">
            <span class="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">Suite Interactiva IA</span>
            <h1 class="text-3xl sm:text-5xl font-black tracking-tight text-white">Motor RAG e Inteligencia Artificial Inmobiliaria</h1>
            <p class="text-slate-300 text-sm sm:text-base max-w-2xl">Aria Prop analiza catálogos complejos, documentos técnicos y responde a compradores con máxima precisión.</p>
          </header>
          <section class="p-6 rounded-2xl bg-slate-900 border border-white/10 space-y-4">
            <h2 class="text-lg font-bold text-emerald-400">Capacidades del Sistema Aria AI</h2>
            <ul class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
              <li class="p-3 rounded-xl bg-slate-950 border border-white/5">• <strong>Cualificación Automática:</strong> Score de 0 a 100 basado en presupuesto y urgencia.</li>
              <li class="p-3 rounded-xl bg-slate-950 border border-white/5">• <strong>Cálculo de ROI & Cap Rate:</strong> Estimación de rentabilidad anual a 5 años.</li>
              <li class="p-3 rounded-xl bg-slate-950 border border-white/5">• <strong>Búsqueda RAG PDF:</strong> Extracción de metrajes y planos de planta.</li>
            </ul>
          </section>
        </main>
      </div>
    `,
  },
  {
    path: '/soluciones',
    title: 'Soluciones Inmobiliarias para Agencias, Desarrolladores e Inversionistas | Aria Prop',
    description: 'Soluciones de inteligencia artificial adaptadas para agencias de corretaje, desarrolladores de desarrollos y consultores de inversión.',
    ogTitle: 'Soluciones Inmobiliarias Inteligentes | Aria Prop',
    ogDescription: 'Automatiza la cualificación de compradores para inmobiliarias, comercializadoras y fondos de inversión.',
    ogImage: `${BASE_URL}/assets/og-soluciones.jpg`,
    contentHtml: `
      <div id="static-prerender-wrapper" class="bg-slate-950 text-slate-100 min-h-screen font-sans">
        <main class="max-w-7xl mx-auto px-4 py-8 space-y-8">
          <header class="space-y-4">
            <span class="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">Soluciones por Perfil</span>
            <h1 class="text-3xl sm:text-5xl font-black tracking-tight text-white">Soluciones de IA para el Sector Inmobiliario</h1>
            <p class="text-slate-300 text-sm sm:text-base max-w-2xl">Aumenta tus conversiones y brinda atención personalizada a cada perfil de comprador.</p>
          </header>
          <section class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm">
            <div class="p-5 rounded-2xl bg-slate-900 border border-white/10 space-y-2">
              <h2 class="text-base font-bold text-emerald-400">Para Agencias de Corretaje</h2>
              <p class="text-slate-300">Atención 24/7 en WhatsApp y sitios web. Filtra curiosos y deriva solo compradores calificados a tu equipo humano.</p>
            </div>
            <div class="p-5 rounded-2xl bg-slate-900 border border-white/10 space-y-2">
              <h2 class="text-base font-bold text-emerald-400">Para Desarrolladores & Promotoras</h2>
              <p class="text-slate-300">Presentación interactiva de planos, renders y memorias de calidades de nuevos desarrollos.</p>
            </div>
            <div class="p-5 rounded-2xl bg-slate-900 border border-white/10 space-y-2">
              <h2 class="text-base font-bold text-emerald-400">Para Inversionistas</h2>
              <p class="text-slate-300">Análisis ejecutivo de plusvalía, Cap Rate y comparativas de mercado en tiempo real.</p>
            </div>
          </section>
        </main>
      </div>
    `,
  },
  {
    path: '/pricing',
    title: 'Planes y Precios - Licencias para Agencias Inmobiliarias | Aria Prop',
    description: 'Planes flexibles y transparentes para agencias independientes, boutique y grandes redes de corretaje en Latinoamérica.',
    ogTitle: 'Planes y Precios | Aria Prop AI',
    ogDescription: 'Comienza gratis con 7 días de prueba. Elige la licencia perfecta para potenciar las ventas de tu agencia.',
    ogImage: `${BASE_URL}/assets/og-pricing.jpg`,
    contentHtml: `
      <div id="static-prerender-wrapper" class="bg-slate-950 text-slate-100 min-h-screen font-sans">
        <main class="max-w-7xl mx-auto px-4 py-8 space-y-8">
          <header class="space-y-4">
            <span class="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">Tarifas Transparentes</span>
            <h1 class="text-3xl sm:text-5xl font-black tracking-tight text-white">Planes y Precios Transparentes</h1>
            <p class="text-slate-300 text-sm sm:text-base max-w-2xl">Sin tarjeta obligatoria. Configura tu agente inteligente en menos de 3 minutos.</p>
          </header>
          <section class="p-6 rounded-2xl bg-slate-900 border border-white/10 space-y-3 text-xs sm:text-sm">
            <h2 class="text-base font-bold text-emerald-400">Licencia Pro LATAM & Agencias</h2>
            <ul class="space-y-1.5 text-slate-300">
              <li>• Atención 24/7 en WhatsApp y Web.</li>
              <li>• Leads ilimitados y cualificación automática.</li>
              <li>• Sincronización con Tokko Broker y EasyBroker.</li>
              <li>• Integración con Google Calendar.</li>
            </ul>
          </section>
        </main>
      </div>
    `,
  },
  {
    path: '/recursos',
    title: 'Recursos, Documentación RAG & Preguntas Frecuentes | Aria Prop',
    description: 'Guías completas de integración, preguntas frecuentes sobre seguridad RGPD y optimización de flujos con IA.',
    ogTitle: 'Recursos & Centro de Ayuda | Aria Prop',
    ogDescription: 'Aprende a integrar tu CRM, cargar memorias técnicas PDF y maximizar la cualificación de tus prospectos.',
    ogImage: `${BASE_URL}/assets/og-recursos.jpg`,
    contentHtml: `
      <div id="static-prerender-wrapper" class="bg-slate-950 text-slate-100 min-h-screen font-sans">
        <main class="max-w-7xl mx-auto px-4 py-8 space-y-8">
          <header class="space-y-4">
            <span class="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">Centro de Conocimiento</span>
            <h1 class="text-3xl sm:text-5xl font-black tracking-tight text-white">Recursos y Preguntas Frecuentes</h1>
            <p class="text-slate-300 text-sm sm:text-base max-w-2xl">Todo lo que necesitas saber para escalar la atención de tu agencia con inteligencia artificial.</p>
          </header>
          <section class="p-6 rounded-2xl bg-slate-900 border border-white/10 space-y-3 text-xs sm:text-sm">
            <h2 class="text-base font-bold text-emerald-400">Preguntas Frecuentes (FAQ)</h2>
            <div class="space-y-2 text-slate-300">
              <h3 class="font-bold text-white">¿Cómo se conecta Aria Prop a mi CRM?</h3>
              <p>Se integra de forma directa mediante API Keys oficiales con Tokko Broker, EasyBroker o vía Webhooks.</p>
              <h3 class="font-bold text-white">¿Es seguro el manejo de datos?</h3>
              <p>Cuenta con cifrado SSL de 256 bits y pleno cumplimiento de normativas RGPD.</p>
            </div>
          </section>
        </main>
      </div>
    `,
  },
];

async function prerender() {
  const templatePath = path.join(DIST_DIR, 'index.html');
  if (!fs.existsSync(templatePath)) {
    console.error('❌ Error: dist/index.html does not exist. Run vite build first.');
    process.exit(1);
  }

  const templateHtml = fs.readFileSync(templatePath, 'utf-8');

  for (const route of PUBLIC_ROUTES) {
    const routeUrl = `${BASE_URL}${route.path === '/' ? '' : route.path}`;

    let html = templateHtml;

    // Replace Title
    html = html.replace(/<title>.*?<\/title>/gi, `<title>${route.title}</title>`);

    // Replace or Inject Meta Description
    if (html.includes('<meta name="description"')) {
      html = html.replace(/<meta name="description"[^>]*>/gi, `<meta name="description" content="${route.description}" />`);
    } else {
      html = html.replace('</head>', `  <meta name="description" content="${route.description}" />\n</head>`);
    }

    // OpenGraph & Twitter Meta Tags Block
    const ogTagsHtml = `
    <!-- OpenGraph SEO Tags -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${route.ogTitle}" />
    <meta property="og:description" content="${route.ogDescription}" />
    <meta property="og:url" content="${routeUrl}" />
    <meta property="og:image" content="${route.ogImage}" />
    <meta property="og:site_name" content="Aria Prop" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${route.ogTitle}" />
    <meta name="twitter:description" content="${route.ogDescription}" />
    <meta name="twitter:image" content="${route.ogImage}" />
    <link rel="canonical" href="${routeUrl}" />
    <meta name="robots" content="index, follow" />
    `;

    html = html.replace('</head>', `${ogTagsHtml}\n</head>`);

    // Inject prerendered semantic HTML content into <div id="root">
    html = html.replace(
      '<div id="root"></div>',
      `<div id="root">${route.contentHtml}</div>`
    );

    // Determine output file path
    let targetDir = DIST_DIR;
    if (route.path !== '/') {
      targetDir = path.join(DIST_DIR, route.path.replace(/^\//, ''));
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
    }

    const targetFile = path.join(targetDir, 'index.html');
    fs.writeFileSync(targetFile, html, 'utf-8');
    console.log(`✅ Prerendered: ${route.path} -> ${targetFile}`);
  }

  console.log('🎉 SSG Prerendering Completed Successfully!');
}

prerender().catch((err) => {
  console.error('❌ Prerender script error:', err);
  process.exit(1);
});

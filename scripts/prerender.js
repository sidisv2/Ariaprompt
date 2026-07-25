import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.resolve(__dirname, '../dist');
const BASE_URL = 'https://ariaprompt.vercel.app';

// ----------------------------------------------------------------------
// SINGLE SOURCE OF TRUTH: Read dynamic translations from src/locales/es/translation.json
// ----------------------------------------------------------------------
const esJsonPath = path.resolve(__dirname, '../src/locales/es/translation.json');
let es = {};

try {
  const jsonContent = fs.readFileSync(esJsonPath, 'utf-8');
  es = JSON.parse(jsonContent);
  console.log('✅ Loaded single source of truth copy from src/locales/es/translation.json');
} catch (err) {
  console.error('❌ Error loading translation.json in prerender.js:', err);
  process.exit(1);
}

const PUBLIC_ROUTES = [
  {
    path: '/',
    title: `Aria Prop - ${es.hero?.badge || 'Agente de IA Inmobiliario 24/7 en América'}`,
    description: es.hero?.subtitle || 'Automatiza la atención de tus inmuebles, cualifica leads de alta intención y agenda visitas 24/7 en WhatsApp y Web con la IA de Aria Prop.',
    ogTitle: `${es.hero?.title1} ${es.hero?.title2} | Aria Prop`,
    ogDescription: es.hero?.subtitle || 'Responde a tus prospectos en menos de 5 segundos, califica presupuesto y coordina citas directo en Google Calendar.',
    ogImage: `${BASE_URL}/assets/og-home.jpg`,
    contentHtml: `
      <div id="static-prerender-wrapper" class="bg-slate-950 text-slate-100 min-h-screen font-sans">
        <main class="max-w-7xl mx-auto px-4 py-8 space-y-8">
          <header class="space-y-4">
            <span class="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">${es.hero?.badge || 'Atención Inmobiliaria 24/7 en WhatsApp y Web'}</span>
            <h1 class="text-3xl sm:text-5xl font-black tracking-tight text-white">${es.hero?.title1 || 'Nunca pierdas otro lead inmobiliario'} ${es.hero?.title2 || 'por tardar en responder'}</h1>
            <p class="text-slate-300 text-sm sm:text-base max-w-2xl">${es.hero?.subtitle || 'Aria Prop atiende a tus prospectos al instante, responde consultas sobre tus inmuebles, cualifica su presupuesto y agenda visitas directamente en tu calendario las 24 horas del día.'}</p>
          </header>
          <section class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div class="p-5 rounded-2xl bg-slate-900 border border-white/10 space-y-2">
              <h2 class="text-base font-bold text-emerald-400">Atención Inmobiliaria Inmediata</h2>
              <ul class="space-y-1.5 text-slate-300">
                <li>• <strong>Respuesta en &lt; 5 segundos:</strong> Calificación instantánea de presupuesto y tipo de inmueble.</li>
                <li>• <strong>Sincronización RAG:</strong> Conexión con catálogo directo de propiedades y memorias técnicas PDF.</li>
                <li>• <strong>Integraciones CRM:</strong> Tokko Broker, EasyBroker, WhatsApp API y Google Calendar.</li>
              </ul>
            </div>
            <div class="p-5 rounded-2xl bg-slate-900 border border-white/10 space-y-2">
              <h2 class="text-base font-bold text-emerald-400">Infraestructura Verificada & Seguridad</h2>
              <p class="text-slate-300">${es.hero?.socialProof || 'Respuesta inmediata en < 5s • Coordinación en Google Calendar • Integración CRM'}</p>
              <div class="pt-2 text-xs text-emerald-400 font-semibold">• ${es.footer?.rgpd || 'Conexión Segura HTTPS / TLS & Privacidad'}</div>
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
    description: 'Planes flexibles y transparentes para agencias independientes, agencias boutique y empresas desarrolladoras.',
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
            <h2 class="text-base font-bold text-emerald-400">Planes de Licencia: Solo Agent ($29/mes), Agency Pro ($79/mes) y Enterprise (A Medida)</h2>
            <ul class="space-y-1.5 text-slate-300">
              <li>• Atención 24/7 en WhatsApp y Web.</li>
              <li>• Leads cualificados y agendamiento directo.</li>
              <li>• Sincronización con Tokko Broker y EasyBroker.</li>
              <li>• Integración con Google Calendar y Cifrado HTTPS/TLS.</li>
            </ul>
          </section>
        </main>
      </div>
    `,
  },
  {
    path: '/recursos',
    title: 'Recursos, Documentación RAG & Preguntas Frecuentes | Aria Prop',
    description: 'Guías completas de integración, preguntas frecuentes sobre seguridad y privacidad de datos.',
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
              <p><strong>¿Cómo se resguardan mis datos?</strong> Conexión segura HTTPS / TLS con cifrado en tránsito y resguardo privado por agencia.</p>
              <p><strong>¿Con qué CRMs se conecta?</strong> Integración directa con Tokko Broker, EasyBroker, WhatsApp y Google Calendar.</p>
            </div>
          </section>
        </main>
      </div>
    `,
  },
];

function injectSemanticHtml(html, title, description, ogTitle, ogDescription, ogImage, contentHtml) {
  let modifiedHtml = html;

  // Replace <title>
  modifiedHtml = modifiedHtml.replace(
    /<title>.*?<\/title>/gi,
    `<title>${title}</title>`
  );

  // Replace or add <meta name="description">
  const metaDescriptionRegex = /<meta\s+name="description"\s+content=".*?"\s*\/?>/gi;
  if (metaDescriptionRegex.test(modifiedHtml)) {
    modifiedHtml = modifiedHtml.replace(
      metaDescriptionRegex,
      `<meta name="description" content="${description}">`
    );
  } else {
    modifiedHtml = modifiedHtml.replace(
      '</head>',
      `  <meta name="description" content="${description}">\n</head>`
    );
  }

  // Replace OpenGraph Meta Tags
  modifiedHtml = modifiedHtml.replace(
    /<meta\s+property="og:title"\s+content=".*?"\s*\/?>/gi,
    `<meta property="og:title" content="${ogTitle}">`
  );
  modifiedHtml = modifiedHtml.replace(
    /<meta\s+property="og:description"\s+content=".*?"\s*\/?>/gi,
    `<meta property="og:description" content="${ogDescription}">`
  );

  // Inject contentHtml into <div id="root"></div>
  const rootDivRegex = /<div\s+id="root">\s*<\/div>/gi;
  if (rootDivRegex.test(modifiedHtml)) {
    modifiedHtml = modifiedHtml.replace(
      rootDivRegex,
      `<div id="root">${contentHtml}</div>`
    );
  } else {
    console.warn('⚠️ Warning: <div id="root"></div> not found for replacement');
  }

  return modifiedHtml;
}

async function prerender() {
  const indexHtmlPath = path.join(DIST_DIR, 'index.html');
  if (!fs.existsSync(indexHtmlPath)) {
    console.error('❌ Error: dist/index.html not found. Run vite build first.');
    process.exit(1);
  }

  const baseTemplateHtml = fs.readFileSync(indexHtmlPath, 'utf-8');

  for (const route of PUBLIC_ROUTES) {
    const prerenderedHtml = injectSemanticHtml(
      baseTemplateHtml,
      route.title,
      route.description,
      route.ogTitle,
      route.ogDescription,
      route.ogImage,
      route.contentHtml
    );

    let targetFilePath;
    if (route.path === '/') {
      targetFilePath = indexHtmlPath;
    } else {
      const routeSubdir = path.join(DIST_DIR, route.path.replace(/^\//, ''));
      if (!fs.existsSync(routeSubdir)) {
        fs.mkdirSync(routeSubdir, { recursive: true });
      }
      targetFilePath = path.join(routeSubdir, 'index.html');
    }

    fs.writeFileSync(targetFilePath, prerenderedHtml, 'utf-8');
    console.log(`✅ Prerendered: ${route.path} -> ${targetFilePath}`);
  }

  console.log('🎉 SSG Prerendering Completed Successfully with Dynamic Single-Source-of-Truth Copy!');
}

prerender();

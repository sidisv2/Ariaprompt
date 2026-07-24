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
      <main class="static-seo-prerender">
        <header>
          <h1>Aria Prop: El Asistente Virtual 24/7 para Agencias Inmobiliarias</h1>
          <p>Captura, cualifica y agenda visitas con compradores e inversionistas en tiempo real sin perder prospectos fuera de horario.</p>
        </header>
        <section>
          <h2>Atención Inmobiliaria Inmediata en América</h2>
          <ul>
            <li><strong>Respuesta en &lt; 5 segundos:</strong> Calificación instantánea de presupuesto y tipo de inmueble.</li>
            <li><strong>Sincronización RAG:</strong> Conexión con catálogo directo de propiedades y memorias técnicas PDF.</li>
            <li><strong>Integraciones CRM:</strong> Tokko Broker, EasyBroker, WhatsApp API y Google Calendar.</li>
          </ul>
        </section>
        <section>
          <h2>Confían más de 500+ Agencias Inmobiliarias en LATAM</h2>
          <p>Aumenta un +85% las visitas agendadas y reduce el tiempo de respuesta de horas a segundos.</p>
        </section>
      </main>
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
      <main class="static-seo-prerender">
        <header>
          <h1>Motor RAG e Inteligencia Artificial Inmobiliaria</h1>
          <p>Aria Prop analiza catálogos complejos, documentos técnicos y responde a compradores con máxima precisión.</p>
        </header>
        <section>
          <h2>Capacidades del Sistema Aria AI</h2>
          <ul>
            <li><strong>Cualificación Automática de Leads:</strong> Score de 0 a 100 basado en presupuesto, plazo de compra y urgencia.</li>
            <li><strong>Cálculo de ROI y Cap Rate:</strong> Estimación de rentabilidad anual y proyección de flujo de caja a 5 años.</li>
            <li><strong>Búsqueda RAG de Memorias Técnicas:</strong> Extracción de metrajes, acabados y planos desde dossieres PDF.</li>
          </ul>
        </section>
      </main>
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
      <main class="static-seo-prerender">
        <header>
          <h1>Soluciones de IA para el Sector Inmobiliario</h1>
          <p>Aumenta tus conversiones y brinda atención personalizada a cada perfil de comprador.</p>
        </header>
        <section>
          <h2>Para Agencias de Corretaje</h2>
          <p>Atención 24/7 en WhatsApp y sitios web. Filtra curiosos y deriva solo compradores calificados a tu equipo humano.</p>
          <h2>Para Desarrolladores & Promotoras</h2>
          <p>Presentación interactiva de planos, renders y memorias de calidades de nuevos desarrollos.</p>
          <h2>Para Inversionistas</h2>
          <p>Análisis ejecutivo de plusvalía, Cap Rate y comparativas de mercado en tiempo real.</p>
        </section>
      </main>
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
      <main class="static-seo-prerender">
        <header>
          <h1>Planes y Precios Transparentes</h1>
          <p>Sin tarjeta obligatoria. Configura tu agente inteligente en menos de 3 minutos.</p>
        </header>
        <section>
          <h2>Licencia Pro LATAM & Agencias</h2>
          <ul>
            <li>Atención 24/7 en WhatsApp y Web.</li>
            <li>Leads ilimitados y cualificación automática.</li>
            <li>Sincronización con Tokko Broker y EasyBroker.</li>
            <li>Integración con Google Calendar.</li>
          </ul>
        </section>
      </main>
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
      <main class="static-seo-prerender">
        <header>
          <h1>Recursos y Preguntas Frecuentes</h1>
          <p>Todo lo que necesitas saber para escalar la atención de tu agencia con inteligencia artificial.</p>
        </header>
        <section>
          <h2>Preguntas Frecuentes (FAQ)</h2>
          <h3>¿Cómo se conecta Aria Prop a mi CRM?</h3>
          <p>Se integra de forma directa mediante API Keys oficiales con Tokko Broker, EasyBroker o vía Webhooks.</p>
          <h3>¿Es seguro el manejo de datos?</h3>
          <p>Cuenta con cifrado SSL de 256 bits y pleno cumplimiento de normativas RGPD y protección de datos personal.</p>
        </section>
      </main>
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

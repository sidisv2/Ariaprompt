import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.resolve(__dirname, '../dist');
const BASE_URL = 'https://ariaprop.online';

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
    ogDescription: es.hero?.subtitle || 'Responde a tus prospectos al instante, califica presupuesto y coordina citas directo en Google Calendar.',
    ogImage: `${BASE_URL}/assets/og-home.jpg`,
    contentHtml: `
      <div id="static-prerender-wrapper" class="bg-slate-950 text-slate-100 min-h-screen font-sans">
        <main class="max-w-7xl mx-auto px-4 py-8 space-y-8">
          <header class="space-y-4">
            <span class="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">${es.hero?.badge || 'Atención Inmobiliaria 24/7 en WhatsApp y Web'}</span>
            <h1 class="text-3xl sm:text-5xl font-black tracking-tight text-white">${es.hero?.title1 || 'Aria Prop responde al instante por vos,'} ${es.hero?.title2 || 'así ningún lead se enfría'}</h1>
            <p class="text-slate-300 text-sm sm:text-base max-w-2xl">${es.hero?.subtitle || 'Atendé consultas de inmuebles las 24 horas en WhatsApp y Web. Cualificá presupuesto y agendá visitas automáticamente en tu calendario sin mover un dedo.'}</p>
            <div class="pt-2">
              <span class="inline-block px-6 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-black text-sm">${es.hero?.ctaPrimary || 'Creá tu primer asistente de ventas gratis'}</span>
            </div>
          </header>
          <section class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div class="p-5 rounded-2xl bg-slate-900 border border-white/10 space-y-2">
              <h2 class="text-base font-bold text-emerald-400">Atención Inmobiliaria Inmediata</h2>
              <ul class="space-y-1.5 text-slate-300">
                <li>• <strong>Respuesta en Segundos:</strong> Calificación instantánea de presupuesto y tipo de inmueble.</li>
                <li>• <strong>Sincronización de Catálogo:</strong> Conexión directa con Tokko Broker, EasyBroker e inventario real de la agencia.</li>
                <li>• <strong>Integraciones CRM:</strong> Tokko Broker, EasyBroker, WhatsApp API y Google Calendar.</li>
              </ul>
            </div>
            <div class="p-5 rounded-2xl bg-slate-900 border border-white/10 space-y-2">
              <h2 class="text-base font-bold text-emerald-400">Infraestructura Verificada & Seguridad</h2>
              <p class="text-slate-300">${es.hero?.socialProof || 'Respuesta inmediata en segundos • Coordinación en Google Calendar • Integración CRM'}</p>
              <div class="pt-2 text-xs text-emerald-400 font-semibold">• ${es.footer?.rgpd || 'Conexión Segura HTTPS / TLS & Privacidad'}</div>
            </div>
          </section>
        </main>
      </div>
    `,
  },
  {
    path: '/app',
    title: 'Asistente IA 24/7 & Workspace Inmobiliario | Aria Prop',
    description: 'Atiende a tus prospectos las 24 horas del día, responde sus dudas sobre tus inmuebles y agenda visitas en tu calendario automáticamente con el Asistente IA 24/7 de Aria Prop.',
    ogTitle: 'Asistente IA 24/7 & Atención Inmobiliaria | Aria Prop',
    ogDescription: 'Responde a tus prospectos al instante en WhatsApp y Web, cualifica su presupuesto y coordino visitas en tu calendario.',
    ogImage: `${BASE_URL}/assets/og-app.jpg`,
    contentHtml: `
      <div id="static-prerender-wrapper" class="bg-slate-950 text-slate-100 min-h-screen font-sans">
        <main class="max-w-7xl mx-auto px-4 py-8 space-y-8">
          <header class="space-y-4">
            <span class="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">Asistente IA 24/7 en Vivo</span>
            <h1 class="text-3xl sm:text-5xl font-black tracking-tight text-white">Atención Inmobiliaria Inmediata y Respuesta a Leads 24/7</h1>
            <p class="text-slate-300 text-sm sm:text-base max-w-2xl">Aria Prop atiende a tus prospectos las 24 horas del día, responde sus dudas sobre tus inmuebles y agenda visitas en tu calendario para que vos te enfoques en cerrar operaciones.</p>
          </header>
          <section class="p-6 rounded-2xl bg-slate-900 border border-white/10 space-y-4">
            <h2 class="text-lg font-bold text-emerald-400">Atención Comercial & Cualificación Inmediata</h2>
            <ul class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
              <li class="p-3 rounded-xl bg-slate-950 border border-white/5">• <strong>Respuesta en Segundos:</strong> Atención al instante en WhatsApp y Web sin hacer esperar a los prospectos.</li>
              <li class="p-3 rounded-xl bg-slate-950 border border-white/5">• <strong>Agendamiento Automático:</strong> Coordinación de visitas guiadas directo en Google Calendar.</li>
              <li class="p-3 rounded-xl bg-slate-950 border border-white/5">• <strong>Cualificación de Leads:</strong> Filtro inteligente de presupuesto, urgencia y tipo de inmueble.</li>
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
            <h2 class="text-base font-bold text-emerald-400">Planes de Licencia: Solo Agent ($35/mes), Agency Pro ($99/mes) y Desarrolladores</h2>
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
    title: 'Recursos, Documentación & Preguntas Frecuentes | Aria Prop',
    description: 'Guías completas de integración, preguntas frecuentes sobre seguridad y privacidad de datos.',
    ogTitle: 'Recursos & Centro de Ayuda | Aria Prop',
    ogDescription: 'Aprende a integrar tu CRM, vincular tu catálogo e inventario y maximizar la cualificación de tus prospectos.',
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
  {
    path: '/terminos',
    title: 'Términos de Servicio | Aria Prop AI',
    description: 'Términos y condiciones de uso de la plataforma de IA inmobiliaria Aria Prop. Procesamiento de facturación vía Paddle.',
    ogTitle: 'Términos de Servicio | Aria Prop',
    ogDescription: 'Condiciones de servicio y modelo de facturación B2B procesado por Paddle.com.',
    ogImage: `${BASE_URL}/assets/og-home.jpg`,
    contentHtml: `
      <div id="static-prerender-wrapper" class="bg-slate-950 text-slate-100 min-h-screen font-sans">
        <main class="max-w-4xl mx-auto px-4 py-8 space-y-6">
          <h1 class="text-3xl font-black text-white">Términos de Servicio</h1>
          <p class="text-slate-300">Términos de uso de la plataforma Aria Prop provista por Valentin Lautaro Morales (CUIT 20-46398072-2, San Rafael, Argentina). Las suscripciones son facturadas y procesadas de forma segura a través de Paddle.com (nuestro Merchant of Record).</p>
          <div class="p-6 rounded-2xl bg-slate-900 border border-white/10 space-y-4">
            <h2 class="text-lg font-bold text-emerald-400">Facturación & Entidad Legal</h2>
            <p class="text-slate-300">Titular Legal: Valentin Lautaro Morales • CUIT 20-46398072-2 • Dirección Fiscal: San Rafael, Argentina. Procesamiento de cobros realizado por Paddle.com Market Ltd.</p>
          </div>
        </main>
      </div>
    `,
  },
  {
    path: '/privacidad',
    title: 'Política de Privacidad | Aria Prop AI',
    description: 'Política de privacidad, resguardo de datos de inventario inmobiliario y cifrado SSL/TLS 256-bit.',
    ogTitle: 'Política de Privacidad | Aria Prop',
    ogDescription: 'Aislamiento de RLS por agencia en Supabase y procesamiento seguro vía Paddle.',
    ogImage: `${BASE_URL}/assets/og-home.jpg`,
    contentHtml: `
      <div id="static-prerender-wrapper" class="bg-slate-950 text-slate-100 min-h-screen font-sans">
        <main class="max-w-4xl mx-auto px-4 py-8 space-y-6">
          <h1 class="text-3xl font-black text-white">Política de Privacidad</h1>
          <p class="text-slate-300">Resguardo privado de datos, cifrado SSL/TLS 256-bit y políticas de Row Level Security (RLS) por agencia. Responsable del tratamiento de datos: Valentin Lautaro Morales (CUIT 20-46398072-2, San Rafael, Argentina).</p>
          <div class="p-6 rounded-2xl bg-slate-900 border border-white/10 space-y-4">
            <h2 class="text-lg font-bold text-emerald-400">Protección de Datos & Responsable Legal</h2>
            <p class="text-slate-300">Titular Responsable: Valentin Lautaro Morales • CUIT 20-46398072-2 • San Rafael, Argentina. Los datos de pago son procesados directamente por Paddle.com.</p>
          </div>
        </main>
      </div>
    `,
  },
  {
    path: '/reembolsos',
    title: 'Política de Reembolso & Cancelación | Aria Prop AI',
    description: 'Garantía de reembolso de 14 días y cancelación de suscripción en 1 clic procesada por Paddle.',
    ogTitle: 'Política de Reembolso | Aria Prop',
    ogDescription: 'Garantía de devolución de 14 días y cancelación sin comisiones ni cargos adicionales.',
    ogImage: `${BASE_URL}/assets/og-home.jpg`,
    contentHtml: `
      <div id="static-prerender-wrapper" class="bg-slate-950 text-slate-100 min-h-screen font-sans">
        <main class="max-w-4xl mx-auto px-4 py-8 space-y-6">
          <h1 class="text-3xl font-black text-white">Política de Reembolso y Cancelación</h1>
          <p class="text-slate-300">Garantía de reembolso de 14 días para servicios provistos por Valentin Lautaro Morales (CUIT 20-46398072-2, San Rafael, Argentina). Reembolsos procesados automáticamente por Paddle.com hacia su medio de pago original.</p>
          <div class="p-6 rounded-2xl bg-slate-900 border border-white/10 space-y-4">
            <h2 class="text-lg font-bold text-emerald-400">Cancelación Transparente & Titular Legal</h2>
            <p class="text-slate-300">Titular Legal: Valentin Lautaro Morales • CUIT 20-46398072-2 • San Rafael, Argentina. Cancele en cualquier momento desde su panel. Para reembolsos: pagos@ariaprop.online.</p>
          </div>
        </main>
      </div>
    `,
  },
  {
    path: '/checkout/success',
    title: '¡Suscripción Activada Con Éxito! | Aria Prop AI',
    description: 'Confirmación de pago de suscripción en Aria Prop. Tu Asistente IA Comercial está listo.',
    ogTitle: '¡Pago Confirmado! | Aria Prop',
    ogDescription: 'Confirmación de suscripción activa y acceso al Workspace Inmobiliario.',
    ogImage: `${BASE_URL}/assets/og-home.jpg`,
    contentHtml: `
      <div id="static-prerender-wrapper" class="bg-slate-950 text-slate-100 min-h-screen font-sans">
        <main class="max-w-4xl mx-auto px-4 py-8 space-y-6 text-center">
          <h1 class="text-3xl font-black text-white">¡Suscripción Activada Con Éxito!</h1>
          <p class="text-slate-300">Gracias por contratar Aria Prop. Tu plan está activo y listo para usar en tu Workspace.</p>
        </main>
      </div>
    `,
  },
  {
    path: '/dashboard/integrations',
    title: 'Conexión de CRM (Tokko Broker & EasyBroker) | Aria Prop Workspace',
    description: 'Conecta tu catálogo de propiedades directamente desde Tokko Broker o EasyBroker con la IA 24/7 de Aria Prop.',
    ogTitle: 'Integraciones CRM | Aria Prop',
    ogDescription: 'Sincronización automática de inventario inmobiliario desde Tokko Broker y EasyBroker.',
    ogImage: `${BASE_URL}/assets/og-app.jpg`,
    contentHtml: `<div id="static-prerender-wrapper" class="bg-slate-950 text-slate-100 min-h-screen font-sans"><main class="max-w-7xl mx-auto px-4 py-8"><h1 class="text-2xl font-bold text-white">Integraciones CRM & Partners</h1></main></div>`,
  },
  {
    path: '/dashboard/metrics',
    title: 'Panel de Métricas & Rendimiento | Aria Prop Workspace',
    description: 'Monitorea conversaciones de IA, leads cualificados y ROI inmobiliario en tiempo real.',
    ogTitle: 'Métricas Workspace | Aria Prop',
    ogDescription: 'Resumen ejecutivo de atención comercial 24/7 y visitas agendadas.',
    ogImage: `${BASE_URL}/assets/og-app.jpg`,
    contentHtml: `<div id="static-prerender-wrapper" class="bg-slate-950 text-slate-100 min-h-screen font-sans"><main class="max-w-7xl mx-auto px-4 py-8"><h1 class="text-2xl font-bold text-white">Panel de Métricas</h1></main></div>`,
  },
  {
    path: '/dashboard/properties',
    title: 'Catálogo de Inmuebles | Aria Prop Workspace',
    description: 'Administra tu catálogo de inmuebles e inventario directo.',
    ogTitle: 'Inventario de Propiedades | Aria Prop',
    ogDescription: 'Gestión de catálogo inmobiliario para atención automatizada.',
    ogImage: `${BASE_URL}/assets/og-app.jpg`,
    contentHtml: `<div id="static-prerender-wrapper" class="bg-slate-950 text-slate-100 min-h-screen font-sans"><main class="max-w-7xl mx-auto px-4 py-8"><h1 class="text-2xl font-bold text-white">Catálogo de Inmuebles</h1></main></div>`,
  },
  {
    path: '/dashboard/leads',
    title: 'Leads & Prospectos Cualificados | Aria Prop Workspace',
    description: 'Gestión de prospectos cualificados y seguimiento de citas agendadas.',
    ogTitle: 'Gestión de Leads | Aria Prop',
    ogDescription: 'Prospectos con presupuesto verificado por la IA de Aria Prop.',
    ogImage: `${BASE_URL}/assets/og-app.jpg`,
    contentHtml: `<div id="static-prerender-wrapper" class="bg-slate-950 text-slate-100 min-h-screen font-sans"><main class="max-w-7xl mx-auto px-4 py-8"><h1 class="text-2xl font-bold text-white">Leads & Prospectos</h1></main></div>`,
  },
  {
    path: '/dashboard/bot-config',
    title: 'Configuración del Agente IA 24/7 | Aria Prop Workspace',
    description: 'Personaliza las respuestas, el tono y los parámetros de atención de tu asistente comercial.',
    ogTitle: 'Configuración del Agente | Aria Prop',
    ogDescription: 'Ajuste de prompt, reglas comerciales e integraciones de WhatsApp.',
    ogImage: `${BASE_URL}/assets/og-app.jpg`,
    contentHtml: `<div id="static-prerender-wrapper" class="bg-slate-950 text-slate-100 min-h-screen font-sans"><main class="max-w-7xl mx-auto px-4 py-8"><h1 class="text-2xl font-bold text-white">Configuración del Agente</h1></main></div>`,
  },
  {
    path: '/dashboard/checkout',
    title: 'Suscripción & Plan | Aria Prop Workspace',
    description: 'Gestiona tu plan de facturación y límites de catálogo de Aria Prop.',
    ogTitle: 'Facturación & Suscripción | Aria Prop',
    ogDescription: 'Planes Solo Agent y Agency Pro.',
    ogImage: `${BASE_URL}/assets/og-pricing.jpg`,
    contentHtml: `<div id="static-prerender-wrapper" class="bg-slate-950 text-slate-100 min-h-screen font-sans"><main class="max-w-7xl mx-auto px-4 py-8"><h1 class="text-2xl font-bold text-white">Facturación & Plan</h1></main></div>`,
  },
  {
    path: '/dashboard/profile',
    title: 'Perfil de Agencia | Aria Prop Workspace',
    description: 'Información institucional de la inmobiliaria partner.',
    ogTitle: 'Perfil de Agencia | Aria Prop',
    ogDescription: 'Datos institucionales de tu inmobiliaria.',
    ogImage: `${BASE_URL}/assets/og-app.jpg`,
    contentHtml: `<div id="static-prerender-wrapper" class="bg-slate-950 text-slate-100 min-h-screen font-sans"><main class="max-w-7xl mx-auto px-4 py-8"><h1 class="text-2xl font-bold text-white">Perfil de Agencia</h1></main></div>`,
  },
  {
    path: '/user/vault',
    title: 'Bóveda de Credenciales & Seguridad | Aria Prop Workspace',
    description: 'Resguardo de credenciales y claves de API de servicios conectados.',
    ogTitle: 'Bóveda de Credenciales | Aria Prop',
    ogDescription: 'Seguridad y cifrado de llaves de API.',
    ogImage: `${BASE_URL}/assets/og-app.jpg`,
    contentHtml: `<div id="static-prerender-wrapper" class="bg-slate-950 text-slate-100 min-h-screen font-sans"><main class="max-w-7xl mx-auto px-4 py-8"><h1 class="text-2xl font-bold text-white">Bóveda de Credenciales</h1></main></div>`,
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

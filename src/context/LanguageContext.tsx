import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'es' | 'en';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  es: {
    // Header & Nav
    'nav.product': 'Aria AI',
    'nav.howItWorks': 'Cómo funciona',
    'nav.pricing': 'Precios',
    'nav.faq': 'FAQ',
    'nav.login': 'Acceso',
    'nav.signup': 'Agendar demo',
    'nav.panel': 'Panel',

    // Hero
    'hero.badge': 'Aria Prop: Agente de IA Inmobiliario 24/7',
    'hero.title1': 'Nunca pierdas otro',
    'hero.title2': 'lead inmobiliario',
    'hero.subtitle': 'Aria Prop atiende a tus prospectos en menos de 5 segundos, cualifica su presupuesto y agenda visitas a tus inmuebles 24/7 en WhatsApp y Web.',
    'hero.socialProof': 'Más de 50.000 prospectos calificados con',
    'hero.ctaPrimary': 'Agendar demo gratis',
    'hero.ctaSecondary': 'Ver cómo funciona',
    'hero.trust1': 'Respuesta en menos de 5s',
    'hero.trust2': 'Integrado a WhatsApp & Calendar',
    'hero.trust3': 'Sin tarjeta de crédito requerida',

    // Hero Prompt Assistant
    'prompt.placeholder': '¿Qué necesitas que Aria resuelva hoy?',
    'prompt.quickAction': 'Acciones rápidas:',
    'prompt.chip1': 'Calificar un lead',
    'prompt.chip2': 'Agendar una visita',
    'prompt.chip3': 'Responder por WhatsApp',
    'prompt.chip4': 'Dar seguimiento a un cliente',

    // Prompts content
    'prompt.userDefault': 'Hola, busco departamento de 2 dormitorios en Belgrano con presupuesto de $180.000 USD',
    'prompt.aiDefault': '¡Hola! Excelente elección. Tengo 2 inmuebles en Belgrano que se ajustan perfecto a tu presupuesto. Calificación: Lead de Alta Intención (Score 98/100).',
    'prompt.metricDefault': 'Visita Agendada • Mañana 16:30 hs',

    'prompt.user1': '¿Qué presupuesto y plazo de compra tiene el lead de la Casa en Nordelta?',
    'prompt.ai1': 'Analizando conversación: El comprador dispone de $340.000 USD al contado, busca escriturar en 30 días y necesita cochera doble.',
    'prompt.metric1': 'Lead Aprobado (VIP)',

    'prompt.user2': 'Quiero agendar una visita presencial para este jueves por la tarde.',
    'prompt.ai2': '¡Visita coordinada! He reservado el jueves a las 17:00 hs en tu Google Calendar y le envié la ubicación exacta por WhatsApp al cliente.',
    'prompt.metric2': 'Confirmado en Calendario',

    'prompt.user3': 'Un cliente preguntó a las 3:00 AM si el departamento acepta mascotas.',
    'prompt.ai3': 'Aria respondió a las 3:00:04 AM: "¡Hola Marcos! Sí, el edificio acepta mascotas de hasta 15kg. ¿Te gustaría agendar una visita para mañana?"',
    'prompt.metric3': 'Respuesta en 4 segundos ⚡',

    'prompt.user4': '¿Qué pasó con el prospecto que vio el PH en Palermo la semana pasada?',
    'prompt.ai4': 'Re-contacté a Sofía ayer. Mantiene el interés pero solicita rebaja del 3%. ¿Quieres que te reserve cita para evaluar la contraoferta?',
    'prompt.metric4': 'Lead Re-activado',

    // Trust / Social proof
    'proof.agencies': 'Confían más de 120+ Agencias Inmobiliarias Líderes en España y LATAM',
    'proof.metric1': '+500 Leads Calificados',
    'proof.sub1': 'por mes por agencia',
    'proof.metric2': 'Respuesta en < 5s',
    'proof.sub2': 'vía WhatsApp y Web',
    'proof.metric3': 'Disponible 24/7',
    'proof.sub3': 'atención fuera de horario',
    'proof.metric4': '+85% Visitas Agendadas',
    'proof.sub4': 'directo a Google Calendar',

    // Problem
    'problem.badge': 'El Dolor Real de las Agencias Inmobiliarias',
    'problem.title': '¿Cuántas comisiones estás perdiendo por no responder a tiempo?',
    'problem.subtitle': 'La falta de respuesta inmediata y la cualificación lenta son las principales razones por las que las agencias pierden hasta el 40% de sus potenciales compradores.',
    'problem.card1Tag': '67% Fuera de Horario',
    'problem.card1Title': 'Los leads buscan de noche y en fines de semana',
    'problem.card1Desc': 'El comprador inmobiliario promedio consulta inmuebles después de trabajar. Sin atención 24/7, esos prospectos se van con la competencia.',
    'problem.card2Tag': 'Tiempos Lentos',
    'problem.card2Title': 'Tardarte 15 minutos desploma la conversión un 80%',
    'problem.card2Desc': 'En bienes raíces, el primero en responder califica y agenda la visita. Si tardas horas en enviar la ficha, pierdes la comisión.',
    'problem.card3Tag': 'Seguimiento Manual',
    'problem.card3Title': 'Horas perdidas respondiendo lo mismo',
    'problem.card3Desc': 'Tus agentes dedican el 60% de su jornada contestando preguntas repetitivas sobre m², precios y cocheras, en lugar de estar cerrando ventas.',
    'problem.cta': 'Solucionar esto ahora con Aria Prop',

    // How it works
    'how.badge': 'Flujo Automatizado en 4 Pasos',
    'how.title': '¿Cómo funciona Aria Prop?',
    'how.subtitle': 'De la primera consulta a la firma del contrato: automatiza el 80% del trabajo pesado de captación e interactúa con tus compradores en tiempo récord.',
    'how.step1Title': 'El lead escribe en tu web o WhatsApp',
    'how.step1Desc': 'El comprador potencial consulta sobre un inmueble a cualquier hora (incluso a las 2 AM).',
    'how.step2Title': 'Aria Prop responde y cualifica en < 5s',
    'how.step2Desc': 'Analiza su presupuesto, número de habitaciones y evalúa si es un cliente con intención real de compra.',
    'how.step3Title': 'Agenda la visita en tu calendario',
    'how.step3Desc': 'Propone automáticamente horarios disponibles y coordina la visita presencial sin fricción.',
    'how.step4Title': 'Tu equipo humano cierra la venta',
    'how.step4Desc': 'El asesor recibe el expediente cualificado del cliente listo para mostrar el inmueble y firmar.',
    'how.cta': 'Ver demo interactiva en vivo',

    // Interactive Demo Section
    'demo.badge': 'Demostración Interactiva en Vivo',
    'demo.title': 'Prueba a Aria Prop en tiempo real',
    'demo.subtitle': 'Experimenta exactamente cómo interactúa el agente de IA con un comprador interesado en tus inmuebles.',
    'demo.tab1': 'Simulador Interactivo',
    'demo.tab2': 'Video Demo (1 min)',
    'demo.videoTitle': 'Ver a Aria Prop Agendando una Visita en WhatsApp',
    'demo.videoDesc': 'Demostración de 60 segundos de un flujo completo: desde el saludo nocturno hasta la confirmación en Google Calendar.',

    // Testimonials
    'test.badge': 'Casos de Éxito & Resultados Comprobados',
    'test.title': 'Lo que dicen las agencias líderes en LATAM',
    'test.subtitle': 'Resultados medibles en tasa de conversión, visitas agendadas y facturación directa.',

    // Trust & Security Seals
    'seal.badge': 'Seguridad & Privacidad Nivel Enterprise',
    'seal.title': 'Tu información inmobiliaria protegida bajo los más altos estándares',
    'seal.seal1Title': 'Encriptación AES-256',
    'seal.seal1Desc': 'Seguridad bancaria en todas las conversaciones y datos de clientes.',
    'seal.seal2Title': 'Cumplimiento RGPD / GDPR',
    'seal.seal2Desc': 'Protección estricta de datos personales de compradores e inmuebles.',
    'seal.seal3Title': '99.9% Uptime SLA',
    'seal.seal3Desc': 'Infraestructura redundante en la nube activa 24/7/365 sin caídas.',
    'seal.seal4Title': 'Aislamiento por Tenant',
    'seal.seal4Desc': 'Tus credenciales y bases de datos aisladas e inaccesibles por terceros.',

    // Integrations
    'integ.badge': 'Ecosistema de Integraciones Nativas',
    'integ.title': 'Se conecta directamente con las herramientas que ya utilizas',
    'integ.subtitle': 'Sin cambiar tu flujo de trabajo. Aria Prop se integra en minutos con tus portales, WhatsApp y CRM inmobiliario.',
    'integ.banner': 'Encriptación AES-256 bits • Cumplimiento estricto de RGPD / GDPR para protección de datos personales',

    // Final CTA
    'cta.badge': 'Transforma tu Operación Inmobiliaria Hoy',
    'cta.title1': '¿Listo para automatizar tus visitas y',
    'cta.title2': 'multiplicar tus ventas',
    'cta.subtitle': 'Comienza en menos de 24 horas. Configura tu agente de IA, sube tus dossiers inmobiliarios y recibe leads calificados directamente en tu agenda.',
    'cta.primary': 'Agendar demo gratis',
    'cta.secondary': 'Cotizar implementación Enterprise',
    'cta.trust1': 'Sin tarjeta de crédito requerida',
    'cta.trust2': 'Implementación en menos de 24h',
    'cta.trust3': 'Soporte preferencial en español',

    // Footer
    'footer.rights': 'Todos los derechos reservados. Impulsado por Aria AI Engine.',

    // Auth Modal
    'auth.loginTab': 'Iniciar Sesión',
    'auth.signupTab': 'Crear Cuenta',
    'auth.emailLabel': 'Correo electrónico',
    'auth.emailPlaceholder': 'tu@agencia.com',
    'auth.passLabel': 'Contraseña',
    'auth.passPlaceholder': 'Mínimo 6 caracteres',
    'auth.nameLabel': 'Nombre completo',
    'auth.namePlaceholder': 'Carlos Mendoza',
    'auth.errEmail': 'Por favor ingresa un correo electrónico válido (ej: usuario@agencia.com).',
    'auth.errPass': 'La contraseña debe tener al menos 6 caracteres por seguridad.',
    'auth.errCreds': 'Correo o contraseña incorrectos. Verifica tus datos.',
    'auth.btnSubmitLogin': 'Acceder a mi panel',
    'auth.btnSubmitSignup': 'Comenzar prueba gratis',
    'auth.google': 'Continuar con Google',
  },
  en: {
    // Header & Nav
    'nav.product': 'Aria AI',
    'nav.howItWorks': 'How it works',
    'nav.pricing': 'Pricing',
    'nav.faq': 'FAQ',
    'nav.login': 'Log in',
    'nav.signup': 'Book demo',
    'nav.panel': 'Dashboard',

    // Hero
    'hero.badge': 'Aria Prop: 24/7 Real Estate AI Agent',
    'hero.title1': 'Never lose another',
    'hero.title2': 'real estate lead',
    'hero.subtitle': 'Aria Prop answers your prospects in under 5 seconds, qualifies their budget, and schedules property visits 24/7 on WhatsApp and Web.',
    'hero.socialProof': 'Over 50,000 qualified leads with',
    'hero.ctaPrimary': 'Book free demo',
    'hero.ctaSecondary': 'See how it works',
    'hero.trust1': 'Response in under 5 seconds',
    'hero.trust2': 'Integrated with WhatsApp & Calendar',
    'hero.trust3': 'No credit card required',

    // Hero Prompt Assistant
    'prompt.placeholder': 'What do you need Aria to solve today?',
    'prompt.quickAction': 'Quick actions:',
    'prompt.chip1': 'Qualify a lead',
    'prompt.chip2': 'Schedule a visit',
    'prompt.chip3': 'Reply via WhatsApp',
    'prompt.chip4': 'Follow up with a client',

    // Prompts content
    'prompt.userDefault': 'Hi, looking for a 2-bedroom apartment in Belgrano with a $180,000 USD budget',
    'prompt.aiDefault': 'Hello! Excellent choice. I have 2 properties matching your budget perfectly. Score: High-Intent Lead (98/100).',
    'prompt.metricDefault': 'Visit Scheduled • Tomorrow 4:30 PM',

    'prompt.user1': 'What is the budget and purchase timeframe for the Nordelta house lead?',
    'prompt.ai1': 'Analyzing chat: Buyer has $340,000 USD cash, wants to close within 30 days and requires a double garage.',
    'prompt.metric1': 'Lead Approved (VIP)',

    'prompt.user2': 'I want to schedule an in-person visit for this Thursday afternoon.',
    'prompt.ai2': 'Visit coordinated! I reserved Thursday at 5:00 PM in your Google Calendar and sent the exact location via WhatsApp to the client.',
    'prompt.metric2': 'Confirmed in Calendar',

    'prompt.user3': 'A client asked at 3:00 AM if pets are allowed in the apartment.',
    'prompt.ai3': 'Aria replied at 3:00:04 AM: "Hi Marcos! Yes, pets up to 15kg are welcome. Would you like to schedule a tour for tomorrow?"',
    'prompt.metric3': 'Response in 4 seconds ⚡',

    'prompt.user4': 'What happened with the prospect who toured the Palermo loft last week?',
    'prompt.ai4': 'Re-contacted Sofia yesterday. She remains interested but requests a 3% discount. Shall I book a call to review the counter-offer?',
    'prompt.metric4': 'Lead Re-activated',

    // Trust / Social proof
    'proof.agencies': 'Trusted by 120+ Leading Real Estate Agencies in Spain and LATAM',
    'proof.metric1': '+500 Qualified Leads',
    'proof.sub1': 'per month per agency',
    'proof.metric2': 'Response < 5s',
    'proof.sub2': 'via WhatsApp and Web',
    'proof.metric3': '24/7 Available',
    'proof.sub3': 'after-hours coverage',
    'proof.metric4': '+85% Visits Scheduled',
    'proof.sub4': 'directly to Google Calendar',

    // Problem
    'problem.badge': 'The Real Pain of Real Estate Agencies',
    'problem.title': 'How many commissions are you losing by not responding on time?',
    'problem.subtitle': 'Slow responses and delayed qualification are the primary reasons agencies lose up to 40% of prospective buyers.',
    'problem.card1Tag': '67% Off-Hours',
    'problem.card1Title': 'Leads search late at night and on weekends',
    'problem.card1Desc': 'The average homebuyer browses properties after work. Without 24/7 response, those prospects go to your competitors.',
    'problem.card2Tag': 'Slow Response',
    'problem.card2Title': 'Waiting 15 minutes drops conversion by 80%',
    'problem.card2Desc': 'In real estate, the first responder qualifies and books the visit. Taking hours to send details means losing the commission.',
    'problem.card3Tag': 'Manual Follow-up',
    'problem.card3Title': 'Hours wasted answering repetitive questions',
    'problem.card3Desc': 'Agents spend 60% of their day answering basic questions about sqft, prices and parking instead of closing deals.',
    'problem.cta': 'Fix this now with Aria Prop',

    // How it works
    'how.badge': 'Automated 4-Step Flow',
    'how.title': 'How does Aria Prop work?',
    'how.subtitle': 'From first inquiry to closing contract: automate 80% of manual lead work and interact with buyers in record time.',
    'how.step1Title': 'The lead writes on your website or WhatsApp',
    'how.step1Desc': 'A potential buyer asks about a listing at any time (even at 2:00 AM).',
    'how.step2Title': 'Aria Prop replies & qualifies in < 5s',
    'how.step2Desc': 'Analyzes their budget, room count requirements, and assesses true purchase intent.',
    'how.step3Title': 'Schedules the tour in your calendar',
    'how.step3Desc': 'Proposes available time slots automatically and coordinates the tour seamlessly.',
    'how.step4Title': 'Your human team closes the deal',
    'how.step4Desc': 'Your agent receives the qualified lead file ready for the property walkthrough and contract signing.',
    'how.cta': 'Watch live interactive demo',

    // Interactive Demo Section
    'demo.badge': 'Live Interactive Demonstration',
    'demo.title': 'Test Aria Prop in real time',
    'demo.subtitle': 'Experience exactly how the AI agent interacts with an interested homebuyer.',
    'demo.tab1': 'Interactive Simulator',
    'demo.tab2': 'Video Demo (1 min)',
    'demo.videoTitle': 'Watch Aria Prop Schedule a Tour on WhatsApp',
    'demo.videoDesc': 'A 60-second walkthrough showing the entire flow: from late-night greeting to Google Calendar booking.',

    // Testimonials
    'test.badge': 'Success Stories & Proven Results',
    'test.title': 'What leading real estate agencies say',
    'test.subtitle': 'Measurable results in conversion rate, scheduled visits, and revenue.',

    // Trust & Security Seals
    'seal.badge': 'Enterprise-Grade Security & Privacy',
    'seal.title': 'Your real estate data protected under the highest standards',
    'seal.seal1Title': 'AES-256 Encryption',
    'seal.seal1Desc': 'Bank-grade security across all conversations and client data.',
    'seal.seal2Title': 'GDPR & Privacy Compliant',
    'seal.seal2Desc': 'Strict protection for personal lead and property data.',
    'seal.seal3Title': '99.9% Uptime SLA',
    'seal.seal3Desc': 'Redundant cloud infrastructure running 24/7/365 without downtime.',
    'seal.seal4Title': 'Tenant Isolation',
    'seal.seal4Desc': 'Your API credentials and databases fully isolated from third parties.',

    // Integrations
    'integ.badge': 'Native Integration Ecosystem',
    'integ.title': 'Connects directly with the tools you already use',
    'integ.subtitle': 'Without changing your workflow. Aria Prop integrates in minutes with WhatsApp, Calendar, and CRM.',
    'integ.banner': 'AES-256 bit encryption • Strict GDPR compliance for personal data protection',

    // Final CTA
    'cta.badge': 'Transform Your Real Estate Business Today',
    'cta.title1': 'Ready to automate your tours and',
    'cta.title2': 'multiply your sales',
    'cta.subtitle': 'Get started in under 24 hours. Setup your AI agent, upload property dossiers, and get qualified leads straight to your schedule.',
    'cta.primary': 'Book free demo',
    'cta.secondary': 'Quote Enterprise implementation',
    'cta.trust1': 'No credit card required',
    'cta.trust2': 'Setup in under 24 hours',
    'cta.trust3': 'Dedicated bilingual support',

    // Footer
    'footer.rights': 'All rights reserved. Powered by Aria AI Engine.',

    // Auth Modal
    'auth.loginTab': 'Log In',
    'auth.signupTab': 'Create Account',
    'auth.emailLabel': 'Email address',
    'auth.emailPlaceholder': 'you@agency.com',
    'auth.passLabel': 'Password',
    'auth.passPlaceholder': 'Minimum 6 characters',
    'auth.nameLabel': 'Full name',
    'auth.namePlaceholder': 'Carlos Mendoza',
    'auth.errEmail': 'Please enter a valid email address (e.g. user@agency.com).',
    'auth.errPass': 'Password must be at least 6 characters long.',
    'auth.errCreds': 'Incorrect email or password. Please verify your details.',
    'auth.btnSubmitLogin': 'Access my dashboard',
    'auth.btnSubmitSignup': 'Start free trial',
    'auth.google': 'Continue with Google',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('aria_lang');
    return saved === 'en' ? 'en' : 'es';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('aria_lang', newLang);
  };

  const toggleLang = () => {
    setLang(lang === 'es' ? 'en' : 'es');
  };

  const t = (key: string): string => {
    return translations[lang][key] || translations['es'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

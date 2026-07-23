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
    'nav.login': 'Iniciar sesión',
    'nav.signup': 'Registrarse',
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
    'how.step4Desc': 'Tus agentes reciben la ficha completa con score del lead y agendamiento confirmado para cerrar el trato.',
    'how.cta': 'Comenzar a Automatizar Ahora',

    // Interactive Demo
    'demo.badge': 'Demostración Interactiva Live',
    'demo.title': 'Prueba el Agente de IA en Vivo',
    'demo.subtitle': 'Selecciona una herramienta interactiva o mira el video demostrativo de agendamiento en tiempo real.',
    'demo.tab1': 'Workspace Interactivo Live',
    'demo.tab2': 'Video Demostrativo',
    'demo.videoTitle': 'De consulta a visita agendada en 5 segundos',
    'demo.videoDesc': 'Mira cómo Aria Prop califica al comprador, calcula presupuesto y agenda la cita en Google Calendar automáticamente.',

    // Testimonials
    'test.badge': 'Casos de Éxito Reales',
    'test.title': 'Agencias que ya escalaron sus ventas con Aria Prop',
    'test.subtitle': 'Resultados comprobados por directores comerciales y agentes independientes en Latinoamérica y España.',

    // Security & Seals
    'seal.badge': 'Seguridad & Confianza Enterprise',
    'seal.title': 'Tus Datos e Inmuebles Protegidos con Grado Bancario',
    'seal.subtitle': 'Cumplimiento estricto de la normativa RGPD y cifrado de extremo a extremo en todas las conversaciones.',
    'seal.seal1Title': 'Cifrado SSL 256-bit',
    'seal.seal1Desc': 'Todas las conversaciones y datos del catálogo viajan totalmente cifrados.',
    'seal.seal2Title': 'Cumplimiento RGPD & GDPR',
    'seal.seal2Desc': 'Protección estricta de datos personales de compradores e inversionistas.',
    'seal.seal3Title': 'Infraestructura Cloud Serverless',
    'seal.seal3Desc': 'Respuestas inmediatas sin caídas ni sobrecarga de servidor.',
    'seal.seal4Title': 'Aislamiento por Agencia',
    'seal.seal4Desc': 'Tus leads y catálogo pertenecen exclusivamente a tu agencia.',
    'seal.verified': 'Verificado & Certificado',

    // Integrations
    'integ.badge': 'Ecosistema Conectado',
    'integ.title': 'Se integra perfectamente con tus herramientas actuales',
    'integ.subtitle': 'Conecta Aria Prop con tu CRM inmobiliario, WhatsApp Business, Google Calendar y portales de mercado.',
    'integ.compliance': 'Encriptación AES-256 bits • Cumplimiento estricto de RGPD / GDPR para protección de datos personales',

    // Final CTA
    'cta.badge': 'Transforma tu Agencia Inmobiliaria',
    'cta.title1': '¿Listo para captar y agendar prospectos',
    'cta.title2': 'las 24 horas del día',
    'cta.subtitle': 'Configura tu primer agente de IA en menos de 10 minutos y comienza a captar prospectos 24/7 sin comisiones ocultas.',
    'cta.primary': 'Comenzar Prueba Gratuita',
    'cta.secondary': 'Hablar con un Especialista',
    'cta.trust1': 'Instalación en 2 min',
    'cta.trust2': 'Sin comisiones ocultas',
    'cta.trust3': 'Soporte 24/7 en español',

    // Footer
    'footer.description': 'La plataforma líder de Inteligencia Artificial para el sector inmobiliario en Latinoamérica y España. Automatización de leads, cualificación y agendamiento 24/7.',
    'footer.rights': 'Todos los derechos reservados.',
    'footer.col1': 'Producto',
    'footer.col2': 'Soluciones',
    'footer.col3': 'Recursos',
    'footer.col4': 'Legal',

    // Dashboard & Simplified Tabs
    'tabs.summary': 'Resumen',
    'tabs.general': 'Chat IA',
    'tabs.finance': 'Calculadora ROI',
    'tabs.rag': 'Buscar Propiedades',
    'tabs.files': 'Mis Documentos',

    'dashboard.welcomeTitle': 'Bienvenido a tu Panel Inmobiliario',
    'dashboard.welcomeSub': 'Vistazo general del rendimiento de atención 24/7, visitas coordinadas e indicadores clave.',
    'dashboard.metricLeadsToday': 'Leads Atendidos Hoy',
    'dashboard.metricToursScheduled': 'Visitas Agendadas',
    'dashboard.metricActiveChats': 'Conversaciones Activas',
    'dashboard.metricAvgRoi': 'ROI Promedio Calculado',
    'dashboard.metricConversionRate': 'Tasa de Conversión',
    'dashboard.recentActivityTitle': 'Actividad Reciente de Prospectos',
    'dashboard.quickActionsTitle': 'Herramientas de Trabajo Rápido',
    'dashboard.goTool': 'Abrir herramienta',

    // Auth UI
    'auth.loginTitle': 'Iniciar Sesión en Aria Prop',
    'auth.signupTitle': 'Crear Cuenta en Aria Prop',
    'auth.emailLabel': 'Correo Electrónico',
    'auth.emailPlaceholder': 'ejemplo@agencia.com',
    'auth.passwordLabel': 'Contraseña',
    'auth.passwordPlaceholder': 'Mínimo 6 caracteres',
    'auth.confirmPasswordLabel': 'Confirmar Contraseña',
    'auth.confirmPasswordPlaceholder': 'Repite tu contraseña',
    'auth.nameLabel': 'Nombre Completo',
    'auth.namePlaceholder': 'Carlos Mendoza',
    'auth.loginButton': 'Iniciar Sesión con Correo',
    'auth.signupButton': 'Registrarse con Correo',
    'auth.forgotPassword': '¿Olvidaste tu contraseña?',
    'auth.noAccount': '¿No tienes cuenta? Regístrate aquí',
    'auth.hasAccount': '¿Ya tienes cuenta? Inicia sesión',
    'auth.invalidEmail': 'Por favor ingresa un correo electrónico válido (ejemplo@agencia.com)',
    'auth.shortPassword': 'La contraseña debe contener al menos 6 caracteres',
    'auth.passwordMismatch': 'Las contraseñas no coinciden',
    'auth.invalidCredentials': 'Correo electrónico o contraseña incorrectos. Por favor verifica e intenta de nuevo.',
    'auth.successSignup': '¡Cuenta creada con éxito! Bienvenido a Aria Prop.',
    'auth.logout': 'Cerrar sesión',
    'auth.demoButton': 'Probar demo sin registrarme',
    'auth.google': 'Continuar con Google',

    // Logout Modal
    'logout.title': '¿Estás seguro de cerrar sesión?',
    'logout.subtitle': 'Tu sesión actual se cerrará y serás redirigido a la página principal.',
    'logout.confirm': 'Cerrar sesión',
    'logout.cancel': 'Cancelar',

    // Chat UI
    'chat.inputPlaceholder': 'Escribe tu consulta sobre inmuebles, ROI o documentos...',
    'chat.sending': 'Enviando...',
    'chat.typing': 'Aria está escribiendo...',
    'chat.welcomeMessage': '¡Hola! Soy Aria, tu asesora de IA. ¿En qué puedo ayudarte hoy?',
    'chat.sendBtn': 'Enviar',
    'chat.clearHistory': 'Limpiar conversación',
    'chat.indexedDocs': 'Documentos Indexados en RAG',
    'chat.dragDrop': 'Haz clic o arrastra tu archivo PDF aquí',
    'chat.dragSub': 'Soporta PDF, XLSX, DOCX hasta 25MB',
    'chat.readyRAG': 'Listo en RAG',
    'chat.processingDoc': 'Procesando e indexando documento con RAG de Aria AI...',
  },
  en: {
    // Header & Nav
    'nav.product': 'Aria AI',
    'nav.howItWorks': 'How it Works',
    'nav.pricing': 'Pricing',
    'nav.faq': 'FAQ',
    'nav.login': 'Log In',
    'nav.signup': 'Sign Up',
    'nav.panel': 'Dashboard',

    // Hero
    'hero.badge': 'Aria Prop: 24/7 Real Estate AI Agent',
    'hero.title1': 'Never lose another',
    'hero.title2': 'real estate lead',
    'hero.subtitle': 'Aria Prop engages your prospects in under 5 seconds, qualifies budgets, and schedules property tours 24/7 on WhatsApp and Web.',
    'hero.socialProof': 'Over 50,000 qualified prospects with',
    'hero.ctaPrimary': 'Book free demo',
    'hero.ctaSecondary': 'See how it works',
    'hero.trust1': 'Response in under 5s',
    'hero.trust2': 'Integrated with WhatsApp & Calendar',
    'hero.trust3': 'No credit card required',

    // Hero Prompt Assistant
    'prompt.placeholder': 'What would you like Aria to handle today?',
    'prompt.quickAction': 'Quick actions:',
    'prompt.chip1': 'Qualify a lead',
    'prompt.chip2': 'Schedule a tour',
    'prompt.chip3': 'Reply on WhatsApp',
    'prompt.chip4': 'Follow up with client',

    // Prompts content
    'prompt.userDefault': 'Hi, looking for a 2-bedroom condo in Downtown with $180,000 USD budget',
    'prompt.aiDefault': 'Hello! Excellent choice. I have 2 properties matching your budget perfectly. Lead Qualification: High Intent (Score 98/100).',
    'prompt.metricDefault': 'Tour Scheduled • Tomorrow 4:30 PM',

    'prompt.user1': 'What budget and purchase timeline does the luxury estate lead have?',
    'prompt.ai1': 'Analyzing chat: Buyer has $340,000 USD cash, plans to close within 30 days, and requires a double garage.',
    'prompt.metric1': 'Approved VIP Lead',

    'prompt.user2': 'I want to schedule an in-person tour for this Thursday afternoon.',
    'prompt.ai2': 'Tour confirmed! Reserved Thursday at 5:00 PM on Google Calendar and sent exact location via WhatsApp.',
    'prompt.metric2': 'Confirmed on Calendar',

    'prompt.user3': 'A client asked at 3:00 AM if pets are allowed in the apartment.',
    'prompt.ai3': 'Aria replied at 3:00:04 AM: "Hi Mark! Yes, the building allows pets up to 35lbs. Would you like to schedule a tour tomorrow?"',
    'prompt.metric3': 'Answered in 4 seconds ⚡',

    'prompt.user4': 'What happened with the prospect who viewed the penthouse last week?',
    'prompt.ai4': 'Followed up with Sarah yesterday. Still interested but requested a 3% discount. Shall I book a call to review the offer?',
    'prompt.metric4': 'Lead Re-activated',

    // Trust / Social proof
    'proof.agencies': 'Trusted by 120+ Leading Real Estate Agencies across Europe and LATAM',
    'proof.metric1': '+500 Qualified Leads',
    'proof.sub1': 'per month per agency',
    'proof.metric2': 'Response < 5s',
    'proof.sub2': 'via WhatsApp & Web',
    'proof.metric3': '24/7 Availability',
    'proof.sub3': 'after-hours coverage',
    'proof.metric4': '+85% Scheduled Tours',
    'proof.sub4': 'direct to Google Calendar',

    // Problem
    'problem.badge': 'Real Estate Agency Pain Point',
    'problem.title': 'How many commissions are you losing due to delayed replies?',
    'problem.subtitle': 'Slow responses and manual qualification cause agencies to lose up to 40% of potential buyers.',
    'problem.card1Tag': '67% After-Hours',
    'problem.card1Title': 'Leads browse at night and weekends',
    'problem.card1Desc': 'The average home buyer searches after work. Without 24/7 engagement, those prospects go to your competitors.',
    'problem.card2Tag': 'Slow Times',
    'problem.card2Title': 'Taking 15 minutes drops conversion by 80%',
    'problem.card2Desc': 'In real estate, the first to answer qualifies the lead and books the tour. Delayed replies cost you commissions.',
    'problem.card3Tag': 'Manual Tasks',
    'problem.card3Title': 'Hours lost answering repetitive questions',
    'problem.card3Desc': 'Agents spend 60% of their day answering repetitive questions about sqft, prices, and parking instead of closing deals.',
    'problem.cta': 'Fix this now with Aria Prop',

    // How it works
    'how.badge': '4-Step Automated Workflow',
    'how.title': 'How does Aria Prop work?',
    'how.subtitle': 'From initial inquiry to closing: automate 80% of routine lead capture and engage buyers instantly.',
    'how.step1Title': 'Lead messages on your Web or WhatsApp',
    'how.step1Desc': 'Potential buyer asks about a listing at any hour (even 2 AM).',
    'how.step2Title': 'Aria Prop qualifies in < 5s',
    'how.step2Desc': 'Evaluates budget, room requirements, and purchase intent.',
    'how.step3Title': 'Schedules tour directly on Calendar',
    'how.step3Desc': 'Proposes open time slots and coordinates in-person or virtual tours effortlessly.',
    'how.step4Title': 'Your team closes the sale',
    'how.step4Desc': 'Agents receive full lead score profiles and confirmed appointments ready to close.',
    'how.cta': 'Start Automating Now',

    // Interactive Demo
    'demo.badge': 'Live Interactive Demo',
    'demo.title': 'Test the AI Agent Live',
    'demo.subtitle': 'Select an interactive tool or watch the real-time tour scheduling demonstration.',
    'demo.tab1': 'Live Interactive Workspace',
    'demo.tab2': 'Video Demonstration',
    'demo.videoTitle': 'From query to booked tour in 5 seconds',
    'demo.videoDesc': 'See how Aria Prop qualifies the buyer, checks budget, and schedules the tour on Google Calendar automatically.',

    // Testimonials
    'test.badge': 'Real Success Stories',
    'test.title': 'Agencies scaling sales with Aria Prop',
    'test.subtitle': 'Proven results from commercial directors and independent brokers.',

    // Security & Seals
    'seal.badge': 'Enterprise Security & Trust',
    'seal.title': 'Bank-Grade Data & Property Protection',
    'seal.subtitle': 'Strict GDPR compliance and end-to-end encryption across all channels.',
    'seal.seal1Title': '256-bit SSL Encryption',
    'seal.seal1Desc': 'All conversations and catalog data are fully encrypted.',
    'seal.seal2Title': 'GDPR & Privacy Compliance',
    'seal.seal2Desc': 'Strict personal data protection for buyers and investors.',
    'seal.seal3Title': 'Cloud Serverless Infrastructure',
    'seal.seal3Desc': 'Instant responses with zero downtime or server overload.',
    'seal.seal4Title': 'Agency Data Isolation',
    'seal.seal4Desc': 'Your leads and catalog belong exclusively to your agency.',
    'seal.verified': 'Verified & Certified',

    // Integrations
    'integ.badge': 'Connected Ecosystem',
    'integ.title': 'Integrates seamlessly with your current stack',
    'integ.subtitle': 'Connect Aria Prop with your CRM, WhatsApp Business API, Google Calendar, and market portals.',
    'integ.compliance': 'AES-256 bit encryption • Strict GDPR compliance for personal data protection',

    // Final CTA
    'cta.badge': 'Transform Your Real Estate Agency',
    'cta.title1': 'Ready to capture and book leads',
    'cta.title2': '24 hours a day',
    'cta.subtitle': 'Set up your first AI agent in under 10 minutes and start capturing leads 24/7 without hidden fees.',
    'cta.primary': 'Start Free Trial',
    'cta.secondary': 'Speak with a Specialist',
    'cta.trust1': '2 min setup',
    'cta.trust2': 'No hidden fees',
    'cta.trust3': '24/7 support',

    // Footer
    'footer.description': 'The leading Artificial Intelligence platform for real estate in LATAM and Europe. 24/7 lead automation, qualification, and tour scheduling.',
    'footer.rights': 'All rights reserved.',
    'footer.col1': 'Product',
    'footer.col2': 'Solutions',
    'footer.col3': 'Resources',
    'footer.col4': 'Legal',

    // Dashboard & Simplified Tabs
    'tabs.summary': 'Summary',
    'tabs.general': 'AI Chat',
    'tabs.finance': 'ROI Calculator',
    'tabs.rag': 'Search Properties',
    'tabs.files': 'My Documents',

    'dashboard.welcomeTitle': 'Welcome to your Real Estate Dashboard',
    'dashboard.welcomeSub': 'Overview of 24/7 response metrics, scheduled tours, and key indicators.',
    'dashboard.metricLeadsToday': 'Leads Handled Today',
    'dashboard.metricToursScheduled': 'Tours Scheduled',
    'dashboard.metricActiveChats': 'Active Conversations',
    'dashboard.metricAvgRoi': 'Average Calculated ROI',
    'dashboard.metricConversionRate': 'Conversion Rate',
    'dashboard.recentActivityTitle': 'Recent Prospect Activity',
    'dashboard.quickActionsTitle': 'Quick Workspace Tools',
    'dashboard.goTool': 'Open tool',

    // Auth UI
    'auth.loginTitle': 'Log In to Aria Prop',
    'auth.signupTitle': 'Create Account on Aria Prop',
    'auth.emailLabel': 'Email Address',
    'auth.emailPlaceholder': 'name@agency.com',
    'auth.passwordLabel': 'Password',
    'auth.passwordPlaceholder': 'Minimum 6 characters',
    'auth.confirmPasswordLabel': 'Confirm Password',
    'auth.confirmPasswordPlaceholder': 'Repeat password',
    'auth.nameLabel': 'Full Name',
    'auth.namePlaceholder': 'Charles Smith',
    'auth.loginButton': 'Log In with Email',
    'auth.signupButton': 'Sign Up with Email',
    'auth.forgotPassword': 'Forgot your password?',
    'auth.noAccount': 'Don\'t have an account? Sign up here',
    'auth.hasAccount': 'Already have an account? Log in',
    'auth.invalidEmail': 'Please enter a valid email address (name@agency.com)',
    'auth.shortPassword': 'Password must be at least 6 characters long',
    'auth.passwordMismatch': 'Passwords do not match',
    'auth.invalidCredentials': 'Invalid email or password. Please check and try again.',
    'auth.successSignup': 'Account created successfully! Welcome to Aria Prop.',
    'auth.logout': 'Log out',
    'auth.demoButton': 'Try demo without registering',
    'auth.google': 'Continue with Google',

    // Logout Modal
    'logout.title': 'Are you sure you want to log out?',
    'logout.subtitle': 'Your current session will be closed and you will be redirected to the homepage.',
    'logout.confirm': 'Log Out',
    'logout.cancel': 'Cancel',

    // Chat UI
    'chat.inputPlaceholder': 'Ask about properties, ROI calculations, or documents...',
    'chat.sending': 'Sending...',
    'chat.typing': 'Aria is typing...',
    'chat.welcomeMessage': 'Hi! I am Aria, your AI advisor. How can I help you today?',
    'chat.sendBtn': 'Send',
    'chat.clearHistory': 'Clear chat history',
    'chat.indexedDocs': 'Indexed RAG Documents',
    'chat.dragDrop': 'Click or drag your PDF file here',
    'chat.dragSub': 'Supports PDF, XLSX, DOCX up to 25MB',
    'chat.readyRAG': 'Ready in RAG',
    'chat.processingDoc': 'Processing and indexing document with Aria AI RAG...',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('aria_lang');
    return saved === 'en' || saved === 'es' ? saved : 'es';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('aria_lang', newLang);
  };

  const toggleLang = () => {
    const next = lang === 'es' ? 'en' : 'es';
    setLang(next);
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

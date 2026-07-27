import React from 'react';
import { AppRoute } from '../../types';
import { LegalLayout } from './LegalLayout';

interface PrivacyPageProps {
  onRouteChange?: (route: AppRoute) => void;
}

const sections = [
  {
    title: '1. Información que recopilamos',
    body: 'Podemos recopilar datos de cuenta, contacto, facturación, uso de la plataforma, preferencias, archivos cargados por el usuario y conversaciones necesarias para prestar el servicio inmobiliario asistido por IA.',
  },
  {
    title: '2. Finalidades del tratamiento',
    body: 'Usamos la información para operar AriaPrompt, autenticar usuarios, procesar pagos, prestar soporte, mejorar funcionalidades, prevenir fraude, cumplir obligaciones legales y enviar comunicaciones relacionadas con el servicio.',
  },
  {
    title: '3. Proveedores y encargados',
    body: 'Podemos compartir datos con proveedores de infraestructura, analítica, autenticación, pagos y comunicaciones, incluyendo procesadores de pago como Paddle cuando corresponda. Estos proveedores tratan la información según instrucciones y medidas de seguridad razonables.',
  },
  {
    title: '4. Datos de clientes y leads inmobiliarios',
    body: 'El cliente conserva la responsabilidad sobre los datos personales de sus leads, prospectos o compradores que cargue en la plataforma. Debe contar con bases legales, consentimientos o autorizaciones necesarias para tratarlos mediante AriaPrompt.',
  },
  {
    title: '5. Conservación y seguridad',
    body: 'Conservamos la información mientras sea necesaria para prestar el servicio, resolver disputas, cumplir obligaciones legales o según instrucciones del cliente. Aplicamos controles técnicos y organizativos razonables para proteger los datos.',
  },
  {
    title: '6. Derechos de privacidad',
    body: 'Según la ley aplicable, puedes solicitar acceso, corrección, eliminación, oposición, portabilidad o limitación del tratamiento escribiendo a legal@ariaprop.online. También puedes solicitar baja de comunicaciones comerciales.',
  },
  {
    title: '7. Transferencias internacionales',
    body: 'La prestación del servicio puede implicar transferencias internacionales de datos hacia proveedores ubicados en otros países. Procuramos usar mecanismos contractuales y medidas de protección adecuadas.',
  },
];

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onRouteChange }) => (
  <LegalLayout
    title="Política de Privacidad"
    subtitle="Explica cómo AriaPrompt recopila, usa, comparte y protege la información personal."
    updatedAt="27 de julio de 2026"
    sections={sections}
    onRouteChange={onRouteChange}
  />
);

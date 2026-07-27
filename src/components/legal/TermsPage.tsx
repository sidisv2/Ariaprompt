import React from 'react';
import { AppRoute } from '../../types';
import { LegalLayout } from './LegalLayout';

interface TermsPageProps {
  onRouteChange?: (route: AppRoute) => void;
}

const sections = [
  {
    title: '1. Aceptación del servicio',
    body: 'Al acceder o utilizar AriaPrompt / Aria Prop AI aceptas estos Términos de Servicio. Si actúas en nombre de una empresa inmobiliaria, confirmas que tienes autorización para aceptar estos términos por dicha entidad.',
  },
  {
    title: '2. Descripción de AriaPrompt',
    body: 'AriaPrompt ofrece herramientas de inteligencia artificial para automatizar atención comercial, cualificación de leads, gestión de información inmobiliaria y asistencia operativa. Las respuestas generadas por IA son apoyo informativo y deben ser revisadas por el usuario antes de tomar decisiones comerciales, legales o financieras.',
  },
  {
    title: '3. Cuentas, uso permitido y seguridad',
    body: 'El usuario es responsable de mantener la confidencialidad de sus credenciales, de la información cargada en la plataforma y de usar el servicio de forma lícita. No está permitido intentar vulnerar la seguridad, copiar la plataforma, revender accesos no autorizados ni cargar contenido ilegal o que infrinja derechos de terceros.',
  },
  {
    title: '4. Planes, pagos y suscripciones',
    body: 'Los planes, precios y límites se muestran antes del pago. Las suscripciones pueden renovarse de forma periódica según el plan contratado. El procesamiento de pagos puede ser realizado por Paddle u otros proveedores autorizados, sujetos también a sus propios términos.',
  },
  {
    title: '5. Disponibilidad y cambios',
    body: 'Trabajamos para mantener el servicio disponible y seguro, pero no garantizamos disponibilidad ininterrumpida. Podemos modificar funcionalidades, mejorar modelos, actualizar precios futuros o suspender usos abusivos con el fin de proteger la plataforma y a sus clientes.',
  },
  {
    title: '6. Limitación de responsabilidad',
    body: 'AriaPrompt no garantiza resultados comerciales específicos ni sustituye asesoría profesional. En la medida permitida por la ley, la responsabilidad total se limita al importe pagado por el cliente durante el periodo aplicable al reclamo.',
  },
  {
    title: '7. Contacto',
    body: 'Para soporte o preguntas sobre estos términos, contacta a legal@ariaprop.online.',
  },
];

export const TermsPage: React.FC<TermsPageProps> = ({ onRouteChange }) => (
  <LegalLayout
    title="Términos y Condiciones"
    subtitle="Condiciones generales para acceder y usar la plataforma AriaPrompt / Aria Prop AI."
    updatedAt="27 de julio de 2026"
    sections={sections}
    onRouteChange={onRouteChange}
  />
);

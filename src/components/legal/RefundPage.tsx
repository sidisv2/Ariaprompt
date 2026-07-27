import React from 'react';
import { AppRoute } from '../../types';
import { LegalLayout } from './LegalLayout';

interface RefundPageProps {
  onRouteChange?: (route: AppRoute) => void;
}

const sections = [
  {
    title: '1. Garantía de reembolso de 14 días',
    body: 'AriaPrompt ofrece una garantía de reembolso de 14 días naturales para nuevas suscripciones pagadas. El plazo comienza en la fecha de compra inicial confirmada por el procesador de pago.',
  },
  {
    title: '2. Cómo solicitar un reembolso',
    body: 'Para solicitarlo, escribe a legal@ariaprop.online o al canal de soporte indicado en tu cuenta con el correo de compra, plan contratado y motivo de la solicitud. Revisaremos la solicitud y responderemos en un plazo razonable.',
  },
  {
    title: '3. Condiciones de elegibilidad',
    body: 'La garantía aplica a la primera compra de una suscripción. No cubre renovaciones posteriores, compras repetidas tras haber recibido un reembolso, servicios personalizados, implementaciones a medida, consumos extraordinarios o usos que vulneren los Términos de Servicio.',
  },
  {
    title: '4. Procesamiento del reembolso',
    body: 'Los reembolsos aprobados se devuelven al método de pago original mediante Paddle u otro proveedor aplicable. Los tiempos de acreditación dependen del banco, tarjeta o plataforma de pago del cliente.',
  },
  {
    title: '5. Cancelación de acceso',
    body: 'Al emitirse un reembolso, AriaPrompt podrá cancelar o limitar el acceso al plan pagado, incluyendo funcionalidades premium, integraciones y almacenamiento asociado al servicio.',
  },
  {
    title: '6. Dudas sobre facturación',
    body: 'Si tienes dudas sobre cargos, renovaciones o cancelaciones, contáctanos antes de iniciar una disputa bancaria para que podamos ayudarte de forma rápida.',
  },
];

export const RefundPage: React.FC<RefundPageProps> = ({ onRouteChange }) => (
  <LegalLayout
    title="Política de Reembolso (14 Días)"
    subtitle="Condiciones de la garantía de reembolso para nuevas suscripciones de AriaPrompt."
    updatedAt="27 de julio de 2026"
    sections={sections}
    onRouteChange={onRouteChange}
  />
);

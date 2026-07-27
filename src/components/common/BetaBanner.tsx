import React, { useState } from 'react';
import { X, FlaskConical, MessageCircle, Heart } from 'lucide-react';

export const BetaBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const whatsappNumber = '5492604014372';
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=Hola!%20Vi%20tu%20proyecto%20Aria%20Prop%20y%20quiero%20apoyarte%20%F0%9F%9A%80`;
  const mercadoPagoUrl = 'https://link.mercadopago.com.ar/ariaprop';

  return (
    <div
      id="beta-banner"
      role="banner"
      aria-label="Aviso de fase beta"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: 'linear-gradient(90deg, #0f172a 0%, #134e4a 50%, #0f172a 100%)',
        borderBottom: '1px solid rgba(52, 211, 153, 0.25)',
        boxShadow: '0 2px 24px 0 rgba(52,211,153,0.10)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 48px 0 16px',
        minHeight: '44px',
        gap: '12px',
        flexWrap: 'wrap',
      }}
    >
      {/* Icon + Text */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <FlaskConical
          size={14}
          style={{ color: '#34d399', flexShrink: 0 }}
          aria-hidden="true"
        />
        <span style={{
          fontSize: '12px',
          fontWeight: 600,
          color: '#cbd5e1',
          letterSpacing: '0.01em',
          whiteSpace: 'nowrap',
        }}>
          🚧 Aria Prop está en{' '}
          <strong style={{ color: '#34d399' }}>fase de prueba</strong>
          {' '}— Si querés apoyar el proyecto:
        </span>
      </div>

      {/* CTA Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* WhatsApp */}
        <a
          id="beta-banner-whatsapp"
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Escribir por WhatsApp al creador de Aria Prop"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 12px',
            borderRadius: '999px',
            background: 'rgba(37,211,102,0.15)',
            border: '1px solid rgba(37,211,102,0.35)',
            color: '#4ade80',
            fontWeight: 700,
            fontSize: '11.5px',
            textDecoration: 'none',
            transition: 'background 0.18s, transform 0.15s',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(37,211,102,0.28)';
            (e.currentTarget as HTMLElement).style.transform = 'scale(1.04)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(37,211,102,0.15)';
            (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
          }}
        >
          <MessageCircle size={12} style={{ flexShrink: 0 }} aria-hidden="true" />
          WhatsApp
        </a>

        {/* Divider */}
        <span style={{ color: '#334155', fontSize: '11px' }}>o</span>

        {/* MercadoPago */}
        <a
          id="beta-banner-mercadopago"
          href={mercadoPagoUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Donar a Aria Prop por MercadoPago"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 12px',
            borderRadius: '999px',
            background: 'rgba(96,165,250,0.12)',
            border: '1px solid rgba(96,165,250,0.30)',
            color: '#93c5fd',
            fontWeight: 700,
            fontSize: '11.5px',
            textDecoration: 'none',
            transition: 'background 0.18s, transform 0.15s',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(96,165,250,0.24)';
            (e.currentTarget as HTMLElement).style.transform = 'scale(1.04)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(96,165,250,0.12)';
            (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
          }}
        >
          <Heart size={12} style={{ flexShrink: 0 }} aria-hidden="true" />
          Donar por MercadoPago
        </a>
      </div>

      {/* Close button */}
      <button
        id="beta-banner-close"
        onClick={() => setDismissed(true)}
        aria-label="Cerrar aviso de fase beta"
        style={{
          position: 'absolute',
          right: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'transparent',
          border: 'none',
          color: '#64748b',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px',
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#94a3b8'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#64748b'; }}
      >
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  );
};

export default BetaBanner;

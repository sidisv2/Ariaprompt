import React, { useState, useEffect } from 'react';
import { X, MessageCircle, Heart, FlaskConical } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

const SESSION_KEY = 'aria_beta_banner_dismissed';

const WHATSAPP_URL =
  'https://wa.me/5492604014372?text=Hola!%20Vi%20Aria%20Prop%20y%20quiero%20compartir%20mi%20opini%C3%B3n%20%F0%9F%9A%80';
const MERCADO_PAGO_URL = 'https://link.mercadopago.com.ar/ariaprop';

/* ─── Floating WhatsApp Button ─────────────────────────────────────── */
export const WhatsAppFloatingButton: React.FC = () => (
  <a
    id="whatsapp-float-btn"
    href={WHATSAPP_URL}
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Contactar por WhatsApp"
    title="Contactar por WhatsApp"
    style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 9998,
      width: '52px',
      height: '52px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
      boxShadow: '0 4px 20px rgba(37,211,102,0.45)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textDecoration: 'none',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      cursor: 'pointer',
    }}
    onMouseEnter={e => {
      const el = e.currentTarget as HTMLElement;
      el.style.transform = 'scale(1.1)';
      el.style.boxShadow = '0 6px 28px rgba(37,211,102,0.6)';
    }}
    onMouseLeave={e => {
      const el = e.currentTarget as HTMLElement;
      el.style.transform = 'scale(1)';
      el.style.boxShadow = '0 4px 20px rgba(37,211,102,0.45)';
    }}
  >
    {/* WhatsApp SVG icon (official) */}
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="white"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  </a>
);

/* ─── Beta Banner ───────────────────────────────────────────────────── */
export const BetaBanner: React.FC = () => {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(true);
  const bannerRef = React.useRef<HTMLDivElement>(null);

  // Sync body class + CSS variable for sticky header offset
  useEffect(() => {
    if (visible) {
      document.body.classList.add('beta-banner-visible');
      const updateHeight = () => {
        if (bannerRef.current) {
          const h = bannerRef.current.offsetHeight;
          document.documentElement.style.setProperty('--beta-banner-height', `${h}px`);
        }
      };
      requestAnimationFrame(updateHeight);
      window.addEventListener('resize', updateHeight);
      return () => {
        window.removeEventListener('resize', updateHeight);
      };
    } else {
      document.body.classList.remove('beta-banner-visible');
      document.documentElement.style.removeProperty('--beta-banner-height');
    }
  }, [visible]);

  const handleDismiss = () => {
    sessionStorage.setItem(SESSION_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      ref={bannerRef}
      id="beta-banner"
      role="banner"
      aria-label={t('betaBanner.label')}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background:
          'linear-gradient(90deg, #0c1a2e 0%, #0d2c24 40%, #0c1a2e 100%)',
        borderBottom: '1px solid rgba(52,211,153,0.20)',
        boxShadow: '0 2px 32px 0 rgba(16,185,129,0.08)',
        padding: '10px 52px 10px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      {/* Row 1: Badge + Main message */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        {/* Beta pill */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 9px',
            borderRadius: '999px',
            background: 'rgba(52,211,153,0.12)',
            border: '1px solid rgba(52,211,153,0.30)',
            color: '#34d399',
            fontSize: '10px',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            flexShrink: 0,
          }}
        >
          <FlaskConical size={10} aria-hidden="true" />
          {t('betaBanner.label')}
        </span>

        {/* Main message */}
        <span
          style={{
            fontSize: '12.5px',
            fontWeight: 500,
            color: '#cbd5e1',
            lineHeight: 1.4,
            textAlign: 'center',
          }}
        >
          {t('betaBanner.message')}
        </span>
      </div>

      {/* Row 2: Help text + CTA buttons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <span
          style={{
            fontSize: '11.5px',
            color: '#64748b',
            textAlign: 'center',
          }}
        >
          {t('betaBanner.helpText')}
        </span>

        {/* WhatsApp CTA */}
        <a
          id="beta-banner-whatsapp"
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t('betaBanner.whatsapp')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 13px',
            borderRadius: '999px',
            background: 'rgba(37,211,102,0.13)',
            border: '1px solid rgba(37,211,102,0.32)',
            color: '#4ade80',
            fontWeight: 700,
            fontSize: '11.5px',
            textDecoration: 'none',
            transition: 'background 0.18s, transform 0.15s',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.background = 'rgba(37,211,102,0.25)';
            el.style.transform = 'scale(1.04)';
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.background = 'rgba(37,211,102,0.13)';
            el.style.transform = 'scale(1)';
          }}
        >
          <MessageCircle size={12} aria-hidden="true" />
          WhatsApp
        </a>

        {/* Donate text + link */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            flexWrap: 'wrap',
            justifyContent: 'center',
            fontSize: '11.5px',
            color: '#475569',
          }}
        >
          <span>{t('betaBanner.donatePrefix')}</span>
          <a
            id="beta-banner-mercadopago"
            href={MERCADO_PAGO_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('betaBanner.donateLink')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 13px',
              borderRadius: '999px',
              background: 'rgba(99,102,241,0.11)',
              border: '1px solid rgba(99,102,241,0.28)',
              color: '#a5b4fc',
              fontWeight: 700,
              fontSize: '11.5px',
              textDecoration: 'none',
              transition: 'background 0.18s, transform 0.15s',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = 'rgba(99,102,241,0.22)';
              el.style.transform = 'scale(1.04)';
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = 'rgba(99,102,241,0.11)';
              el.style.transform = 'scale(1)';
            }}
          >
            <Heart size={11} aria-hidden="true" />
            {t('betaBanner.donateLink')}
          </a>
          <span style={{ color: '#334155' }}>{t('betaBanner.donateSuffix')}</span>
        </span>
      </div>

      {/* Close button */}
      <button
        id="beta-banner-close"
        onClick={handleDismiss}
        aria-label={t('betaBanner.close')}
        title={t('betaBanner.close')}
        style={{
          position: 'absolute',
          top: '50%',
          right: '12px',
          transform: 'translateY(-50%)',
          background: 'transparent',
          border: 'none',
          color: '#475569',
          cursor: 'pointer',
          padding: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '6px',
          transition: 'color 0.15s, background 0.15s',
          lineHeight: 1,
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement;
          el.style.color = '#94a3b8';
          el.style.background = 'rgba(255,255,255,0.05)';
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement;
          el.style.color = '#475569';
          el.style.background = 'transparent';
        }}
      >
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  );
};

export default BetaBanner;

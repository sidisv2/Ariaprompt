import React, { useState, useEffect } from 'react';
import { X, MessageCircle, Heart, FlaskConical, ExternalLink } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

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
    className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 w-12 h-12 md:w-13 md:h-13 rounded-full bg-gradient-to-tr from-[#25D366] to-[#128C7E] shadow-xl shadow-emerald-900/40 flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
  >
    {/* WhatsApp SVG icon (official) */}
    <svg
      width="24"
      height="24"
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
      className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-[#0c1a2e] via-[#0d2c24] to-[#0c1a2e] border-b border-emerald-500/20 shadow-lg transition-all"
    >
      {/* ─── Mobile Ultra-Compact Single-Line Layout (block md:hidden) ─── */}
      <div className="flex md:hidden items-center justify-between gap-2 px-3 py-1.5 text-[11px] font-semibold text-slate-200">
        <div className="flex items-center gap-1.5 truncate">
          <span className="text-amber-400 font-extrabold shrink-0">⚠️ Beta</span>
          <span className="text-slate-500">•</span>
          <span className="truncate text-slate-300">Mobile en optimización (Usar PC)</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 hover:bg-emerald-500/30 transition-colors"
          >
            <span>Feedback ↗</span>
          </a>
          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white p-0.5 transition-colors cursor-pointer"
            aria-label="Cerrar banner"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ─── Desktop Full 2-Row Layout (hidden md:flex) ─── */}
      <div className="hidden md:flex flex-col items-center gap-1.5 py-2.5 px-12 relative text-center">
        {/* Row 1: Badge + Main message */}
        <div className="flex items-center justify-center gap-2.5 flex-wrap w-full">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider shrink-0">
            <FlaskConical size={10} aria-hidden="true" />
            {t('betaBanner.label')}
          </span>
          <span className="text-xs text-slate-300 font-medium leading-relaxed">
            {t('betaBanner.message')}
          </span>
        </div>

        {/* Row 2: Help text + CTA buttons */}
        <div className="flex items-center justify-center gap-2 flex-wrap w-full text-xs">
          <span className="text-slate-400 text-[11px]">{t('betaBanner.helpText')}</span>

          {/* WhatsApp CTA */}
          <a
            id="beta-banner-whatsapp"
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold hover:bg-emerald-500/25 transition-all"
          >
            <MessageCircle size={12} aria-hidden="true" />
            WhatsApp
          </a>

          {/* Donate text + link */}
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
            <span>{t('betaBanner.donatePrefix')}</span>
            <a
              id="beta-banner-mercadopago"
              href={MERCADO_PAGO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold hover:bg-indigo-500/25 transition-all"
            >
              <Heart size={11} aria-hidden="true" />
              {t('betaBanner.donateLink')}
            </a>
            <span className="text-slate-500">{t('betaBanner.donateSuffix')}</span>
          </span>
        </div>

        {/* Desktop Close button */}
        <button
          id="beta-banner-close"
          onClick={handleDismiss}
          aria-label={t('betaBanner.close')}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default BetaBanner;

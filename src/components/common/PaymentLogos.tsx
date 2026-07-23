import React from 'react';

export const VisaLogo: React.FC<{ className?: string }> = ({ className = "h-5" }) => (
  <svg className={className} viewBox="0 0 100 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M38.1 1.7L25 30.3H16.8L10.3 6.6C9.9 5 8.9 3.8 7.4 3C4.9 1.7 1.3 0.3 0 0L0.2 1.2C3.1 1.8 6.2 2.7 8.9 4.2C10.7 5.2 11.2 6.2 11.7 8.1L18.8 30.3H27.5L42.2 1.7H38.1ZM70.4 20.8C70.5 13.1 59.7 12.6 59.8 8.8C59.9 7.6 61 6.3 63.4 6C64.6 5.9 68 5.8 71.8 7.5L73.3 1.2C71.3 0.5 68.6 0 65.2 0C57.4 0 51.8 4 51.7 9.8C51.5 14.1 55.4 16.5 58.4 17.9C61.4 19.3 62.4 20.3 62.4 21.6C62.3 23.6 59.9 24.5 57.5 24.5C53.5 24.5 51.1 23.4 49.2 22.5L47.6 29.1C49.8 30.1 53.8 31 57.9 31C66.2 31 70.4 26.9 70.4 20.8ZM89 1.7H82.3C80.2 1.7 78.6 2.3 77.8 4.3L66.5 30.3H75.2L77 25.3H87.6L88.6 30.3H96.3L89 1.7ZM79.5 18.5L83.2 8.3L85.3 18.5H79.5ZM51.3 1.7L44.5 30.3H36.3L43.1 1.7H51.3Z" fill="#2563EB"/>
  </svg>
);

export const MastercardLogo: React.FC<{ className?: string }> = ({ className = "h-6" }) => (
  <svg className={className} viewBox="0 0 50 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="18" cy="15" r="13" fill="#EB001B" />
    <circle cx="32" cy="15" r="13" fill="#F79E1B" fillOpacity="0.9" />
    <path d="M25 5.2A12.9 12.9 0 0 0 18 15a12.9 12.9 0 0 0 7 9.8A12.9 12.9 0 0 0 32 15a12.9 12.9 0 0 0-7-9.8z" fill="#FF5F00" />
  </svg>
);

export const AmexLogo: React.FC<{ className?: string }> = ({ className = "h-5" }) => (
  <svg className={className} viewBox="0 0 60 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="60" height="20" rx="3" fill="#006FCF"/>
    <text x="30" y="14" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle" letterSpacing="1">AMEX</text>
  </svg>
);

export const MercadoPagoLogo: React.FC<{ className?: string }> = ({ className = "h-6" }) => (
  <svg className={className} viewBox="0 0 120 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="120" height="30" rx="6" fill="#009EE3" fillOpacity="0.15" />
    <path d="M12 15C12 9.5 16.5 5 22 5C27.5 5 32 9.5 32 15C32 20.5 27.5 25 22 25C16.5 25 12 20.5 12 15Z" fill="#009EE3" />
    <path d="M17 14C17 12.3 18.3 11 20 11H24C25.7 11 27 12.3 27 14V16C27 17.7 25.7 19 24 19H20C18.3 19 17 17.7 17 16V14Z" fill="#FFFFFF" />
    <text x="40" y="19" fill="#009EE3" fontSize="11" fontWeight="bold" fontFamily="sans-serif">mercado pago</text>
  </svg>
);

export const PaypalLogo: React.FC<{ className?: string }> = ({ className = "h-6" }) => (
  <svg className={className} viewBox="0 0 80 26" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.5 2L3 24H8.5L10.8 14.8H14.5C18.8 14.8 21.5 12.7 22.2 8.5C22.8 4.8 20.5 2 15.5 2H8.5Z" fill="#003087"/>
    <path d="M13.5 6L8 28H13.5L15.8 18.8H19.5C23.8 18.8 26.5 16.7 27.2 12.5C27.8 8.8 25.5 6 20.5 6H13.5Z" fill="#0079C1" fillOpacity="0.85"/>
    <text x="32" y="19" fill="#0079C1" fontSize="12" fontWeight="extrabold" fontStyle="italic" fontFamily="sans-serif">PayPal</text>
  </svg>
);

export const SpeiLogo: React.FC<{ className?: string }> = ({ className = "h-5" }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-extrabold text-[10px] tracking-wider border border-emerald-500/30 ${className}`}>
    🇲🇽 SPEI
  </span>
);

export const PseLogo: React.FC<{ className?: string }> = ({ className = "h-5" }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-extrabold text-[10px] tracking-wider border border-blue-500/30 ${className}`}>
    🇨🇴 PSE
  </span>
);

export const UsdtLogo: React.FC<{ className?: string }> = ({ className = "h-6" }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#26A17B"/>
    <path d="M17.9 14.2V11.8H23.5V8.5H8.5V11.8H14.1V14.2C10.5 14.4 7.8 15.2 7.8 16.2C7.8 17.2 10.5 18 14.1 18.2V23.5H17.9V18.2C21.5 18 24.2 17.2 24.2 16.2C24.2 15.2 21.5 14.4 17.9 14.2ZM16 17.1C13.2 17.1 10.8 16.5 10.8 16.2C10.8 15.9 13.2 15.3 16 15.3C18.8 15.3 21.2 15.9 21.2 16.2C21.2 16.5 18.8 17.1 16 17.1Z" fill="white"/>
  </svg>
);

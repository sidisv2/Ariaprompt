import React, { createContext, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import '../i18n';

export type Language = 'es' | 'en' | 'pt';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t, i18n } = useTranslation();

  const currentLang = (i18n.language?.slice(0, 2) as Language) || 'es';
  const validLang: Language = ['es', 'en', 'pt'].includes(currentLang) ? currentLang : 'es';

  React.useEffect(() => {
    document.documentElement.lang = validLang;
    const titles: Record<Language, string> = {
      es: 'Aria Prop - Agente de IA Inmobiliario 24/7',
      en: 'Aria Prop - 24/7 Real Estate AI Agent',
      pt: 'Aria Prop - Agente de IA Imobiliário 24/7',
    };
    document.title = titles[validLang] || titles.es;
  }, [validLang]);

  const setLang = (newLang: Language) => {
    i18n.changeLanguage(newLang);
    localStorage.setItem('aria_user_language', newLang);
    localStorage.setItem('aria_lang', newLang);
  };

  const toggleLang = () => {
    const nextLang: Language = validLang === 'es' ? 'en' : validLang === 'en' ? 'pt' : 'es';
    setLang(nextLang);
  };

  return (
    <LanguageContext.Provider value={{ lang: validLang, setLang, toggleLang, t }}>
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

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage, Language } from '../../context/LanguageContext';
import { Globe, ChevronDown, Check } from 'lucide-react';

interface LanguageOption {
  code: Language;
  name: string;
  flag: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
];

export const LanguageSelector: React.FC<{ variant?: 'desktop' | 'mobile' }> = ({ variant = 'desktop' }) => {
  const { lang, setLang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: Language) => {
    setLang(code);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1 rounded-full border transition-all cursor-pointer shadow-sm active:scale-95 shrink-0 ${
          variant === 'mobile'
            ? 'px-2 py-1 bg-slate-900 border-white/15 hover:border-emerald-500/40 text-[11px] text-slate-200 font-extrabold'
            : 'px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border-white/10 hover:border-emerald-500/40 text-xs text-slate-200 font-extrabold'
        }`}
        aria-label="Seleccionar idioma / Select language"
      >
        <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span className="text-xs leading-none">{currentOption.flag}</span>
        <span className="font-extrabold tracking-wide uppercase text-white text-[11px] sm:text-xs">{currentOption.code}</span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Subtle mobile backdrop overlay to dim sub-navigation and prevent visual bleed */}
          {variant === 'mobile' && (
            <div
              className="fixed inset-0 bg-slate-950/50 backdrop-blur-[2px] z-40 transition-opacity"
              onClick={() => setIsOpen(false)}
            />
          )}

          <div
            className={`absolute mt-2 rounded-2xl bg-slate-900 border border-emerald-500/40 p-2 shadow-2xl backdrop-blur-2xl z-50 animate-fadeIn space-y-1 ${
              variant === 'mobile'
                ? 'right-0 top-full w-48 max-w-[calc(100vw-1.5rem)] shadow-emerald-500/10 ring-1 ring-white/10'
                : 'right-0 w-44'
            }`}
          >
            <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-white/10 mb-1 flex items-center justify-between">
              <span>Seleccionar Idioma</span>
              <span className="text-emerald-400 text-[9px] font-mono">i18n</span>
            </div>

            {LANGUAGES.map((option) => {
              const isActive = option.code === lang;
              return (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => handleSelect(option.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'text-slate-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{option.flag}</span>
                    <span>{option.name}</span>
                  </div>
                  {isActive && <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

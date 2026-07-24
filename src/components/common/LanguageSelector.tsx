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
        className={`flex items-center gap-1.5 rounded-full border transition-all cursor-pointer shadow-sm active:scale-95 ${
          variant === 'mobile'
            ? 'px-2.5 py-1 bg-slate-900 border-white/10 hover:border-emerald-500/40 text-[11px] text-slate-200 font-extrabold'
            : 'px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border-white/10 hover:border-emerald-500/40 text-xs text-slate-200 font-extrabold'
        }`}
        aria-label="Seleccionar idioma / Select language"
      >
        <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span className="text-sm leading-none">{currentOption.flag}</span>
        <span className="font-extrabold tracking-wide uppercase text-white">{currentOption.code}</span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-slate-900 border border-emerald-500/30 p-1.5 shadow-2xl backdrop-blur-xl z-50 animate-fadeIn space-y-0.5">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/5 mb-1">
            Seleccionar Idioma
          </div>
          {LANGUAGES.map((option) => {
            const isActive = option.code === lang;
            return (
              <button
                key={option.code}
                type="button"
                onClick={() => handleSelect(option.code)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{option.flag}</span>
                  <span>{option.name}</span>
                </div>
                {isActive && <Check className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

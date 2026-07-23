import React from 'react';
import { MessageSquare, Sparkles } from 'lucide-react';

interface FloatingAssistantProps {
  onClick: () => void;
  isOpen?: boolean;
}

export const FloatingAssistant: React.FC<FloatingAssistantProps> = ({ onClick, isOpen }) => {
  if (isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <button
        onClick={onClick}
        aria-label="Abrir asistente de IA Aria Prop"
        className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-slate-950 font-bold text-xs shadow-2xl shadow-emerald-500/40 hover:scale-105 transition-all duration-300 cursor-pointer border border-emerald-300/40 ring-4 ring-slate-950/60"
      >
        <div className="relative">
          <MessageSquare className="w-5 h-5 fill-slate-950" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-slate-950 border border-emerald-300 rounded-full flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping"></span>
          </span>
        </div>

        <span className="hidden sm:inline-block font-extrabold tracking-wide">
          Chatear con Aria 24/7
        </span>

        <Sparkles className="w-4 h-4 text-slate-950 animate-pulse" />
      </button>
    </div>
  );
};

export default FloatingAssistant;

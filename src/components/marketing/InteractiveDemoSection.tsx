import React, { useState } from 'react';
import { Play, Sparkles, MessageSquare, CheckCircle2, Volume2, ShieldCheck, Zap } from 'lucide-react';
import { Playground } from '../playground/Playground';

export const InteractiveDemoSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'live' | 'video'>('live');

  return (
    <section id="demo" className="py-20 bg-slate-900 text-white relative overflow-hidden text-left border-t border-white/10">
      
      {/* Glow background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-indigo-500/10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 fill-current" />
            <span>Demostración Interactiva en Vivo</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Prueba a <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">Aria Prop en tiempo real</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Experimenta exactamente cómo interactúa el agente de IA con un comprador interesado en tus inmuebles.
          </p>

          {/* Toggle Tabs */}
          <div className="inline-flex items-center gap-2 p-1.5 rounded-2xl bg-slate-950 border border-white/10 mt-4">
            <button
              onClick={() => setActiveTab('live')}
              className={`px-5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'live'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Simulador Interactivo
            </button>
            <button
              onClick={() => setActiveTab('video')}
              className={`px-5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'video'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Video Demo (1 min)
            </button>
          </div>
        </div>

        {/* Content Display */}
        {activeTab === 'live' ? (
          <div className="rounded-3xl bg-slate-950 p-2 sm:p-6 border border-indigo-500/30 shadow-2xl">
            <Playground />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto rounded-3xl bg-slate-950 border border-white/10 overflow-hidden shadow-2xl relative group aspect-video flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80 z-10 pointer-events-none" />
            
            <div className="text-center space-y-4 relative z-20 p-6">
              <div className="w-20 h-20 rounded-full bg-indigo-600/90 hover:bg-indigo-500 border border-indigo-400/50 flex items-center justify-center text-white mx-auto shadow-2xl cursor-pointer transition-all hover:scale-110">
                <Play className="w-8 h-8 fill-current ml-1" />
              </div>
              <h3 className="text-xl font-black text-white">Ver a Aria Prop Agendando una Visita en WhatsApp</h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                Demostración de 60 segundos de un flujo completo: desde el saludo nocturno hasta la confirmación en Google Calendar.
              </p>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};

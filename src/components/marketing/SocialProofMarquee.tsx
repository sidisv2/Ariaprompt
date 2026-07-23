import React from 'react';
import { Building2, Zap, Clock, TrendingUp, CheckCircle2 } from 'lucide-react';

export const SocialProofMarquee: React.FC = () => {
  const metrics = [
    { icon: <TrendingUp className="w-4 h-4 text-emerald-600" />, label: '+500 Leads Calificados', sub: 'por mes por agencia' },
    { icon: <Zap className="w-4 h-4 text-indigo-600" />, label: 'Respuesta en < 5s', sub: 'vía WhatsApp y Web' },
    { icon: <Clock className="w-4 h-4 text-teal-600" />, label: 'Disponible 24/7', sub: 'atención fuera de horario' },
    { icon: <CheckCircle2 className="w-4 h-4 text-amber-600" />, label: '+85% Visitas Agendadas', sub: 'directo a Google Calendar' },
  ];

  const agencies = [
    { name: 'Engel & Völkers', city: 'Madrid & Marbella' },
    { name: 'Gilmar Real Estate', city: 'Costa del Sol' },
    { name: 'Lucas Fox Luxury', city: 'Barcelona & Sitges' },
    { name: 'Knight Frank', city: 'Salamanca & Moraleja' },
    { name: 'Sotheby’s Realty', city: 'Baleares & Costa Brava' },
    { name: 'Barnes International', city: 'Valencia & Alicante' },
  ];

  return (
    <section className="py-12 bg-white border-b border-slate-200/80 overflow-hidden text-slate-900">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((m, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex items-center gap-3 text-left"
            >
              <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-sm shrink-0">
                {m.icon}
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 leading-tight">{m.label}</h4>
                <p className="text-[10px] text-slate-500 font-medium">{m.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Agency Marquee */}
        <div className="relative pt-2">
          <p className="text-center text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mb-4">
            Confían más de <span className="text-indigo-600 font-black">120+ Agencias Inmobiliarias Líderes</span> en España y LATAM
          </p>

          <div className="relative flex overflow-x-hidden">
            <div className="py-1 animate-marquee flex whitespace-nowrap gap-6 items-center">
              {[...agencies, ...agencies].map((agency, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 font-semibold text-xs hover:border-indigo-300 transition-all shrink-0 shadow-xs"
                >
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{agency.name}</span>
                  <span className="text-[10px] text-slate-400 font-normal">({agency.city})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

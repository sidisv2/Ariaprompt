import React from 'react';
import { Building2, Award, ShieldCheck } from 'lucide-react';

export const SocialProofMarquee: React.FC = () => {
  const agencies = [
    { name: 'Engel & Völkers Premier', city: 'Madrid & Marbella' },
    { name: 'Gilmar Real Estate', city: 'Costa del Sol' },
    { name: 'Lucas Fox Luxury', city: 'Barcelona & Sitges' },
    { name: 'Knight Frank Spain', city: 'Salamanca & La Moraleja' },
    { name: 'Sotheby’s Realty', city: 'Baleares & Costa Brava' },
    { name: 'Barnes International', city: 'Madrid & Valencia' },
  ];

  return (
    <section className="py-10 bg-slate-950 border-y border-white/10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 text-center mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Confían más de <span className="text-emerald-400 font-bold">120+ Agencias Inmobiliarias de Alto Nivel</span> en España y Portugal
        </p>
      </div>

      <div className="relative flex overflow-x-hidden">
        <div className="py-2 animate-marquee flex whitespace-nowrap gap-8 items-center">
          {[...agencies, ...agencies].map((agency, idx) => (
            <div
              key={idx}
              className="inline-flex items-center gap-3 px-5 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 text-slate-300 font-medium text-xs hover:border-emerald-500/30 transition-all shrink-0"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-bold text-white block">{agency.name}</span>
                <span className="text-[10px] text-slate-400">{agency.city}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

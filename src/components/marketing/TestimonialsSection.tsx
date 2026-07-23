import React from 'react';
import { Star, Building2, TrendingUp, Quote, CheckCircle2 } from 'lucide-react';

export const TestimonialsSection: React.FC = () => {
  const testimonials = [
    {
      name: 'Carlos Mendoza',
      role: 'Director Comercial',
      agency: 'Grupo Inmobiliario Salamanca',
      metric: '+340% Visitas Agendadas',
      quote: 'Aria Prop transformó por completo nuestra captación. Antes los leads de fin de semana se enfriaban. Ahora el agente de IA les responde a los 3 segundos y agenda la visita a nuestro Google Calendar.',
      rating: 5,
    },
    {
      name: 'Lucía Fernández',
      role: 'Founder & CEO',
      agency: 'Moraleja Luxury Estates',
      metric: '18 Cierres Fuera de Horario',
      quote: 'En el primer mes cerramos 18 operaciones que se iniciaron un sábado a la medianoche. El comprador agradece la inmediatez y recibir el dossier PDF en el acto.',
      rating: 5,
    },
    {
      name: 'Mariano Silva',
      role: 'Socio Gerente',
      agency: 'Poblado PropTech Partners',
      metric: '4 Horas/Día Ahorradas por Agente',
      quote: 'Nuestros asesores ya no pierden tiempo respondiendo cuántos m² tiene un departamento. Aria les entrega el lead cualificado con presupuesto exacto listo para firmar.',
      rating: 5,
    },
  ];

  return (
    <section className="py-20 bg-slate-950 border-t border-white/5 relative overflow-hidden text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-extrabold uppercase tracking-wider">
            <Quote className="w-4 h-4" />
            <span>Casos de Éxito & Resultados Comprobados</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Lo que dicen las <span className="bg-gradient-to-r from-amber-300 via-emerald-400 to-amber-300 bg-clip-text text-transparent">agencias líderes en LATAM</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Resultados medibles en tasa de conversión, visitas agendadas y facturación directa.
          </p>
        </div>

        {/* 3 Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="p-7 rounded-3xl bg-slate-900/90 border border-white/10 hover:border-amber-500/40 transition-all duration-300 shadow-xl flex flex-col justify-between space-y-6 relative group hover:scale-[1.02]"
            >
              <div className="space-y-4">
                {/* Metric Badge */}
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-extrabold flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{t.metric}</span>
                  </span>
                  <div className="flex text-amber-400">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                </div>

                {/* Quote Text */}
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  "{t.quote}"
                </p>
              </div>

              {/* Author Details */}
              <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-emerald-400/40 flex items-center justify-center text-emerald-400 font-black text-sm shrink-0">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white flex items-center gap-1">
                    <span>{t.name}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />
                  </h4>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-slate-500" />
                    <span>{t.role} — {t.agency}</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

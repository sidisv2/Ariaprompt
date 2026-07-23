import React from 'react';
import { MessageSquare, Bot, CalendarCheck, Award, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const HowItWorksSection: React.FC = () => {
  const { openAuthModal } = useAuth();

  const steps = [
    {
      step: 'Paso 1',
      icon: <MessageSquare className="w-6 h-6 text-emerald-400" />,
      title: 'El lead escribe en tu web o WhatsApp',
      description: 'El comprador potencial pregunta sobre un departamento a cualquier hora (incluso a las 2 AM).',
    },
    {
      step: 'Paso 2',
      icon: <Bot className="w-6 h-6 text-teal-300" />,
      title: 'Aria Prop responde y cualifica en < 5s',
      description: 'Analiza su presupuesto, requerimientos de habitaciones y evalúa si es un cliente con intención real de compra.',
    },
    {
      step: 'Paso 3',
      icon: <CalendarCheck className="w-6 h-6 text-cyan-400" />,
      title: 'Agenda la visita en tu calendario',
      description: 'Propone automáticamente horarios disponibles y coordina la visita presencial o virtual sin fricción.',
    },
    {
      step: 'Paso 4',
      icon: <Award className="w-6 h-6 text-amber-400" />,
      title: 'Tu equipo humano cierra la venta',
      description: 'El asesor recibe el expediente cualificado del cliente con sus datos completos listo para mostrar el inmueble y firmar.',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-slate-900/60 border-t border-white/5 relative overflow-hidden text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold uppercase tracking-wider">
            <Bot className="w-4 h-4" />
            <span>Flujo Automatizado en 4 Pasos</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            ¿Cómo funciona <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">Aria Prop</span>?
          </h2>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            De la primera consulta a la firma del contrato: automatiza el 80% del trabajo pesado de captación e interactúa con tus compradores en tiempo récord.
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-slate-950 border border-white/10 hover:border-emerald-500/40 transition-all duration-300 shadow-xl flex flex-col justify-between space-y-5 relative group hover:scale-[1.02]"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    {s.step}
                  </span>
                  <div className="p-2.5 rounded-2xl bg-slate-900 border border-white/10 group-hover:border-emerald-500/40 transition-colors">
                    {s.icon}
                  </div>
                </div>
                <h3 className="text-base font-extrabold text-white leading-snug">{s.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{s.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Strategic CTA */}
        <div className="mt-12 text-center">
          <button
            onClick={() => openAuthModal('signup', 'pro', 'dashboard-checkout')}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-black text-xs shadow-xl shadow-emerald-400/20 transition-all cursor-pointer hover:scale-105"
          >
            <span>Ver demo interactiva en vivo</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

      </div>
    </section>
  );
};

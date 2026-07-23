import React from 'react';
import { Clock, AlertTriangle, MessageSquareOff, TrendingDown, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ProblemSection: React.FC = () => {
  const { openAuthModal } = useAuth();

  const problems = [
    {
      icon: <Clock className="w-6 h-6 text-rose-600" />,
      tag: '67% Fuera de Horario',
      title: 'Los leads buscan de noche y en fines de semana',
      description: 'El comprador inmobiliario promedio consulta inmuebles después de trabajar. Sin atención 24/7, esos prospectos se van con la competencia.',
    },
    {
      icon: <TrendingDown className="w-6 h-6 text-amber-600" />,
      tag: 'Tiempos de Respuesta Lentos',
      title: 'Tardarte 15 minutos desploma la conversión un 80%',
      description: 'En bienes raíces, el primero en responder califica y agenda la visita. Si tardas horas en enviar la ficha, pierdes la comisión.',
    },
    {
      icon: <MessageSquareOff className="w-6 h-6 text-indigo-600" />,
      tag: 'Seguimiento Manual Ineficiente',
      title: 'Horas perdidas respondiendo lo mismo',
      description: 'Tus agentes dedican el 60% de su jornada contestando preguntas repetitivas sobre m², precios y cocheras, en lugar de estar cerrando ventas.',
    },
  ];

  return (
    <section className="py-20 bg-slate-50 border-b border-slate-200/80 relative overflow-hidden text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-extrabold uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>El Dolor Real de las Agencias Inmobiliarias</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            ¿Cuántas comisiones estás perdiendo por <span className="text-rose-600">no responder a tiempo</span>?
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            La falta de respuesta inmediata y la cualificación lenta son las principales razones por las que las agencias pierden hasta el 40% de sus potenciales compradores.
          </p>
        </div>

        {/* 3 Problem Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {problems.map((p, idx) => (
            <div
              key={idx}
              className="p-7 rounded-3xl bg-white border border-slate-200/80 hover:border-rose-300 transition-all duration-300 shadow-md hover:shadow-xl flex flex-col justify-between space-y-6 group hover:-translate-y-1"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-100 group-hover:bg-rose-100 transition-colors">
                    {p.icon}
                  </div>
                  <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200/80">
                    {p.tag}
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 leading-snug">{p.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{p.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Section Action CTA */}
        <div className="mt-12 text-center">
          <button
            onClick={() => openAuthModal('signup', 'pro', 'dashboard-checkout')}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer hover:scale-105"
          >
            <span>Solucionar esto ahora con Aria Prop</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

      </div>
    </section>
  );
};

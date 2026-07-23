import React, { useState } from 'react';
import { UserCheck, TrendingUp, Building, ArrowRight, Sparkles, MessageSquare } from 'lucide-react';

interface SolutionItem {
  id: string;
  role: 'Compradores' | 'Inversionistas' | 'Agentes';
  title: string;
  description: string;
  samplePrompt: string;
  icon: React.ReactNode;
  badge: string;
}

interface SolutionsGridProps {
  onSelectPrompt?: (prompt: string) => void;
}

const SOLUTIONS: SolutionItem[] = [
  {
    id: '1',
    role: 'Compradores',
    title: 'Búsqueda Guiada de Hogar',
    description: 'Ayuda a las familias a encontrar su vivienda ideal filtrando por número de habitaciones, zonas preferidas y características clave.',
    samplePrompt: 'Busco un departamento de 2 o 3 dormitorios en zona céntrica con balcón y garaje por menos de $250,000.',
    icon: <UserCheck className="w-5 h-5 text-emerald-400" />,
    badge: 'Atención Compradores',
  },
  {
    id: '2',
    role: 'Inversionistas',
    title: 'Evaluador de ROI & Rentabilidad',
    description: 'Calcula el retorno estimado de inversión, flujos de caja y plusvalía esperada para compradores inversionistas.',
    samplePrompt: 'Calcula la rentabilidad anual estimada si compro un departamento de $180,000 y lo alquilo por $1,200/mes.',
    icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
    badge: 'Análisis Financiero',
  },
  {
    id: '3',
    role: 'Agentes',
    title: 'Cualificación y Agendamiento 24/7',
    description: 'Filtra prospectos en automático, verifica su presupuesto disponible y coordina las visitas en tu agenda.',
    samplePrompt: 'Quiero agendar una visita virtual para ver el departamento en barrio residencial este fin de semana.',
    icon: <Building className="w-5 h-5 text-emerald-400" />,
    badge: 'Automatización Agencias',
  },
  {
    id: '4',
    role: 'Compradores',
    title: 'Consulta RAG de Planos & Dossier',
    description: 'Responde consultas técnicas precisas sobre acabados, distribuciones y memoria de calidades consultando el PDF subido.',
    samplePrompt: '¿Qué tipo de suelo tiene la cocina y cuál es el metraje total según la memoria técnica?',
    icon: <UserCheck className="w-5 h-5 text-emerald-400" />,
    badge: 'Lector Documental PDF',
  },
  {
    id: '5',
    role: 'Inversionistas',
    title: 'Comparativa de Zonas & Precios m²',
    description: 'Analiza el costo por metro cuadrado entre distintas zonas de la ciudad para identificar oportunidades subvaluadas.',
    samplePrompt: '¿Cuál es el valor promedio por metro cuadrado en las propiedades disponibles de la zona norte?',
    icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
    badge: 'Comparativa de Mercado',
  },
  {
    id: '6',
    role: 'Agentes',
    title: 'Generación de Captación & Resumen',
    description: 'Genera fichas comerciales listas para enviar por correo o WhatsApp con un resumen claro del cliente.',
    samplePrompt: 'Resume los requerimientos del lead y genera un informe de sugerencias con 2 inmuebles ideales.',
    icon: <Building className="w-5 h-5 text-emerald-400" />,
    badge: 'Captación Automática',
  },
];

export const SolutionsGrid: React.FC<SolutionsGridProps> = ({ onSelectPrompt }) => {
  const [selectedRole, setSelectedRole] = useState<'Todos' | 'Compradores' | 'Inversionistas' | 'Agentes'>('Todos');

  const filteredSolutions = selectedRole === 'Todos'
    ? SOLUTIONS
    : SOLUTIONS.filter((s) => s.role === selectedRole);

  return (
    <section id="solutions" className="py-20 bg-slate-950 border-t border-white/5 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Soluciones & Casos de Uso</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Diseñado para cada actor del sector inmobiliario
          </h2>
          <p className="text-sm text-slate-400">
            Descubre cómo Aria Prop transforma la experiencia para compradores, inversionistas y equipos comerciales.
          </p>

          {/* Role Filter Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {(['Todos', 'Compradores', 'Inversionistas', 'Agentes'] as const).map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedRole === role
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSolutions.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl p-6 bg-slate-900/60 border border-white/10 hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    {item.icon}
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-800 text-emerald-300 border border-white/5">
                    {item.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {item.description}
                </p>

                {/* Sample Prompt Box */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-white/5 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Prompt de Ejemplo:</span>
                  <p className="text-xs italic text-slate-300">"{item.samplePrompt}"</p>
                </div>
              </div>

              {/* Action button */}
              <button
                onClick={() => onSelectPrompt?.(item.samplePrompt)}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 text-xs font-bold border border-emerald-500/30 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Probar este Prompt</span>
              </button>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default SolutionsGrid;

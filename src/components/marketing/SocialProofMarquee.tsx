import React from 'react';
import { Zap, Clock, ShieldCheck, CheckCircle2, Cpu, Calendar, MessageSquare, Database } from 'lucide-react';

export const SocialProofMarquee: React.FC = () => {
  const metrics = [
    { icon: <Zap className="w-4 h-4 text-emerald-400" />, label: 'Respuesta < 5s', sub: 'Atención Inmediata 24/7' },
    { icon: <Clock className="w-4 h-4 text-teal-400" />, label: '100% Automatizado', sub: 'Sin Guardias Manuales' },
    { icon: <Calendar className="w-4 h-4 text-cyan-400" />, label: 'Google Calendar', sub: 'Citas Directas' },
    { icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />, label: 'Cifrado SSL 256-bit', sub: 'Normativa RGPD' },
  ];

  const integrations = [
    { name: 'Tokko Broker CRM', desc: 'API Key Directa' },
    { name: 'EasyBroker CRM', desc: 'Sincronización Nativa' },
    { name: 'WhatsApp Business', desc: 'Atención Omnicanal' },
    { name: 'Google Calendar', desc: 'Agendamiento Real-Time' },
    { name: 'Bóveda RAG PDF', desc: 'Extracción de Planos' },
    { name: 'MercadoLibre Connect', desc: 'Captura de Leads' },
  ];

  return (
    <section className="py-10 bg-slate-900 border-b border-white/10 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((m, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 shadow-sm hover:border-emerald-500/30 transition-all flex items-center gap-3 text-left"
            >
              <div className="p-2.5 rounded-xl bg-slate-900 border border-white/10 text-emerald-400 shrink-0">
                {m.icon}
              </div>
              <div>
                <h4 className="text-xs font-black text-white leading-tight">{m.label}</h4>
                <p className="text-[10px] text-slate-400 font-medium">{m.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Integration Badges Row */}
        <div className="pt-2 text-center space-y-3">
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400">
            Integrado al Ecosistema Inmobiliario
          </p>

          <div className="flex flex-wrap justify-center items-center gap-3">
            {integrations.map((item, idx) => (
              <div
                key={idx}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-slate-300 text-xs font-medium"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-bold text-white">{item.name}</span>
                <span className="text-[10px] text-slate-400">({item.desc})</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

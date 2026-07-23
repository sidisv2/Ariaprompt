import React from 'react';
import { Layers, CheckCircle2, Cpu, Globe2, Calendar, MessageSquare, Database, Zap } from 'lucide-react';

export const IntegrationsSection: React.FC = () => {
  const integrations = [
    { name: 'WhatsApp Business API', icon: <MessageSquare className="w-5 h-5 text-emerald-400" />, type: 'Mensajería 24/7' },
    { name: 'Google & Outlook Calendar', icon: <Calendar className="w-5 h-5 text-teal-300" />, type: 'Agendado Automático' },
    { name: 'HubSpot & Salesforce CRM', icon: <Database className="w-5 h-5 text-cyan-400" />, type: 'Sincronización de Leads' },
    { name: 'Idealista & Fotocasa & ZonaProp', icon: <Globe2 className="w-5 h-5 text-amber-400" />, type: 'Portales Inmobiliarios' },
    { name: 'Zapier & Webhooks API', icon: <Zap className="w-5 h-5 text-emerald-300" />, type: 'Conexión a Medida' },
    { name: 'Infraestructura SaaS Cloud', icon: <Cpu className="w-5 h-5 text-teal-400" />, type: '99.9% Uptime SLA' },
  ];

  return (
    <section className="py-20 bg-slate-900/60 border-t border-white/5 relative overflow-hidden text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>Ecosistema de Integraciones Nativas</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Se conecta directamente con las <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">herramientas que ya utilizas</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Sin cambiar tu flujo de trabajo. Aria Prop se integra en minutos con tus portales, WhatsApp y CRM inmobiliario.
          </p>
        </div>

        {/* Integrations Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {integrations.map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-950 border border-white/10 hover:border-emerald-500/40 transition-all duration-300 shadow-lg text-center space-y-3 flex flex-col items-center justify-center group hover:scale-105"
            >
              <div className="p-3 rounded-2xl bg-slate-900 border border-white/10 group-hover:border-emerald-500/30 transition-colors">
                {item.icon}
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-white leading-tight">{item.name}</h4>
                <span className="text-[10px] text-slate-400 block mt-1">{item.type}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Security / Compliance Banner */}
        <div className="mt-12 p-4 rounded-2xl bg-slate-950/80 border border-white/10 max-w-2xl mx-auto flex items-center justify-center gap-3 text-xs text-slate-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Encriptación AES-256 bits • Cumplimiento estricto de RGPD / GDPR para protección de datos personales</span>
        </div>

      </div>
    </section>
  );
};

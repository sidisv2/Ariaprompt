import React from 'react';
import { Layers, CheckCircle2, Cpu, Globe2, Calendar, MessageSquare, Database, Zap } from 'lucide-react';

export const IntegrationsSection: React.FC = () => {
  const integrations = [
    { name: 'WhatsApp Business API', icon: <MessageSquare className="w-5 h-5 text-emerald-600" />, type: 'Mensajería 24/7' },
    { name: 'Google & Outlook Calendar', icon: <Calendar className="w-5 h-5 text-teal-600" />, type: 'Agendado Automático' },
    { name: 'HubSpot & Salesforce CRM', icon: <Database className="w-5 h-5 text-indigo-600" />, type: 'Sincronización de Leads' },
    { name: 'Idealista & Fotocasa & ZonaProp', icon: <Globe2 className="w-5 h-5 text-amber-600" />, type: 'Portales Inmobiliarios' },
    { name: 'Zapier & Webhooks API', icon: <Zap className="w-5 h-5 text-cyan-600" />, type: 'Conexión a Medida' },
    { name: 'Infraestructura SaaS Cloud', icon: <Cpu className="w-5 h-5 text-indigo-600" />, type: '99.9% Uptime SLA' },
  ];

  return (
    <section className="py-20 bg-white border-b border-slate-200/80 relative overflow-hidden text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-extrabold uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>Ecosistema de Integraciones Nativas</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Se conecta directamente con las <span className="text-indigo-600">herramientas que ya utilizas</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Sin cambiar tu flujo de trabajo. Aria Prop se integra en minutos con tus portales, WhatsApp y CRM inmobiliario.
          </p>
        </div>

        {/* Integrations Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {integrations.map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-indigo-300 transition-all duration-300 shadow-sm hover:shadow-md text-center space-y-3 flex flex-col items-center justify-center group hover:scale-105"
            >
              <div className="p-3 rounded-2xl bg-white border border-slate-200/80 group-hover:border-indigo-300 transition-colors shadow-xs">
                {item.icon}
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 leading-tight">{item.name}</h4>
                <span className="text-[10px] text-slate-500 block mt-1 font-medium">{item.type}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Security / Compliance Banner */}
        <div className="mt-12 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 max-w-2xl mx-auto flex items-center justify-center gap-3 text-xs text-indigo-950 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Encriptación AES-256 bits • Cumplimiento estricto de RGPD / GDPR para protección de datos personales</span>
        </div>

      </div>
    </section>
  );
};

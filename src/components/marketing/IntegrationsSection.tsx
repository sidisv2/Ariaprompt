import React from 'react';
import { Layers, ShieldCheck, Calendar, MessageSquare, Building2, Globe2, MapPin, Package, CheckCircle2, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const IntegrationsSection: React.FC = () => {
  const { t } = useLanguage();

  const integrations = [
    {
      name: 'Tokko Broker',
      tagline: 'Sincronización de Catálogo API',
      description: 'Sincronizá tus fichas técnicas e inmuebles en vivo directamente desde tu CRM Tokko.',
      badge: 'CRM Integrado',
      icon: <Building2 className="w-6 h-6 text-emerald-400" />,
      color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30',
    },
    {
      name: 'EasyBroker',
      tagline: 'Catálogo y Fichas Técnicas',
      description: 'Conexión por API Key para importar automáticamente el stock completo de propiedades.',
      badge: 'CRM Integrado',
      icon: <Globe2 className="w-6 h-6 text-teal-400" />,
      color: 'from-teal-500/20 to-cyan-500/10 border-teal-500/30',
    },
    {
      name: 'Zonaprop & Argenprop',
      tagline: 'Derivación Directa de Leads',
      description: 'Captura y cualificación automática de las consultas entrantes de portales inmobiliarios.',
      badge: 'Portales LATAM',
      icon: <MapPin className="w-6 h-6 text-amber-400" />,
      color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30',
    },
    {
      name: 'Mercado Libre Inmuebles',
      tagline: 'Sincronización Multi-Portal',
      description: 'Respuestas inteligentes de IA a las preguntas publicadas en tus avisos inmobiliarios.',
      badge: 'E-commerce Real Estate',
      icon: <Package className="w-6 h-6 text-yellow-400" />,
      color: 'from-yellow-500/20 to-amber-500/10 border-yellow-500/30',
    },
    {
      name: 'Google Calendar & Outlook',
      tagline: 'Agendamiento Sin Solapamientos',
      description: 'Coordinación automatizada de visitas en la agenda del agente según disponibilidad real.',
      badge: 'Agendas en Vivo',
      icon: <Calendar className="w-6 h-6 text-blue-400" />,
      color: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30',
    },
    {
      name: 'WhatsApp Cloud API / Meta',
      tagline: 'Atención Omnicanal 24/7',
      description: 'Canal oficial verificado por Meta para conversaciones instantáneas y seguimiento.',
      badge: 'API Oficial Meta',
      icon: <MessageSquare className="w-6 h-6 text-emerald-400" />,
      color: 'from-emerald-500/20 to-green-500/10 border-emerald-500/30',
    },
  ];

  return (
    <section className="py-20 bg-slate-950 border-y border-white/10 relative overflow-hidden text-left text-white">
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-14">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold uppercase tracking-wider shadow-sm">
            <Layers className="w-4 h-4" />
            <span>Ecosistema de Integraciones</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Conectá Aria Prop con las herramientas que ya usás
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Sincronización bidireccional automática de catálogo, leads y visitas sin cambiar tu flujo operativo diario.
          </p>
        </div>

        {/* Integrations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((item, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-3xl bg-gradient-to-br ${item.color} border backdrop-blur-xl shadow-xl hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between space-y-4 group`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-2xl bg-slate-900/90 border border-white/10 shadow-md group-hover:border-emerald-400/50 transition-colors">
                    {item.icon}
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-extrabold text-slate-300 uppercase tracking-wider">
                    {item.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-white">{item.name}</h3>
                  <span className="text-xs font-bold text-emerald-400 block mt-0.5">{item.tagline}</span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-bold text-emerald-300">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Conexión Inmediata
                </span>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">Sincronizado ⚡</span>
              </div>
            </div>
          ))}
        </div>

        {/* Security / Compliance Banner */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/30 max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-200">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Infraestructura cifrada SSL 256-bit con webhook en tiempo real y disponibilidad 99.9% garantizada.</span>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-extrabold whitespace-nowrap">
            SLA 99.9%
          </span>
        </div>

      </div>
    </section>
  );
};

export default IntegrationsSection;

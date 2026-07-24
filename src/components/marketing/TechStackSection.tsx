import React from 'react';
import { Cpu, Database, Server, ShieldCheck, Code, Zap } from 'lucide-react';

export const TechStackSection: React.FC = () => {
  return (
    <section className="py-16 bg-slate-950 border-t border-white/10 text-left text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-white/10 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cómo funciona por dentro</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Tecnología & Arquitectura del Agente Aria
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Detalles de ingeniería para auditores y equipos técnicos sobre el procesamiento RAG y sincronización de datos.
          </p>
        </div>

        {/* Technical Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3">
            <Database className="w-6 h-6 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Motor RAG & Búsqueda Vectorial</h3>
            <p className="text-slate-400 leading-relaxed">
              Indexa automáticamente memorias calidades, dossiers PDF y planos de planta para responder consultas complejas con datos exactos del inmueble.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3">
            <Server className="w-6 h-6 text-teal-400" />
            <h3 className="text-base font-bold text-white">Sincronización Multi-Fuente CRM</h3>
            <p className="text-slate-400 leading-relaxed">
              Conexión directa vía API REST con Tokko Broker y EasyBroker, manteniendo la disponibilidad y precios del catálogo al día.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3">
            <Code className="w-6 h-6 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Infraestructura Serverless & SSE</h3>
            <p className="text-slate-400 leading-relaxed">
              Streaming de respuestas en tiempo real (Server-Sent Events) sobre arquitectura sin servidor garantizando respuesta en milisegundos.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};

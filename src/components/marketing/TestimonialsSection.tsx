import React from 'react';
import { ShieldCheck, CheckCircle2, Building, Calendar, Bot, Lock } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const TestimonialsSection: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section className="py-20 bg-slate-900 border-b border-white/10 relative overflow-hidden text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Infraestructura Verificada & Cumplimiento</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Tecnología diseñada para operar con total confianza
          </h2>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Conexión oficial directa con las herramientas que ya utilizas a diario en tu agencia inmobiliaria.
          </p>
        </div>

        {/* 3 Pillars Grid (Authentic Quality Badges) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-7 rounded-3xl bg-slate-950/80 border border-white/10 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Building className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Sincronización Directa con tu CRM</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Integración nativa con Tokko Broker, EasyBroker y Webhooks para mantener tu inventario y tus leads sincronizados sin intervención manual.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Conexión vía API Key Oficial</span>
            </div>
          </div>

          <div className="p-7 rounded-3xl bg-slate-950/80 border border-white/10 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Agendamiento Automático de Citas</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              El asistente inteligente valida la disponibilidad de tu equipo y agende visitas directamente en tu Google Calendar.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-teal-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Cero Solapamientos de Horarios</span>
            </div>
          </div>

          <div className="p-7 rounded-3xl bg-slate-950/80 border border-white/10 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Seguridad RGPD & Cifrado SSL</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Tus datos de propiedades y los contactos de tus prospectos están protegidos bajo cifrado SSL de 256 bits y estrictas normas de privacidad.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-cyan-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Protección Total de Datos</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

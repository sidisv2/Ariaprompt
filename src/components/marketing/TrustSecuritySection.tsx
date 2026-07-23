import React from 'react';
import { ShieldCheck, Lock, Server, Key, FileCheck, CheckCircle2 } from 'lucide-react';

export const TrustSecuritySection: React.FC = () => {
  const seals = [
    {
      icon: <ShieldCheck className="w-5 h-5 text-indigo-600" />,
      title: 'Encriptación AES-256',
      desc: 'Seguridad bancaria en todas las conversaciones y datos de clientes.',
    },
    {
      icon: <Lock className="w-5 h-5 text-emerald-600" />,
      title: 'Cumplimiento RGPD / GDPR',
      desc: 'Protección estricta de datos personales de compradores e inmuebles.',
    },
    {
      icon: <Server className="w-5 h-5 text-teal-600" />,
      title: '99.9% Uptime SLA',
      desc: 'Infraestructura redundante en la nube activa 24/7/365 sin caídas.',
    },
    {
      icon: <Key className="w-5 h-5 text-amber-600" />,
      title: 'Aislamiento por Tenant',
      desc: 'Tus credenciales y bases de datos aisladas e inaccesibles por terceros.',
    },
  ];

  return (
    <section className="py-16 bg-slate-50 border-t border-slate-200/80 relative overflow-hidden text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-extrabold uppercase tracking-wider">
            <FileCheck className="w-4 h-4" />
            <span>Seguridad & Privacidad Nivel Enterprise</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Tu información inmobiliaria protegida bajo los <span className="text-indigo-600">más altos estándares</span>
          </h2>
        </div>

        {/* 4 Trust Seals Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {seals.map((s, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-indigo-300 transition-all duration-300 shadow-md hover:shadow-lg space-y-3 flex flex-col justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 shrink-0">
                  {s.icon}
                </div>
                <h3 className="text-sm font-extrabold text-slate-900 leading-snug">{s.title}</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{s.desc}</p>
              <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verificado & Certificado</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

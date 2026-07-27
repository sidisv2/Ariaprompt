import React from 'react';
import { ShieldCheck, Lock, Server, Key, FileCheck, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const TrustSecuritySection: React.FC = () => {
  const { t } = useLanguage();

  const seals = [
    {
      icon: <ShieldCheck className="w-5 h-5 text-indigo-400" />,
      title: t('seal.seal1Title') || 'Infraestructura ISO 27001',
      desc: t('seal.seal1Desc') || 'Servidores con certificación de seguridad global de grado bancario.',
    },
    {
      icon: <Lock className="w-5 h-5 text-emerald-400" />,
      title: t('seal.seal2Title') || 'Cifrado AES-256 / SSL',
      desc: t('seal.seal2Desc') || 'Todos los datos de tus prospectos y catálogo viajan cifrados de extremo a extremo.',
    },
    {
      icon: <Server className="w-5 h-5 text-teal-300" />,
      title: t('seal.seal3Title') || 'Conexión API Segura',
      desc: t('seal.seal3Desc') || 'Integraciones directas con Tokko Broker y EasyBroker sin almacenar credenciales en plano.',
    },
    {
      icon: <Key className="w-5 h-5 text-amber-400" />,
      title: t('seal.seal4Title') || 'Cumplimiento GDPR & Privacidad',
      desc: t('seal.seal4Desc') || 'Garantía total de propiedad sobre la base de datos de tus prospectos e inmuebles.',
    },
  ];

  return (
    <section className="py-16 bg-slate-900 border-t border-white/10 text-white relative overflow-hidden text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold uppercase tracking-wider">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <span>{t('seal.badge') || 'Garantías de Seguridad'}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            {t('seal.title') || 'Protección de Datos & Confianza Enterprise'}
          </h2>
        </div>

        {/* 4 Trust Seals Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {seals.map((s, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-950/90 border border-emerald-500/20 hover:border-emerald-400/50 transition-all duration-300 shadow-xl space-y-3 flex flex-col justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-emerald-500/30 shrink-0">
                  {s.icon}
                </div>
                <h3 className="text-sm font-black text-white leading-snug">{s.title}</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">{s.desc}</p>
              <div className="pt-2 border-t border-white/10 flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t('seal.verified') || 'Verificado'}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default TrustSecuritySection;

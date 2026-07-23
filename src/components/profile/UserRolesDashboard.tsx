import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserSubscriptionRole, AppRoute } from '../../types';
import { ShieldCheck, UserCheck, Zap, Star, Sparkles, CheckCircle2, Lock, ArrowRight, Building2, UserX, Crown } from 'lucide-react';

interface UserRolesDashboardProps {
  onRouteChange: (route: AppRoute) => void;
}

export const UserRolesDashboard: React.FC<UserRolesDashboardProps> = ({ onRouteChange }) => {
  const { user, signIn } = useAuth();

  // Active simulated role state for live preview
  const [activeRole, setActiveRole] = useState<UserSubscriptionRole>(() => {
    if (user?.role === 'admin' || localStorage.getItem('aria_prop_mock_role') === 'admin') return 'admin';
    if (user) return 'subscriber_pro';
    return 'unregistered_user';
  });

  const rolesList: {
    id: UserSubscriptionRole;
    title: string;
    badge: string;
    icon: React.ReactNode;
    color: string;
    description: string;
    features: string[];
  }[] = [
    {
      id: 'admin',
      title: 'Administrador (Dev Admin)',
      badge: 'Acceso Total Ilimitado',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
      color: 'border-emerald-500/50 bg-emerald-500/10',
      description: 'Superusuario con acceso completo a métricas, catálogo de inmuebles, intervención de leads en vivo y Aria AI ilimitado.',
      features: [
        'Consultas de IA Aria AI Ilimitadas',
        'Gestión de Catálogo RAG Completo',
        'Lead Scoring & Intervención Manual',
        'Configuración de Nombre, Tono & WhatsApp Bot',
        'Exportación de Analytics & Métricas CRM',
      ],
    },
    {
      id: 'subscriber_starter',
      title: 'Suscriptor Plan Starter',
      badge: 'Básico ($19/mes)',
      icon: <Zap className="w-5 h-5 text-teal-400" />,
      color: 'border-teal-500/30 bg-teal-500/5',
      description: 'Agente independiente con IA comercial para captación e inmuebles.',
      features: [
        'Hasta 500 Interacciones Mensuales',
        'Búsqueda RAG sobre 5 Inmuebles',
        'Calificación de Leads Básica',
        'Soporte por Email Prioritario',
      ],
    },
    {
      id: 'subscriber_pro',
      title: 'Suscriptor Plan Pro',
      badge: 'Recomendado ($39/mes)',
      icon: <Crown className="w-5 h-5 text-amber-400" />,
      color: 'border-amber-500/40 bg-amber-500/10',
      description: 'Agencia mediana con automatización avanzada e integraciones.',
      features: [
        'Hasta 2,500 Interacciones Mensuales',
        'Búsqueda RAG sobre 25 Inmuebles',
        'Integración con WhatsApp Business',
        'Exportación de Expedientes PDF',
        'Soporte 24/7 Preferencial',
      ],
    },
    {
      id: 'subscriber_custom',
      title: 'Suscriptor Plan Enterprise',
      badge: 'A Medida ($59/mes)',
      icon: <Sparkles className="w-5 h-5 text-emerald-400" />,
      color: 'border-emerald-500/40 bg-emerald-500/10',
      description: 'Red inmobiliaria o desarrolladora con infraestructura dedicada RAG ($59/mes).',
      features: [
        'Servidores RAG Dedicados',
        'Modelos Aria AI Personalizados',
        'API & Webhooks a Medida para CRM',
        'Gestor de Cuenta Dedicado',
        'Garantía SLA 99.9% de Disponibilidad',
      ],
    },
    {
      id: 'registered_user',
      title: 'Usuario Registrado (Cuenta Gratuita)',
      badge: 'Cuenta Gratis Verificada',
      icon: <UserCheck className="w-5 h-5 text-blue-400" />,
      color: 'border-blue-500/30 bg-blue-500/10',
      description: 'Usuario con cuenta registrada pero sin plan de suscripción activo. Opción de reclamar 7 días de prueba.',
      features: [
        '2 Consultas Gratis de Prueba Sandbox',
        'Acceso al Panel de Perfil de Usuario',
        'Opción de Activar Prueba Gratis de 7 Días',
        'Acceso a Calculadora de Precios y Ofertas',
      ],
    },
    {
      id: 'unregistered_user',
      title: 'Usuario No Registrado (Invitado / Anónimo)',
      badge: 'Visitante Web',
      icon: <UserX className="w-5 h-5 text-slate-400" />,
      color: 'border-slate-700 bg-slate-900/60',
      description: 'Visitante anónimo en la landing page. Límite de 2 mensajes de prueba antes de requerir autenticación.',
      features: [
        '2 Mensajes de Prueba Gratis en Sandbox',
        'Visualización de Catálogo de Muestra',
        'Acceso a Modal de Registro & Oferta 5% OFF',
        'Interacción Limitada sin Sesión Iniciada',
      ],
    },
  ];

  const handleSelectRole = async (roleId: UserSubscriptionRole) => {
    setActiveRole(roleId);
    if (roleId === 'admin') {
      await signIn({ email: 'admin@admin.com', password: 'admin' });
    }
  };

  return (
    <div className="space-y-8 animate-page-fade">
      
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-emerald-500/30 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Gestión de Roles & Suscripciones por Plan</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-2">
              Panel de Control de Roles de Usuario
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Prueba en vivo cómo interactúa la plataforma Aria Prop según el nivel de cuenta: Admin, Suscriptores a cada Plan (Starter, Pro, Custom), Usuarios Registrados y Visitantes.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-white/10 shrink-0 text-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Rol Simulado Activo:</span>
            <span className="text-xs font-extrabold text-emerald-400">
              {rolesList.find((r) => r.id === activeRole)?.badge}
            </span>
          </div>
        </div>

        {/* Role Quick Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-2">
          {rolesList.map((r) => {
            const isSelected = activeRole === r.id;
            return (
              <button
                key={r.id}
                onClick={() => handleSelectRole(r.id)}
                className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 font-extrabold border-emerald-400 shadow-lg scale-105'
                    : 'bg-slate-950/80 text-slate-300 border-white/10 hover:border-emerald-500/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`p-1 rounded-lg ${isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-white/5'}`}>
                    {r.icon}
                  </span>
                  {isSelected && <Sparkles className="w-3.5 h-3.5" />}
                </div>
                <span className="text-[11px] leading-tight font-bold">{r.title.split(' (')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Role Cards Grid Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        {rolesList.map((r) => {
          const isActive = activeRole === r.id;
          return (
            <div
              key={r.id}
              className={`rounded-3xl p-6 border transition-all flex flex-col justify-between space-y-4 ${r.color} ${
                isActive ? 'ring-2 ring-emerald-400 scale-[1.02]' : ''
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-2xl bg-slate-950/80 border border-white/10">
                    {r.icon}
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-950 text-emerald-300 border border-white/10">
                    {r.badge}
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-white">{r.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed min-h-[48px]">
                  {r.description}
                </p>

                <div className="pt-2 border-t border-white/10 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Permisos & Capacidades:</span>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {r.features.map((feat, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <button
                onClick={() => handleSelectRole(r.id)}
                className={`w-full py-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <span>{isActive ? 'Rol Simulado Activo' : `Simular Rol ${r.title.split(' ')[0]}`}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default UserRolesDashboard;

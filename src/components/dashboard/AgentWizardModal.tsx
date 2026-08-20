import React, { useState } from 'react';
import {
  Bot,
  UserCheck,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  MessageSquare,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getPlanLimits } from '../../lib/planLimits';
import { supabase } from '../../lib/supabaseClient';

export interface AgentData {
  id?: string;
  name: string;
  avatar: string;
  agencyName: string;
  tone: 'formal' | 'friendly' | 'direct';
  whatsappNumber: string;
  alertEmail: string;
  welcomeMessage: string;
  calendarBookingUrl: string;
  fallbackBehavior: 'ask_human' | 'transfer_whatsapp' | 'offer_call';
}

interface AgentWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAgent?: (agent: AgentData) => void;
  existingAgentsCount?: number;
  initialData?: Partial<AgentData>;
}

export const AgentWizardModal: React.FC<AgentWizardModalProps> = ({
  isOpen,
  onClose,
  onSaveAgent,
  existingAgentsCount = 0,
  initialData,
}) => {
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<AgentData>({
    name: initialData?.name || 'Aria',
    avatar: initialData?.avatar || '🤖',
    agencyName: initialData?.agencyName || 'Inmobiliaria Palermo',
    tone: initialData?.tone || 'friendly',
    whatsappNumber: initialData?.whatsappNumber || '5491123456789',
    alertEmail: initialData?.alertEmail || user?.email || 'alertas@inmobiliariapalermo.com',
    welcomeMessage:
      initialData?.welcomeMessage ||
      '¡Hola! Soy tu asesora virtual inmobiliaria 24/7. ¿Qué tipo de propiedad estás buscando en venta o alquiler?',
    calendarBookingUrl:
      initialData?.calendarBookingUrl || 'https://cal.com/inmobiliaria-palermo/visita',
    fallbackBehavior: initialData?.fallbackBehavior || 'transfer_whatsapp',
  });

  if (!isOpen) return null;

  // Plan Limit Checking
  const isOwner =
    user?.isOwner || user?.email?.toLowerCase().trim() === 'valentinlautaromorales@gmail.com';
  const planTier = isOwner ? 'desarrolladores' : user?.plan ?? 'normal';
  const planLimits = getPlanLimits(planTier);
  const maxAgentsAllowed = isOwner ? 999999 : planLimits.maxAgents;
  const isLimitReached = !initialData?.id && existingAgentsCount >= maxAgentsAllowed;

  const handleNext = () => {
    if (step === 1) {
      if (!formData.name.trim() || !formData.agencyName.trim()) {
        setError('Por favor completa el nombre del agente y de la inmobiliaria.');
        return;
      }
    }
    if (step === 2) {
      if (!formData.whatsappNumber.trim()) {
        setError('Por favor ingresa un número de WhatsApp comercial para derivación.');
        return;
      }
    }
    setError(null);
    if (step < 3) setStep((step + 1) as 2 | 3);
  };

  const handleBack = () => {
    setError(null);
    if (step > 1) setStep((step - 1) as 1 | 2);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      if (supabase) {
        await supabase.from('agents').upsert({
          id: formData.id,
          organization_id: user?.id,
          name: formData.name,
          avatar: formData.avatar,
          agency_name: formData.agencyName,
          tone: formData.tone,
          whatsapp_number: formData.whatsappNumber,
          alert_email: formData.alertEmail,
          welcome_message: formData.welcomeMessage,
          calendar_booking_url: formData.calendarBookingUrl,
          fallback_behavior: formData.fallbackBehavior,
          updated_at: new Date().toISOString(),
        });
      }

      if (onSaveAgent) {
        onSaveAgent(formData);
      }

      onClose();
    } catch (e: any) {
      console.error('Error saving agent config:', e);
      setError(e?.message || 'Error al guardar la configuración del agente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn font-sans">
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-emerald-500/40 p-6 sm:p-8 shadow-2xl text-white space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/20 shrink-0">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold border border-emerald-500/30 uppercase tracking-wider">
                Configuración de Agentes IA
              </span>
              <span className="text-xs text-slate-400">
                Paso {step} de 3
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-white mt-1">
              {step === 1 && 'Paso 1: Identidad & Tono del Agente'}
              {step === 2 && 'Paso 2: Derivación & Alertas Directas'}
              {step === 3 && 'Paso 3: Reglas de Negocio & Calendario'}
            </h3>
          </div>
        </div>

        {/* Plan Limit Warning */}
        {isLimitReached && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Límite alcanzado ({existingAgentsCount}/{maxAgentsAllowed} Agentes). Mejorá tu plan para crear más agentes de IA activos.
            </span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Wizard Steps Indicator */}
        <div className="flex items-center justify-between px-4 py-2 rounded-2xl bg-slate-950/60 border border-white/5 text-xs font-bold">
          <div className={`flex items-center gap-2 ${step === 1 ? 'text-emerald-400' : 'text-slate-500'}`}>
            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">1</span>
            <span>Identidad</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-600" />
          <div className={`flex items-center gap-2 ${step === 2 ? 'text-emerald-400' : 'text-slate-500'}`}>
            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">2</span>
            <span>Alertas</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-600" />
          <div className={`flex items-center gap-2 ${step === 3 ? 'text-emerald-400' : 'text-slate-500'}`}>
            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">3</span>
            <span>Reglas</span>
          </div>
        </div>

        {/* ─── STEP 1: IDENTIDAD Y TONO ─── */}
        {step === 1 && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">Nombre del Agente</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Aria, Sofía, Lucas"
                  className="w-full p-3 rounded-xl bg-slate-950 border border-white/10 text-white focus:border-emerald-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">Avatar / Emoji</label>
                <select
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-white/10 text-white focus:border-emerald-400 outline-none"
                >
                  <option value="🤖">🤖 Bot IA Tecnológico</option>
                  <option value="👩‍💼">👩‍💼 Asesora Profesional</option>
                  <option value="👨‍💼">👨‍💼 Asesor Ejecutivo</option>
                  <option value="🏢">🏢 Inmobiliaria Oficial</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1.5">Nombre de la Inmobiliaria</label>
              <input
                type="text"
                value={formData.agencyName}
                onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                placeholder="Ej: Inmobiliaria Palermo Properties"
                className="w-full p-3 rounded-xl bg-slate-950 border border-white/10 text-white focus:border-emerald-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-2">Tono de Comunicación</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: 'formal', title: '🎩 Formal', desc: 'Protocolar, técnico y ejecutivo' },
                  { key: 'friendly', title: '🤝 Cercano / Empático', desc: 'Cálido, amigable y resolutivo' },
                  { key: 'direct', title: '⚡ Directo al Grano', desc: 'Respuestas breves y ágiles' },
                ].map((tone) => (
                  <button
                    key={tone.key}
                    type="button"
                    onClick={() => setFormData({ ...formData, tone: tone.key as any })}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      formData.tone === tone.key
                        ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-md'
                        : 'bg-slate-950 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-extrabold text-xs mb-0.5">{tone.title}</div>
                    <div className="text-[10px] text-slate-400 leading-tight">{tone.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── STEP 2: DERIVACIÓN Y ALERTAS ─── */}
        {step === 2 && (
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">
                <Phone className="w-3.5 h-3.5 inline mr-1 text-emerald-400" />
                WhatsApp Comercial para Derivación de Leads
              </label>
              <input
                type="text"
                value={formData.whatsappNumber}
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                placeholder="Ej: 5491123456789 (con código de país sin +)"
                className="w-full p-3 rounded-xl bg-slate-950 border border-white/10 text-white focus:border-emerald-400 outline-none"
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                Cuando un lead califique su presupuesto o pida visita, Aria enviará una alerta a este WhatsApp.
              </span>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1.5">
                <Mail className="w-3.5 h-3.5 inline mr-1 text-teal-400" />
                Correo Electrónico para Alertas de Visitas
              </label>
              <input
                type="email"
                value={formData.alertEmail}
                onChange={(e) => setFormData({ ...formData, alertEmail: e.target.value })}
                placeholder="alertas@inmobiliaria.com"
                className="w-full p-3 rounded-xl bg-slate-950 border border-white/10 text-white focus:border-emerald-400 outline-none"
              />
            </div>
          </div>
        )}

        {/* ─── STEP 3: REGLAS Y CALENDARIO ─── */}
        {step === 3 && (
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">Mensaje de Bienvenida Personalizado</label>
              <textarea
                rows={2}
                value={formData.welcomeMessage}
                onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
                className="w-full p-3 rounded-xl bg-slate-950 border border-white/10 text-white focus:border-emerald-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1.5">
                <Calendar className="w-3.5 h-3.5 inline mr-1 text-emerald-400" />
                Link de Google Calendar / Calendly para Visitas
              </label>
              <input
                type="url"
                value={formData.calendarBookingUrl}
                onChange={(e) => setFormData({ ...formData, calendarBookingUrl: e.target.value })}
                placeholder="https://cal.com/tu-inmobiliaria/visitas"
                className="w-full p-3 rounded-xl bg-slate-950 border border-white/10 text-white focus:border-emerald-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1.5">Comportamiento ante dudas no registradas</label>
              <select
                value={formData.fallbackBehavior}
                onChange={(e) => setFormData({ ...formData, fallbackBehavior: e.target.value as any })}
                className="w-full p-3 rounded-xl bg-slate-950 border border-white/10 text-white focus:border-emerald-400 outline-none"
              >
                <option value="transfer_whatsapp">Derivar al WhatsApp de un asesor comercial</option>
                <option value="ask_human">Solicitar datos de contacto para llamada posterior</option>
                <option value="offer_call">Ofrecer agendamiento directo en calendario</option>
              </select>
            </div>
          </div>
        )}

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          {step > 1 ? (
            <button
              onClick={handleBack}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Anterior</span>
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1 cursor-pointer shadow-md shadow-emerald-500/20"
            >
              <span>Siguiente</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving || isLimitReached}
              className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/25 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{saving ? 'Guardando Agente...' : 'Guardar Agente IA'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentWizardModal;

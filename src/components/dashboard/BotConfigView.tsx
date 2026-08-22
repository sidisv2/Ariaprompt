import React, { useState, useEffect } from 'react';
import { BotConfig } from '../../types';
import { 
  Bot, 
  Code, 
  Copy, 
  Check, 
  Sliders, 
  Sparkles, 
  Eye, 
  Zap,
  Plus,
  Trash2,
  Save,
  MessageSquare,
  HelpCircle,
  ShieldAlert,
  Loader2,
  Send,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

import { WhatsAppSettings } from './WhatsAppSettings';
import { AgentWizardModal, AgentData } from './AgentWizardModal';
import { TeamAssignmentSettings } from '../settings/TeamAssignmentSettings';
import { WebchatWidgetSnippet } from '../settings/WebchatWidgetSnippet';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export interface FaqItem {
  question: string;
  answer: string;
}

interface BotConfigViewProps {
  botConfig: BotConfig;
  onUpdateBotConfig: (updated: Partial<BotConfig>) => void;
}

export const BotConfigView: React.FC<BotConfigViewProps> = ({ botConfig, onUpdateBotConfig }) => {
  const { user } = useAuth();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [agentName, setAgentName] = useState(botConfig.agentName || 'Aria');
  const [agencyName, setAgencyName] = useState(botConfig.agencyName || 'Inmobiliaria Palermo');
  const [welcomeMsg, setWelcomeMsg] = useState(botConfig.welcomeMessage || '¡Hola! Soy tu asesora virtual 24/7. ¿Qué tipo de propiedad estás buscando?');
  const [primaryColor, setPrimaryColor] = useState(botConfig.primaryColor || '#10b981');
  const [whatsapp, setWhatsapp] = useState(botConfig.whatsappNumber || '');
  const [systemPrompt, setSystemPrompt] = useState(botConfig.customSystemPrompt || '');

  // Bot Identity & Tone State
  const [botTone, setBotTone] = useState<'friendly' | 'formal' | 'luxury' | 'direct'>('friendly');
  const [calendarBookingUrl, setCalendarBookingUrl] = useState<string>('https://cal.com/inmobiliaria-palermo/visita');
  const [customInstructions, setCustomInstructions] = useState<string>(
    'No aceptamos alquileres temporales de menos de 3 meses. El horario de visitas presenciales es de Lunes a Viernes de 10 a 18 hs.'
  );
  
  // Notifications Settings State
  const [alertEmail, setAlertEmail] = useState<string>('alertas@inmobiliariapalermo.com');
  const [advisorAlertPhone, setAdvisorAlertPhone] = useState<string>('5491123456789');
  const [notifyWhatsappVisit, setNotifyWhatsappVisit] = useState<boolean>(true);
  const [desktopPermission, setDesktopPermission] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  const handleRequestDesktopPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      setDesktopPermission(perm);
    }
  };

  // FAQ Dynamic List
  const [faqList, setFaqList] = useState<FaqItem[]>([
    { question: '¿Cuáles son las comisiones inmobiliarias?', answer: 'Cobramos un 3% en operaciones de venta y 1 mes de honorarios en alquileres.' },
    { question: '¿Aceptan mascotas en los alquileres?', answer: 'Depende de cada propiedad. Consúltanos por la ficha del departamento específico.' },
  ]);

  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load existing organization configuration from Supabase
  useEffect(() => {
    async function loadOrgConfig() {
      if (!supabase || !user?.id) return;
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id, advisor_alert_phone, phone')
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
          if (profile.advisor_alert_phone || profile.phone) {
            setAdvisorAlertPhone(profile.advisor_alert_phone || profile.phone);
          }

          if (profile.organization_id) {
            const { data: org } = await supabase
              .from('organizations')
              .select('bot_name, bot_tone, custom_prompt_instructions, faq_knowledge, calendar_booking_url, alert_email, advisor_alert_phone, name, welcome_message, system_prompt')
              .eq('id', profile.organization_id)
              .maybeSingle();

            if (org) {
              if (org.bot_name) setAgentName(org.bot_name);
              if (org.name) setAgencyName(org.name);
              if (org.calendar_booking_url) setCalendarBookingUrl(org.calendar_booking_url);
              if (org.alert_email) setAlertEmail(org.alert_email);
              if (org.advisor_alert_phone) setAdvisorAlertPhone(org.advisor_alert_phone);
              if (['friendly', 'formal', 'luxury', 'direct'].includes(org.bot_tone)) {
                setBotTone(org.bot_tone as any);
              }
              if (org.custom_prompt_instructions) {
                setCustomInstructions(org.custom_prompt_instructions);
              }
              if (org.welcome_message) {
                setWelcomeMsg(org.welcome_message);
              }
              if (org.system_prompt) {
                setSystemPrompt(org.system_prompt);
              }
              if (org.faq_knowledge) {
                try {
                  const parsed = typeof org.faq_knowledge === 'string' ? JSON.parse(org.faq_knowledge) : org.faq_knowledge;
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    setFaqList(parsed);
                  }
                } catch {}
              }
            }
          }
        }
      } catch (err) {
        console.warn('Could not load org bot settings from Supabase:', err);
      }
    }
    loadOrgConfig();
  }, [user]);

  const activeAgencyId = user?.id || botConfig.agentId || 'agency-default';
  const embedScript = `<script src="https://ariaprop.online/embed/chat.js" data-agency-id="${activeAgencyId}"></script>`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(embedScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleAddFaq = () => {
    setFaqList((prev) => [...prev, { question: '', answer: '' }]);
  };

  const handleRemoveFaq = (index: number) => {
    setFaqList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFaqChange = (index: number, field: 'question' | 'answer', value: string) => {
    setFaqList((prev) => {
      const copy = [...prev];
      copy[index][field] = value;
      return copy;
    });
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    // 1. Update local App state
    onUpdateBotConfig({
      agentName,
      agencyName,
      welcomeMessage: welcomeMsg,
      primaryColor,
      whatsappNumber: whatsapp,
      customSystemPrompt: systemPrompt || customInstructions,
    });

    // 2. Persist to Supabase `organizations` table
    if (supabase && user?.id) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', user.id)
          .maybeSingle();

        const validFaqs = faqList.filter((f) => f.question.trim() && f.answer.trim());
        const cleanAdvisorPhone = advisorAlertPhone.replace(/[^0-9]/g, '');

        let orgId = profile?.organization_id;

        if (!orgId) {
          const { data: newOrg } = await supabase
            .from('organizations')
            .upsert({
              user_id: user.id,
              name: agencyName,
              bot_name: agentName,
              bot_tone: botTone,
              custom_prompt_instructions: customInstructions,
              system_prompt: systemPrompt,
              welcome_message: welcomeMsg,
              faq_knowledge: validFaqs,
              calendar_booking_url: calendarBookingUrl.trim(),
              alert_email: alertEmail.trim(),
              advisor_alert_phone: cleanAdvisorPhone,
              updated_at: new Date().toISOString(),
            })
            .select('id')
            .single();

          if (newOrg?.id) {
            orgId = newOrg.id;
            await supabase.from('profiles').update({ organization_id: orgId }).eq('id', user.id);
          }
        } else {
          await supabase
            .from('organizations')
            .update({
              name: agencyName,
              bot_name: agentName,
              bot_tone: botTone,
              custom_prompt_instructions: customInstructions,
              system_prompt: systemPrompt,
              welcome_message: welcomeMsg,
              faq_knowledge: validFaqs,
              calendar_booking_url: calendarBookingUrl.trim(),
              alert_email: alertEmail.trim(),
              advisor_alert_phone: cleanAdvisorPhone,
              updated_at: new Date().toISOString(),
            })
            .eq('id', orgId);
        }

        await supabase
          .from('profiles')
          .update({
            advisor_alert_phone: cleanAdvisorPhone,
            phone: cleanAdvisorPhone,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } catch (err: any) {
        console.error('Error saving bot config to Supabase:', err);
        setSaveError(err?.message || 'Error al guardar la configuración');
      }
    } else {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }

    setSaving(false);
  };

  return (
    <div className="space-y-8 p-4 sm:p-6 max-w-6xl mx-auto text-slate-100">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Bot className="w-6 h-6 text-emerald-400" />
            Configuración de Identidad & Reglas de Negocio del Bot
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Personaliza la personalidad, tono comercial, reglas de atención y preguntas frecuentes de tu asistente de IA de WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsWizardOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/25 hover:scale-105 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 fill-slate-950 text-slate-950" />
            <span>Wizard Configurar Agente</span>
          </button>

          <div className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-bold flex items-center gap-1.5">
            <Zap className="w-4 h-4" />
            <span>Aria AI Engine 2.5 Active</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Settings Column (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Form Settings */}
          <form onSubmit={handleSaveConfig} className="p-6 rounded-3xl bg-slate-900/90 border border-white/10 shadow-2xl space-y-6 text-xs backdrop-blur-xl">
            
            {/* Identity & Basic Params */}
            <div className="space-y-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-white/10 pb-3">
                <Sliders className="w-4 h-4 text-emerald-400" />
                Identidad del Asistente & Marca
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nombre del Asistente IA</label>
                  <input
                    type="text"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder="Ej: Valeria de Inmobiliaria Palermo"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nombre de la Inmobiliaria</label>
                  <input
                    type="text"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Mensaje de Saludo Inicial (WhatsApp / Webchat)</label>
                <textarea
                  rows={2}
                  value={welcomeMsg}
                  onChange={(e) => setWelcomeMsg(e.target.value)}
                  placeholder="¡Hola! Soy tu asesora virtual 24/7..."
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                  <span>Enlace de Agenda de Visitas (Calendly / Cal.com / Google Calendar)</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Auto-Entregable en WhatsApp</span>
                </label>
                <input
                  type="url"
                  value={calendarBookingUrl}
                  onChange={(e) => setCalendarBookingUrl(e.target.value)}
                  placeholder="Ej: https://cal.com/inmobiliaria-palermo/visita"
                  className="w-full bg-slate-950 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-emerald-300 font-mono focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* Personality / Tone Selection */}
            <div className="space-y-3">
              <label className="block text-slate-300 font-semibold">Tono y Personalidad de Conversación</label>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'friendly', label: 'Cálido & Cercano', desc: 'Trato cordial tuteando al cliente' },
                  { id: 'formal', label: 'Profesional', desc: 'Ejecutivo y trato de usted' },
                  { id: 'luxury', label: 'Luxury & Premium', desc: 'Elegante y refinado para alta gama' },
                  { id: 'direct', label: 'Directo & Conciso', desc: 'Orientado a datos técnicos y precios' },
                ].map((tone) => (
                  <button
                    type="button"
                    key={tone.id}
                    onClick={() => setBotTone(tone.id as any)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer space-y-1 ${
                      botTone === tone.id
                        ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-950/60 border-white/5 text-slate-400 hover:text-white hover:bg-slate-950'
                    }`}
                  >
                    <span className="font-bold text-[11px] block">{tone.label}</span>
                    <span className="text-[9px] opacity-75 block leading-tight">{tone.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Business Rules & Special Instructions */}
            <div className="space-y-2">
              <label className="block text-slate-300 font-semibold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
                Reglas de Negocio e Instrucciones Especiales
              </label>
              <p className="text-[11px] text-slate-400">
                Pautas comerciales que el bot debe respetar estrictamente en WhatsApp (ej: requisitos de garantía, comisiones o restricciones de horarios).
              </p>
              <textarea
                rows={3}
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="Escribe las políticas de tu agencia..."
                className="w-full bg-slate-950 border border-white/10 rounded-2xl p-3 text-white font-sans focus:outline-none focus:border-emerald-500 transition-all resize-none"
              />
            </div>

            {/* Dynamic FAQ Knowledge Base */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="block text-slate-300 font-semibold flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-emerald-400" />
                  Base de Conocimiento & Preguntas Frecuentes (FAQ)
                </label>
                <button
                  type="button"
                  onClick={handleAddFaq}
                  className="px-2.5 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-[11px] border border-emerald-500/30 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Pregunta</span>
                </button>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {faqList.map((faq, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2 relative group">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-emerald-400 font-bold uppercase font-mono">Pregunta #{idx + 1}</span>
                      {faqList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveFaq(idx)}
                          className="text-slate-500 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={faq.question}
                      onChange={(e) => handleFaqChange(idx, 'question', e.target.value)}
                      placeholder="Ej: ¿Cuáles son las comisiones inmobiliarias?"
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />

                    <textarea
                      rows={2}
                      value={faq.answer}
                      onChange={(e) => handleFaqChange(idx, 'answer', e.target.value)}
                      placeholder="Respuesta oficial que dará el bot..."
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Clean Notifications & Alert Settings */}
            <div className="space-y-4 pt-2 border-t border-white/10">
              <label className="block text-slate-300 font-semibold flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-emerald-400" />
                Notificaciones & Alertas Comerciales
              </label>
              <p className="text-[11px] text-slate-400">
                Configura los canales inmediatos para avisar a tus asesores cuando un lead solicite atención presencial o sea cualificado.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-slate-300 font-semibold mb-1">Email para Resumen de Lead</label>
                  <input
                    type="email"
                    value={alertEmail}
                    onChange={(e) => setAlertEmail(e.target.value)}
                    placeholder="alertas@inmobiliaria.com"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-300 font-semibold mb-1">WhatsApp Interno de Alertas del Asesor</label>
                  <input
                    type="tel"
                    value={advisorAlertPhone}
                    onChange={(e) => setAdvisorAlertPhone(e.target.value)}
                    placeholder="Ej: 5491123456789"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Immediate Visit Alert Switch */}
              <label className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 flex items-center justify-between gap-3 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-white">Recibir alertas inmediatas cuando un cliente pida visita</p>
                  <p className="text-[11px] text-slate-400">
                    Despacha mensaje automático al WhatsApp del asesor al detectar solicitud de visita o score ≥ 80.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyWhatsappVisit}
                  onChange={(e) => setNotifyWhatsappVisit(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer shrink-0"
                />
              </label>

              {/* Desktop Browser Notifications Button */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-white">Notificaciones Web de Escritorio</p>
                  <p className="text-[11px] text-slate-400">
                    Emite alertas emergentes y sonido de campana en vivo cuando llegue un nuevo mensaje o handover en el CRM.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleRequestDesktopPermission}
                  className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer shrink-0 ${
                    desktopPermission === 'granted'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                  }`}
                >
                  {desktopPermission === 'granted' ? '✓ Notificaciones Activas' : 'Activar Notificaciones'}
                </button>
              </div>
            </div>

            {/* Save Alerts & Button */}
            {saveSuccess && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>¡Configuración guardada exitosamente en la base de datos!</span>
              </div>
            )}

            {saveError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : <Save className="w-4 h-4 fill-current text-slate-950" />}
                <span>Guardar Configuración del Bot</span>
              </button>
            </div>

          </form>

        </div>

        {/* Right Live Preview Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-400" />
              Vista Previa en Tiempo Real
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">WhatsApp Widget</span>
          </div>

          <div className="p-4 rounded-3xl bg-slate-900/90 border border-white/10 shadow-2xl flex items-center justify-center backdrop-blur-xl">
            <div className="w-full max-w-sm rounded-2xl bg-[#0b141a] border border-white/10 shadow-xl overflow-hidden flex flex-col h-[520px]">
              
              {/* WhatsApp Header Preview */}
              <div className="p-3.5 bg-[#202c33] text-white font-bold flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
                    AP
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white leading-tight">{agentName}</p>
                    <p className="text-[10px] text-emerald-400 font-medium">{agencyName} • en línea</p>
                  </div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>

              {/* Chat Messages Preview */}
              <div className="flex-1 p-3.5 space-y-3 text-xs overflow-y-auto bg-[#0b141a]">
                <div className="p-3 rounded-2xl bg-[#202c33] text-slate-100 rounded-tl-none border border-white/5">
                  👋 {welcomeMsg}
                </div>

                <div className="p-3 rounded-2xl bg-[#005c4b] text-white rounded-tr-none ml-auto max-w-[80%]">
                  Hola, ¿cuáles son los horarios de visita?
                </div>

                <div className="p-3 rounded-2xl bg-[#202c33] text-slate-100 rounded-tl-none border border-white/5 space-y-1">
                  <p>
                    {customInstructions || 'El horario de visitas presenciales es de Lunes a Viernes de 10 a 18 hs.'}
                  </p>
                  <span className="text-[9px] text-slate-400 block text-right font-mono">09:42</span>
                </div>
              </div>

              {/* Input Preview */}
              <div className="p-2.5 bg-[#202c33] border-t border-white/5 flex items-center gap-2">
                <div className="flex-1 bg-[#2a3942] rounded-full px-4 py-2 text-slate-400 text-xs">
                  Escribe un mensaje...
                </div>
              </div>

            </div>
          </div>

          {/* Embed Code Helper Box */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                <Code className="w-4 h-4 text-emerald-400" />
                Script Web Embebible
              </h4>
              <button
                onClick={handleCopyScript}
                className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10px] transition-all flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-slate-950 border border-white/5 text-emerald-400 font-mono text-[10px] overflow-x-auto whitespace-pre-wrap break-all">
              {embedScript}
            </pre>
          </div>

        </div>

      </div>

      {/* Webchat Embeddable Widget Customizer */}
      <div className="pt-6 border-t border-white/10">
        <WebchatWidgetSnippet
          agentId={activeAgencyId}
          agentName={agentName}
          agencyName={agencyName}
          initialWelcome={welcomeMsg}
        />
      </div>

      {/* Commercial Team Round-Robin Lead Assignment */}
      <div className="pt-6 border-t border-white/10">
        <TeamAssignmentSettings />
      </div>

      {/* WhatsApp Official Embedded Signup Section */}
      <div className="pt-6 border-t border-white/10">
        <WhatsAppSettings />
      </div>

      {/* Agent Setup Wizard Modal */}
      <AgentWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSaveAgent={(agent: AgentData) => {
          setAgentName(agent.name);
          setAgencyName(agent.agencyName);
          setWelcomeMsg(agent.welcomeMessage);
          setWhatsapp(agent.whatsappNumber);
          setCalendarBookingUrl(agent.calendarBookingUrl);
          setAlertEmail(agent.alertEmail);
          setBotTone(agent.tone);
          onUpdateBotConfig({
            agentName: agent.name,
            agencyName: agent.agencyName,
            welcomeMessage: agent.welcomeMessage,
            whatsappNumber: agent.whatsappNumber,
          });
        }}
      />

    </div>
  );
};

export default BotConfigView;

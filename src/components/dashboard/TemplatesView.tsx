import React, { useState } from 'react';
import {
  FileCode,
  Send,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  User,
  Loader2,
  RefreshCw,
  MessageSquare,
  Zap,
  Check,
  X
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export interface HsmTemplateItem {
  id: string;
  name: string;
  category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
  language: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  description: string;
  bodyPreview: string;
  variables: string[];
}

const DEFAULT_TEMPLATES: HsmTemplateItem[] = [
  {
    id: 'tpl-1',
    name: 'confirmacion_visita_v1',
    category: 'UTILITY',
    language: 'es',
    status: 'APPROVED',
    description: 'Confirmación de cita presencial para recorrer una propiedad.',
    bodyPreview: 'Hola {{1}}, confirmamos tu cita de visita para la propiedad ubicada en {{2}} el día {{3}}. ¿Nos confirmas tu asistencia?',
    variables: ['Nombre del Lead', 'Ubicación Inmueble', 'Fecha y Hora'],
  },
  {
    id: 'tpl-2',
    name: 'seguimiento_propiedad_v1',
    category: 'MARKETING',
    language: 'es',
    status: 'APPROVED',
    description: 'Reactivación automática de prospectos sin interacción por más de 24 horas.',
    bodyPreview: 'Hola {{1}}, ¿sigues buscando inmueble en {{2}}? Recientemente ingresaron 2 nuevas propiedades que coinciden con tus preferencias.',
    variables: ['Nombre del Lead', 'Zona de Interés'],
  },
  {
    id: 'tpl-3',
    name: 'nuevas_opciones_v1',
    category: 'MARKETING',
    language: 'es',
    status: 'APPROVED',
    description: 'Notificación de nuevo inmueble ingresado al catálogo de la agencia.',
    bodyPreview: 'Hola {{1}}, acaba de ingresar una oportunidad imperdible en {{2}} por {{3}}. Haz clic en el enlace para ver las fotos y ficha en PDF.',
    variables: ['Nombre del Lead', 'Zona Inmueble', 'Precio USD'],
  },
];

export const TemplatesView: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<HsmTemplateItem>(DEFAULT_TEMPLATES[0]);
  const [targetPhone, setTargetPhone] = useState<string>('');
  const [param1, setParam1] = useState<string>('Juan Pérez');
  const [param2, setParam2] = useState<string>('Palermo Soho');
  const [param3, setParam3] = useState<string>('Mañana 16:00 hs');

  const [sending, setSending] = useState<boolean>(false);
  const [dispatchNotice, setDispatchNotice] = useState<{ success: boolean; msg: string } | null>(null);

  const [reactivating, setReactivating] = useState<boolean>(false);
  const [reactivateResult, setReactivateResult] = useState<string | null>(null);

  const handleSendManualTemplate = async () => {
    if (!targetPhone.trim()) {
      setDispatchNotice({ success: false, msg: 'Por favor ingresa un número de teléfono válido.' });
      return;
    }

    setSending(true);
    setDispatchNotice(null);

    try {
      let token = '';
      if (supabase) {
        const { data: sessionData } = await supabase.auth.getSession();
        token = sessionData.session?.access_token || '';
      }

      const parameters = [];
      if (param1) parameters.push({ type: 'text', text: param1 });
      if (param2) parameters.push({ type: 'text', text: param2 });
      if (param3 && selectedTemplate.variables.length > 2) parameters.push({ type: 'text', text: param3 });

      const payload = {
        phone: targetPhone.trim(),
        templateName: selectedTemplate.name,
        languageCode: selectedTemplate.language,
        components: [
          {
            type: 'body',
            parameters,
          },
        ],
      };

      const res = await fetch('/api/crm?action=send_template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setDispatchNotice({
          success: true,
          msg: `¡Plantilla HSM '${selectedTemplate.name}' enviada con éxito a +${targetPhone}!`,
        });
      } else {
        setDispatchNotice({
          success: false,
          msg: data.error || 'Error al despachar plantilla con Meta Graph API.',
        });
      }
    } catch (err: any) {
      setDispatchNotice({ success: false, msg: err.message || 'Error de conexión.' });
    } finally {
      setSending(false);
    }
  };

  const handleReactivateLeads = async () => {
    setReactivating(true);
    setReactivateResult(null);
    try {
      let token = '';
      if (supabase) {
        const { data: sessionData } = await supabase.auth.getSession();
        token = sessionData.session?.access_token || '';
      }

      const res = await fetch('/api/crm?action=reactivate_inactive_leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setReactivateResult(`✅ ${data.message}`);
      } else {
        setReactivateResult(`⚠️ ${data.error || 'No se pudieron procesar las reactivaciones.'}`);
      }
    } catch (err: any) {
      setReactivateResult(`❌ ${err.message || 'Error de conexión.'}`);
    } finally {
      setReactivating(false);
    }
  };

  // Render preview string replacing {{1}}, {{2}}, {{3}}
  const getRenderedPreview = () => {
    return selectedTemplate.bodyPreview
      .replace('{{1}}', param1 || '{{1}}')
      .replace('{{2}}', param2 || '{{2}}')
      .replace('{{3}}', param3 || '{{3}}');
  };

  return (
    <div className="space-y-6 text-slate-100 pb-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileCode className="w-6 h-6 text-emerald-400" />
            Plantillas de Mensajes HSM & Reactivación de 24 Horas
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Plantillas oficiales aprobadas por Meta para retomar conversaciones fuera de la ventana de 24h y re-enganchar prospectos.
          </p>
        </div>

        <button
          onClick={handleReactivateLeads}
          disabled={reactivating}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {reactivating ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : <Zap className="w-4 h-4 fill-current text-slate-950" />}
          <span>Reactivar Leads de +24h</span>
        </button>
      </div>

      {reactivateResult && (
        <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <span>{reactivateResult}</span>
          <button onClick={() => setReactivateResult(null)} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Template Catalog & Interactive Dispatcher */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Template Cards List (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Plantillas Oficiales Registradas</h3>

          {DEFAULT_TEMPLATES.map((tpl) => {
            const isSelected = selectedTemplate.id === tpl.id;
            return (
              <div
                key={tpl.id}
                onClick={() => setSelectedTemplate(tpl)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 relative ${
                  isSelected
                    ? 'bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-900/90 hover:bg-slate-900 border-white/10'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-white">{tpl.name}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    ✓ APROBADA
                  </span>
                </div>

                <p className="text-xs text-slate-300">{tpl.description}</p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/5 font-mono">
                  <span>Categoría: {tpl.category}</span>
                  <span>Idioma: {tpl.language.toUpperCase()}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Interactive Preview & Manual Dispatcher (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-white/10 rounded-3xl p-6 space-y-6 shadow-xl backdrop-blur-xl">
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-white text-base">Vista Previa & Envío Manual</h3>
              <span className="text-xs font-mono text-emerald-400">{selectedTemplate.name}</span>
            </div>
            <p className="text-xs text-slate-400">
              Personaliza las variables del mensaje y realiza un envío de prueba directo por WhatsApp.
            </p>
          </div>

          {/* WhatsApp Bubble Preview Card */}
          <div className="bg-[#0b141a] border border-white/10 rounded-2xl p-4 space-y-2">
            <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Simulación de Mensaje Entrante</div>
            
            <div className="bg-[#202c33] text-slate-100 rounded-2xl rounded-tl-none p-3.5 text-xs leading-relaxed max-w-lg shadow-md border border-white/5">
              <p>{getRenderedPreview()}</p>
              <div className="text-[9px] text-slate-400 text-right mt-1 font-mono">
                {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          {/* Dynamic Variable Inputs */}
          <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-white/5">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Variables de la Plantilla</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Teléfono Destino</label>
                <input
                  type="text"
                  value={targetPhone}
                  onChange={(e) => setTargetPhone(e.target.value)}
                  placeholder="Ej: 5491123456789"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Variable {"{{1}}"} (Nombre)</label>
                <input
                  type="text"
                  value={param1}
                  onChange={(e) => setParam1(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Variable {"{{2}}"} (Zona / Ubicación)</label>
                <input
                  type="text"
                  value={param2}
                  onChange={(e) => setParam2(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {selectedTemplate.variables.length > 2 && (
                <div>
                  <label className="text-[11px] text-slate-400 font-semibold block mb-1">Variable {"{{3}}"} (Fecha / Precio)</label>
                  <input
                    type="text"
                    value={param3}
                    onChange={(e) => setParam3(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}
            </div>
          </div>

          {dispatchNotice && (
            <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
              dispatchNotice.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
              {dispatchNotice.success ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
              <span>{dispatchNotice.msg}</span>
            </div>
          )}

          {/* Dispatch Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSendManualTemplate}
              disabled={sending}
              className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : <Send className="w-4 h-4 fill-current text-slate-950" />}
              <span>Enviar Plantilla por WhatsApp</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};

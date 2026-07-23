import React, { useState } from 'react';
import { BotConfig } from '../../types';
import { 
  Bot, 
  Code, 
  Copy, 
  Check, 
  Palette, 
  Sliders, 
  Sparkles, 
  MessageSquare, 
  Phone,
  Eye,
  Zap
} from 'lucide-react';

interface BotConfigViewProps {
  botConfig: BotConfig;
  onUpdateBotConfig: (updated: Partial<BotConfig>) => void;
}

export const BotConfigView: React.FC<BotConfigViewProps> = ({ botConfig, onUpdateBotConfig }) => {
  const [copied, setCopied] = useState(false);
  const [agentName, setAgentName] = useState(botConfig.agentName);
  const [agencyName, setAgencyName] = useState(botConfig.agencyName);
  const [welcomeMsg, setWelcomeMsg] = useState(botConfig.welcomeMessage);
  const [primaryColor, setPrimaryColor] = useState(botConfig.primaryColor);
  const [whatsapp, setWhatsapp] = useState(botConfig.whatsappNumber);
  const [systemPrompt, setSystemPrompt] = useState(botConfig.customSystemPrompt);

  const embedScript = `<script src="${window.location.origin}/aria-widget.js" data-agent-id="${botConfig.agentId}" async></script>`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(embedScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBotConfig({
      agentName,
      agencyName,
      welcomeMessage: welcomeMsg,
      primaryColor,
      whatsappNumber: whatsapp,
      customSystemPrompt: systemPrompt,
    });
  };

  return (
    <div className="space-y-8 p-6 max-w-6xl mx-auto">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Bot className="w-6 h-6 text-emerald-400" />
            Configurador del Bot & Script Embed
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Personaliza la identidad visual, el comportamiento comercial y genera el script embebible para tu web inmobiliaria.
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-bold flex items-center gap-1.5">
          <Zap className="w-4 h-4" />
          <span>Aria AI Engine Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Form Settings Column */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* One-Click Embed Script Code Generator Box */}
          <div className="p-6 rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-emerald-500/30 shadow-xl space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold text-white text-sm">Script Embebible (Instalación de 1 Clic)</h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                HTML / WordPress / Idealista
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Copia este fragmento de código e insértalo justo antes de la etiqueta <code className="text-emerald-400 bg-black/40 px-1.5 py-0.5 rounded border border-white/5">&lt;/body&gt;</code> en el sitio web de tu agencia.
            </p>

            <div className="relative">
              <pre className="p-4 rounded-xl bg-black/40 border border-white/5 text-emerald-400 font-mono text-xs overflow-x-auto whitespace-pre-wrap break-all">
                {embedScript}
              </pre>

              <button
                onClick={handleCopyScript}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '¡Copiado!' : 'Copiar Código'}</span>
              </button>
            </div>
          </div>

          {/* Form Configuration */}
          <form onSubmit={handleSaveConfig} className="p-6 rounded-2xl bg-black/30 border border-white/5 space-y-4 text-xs">
            <h3 className="font-semibold text-white text-sm flex items-center gap-2 border-b border-white/5 pb-3">
              <Sliders className="w-4 h-4 text-emerald-400" />
              Parámetros de Marca y Personalidad
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nombre del Agente IA</label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="w-full bg-black/30 border border-white/5 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nombre de la Agencia</label>
                <input
                  type="text"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  className="w-full bg-black/30 border border-white/5 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Mensaje de Bienvenida Inicial</label>
              <textarea
                rows={2}
                value={welcomeMsg}
                onChange={(e) => setWelcomeMsg(e.target.value)}
                className="w-full bg-black/30 border border-white/5 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Color Principal Widget</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-9 h-9 rounded-xl bg-transparent cursor-pointer border-none"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">WhatsApp Business Contacto</label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">System Prompt Personalizado para Aria AI</label>
              <textarea
                rows={4}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white font-sans"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold shadow-lg transition-all cursor-pointer"
            >
              Guardar Cambios del Bot
            </button>
          </form>

        </div>

        {/* Right Instant Live Widget Preview Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-400" />
              Vista Previa Instantánea
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">380px x 520px</span>
          </div>

          <div className="p-4 rounded-3xl bg-slate-950 border border-white/10 shadow-2xl flex items-center justify-center">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-white/10 shadow-xl overflow-hidden flex flex-col h-[460px]">
              
              {/* Header Preview */}
              <div
                className="p-3.5 text-slate-950 font-bold flex items-center justify-between"
                style={{ backgroundColor: primaryColor }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-950/20 border border-slate-950/30 flex items-center justify-center text-slate-950">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-tight">{agentName}</p>
                    <p className="text-[10px] opacity-80">{agencyName}</p>
                  </div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-slate-950 animate-pulse"></span>
              </div>

              {/* Chat Messages Preview */}
              <div className="flex-1 p-3.5 space-y-3 text-xs overflow-y-auto">
                <div className="p-3 rounded-2xl bg-slate-800 text-slate-200 border border-white/10 rounded-tl-none">
                  {welcomeMsg}
                </div>

                <div className="p-3 rounded-2xl bg-emerald-600 text-white rounded-tr-none ml-auto max-w-[80%]">
                  Hola, me gustaría ver pisos en Madrid centro.
                </div>
              </div>

              {/* Input Preview */}
              <div className="p-2.5 bg-slate-950 border-t border-white/10 flex items-center gap-2">
                <div className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-slate-500 text-xs">
                  Escribe un mensaje...
                </div>
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-950 font-bold"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Bot className="w-4 h-4" />
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

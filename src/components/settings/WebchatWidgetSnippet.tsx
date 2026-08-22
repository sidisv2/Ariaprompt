import React, { useState } from 'react';
import {
  Code,
  Copy,
  Check,
  Globe,
  Sparkles,
  MessageSquare,
  Bot,
  Send,
  Sliders,
  Laptop,
  CheckCircle2,
  ExternalLink,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface WebchatWidgetSnippetProps {
  agentId?: string;
  agentName?: string;
  agencyName?: string;
  initialWelcome?: string;
}

export const WebchatWidgetSnippet: React.FC<WebchatWidgetSnippetProps> = ({
  agentId = 'agent-aria-2026',
  agentName = 'Aria',
  agencyName = 'Inmobiliaria Palermo',
  initialWelcome = '¡Hola! Soy el asistente virtual de la inmobiliaria. ¿En qué zona o tipo de propiedad estás buscando?',
}) => {
  const { user } = useAuth();
  const activeAgencyId = user?.id || agentId;

  // Customization State
  const [brandColor, setBrandColor] = useState('#10b981');
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right');
  const [welcomeMessage, setWelcomeMessage] = useState(initialWelcome);
  const [copied, setCopied] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(true);

  // Script snippet generator matching required format
  const snippetCode = `<script src="https://ariaprop.online/embed/chat.js" data-agency-id="${activeAgencyId}" data-color="${brandColor}" data-position="${position}"></script>`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(snippetCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="p-6 rounded-3xl bg-slate-900/90 border border-white/10 shadow-2xl space-y-6 text-white backdrop-blur-xl font-sans">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-white">Widget Webchat Embebible para tu Sitio</h3>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase">
                1-Click Embed
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Instalá el asistente inmobiliario en tu portal web pegando una sola línea de código JavaScript.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopyCode}
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? '¡Snippet Copiado!' : 'Copiar Código de Instalación'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: CUSTOMIZATION CONTROLS (7 COLS) */}
        <div className="lg:col-span-7 space-y-4 text-xs">
          
          <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 space-y-4">
            <h4 className="font-extrabold text-white text-sm flex items-center gap-2 border-b border-white/10 pb-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              Personalización Visual del Widget
            </h4>

            {/* Color Palette Selector */}
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">Color Primario de Marca</label>
              <div className="flex items-center gap-3">
                {['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#0f172a'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setBrandColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                      brandColor === c ? 'scale-125 border-white shadow-lg' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <input
                  type="text"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="w-24 px-2 py-1 rounded-lg bg-slate-900 border border-white/10 text-white font-mono text-[11px] outline-none"
                />
              </div>
            </div>

            {/* Screen Position */}
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">Posición en Pantalla</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPosition('bottom-right')}
                  className={`p-2.5 rounded-xl border text-center font-extrabold transition-all cursor-pointer ${
                    position === 'bottom-right'
                      ? 'bg-emerald-500/20 border-emerald-400 text-white'
                      : 'bg-slate-900 border-white/10 text-slate-400'
                  }`}
                >
                  ↘ Abajo Derecha (Recomendado)
                </button>
                <button
                  type="button"
                  onClick={() => setPosition('bottom-left')}
                  className={`p-2.5 rounded-xl border text-center font-extrabold transition-all cursor-pointer ${
                    position === 'bottom-left'
                      ? 'bg-emerald-500/20 border-emerald-400 text-white'
                      : 'bg-slate-900 border-white/10 text-slate-400'
                  }`}
                >
                  ↙ Abajo Izquierda
                </button>
              </div>
            </div>

            {/* Welcome Message Input */}
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">Mensaje de Saludo Inicial</label>
              <textarea
                rows={2}
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-900 border border-white/10 text-white focus:border-emerald-400 outline-none resize-none"
              />
            </div>
          </div>

          {/* Generated Code Snippet */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                <Code className="w-4 h-4 text-emerald-400" />
                Script Tag de 1 sola línea (Para pegar en tu HTML/CMS)
              </h4>
            </div>

            <pre className="p-3.5 rounded-2xl bg-slate-950 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap break-all shadow-inner">
              {snippetCode}
            </pre>
          </div>

          {/* CMS Installation Guide */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2 text-slate-300 text-xs">
            <h5 className="font-extrabold text-white flex items-center gap-1.5">
              <Info className="w-4 h-4 text-emerald-400" />
              Guía de Instalación en Plataformas Inmobiliarias
            </h5>
            <ul className="space-y-1 text-[11px] list-disc list-inside text-slate-400">
              <li><strong>WordPress:</strong> Pegá el script en Apariencia → Editor de Tema → header.php antes de &lt;/head&gt;.</li>
              <li><strong>Webflow:</strong> En Project Settings → Custom Code → Head Code.</li>
              <li><strong>Tokko Broker / Argenprop / Sitios Inmobiliarios:</strong> En la sección de Scripts de Seguimiento o HTML Personalizado.</li>
            </ul>
          </div>

        </div>

        {/* RIGHT COLUMN: LIVE BROWSER MOCKUP PREVIEW (5 COLS) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <Laptop className="w-4 h-4 text-emerald-400" />
              Previsualización en Vivo de la Web
            </h4>
            <span className="text-[10px] text-emerald-400 font-mono font-bold">Interactivo ✓</span>
          </div>

          {/* Browser Window Mockup */}
          <div className="relative h-[440px] rounded-3xl bg-slate-950 border border-white/20 shadow-2xl overflow-hidden flex flex-col">
            
            {/* Browser Top Bar */}
            <div className="px-4 py-2.5 bg-slate-900 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              </div>
              <div className="px-3 py-0.5 rounded-full bg-slate-950 border border-white/10 text-[10px] font-mono text-slate-400 truncate max-w-[200px]">
                https://tu-inmobiliaria.com
              </div>
              <span className="w-4" />
            </div>

            {/* Mock Website Content */}
            <div className="flex-1 p-6 space-y-4 opacity-40 select-none pointer-events-none">
              <div className="h-6 bg-slate-800 rounded-lg w-3/4 animate-pulse" />
              <div className="h-4 bg-slate-800 rounded-lg w-1/2" />
              <div className="h-32 rounded-2xl bg-slate-900 border border-white/10" />
              <div className="grid grid-cols-2 gap-2">
                <div className="h-16 bg-slate-900 rounded-xl" />
                <div className="h-16 bg-slate-900 rounded-xl" />
              </div>
            </div>

            {/* FLOATING CHAT WIDGET POPUP */}
            {isPreviewOpen && (
              <div
                className={`absolute bottom-16 ${
                  position === 'bottom-right' ? 'right-4' : 'left-4'
                } w-72 rounded-2xl bg-slate-900 border border-white/20 shadow-2xl overflow-hidden animate-fadeIn flex flex-col text-xs`}
              >
                {/* Widget Header */}
                <div
                  className="p-3 text-slate-950 font-black flex items-center justify-between"
                  style={{ backgroundColor: brandColor }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-950/20 flex items-center justify-center text-slate-950 font-black text-xs">
                      🤖
                    </div>
                    <div>
                      <h5 className="font-extrabold text-xs text-slate-950 leading-tight">{agentName}</h5>
                      <span className="text-[9px] text-slate-900/80 block font-bold">{agencyName}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsPreviewOpen(false)}
                    className="p-1 rounded-full hover:bg-black/10 text-slate-950 font-black cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Widget Messages Area */}
                <div className="p-3 space-y-2.5 bg-[#0b141a] max-h-48 overflow-y-auto">
                  <div className="p-2.5 rounded-xl bg-slate-800 text-slate-200 text-[11px] leading-relaxed shadow-sm">
                    {welcomeMessage}
                  </div>
                </div>

                {/* Widget Input */}
                <div className="p-2 bg-slate-950 border-t border-white/10 flex items-center gap-1.5">
                  <input
                    type="text"
                    disabled
                    placeholder="Escribe tu consulta..."
                    className="flex-1 p-2 rounded-xl bg-slate-900 text-[11px] text-white placeholder-slate-500 border border-white/10 outline-none"
                  />
                  <button
                    disabled
                    className="p-2 rounded-xl text-slate-950 font-black text-xs"
                    style={{ backgroundColor: brandColor }}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* FLOATING TRIGGER BUBBLE */}
            <button
              onClick={() => setIsPreviewOpen(!isPreviewOpen)}
              className={`absolute bottom-4 ${
                position === 'bottom-right' ? 'right-4' : 'left-4'
              } p-3.5 rounded-full text-slate-950 font-black shadow-2xl transition-transform hover:scale-110 cursor-pointer flex items-center justify-center`}
              style={{ backgroundColor: brandColor }}
            >
              <MessageSquare className="w-5 h-5 fill-slate-950" />
            </button>

          </div>
        </div>

      </div>

    </div>
  );
};

export default WebchatWidgetSnippet;

import React, { useEffect, useState, useRef } from 'react';
import { useChat } from '../../hooks/useChat';
import { Bot, FileText, Upload, Sparkles, Send, CheckCircle2, Calculator, Database, ShieldCheck } from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

type TabKey = 'general' | 'finance' | 'rag' | 'files';

const TABS: { key: TabKey; label: string; icon: React.ReactNode; description: string }[] = [
  { key: 'general', label: 'Asistente 24/7', icon: <Bot className="w-4 h-4" />, description: 'Atención comercial continua para calificar prospectos.' },
  { key: 'finance', label: 'Evaluador de Rentabilidad', icon: <Calculator className="w-4 h-4" />, description: 'Cálculos de ROI, flujos de caja y plusvalía estimada.' },
  { key: 'rag', label: 'Buscador RAG Dossiers', icon: <Database className="w-4 h-4" />, description: 'Consultas precisas sobre especificaciones y planos.' },
  { key: 'files', label: 'Gestor Mis Archivos', icon: <FileText className="w-4 h-4" />, description: 'Carga interactiva de PDFs y memorias técnicas.' },
];

export const Playground: React.FC = () => {
  const [active, setActive] = useState<TabKey>('general');
  const generalChat = useChat({ initialContext: 'general' });
  const financeChat = useChat({ initialContext: 'finance' });
  const ragChat = useChat({ initialContext: 'rag' });

  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([
    'Dossier_Moraleja_Chalet_2026.pdf',
    'Memoria_Calidades_Salamanca_Penthouse.pdf',
    'Estudio_Financiero_ROI_CapRate_2026.pdf',
  ]);
  const chatBoxRef = useRef<HTMLDivElement | null>(null);

  // Active chat instance depending on current tab
  const activeChat = active === 'finance' ? financeChat : active === 'rag' ? ragChat : generalChat;

  // Scroll ONLY the internal chat container when messages arrive (NEVER scroll the browser window)
  useEffect(() => {
    if (chatBoxRef.current && activeChat.messages.length > 0) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [activeChat.messages, activeChat.isTyping]);

  const handleSend = async (text: string) => {
    await activeChat.send(text, active, activeChat.messages as any);
  };

  const renderMarkdown = (content: string) => {
    const raw = marked.parse(content || '') as string;
    const clean = DOMPurify.sanitize(raw);
    return { __html: clean };
  };

  const handleSimulatedUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setTimeout(() => {
      setUploadedFiles((prev) => [file.name, ...prev]);
      setUploading(false);
    }, 1200);
  };

  return (
    <div id="playground" className="playground card p-6 rounded-3xl bg-slate-900/90 border border-emerald-500/30 shadow-2xl shadow-emerald-500/10 backdrop-blur-xl">
      
      {/* Playground Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-5 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-extrabold text-white">Playground Interactivo Live Demo</h3>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
              Aria AI Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Prueba en tiempo real las capacidades de Aria Prop cambiando de contexto dinámicamente.
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="tabs grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
        {TABS.map((t) => {
          const isActive = active === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between space-y-1 ${
                isActive
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold shadow-lg shadow-emerald-500/20 scale-[1.02]'
                  : 'bg-slate-950/60 text-slate-300 border-white/10 hover:border-emerald-500/40 hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`p-1.5 rounded-xl ${isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-emerald-500/10 text-emerald-400'}`}>
                  {t.icon}
                </span>
                {isActive && <Sparkles className="w-3.5 h-3.5" />}
              </div>
              <span className="text-xs font-bold leading-tight">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panel */}
      <div className="tab-panel transition-all duration-300">
        {active === 'files' ? (
          <div className="files-manager p-6 rounded-2xl bg-slate-950/80 border border-white/10 space-y-5">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Gestor Documental RAG de Inmuebles</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Sube dossiers PDF, planos de obra o memorias técnicas para que Aria los analice instantáneamente.
              </p>
            </div>

            {/* Drag & Drop Box */}
            <label className="border-2 border-dashed border-emerald-500/30 hover:border-emerald-400 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-emerald-500/5 hover:bg-emerald-500/10 transition-all">
              <Upload className="w-8 h-8 text-emerald-400 mb-2 animate-bounce" />
              <span className="text-xs font-bold text-white">Haz clic o arrastra tu archivo PDF aquí</span>
              <span className="text-[10px] text-slate-400 mt-1">Soporta PDF, XLSX, DOCX hasta 25MB</span>
              <input type="file" onChange={handleSimulatedUpload} className="hidden" accept=".pdf,.xlsx,.docx" />
            </label>

            {uploading && (
              <div className="flex items-center gap-2 text-xs text-emerald-400 italic">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Procesando e indexando documento con RAG de Aria AI...</span>
              </div>
            )}

            {/* File List */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Documentos Indexados en RAG:</span>
              <div className="space-y-1.5">
                {uploadedFiles.map((fname, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-200 truncate">
                      <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="truncate">{fname}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Listo en RAG
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="console p-4 rounded-2xl bg-slate-950/80 border border-white/10 flex flex-col h-[420px]">
            
            {/* Context Badge Banner */}
            <div className="p-2.5 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-between mb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block leading-none">
                    {TABS.find((t) => t.key === active)?.label}
                  </span>
                  <span className="text-[10px] text-slate-400">Contexto activo: <code className="text-emerald-400 font-mono">{active}</code></span>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                Respuesta Aria AI RAG
              </span>
            </div>

            {/* Messages Scroll Area (Internal Scroll Only) */}
            <div ref={chatBoxRef} className="messages flex-1 overflow-y-auto p-2 space-y-3 text-xs mb-3 font-sans">
              {activeChat.messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-slate-500">
                  <Bot className="w-8 h-8 text-emerald-400 opacity-80" />
                  <p className="text-xs text-slate-300 font-medium">
                    {active === 'finance'
                      ? '📊 **Evaluador ROI**: Escribe una consulta financiera (ej: *"Calcula ROI de propiedad de $250k alquilada a $1,500/mes"*).'
                      : active === 'rag'
                      ? '📄 **Buscador RAG**: Pregunta sobre especificaciones (ej: *"¿Qué acabados de cocina tiene el Penthouse?"*).'
                      : '💬 **Asistente 24/7**: Pregunta sobre inmuebles en catálogo, precios o zonas.'}
                  </p>
                </div>
              ) : (
                activeChat.messages.map((m, i) => (
                  <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl leading-relaxed ${
                        m.sender === 'user'
                          ? 'bg-emerald-600 text-slate-950 font-medium rounded-tr-none shadow-md'
                          : 'bg-slate-900 text-slate-200 border border-white/10 rounded-tl-none prose prose-invert max-w-none'
                      }`}
                      dangerouslySetInnerHTML={m.sender === 'agent' ? renderMarkdown(m.text) : undefined}
                    >
                      {m.sender === 'user' ? m.text : null}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Playground Input */}
            <PlaygroundInput
              onSend={handleSend}
              placeholder={
                active === 'finance'
                  ? 'Ej: Calcula el ROI si compro este piso en $200k y lo alquilo en $1,400...'
                  : active === 'rag'
                  ? 'Ej: Consulta los acabados de cocina en el dossier del Penthouse Salamanca...'
                  : 'Escribe tu consulta inmobiliaria...'
              }
            />
          </div>
        )}
      </div>

    </div>
  );
};

const PlaygroundInput: React.FC<{ onSend: (text: string) => Promise<void>; placeholder?: string }> = ({
  onSend,
  placeholder,
}) => {
  const [val, setVal] = useState('');
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!val.trim()) return;
        await onSend(val);
        setVal('');
      }}
      className="flex gap-2 shrink-0 pt-1"
    >
      <input
        type="text"
        className="input flex-1 bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder={placeholder}
      />
      <button
        type="submit"
        disabled={!val.trim()}
        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shrink-0"
      >
        <span>Enviar</span>
        <Send className="w-3.5 h-3.5" />
      </button>
    </form>
  );
};

export default Playground;

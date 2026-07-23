import React from 'react';
import { FAQ } from '../FAQ/FAQ';
import { AppRoute } from '../../types';
import { BookOpen, FileText, Download, ShieldCheck, ArrowRight, HelpCircle } from 'lucide-react';

interface RecursosPageProps {
  onRouteChange: (route: AppRoute) => void;
}

export const RecursosPage: React.FC<RecursosPageProps> = ({ onRouteChange }) => {
  return (
    <div className="space-y-12 animate-page-fade py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Subpage Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-bold uppercase tracking-wider">
          <BookOpen className="w-4 h-4" />
          <span>Centro de Recursos & Documentación</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Guías, Preguntas Frecuentes y <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Documentación RAG</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          Encuentra toda la documentación técnica sobre el funcionamiento del motor RAG, integración con pasarelas de pago y guías de puesta en marcha.
        </p>
      </div>

      {/* Resource Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-slate-900 border border-white/10 space-y-4 text-left">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Guía de Indexación RAG</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Aprende cómo preparar tus dossiers PDF y planos de obra para obtener la máxima precisión en las respuestas de la IA.
          </p>
          <button
            onClick={() => onRouteChange('producto')}
            className="text-xs font-extrabold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer pt-2"
          >
            <span>Ver demo de RAG</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-white/10 space-y-4 text-left">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Seguridad & Privacidad</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Documento de cumplimiento de datos, encriptación SSL de 256 bits y soberanía de los documentos de tu catálogo.
          </p>
          <button
            onClick={() => onRouteChange('pricing')}
            className="text-xs font-extrabold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer pt-2"
          >
            <span>Ver garantías de seguridad</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-white/10 space-y-4 text-left">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
            <Download className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Manual del Agente 24/7</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Descarga la guía en PDF para personalizar el tono de voz, mensajes de bienvenida y reglas de cualificación.
          </p>
          <a
            href="#faq"
            className="text-xs font-extrabold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer pt-2"
          >
            <span>Consultar preguntas frecuentes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* FAQ Component */}
      <FAQ />

    </div>
  );
};

export default RecursosPage;

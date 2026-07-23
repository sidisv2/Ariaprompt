import { Playground } from '../playground/Playground';
import { PdfDossierExplorer } from '../products/PdfDossierExplorer';
import { BentoGridFeatures } from '../marketing/BentoGridFeatures';
import { AppRoute } from '../../types';
import { Sparkles, Bot, Database, Calculator, ArrowRight } from 'lucide-react';

interface ProductoPageProps {
  onRouteChange: (route: AppRoute) => void;
  onOpenPrompt?: (prompt: string) => void;
}

export const ProductoPage: React.FC<ProductoPageProps> = ({ onRouteChange, onOpenPrompt }) => {
  return (
    <div className="space-y-12 animate-page-fade py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Subpage Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-bold uppercase tracking-wider">
          <Bot className="w-4 h-4" />
          <span>Plataforma Aria AI</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Agente Inmobiliario de IA 24/7 impulsado por <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Aria AI</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          Explora la suite interactiva de productos: atención comercial continua, análisis financiero de ROI, motor de búsqueda RAG en dossiers PDF y gestor documental.
        </p>
      </div>

      {/* Main Interactive Playground */}
      <Playground />

      {/* Dedicated PDF Dossier Explorer Section */}
      <PdfDossierExplorer />

      {/* Feature Bento Grid */}
      <BentoGridFeatures />

      {/* CTA Box */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2 text-left">
          <h3 className="text-xl font-extrabold text-white">¿Listo para integrar Aria Prop en tu sitio web?</h3>
          <p className="text-xs text-slate-300">Configura tu agente en 5 minutos y comienza tu prueba gratis por 7 días.</p>
        </div>
        <button
          onClick={() => onRouteChange('pricing')}
          className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <span>Ver Planes y Precios</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};

export default ProductoPage;

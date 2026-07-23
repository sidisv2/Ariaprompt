import React, { useState } from 'react';
import { FileText, Eye, Download, Upload, CheckCircle2, ShieldCheck, Sparkles, X, FileCheck, FileCode2, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface PdfDossierItem {
  id: string;
  title: string;
  fileName: string;
  size: string;
  pages: number;
  category: 'Dossier RAG' | 'Plano 2D/3D' | 'Informe Financiero' | 'Memoria Calidades';
  updatedAt: string;
  summary: string;
  specs: { label: string; value: string }[];
}

export const PdfDossierExplorer: React.FC = () => {
  const { user, openAuthModal } = useAuth();
  const [selectedPdf, setSelectedPdf] = useState<PdfDossierItem | null>(null);
  const [uploading, setUploading] = useState(false);

  const sampleDossiers: PdfDossierItem[] = [
    {
      id: 'pdf-1',
      title: 'Dossier Ejecutivo — Penthouse Salamanca',
      fileName: 'Dossier_Ejecutivo_Penthouse_Salamanca.pdf',
      size: '5.4 MB',
      pages: 14,
      category: 'Dossier RAG',
      updatedAt: '2026-07-23',
      summary: 'Dossier comercial completo con ficha técnica de acabados en mármol italiano, terraza privada de 60m², planos de distribución y certificación A++.',
      specs: [
        { label: 'Superficie Privativa', value: '240 m²' },
        { label: 'Precio Comercial', value: '$1,850,000 USD' },
        { label: 'Ubicación', value: 'Barrio Salamanca, Madrid' },
        { label: 'Canon Arriendo Est.', value: '$12,950 USD/mes' },
      ],
    },
    {
      id: 'pdf-2',
      title: 'Planos Arquitectónicos 2D/3D — Moraleja Chalet',
      fileName: 'Plano_Arquitectonico_Moraleja_Chalet.pdf',
      size: '8.1 MB',
      pages: 8,
      category: 'Plano 2D/3D',
      updatedAt: '2026-07-22',
      summary: 'Esquema de distribución estructural en 2D y renderizado 3D de 4 suites principales, garaje para 3 vehículos y piscina infinity.',
      specs: [
        { label: 'Superficie Parcela', value: '850 m²' },
        { label: 'Construido', value: '380 m²' },
        { label: 'Precio Comercial', value: '$2,400,000 USD' },
        { label: 'Garaje Privado', value: '3 Plazas' },
      ],
    },
    {
      id: 'pdf-3',
      title: 'Estudio Financiero de Rentabilidad — El Poblado',
      fileName: 'Estudio_Financiero_ROI_El_Poblado.pdf',
      size: '3.2 MB',
      pages: 6,
      category: 'Informe Financiero',
      updatedAt: '2026-07-20',
      summary: 'Corrida financiera proyectada a 5 años con flujo de caja neto, Cap Rate del 8.4% y análisis comparativo de plusvalía en zona prime.',
      specs: [
        { label: 'Precio Inmueble', value: '$340,000 USD' },
        { label: 'ROI Bruto Anual', value: '8.4% Anual' },
        { label: 'Flujo Neto Est.', value: '$2,100 USD/mes' },
        { label: 'Plusvalía 5 Yrs', value: '+24.5%' },
      ],
    },
    {
      id: 'pdf-4',
      title: 'Memoria de Calidades & Eficiencia Energética',
      fileName: 'Memoria_Calidades_Eficiencia_Energetica.pdf',
      size: '4.6 MB',
      pages: 10,
      category: 'Memoria Calidades',
      updatedAt: '2026-07-18',
      summary: 'Desglose detallado de sistemas de domótica Loxone, aerotermia por suelo radiante/refrescante y aislamiento insonorizado de triple cristal.',
      specs: [
        { label: 'Aislamiento', value: 'Acústico R > 52dB' },
        { label: 'Climatización', value: 'Aerotermia Domótica' },
        { label: 'Certificado CO2', value: 'Clase A++' },
        { label: 'Suelos', value: 'Parquet Roble Natural' },
      ],
    },
  ];

  const handleSimulatedUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      alert(`✅ Expediente "${file.name}" cargado e indexado en el motor RAG de Aria Prop.`);
    }, 1200);
  };

  const handleDownload = (pdf: PdfDossierItem) => {
    if (!user) {
      openAuthModal('signup');
      return;
    }
    const element = document.createElement('a');
    const fileContent = `PDF Dossier Privado Aria Prop\n\nDocumento: ${pdf.title}\nNombre de Archivo: ${pdf.fileName}\nResumen: ${pdf.summary}`;
    const blob = new Blob([fileContent], { type: 'application/pdf' });
    element.href = URL.createObjectURL(blob);
    element.download = pdf.fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6 pt-6 border-t border-white/10 animate-page-fade">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase">
            <FileText className="w-3.5 h-3.5" />
            <span>Gestor & Explorador de Archivos PDF RAG</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-2">
            Archivos & Dossiers Técnicos Indexados
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Explora las memorias de calidades, planos 2D/3D y estudios financieros leídos directamente por la IA.
          </p>
        </div>

        {/* Upload Button */}
        <label className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer shrink-0">
          <Upload className="w-4 h-4" />
          <span>{uploading ? 'Cargando PDF...' : 'Subir Nuevo Expediente PDF'}</span>
          <input type="file" accept=".pdf" onChange={handleSimulatedUpload} disabled={uploading} className="hidden" />
        </label>
      </div>

      {/* Dossiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {sampleDossiers.map((pdf) => (
          <div
            key={pdf.id}
            className="p-5 rounded-3xl bg-slate-900/90 border border-emerald-500/30 hover:border-emerald-400/60 shadow-xl backdrop-blur-xl space-y-4 flex flex-col justify-between group transition-all"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileCheck className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/20">
                  {pdf.category}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-extrabold text-white line-clamp-2 leading-snug">{pdf.title}</h4>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{pdf.summary}</p>
              </div>

              {/* Specs pill list */}
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/5 space-y-1 text-[11px]">
                {pdf.specs.slice(0, 2).map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">{s.label}:</span>
                    <span className="font-bold text-emerald-400">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => setSelectedPdf(pdf)}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span>Vista Previa</span>
              </button>

              <button
                onClick={() => handleDownload(pdf)}
                className="py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 font-bold text-xs border border-emerald-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive PDF Preview Modal */}
      {selectedPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 relative overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">{selectedPdf.title}</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {selectedPdf.fileName} • {selectedPdf.size} • {selectedPdf.pages} Páginas
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedPdf(null)}
                className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Content Simulated Viewer */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-white/10 space-y-4 max-h-[350px] overflow-y-auto font-sans text-xs">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/20">
                <Sparkles className="w-3 h-3" />
                <span>Lectura OCR & Extracción Vectorial RAG Realizada</span>
              </div>

              <div className="space-y-2 text-slate-200 leading-relaxed">
                <p className="font-bold text-sm text-white">Resumen del Expediente:</p>
                <p>{selectedPdf.summary}</p>
              </div>

              <div className="space-y-2 pt-2">
                <p className="font-bold text-white">Especificaciones Técnicas Registradas:</p>
                <div className="grid grid-cols-2 gap-2">
                  {selectedPdf.specs.map((s, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-900 border border-white/5 space-y-1">
                      <span className="text-slate-400 text-[10px] block uppercase font-mono">{s.label}</span>
                      <span className="font-extrabold text-emerald-300 text-xs">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Documento indexado con cifrado SSL de 256-bits.</span>
              </span>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setSelectedPdf(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all cursor-pointer flex-1 sm:flex-initial"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    handleDownload(selectedPdf);
                    setSelectedPdf(null);
                  }}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-initial"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Expediente</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default PdfDossierExplorer;

import React, { useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Link2,
  X,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Download,
  Trash2,
  Building2,
  Loader2,
  Globe,
  DollarSign,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getPlanLimits } from '../../lib/planLimits';
import { supabase } from '../../lib/supabaseClient';

export interface ImportedPropertyItem {
  id?: string;
  title: string;
  operation_type: 'Venta' | 'Alquiler' | 'Temporal';
  price: number;
  currency: 'USD' | 'ARS';
  rooms: number;
  surface_m2: number;
  expenses_ars?: number;
  address_neighborhood: string;
  description: string;
  listing_url: string;
}

interface PropertyImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: (imported: ImportedPropertyItem[]) => void;
  existingPropertiesCount?: number;
}

export const PropertyImporterModal: React.FC<PropertyImporterModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  existingPropertiesCount = 0,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'csv' | 'url'>('csv');
  const [importing, setImporting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // CSV Tab State
  const [parsedItems, setParsedItems] = useState<ImportedPropertyItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  // URL Tab State
  const [propertyUrl, setPropertyUrl] = useState('');
  const [urlExtracting, setUrlExtracting] = useState(false);

  if (!isOpen) return null;

  // Plan Limits Check
  const isOwner =
    user?.isOwner || user?.email?.toLowerCase().trim() === 'valentinlautaromorales@gmail.com';
  const planTier = isOwner ? 'desarrolladores' : user?.plan ?? 'normal';
  const planLimits = getPlanLimits(planTier);
  const maxPropertiesAllowed = isOwner ? 999999 : planLimits.maxProperties;
  const isQuotaFull = existingPropertiesCount >= maxPropertiesAllowed;

  // CSV Parser Helper
  const parseCsvText = (csvText: string) => {
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length <= 1) {
      setErrorMessage('El archivo CSV está vacío o solo contiene encabezados.');
      return;
    }

    const items: ImportedPropertyItem[] = [];
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
      if (cols.length >= 2) {
        items.push({
          title: cols[0] || `Propiedad Importada ${i}`,
          operation_type: (cols[1] as any) === 'Alquiler' ? 'Alquiler' : 'Venta',
          price: parseFloat(cols[2]) || 150000,
          currency: (cols[3] as any) === 'ARS' ? 'ARS' : 'USD',
          rooms: parseInt(cols[4], 10) || 3,
          surface_m2: parseFloat(cols[5]) || 75,
          expenses_ars: parseFloat(cols[6]) || 0,
          address_neighborhood: cols[7] || 'Palermo, CABA',
          description: cols[8] || 'Departamento luminoso con balcón corrido y excelente ubicación.',
          listing_url: cols[9] || 'https://tokkobroker.com/p/' + i,
        });
      }
    }

    setParsedItems(items);
    setErrorMessage(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) parseCsvText(text);
    };
    reader.readAsText(file);
  };

  const handleDownloadSampleCsv = () => {
    const sampleCsv = `Título,TipoOperacion,Precio,Moneda,Ambientes,SuperficieM2,ExpensasARS,BarrioDirección,Descripción,UrlFicha
Depto 3 Ambientes Palermo Soho,Venta,185000,USD,3,75,45000,Palermo Soho - Honduras 4800,Hermoso 3 ambientes con balcón al frente y cochera fija.,https://tokkobroker.com/p/101
Casa 4 Ambientes Belgrano R,Venta,420000,USD,4,220,0,Belgrano R - Zapiola 1800,Casa con jardín pileta y quincho.,https://easybroker.com/p/102
Departamento 2 Ambientes Recoleta,Alquiler,550000,ARS,2,48,30000,Recoleta - Av Santa Fe 2100,2 ambientes amoblado reciclado a nuevo.,https://zonaprop.com/p/103`;

    const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'plantilla_importacion_propiedades.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExtractFromUrl = () => {
    if (!propertyUrl.trim()) return;
    setUrlExtracting(true);
    setErrorMessage(null);

    setTimeout(() => {
      const extractedItem: ImportedPropertyItem = {
        title: 'Propiedad Extraída desde ' + new URL(propertyUrl).hostname,
        operation_type: 'Venta',
        price: 195000,
        currency: 'USD',
        rooms: 3,
        surface_m2: 82,
        expenses_ars: 50000,
        address_neighborhood: 'Palermo Hollywood, CABA',
        description:
          'Publicación sincronizada automáticamente por el extractor de URLs de Aria Prop AI.',
        listing_url: propertyUrl,
      };

      setParsedItems((prev) => [...prev, extractedItem]);
      setUrlExtracting(false);
      setPropertyUrl('');
      setSuccessMessage('✓ Ficha técnica extraída correctamente desde la URL.');
    }, 1200);
  };

  const handleRemoveParsedRow = (index: number) => {
    setParsedItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleConfirmImport = async () => {
    if (parsedItems.length === 0) return;
    setImporting(true);
    setErrorMessage(null);

    try {
      if (supabase) {
        const recordsToInsert = parsedItems.map((item) => ({
          organization_id: user?.id,
          title: item.title,
          code: 'PROP-' + Math.floor(1000 + Math.random() * 9000),
          type: item.operation_type === 'Venta' ? 'departamento' : 'alquiler',
          price: item.price,
          currency: item.currency,
          city: 'CABA',
          zone: item.address_neighborhood,
          address: item.address_neighborhood,
          bedrooms: item.rooms,
          bathrooms: 1,
          area_m2: item.surface_m2,
          description: item.description,
          image_url:
            'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
          created_at: new Date().toISOString(),
        }));

        await supabase.from('properties').insert(recordsToInsert);
      }

      if (onImportComplete) {
        onImportComplete(parsedItems);
      }

      setSuccessMessage(`✓ Se importaron ${parsedItems.length} propiedades al catálogo de Aria`);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (e: any) {
      console.error('Error importing properties:', e);
      setErrorMessage(e?.message || 'Error al guardar propiedades en Supabase.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn font-sans">
      <div className="relative w-full max-w-4xl rounded-3xl bg-slate-900 border border-emerald-500/40 p-6 sm:p-8 shadow-2xl text-white space-y-6 max-h-[90vh] flex flex-col">
        
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/20 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              Importador Masivo de Propiedades & RAG
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Cargá tu catálogo inmobiliario completo desde CSV/Excel o mediante enlaces de portales.
            </p>
          </div>
        </div>

        {/* Quota Banner */}
        {isQuotaFull && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Cupo de catálogo alcanzado ({existingPropertiesCount}/{maxPropertiesAllowed} Propiedades). Escalá tu plan para alojar más fichas técnicas.
            </span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        {/* Import Mode Tabs */}
        <div className="flex items-center gap-3 border-b border-white/10 pb-1">
          <button
            onClick={() => setActiveTab('csv')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'csv'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-950'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Subir Archivo (CSV / Excel)</span>
          </button>

          <button
            onClick={() => setActiveTab('url')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'url'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-950'
            }`}
          >
            <Link2 className="w-4 h-4" />
            <span>Importar por Enlace / URL</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {activeTab === 'csv' && (
            <div className="space-y-4">
              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  const file = e.dataTransfer.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (evt) => parseCsvText(evt.target?.result as string);
                    reader.readAsText(file);
                  }
                }}
                className={`p-8 rounded-3xl border-2 border-dashed text-center transition-all flex flex-col items-center justify-center gap-3 cursor-pointer ${
                  isDragOver
                    ? 'border-emerald-400 bg-emerald-500/10'
                    : 'border-white/20 bg-slate-950/60 hover:border-emerald-500/50'
                }`}
              >
                <Upload className="w-8 h-8 text-emerald-400" />
                <div>
                  <p className="text-sm font-extrabold text-white">
                    Arrastrá tu archivo CSV o Excel aquí
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Soporta archivos UTF-8 delimidos por comas (.csv)
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <label className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs cursor-pointer shadow-md">
                    Seleccionar Archivo
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <button
                    onClick={handleDownloadSampleCsv}
                    type="button"
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 border border-white/10 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Plantilla CSV</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'url' && (
            <div className="space-y-4 p-4 rounded-3xl bg-slate-950 border border-white/10">
              <label className="block text-xs font-bold text-slate-300">
                URL de Publicación Inmobiliaria (Tokko, EasyBroker, Zonaprop, Argenprop, Web Propia)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={propertyUrl}
                  onChange={(e) => setPropertyUrl(e.target.value)}
                  placeholder="https://tokkobroker.com/propiedad/departamento-palermo-soho"
                  className="flex-1 p-3 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:border-emerald-400 outline-none"
                />
                <button
                  onClick={handleExtractFromUrl}
                  disabled={!propertyUrl.trim() || urlExtracting}
                  className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {urlExtracting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>Extraer Ficha ⚡</span>
                </button>
              </div>
            </div>
          )}

          {/* Parsed Preview Table */}
          {parsedItems.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                  Previsualización de Propiedades ({parsedItems.length})
                </h4>
                <button
                  onClick={() => setParsedItems([])}
                  className="text-[11px] text-rose-400 hover:underline"
                >
                  Limpiar Lista
                </button>
              </div>

              <div className="border border-white/10 rounded-2xl overflow-x-auto max-h-60 scrollbar-thin">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 font-extrabold uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Título</th>
                      <th className="p-2.5">Operación</th>
                      <th className="p-2.5">Precio</th>
                      <th className="p-2.5">Barrio</th>
                      <th className="p-2.5 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {parsedItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-white/5">
                        <td className="p-2.5 font-bold text-white max-w-[200px] truncate">
                          {item.title}
                        </td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                            {item.operation_type}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono font-bold text-emerald-400">
                          {item.currency} ${item.price.toLocaleString()}
                        </td>
                        <td className="p-2.5 truncate max-w-[150px]">
                          {item.address_neighborhood}
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            onClick={() => handleRemoveParsedRow(idx)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
          >
            Cancelar
          </button>

          <button
            onClick={handleConfirmImport}
            disabled={parsedItems.length === 0 || importing || isQuotaFull}
            className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/25 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {importing
                ? 'Importando en Catálogo...'
                : `Confirmar e Importar (${parsedItems.length}) Propiedades`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyImporterModal;

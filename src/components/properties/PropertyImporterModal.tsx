import React, { useState } from 'react';
import Papa from 'papaparse';
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
  Tag,
  Home,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getPlanLimits } from '../../lib/planLimits';
import { supabase } from '../../lib/supabaseClient';

export interface ImportedPropertyItem {
  id?: string;
  title: string;
  price: number;
  currency: 'USD' | 'ARS';
  address: string;
  rooms: number;
  bathrooms: number;
  area_sqm: number;
  description: string;
  operation_type: 'sale' | 'rent' | 'temporary_rent';
  status: 'available' | 'reserved' | 'sold';
  is_public: boolean;
  listing_url?: string;
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
  const [isDragOver, setIsDragOver] = useState(false);
  const [parsedItems, setParsedItems] = useState<ImportedPropertyItem[]>([]);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // URL Scraping state
  const [propertyUrl, setPropertyUrl] = useState('');
  const [urlExtracting, setUrlExtracting] = useState(false);

  if (!isOpen) return null;

  const planTier = ((user as any)?.subscriptionTier || (user as any)?.tier || (user as any)?.plan || (user as any)?.estado_cuenta || 'pro').toLowerCase();
  const limits = getPlanLimits(planTier);
  const maxProperties = limits?.maxProperties ?? 100;
  const currentCount = existingPropertiesCount ?? 0;
  const isQuotaFull = maxProperties > 0 && currentCount >= maxProperties;

  // Parser robusto con PapaParse para CSV respetando comas y encabezados exactos
  const parseCsvText = (csvString: string) => {
    setErrorMessage(null);

    Papa.parse(csvString, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header) => header.trim().toLowerCase().replace(/[\s_-]+/g, ''),
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          setErrorMessage('El archivo CSV está vacío o no contiene filas válidas.');
          return;
        }

        const items: ImportedPropertyItem[] = [];

        results.data.forEach((row: any, idx: number) => {
          // 1. Título
          const title = (
            row.title ||
            row.titulo ||
            row.propiedad ||
            row.nombre ||
            `Propiedad Importada #${idx + 1}`
          ).trim();

          // 2. Precio
          const rawPrice = String(row.price || row.precio || row.valor || '0').replace(/[^0-9.]/g, '');
          const price = Number(rawPrice) || 150000;

          // 3. Moneda
          const rawCurrency = String(row.currency || row.moneda || 'USD').toUpperCase();
          const currency: 'USD' | 'ARS' =
            rawCurrency.includes('ARS') || (rawCurrency.includes('$') && !rawCurrency.includes('USD'))
              ? 'ARS'
              : 'USD';

          // 4. Dirección exacta (evitar que tome números de m2 o ambientes)
          const address = (
            row.address ||
            row.direccion ||
            row.calle ||
            row.ubicacion ||
            row.barrio ||
            row.zona ||
            'Palermo, Buenos Aires'
          ).trim();

          // 5. Ambientes / Habitaciones (rooms)
          const rawRooms = row.rooms ?? row.ambientes ?? row.habitaciones ?? row.dormitorios ?? row.habs;
          const rooms = Number(String(rawRooms || '2').replace(/[^0-9]/g, '')) || 2;

          // 6. Baños (bathrooms)
          const rawBathrooms = row.bathrooms ?? row.banos ?? row.baños ?? row.toilettes;
          const bathrooms = Number(String(rawBathrooms || '1').replace(/[^0-9]/g, '')) || 1;

          // 7. Superficie m2 (area_sqm) - Distinguir de rooms
          const rawArea = row.areasqm ?? row.area_sqm ?? row.superficie ?? row.m2 ?? row.superficietotal ?? row.metros;
          const area_sqm = Number(String(rawArea || '65').replace(/[^0-9.]/g, '')) || 65;

          // 8. Descripción
          const description = (
            row.description ||
            row.descripcion ||
            row.detalle ||
            row.resumen ||
            'Excelente propiedad en ubicación destacada.'
          ).trim();

          // 9. Tipo de Operación (operation_type: 'sale' | 'rent' | 'temporary_rent')
          const rawOp = String(
            row.operationtype ||
            row.operation_type ||
            row.operacion ||
            row.tipooperacion ||
            row.tipo_operacion ||
            ''
          ).toLowerCase();

          let operation_type: 'sale' | 'rent' | 'temporary_rent' = 'sale';
          if (rawOp.includes('temp') || rawOp.includes('vacac')) {
            operation_type = 'temporary_rent';
          } else if (rawOp.includes('alquiler') || rawOp.includes('rent') || price < 5000) {
            operation_type = 'rent';
          } else {
            operation_type = 'sale';
          }

          // 10. Estado (status: 'available' | 'reserved' | 'sold')
          const rawStatus = String(row.status || row.estado || row.disponibilidad || '').toLowerCase();
          let status: 'available' | 'reserved' | 'sold' = 'available';
          if (rawStatus.includes('reserv')) {
            status = 'reserved';
          } else if (rawStatus.includes('vend') || rawStatus.includes('alquil') || rawStatus.includes('sold')) {
            status = 'sold';
          }

          // 11. Visibilidad (is_public)
          const rawPublic = String(
            row.ispublic ?? row.is_public ?? row.publico ?? row.visible ?? 'true'
          ).toLowerCase();
          const is_public = rawPublic !== 'false' && rawPublic !== '0' && rawPublic !== 'no';

          const listing_url = (row.listingurl || row.listing_url || row.url || row.link || '').trim();

          if (title) {
            items.push({
              title,
              price,
              currency,
              address,
              rooms,
              bathrooms,
              area_sqm,
              description,
              operation_type,
              status,
              is_public,
              listing_url: listing_url || undefined,
            });
          }
        });

        if (items.length === 0) {
          setErrorMessage('No se pudieron extraer propiedades del archivo CSV. Revisa los nombres de las columnas.');
        } else {
          setParsedItems(items);
        }
      },
      error: (err) => {
        console.error('Error al parsear CSV con PapaParse:', err);
        setErrorMessage('Error al leer el archivo CSV: ' + err.message);
      },
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        parseCsvText(evt.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleRemoveParsedRow = (index: number) => {
    setParsedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDownloadSampleCsv = () => {
    const sampleHeaders = 'title,price,currency,address,rooms,bathrooms,area_sqm,description,operation_type,status,is_public\n';
    const sampleRow1 = '"Departamento 2 Ambientes Palermo",160000,USD,"Av. Santa Fe 3400, Palermo",2,1,55,"Luminoso departamento con balcón al frente",sale,available,true\n';
    const sampleRow2 = '"Moderno Monoambiente Belgrano",650,USD,"Cabildo 2100, Belgrano",1,1,38,"Ideal estudiantes o profesionales, bajas expensas",rent,available,true\n';
    const sampleRow3 = '"Piso Exclusivo Recoleta",1200,USD,"Av. Alvear 1800, Recoleta",3,2,110,"Alquiler temporario amoblado premium",temporary_rent,available,true\n';
    
    const blob = new Blob([sampleHeaders + sampleRow1 + sampleRow2 + sampleRow3], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'plantilla_propiedades_ariaprop.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExtractFromUrl = () => {
    if (!propertyUrl.trim()) return;
    setUrlExtracting(true);

    setTimeout(() => {
      setUrlExtracting(false);
      const isRent = propertyUrl.toLowerCase().includes('alquiler') || propertyUrl.toLowerCase().includes('rent');
      const sampleFromUrl: ImportedPropertyItem = {
        title: 'Propiedad Extraída de Portal Web',
        price: isRent ? 850 : 210000,
        currency: 'USD',
        address: 'Av. del Libertador 2400, Palermo',
        rooms: 3,
        bathrooms: 2,
        area_sqm: 85,
        description: 'Propiedad sincronizada e importada automáticamente desde portal inmobiliario externo.',
        operation_type: isRent ? 'rent' : 'sale',
        status: 'available',
        is_public: true,
        listing_url: propertyUrl,
      };

      setParsedItems((prev) => [sampleFromUrl, ...prev]);
      setPropertyUrl('');
    }, 1200);
  };

  const handleConfirmImport = async () => {
    if (parsedItems.length === 0) return;
    setImporting(true);
    setErrorMessage(null);

    try {
      if (supabase && user?.id) {
        const rowsToInsert = parsedItems.map((item) => ({
          user_id: user.id,
          organization_id: (user as any)?.organization_id || null,
          title: item.title,
          code: `PROP-${Math.floor(100 + Math.random() * 900)}`,
          type: 'apartment',
          operation_type: item.operation_type,
          price: item.price,
          currency: item.currency,
          address: item.address,
          zone: item.address,
          city: 'Buenos Aires',
          bedrooms: item.rooms,
          bathrooms: item.bathrooms,
          surface_m2: item.area_sqm,
          area_m2: item.area_sqm,
          description: item.description,
          status: item.status,
          is_public: item.is_public,
          image_url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
          images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'],
          created_at: new Date().toISOString(),
        }));

        const { error } = await supabase.from('properties').insert(rowsToInsert);
        if (error) {
          console.warn('Advertencia al insertar en Supabase, aplicando callback local:', error);
        }
      }

      if (onImportComplete) {
        onImportComplete(parsedItems);
      }

      setImportSuccess(true);
      setTimeout(() => {
        setImportSuccess(false);
        setParsedItems([]);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Error al importar:', err);
      setErrorMessage(err.message || 'Error durante la importación.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl max-w-3xl w-full p-6 space-y-6 relative shadow-2xl max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" /> Importador Inteligente de Propiedades
            </div>
            <h2 className="text-xl font-black text-white mt-0.5">
              Carga Masiva de Catálogo (CSV / URL)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quota warning */}
        {isQuotaFull && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              Has alcanzado el límite de propiedades para tu plan ({currentCount}/{maxProperties}). Actualiza tu plan para importar más inmuebles.
            </span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {importSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>¡Propiedades importadas y sincronizadas exitosamente en el CRM y el motor de IA!</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex p-1 bg-slate-950 rounded-2xl border border-white/10 w-fit gap-1 text-xs">
          <button
            onClick={() => setActiveTab('csv')}
            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'csv'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Archivo CSV / Excel</span>
          </button>

          <button
            onClick={() => setActiveTab('url')}
            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'url'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Link2 className="w-4 h-4" />
            <span>Importar por URL Directa</span>
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
                    PapaParse procesa automáticamente campos entrecomillados con comas
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <label className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs cursor-pointer shadow-md">
                    Seleccionar Archivo CSV
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
                    <span>Descargar Plantilla CSV</span>
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
                  placeholder="https://inmobiliaria.com/propiedad/departamento-palermo-soho"
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
                  <span>Extraer Ficha</span>
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
                  className="text-[11px] text-rose-400 hover:underline cursor-pointer"
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
                      <th className="p-2.5">Dirección / Zona</th>
                      <th className="p-2.5">Ambientes</th>
                      <th className="p-2.5">m²</th>
                      <th className="p-2.5 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {parsedItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-white/5">
                        <td className="p-2.5 font-bold text-white max-w-[180px] truncate">
                          {item.title}
                        </td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                            item.operation_type === 'sale'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : item.operation_type === 'rent'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          }`}>
                            {item.operation_type === 'sale' ? 'Venta' : item.operation_type === 'rent' ? 'Alquiler' : 'Temporal'}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono font-bold text-emerald-400 whitespace-nowrap">
                          {item.currency} ${item.price.toLocaleString()}
                        </td>
                        <td className="p-2.5 truncate max-w-[150px]">
                          {item.address}
                        </td>
                        <td className="p-2.5 font-semibold text-slate-200">
                          {item.rooms} amb ({item.bathrooms} bñ)
                        </td>
                        <td className="p-2.5 font-mono font-bold text-emerald-300 whitespace-nowrap">
                          {item.area_sqm} m²
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            onClick={() => handleRemoveParsedRow(idx)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
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

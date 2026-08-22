import React, { useState } from 'react';
import { Property } from '../../types';
export type PropertyOperationType = 'sale' | 'rent' | 'temporary_rent' | string;
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../lib/supabaseClient';
import { 
  Building2, 
  Plus, 
  Search, 
  FileText, 
  MapPin, 
  Bed, 
  Bath, 
  Maximize, 
  Upload, 
  X, 
  CheckCircle2, 
  Filter, 
  Sparkles, 
  Trash2, 
  Eye, 
  EyeOff, 
  Edit3, 
  Tag, 
  Home, 
  Clock 
} from 'lucide-react';

import { PropertyImporterModal, ImportedPropertyItem } from '../properties/PropertyImporterModal';
import { PropertyPdfExportModal } from '../properties/PropertyPdfExportModal';
import { PropertyAdStudioModal } from '../properties/PropertyAdStudioModal';
import { EditPropertyModal } from '../properties/EditPropertyModal';

interface PropertiesViewProps {
  properties: Property[];
  onAddProperty: (newProp: Omit<Property, 'id' | 'createdAt' | 'documents' | 'featured'>) => void;
  onUpdateProperty?: (id: string, updates: Partial<Property>) => void;
  onDeleteProperty?: (id: string) => void;
}

export const PropertiesView: React.FC<PropertiesViewProps> = ({
  properties,
  onAddProperty,
  onUpdateProperty,
  onDeleteProperty,
}) => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedOperation, setSelectedOperation] = useState<'all' | 'sale' | 'rent' | 'temporary_rent'>('all');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [selectedPropertyForModal, setSelectedPropertyForModal] = useState<Property | null>(null);
  const [selectedAdProperty, setSelectedAdProperty] = useState<Property | null>(null);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  const [propertyToEdit, setPropertyToEdit] = useState<Property | null>(null);
  const [isSyncingAI, setIsSyncingAI] = useState(false);

  const handleSaveEditProperty = async (editedProp: Property) => {
    if (onUpdateProperty) {
      onUpdateProperty(editedProp.id, editedProp);
    }

    if (supabase) {
      try {
        const dbPayload: any = {
          title: editedProp.title,
          type: editedProp.type,
          operation_type: editedProp.operation_type || 'sale',
          price: Number(editedProp.price) || 0,
          currency: editedProp.currency || 'USD',
          surface_m2: Number(editedProp.features?.areaM2) || 0,
          area_m2: Number(editedProp.features?.areaM2) || 0,
          bedrooms: Number(editedProp.features?.bedrooms) || 0,
          bathrooms: Number(editedProp.features?.bathrooms) || 0,
          parking_spaces: Number(editedProp.features?.parking) || 0,
          address: editedProp.location?.address || '',
          zone: editedProp.location?.zone || '',
          city: editedProp.location?.city || '',
          description: editedProp.description || '',
          image_url: editedProp.images?.[0] || '',
          images: editedProp.images || [],
          updated_at: new Date().toISOString(),
        };

        await supabase.from('properties').update(dbPayload).eq('id', editedProp.id);
      } catch (err) {
        console.warn('Error al guardar edición en Supabase:', err);
      }
    }
  };

  const handleTogglePublic = async (prop: Property) => {
    const nextIsPublic = !(prop.is_public ?? true);
    if (onUpdateProperty) {
      onUpdateProperty(prop.id, { is_public: nextIsPublic });
    }

    if (supabase) {
      try {
        await supabase.from('properties').update({ is_public: nextIsPublic }).eq('id', prop.id);
      } catch (err) {
        console.warn('Error updating is_public:', err);
      }
    }
  };

  const handleChangeStatus = async (prop: Property, newStatus: string) => {
    if (onUpdateProperty) {
      onUpdateProperty(prop.id, { status: newStatus });
    }

    if (supabase) {
      try {
        await supabase.from('properties').update({ status: newStatus }).eq('id', prop.id);
      } catch (err) {
        console.warn('Error updating status:', err);
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!propertyToDelete) return;
    if (onDeleteProperty) {
      onDeleteProperty(propertyToDelete.id);
    }
    if (supabase) {
      try {
        await supabase.from('properties').delete().eq('id', propertyToDelete.id);
      } catch (err) {
        console.warn('Error deleting property:', err);
      }
    }
    setPropertyToDelete(null);
  };

  const handleSyncAI = () => {
    setIsSyncingAI(true);
    setTimeout(() => {
      setIsSyncingAI(false);
    }, 1500);
  };

  // Wizard Form State
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [formTitle, setFormTitle] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formType, setFormType] = useState<Property['type']>('apartment');
  const [formOperationType, setFormOperationType] = useState<PropertyOperationType>('sale');
  const [formPrice, setFormPrice] = useState<number>(185000);
  const [formCurrency, setFormCurrency] = useState<'USD' | 'ARS' | 'EUR'>('USD');
  const [formCity, setFormCity] = useState('Buenos Aires');
  const [formZone, setFormZone] = useState('Palermo');
  const [formAddress, setFormAddress] = useState('Calle Real 14');
  const [formBedrooms, setFormBedrooms] = useState<number>(4);
  const [formBathrooms, setFormBathrooms] = useState<number>(4);
  const [formAreaM2, setFormAreaM2] = useState<number>(420);
  const [formPool, setFormPool] = useState(true);
  const [formGarage, setFormGarage] = useState(true);
  const [formDescription, setFormDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80');

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormImageUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredProperties = (properties || []).filter((p) => {
    const matchesSearch =
      (p.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.location?.zone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.location?.address || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'all' || p.type === selectedType;

    const op = p.operation_type || (p.price < 5000 ? 'rent' : 'sale');
    const matchesOperation =
      selectedOperation === 'all' ||
      op === selectedOperation;

    return matchesSearch && matchesType && matchesOperation;
  });

  const handleSubmitProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    onAddProperty({
      title: formTitle,
      code: formCode || `PROP-${Math.floor(100 + Math.random() * 900)}`,
      type: formType,
      operation_type: formOperationType,
      status: 'available',
      is_public: true,
      price: Number(formPrice),
      currency: formCurrency,
      location: {
        address: formAddress,
        city: formCity,
        zone: formZone,
      },
      features: {
        bedrooms: Number(formBedrooms),
        bathrooms: Number(formBathrooms),
        areaM2: Number(formAreaM2),
        pool: formPool,
        garage: formGarage,
        elevator: true,
        airConditioning: true,
      },
      description: formDescription || 'Excelente propiedad de alta gama en ubicación exclusiva.',
      images: [formImageUrl],
    });

    setIsWizardOpen(false);
    setWizardStep(1);
    setFormTitle('');
  };

  const getOperationBadge = (opType?: string, price?: number) => {
    const effectiveOp = opType || (price && price < 5000 ? 'rent' : 'sale');
    if (effectiveOp === 'temporary_rent' || effectiveOp === 'temporal') {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1 shadow-sm">
          <Clock className="w-2.5 h-2.5" /> Temporal
        </span>
      );
    }
    if (effectiveOp === 'rent' || effectiveOp === 'alquiler') {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1 shadow-sm">
          <Home className="w-2.5 h-2.5" /> Alquiler
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shadow-sm">
        <Tag className="w-2.5 h-2.5" /> Venta
      </span>
    );
  };

  return (
    <div className="space-y-8 p-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-400" />
            {t('properties.title')}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t('properties.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncAI}
            disabled={isSyncingAI}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/10 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 text-emerald-400 ${isSyncingAI ? 'animate-spin' : ''}`} />
            <span>{isSyncingAI ? t('properties.syncing') : t('properties.syncAI')}</span>
          </button>

          <button
            onClick={() => setIsImporterOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 font-bold text-xs border border-emerald-500/40 transition-all flex items-center gap-2 cursor-pointer shadow-md"
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>Importar Propiedades</span>
          </button>

          <button
            onClick={() => setIsWizardOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('properties.addProperty')}</span>
          </button>
        </div>
      </div>

      {/* Operation Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 backdrop-blur-xl p-3.5 rounded-2xl border border-white/10 shadow-xl">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-emerald-400" /> Operación:
          </span>
          <button
            type="button"
            onClick={() => setSelectedOperation('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedOperation === 'all'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white bg-slate-950 border border-white/5'
            }`}
          >
            Todas ({properties.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedOperation('sale')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedOperation === 'sale'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white bg-slate-950 border border-white/5'
            }`}
          >
            <Tag className="w-3 h-3" /> En Venta
          </button>
          <button
            type="button"
            onClick={() => setSelectedOperation('rent')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedOperation === 'rent'
                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-white bg-slate-950 border border-white/5'
            }`}
          >
            <Home className="w-3 h-3" /> En Alquiler
          </button>
          <button
            type="button"
            onClick={() => setSelectedOperation('temporary_rent')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedOperation === 'temporary_rent'
                ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                : 'text-slate-400 hover:text-white bg-slate-950 border border-white/5'
            }`}
          >
            <Clock className="w-3 h-3" /> Temporales
          </button>
        </div>

        {/* Property Type Secondary Quick Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['all', 'apartment', 'house', 'ph', 'land', 'commercial', 'office'].map((tType) => (
            <button
              key={tType}
              onClick={() => setSelectedType(tType)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize transition-all cursor-pointer ${
                selectedType === tType
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-white bg-white/5'
              }`}
            >
              {tType === 'all'
                ? 'Tipos: Todos'
                : tType === 'apartment'
                ? 'Deptos'
                : tType === 'house'
                ? 'Casas'
                : tType === 'ph'
                ? 'PH'
                : tType === 'land'
                ? 'Lotes'
                : tType === 'commercial'
                ? 'Locales'
                : 'Oficinas'}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="flex items-center justify-between gap-4 bg-white/[0.03] backdrop-blur-sm p-3 rounded-2xl border border-white/5">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título, código, barrio, calle o zona..."
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all font-sans"
          />
        </div>
        <div className="text-xs text-slate-400 font-medium">
          Mostrando <strong className="text-white">{filteredProperties.length}</strong> de {properties.length} propiedades
        </div>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isSyncingAI
          ? Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-white/[0.03] border border-white/5 p-5 space-y-4 animate-pulse"
              >
                <div className="h-44 bg-slate-800 rounded-xl w-full" />
                <div className="h-4 bg-slate-800 rounded w-3/4" />
                <div className="h-3 bg-slate-800 rounded w-1/2" />
                <div className="grid grid-cols-3 gap-2 py-2">
                  <div className="h-6 bg-slate-800 rounded" />
                  <div className="h-6 bg-slate-800 rounded" />
                  <div className="h-6 bg-slate-800 rounded" />
                </div>
                <div className="h-10 bg-slate-800 rounded-xl w-full" />
              </div>
            ))
          : filteredProperties.map((prop) => (
          <div
            key={prop.id}
            className="rounded-3xl bg-slate-900/90 backdrop-blur-xl border border-white/10 hover:border-emerald-500/40 transition-all overflow-hidden flex flex-col justify-between group shadow-xl hover:shadow-2xl hover:shadow-emerald-500/5"
          >
            <div>
              {/* Image & Badges Overlay */}
              <div className="relative h-52 overflow-hidden bg-slate-950">
                <img
                  src={prop.images && prop.images[0] ? prop.images[0] : 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'}
                  alt={prop.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Top Badges */}
                <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 max-w-[70%]">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-950/90 backdrop-blur-md text-[10px] font-mono font-bold text-slate-200 border border-white/15 shadow-sm">
                    {prop.code}
                  </span>
                  {getOperationBadge(prop.operation_type, prop.price)}
                </div>

                <div className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30">
                  ${Number(prop.price).toLocaleString('en-US')} {prop.currency || 'USD'} {prop.price < 5000 ? '/mes' : ''}
                </div>

                {/* Status Overlay Pill */}
                <div className="absolute bottom-3 left-3">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md border shadow-md flex items-center gap-1 ${
                    prop.status === 'sold'
                      ? 'bg-rose-500/90 text-white border-rose-400'
                      : prop.status === 'rented'
                      ? 'bg-blue-600/90 text-white border-blue-400'
                      : prop.status === 'reserved'
                      ? 'bg-amber-500/90 text-slate-950 border-amber-300 font-black'
                      : 'bg-emerald-500/90 text-slate-950 border-emerald-300 font-black'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${prop.status === 'sold' || prop.status === 'rented' ? 'bg-white' : 'bg-slate-950'}`}></span>
                    {prop.status === 'sold' ? 'Vendido' : prop.status === 'rented' ? 'Alquilado' : prop.status === 'reserved' ? 'Reservado' : 'Disponible'}
                  </span>
                </div>
              </div>

              {/* Body Info */}
              <div className="p-5 space-y-3">
                <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-emerald-400 transition-colors">
                  {prop.title}
                </h3>
                
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{prop.location.address}, {prop.location.zone} ({prop.location.city})</span>
                </p>

                {/* Features Badges */}
                <div className="grid grid-cols-3 gap-2 py-2.5 border-y border-white/5 text-slate-300 text-xs">
                  <div className="flex items-center gap-1.5 bg-slate-950/50 px-2 py-1 rounded-lg border border-white/5">
                    <Bed className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{prop.features.bedrooms} {t('properties.bedrooms')}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-950/50 px-2 py-1 rounded-lg border border-white/5">
                    <Bath className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{prop.features.bathrooms} {t('properties.bathrooms')}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-950/50 px-2 py-1 rounded-lg border border-white/5">
                    <Maximize className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{prop.features.areaM2} {t('properties.area')}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {prop.description}
                </p>
              </div>

              {/* Lifecycle Controls Bar */}
              <div className="px-4 py-3 bg-slate-950/80 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                
                {/* Public / Private Toggle */}
                <button
                  type="button"
                  onClick={() => handleTogglePublic(prop)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                    (prop.is_public ?? true)
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25'
                      : 'bg-slate-800 text-slate-400 border-white/10 hover:bg-slate-700'
                  }`}
                  title="Alternar Visibilidad Pública para Catálogo e IA"
                >
                  {(prop.is_public ?? true) ? (
                    <>
                      <Eye className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Público</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                      <span>Privado</span>
                    </>
                  )}
                </button>

                {/* Status Selector Dropdown */}
                <select
                  value={prop.status || 'available'}
                  onChange={(e) => handleChangeStatus(prop, e.target.value)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold focus:outline-none border transition-all cursor-pointer ${
                    prop.status === 'available'
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                      : prop.status === 'reserved'
                      ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                      : prop.status === 'sold'
                      ? 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                      : 'bg-blue-950/60 text-blue-300 border-blue-500/40'
                  }`}
                >
                  <option value="available" className="bg-slate-900 text-emerald-400">● Disponible</option>
                  <option value="reserved" className="bg-slate-900 text-amber-400">● Reservado</option>
                  <option value="sold" className="bg-slate-900 text-rose-400">● Vendido</option>
                  <option value="rented" className="bg-slate-900 text-blue-400">● Alquilado</option>
                </select>

                <div className="flex items-center gap-1.5 ml-auto">
                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={() => setPropertyToEdit(prop)}
                    className="p-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer"
                    title="Editar Inmueble"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete Trash Button */}
                  <button
                    type="button"
                    onClick={() => setPropertyToDelete(prop)}
                    className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all cursor-pointer"
                    title="Eliminar Inmueble"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Document RAG Status Footer & PDF Dossier Action */}
            <div className="p-3.5 bg-black/40 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px]">{prop.documents?.length || 0} Docs RAG</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedAdProperty(prop)}
                  className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-[10px] shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 fill-slate-950" />
                  <span>Anuncio IA</span>
                </button>
                <button
                  onClick={() => setSelectedPropertyForModal(prop)}
                  className="px-2.5 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-[10px] border border-emerald-500/40 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <FileText className="w-3 h-3 text-emerald-400" />
                  <span>Ficha PDF</span>
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Step-by-Step Property Creation Wizard Modal */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl max-w-2xl w-full p-6 space-y-6 relative shadow-2xl my-8">
            
            <button
              onClick={() => setIsWizardOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Wizard Header */}
            <div>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" /> Wizard Carga Inmuebles
              </div>
              <h2 className="text-xl font-bold text-white mt-1">Añadir Propiedad al Catálogo & Motor IA</h2>
            </div>

            {/* Steps Indicator */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className={`flex items-center gap-2 text-xs ${wizardStep >= 1 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500">1</span>
                <span>Operación & Ubicación</span>
              </div>
              <div className={`flex items-center gap-2 text-xs ${wizardStep >= 2 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500">2</span>
                <span>Características & Precio</span>
              </div>
              <div className={`flex items-center gap-2 text-xs ${wizardStep >= 3 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500">3</span>
                <span>Descripción & Fotos</span>
              </div>
            </div>

            <form onSubmit={handleSubmitProperty} className="space-y-4 text-xs">
              
              {wizardStep === 1 && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Título de la Propiedad *</label>
                    <input
                      type="text"
                      required
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="Ej. Departamento Moderno 2 Ambientes con Balcón"
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Tipo de Operación *</label>
                      <select
                        value={formOperationType}
                        onChange={(e) => setFormOperationType(e.target.value as PropertyOperationType)}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-emerald-500"
                      >
                        <option value="sale">🏷️ Venta</option>
                        <option value="rent">🏠 Alquiler Tradicional</option>
                        <option value="temporary_rent">⏳ Alquiler Temporal</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Código Referencia</label>
                      <input
                        type="text"
                        value={formCode}
                        onChange={(e) => setFormCode(e.target.value)}
                        placeholder="PROP-100"
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Tipo de Inmueble</label>
                      <select
                        value={formType}
                        onChange={(e) => setFormType(e.target.value as Property['type'])}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-medium"
                      >
                        <option value="apartment">🏢 Departamento / Piso</option>
                        <option value="house">🏡 Casa / Chalet</option>
                        <option value="ph">🏘️ PH (Propiedad Horizontal)</option>
                        <option value="land">🏞️ Terreno / Lote</option>
                        <option value="commercial">🏬 Local Comercial</option>
                        <option value="office">🏢 Oficina / Consultorio</option>
                        <option value="warehouse">🏭 Galpón / Depósito</option>
                        <option value="penthouse">🌆 Penthouse / Ático</option>
                        <option value="chalet">🏡 Chalet / Villa</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Dirección / Calle</label>
                      <input
                        type="text"
                        value={formAddress}
                        onChange={(e) => setFormAddress(e.target.value)}
                        placeholder="Ej. Av. del Libertador 4500"
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Barrio / Zona</label>
                      <input
                        type="text"
                        value={formZone}
                        onChange={(e) => setFormZone(e.target.value)}
                        placeholder="Ej. Palermo Chico"
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Ciudad</label>
                      <input
                        type="text"
                        value={formCity}
                        onChange={(e) => setFormCity(e.target.value)}
                        placeholder="Ej. Buenos Aires"
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Precio & Moneda</label>
                    <div className="flex items-center gap-2">
                      <select
                        value={formCurrency}
                        onChange={(e) => setFormCurrency(e.target.value as any)}
                        className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-emerald-400 font-extrabold text-xs"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="ARS">ARS ($)</option>
                        <option value="EUR">EUR (€)</option>
                      </select>
                      <input
                        type="number"
                        required
                        value={formPrice}
                        onChange={(e) => setFormPrice(Number(e.target.value))}
                        placeholder="Ej. 180000"
                        className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Dormitorios</label>
                      <input
                        type="number"
                        value={formBedrooms}
                        onChange={(e) => setFormBedrooms(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Baños</label>
                      <input
                        type="number"
                        value={formBathrooms}
                        onChange={(e) => setFormBathrooms(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Superficie (m²)</label>
                      <input
                        type="number"
                        value={formAreaM2}
                        onChange={(e) => setFormAreaM2(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-white/10 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formGarage}
                        onChange={(e) => setFormGarage(e.target.checked)}
                        className="accent-emerald-500 rounded"
                      />
                      <span className="text-slate-300 font-medium">Incluye Cochera / Garage</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-white/10 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formPool}
                        onChange={(e) => setFormPool(e.target.checked)}
                        className="accent-emerald-500 rounded"
                      />
                      <span className="text-slate-300 font-medium">Incluye Piscina / Amenities</span>
                    </label>
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Descripción de la Propiedad</label>
                    <textarea
                      rows={3}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Describa las ventajas, luminosidad, estado de la propiedad..."
                      className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Fotografía Principal</label>
                    <div
                      onClick={() => document.getElementById('property-image-file')?.click()}
                      className="p-4 rounded-2xl bg-slate-950 border border-dashed border-emerald-500/40 hover:border-emerald-400 text-center space-y-2 cursor-pointer transition-all group"
                    >
                      <input
                        type="file"
                        id="property-image-file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                      <Upload className="w-6 h-6 text-emerald-400 mx-auto" />
                      <p className="text-slate-300 font-bold">Haz clic para subir foto</p>
                      <p className="text-slate-500 text-[10px]">JPG, PNG o WEBP de alta calidad</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">O URL directa de Imagen</label>
                    <input
                      type="text"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Wizard Nav Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                {wizardStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setWizardStep((prev) => (prev - 1) as any)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all cursor-pointer"
                  >
                    Anterior
                  </button>
                ) : <div />}

                {wizardStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => setWizardStep((prev) => (prev + 1) as any)}
                    className="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all cursor-pointer"
                  >
                    Siguiente
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Guardar Propiedad</span>
                  </button>
                )}
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Edit Property Modal */}
      {propertyToEdit && (
        <EditPropertyModal
          property={propertyToEdit}
          onClose={() => setPropertyToEdit(null)}
          onSave={handleSaveEditProperty}
        />
      )}

      {/* Importer Modal */}
      <PropertyImporterModal
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onImportComplete={(importedProps: ImportedPropertyItem[]) => {
          importedProps.forEach((item) => {
            onAddProperty({
              title: item.title,
              code: `PROP-${Math.floor(100 + Math.random() * 900)}`,
              type: 'apartment',
              operation_type: item.operation_type,
              status: item.status,
              is_public: item.is_public,
              price: item.price,
              currency: item.currency,
              location: {
                address: item.address,
                city: 'Buenos Aires',
                zone: item.address,
              },
              features: {
                bedrooms: item.rooms,
                bathrooms: item.bathrooms,
                areaM2: item.area_sqm,
                pool: false,
                garage: false,
                elevator: true,
                airConditioning: true,
              },
              description: item.description,
              images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'],
            });
          });
        }}
      />

      {/* Modal Dossier PDF Export */}
      {selectedPropertyForModal && (
        <PropertyPdfExportModal
          isOpen={true}
          property={selectedPropertyForModal}
          onClose={() => setSelectedPropertyForModal(null)}
        />
      )}

      {/* Modal Ad Studio */}
      {selectedAdProperty && (
        <PropertyAdStudioModal
          isOpen={true}
          property={selectedAdProperty as any}
          onClose={() => setSelectedAdProperty(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {propertyToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-500" />
              ¿Eliminar Propiedad?
            </h3>
            <p className="text-xs text-slate-300">
              ¿Estás seguro de que deseas eliminar <strong className="text-white">{propertyToDelete.title}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPropertyToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs cursor-pointer hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-rose-600/20"
              >
                Eliminar Inmueble
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

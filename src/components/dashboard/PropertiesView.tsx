import React, { useState } from 'react';
import { Property } from '../../types';
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
  Layers,
  Sparkles,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';

import { PropertyImporterModal, ImportedPropertyItem } from '../properties/PropertyImporterModal';
import { PropertyPdfExportModal } from '../properties/PropertyPdfExportModal';
import { PropertyAdStudioModal } from '../properties/PropertyAdStudioModal';

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
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [selectedPropertyForModal, setSelectedPropertyForModal] = useState<Property | null>(null);
  const [selectedAdProperty, setSelectedAdProperty] = useState<Property | null>(null);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  const [isSyncingAI, setIsSyncingAI] = useState(false);

  const handleTogglePublic = async (prop: Property) => {
    const nextIsPublic = !(prop.is_public ?? true);
    if (supabase) {
      try {
        await supabase.from('properties').update({ is_public: nextIsPublic }).eq('id', prop.id);
      } catch (err) {
        console.warn('Error updating is_public:', err);
      }
    }
    if (onUpdateProperty) {
      onUpdateProperty(prop.id, { is_public: nextIsPublic });
    }
  };

  const handleChangeStatus = async (prop: Property, newStatus: string) => {
    if (supabase) {
      try {
        await supabase.from('properties').update({ status: newStatus }).eq('id', prop.id);
      } catch (err) {
        console.warn('Error updating status:', err);
      }
    }
    if (onUpdateProperty) {
      onUpdateProperty(prop.id, { status: newStatus });
    }
  };

  const handleConfirmDelete = async () => {
    if (!propertyToDelete) return;
    if (supabase) {
      try {
        await supabase.from('properties').delete().eq('id', propertyToDelete.id);
      } catch (err) {
        console.warn('Error deleting property:', err);
      }
    }
    if (onDeleteProperty) {
      onDeleteProperty(propertyToDelete.id);
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
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.location.zone.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || p.type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleSubmitProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    onAddProperty({
      title: formTitle,
      code: formCode || `PROP-${Math.floor(100 + Math.random() * 900)}`,
      type: formType,
      status: 'available',
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
            <span>📥 Importar Propiedades (CSV / URL)</span>
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

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/[0.03] backdrop-blur-sm p-3 rounded-2xl border border-white/5">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('properties.searchPlaceholder')}
            className="w-full bg-black/30 border border-white/5 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {['all', 'chalet', 'penthouse', 'villa', 'apartment'].map((tType) => (
            <button
              key={tType}
              onClick={() => setSelectedType(tType)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                selectedType === tType
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white bg-white/5'
              }`}
            >
              {tType === 'all'
                ? t('properties.allTypes')
                : tType === 'apartment'
                ? t('properties.typeApartment')
                : tType === 'chalet' || tType === 'villa'
                ? t('properties.typeHouse')
                : tType === 'penthouse'
                ? t('properties.typePenthouse')
                : tType}
            </button>
          ))}
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
            className="rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-white/5 hover:border-emerald-500/30 transition-all overflow-hidden flex flex-col justify-between group"
          >
            <div>
              {/* Image & Price Overlay */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={prop.images[0]}
                  alt={prop.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-[10px] font-mono font-bold text-slate-300 border border-white/10">
                    {prop.code}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                    prop.status === 'sold'
                      ? 'bg-rose-500 text-white'
                      : prop.status === 'rented'
                      ? 'bg-blue-500 text-white'
                      : prop.status === 'reserved'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {prop.status === 'sold' ? `🔴 ${t('status_sold')}` : prop.status === 'rented' ? `🔵 ${t('status_rented')}` : prop.status === 'reserved' ? `🟡 ${t('status_reserved')}` : `🟢 ${t('status_available')}`}
                  </span>
                </div>
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-extrabold text-xs shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  ${prop.price.toLocaleString('en-US')} {prop.currency || 'USD'} {prop.price < 5000 ? t('properties.perMonth') : ''}
                </div>
              </div>

              {/* Body Info */}
              <div className="p-5 space-y-3">
                <h3 className="text-sm font-semibold text-white line-clamp-1">{prop.title}</h3>
                
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{prop.location.address}, {prop.location.zone} ({prop.location.city})</span>
                </p>

                {/* Features Badges */}
                <div className="grid grid-cols-3 gap-2 py-2 border-y border-white/5 text-slate-300 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Bed className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{prop.features.bedrooms} {t('properties.bedrooms')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Bath className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{prop.features.bathrooms} {t('properties.bathrooms')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Maximize className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{prop.features.areaM2} {t('properties.area')}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {prop.description}
                </p>
              </div>
              {/* Lifecycle Controls Bar (Visibility Switch & Status Selector & Trash Delete) */}
              <div className="px-4 py-2 bg-slate-900/90 border-t border-white/5 flex items-center justify-between gap-2 text-xs">
                {/* Public / Private Toggle */}
                <button
                  onClick={() => handleTogglePublic(prop)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                    prop.is_public ?? true
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border-white/10'
                  }`}
                  title="Alternar Visibilidad Pública"
                >
                  {prop.is_public ?? true ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3 text-slate-400" />}
                  <span>{prop.is_public ?? true ? `🟢 ${t('visibility_public')}` : `⚪ ${t('visibility_private')}`}</span>
                </button>

                {/* Status Selector */}
                <select
                  value={prop.status || 'available'}
                  onChange={(e) => handleChangeStatus(prop, e.target.value)}
                  className="px-2 py-1 rounded-lg bg-slate-950 border border-white/10 text-white text-[10px] font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="available">🟢 {t('status_available')}</option>
                  <option value="reserved">🟡 {t('status_reserved')}</option>
                  <option value="rented">🔵 {t('status_rented')}</option>
                  <option value="sold">🔴 {t('status_sold')}</option>
                </select>

                {/* Delete Trash Button */}
                <button
                  onClick={() => setPropertyToDelete(prop)}
                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all cursor-pointer"
                  title="Eliminar Inmueble"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Document RAG Status Footer & PDF Dossier Action */}
            <div className="p-4 bg-black/30 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>{prop.documents.length} RAG PDF Docs</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedAdProperty(prop)}
                  className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-[10px] shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 fill-slate-950" />
                  <span>🪄 Crear Anuncio IA</span>
                </button>
                <button
                  onClick={() => setSelectedPropertyForModal(prop)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-[10px] border border-emerald-500/40 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <FileText className="w-3 h-3 text-emerald-400" />
                  <span>📄 Ficha PDF</span>
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Step-by-Step Property Creation Wizard Modal */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl max-w-2xl w-full p-6 space-y-6 relative shadow-2xl">
            
            <button
              onClick={() => setIsWizardOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Wizard Header */}
            <div>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" /> Wizard Carga Inmuebles RAG
              </div>
              <h2 className="text-xl font-bold text-white mt-1">Añadir Propiedad a la Base de Datos RAG</h2>
            </div>

            {/* Steps Indicator */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className={`flex items-center gap-2 text-xs ${wizardStep >= 1 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500">1</span>
                <span>Datos Básicos & Ubicación</span>
              </div>
              <div className={`flex items-center gap-2 text-xs ${wizardStep >= 2 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500">2</span>
                <span>Características & Precio</span>
              </div>
              <div className={`flex items-center gap-2 text-xs ${wizardStep >= 3 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500">3</span>
                <span>Documentos & RAG</span>
              </div>
            </div>

            <form onSubmit={handleSubmitProperty} className="space-y-4 text-xs">
              
              {wizardStep === 1 && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Título de la Propiedad</label>
                    <input
                      type="text"
                      required
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="Ej. Villa de Diseño en La Moraleja"
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Código de Referencia</label>
                      <input
                        type="text"
                        value={formCode}
                        onChange={(e) => setFormCode(e.target.value)}
                        placeholder="MAD-MOR-10"
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Tipo de Inmueble</label>
                      <select
                        value={formType}
                        onChange={(e) => setFormType(e.target.value as Property['type'])}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-medium"
                      >
                        <option value="house">🏠 Casa</option>
                        <option value="apartment">🏢 Departamento / Piso</option>
                        <option value="ph">🏡 PH (Propiedad Horizontal)</option>
                        <option value="land">🌲 Terreno / Lote</option>
                        <option value="commercial">🏪 Local Comercial</option>
                        <option value="office">💼 Oficina / Consultorio</option>
                        <option value="warehouse">🏭 Galpón / Depósito</option>
                        <option value="penthouse">🏰 Penthouse / Ático</option>
                        <option value="chalet">🏡 Chalet / Villa</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Ciudad</label>
                      <input
                        type="text"
                        value={formCity}
                        onChange={(e) => setFormCity(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Zona / Barrio</label>
                      <input
                        type="text"
                        value={formZone}
                        onChange={(e) => setFormZone(e.target.value)}
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

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Fotografía Principal del Inmueble</label>
                    
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
                      {formImageUrl ? (
                        <div className="relative rounded-xl overflow-hidden h-36 w-full max-w-sm mx-auto border border-white/10 group-hover:scale-105 transition-transform">
                          <img src={formImageUrl} alt="Vista previa" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-xs font-bold text-white bg-slate-900/80 px-3 py-1.5 rounded-lg border border-white/10">
                              📷 Cambiar imagen
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1 py-3">
                          <Upload className="w-6 h-6 text-emerald-400 mx-auto group-hover:scale-110 transition-transform" />
                          <p className="text-white text-xs font-bold">Subir Fotografía desde tu Dispositivo</p>
                          <p className="text-[10px] text-slate-400">Haz clic o arrastra un archivo JPG, PNG o WEBP aquí</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-2">
                      <input
                        type="text"
                        value={formImageUrl}
                        onChange={(e) => setFormImageUrl(e.target.value)}
                        placeholder="O pega una URL directa de imagen (https://...)"
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Descripción para el Agente RAG</label>
                    <textarea
                      rows={3}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Detalla acabados, orientación, certificado energético e IBI..."
                      className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-dashed border-emerald-500/40 text-center space-y-2">
                    <Upload className="w-6 h-6 text-emerald-400 mx-auto" />
                    <p className="text-white font-semibold">Adjuntar Dossier PDF o Plano para Aria AI RAG</p>
                    <p className="text-[10px] text-slate-400">Archivos soportados: .pdf, .docx, .png (Máx 25MB)</p>
                    <button
                      type="button"
                      className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold border border-emerald-500/30"
                    >
                      Simular Carga de Documento
                    </button>
                  </div>
                </div>
              )}

              {/* Wizard Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                {wizardStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setWizardStep((prev) => (prev - 1) as any)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                  >
                    Anterior
                  </button>
                ) : <div />}

                {wizardStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => setWizardStep((prev) => (prev + 1) as any)}
                    className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold"
                  >
                    Siguiente
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold shadow-lg shadow-emerald-500/20"
                  >
                    Guardar Propiedad & Indexar RAG
                  </button>
                )}
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Property Importer Modal */}
      <PropertyImporterModal
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        existingPropertiesCount={properties.length}
        onImportComplete={(importedItems) => {
          importedItems.forEach((item) => {
            onAddProperty({
              title: item.title,
              code: 'PROP-' + Math.floor(1000 + Math.random() * 9000),
              type: 'apartment',
              status: 'available',
              price: item.price,
              location: {
                address: item.address_neighborhood,
                city: 'CABA',
                zone: item.address_neighborhood,
              },
              features: {
                bedrooms: item.rooms,
                bathrooms: 1,
                areaM2: item.surface_m2,
                pool: false,
                garage: false,
                elevator: true,
                airConditioning: true,
              },
              description: item.description,
              images: [
                'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
              ],
            });
          });
        }}
      />

      {/* Property PDF Export Modal */}
      {selectedPropertyForModal && (
        <PropertyPdfExportModal
          isOpen={Boolean(selectedPropertyForModal)}
          onClose={() => setSelectedPropertyForModal(null)}
          property={selectedPropertyForModal}
        />
      )}

      {/* Property AI Ad Studio Modal */}
      <PropertyAdStudioModal
        isOpen={Boolean(selectedAdProperty)}
        onClose={() => setSelectedAdProperty(null)}
        property={
          selectedAdProperty
            ? {
                id: selectedAdProperty.id,
                title: selectedAdProperty.title,
                code: selectedAdProperty.code,
                price: selectedAdProperty.price,
                currency: 'USD',
                type: selectedAdProperty.type,
                operation: selectedAdProperty.price < 5000 ? 'alquiler' : 'venta',
                bedrooms: selectedAdProperty.features.bedrooms,
                area_m2: selectedAdProperty.features.areaM2,
                zone: selectedAdProperty.location.zone || selectedAdProperty.location.city,
                address: selectedAdProperty.location.address,
                description: selectedAdProperty.description,
              }
            : null
        }
      />
      {/* Delete Property Confirmation Modal */}
      {propertyToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn font-sans">
          <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-rose-500/40 p-6 shadow-2xl text-white space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">Eliminar Propiedad</h3>
                <p className="text-[11px] text-slate-400">Esta acción no se puede deshacer</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {t('delete_property_confirm')} (<span className="font-bold text-white">"{propertyToDelete.title}"</span> - {propertyToDelete.code})
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setPropertyToDelete(null)}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg shadow-rose-950 transition-all cursor-pointer"
              >
                Confirmar Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

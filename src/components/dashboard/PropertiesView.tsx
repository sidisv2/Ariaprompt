import React, { useState } from 'react';
import { Property } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
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
  Sparkles
} from 'lucide-react';

interface PropertiesViewProps {
  properties: Property[];
  onAddProperty: (newProp: Omit<Property, 'id' | 'createdAt' | 'documents' | 'featured'>) => void;
}

export const PropertiesView: React.FC<PropertiesViewProps> = ({ properties, onAddProperty }) => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isSyncingAI, setIsSyncingAI] = useState(false);

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
  const [formType, setFormType] = useState<Property['type']>('chalet');
  const [formPrice, setFormPrice] = useState<number>(1850000);
  const [formCity, setFormCity] = useState('Madrid');
  const [formZone, setFormZone] = useState('Puerta de Hierro');
  const [formAddress, setFormAddress] = useState('Calle Real 14');
  const [formBedrooms, setFormBedrooms] = useState<number>(4);
  const [formBathrooms, setFormBathrooms] = useState<number>(4);
  const [formAreaM2, setFormAreaM2] = useState<number>(420);
  const [formPool, setFormPool] = useState(true);
  const [formGarage, setFormGarage] = useState(true);
  const [formDescription, setFormDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80');

  const filteredProperties = properties.filter((p) => {
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
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-[10px] font-mono font-bold text-slate-300 border border-white/10">
                  {prop.code}
                </div>
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-extrabold text-xs shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  ${prop.price.toLocaleString('en-US')} USD {prop.price < 5000 ? t('properties.perMonth') : ''}
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
            </div>

            {/* Document RAG Status Footer */}
            <div className="p-4 bg-black/30 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>{prop.documents.length} RAG PDF Docs</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                AI Synced
              </span>
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
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white"
                      >
                        <option value="chalet">Chalet</option>
                        <option value="penthouse">Ático</option>
                        <option value="villa">Villa</option>
                        <option value="apartment">Piso / Loft</option>
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
                    <label className="block text-slate-300 font-semibold mb-1">Precio (€)</label>
                    <input
                      type="number"
                      required
                      value={formPrice}
                      onChange={(e) => setFormPrice(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-sm"
                    />
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
                    <label className="block text-slate-300 font-semibold mb-1">URL Fotografía Principal</label>
                    <input
                      type="text"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white"
                    />
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

    </div>
  );
};

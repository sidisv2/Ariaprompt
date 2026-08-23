import { supabase } from '../../lib/supabaseClient';
import React, { useState } from 'react';
import { Property, RentalPeriod } from '../../types';
import { X, Sparkles, Upload, Save, Loader2, Image as ImageIcon, Plus, Trash2, Tag, Home, Clock, Calendar, Lock, MapPin, DollarSign, Percent, Navigation, EyeOff, Star, ArrowUp, ArrowDown, Check } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface EditPropertyModalProps {
  property: Property;
  onClose: () => void;
  onSave: (updatedProperty: Property) => Promise<void>;
}

export const EditPropertyModal: React.FC<EditPropertyModalProps> = ({
  property,
  onClose,
  onSave,
}) => {
  const { t } = useLanguage();
  const [title, setTitle] = useState(property.title || '');
  const [code, setCode] = useState(property.code || '');
  const [type, setType] = useState<Property['type']>(property.type || 'apartment');
  const [operationType, setOperationType] = useState<string>(
    property.operation_type || (property.price < 5000 ? 'rent' : 'sale')
  );
  const [rentalPeriod, setRentalPeriod] = useState<RentalPeriod>(
    property.rental_period || (operationType === 'temporary_rent' ? 'nightly' : 'monthly')
  );
  const [price, setPrice] = useState<number>(property.price || 0);
  const [priceMax, setPriceMax] = useState<number | ''>(property.price_max || '');
  const [currency, setCurrency] = useState<'USD' | 'ARS'>(property.currency === 'ARS' ? 'ARS' : 'USD');
  const [expenses, setExpenses] = useState<number>((property as any).expenses || 0);

  // Advanced Commercial & Location Fields
  const [googleMapsUrl, setGoogleMapsUrl] = useState<string>(property.google_maps_url || property.location?.googleMapsUrl || '');
  const [financingScheme, setFinancingScheme] = useState<string>(property.financing_scheme || '');
  const [acceptsTradeIn, setAcceptsTradeIn] = useState<boolean>(property.accepts_trade_in ?? false);
  const [tradeInDetails, setTradeInDetails] = useState<string>(property.trade_in_details || '');
  const [keyDistances, setKeyDistances] = useState<string>(property.key_distances || '');
  const [estimatedRoi, setEstimatedRoi] = useState<string>(property.estimated_roi || '');
  const [masterplanUrl, setMasterplanUrl] = useState<string>(property.masterplan_url || '');

  // AI Private Context
  const [aiPrivateContext, setAiPrivateContext] = useState<string>(property.ai_private_context || '');

  // Location
  const [address, setAddress] = useState(property.location?.address || '');
  const [zone, setZone] = useState(property.location?.zone || '');
  const [city, setCity] = useState(property.location?.city || '');

  // Features
  const [bedrooms, setBedrooms] = useState<number>(property.features?.bedrooms || 0);
  const [bathrooms, setBathrooms] = useState<number>(property.features?.bathrooms || 0);
  const [areaM2, setAreaM2] = useState<number>(property.features?.areaM2 || 0);
  const [parking, setParking] = useState<number>(property.features?.parking || 0);

  // Description & Images
  const [description, setDescription] = useState(property.description || '');

  // Normalized tagged images
  const initialTaggedImages: { url: string; tag: string }[] = (() => {
    if ((property as any).property_images && Array.isArray((property as any).property_images)) {
      return (property as any).property_images.map((img: any) => ({
        url: typeof img === 'string' ? img : img.url,
        tag: typeof img === 'object' && img.tag ? img.tag : 'General',
      }));
    }
    const rawImgs = property.images && property.images.length > 0
      ? property.images
      : (property as any).image_url
      ? [(property as any).image_url]
      : [];
    return rawImgs.map((url, idx) => ({
      url,
      tag: idx === 0 ? 'Fachada' : 'General',
    }));
  })();

  const [taggedImages, setTaggedImages] = useState<{ url: string; tag: string }[]>(initialTaggedImages);
  const [images, setImages] = useState<string[]>(initialTaggedImages.map((i) => i.url));
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageTag, setNewImageTag] = useState<string>('General');

  const AVAILABLE_TAGS = ['Fachada', 'Cocina', 'Living', 'Dormitorio', 'Baño', 'Patio/Parque', 'Pileta', 'Plano', 'General'];

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [uploadingImages, setUploadingImages] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const uploadFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setUploadingImages(true);

    const newUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      let uploadedUrl: string | null = null;

      // Try uploading to Supabase Storage bucket 'properties' or 'property-images'
      if (supabase) {
        try {
          const fileExt = file.name.split('.').pop() || 'jpg';
          const fileName = `prop_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
          const filePath = `property_images/${fileName}`;

          const { data: storageData, error: storageErr } = await supabase.storage
            .from('properties')
            .upload(filePath, file, { cacheControl: '3600', upsert: true });

          if (!storageErr && storageData) {
            const { data: publicUrlData } = supabase.storage
              .from('properties')
              .getPublicUrl(filePath);

            if (publicUrlData?.publicUrl) {
              uploadedUrl = publicUrlData.publicUrl;
            }
          }
        } catch (e) {
          console.warn('Supabase storage upload fallback to Base64:', e);
        }
      }

      // Fallback to Data URL if storage bucket is not configured
      if (!uploadedUrl) {
        uploadedUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (reader.result && typeof reader.result === 'string') {
              resolve(reader.result);
            } else {
              resolve('');
            }
          };
          reader.readAsDataURL(file);
        });
      }

      if (uploadedUrl) {
        newUrls.push(uploadedUrl);
      }
    }

    if (newUrls.length > 0) {
      const newItems = newUrls.map((url, idx) => ({
        url,
        tag: taggedImages.length === 0 && idx === 0 ? 'Fachada' : 'General',
      }));
      setTaggedImages((prev) => [...prev, ...newItems]);
      setImages((prev) => [...prev, ...newUrls]);
    }
    setUploadingImages(false);
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      uploadFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      uploadFiles(e.dataTransfer.files);
    }
  };

  const handleSetMainCover = (index: number) => {
    if (index === 0) return;
    setTaggedImages((prev) => {
      const selected = prev[index];
      const rest = prev.filter((_, idx) => idx !== index);
      return [selected, ...rest];
    });
    setImages((prev) => {
      const selected = prev[index];
      const rest = prev.filter((_, idx) => idx !== index);
      return [selected, ...rest];
    });
  };

  const handleMoveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= taggedImages.length) return;
    setTaggedImages((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, item);
      return copy;
    });
    setImages((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, item);
      return copy;
    });
  };

  const handleAddImageUrl = () => {
    if (!newImageUrl.trim()) return;
    const url = newImageUrl.trim();
    setTaggedImages((prev) => [...prev, { url, tag: newImageTag || 'General' }]);
    setImages((prev) => [...prev, url]);
    setNewImageUrl('');
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setTaggedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleUpdateImageTag = (index: number, newTag: string) => {
    setTaggedImages((prev) => {
      const copy = [...prev];
      if (copy[index]) {
        copy[index] = { ...copy[index], tag: newTag };
      }
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    try {
      const plainImages = taggedImages.map((i) => i.url);
      const updatedProp: Property = {
        ...property,
        title: title.trim(),
        code: code.trim(),
        type,
        operation_type: operationType,
        rental_period: operationType === 'sale' ? null : (rentalPeriod || 'monthly'),
        price: Number(price),
        currency,
        location: {
          ...property.location,
          address: address.trim(),
          zone: zone.trim(),
          city: city.trim(),
        },
        features: {
          ...property.features,
          bedrooms: Number(bedrooms),
          bathrooms: Number(bathrooms),
          areaM2: Number(areaM2),
          parking: Number(parking),
          pool: property.features?.pool ?? true,
          garage: parking > 0 || (property.features?.garage ?? true),
          elevator: property.features?.elevator ?? false,
          airConditioning: property.features?.airConditioning ?? false,
        },
        images: plainImages.length > 0 ? plainImages : ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'],
        property_images: taggedImages as any,
      };

      await onSave(updatedProp);
      onClose();
    } catch (err: any) {
      console.error('Error al guardar propiedad:', err);
      setErrorMsg(err?.message || 'Error al guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl max-w-3xl w-full p-6 space-y-6 relative shadow-2xl my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" /> Edición de Inmueble
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1">
            Editar Propiedad: {property.code || property.title}
          </h2>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          
          {/* Section 1: Basic Info */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-950/60 border border-white/5">
            <h3 className="font-bold text-emerald-400 text-xs uppercase tracking-wider">
              1. Información Básica & Operación
            </h3>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Título de la Propiedad *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Departamento Moderno 2 Ambientes"
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tipo de Operación *</label>
                <select
                  value={operationType}
                  onChange={(e) => {
                    const newOp = e.target.value;
                    setOperationType(newOp);
                    if (newOp === 'temporary_rent') setRentalPeriod('nightly');
                    else if (newOp === 'rent') setRentalPeriod('monthly');
                    else setRentalPeriod(null);
                  }}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-emerald-500"
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
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tipo de Inmueble</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as Property['type'])}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white font-medium"
                >
                  <option value="apartment">🏢 Departamento / Piso</option>
                  <option value="house">🏡 Casa / Chalet</option>
                  <option value="ph">🏘️ PH (Propiedad Horizontal)</option>
                  <option value="land">🏞️ Terreno / Lote</option>
                  <option value="commercial">🏬 Local Comercial</option>
                  <option value="office">🏢 Oficina / Consultorio</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Moneda, Precio & Período</label>
                <div className="flex items-center gap-2">
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as any)}
                    className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-emerald-400 font-extrabold"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="ARS">ARS ($)</option>
                  </select>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-sm font-bold"
                  />

                  {/* Rental Period Selector */}
                  {operationType !== 'sale' && (
                    <select
                      value={rentalPeriod || (operationType === 'temporary_rent' ? 'nightly' : 'monthly')}
                      onChange={(e) => setRentalPeriod(e.target.value as RentalPeriod)}
                      className="bg-slate-900 border border-emerald-500/40 rounded-xl px-3 py-2 text-emerald-300 font-bold"
                    >
                      {operationType === 'temporary_rent' ? (
                        <>
                          <option value="nightly">/ noche</option>
                          <option value="monthly">/ mes</option>
                        </>
                      ) : (
                        <>
                          <option value="monthly">/ mes</option>
                          <option value="yearly">/ año</option>
                        </>
                      )}
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Expensas / Gastos (Opcional)</label>
                <input
                  type="number"
                  value={expenses}
                  onChange={(e) => setExpenses(Number(e.target.value))}
                  placeholder="0"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Location & Features */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-950/60 border border-white/5">
            <h3 className="font-bold text-emerald-400 text-xs uppercase tracking-wider">
              2. Ubicación & Características
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Dirección Calle / Altura</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ej. Av. Santa Fe 3200"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Barrio / Zona</label>
                <input
                  type="text"
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  placeholder="Ej. Palermo Soho"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Ciudad / Provincia</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ej. CABA"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Dormitorios</label>
                <input
                  type="number"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Baños</label>
                <input
                  type="number"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Superficie Total (m²)</label>
                <input
                  type="number"
                  value={areaM2}
                  onChange={(e) => setAreaM2(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Cocheras / Cocheros</label>
                <input
                  type="number"
                  value={parking}
                  onChange={(e) => setParking(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Description & Images */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-950/60 border border-white/5">
            <h3 className="font-bold text-emerald-400 text-xs uppercase tracking-wider">
              3. Descripción & Galería de Fotos
            </h3>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Descripción Detallada</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describa las principales ventajas del inmueble..."
                className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Images Upload / Gallery Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-slate-300 font-semibold text-xs">
                  Galería Multimedia ({images.length} fotos cargadas)
                </label>
                <span className="text-[11px] text-slate-400">
                  La foto #1 es la <strong className="text-emerald-400">Portada Principal</strong>
                </span>
              </div>

              {/* Drag & Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative p-6 rounded-2xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center gap-2 ${
                  isDragging
                    ? 'border-emerald-400 bg-emerald-500/10'
                    : 'border-white/10 hover:border-emerald-500/40 bg-slate-900/50'
                }`}
              >
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageFileUpload}
                  id="multi-image-upload"
                  className="hidden"
                />
                <label
                  htmlFor="multi-image-upload"
                  className="flex flex-col items-center gap-2 cursor-pointer w-full"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-lg">
                    {uploadingImages ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <Upload className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">
                      {uploadingImages ? 'Subiendo imágenes a Supabase Storage...' : 'Haz clic o arrastra múltiples fotos aquí'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      JPG, PNG, WebP permitidos. Puedes subir varias fotos a la vez.
                    </p>
                  </div>
                </label>
              </div>

              {/* Interactive Thumbnail Gallery with Environment Tags */}
              {taggedImages.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {taggedImages.map((imgItem, idx) => (
                    <div
                      key={idx}
                      className={`relative rounded-2xl overflow-hidden bg-slate-950 border transition-all flex flex-col ${
                        idx === 0
                          ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                          : 'border-white/10 hover:border-white/25'
                      }`}
                    >
                      <div className="relative aspect-[4/3] w-full overflow-hidden group">
                        <img
                          src={imgItem.url}
                          alt={`Foto ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />

                        {/* Overlay Controls */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                          <div className="flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => handleSetMainCover(idx)}
                              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                                idx === 0
                                  ? 'bg-emerald-500 text-slate-950'
                                  : 'bg-black/60 hover:bg-emerald-500 hover:text-slate-950 text-white'
                              }`}
                              title="Marcar como portada"
                            >
                              <Star className={`w-3 h-3 ${idx === 0 ? 'fill-current' : ''}`} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="p-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white transition-colors cursor-pointer"
                              title="Eliminar foto"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1">
                              {idx > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleMoveImage(idx, idx - 1)}
                                  className="p-1 rounded bg-black/60 hover:bg-white/20 text-white"
                                  title="Mover hacia adelante"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </button>
                              )}
                              {idx < taggedImages.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleMoveImage(idx, idx + 1)}
                                  className="p-1 rounded bg-black/60 hover:bg-white/20 text-white"
                                  title="Mover hacia atrás"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            <span className="text-[10px] font-mono font-bold text-slate-300">
                              #{idx + 1}
                            </span>
                          </div>
                        </div>

                        {/* Main Badge */}
                        {idx === 0 && (
                          <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                            <Check className="w-2.5 h-2.5 stroke-[3]" /> Portada
                          </span>
                        )}
                      </div>

                      {/* Tag Selector */}
                      <div className="p-2 bg-slate-900 border-t border-white/5 flex items-center gap-1.5">
                        <Tag className="w-3 h-3 text-emerald-400 shrink-0" />
                        <select
                          value={imgItem.tag || 'General'}
                          onChange={(e) => handleUpdateImageTag(idx, e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-emerald-500"
                        >
                          {AVAILABLE_TAGS.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add by URL Input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddImageUrl();
                    }
                  }}
                  placeholder="O pega una URL directa de imagen (https://...)"
                  className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Agregar URL
                </button>
              </div>
            </div>
          </div>

          {/* Modal Actions Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

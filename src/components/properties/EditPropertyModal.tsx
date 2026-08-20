import React, { useState } from 'react';
import { Property } from '../../types';
import { X, Sparkles, Upload, Save, Loader2, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
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
  const [price, setPrice] = useState<number>(property.price || 0);
  const [currency, setCurrency] = useState<'USD' | 'ARS'>(property.currency === 'ARS' ? 'ARS' : 'USD');
  const [expenses, setExpenses] = useState<number>((property as any).expenses || 0);

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
  const [images, setImages] = useState<string[]>(
    property.images && property.images.length > 0
      ? property.images
      : (property as any).image_url
      ? [(property as any).image_url]
      : []
  );
  const [newImageUrl, setNewImageUrl] = useState('');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result && typeof reader.result === 'string') {
        setImages((prev) => [reader.result as string, ...prev]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddImageUrl = () => {
    if (!newImageUrl.trim()) return;
    setImages((prev) => [...prev, newImageUrl.trim()]);
    setNewImageUrl('');
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    try {
      const updatedProp: Property = {
        ...property,
        title,
        code,
        type,
        operation_type: operationType,
        price,
        currency,
        description,
        location: {
          address,
          zone,
          city,
        },
        features: {
          bedrooms,
          bathrooms,
          areaM2,
          parking,
          pool: property.features?.pool ?? true,
          garage: parking > 0 || (property.features?.garage ?? true),
          elevator: property.features?.elevator ?? false,
          airConditioning: property.features?.airConditioning ?? false,
        },
        images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'],
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
            <Sparkles className="w-4 h-4" /> Edición Rápida de Inmueble
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
              <label className="block text-slate-300 font-semibold mb-1">Título de la Propiedad</label>
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
                <label className="block text-slate-300 font-semibold mb-1">Código Referencia</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tipo de Operación</label>
                <select
                  value={operationType}
                  onChange={(e) => setOperationType(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white font-medium"
                >
                  <option value="sale">🏷️ Venta</option>
                  <option value="rent">🔑 Alquiler</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tipo de Inmueble</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as Property['type'])}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white font-medium"
                >
                  <option value="apartment">🏢 Departamento / Piso</option>
                  <option value="house">🏠 Casa / Chalet</option>
                  <option value="ph">🏡 PH (Propiedad Horizontal)</option>
                  <option value="land">🌲 Terreno / Lote</option>
                  <option value="commercial">🏪 Local Comercial</option>
                  <option value="office">💼 Oficina / Consultorio</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Moneda & Precio</label>
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
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Expensas (Estimadas)</label>
                <input
                  type="number"
                  value={expenses}
                  onChange={(e) => setExpenses(Number(e.target.value))}
                  placeholder="Ej. 15000"
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
            <div>
              <label className="block text-slate-300 font-semibold mb-2">Galería de Imágenes</label>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                {images.map((imgUrl, idx) => (
                  <div key={idx} className="relative rounded-xl overflow-hidden h-24 bg-slate-950 border border-white/10 group">
                    <img src={imgUrl} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 p-1 rounded-lg bg-rose-600 text-white opacity-80 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Eliminar foto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-1 left-1 px-2 py-0.5 rounded bg-emerald-500 text-slate-950 text-[9px] font-black uppercase">
                        Principal
                      </span>
                    )}
                  </div>
                ))}

                {/* Upload Trigger Card */}
                <label className="h-24 rounded-xl border border-dashed border-emerald-500/40 hover:border-emerald-400 bg-slate-950 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors text-center p-2">
                  <Upload className="w-5 h-5 text-emerald-400" />
                  <span className="text-[10px] font-bold text-slate-300">Subir Imagen</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Add by URL */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="O pega una URL directa de imagen (https://...)"
                  className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white text-xs"
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

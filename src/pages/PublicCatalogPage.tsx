import React, { useState, useEffect } from 'react';
import { AppRoute, Property } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { Footer } from '../components/marketing/Footer';
import {
  Building2,
  Search,
  MapPin,
  Bed,
  Bath,
  Maximize,
  Sparkles,
  MessageSquare,
  ArrowRight,
  Tag,
  Home,
  Clock,
  Filter
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface PublicCatalogPageProps {
  onRouteChange: (route: AppRoute) => void;
  onOpenPrompt?: (prompt: string) => void;
}

export const PublicCatalogPage: React.FC<PublicCatalogPageProps> = ({
  onRouteChange,
  onOpenPrompt,
}) => {
  const { t } = useLanguage();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [operationFilter, setOperationFilter] = useState<'all' | 'sale' | 'rent' | 'temporary_rent'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currencyFilter, setCurrencyFilter] = useState<'all' | 'USD' | 'ARS'>('all');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [bedroomsFilter, setBedroomsFilter] = useState<string>('all');

  useEffect(() => {
    async function loadCatalog() {
      setLoading(true);
      if (supabase) {
        try {
          // Consulta en tiempo real directa a Supabase: solo propiedades públicas y disponibles
          const { data, error } = await supabase
            .from('properties')
            .select('*')
            .eq('is_public', true)
            .eq('status', 'available')
            .order('created_at', { ascending: false });

          if (!error && data) {
            const mapped: Property[] = data.map((item: any) => ({
              id: item.id,
              title: item.title || 'Propiedad Inmobiliaria',
              code: item.code || `PROP-${String(item.id).slice(0, 4)}`,
              type: item.type || 'apartment',
              operation_type: item.operation_type || (Number(item.price) < 5000 ? 'rent' : 'sale'),
              rental_period: item.rental_period || (item.operation_type === 'temporary_rent' ? 'nightly' : item.operation_type === 'rent' ? 'monthly' : null),
              status: item.status || 'available',
              is_public: item.is_public ?? true,
              price: Number(item.price || 0),
              currency: item.currency || 'USD',
              location: {
                address: item.address || item.zone || 'Ubicación sin especificar',
                city: item.city || 'Buenos Aires',
                zone: item.zone || item.address || 'Palermo',
              },
              features: {
                bedrooms: Number(item.bedrooms) || 2,
                bathrooms: Number(item.bathrooms) || 1,
                areaM2: Number(item.surface_m2 || item.area_m2) || 65,
                pool: item.pool || false,
                garage: item.garage || false,
                elevator: item.elevator || true,
                airConditioning: item.air_conditioning || true,
              },
              description: item.description || '',
              images:
                item.images && item.images.length > 0
                  ? item.images
                  : [item.image_url || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'],
              createdAt: item.created_at || new Date().toISOString(),
              documents: [],
              featured: item.featured || false,
            }));
            setProperties(mapped);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn('Catalog live fetch exception:', e);
        }
      }

      setProperties([]);
      setLoading(false);
    }

    loadCatalog();
  }, []);

  const formatPriceDisplay = (prop: Property) => {
    const formattedNum = Number(prop.price).toLocaleString('en-US');
    const curr = prop.currency || 'USD';
    const op = prop.operation_type || (prop.price < 5000 ? 'rent' : 'sale');

    if (op === 'sale') {
      return `${curr} $${formattedNum}`;
    }

    const period = prop.rental_period || (op === 'temporary_rent' ? 'nightly' : 'monthly');
    const periodLabel = period === 'nightly' ? '/ noche' : period === 'yearly' ? '/ año' : '/ mes';
    return `${curr} $${formattedNum} ${periodLabel}`;
  };

  const getOperationBadge = (opType?: string, price?: number) => {
    const effectiveOp = opType || (price && price < 5000 ? 'rent' : 'sale');
    if (effectiveOp === 'temporary_rent' || effectiveOp === 'temporal') {
      return (
        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-purple-950/80 text-purple-300 border border-purple-500/40 flex items-center gap-1 shadow-sm backdrop-blur-md">
          <Clock className="w-3 h-3 text-purple-400" /> Temporal
        </span>
      );
    }
    if (effectiveOp === 'rent' || effectiveOp === 'alquiler') {
      return (
        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-950/80 text-blue-300 border border-blue-500/40 flex items-center gap-1 shadow-sm backdrop-blur-md">
          <Home className="w-3 h-3 text-blue-400" /> Alquiler
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shadow-sm backdrop-blur-md">
        <Tag className="w-3 h-3 text-emerald-400" /> Venta
      </span>
    );
  };

  const formatCleanLocation = (loc?: Property['location']) => {
    if (!loc) return 'Ubicación no especificada';
    const parts = [loc.address, loc.zone].filter(Boolean);
    const uniqueParts = Array.from(new Set(parts));
    if (uniqueParts.length === 0) return loc.city || 'Buenos Aires';
    return `${uniqueParts.join(', ')}${loc.city ? ` (${loc.city})` : ''}`;
  };

  // Filter computation logic in real-time
  const filtered = properties.filter((p) => {
    // 1. Search text (Title, zone, city, address, code)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchText =
        p.title.toLowerCase().includes(term) ||
        (p.code || '').toLowerCase().includes(term) ||
        (p.location.zone || '').toLowerCase().includes(term) ||
        (p.location.city || '').toLowerCase().includes(term) ||
        (p.location.address || '').toLowerCase().includes(term);
      if (!matchText) return false;
    }

    // 2. Operation Type Filter
    if (operationFilter !== 'all') {
      const op = p.operation_type || (p.price < 5000 ? 'rent' : 'sale');
      if (op !== operationFilter) return false;
    }

    // 3. Property Type Filter
    if (typeFilter !== 'all') {
      if (p.type !== typeFilter) return false;
    }

    // 4. Currency Filter
    if (currencyFilter !== 'all') {
      if ((p.currency || 'USD') !== currencyFilter) return false;
    }

    // 5. Price range
    if (minPrice && p.price < Number(minPrice)) return false;
    if (maxPrice && p.price > Number(maxPrice)) return false;

    // 6. Bedrooms
    if (bedroomsFilter !== 'all') {
      const minBeds = Number(bedroomsFilter);
      if ((p.features?.bedrooms || 0) < minBeds) return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
        
        {/* Catalog Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/60 border border-emerald-500/30 p-8 sm:p-12 shadow-2xl">
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-extrabold uppercase tracking-wider border border-emerald-500/40">
              <Sparkles className="w-3.5 h-3.5" /> Catálogo Inmobiliario Oficial
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Propiedades Destacadas
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Explora nuestro catálogo en tiempo real con atención comercial y agendamiento de visitas 24/7 vía WhatsApp.
            </p>
          </div>
        </div>

        {/* Filter Toolbar Card */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-white/10 shadow-xl space-y-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por título, barrio, dirección o código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-950 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            {/* Quick Operation Selector */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setOperationFilter('all')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  operationFilter === 'all'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                Todas ({properties.length})
              </button>
              <button
                type="button"
                onClick={() => setOperationFilter('sale')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  operationFilter === 'sale'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                <Tag className="w-3.5 h-3.5" /> En Venta
              </button>
              <button
                type="button"
                onClick={() => setOperationFilter('rent')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  operationFilter === 'rent'
                    ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                    : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                <Home className="w-3.5 h-3.5" /> En Alquiler
              </button>
              <button
                type="button"
                onClick={() => setOperationFilter('temporary_rent')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  operationFilter === 'temporary_rent'
                    ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                    : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                <Clock className="w-3.5 h-3.5" /> Temporales
              </button>
            </div>
          </div>

          {/* Detailed Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-white/5">
            {/* Property Type Dropdown */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Tipo de Inmueble
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Todos los Tipos</option>
                <option value="apartment">🏢 Departamento</option>
                <option value="house">🏡 Casa / Chalet</option>
                <option value="ph">🏘️ PH</option>
                <option value="land">🏞️ Terreno / Lote</option>
                <option value="commercial">🏬 Local Comercial</option>
                <option value="office">🏢 Oficina</option>
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Rango de Precio
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Mínimo"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-1/2 px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="number"
                  placeholder="Máximo"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-1/2 px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Dormitorios */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Dormitorios
              </label>
              <select
                value={bedroomsFilter}
                onChange={(e) => setBedroomsFilter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Cualquier cantidad</option>
                <option value="1">1+ Dormitorios</option>
                <option value="2">2+ Dormitorios</option>
                <option value="3">3+ Dormitorios</option>
                <option value="4">4+ Dormitorios</option>
              </select>
            </div>

            {/* Currency selector */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Moneda
              </label>
              <div className="flex flex-row gap-1.5 rounded-xl bg-slate-950 p-1 border border-white/10">
                <button
                  type="button"
                  onClick={() => setCurrencyFilter('all')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currencyFilter === 'all'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Todas
                </button>
                <button
                  type="button"
                  onClick={() => setCurrencyFilter('USD')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currencyFilter === 'USD'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  USD
                </button>
                <button
                  type="button"
                  onClick={() => setCurrencyFilter('ARS')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currencyFilter === 'ARS'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ARS
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Info Bar */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <p>
            Mostrando <span className="font-bold text-white">{filtered.length}</span> propiedades disponibles
          </p>
          {(searchTerm || operationFilter !== 'all' || typeFilter !== 'all' || currencyFilter !== 'all' || minPrice || maxPrice || bedroomsFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setOperationFilter('all');
                setTypeFilter('all');
                setCurrencyFilter('all');
                setMinPrice('');
                setMaxPrice('');
                setBedroomsFilter('all');
              }}
              className="text-emerald-400 hover:underline font-semibold cursor-pointer"
            >
              Limpiar todos los filtros
            </button>
          )}
        </div>

        {/* Properties Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-96 rounded-3xl bg-slate-900/40 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900 border border-white/10 text-center space-y-4 max-w-lg mx-auto">
            <Building2 className="w-12 h-12 text-slate-500 mx-auto" />
            <h3 className="text-lg font-bold text-white">No se encontraron propiedades</h3>
            <p className="text-xs text-slate-400">
              No hay propiedades disponibles con los criterios seleccionados actualmente.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((prop) => {
              const waMessage = encodeURIComponent(
                `¡Hola! Quisiera consultar disponibilidad y coordinar una visita para la propiedad "${prop.title}" (Código: ${prop.code || prop.id}).`
              );
              const waUrl = `https://wa.me/5491140143729?text=${waMessage}`;

              return (
                <div
                  key={prop.id}
                  className="rounded-3xl bg-slate-900/90 backdrop-blur-xl border border-white/10 hover:border-emerald-500/40 transition-all overflow-hidden flex flex-col justify-between group shadow-xl hover:shadow-2xl hover:shadow-emerald-500/5"
                >
                  <div>
                    {/* Image & Badges */}
                    <div className="relative h-56 overflow-hidden bg-slate-950">
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

                      {/* Formatted Price Badge with Rental Period */}
                      <div className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30">
                        {formatPriceDisplay(prop)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-3">
                      <h3 className="text-base font-bold text-white line-clamp-1 group-hover:text-emerald-400 transition-colors">
                        {prop.title}
                      </h3>

                      <p className="text-xs text-slate-400 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{formatCleanLocation(prop.location)}</span>
                      </p>

                      {/* Features */}
                      <div className="grid grid-cols-3 gap-2 py-2.5 border-y border-white/5 text-slate-300 text-xs">
                        <div className="flex items-center gap-1.5 bg-slate-950/50 px-2 py-1 rounded-lg border border-white/5">
                          <Bed className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{prop.features?.bedrooms || 0} Hab</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-slate-950/50 px-2 py-1 rounded-lg border border-white/5">
                          <Bath className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{prop.features?.bathrooms || 0} Baños</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-slate-950/50 px-2 py-1 rounded-lg border border-white/5">
                          <Maximize className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{prop.features?.areaM2 || 0} m²</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {prop.description || 'Excelente propiedad en ubicación exclusiva con acabados de primera calidad.'}
                      </p>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-4 bg-black/40 border-t border-white/5 flex items-center justify-between gap-2">
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Consultar WhatsApp</span>
                    </a>

                    <button
                      onClick={() => { window.history.pushState(null, '', `/properties/${prop.id}`); onRouteChange('property-detail'); }}
                      className="py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1 transition-all cursor-pointer shadow-md shadow-emerald-500/20"
                    >
                      <span>Ver Ficha</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer onRouteChange={onRouteChange} />
    </div>
  );
};

export default PublicCatalogPage;

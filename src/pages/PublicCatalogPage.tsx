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
  ArrowRight
} from 'lucide-react';
import { INITIAL_PROPERTIES } from '../data/mockData';
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
  const [operationFilter, setOperationFilter] = useState<string>('all'); // all, sale, rent
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currencyFilter, setCurrencyFilter] = useState<'USD' | 'ARS'>('USD');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [bedroomsFilter, setBedroomsFilter] = useState<string>('all');

  useEffect(() => {
    async function loadCatalog() {
      setLoading(true);
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('properties')
            .select('*')
            .neq('is_public', false)
            .in('status', ['available', 'disponible'])
            .order('created_at', { ascending: false });

          if (!error && data && data.length > 0) {
            const mapped: Property[] = data.map((item: any) => ({
              id: item.id,
              title: item.title || 'Propiedad Inmobiliaria',
              code: item.code || `PROP-${String(item.id).slice(0, 4)}`,
              type: item.type || 'apartment',
              status: item.status || 'available',
              is_public: item.is_public ?? true,
              price: Number(item.price || 150000),
              currency: item.currency || 'USD',
              location: {
                address: item.address || 'Ubicación sin especificar',
                city: item.city || 'Buenos Aires',
                zone: item.zone || item.address || 'Palermo',
              },
              features: {
                bedrooms: item.bedrooms || 2,
                bathrooms: item.bathrooms || 2,
                areaM2: item.surface_m2 || item.area_m2 || 75,
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
          console.warn('Catalog fetch fallback:', e);
        }
      }

      setProperties(INITIAL_PROPERTIES);
      setLoading(false);
    }

    loadCatalog();
  }, []);

  // Filter computation logic
  const filtered = properties.filter((p) => {
    // 1. Search text (Title, zone, city, address, code)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchText =
        p.title.toLowerCase().includes(term) ||
        p.code.toLowerCase().includes(term) ||
        p.location.zone.toLowerCase().includes(term) ||
        p.location.city.toLowerCase().includes(term) ||
        p.location.address.toLowerCase().includes(term);
      if (!matchText) return false;
    }

    // 2. Operation Type
    if (operationFilter !== 'all') {
      if (operationFilter === 'rent' && p.price >= 5000) return false;
      if (operationFilter === 'sale' && p.price < 5000) return false;
    }

    // 3. Property Type
    if (typeFilter !== 'all') {
      if (p.type !== typeFilter) return false;
    }

    // 4. Price range
    if (minPrice && p.price < Number(minPrice)) return false;
    if (maxPrice && p.price > Number(maxPrice)) return false;

    // 5. Bedrooms
    if (bedroomsFilter !== 'all') {
      const minBeds = Number(bedroomsFilter);
      if (p.features.bedrooms < minBeds) return false;
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
              {t('catalog_title')}
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              {t('catalog_subtitle')}
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
                placeholder={t('search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-950 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            {/* Quick Operation Selector */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto scrollbar-none">
              {[
                { id: 'all', label: t('all_operations') },
                { id: 'sale', label: `🏷️ ${t('sale')}` },
                { id: 'rent', label: `🔑 ${t('rent')}` },
              ].map((op) => (
                <button
                  key={op.id}
                  onClick={() => setOperationFilter(op.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    operationFilter === op.id
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
                  }`}
                >
                  {op.label}
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-white/5">
            {/* Property Type Dropdown */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                {t('all_property_types')}
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="all">{t('all_property_types')}</option>
                <option value="apartment">🏢 {t('apartment')}</option>
                <option value="house">🏠 {t('house')}</option>
                <option value="land">🌲 {t('land')}</option>
                <option value="commercial">🏪 {t('commercial')}</option>
                <option value="office">💼 {t('office')}</option>
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                {t('min_price')} / {t('max_price')} ({currencyFilter})
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder={t('min_price')}
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-1/2 px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="number"
                  placeholder={t('max_price')}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-1/2 px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Dormitorios */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                {t('bedrooms')}
              </label>
              <select
                value={bedroomsFilter}
                onChange={(e) => setBedroomsFilter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="all">{t('any_bedrooms')}</option>
                <option value="1">1+ {t('bedrooms')}</option>
                <option value="2">2+ {t('bedrooms')}</option>
                <option value="3">3+ {t('bedrooms')}</option>
                <option value="4">4+ {t('bedrooms')}</option>
              </select>
            </div>

            {/* Currency selector */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                {t('currency')}
              </label>
              <div className="flex flex-row gap-2 rounded-xl bg-slate-950 p-1 border border-white/10">
                <button
                  type="button"
                  onClick={() => setCurrencyFilter('USD')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                    currencyFilter === 'USD'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  USD ($)
                </button>
                <button
                  type="button"
                  onClick={() => setCurrencyFilter('ARS')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                    currencyFilter === 'ARS'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  ARS ($)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Info Bar */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <p>
            <span className="font-bold text-white">{filtered.length}</span> {t('all_property_types')}
          </p>
          {(searchTerm || operationFilter !== 'all' || typeFilter !== 'all' || minPrice || maxPrice || bedroomsFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setOperationFilter('all');
                setTypeFilter('all');
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
            <h3 className="text-lg font-bold text-white">{t('no_properties_found')}</h3>
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
                  className="rounded-3xl bg-slate-900/80 border border-white/10 hover:border-emerald-500/40 transition-all overflow-hidden flex flex-col justify-between group shadow-xl"
                >
                  <div>
                    {/* Image Header */}
                    <div className="relative h-52 overflow-hidden">
                      <img
                        src={prop.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'}
                        alt={prop.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className="px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-[10px] font-mono font-bold text-emerald-400 border border-emerald-500/30">
                          {prop.code}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                          {prop.type.toUpperCase()}
                        </span>
                      </div>
                      <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-slate-950/90 backdrop-blur-md text-emerald-400 font-black text-sm font-mono border border-emerald-500/30">
                        {prop.currency || 'USD'} ${prop.price.toLocaleString('en-US')}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 space-y-3">
                      <h3 className="font-extrabold text-white text-base line-clamp-1 group-hover:text-emerald-400 transition-colors">
                        {prop.title}
                      </h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="line-clamp-1">{prop.location.address}, {prop.location.zone} ({prop.location.city})</span>
                      </p>

                      {/* Features */}
                      <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/5 text-xs text-slate-300">
                        <div className="flex items-center gap-1">
                          <Bed className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{prop.features.bedrooms} {t('bedrooms')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Bath className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{prop.features.bathrooms}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Maximize className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{prop.features.areaM2} m²</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-5 pt-0 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        window.history.pushState({}, '', `/properties/${prop.id}`);
                        onRouteChange('property-detail');
                      }}
                      className="py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs border border-white/10 transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span>{t('view_details')} ➔</span>
                    </button>
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5 fill-current" />
                      <span>{t('contact_whatsapp')}</span>
                    </a>
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

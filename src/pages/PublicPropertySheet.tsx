import React, { useState, useEffect } from 'react';
import { AppRoute, Property } from '../types';
import {
  MapPin,
  Bed,
  Bath,
  Maximize,
  Sparkles,
  ArrowLeft,
  Share2,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  X,
  DollarSign,
  Percent,
  Navigation,
  Layers,
  Phone,
  ShieldCheck
} from 'lucide-react';
import { INITIAL_PROPERTIES } from '../data/mockData';
import { supabase } from '../lib/supabaseClient';
import { SEO } from '../components/common/SEO';

interface PublicPropertySheetProps {
  onRouteChange?: (route: AppRoute) => void;
}

export const PublicPropertySheet: React.FC<PublicPropertySheetProps> = ({ onRouteChange }) => {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = (imgCount: number) => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      setActiveImgIndex((prev) => (prev < imgCount - 1 ? prev + 1 : 0));
    } else if (isRightSwipe) {
      setActiveImgIndex((prev) => (prev > 0 ? prev - 1 : imgCount - 1));
    }
  };

  useEffect(() => {
    async function fetchProperty() {
      setLoading(true);
      const path = window.location.pathname;
      let propId = '';
      if (path.includes('/p/')) {
        propId = path.split('/p/')[1]?.split('/')[0] || '';
      } else if (path.includes('/properties/')) {
        propId = path.split('/properties/')[1]?.split('/')[0] || '';
      }

      // 1. Search in mock properties
      const mockFound = INITIAL_PROPERTIES.find(
        (p) => p.id === propId || p.code.toLowerCase() === propId?.toLowerCase()
      );

      if (mockFound) {
        setProperty(mockFound);
        setLoading(false);
        return;
      }

      // 2. Query Supabase
      if (supabase && propId) {
        try {
          const { data, error } = await supabase
            .from('properties')
            .select('*')
            .or(`id.eq.${propId},code.eq.${propId}`)
            .maybeSingle();

          if (!error && data) {
            setProperty({
              id: data.id,
              title: data.title,
              code: data.code || data.id.slice(0, 8),
              type: data.type || 'apartment',
              operation_type: data.operation_type || data.operation || 'sale',
              rental_period: data.rental_period,
              status: data.status || 'available',
              price: Number(data.price) || 0,
              price_max: data.price_max ? Number(data.price_max) : null,
              currency: data.currency || 'USD',
              google_maps_url: data.google_maps_url,
              financing_scheme: data.financing_scheme,
              accepts_trade_in: data.accepts_trade_in,
              trade_in_details: data.trade_in_details,
              key_distances: data.key_distances,
              estimated_roi: data.estimated_roi,
              masterplan_url: data.masterplan_url,
              // Confidencial: Datos privados de negocio jamas se asignan aqui
              location: {
                address: data.address || '',
                zone: data.zone || '',
                city: data.city || '',
                googleMapsUrl: data.google_maps_url,
              },
              features: {
                bedrooms: data.bedrooms ?? data.features?.bedrooms ?? 2,
                bathrooms: data.bathrooms ?? data.features?.bathrooms ?? 1,
                areaM2: data.surface_m2 ?? data.area_m2 ?? data.features?.areaM2 ?? 60,
                parking: data.parking ?? data.features?.parking ?? 0,
                pool: data.pool ?? data.features?.pool ?? false,
                garage: data.garage ?? data.features?.garage ?? false,
                elevator: data.elevator ?? data.features?.elevator ?? false,
                airConditioning: data.airConditioning ?? data.features?.airConditioning ?? false,
              },
              description: data.description || '',
              images: Array.isArray(data.images) && data.images.length > 0
                ? data.images
                : data.image_url
                ? [data.image_url]
                : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'],
              documents: [],
              featured: data.featured || false,
              createdAt: data.created_at || new Date().toISOString(),
              contact_phone: data.contact_phone || data.agent_phone || '5491155550000',
            });
          } else {
            setProperty(INITIAL_PROPERTIES[0]);
          }
        } catch (_) {
          setProperty(INITIAL_PROPERTIES[0]);
        }
      } else {
        setProperty(INITIAL_PROPERTIES[0]);
      }
      setLoading(false);
    }

    fetchProperty();
  }, []);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: property?.title || 'Ficha de Propiedad',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-400 text-xs font-semibold">Cargando ficha interactiva...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 space-y-4">
        <h2 className="text-lg font-black text-white">Propiedad no encontrada</h2>
        <p className="text-xs text-slate-400">El inmueble solicitado no está disponible o ha sido retirado.</p>
        {onRouteChange && (
          <button
            onClick={() => onRouteChange('catalog')}
            className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs"
          >
            Explorar Catálogo
          </button>
        )}
      </div>
    );
  }

  const isSale = property.operation_type === 'sale' || property.price > 5000;
  const isTemp = property.operation_type === 'temporary_rent' || property.rental_period === 'nightly';
  const periodLabel = !isSale ? (isTemp ? ' / noche' : property.rental_period === 'yearly' ? ' / año' : ' / mes') : '';
  const priceFormatted = `$${Number(property.price).toLocaleString('en-US')} ${property.currency || 'USD'}${periodLabel}`;
  const priceMaxFormatted = property.price_max ? ` - $${Number(property.price_max).toLocaleString('en-US')} ${property.currency || 'USD'}` : '';

  const cleanPhone = (property.contact_phone || '5491155550000').replace(/\D/g, '');
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`¡Hola! Vengo de la ficha de ${property.title} y me gustaría recibir más información.`)}`;

  const images = property.images && property.images.length > 0
    ? property.images
    : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'];

  return (
    <div className="min-h-screen bg-[#070d12] text-slate-100 antialiased font-sans pb-24">
      <SEO
        title={`${property.title} | Ficha Interactiva`}
        description={`${property.title} en ${property.location.zone}, ${property.location.city}. ${property.features.bedrooms} hab, ${property.features.areaM2} m². Precio: ${priceFormatted}.`}
        image={images[0]}
      />

      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-[#070d12]/90 backdrop-blur-md border-b border-white/10 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onRouteChange && (
            <button
              onClick={() => onRouteChange('catalog')}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-all cursor-pointer"
              title="Volver al catálogo"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h1 className="font-extrabold text-sm text-white truncate max-w-[200px] sm:max-w-md">
              {property.title}
            </h1>
            <p className="text-[11px] text-emerald-400 font-mono">
              Cód. {property.code}
            </p>
          </div>
        </div>

        <button
          onClick={handleShare}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer border border-white/5"
        >
          <Share2 className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline">{copied ? '¡Copiado!' : 'Compartir'}</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 pt-4 space-y-6">

        {/* 1. Fast Mobile Gallery */}
        <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-white/10 shadow-2xl group">
          <div
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={() => onTouchEnd(images.length)}
            className="aspect-[16/10] sm:aspect-[21/9] w-full relative overflow-hidden bg-slate-950 select-none"
          >
            <img
              src={images[activeImgIndex]}
              alt={property.title}
              onClick={() => setIsLightboxOpen(true)}
              className="w-full h-full object-cover cursor-pointer transition-transform duration-500 hover:scale-105"
              loading="eager"
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

            {/* Badge Status */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/90 text-slate-950 uppercase tracking-wider backdrop-blur-md shadow-lg">
                {isSale ? 'En Venta' : 'En Alquiler'}
              </span>
              {property.featured && (
                <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400/90 text-slate-950 uppercase tracking-wider backdrop-blur-md shadow-lg flex items-center gap-1">
                  <Sparkles className="w-3 h-3 fill-current" /> Destacado
                </span>
              )}
            </div>

            {/* Price Floating Overlay */}
            <div className="absolute bottom-4 left-4 right-4 z-10 flex items-end justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">Valor de Publicación</span>
                <p className="text-2xl sm:text-3xl font-black text-white font-mono drop-shadow-md">
                  {priceFormatted}{priceMaxFormatted}
                </p>
              </div>
              <span className="text-xs text-slate-300 font-bold bg-black/60 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-md">
                {activeImgIndex + 1} / {images.length}
              </span>
            </div>

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveImgIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all backdrop-blur-md border border-white/10"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImgIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all backdrop-blur-md border border-white/10"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails strip */}
          {images.length > 1 && (
            <div className="p-3 bg-slate-950/80 border-t border-white/10 flex items-center gap-2 overflow-x-auto scrollbar-thin">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImgIndex(idx)}
                  className={`w-16 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    activeImgIndex === idx ? 'border-emerald-400 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2. Key Specs Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <Maximize className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Superficie</span>
              <p className="text-sm font-black text-white font-mono">{property.features.areaM2} m²</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
              <Bed className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Dormitorios</span>
              <p className="text-sm font-black text-white font-mono">{property.features.bedrooms} Hab.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
              <Bath className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Baños</span>
              <p className="text-sm font-black text-white font-mono">{property.features.bathrooms} Baños</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Ubicación</span>
              <p className="text-sm font-black text-white truncate">{property.location.zone || property.location.city || 'Zona'}</p>
            </div>
          </div>
        </div>

        {/* 3. Commercial Conditions & Financing Banner */}
        {(property.financing_scheme || property.accepts_trade_in || property.estimated_roi) && (
          <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/30 space-y-4 shadow-xl">
            <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Facilidades Comerciales y Financiación
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {property.financing_scheme && (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-white/5 space-y-1">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase">Esquema de Cuotas</span>
                  <p className="font-semibold text-slate-200">{property.financing_scheme}</p>
                </div>
              )}

              {property.accepts_trade_in && (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-white/5 space-y-1">
                  <span className="text-[10px] text-purple-400 font-bold uppercase">Permuta / Canje Aceptado</span>
                  <p className="font-semibold text-slate-200">{property.trade_in_details || 'Acepta propiedad o vehículo en parte de pago'}</p>
                </div>
              )}

              {property.estimated_roi && (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-white/5 space-y-1 sm:col-span-2">
                  <span className="text-[10px] text-amber-400 font-bold uppercase">Rentabilidad Estimada (Inversores)</span>
                  <p className="font-semibold text-slate-200">{property.estimated_roi}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. Distances & Google Maps */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-white/10 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
              <Navigation className="w-4 h-4 text-emerald-400" />
              Ubicación y Accesibilidad
            </h3>

            {(property.google_maps_url || property.location.googleMapsUrl) && (
              <a
                href={property.google_maps_url || property.location.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30 flex items-center gap-1.5 transition-all"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Abrir en Google Maps / Waze</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {property.location.address ? `${property.location.address}, ` : ''}{property.location.zone}, {property.location.city}.
          </p>

          {property.key_distances && (
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-white/5 text-xs text-slate-300">
              <strong className="text-emerald-400">Conectividad:</strong> {property.key_distances}
            </div>
          )}
        </div>

        {/* 5. Masterplan Viewer (if present) */}
        {property.masterplan_url && (
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-white/10 space-y-3">
            <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Masterplan / Plano de Loteo
            </h3>
            <a
              href={property.masterplan_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-2xl overflow-hidden border border-white/10 hover:border-emerald-500/40 transition-all group"
            >
              <img
                src={property.masterplan_url}
                alt="Masterplan"
                className="w-full h-auto max-h-96 object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </a>
          </div>
        )}

        {/* 6. Description */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-white/10 space-y-3">
          <h3 className="font-extrabold text-white text-sm">Descripción del Inmueble</h3>
          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line font-normal">
            {property.description || 'Sin descripción detallada.'}
          </p>
        </div>

      </main>

      {/* Floating Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#070d12]/95 backdrop-blur-lg border-t border-white/10 p-3.5 px-4">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Consulta Inmediata</p>
            <p className="text-xs font-black text-white truncate">{property.title}</p>
          </div>

          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all flex items-center gap-2 shadow-xl shadow-emerald-500/20 shrink-0 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 fill-slate-950" />
            <span>Consultar por WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Fullscreen Lightbox */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={images[activeImgIndex]}
            alt=""
            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};

export default PublicPropertySheet;

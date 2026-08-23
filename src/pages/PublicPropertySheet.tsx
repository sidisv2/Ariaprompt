import React, { useEffect, useState } from 'react';
import {
  MapPin,
  Bed,
  Bath,
  Maximize,
  Share2,
  Calendar,
  Phone,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Shield,
  FileText,
  DollarSign,
  TrendingUp,
  Layers,
  ArrowRight,
  Check,
  Building2,
  X,
  Compass
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { Property } from '../types';

interface PublicPropertySheetProps {
  onRouteChange?: (route: any) => void;
}

export const PublicPropertySheet: React.FC<PublicPropertySheetProps> = ({ onRouteChange }) => {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeImgIndex, setActiveImgIndex] = useState<number>(0);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all');

  // Touch/Swipe state for mobile gallery
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

  const onTouchEnd = () => {
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
      setNotFound(false);
      const path = window.location.pathname;
      let propId = '';
      if (path.includes('/p/')) {
        propId = path.split('/p/')[1]?.split('/')[0] || '';
      } else if (path.includes('/properties/')) {
        propId = path.split('/properties/')[1]?.split('/')[0] || '';
      }

      if (!propId) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Query Supabase directly by id or slug or code without mock fallback
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('properties')
            .select('*')
            .or(`id.eq.${propId},code.eq.${propId},slug.eq.${propId}`)
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
              property_images: Array.isArray(data.property_images) ? data.property_images : undefined,
              documents: [],
              featured: data.featured || false,
              createdAt: data.created_at || new Date().toISOString(),
              contact_phone: data.contact_phone || data.agent_phone || '5491155550000',
            });
          } else {
            setNotFound(true);
          }
        } catch (_) {
          setNotFound(true);
        }
      } else {
        setNotFound(true);
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

  const imagesList = (property?.images && property.images.length > 0)
    ? property.images
    : (property as any)?.image_url
    ? [(property as any).image_url]
    : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'];

  const imgCount = imagesList.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase animate-pulse">
          Cargando ficha oficial de la propiedad...
        </p>
      </div>
    );
  }

  if (notFound || !property) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold mb-2">Propiedad no encontrada</h1>
        <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
          La propiedad solicitada no está disponible o el enlace ha expirado.
        </p>
        <a
          href="/catalogo"
          className="px-5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all"
        >
          Explorar Catálogo Disponible
        </a>
      </div>
    );
  }

  const isRental = property.operation_type === 'rent';
  const rentalPeriodLabel = (property.rental_period as any) === 'daily'
    ? 'por día'
    : (property.rental_period as any) === 'weekly'
    ? 'por semana'
    : (property.rental_period as any) === 'temporary'
    ? 'por mes (temporal)'
    : 'por mes';

  const fullLocation = [
    property.location.address,
    property.location.zone,
    property.location.city,
  ].filter(Boolean).join(', ') || 'Ubicación privilegiada';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-slate-950 pb-20">
      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-2xl animate-fadeIn">
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>

          <div 
            className="relative max-w-5xl max-h-[80vh] w-full flex items-center justify-center touch-pan-y"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <img
              src={imagesList[activeImgIndex]}
              alt={`Foto ${activeImgIndex + 1}`}
              className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl"
            />

            {imgCount > 1 && (
              <>
                <button
                  onClick={() => setActiveImgIndex((prev) => (prev > 0 ? prev - 1 : imgCount - 1))}
                  className="absolute left-2 p-3 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white transition-all cursor-pointer border border-white/10"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => setActiveImgIndex((prev) => (prev < imgCount - 1 ? prev + 1 : 0))}
                  className="absolute right-2 p-3 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white transition-all cursor-pointer border border-white/10"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          <p className="text-xs text-slate-400 mt-4 font-mono">
            {activeImgIndex + 1} de {imgCount} fotos
          </p>
        </div>
      )}

      {/* Top Floating Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-white/10 px-4 py-3 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Building2 className="w-4 h-4" />
            </div>
            <span className="text-xs font-black tracking-wider uppercase text-white">
              Aria Prop <span className="text-emerald-400">· Ficha Oficial</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? '¡Copiado!' : 'Compartir'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {/* Gallery / Hero Carousel */}
        <div 
          className="relative rounded-3xl overflow-hidden bg-slate-900 border border-white/10 shadow-2xl aspect-[16/10] sm:aspect-[16/9] group touch-pan-y"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <img
            src={imagesList[activeImgIndex]}
            alt={property.title}
            onClick={() => setLightboxOpen(true)}
            className="w-full h-full object-cover cursor-pointer group-hover:scale-102 transition-transform duration-500"
          />

          {/* Operation & Status Badges */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2 pointer-events-none">
            <span className={`px-3 py-1 rounded-full text-[11px] font-black tracking-wider uppercase shadow-lg backdrop-blur-md ${
              isRental ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500 text-slate-950'
            }`}>
              {isRental ? `Alquiler ${rentalPeriodLabel}` : 'En Venta'}
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-950/80 border border-white/20 text-slate-200 text-[11px] font-bold uppercase backdrop-blur-md">
              {property.type}
            </span>
          </div>

          {/* Photo Counter Pill & Lightbox trigger */}
          <button
            onClick={() => setLightboxOpen(true)}
            className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full bg-slate-950/80 hover:bg-slate-900 border border-white/20 text-white text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 transition-all cursor-pointer shadow-lg"
          >
            <Maximize className="w-3.5 h-3.5" />
            <span>{activeImgIndex + 1} / {imgCount}</span>
          </button>

          {/* Navigation Arrows (Desktop) */}
          {imgCount > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImgIndex((prev) => (prev > 0 ? prev - 1 : imgCount - 1));
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer hidden sm:flex"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImgIndex((prev) => (prev < imgCount - 1 ? prev + 1 : 0));
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer hidden sm:flex"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnail Selector */}
        {imgCount > 1 && (
          <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
            {imagesList.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImgIndex(idx)}
                className={`relative w-20 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                  activeImgIndex === idx ? 'border-emerald-500 scale-105 shadow-md shadow-emerald-500/20' : 'border-white/10 opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img} alt={`Miniatura ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Property Header & Pricing Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-white/10 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                {property.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{fullLocation}</span>
              </p>
            </div>

            <div className="text-left sm:text-right shrink-0 bg-white/5 sm:bg-transparent p-4 sm:p-0 rounded-2xl border border-white/5 sm:border-0">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                {isRental ? 'Valor de Alquiler' : 'Precio de Venta'}
              </span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400">
                {property.currency} ${property.price.toLocaleString('es-AR')}
                {isRental && (
                  <span className="text-xs text-slate-400 font-normal ml-1">/{rentalPeriodLabel}</span>
                )}
              </div>
              {property.price_max && (
                <p className="text-xs text-slate-400 font-medium">
                  Hasta USD ${property.price_max.toLocaleString('es-AR')}
                </p>
              )}
            </div>
          </div>

          {/* Key Features Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-3 gap-3 pt-4 border-t border-white/10 text-center">
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1">
              <Bed className="w-5 h-5 text-emerald-400 mx-auto" />
              <span className="text-xs font-bold text-white block">{property.features.bedrooms} Amb / Dorm</span>
              <span className="text-[10px] text-slate-400">Dormitorios</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1">
              <Bath className="w-5 h-5 text-emerald-400 mx-auto" />
              <span className="text-xs font-bold text-white block">{property.features.bathrooms} Baño{property.features.bathrooms > 1 ? 's' : ''}</span>
              <span className="text-[10px] text-slate-400">Sanitarios</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1">
              <Maximize className="w-5 h-5 text-emerald-400 mx-auto" />
              <span className="text-xs font-bold text-white block">{property.features.areaM2} m²</span>
              <span className="text-[10px] text-slate-400">Superficie Total</span>
            </div>
          </div>
        </div>

        {/* Commercial & Strategic Details */}
        {(property.financing_scheme || property.accepts_trade_in || property.google_maps_url || property.estimated_roi) && (
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-white/10 shadow-xl space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Condiciones Comerciales y Estratégicas
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {property.financing_scheme && (
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Esquema de Financiación</span>
                  <p className="text-slate-200 font-medium">{property.financing_scheme}</p>
                </div>
              )}

              {property.accepts_trade_in && (
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Acepta Permuta / Parte de Pago</span>
                  <p className="text-slate-200 font-medium">{property.trade_in_details || 'Consulta condiciones de permuta con nuestro equipo comercial.'}</p>
                </div>
              )}

              {property.estimated_roi && (
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Retorno Estimado (ROI)</span>
                  <p className="text-emerald-400 font-bold">{property.estimated_roi}</p>
                </div>
              )}

              {property.google_maps_url && (
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Ubicación en Mapa</span>
                  <a
                    href={property.google_maps_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                  >
                    <span>Ver en Google Maps / Waze</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Description Section */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-white/10 shadow-xl space-y-3">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-300">
            Descripción de la Propiedad
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
            {property.description || 'Excelente oportunidad inmobiliaria con terminaciones de calidad y ubicación estratégica.'}
          </p>
        </div>

        {/* Contact CTA */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-500/20 via-teal-500/10 to-slate-900 border border-emerald-500/30 text-center space-y-3 shadow-2xl">
          <h3 className="text-base font-black text-white">¿Te interesa coordinar una visita presencial?</h3>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            Comunicate directamente con nuestro asesor por WhatsApp para consultar disponibilidad de horarios.
          </p>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Hola, estuve viendo la ficha de "${property.title}" (${window.location.href}) y quisiera más información para coordinar una visita.`)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all cursor-pointer"
          >
            <Phone className="w-4 h-4 fill-slate-950" />
            <span>Consultar por WhatsApp</span>
          </a>
        </div>
      </main>
    </div>
  );
};

export default PublicPropertySheet;

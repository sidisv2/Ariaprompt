import React, { useState, useEffect } from 'react';
import { AppRoute, Property } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { Header } from '../components/common/Header';
import { Footer } from '../components/marketing/Footer';
import {
  Building2,
  MapPin,
  Bed,
  Bath,
  Maximize,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowLeft,
  Share2,
  ShieldCheck,
  Bot,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { ChatSlideOver } from '../components/chat/ChatSlideOver';
import { INITIAL_PROPERTIES } from '../data/mockData';
import { supabase } from '../lib/supabaseClient';

interface PropertyDetailPageProps {
  onRouteChange: (route: AppRoute) => void;
  onOpenPrompt?: (prompt: string) => void;
}

export const PropertyDetailPage: React.FC<PropertyDetailPageProps> = ({
  onRouteChange,
  onOpenPrompt,
}) => {
  const { t } = useLanguage();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState(false);
  const [isAriaChatOpen, setIsAriaChatOpen] = useState(false);
  const [ariaPrefilledPrompt, setAriaPrefilledPrompt] = useState('');

  useEffect(() => {
    async function fetchProperty() {
      setLoading(true);
      const path = window.location.pathname;
      const parts = path.split('/properties/');
      const propId = parts.length > 1 ? parts[1].split('/')[0] : null;

      // 1. Search in mock initial properties
      const mockFound = INITIAL_PROPERTIES.find(
        (p) => p.id === propId || p.code.toLowerCase() === propId?.toLowerCase()
      );

      if (mockFound) {
        setProperty(mockFound);
        setLoading(false);
        return;
      }

      // 2. Search in Supabase DB if ID/Code provided
      if (propId && supabase) {
        try {
          let dbProp = null;
          const { data: byId } = await supabase
            .from('properties')
            .select('*')
            .eq('id', propId)
            .maybeSingle();

          if (byId) {
            dbProp = byId;
          } else {
            const { data: byCode } = await supabase
              .from('properties')
              .select('*')
              .ilike('code', propId)
              .maybeSingle();
            if (byCode) dbProp = byCode;
          }

          if (dbProp) {
            const propImages =
              Array.isArray(dbProp.images) && dbProp.images.length > 0
                ? dbProp.images
                : [
                    dbProp.image_url ||
                      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
                  ];

            setProperty({
              id: dbProp.id,
              title: dbProp.title || 'Propiedad Inmobiliaria',
              code: dbProp.code || `PROP-${dbProp.id.slice(0, 4)}`,
              price: dbProp.price || 150000,
              currency: dbProp.currency || 'USD',
              type: dbProp.type || 'departamento',
              status: dbProp.status || 'available',
              featured: dbProp.featured || false,
              location: {
                city: dbProp.city || 'Buenos Aires',
                zone: dbProp.zone || 'Palermo',
                address: dbProp.address || 'Av. Santa Fe 2450',
              },
              features: {
                bedrooms: dbProp.bedrooms || 2,
                bathrooms: dbProp.bathrooms || 2,
                areaM2: dbProp.area_m2 || 75,
                pool: dbProp.pool || false,
                garage: dbProp.garage || false,
                elevator: dbProp.elevator || false,
                airConditioning: dbProp.air_conditioning || true,
              },
              images: propImages,
              description:
                dbProp.description ||
                'Excelente propiedad en zona estratégica con terminaciones de primera calidad.',
              createdAt: new Date().toISOString(),
              documents: [],
            });
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn('⚠️ Property fetch from DB failed:', e);
        }
      }

      // Fallback default property
      setProperty(INITIAL_PROPERTIES[0]);
      setLoading(false);
    }

    fetchProperty();
  }, []);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between">
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
          <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-mono">Cargando dossier de la propiedad...</p>
        </div>
        <Footer onRouteChange={onRouteChange} />
      </div>
    );
  }

  const propData = property || INITIAL_PROPERTIES[0];

  // 1. WhatsApp phone calculation with fallback 5491140143729
  const phone = (propData as any)?.contact_phone || (propData as any)?.agent_phone || (propData as any)?.phone || '5491140143729';
  const cleanPhone = String(phone).replace(/\D/g, '') || '5491140143729';
  const waMsg = encodeURIComponent(
    `¡Hola! Estoy interesado/a en coordinar una visita para la propiedad "${propData.title}" (Ref: ${propData.code || propData.id}). ¿Cuándo tendrían disponibilidad?`
  );
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${waMsg}`;

  // 2. Aria Chat prompt generator handler
  const handleTalkToAria = () => {
    const promptText = `¡Hola Aria! Quisiera hacerte consultas sobre la propiedad "${propData.title}" (Código: ${propData.code || propData.id}). Ubicación: ${propData.location.address}, ${propData.location.zone}, ${propData.location.city}. Precio: ${propData.currency} $${propData.price.toLocaleString()}. Características: ${propData.features.bedrooms} hab, ${propData.features.bathrooms} baños, ${propData.features.areaM2} m². ¿Me podrías dar más detalles y responder mis dudas?`;
    
    if (onOpenPrompt) {
      onOpenPrompt(promptText);
    }
    setAriaPrefilledPrompt(promptText);
    setIsAriaChatOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
        {/* Navigation Toolbar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <button
            onClick={() => onRouteChange('marketing')}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs border border-white/10 transition-all flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>Volver al Inicio</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{copied ? '¡Enlace copiado!' : 'Compartir Dossier'}</span>
            </button>
            <button
              onClick={() => onRouteChange('app')}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Bot className="w-4 h-4 fill-slate-950 text-slate-950" />
              <span>Consultar Asistente IA ➔</span>
            </button>
          </div>
        </div>

        {/* Hero Gallery Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Image & Overview (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl group">
              <img
                src={propData.images?.[0] || (propData as any).image_url || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'}
                alt={propData.title}
                className="w-full h-[450px] object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg">
                  {propData.type.toUpperCase()}
                </span>
                <span className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-emerald-300 border border-emerald-500/30 font-extrabold text-xs">
                  CÓDIGO: {propData.code}
                </span>
              </div>
            </div>

            {/* Property Header Info */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                    {propData.title}
                  </h1>
                  <p className="text-slate-400 text-sm flex items-center gap-2 mt-1.5">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <span>{propData.location.address}, {propData.location.zone}, {propData.location.city}</span>
                  </p>
                </div>

                <div className="text-left sm:text-right bg-slate-900/80 p-4 rounded-2xl border border-emerald-500/30 shrink-0">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Precio de Lista</p>
                  <p className="text-3xl font-black text-emerald-400 font-mono">
                    {propData.currency || 'USD'} ${propData.price.toLocaleString('en-US')}
                  </p>
                </div>
              </div>

              {/* Key Features Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-white/10 flex items-center gap-3">
                  <Bed className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">Dormitorios</p>
                    <p className="font-extrabold text-white text-sm">{propData.features.bedrooms} Habitaciones</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900 border border-white/10 flex items-center gap-3">
                  <Bath className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">Baños</p>
                    <p className="font-extrabold text-white text-sm">{propData.features.bathrooms} Baños</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900 border border-white/10 flex items-center gap-3">
                  <Maximize className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">Superficie Total</p>
                    <p className="font-extrabold text-white text-sm">{propData.features.areaM2} m²</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900 border border-white/10 flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">Amenidades</p>
                    <p className="font-extrabold text-white text-sm">
                      {propData.features.pool ? 'Piscina • ' : ''}{propData.features.garage ? 'Cochera' : 'Estándar'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description & Technical Data */}
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  Descripción & Memoria de Calidades
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                  {propData.description}
                </p>
              </div>
            </div>
          </div>

          {/* Action Sidebar (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Direct AI Assistant Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 space-y-5 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-sm">Asistente IA Ariaprop</h3>
                  <p className="text-[11px] text-emerald-400 font-medium">🟢 En línea 24/7 para responder dudas</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                ¿Quieres saber las condiciones de alquiler, agendar una visita o consultar por permutas? Nuestro asistente responde de inmediato.
              </p>

              <button
                onClick={handleTalkToAria}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-105"
              >
                <Sparkles className="w-4 h-4 fill-slate-950 text-slate-950" />
                <span>{t('talk_to_aria_property')} ➔</span>
              </button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-black text-xs shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-105"
              >
                <MessageSquare className="w-4 h-4 fill-current" />
                <span>{t('book_visit_whatsapp')}</span>
              </a>
            </div>

            {/* Guarantee Box */}
            <div className="p-5 rounded-3xl bg-slate-900/60 border border-white/10 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Operación Directa con la Inmobiliaria</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Sin intermediarios anónimos. Todas las consultas son recibidas por asesores matriculados.
              </p>
            </div>

          </div>

        </div>
      </main>

      <Footer onRouteChange={onRouteChange} />

      {/* Slide-over Aria Assistant Drawer */}
      <ChatSlideOver
        isOpen={isAriaChatOpen}
        onClose={() => setIsAriaChatOpen(false)}
        prefilledPrompt={ariaPrefilledPrompt}
      />
    </div>
  );
};

export default PropertyDetailPage;

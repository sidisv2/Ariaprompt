import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Copy,
  Check,
  RotateCw,
  Instagram,
  Target,
  Globe,
  Video,
  Flame,
  Zap,
  TrendingUp,
  Share2,
} from 'lucide-react';
export interface CrmProperty {
  id: string;
  title: string;
  code?: string;
  price?: number;
  currency?: string;
  type?: string;
  operation?: string;
  bedrooms?: number;
  area_m2?: number;
  zone?: string;
  address?: string;
  description?: string;
}

interface PropertyAdStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: CrmProperty | null;
}

type CopyAngle = 'inversor' | 'familiar' | 'oportunidad';

export const PropertyAdStudioModal: React.FC<PropertyAdStudioModalProps> = ({
  isOpen,
  onClose,
  property,
}) => {
  if (!isOpen || !property) return null;

  const [activeTab, setActiveTab] = useState<'instagram' | 'meta_ads' | 'portales' | 'reel_script'>('instagram');
  const [angle, setAngle] = useState<CopyAngle>('inversor');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const title = property.title || 'Propiedad Exclusiva';
  const price = property.price ? `$${property.price.toLocaleString()} ${property.currency || 'USD'}` : 'Consultar Precio';
  const zone = property.zone || 'Excelente Ubicación';
  const bedrooms = property.bedrooms || 2;
  const area = property.area_m2 || 65;
  const operation = (property.operation || 'Venta').toUpperCase();

  // Content Generators based on Angle
  const getInstagramCopy = () => {
    if (angle === 'inversor') {
      return `🏢 ¡OPORTUNIDAD DE INVERSIÓN ALTA RENTABILIDAD EN ${zone.toUpperCase()}! 💰

Buscás hacer rendir tu capital con una propiedad estratégica? Presentamos este increíble ${property.type || 'Departamento'} de ${bedrooms} ambientes (${area}m²) ideal para renta tradicional o temporal.

✨ CARACTERÍSTICAS DESTACADAS:
📍 Ubicación prime en ${zone}
🛋️ Distribución súper funcional con gran entrada de luz natural
💵 Valor de oportunidad: ${price}
📈 Proyección de retorno estimado excelente

📲 Escribinos al WhatsApp o por mensaje privado y coordinamos una visita hoy mismo!

#Inmobiliaria #RealEstate #InversionInmobiliaria #${zone.replace(/\s+/g, '')} #Propiedades #${operation}`;
    }

    if (angle === 'familiar') {
      return `🏠 ¡EL HOGAR QUE TU FAMILIA ESTABA BUSCANDO EN ${zone.toUpperCase()}! ❤️

Encontrá la tranquilidad y comodidad que merecen en este hermoso ${property.type || 'Departamento'} de ${bedrooms} dormitorios y ${area}m² totales.

✨ LO QUE TE VA A ENAMORAR:
🌿 Espacios amplios y luminosos
📍 Barrio residencial consolidado cerca de colegios y conectividad
🚗 Comodidad y seguridad para el día a día
💰 Precio: ${price}

📩 Dejanos un comentario o enviá un MD para agendar tu visita presencial!

#HogarNuevo #Familia #BienesRaices #${zone.replace(/\s+/g, '')} #PropiedadesEnVenta`;
    }

    return `🔥 ¡ATENCIÓN! OPORTUNIDAD ÚNICA EN ${zone.toUpperCase()} - ${price} 🚀

Recién ingresado al mercado: ${title}. Un ${property.type || 'Inmueble'} de ${bedrooms} hab. y ${area}m² impecable listo para habitar.

⚡ ¡No dejes que se te adelante otro interesado! 
👉 Tocá el enlace de la bio o envianos un WhatsApp directo para reservar la visita.

#Oportunidad #RealEstate #Propiedades #${zone.replace(/\s+/g, '')} #InmobiliariaProp`;
  };

  const getMetaAdsCopy = () => {
    const primaryText =
      angle === 'inversor'
        ? `🚨 ATENCIÓN INVERSORES: Propiedad con alta tasa de retorno en ${zone}. ${bedrooms} amb (${area}m²) por ${price}. Excelente liquidez y demanda de alquiler asegurada. Hacé clic para recibir la ficha técnica completa por WhatsApp.`
        : `🏡 ¿Buscás tu próximo hogar en ${zone}? Conocé este espectacular ${property.type || 'depto'} de ${bedrooms} hab. y ${area}m² a un precio de ${price}. Agendá tu visita en 1 clic.`;

    const headline = `${title} - ${price} en ${zone}`;
    const audience = `🎯 PÚBLICO OBJETIVO RECOMENDADO META ADS:
• Edades: 28 - 58 años
• Intereses: Bienes raíces, Inversión inmobiliaria, Hipotecas, Propiedades de lujo
• Ubicación: ${zone} + radio de 15 km
• Ubicación de Anuncio: Feed de Instagram, Stories & Reels`;

    return { primaryText, headline, audience };
  };

  const getPortalesCopy = () => {
    const titles = [
      `1️⃣ ${title} | ${bedrooms} Amb. | ${zone} | ${price}`,
      `2️⃣ ¡Imperdible! ${property.type || 'Depto'} de ${area}m² c/ Excelente Vista en ${zone}`,
      `3️⃣ Oportunidad Única: ${title} en ${zone} (${price})`,
    ];

    const description = `Presentamos este destacado ${property.type || 'Departamento'} en ${zone}, ideal para quienes buscan calidad de vida o inversión de resguardo.

DATOS CLAVE:
• Operación: ${operation}
• Precio: ${price}
• Superficie: ${area} m²
• Ambientes / Dormitorios: ${bedrooms}
• Ubicación: ${zone}

DESCRIPCIÓN:
La propiedad cuenta con una distribución muy funcional, aprovechando al máximo la luz natural en todos los ambientes. Excelente conectividad con transporte y centros comerciales.

¡Coordiná tu visita técnica hoy mismo con nuestros asesores!`;

    return { titles, description };
  };

  const getReelScript = () => {
    return `🎬 GUION REEL / TIKTOK (30 SEGUNDOS)

⏱️ 0:00 - 0:05 (GANCHO VISUAL)
[Toma rápida abriendo la puerta principal o desde el balcón con vista]
🗣️ Voz en Off / Texto en pantalla: "¿Te imaginarías viviendo en este ${property.type || 'depto'} en ${zone} por ${price}?"

⏱️ 0:05 - 0:20 (RECORRIDO AMBIENTES)
[Cortes dinámicos de 2 segundos: Living luminoso -> Cocina equipada -> Dormitorio principal -> Baño]
🗣️ Voz en Off: "Tiene ${bedrooms} ambientes, ${area}m² impecables y una luminosidad tremenda durante todo el día."

⏱️ 0:20 - 0:30 (PRECIO Y CALL TO ACTION)
[Toma de salida o asesor sonriendo frente a la propiedad]
🗣️ Voz en Off: "El valor es de ${price}. Comentá la palabra 'FICHA' acá abajo y te mandamos todos los detalles por privado!"`;
  };

  const instagramCopy = getInstagramCopy();
  const metaAds = getMetaAdsCopy();
  const portales = getPortalesCopy();
  const reelScript = getReelScript();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-4xl max-h-[90vh] bg-slate-950 border border-white/20 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white font-sans">
        
        {/* Header Bar */}
        <div className="p-5 border-b border-white/10 bg-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                Aria Ad Studio (Generador de Anuncios con IA)
              </h3>
              <p className="text-xs text-slate-400">
                Propiedad: <strong className="text-emerald-400">{title}</strong> ({price})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Angle Filter Toolbar */}
        <div className="px-6 py-3 bg-slate-900/60 border-b border-white/10 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">Enfoque del Anuncio:</span>
            {[
              { id: 'inversor', label: '💼 Inversor / Rentabilidad', icon: TrendingUp },
              { id: 'familiar', label: '🏡 Hogar Familiar', icon: Zap },
              { id: 'oportunidad', label: '🔥 Oportunidad Rápida', icon: Flame },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setAngle(item.id as CopyAngle)}
                className={`px-3 py-1.5 rounded-xl font-extrabold transition-all cursor-pointer ${
                  angle === item.id
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-950/60 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setAngle((prev) => (prev === 'inversor' ? 'familiar' : prev === 'familiar' ? 'oportunidad' : 'inversor'))}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Regenerar Ángulo</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 border-b border-white/10 overflow-x-auto bg-slate-950/80">
          {[
            { id: 'instagram', label: '📸 Instagram / Facebook', icon: Instagram },
            { id: 'meta_ads', label: '🎯 Meta Ads (Campaña)', icon: Target },
            { id: 'portales', label: '📍 Portales (Zonaprop/ML)', icon: Globe },
            { id: 'reel_script', label: '🎬 Guion Reel / TikTok', icon: Video },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 text-xs font-extrabold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-emerald-400 text-emerald-400 bg-emerald-500/10'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 text-xs scrollbar-thin">
          
          {/* TAB 1: INSTAGRAM / FACEBOOK ORGANIC */}
          {activeTab === 'instagram' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">
                  Copy listo para Publicar en Redes Sociales
                </h4>
                <button
                  onClick={() => handleCopy(instagramCopy, 'ig')}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {copiedKey === 'ig' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'ig' ? '¡Copiado!' : '📋 Copiar Copy Completo'}</span>
                </button>
              </div>

              <textarea
                readOnly
                rows={12}
                value={instagramCopy}
                className="w-full p-4 rounded-2xl bg-slate-900 border border-white/10 text-slate-200 font-sans text-xs leading-relaxed focus:outline-none"
              />
            </div>
          )}

          {/* TAB 2: META ADS (CAMPAÑA PAGA) */}
          {activeTab === 'meta_ads' && (
            <div className="space-y-4">
              
              {/* Primary Text */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-emerald-400 uppercase tracking-wider">
                    Primary Text (Texto Principal del Anuncio - Fórmula AIDA)
                  </h5>
                  <button
                    onClick={() => handleCopy(metaAds.primaryText, 'meta_primary')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] flex items-center gap-1"
                  >
                    {copiedKey === 'meta_primary' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copiar</span>
                  </button>
                </div>
                <p className="text-slate-300 leading-relaxed">{metaAds.primaryText}</p>
              </div>

              {/* Headline */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-amber-400 uppercase tracking-wider">
                    Headline (Título del Anuncio)
                  </h5>
                  <button
                    onClick={() => handleCopy(metaAds.headline, 'meta_head')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] flex items-center gap-1"
                  >
                    {copiedKey === 'meta_head' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copiar</span>
                  </button>
                </div>
                <p className="font-mono text-white text-sm">{metaAds.headline}</p>
              </div>

              {/* Target Audience Recommendation */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 text-slate-300 space-y-2">
                <pre className="font-sans text-xs whitespace-pre-wrap leading-relaxed text-emerald-300">
                  {metaAds.audience}
                </pre>
              </div>

            </div>
          )}

          {/* TAB 3: PORTALES INMOBILIARIOS */}
          {activeTab === 'portales' && (
            <div className="space-y-4">
              {/* Titles Section */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 space-y-2">
                <h5 className="font-bold text-emerald-400 uppercase tracking-wider">
                  Títulos para Portales (Optimizados para Mayor CTR)
                </h5>
                <div className="space-y-2">
                  {portales.titles.map((t, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-white/5">
                      <span className="font-mono text-white">{t}</span>
                      <button
                        onClick={() => handleCopy(t, `title_${idx}`)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold"
                      >
                        {copiedKey === `title_${idx}` ? '¡Copiado!' : 'Copiar'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-amber-400 uppercase tracking-wider">
                    Descripción Estructurada para Ficha Técnica
                  </h5>
                  <button
                    onClick={() => handleCopy(portales.description, 'portal_desc')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5"
                  >
                    {copiedKey === 'portal_desc' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copiar Descripción</span>
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={8}
                  value={portales.description}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-white/10 text-slate-200 font-sans text-xs leading-relaxed focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB 4: REEL / TIKTOK SCRIPT */}
          {activeTab === 'reel_script' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">
                  Guion de Vídeo Corto (30 Segundos)
                </h4>
                <button
                  onClick={() => handleCopy(reelScript, 'reel')}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {copiedKey === 'reel' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>📋 Copiar Guion Completo</span>
                </button>
              </div>

              <textarea
                readOnly
                rows={10}
                value={reelScript}
                className="w-full p-4 rounded-2xl bg-slate-900 border border-white/10 text-emerald-300 font-mono text-xs leading-relaxed focus:outline-none"
              />
            </div>
          )}

        </div>

        {/* Footer Bar */}
        <div className="p-4 bg-slate-900 border-t border-white/10 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            💡 Copiá y pegá los textos directamente en Meta Business Suite, Zonaprop o tu agenda de contenidos.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};

export default PropertyAdStudioModal;

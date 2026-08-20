import React, { useState } from 'react';
import { Property } from '../../types';
import {
  Printer,
  Copy,
  Check,
  X,
  FileText,
  Building2,
  MapPin,
  Bed,
  Bath,
  Maximize,
  Phone,
  QrCode,
  Sparkles,
  Share2,
} from 'lucide-react';
import { exportPropertySheetToPdf } from '../../../lib/pdf/property-sheet';

interface PropertyPdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property | null;
  agencyName?: string;
  agencyPhone?: string;
}

export const PropertyPdfExportModal: React.FC<PropertyPdfExportModalProps> = ({
  isOpen,
  onClose,
  property,
  agencyName = 'Aria Prop Inmobiliaria',
  agencyPhone = '+54 9 11 4014-3729',
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !property) return null;

  const title = property.title || 'Propiedad Exclusiva';
  const price = property.price || 150000;
  const currency = property.currency || 'USD';
  const locationStr = property.location
    ? `${property.location.zone || ''}, ${property.location.city || ''}`
    : 'CABA, Argentina';
  const bedrooms = property.features?.bedrooms || 3;
  const bathrooms = property.features?.bathrooms || 2;
  const areaM2 = property.features?.areaM2 || 75;
  const imageUrl =
    property.images && property.images.length > 0
      ? property.images[0]
      : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80';

  const targetId = property.id || property.code || (property as any)._id || 'PROP-2026';
  const realPropertyUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/properties/${targetId}`
    : `https://ariaprop.online/properties/${targetId}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(realPropertyUrl)}`;

  const handlePrintPdf = () => {
    const targetTitle = (title || 'Propiedad').replace(/[^a-zA-Z0-9\s_-]/g, '').trim();
    const pdfFileName = `${targetTitle}_Ficha_AriaProp`;

    const pdfBundle = exportPropertySheetToPdf({
      title,
      price,
      currency,
      operationType: property.price && property.price < 5000 ? 'Alquiler' : 'Venta',
      location: locationStr,
      address: property.location?.address || locationStr,
      bedrooms,
      bathrooms,
      totalAreaM2: areaM2,
      description: property.description || 'Excelente propiedad con acabados de alta gama y gran conectividad.',
      features: ['Luminoso', 'Balcón Corrido', 'Cochera Fija', 'Seguridad 24hs'],
      images: property.images && property.images.length > 0 ? property.images : [imageUrl],
      agencyName,
      agencyPhone,
    });

    // Create or reuse hidden iframe to print isolated document without background UI
    let iframe = document.getElementById('aria-pdf-print-iframe') as HTMLIFrameElement | null;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'aria-pdf-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';
      document.body.appendChild(iframe);
    }

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>${pdfFileName}</title>
            <style>
              @page { size: A4 portrait; margin: 10mm; }
              body { margin: 0; padding: 0; background-color: #ffffff !important; color: #000000 !important; font-family: system-ui, -apple-system, sans-serif; }
            </style>
          </head>
          <body>
            ${pdfBundle.html}
          </body>
        </html>
      `);
      iframeDoc.close();

      setTimeout(() => {
        iframe?.contentWindow?.focus();
        iframe?.contentWindow?.print();
      }, 300);
    }
  };

  const handleCopyWhatsappText = () => {
    const waText = `🏠 *${title.toUpperCase()}*
💰 *Precio:* ${currency} $${price.toLocaleString()}
📍 *Ubicación:* ${locationStr}
📐 *Superficie:* ${areaM2} m²
🛏️ *Ambientes/Dormitorios:* ${bedrooms} hab | ${bathrooms} baños

📝 *Descripción:*
${property.description || 'Excelente propiedad con acabados de alta gama.'}

📲 *Contacto / Visitas:* ${agencyPhone}
🌐 *Ver Ficha Online:* ${realPropertyUrl}`;

    navigator.clipboard.writeText(waText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn font-sans">
      <div className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-emerald-500/40 p-6 sm:p-8 shadow-2xl text-white space-y-6 max-h-[90vh] flex flex-col">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Ficha Técnica Profesional A4</h3>
              <p className="text-xs text-slate-400">Previsualización e impresión de dossier comercial</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyWhatsappText}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs flex items-center gap-1.5 border border-emerald-500/30 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '¡Copiado para WhatsApp!' : '📋 Copiar para WhatsApp'}</span>
            </button>

            <button
              onClick={handlePrintPdf}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>🖨️ Descargar / Imprimir PDF</span>
            </button>
          </div>
        </div>

        {/* Printable A4 Dossier Preview Card */}
        <div className="flex-1 overflow-y-auto bg-slate-950 p-6 rounded-2xl border border-white/10 space-y-6 scrollbar-thin">
          
          {/* Header Dossier Bar */}
          <div className="flex items-center justify-between border-b-2 border-emerald-500 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-6 h-6 text-emerald-400" />
              <span className="font-black text-base text-white uppercase tracking-wider">
                {agencyName}
              </span>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black uppercase">
              Ficha Exclusiva de Venta
            </span>
          </div>

          {/* Title and Price */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-black text-white">{title}</h2>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>{locationStr}</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-2xl font-black text-emerald-400 font-mono">
                {currency} ${price.toLocaleString()}
              </span>
              <span className="block text-[10px] text-slate-400 font-bold">
                Expensas: $45.000 ARS/mes
              </span>
            </div>
          </div>

          {/* Property Image Banner */}
          <div className="relative rounded-2xl overflow-hidden border border-white/10 h-64 bg-slate-900">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-xs font-bold text-white border border-white/10">
              Código: {property.code || 'PROP-2026'}
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-900 border border-white/10 text-center space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block">Dormitorios</span>
              <div className="flex items-center justify-center gap-1 text-sm font-black text-white">
                <Bed className="w-4 h-4 text-emerald-400" />
                <span>{bedrooms} hab</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-white/10 text-center space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block">Baños</span>
              <div className="flex items-center justify-center gap-1 text-sm font-black text-white">
                <Bath className="w-4 h-4 text-emerald-400" />
                <span>{bathrooms} baños</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-white/10 text-center space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block">Superficie Total</span>
              <div className="flex items-center justify-center gap-1 text-sm font-black text-white">
                <Maximize className="w-4 h-4 text-emerald-400" />
                <span>{areaM2} m²</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-white/10 text-center space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block">Cochera / Garaje</span>
              <div className="flex items-center justify-center gap-1 text-sm font-black text-white">
                <span>Cubierta Fija</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider">
              Descripción & Comodidades
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900 p-3.5 rounded-xl border border-white/10">
              {property.description ||
                'Hermosa propiedad luminosa con vistas despejadas, terminaciones de primera calidad y cocina integrada.'}
            </p>
          </div>

          {/* Commercial Agent Footer & QR */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h5 className="font-extrabold text-xs text-white">{agencyName}</h5>
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold">
                <Phone className="w-3.5 h-3.5" />
                <span>Atención Comercial: {agencyPhone}</span>
              </div>
            </div>

            {/* Dynamic QR Code Badge */}
            <div className="p-2 rounded-xl bg-white text-slate-950 flex items-center gap-2 shadow-md">
              <img
                src={qrImageUrl}
                alt="QR Ficha Online"
                className="w-10 h-10 object-contain rounded"
              />
              <div className="text-[9px] font-black text-slate-900 leading-tight">
                Escaneá para ver<br />Ficha Online 📲
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default PropertyPdfExportModal;

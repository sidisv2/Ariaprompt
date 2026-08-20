/**
 * Property Technical Sheet Generator (PDF / HTML Printable Dossier)
 * ------------------------------------------------------------------
 * Python WeasyPrint Export Convention (for Python microservices / serverless workers):
 * ```python
 * import base64
 * from weasyprint import HTML
 *
 * def convert_html_to_base64_pdf(html_content: str) -> str:
 *     pdf_bytes = HTML(string=html_content).write_pdf()
 *     return base64.b64encode(pdf_bytes).decode('utf-8')
 * ```
 */

export interface PropertySheetOptions {
  id?: string;
  title: string;
  price: number;
  currency?: string;
  operationType?: 'Venta' | 'Alquiler' | 'Alquiler Temporal' | string;
  location?: string;
  address?: string;
  city?: string;
  bedrooms?: number | string;
  bathrooms?: number | string;
  totalAreaM2?: number | string;
  coveredAreaM2?: number | string;
  environments?: number | string;
  garages?: number | string;
  description?: string;
  features?: string[];
  images?: string[];
  agencyName?: string;
  agencyPhone?: string;
  agencyEmail?: string;
  agencyLogoUrl?: string;
}

/**
 * Render clean HTML technical dossier printable property sheet
 */
export function generatePropertySheetHtml(prop: PropertySheetOptions): string {
  const currencySymbol = prop.currency === 'ARS' ? '$' : 'USD $';
  const formattedPrice = Number(prop.price || 0).toLocaleString('en-US');
  const mainImage = prop.images && prop.images.length > 0 ? prop.images[0] : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80';
  const secondaryImages = prop.images && prop.images.length > 1 ? prop.images.slice(1, 4) : [];
  const featuresList = prop.features && prop.features.length > 0 ? prop.features : ['Excelente Ubicación', 'Luminoso', 'Seguridad 24hs', 'Apto Crédito'];

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Ficha Técnica Inmobiliaria - ${escapeHtml(prop.title)}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    * { box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; background: #ffffff; margin: 0; padding: 20px; -webkit-print-color-adjust: exact; }
    .header { display: flex; align-items: center; justify-content: space-between; border-b: 2px solid #10b981; padding-bottom: 15px; margin-bottom: 20px; }
    .brand { font-size: 22px; font-weight: 900; color: #0f172a; text-transform: uppercase; tracking-tight; }
    .brand span { color: #10b981; }
    .tag { background-color: #10b981; color: #ffffff; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; }
    .hero-container { margin-bottom: 20px; border-radius: 12px; overflow: hidden; height: 320px; position: relative; }
    .hero-img { width: 100%; height: 100%; object-fit: cover; }
    .hero-price { position: absolute; bottom: 15px; left: 15px; background: rgba(15, 23, 42, 0.9); color: #ffffff; padding: 8px 18px; border-radius: 10px; font-size: 24px; font-weight: 900; border: 1px solid rgba(16, 185, 129, 0.5); }
    .title-sec { margin-bottom: 15px; }
    .title-sec h1 { font-size: 20px; margin: 0 0 5px 0; color: #0f172a; }
    .title-sec p { font-size: 13px; color: #64748b; margin: 0; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; background: #f8fafc; padding: 15px; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 20px; }
    .stat-item { text-align: center; }
    .stat-val { font-size: 16px; font-weight: 800; color: #0f172a; }
    .stat-lbl { font-size: 10px; color: #64748b; text-transform: uppercase; margin-top: 2px; }
    .sec-header { font-size: 14px; font-weight: 800; color: #0f172a; border-left: 4px solid #10b981; padding-left: 8px; margin-bottom: 10px; text-transform: uppercase; }
    .desc { font-size: 12px; line-height: 1.6; color: #334155; margin-bottom: 20px; }
    .features-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 20px; }
    .feat-item { font-size: 11px; background: #f1f5f9; padding: 8px 12px; border-radius: 6px; color: #334155; font-weight: 600; }
    .gallery { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 25px; }
    .gallery img { width: 100%; height: 110px; object-fit: cover; border-radius: 8px; }
    .footer-contact { background: #0f172a; color: #ffffff; padding: 18px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; }
    .agent-info h4 { margin: 0; font-size: 14px; color: #ffffff; }
    .agent-info p { margin: 3px 0 0 0; font-size: 11px; color: #94a3b8; }
    .qr-badge { background: #10b981; color: #0f172a; padding: 8px 14px; border-radius: 8px; font-weight: 800; font-size: 12px; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">${escapeHtml(prop.agencyName || 'ARIA PROP')} <span>INMOBILIARIA</span></div>
    <div class="tag">${escapeHtml(prop.operationType || 'Venta')}</div>
  </div>

  <div class="hero-container">
    <img src="${escapeHtml(mainImage)}" class="hero-img" alt="Propiedad" />
    <div class="hero-price">${currencySymbol} ${formattedPrice}</div>
  </div>

  <div class="title-sec">
    <h1>${escapeHtml(prop.title)}</h1>
    <p>📍 ${escapeHtml(prop.location || prop.address || 'Ubicación privilegiada')}</p>
  </div>

  <div class="stats-grid">
    <div class="stat-item">
      <div class="stat-val">${prop.bedrooms || '-'}</div>
      <div class="stat-lbl">Dormitorios</div>
    </div>
    <div class="stat-item">
      <div class="stat-val">${prop.bathrooms || '-'}</div>
      <div class="stat-lbl">Baños</div>
    </div>
    <div class="stat-item">
      <div class="stat-val">${prop.totalAreaM2 ? `${prop.totalAreaM2} m²` : '-'}</div>
      <div class="stat-lbl">Sup. Total</div>
    </div>
    <div class="stat-item">
      <div class="stat-val">${prop.coveredAreaM2 ? `${prop.coveredAreaM2} m²` : '-'}</div>
      <div class="stat-lbl">Sup. Cubierta</div>
    </div>
  </div>

  <div class="sec-header">Descripción de la Propiedad</div>
  <div class="desc">${escapeHtml(prop.description || 'Excelente propiedad con amplios ambientes, gran luminosidad y terminaciones de primera calidad. Contacte con nuestro equipo para coordinar una visita.')}</div>

  <div class="sec-header">Características & Amenidades</div>
  <div class="features-grid">
    ${featuresList.map(f => `<div class="feat-item">✓ ${escapeHtml(f)}</div>`).join('')}
  </div>

  ${secondaryImages.length > 0 ? `
  <div class="sec-header">Galería de Imágenes</div>
  <div class="gallery">
    ${secondaryImages.map(img => `<img src="${escapeHtml(img)}" alt="Foto propiedad" />`).join('')}
  </div>
  ` : ''}

  <div class="footer-contact">
    <div class="agent-info">
      <h4>${escapeHtml(prop.agencyName || 'Aria Prop Commercial Team')}</h4>
      <p>📱 WhatsApp: ${escapeHtml(prop.agencyPhone || '+54 9 11 2345-6789')} | ✉️ ${escapeHtml(prop.agencyEmail || 'contacto@ariaprop.online')}</p>
    </div>
    <div class="qr-badge">DOCUMENTO OFICIAL</div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate base64 Data URI from Property Sheet HTML
 */
export function generatePropertySheetDataUri(prop: PropertySheetOptions): string {
  const html = generatePropertySheetHtml(prop);
  const base64Html = Buffer.from(html, 'utf-8').toString('base64');
  return `data:text/html;base64,${base64Html}`;
}

/**
 * Export Property Sheet Bundle for export or downloading
 */
export function exportPropertySheetToPdf(prop: PropertySheetOptions) {
  const html = generatePropertySheetHtml(prop);
  const dataUri = generatePropertySheetDataUri(prop);
  const sanitizeTitle = prop.title.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30);
  const filename = `ficha-${sanitizeTitle}-${Date.now()}.html`;

  return {
    html,
    dataUri,
    filename,
  };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

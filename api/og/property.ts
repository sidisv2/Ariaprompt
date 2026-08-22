import { createClient } from '@supabase/supabase-js';
import { INITIAL_PROPERTIES } from '../../src/data/mockData.js';

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default async function handler(req: any, res: any) {
  const propId = req.query?.id || req.params?.id || req.query?.propId || '';
  const baseUrl = 'https://ariaprop.online';

  let property: any = INITIAL_PROPERTIES.find(
    (p) => p.id === propId || p.code.toLowerCase() === String(propId).toLowerCase()
  );

  // Search in Supabase DB if credentials exist
  const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
  const supabaseKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ''
  ).trim();

  if (!property && propId && supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder')) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data } = await supabase
        .from('properties')
        .select('*')
        .or(`id.eq.${propId},code.eq.${propId}`)
        .maybeSingle();

      if (data) property = data;
    } catch (err) {
      console.warn('⚠️ Exception querying property for OG metadata:', err);
    }
  }

  const title = property ? `${property.title} | Aria Prop` : 'Ficha de Propiedad Inmobiliaria | Aria Prop';
  const opType = property?.operation_type === 'rent' || property?.operation === 'ALQUILER' ? 'Alquiler' : 'Venta';
  const currency = property?.currency || 'USD';
  const rawPrice = property?.price ? Number(property.price).toLocaleString('en-US') : '0';
  const price = `$${rawPrice}`;
  const address = property?.location?.address || property?.address || 'Ubicación destacada';
  const city = property?.location?.city || property?.city || '';
  const bedrooms = property?.features?.bedrooms ?? property?.bedrooms ?? 0;
  const areaM2 = property?.features?.areaM2 ?? property?.areaM2 ?? 0;

  const description = property
    ? `${opType} - ${currency} ${price} • ${address}${city ? `, ${city}` : ''} • ${bedrooms} dorm, ${areaM2} m²`
    : 'Explora esta propiedad en el catálogo público de Aria Prop con atención de IA 24/7 y agendado de visitas directo en WhatsApp.';

  const image =
    property?.images?.[0] ||
    property?.image_url ||
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80';

  const ogUrl = `${baseUrl}/properties/${property?.id || propId || ''}`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">

  <!-- Open Graph / Facebook / WhatsApp / Telegram / LinkedIn -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${escapeHtml(ogUrl)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(image)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="Aria Prop - Agente Comercial IA">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${escapeHtml(ogUrl)}">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(image)}">

  <script>
    if (!navigator.userAgent.match(/WhatsApp|TelegramBot|facebookexternalhit|Twitterbot|LinkedInBot|Discordbot|Slackbot/i)) {
      window.location.href = "${escapeHtml(ogUrl)}";
    }
  </script>
</head>
<body style="background:#020617; color:#f8fafc; font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; padding:2rem; text-align:center; max-width:700px; margin:0 auto;">
  <div style="background:#0f172a; padding:2rem; border-radius:1.5rem; border:1px solid rgba(255,255,255,0.1); margin-top:2rem;">
    <span style="display:inline-block; padding:0.25rem 0.75rem; background:rgba(16,185,129,0.15); color:#34d399; border-radius:9999px; font-size:0.75rem; font-weight:bold; text-transform:uppercase;">
      ${escapeHtml(opType)} • ${escapeHtml(currency)} ${escapeHtml(price)}
    </span>
    <h1 style="font-size:1.5rem; font-weight:800; margin:1rem 0 0.5rem 0; color:#ffffff;">${escapeHtml(title)}</h1>
    <p style="color:#94a3b8; font-size:0.875rem; margin-bottom:1.5rem; line-height:1.5;">${escapeHtml(description)}</p>
    <img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" style="width:100%; max-height:400px; object-fit:cover; border-radius:1rem; border:1px solid rgba(255,255,255,0.1);" />
    <div style="margin-top:1.5rem;">
      <a href="${escapeHtml(ogUrl)}" style="display:inline-block; padding:0.75rem 1.5rem; background:#10b981; color:#020617; font-weight:bold; border-radius:0.75rem; text-decoration:none;">
        Ver Ficha Técnica Completa en Aria Prop ↗
      </a>
    </div>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  return res.status(200).send(html);
}

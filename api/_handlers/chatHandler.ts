import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { generateStructuredAriaRealEstateResponse, ExtractedLeadData } from '../_lib/openrouterService.js';

function getBackendSupabaseClient() {
  const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
  const supabaseKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ''
  ).trim();
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
    return null;
  }
  try {
    return createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch (err) {
    return null;
  }
}

/**
 * Intelligent rule-based fallback response generator (used if OpenRouter API is unavailable)
 * NEVER uses fixed canned strings. Always crafts custom, warm real estate responses.
 */
function generateCommercialFallbackResponse(
  message: string,
  agentName: string = 'Aria',
  agencyName: string = 'Aria Prop',
  properties: any[] = []
): { replyText: string; extractedData: ExtractedLeadData; matchedProperties: any[] } {
  const query = message.toLowerCase();

  // Extract entities
  let budgetMax: number | null = null;
  const budgetMatch = query.match(/(\$\d+|\d+[\.\d+]*\s*(usd|dolares|dólares|mil|k))/i);
  if (budgetMatch) {
    const rawNum = query.match(/\d[\d\.\,]*/)?.[0]?.replace(/\./g, '');
    if (rawNum) {
      let num = parseInt(rawNum, 10);
      if (query.includes('k') || query.includes('mil')) num *= 1000;
      if (!isNaN(num)) budgetMax = num;
    }
  }

  let preferredZone: string | null = null;
  const zones = ['palermo', 'recoleta', 'belgrano', 'puerto madero', 'mendoza', 'nordelta', 'san isidro', 'polanco', 'condesa'];
  for (const z of zones) {
    if (query.includes(z)) {
      preferredZone = z.charAt(0).toUpperCase() + z.slice(1);
      break;
    }
  }

  let operationType: string | null = null;
  if (query.includes('alquiler') || query.includes('alquilar') || query.includes('renta')) {
    operationType = 'alquiler';
  } else if (query.includes('compra') || query.includes('comprar') || query.includes('venta') || query.includes('inversion')) {
    operationType = 'venta';
  }

  let propertyType: string | null = null;
  if (query.includes('depto') || query.includes('departamento') || query.includes('ambiente')) propertyType = 'departamento';
  else if (query.includes('casa') || query.includes('chalet')) propertyType = 'casa';
  else if (query.includes('penthouse')) propertyType = 'penthouse';
  else if (query.includes('oficina') || query.includes('local')) propertyType = 'comercial';

  // Match properties
  const matched = properties.filter((p) => {
    let match = false;
    if (preferredZone && (p.zone || p.city || '').toLowerCase().includes(preferredZone.toLowerCase())) match = true;
    if (operationType && (p.operation || '').toLowerCase() === operationType) match = true;
    if (budgetMax && p.price && p.price <= budgetMax * 1.2) match = true;
    return match;
  });

  const finalMatched = matched.length > 0 ? matched.slice(0, 3) : properties.slice(0, 2);

  // Craft dynamic response based on intent
  let replyText = '';

  if (query.includes('hola') || query.includes('buenas') || query.includes('buenos dias') || query.includes('buenas noches')) {
    replyText = `¡Hola! 👋 Soy ${agentName}, asesora comercial inmobiliaria en ${agencyName}. ¿Qué tipo de propiedad estás buscando o en qué zona te gustaría encontrar tu próximo inmueble?`;
  } else if (query.includes('visita') || query.includes('ver') || query.includes('coordinar') || query.includes('cita')) {
    replyText = `Con mucho gusto puedo coordinar una visita presencial o virtual para ti. 📅 Habitualmente organizamos recorridos de lunes a sábados. ¿Qué día y franja horaria prefieres? Te agendo de inmediato con nuestro equipo.`;
  } else if (finalMatched.length > 0) {
    const propDetails = finalMatched
      .map((p) => `• *${p.title || 'Propiedad'}* en ${p.zone || p.city || 'Mendoza'} (${(p.operation || 'DISPONIBLE').toUpperCase()}): $${p.price?.toLocaleString('en-US') || 0} USD - ${p.bedrooms || 2} habs.`)
      .join('\n');
    replyText = `¡Excelente consulta! En ${agencyName} contamos con opciones destacadas que se adaptan a tu búsqueda:\n\n${propDetails}\n\n¿Te gustaría recibir la ficha técnica completa o agendar una visita a alguna de estas propiedades?`;
  } else {
    replyText = `Gracias por tu mensaje. Para ofrecerte las mejores opciones en nuestro catálogo de ${agencyName}, ¿nos podrías confirmar tu presupuesto estimado y la zona de preferencia? Así filtraré los mejores inmuebles para ti.`;
  }

  const isQualified = Boolean(budgetMax || preferredZone || operationType);

  return {
    replyText,
    extractedData: {
      budget_max_usd: budgetMax,
      preferred_zone: preferredZone,
      property_type: propertyType,
      operation_type: operationType,
      lead_name: null,
      status: isQualified ? 'qualified' : 'active',
    },
    matchedProperties: finalMatched.map((m) => ({
      id: m.id,
      title: m.title || 'Propiedad en catálogo',
      price: m.price || 0,
      type: m.type || 'Inmueble',
      zone: m.zone || 'Mendoza',
      url: `https://ariaprop.online/properties/${m.id}`,
      bedrooms: m.bedrooms || 2,
      areaM2: m.area_m2 || 60,
    })),
  };
}

export async function handleChatRoute(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { message, history = [], orgId, agentName = 'Aria', agencyName = 'Aria Prop' } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'El mensaje es obligatorio' });
    }

    const supabase = getBackendSupabaseClient();
    let properties: any[] = [];
    let botConfig: any = null;

    if (supabase) {
      try {
        let propQuery = supabase.from('properties').select('*');
        if (orgId) {
          propQuery = propQuery.eq('organization_id', orgId);
        }
        const { data: propsData } = await propQuery.limit(15);
        if (propsData && propsData.length > 0) {
          properties = propsData;
        }

        if (orgId) {
          const { data: orgData } = await supabase.from('organizations').select('*').eq('id', orgId).single();
          if (orgData) {
            botConfig = orgData;
          }
        }
      } catch (err) {
        console.warn('⚠️ Supabase error in chatHandler:', err);
      }
    }

    // Default property list if DB empty
    if (properties.length === 0) {
      properties = [
        {
          id: 'prop-101',
          title: 'Departamento 2 Ambientes c/ Balcón Vista Abierta',
          price: 800,
          operation: 'ALQUILER',
          zone: 'Palermo Soho',
          type: 'departamento',
          bedrooms: 1,
          area_m2: 52,
        },
        {
          id: 'prop-102',
          title: 'Casa Moderna 4 Ambientes c/ Piscina Privada',
          price: 350000,
          operation: 'VENTA',
          zone: 'Nordelta',
          type: 'casa',
          bedrooms: 3,
          area_m2: 280,
        },
        {
          id: 'prop-103',
          title: 'Penthouse de Lujo c/ Terraza y Vista al Río',
          price: 520000,
          operation: 'VENTA',
          zone: 'Puerto Madero',
          type: 'penthouse',
          bedrooms: 3,
          area_m2: 195,
        },
      ];
    }

    const effectiveAgentName = botConfig?.assistant_name || agentName;
    const effectiveAgencyName = botConfig?.name || agencyName;

    const propertyCatalogText = properties
      .map(
        (p) =>
          `- [ID: ${p.id}] "${p.title}" (${(p.type || 'Inmueble').toUpperCase()} - ${(p.operation || 'ALQUILER').toUpperCase()}) en ${p.zone || 'Mendoza'}. Precio: $${p.price} USD. ${p.bedrooms || 2} hab. Ficha: https://ariaprop.online/properties/${p.id}`
      )
      .join('\n');

    try {
      const response = await generateStructuredAriaRealEstateResponse({
        message,
        history,
        propertyContext: propertyCatalogText,
        agentName: effectiveAgentName,
        agencyName: effectiveAgencyName,
      });

      const latencyMs = Date.now() - startTime;

      // Extract matching properties
      const lowerReply = response.replyText.toLowerCase();
      const matched = properties.filter(
        (p) => lowerReply.includes(p.title?.toLowerCase() || '') || lowerReply.includes(p.id) || lowerReply.includes(p.zone?.toLowerCase() || '')
      );

      return res.status(200).json({
        success: true,
        replyText: response.replyText,
        extractedData: response.extractedData,
        matchedProperties: (matched.length > 0 ? matched : properties.slice(0, 2)).map((m) => ({
          id: m.id,
          title: m.title || 'Propiedad en catálogo',
          price: m.price || 0,
          type: m.type || 'Inmueble',
          zone: m.zone || 'Mendoza',
          url: `https://ariaprop.online/properties/${m.id}`,
          bedrooms: m.bedrooms || 2,
          areaM2: m.area_m2 || 60,
        })),
        latencyMs,
        source: 'openrouter',
      });
    } catch (llmErr) {
      console.warn('⚠️ LLM Exception in chatHandler, executing smart commercial fallback:', llmErr);
      const fallback = generateCommercialFallbackResponse(message, effectiveAgentName, effectiveAgencyName, properties);
      const latencyMs = Date.now() - startTime;

      return res.status(200).json({
        success: true,
        replyText: fallback.replyText,
        extractedData: fallback.extractedData,
        matchedProperties: fallback.matchedProperties,
        latencyMs,
        source: 'smart_commercial_fallback',
      });
    }
  } catch (err: any) {
    console.error('❌ Chat handler error:', err);
    return res.status(500).json({
      error: 'Error al procesar el mensaje en el motor de IA',
      details: err?.message || err,
    });
  }
}

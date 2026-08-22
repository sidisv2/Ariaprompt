import React, { useState, useEffect } from 'react';
import { AppRoute, Property, Lead, BotConfig } from './types';
import { INITIAL_PROPERTIES, INITIAL_LEADS, INITIAL_BOT_CONFIG } from './data/mockData';
import { useAuth, AuthProvider } from './context/AuthContext';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { LanguageProvider } from './context/LanguageContext';
import { useDeviceType } from './hooks/useDeviceType';
import { DesktopView } from './components/desktop/DesktopView';
import { MobileView } from './components/mobile/MobileView';
import { DeviceSwitcherBadge } from './components/common/DeviceSwitcherBadge';
import { ChatSlideOver } from './components/chat/ChatSlideOver';
import { WhatsAppFloatingButton } from './components/common/BetaBanner';
import { StandaloneChatWidget } from './components/embed/StandaloneChatWidget';

const getRouteFromPath = (): AppRoute => {
  // Check pathname first, fallback to legacy hash if user comes from old bookmark
  const path = (window.location.pathname + window.location.hash).toLowerCase();
  if (path.includes('dashboard/integrations') || path.includes('integraciones')) return 'dashboard-integrations';
  if (path.includes('dashboard/metrics') || path.includes('panel')) return 'dashboard-metrics';
  if (path.includes('app') || path.includes('dashboard/assistant') || path.includes('aria-ai')) return 'app';
  if (path.includes('producto')) return 'producto';
  if (path.includes('soluciones')) return 'soluciones';
  if (path.includes('recursos')) return 'recursos';
  if (path.includes('pricing')) return 'pricing';
  if (path.includes('terminos') || path.includes('terms')) return 'terminos';
  if (path.includes('privacidad') || path.includes('privacy')) return 'privacidad';
  if (path.includes('reembolsos') || path.includes('refund')) return 'reembolsos';
  if (path.includes('checkout/success') || path.includes('gracias')) return 'checkout-success';
  if (path.includes('comparar/manual')) return 'comparar-manual';
  if (path.includes('comparar/crm')) return 'comparar-crm';
  if (path.includes('comparar/chatbots')) return 'comparar-chatbots';
  if (path.includes('ia-para-inmobiliarias')) return 'ia-para-inmobiliarias';
  if (path.includes('whatsapp-para-inmobiliarias') || path.includes('automatizar-whatsapp-inmobiliaria')) return 'whatsapp-para-inmobiliarias';
  if (path.includes('chatbot-inmobiliario') || path.includes('chatbot-vs-agente-ia')) return 'chatbot-inmobiliario';
  if (path.includes('properties/') || path.includes('propiedades/')) return 'property-detail';
  if (path.includes('dashboard/properties')) return 'dashboard-properties';
  if (path.includes('dashboard/leads')) return 'dashboard-leads';
  if (path.includes('dashboard/bot-config')) return 'dashboard-bot-config';
  if (path.includes('dashboard/assistant') || path.includes('aria-ai')) return 'dashboard-assistant';
  if (path.includes('dashboard/checkout')) return 'dashboard-checkout';
  if (path.includes('dashboard/profile')) return 'dashboard-profile';
  if (path.includes('dashboard/files')) return 'dashboard-files';
  if (path.includes('dashboard/roles')) return 'dashboard-roles';
  if (path.includes('vault') || path.includes('user/')) return 'dashboard-vault';
  if (path.includes('embed/chat') || path.includes('embed-chat')) return 'embed-chat';
  if (path.includes('embed-preview')) return 'embed-preview';
  return 'marketing';
};

const getPathFromRoute = (route: AppRoute): string => {
  switch (route) {
    case 'dashboard-metrics':
    case 'app': return '/app';
    case 'dashboard-integrations': return '/dashboard/integrations';
    case 'producto': return '/producto';
    case 'soluciones': return '/soluciones';
    case 'recursos': return '/recursos';
    case 'pricing': return '/pricing';
    case 'terminos': return '/terminos';
    case 'privacidad': return '/privacidad';
    case 'reembolsos': return '/reembolsos';
    case 'checkout-success': return '/checkout/success';
    case 'comparar-manual': return '/comparar/manual';
    case 'comparar-crm': return '/comparar/crm';
    case 'comparar-chatbots': return '/comparar/chatbots';
    case 'ia-para-inmobiliarias': return '/ia-para-inmobiliarias';
    case 'whatsapp-para-inmobiliarias':
    case 'automatizar-whatsapp-inmobiliaria': return '/whatsapp-para-inmobiliarias';
    case 'chatbot-inmobiliario':
    case 'chatbot-vs-agente-ia': return '/chatbot-inmobiliario';
    case 'dashboard-properties': return '/dashboard/properties';
    case 'dashboard-leads': return '/dashboard/leads';
    case 'dashboard-bot-config': return '/dashboard/bot-config';
    case 'dashboard-assistant': return '/dashboard/assistant';
    case 'dashboard-checkout': return '/dashboard/checkout';
    case 'dashboard-profile': return '/dashboard/profile';
    case 'dashboard-files': return '/dashboard/files';
    case 'dashboard-roles': return '/dashboard/roles';
    case 'dashboard-vault': return '/user/vault';
    case 'embed-chat': return '/embed/chat';
    case 'embed-preview': return '/embed-preview';
    case 'property-detail': return window.location.pathname.startsWith('/properties/') ? window.location.pathname : '/properties/detail';
    default: return '/';
  }
};

function AppInner() {
  const { user } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() => getRouteFromPath());

  // Real user accounts MUST start with empty properties [] and empty leads []
  // Only explicit demo accounts (isDemoAccount === true) load mock example data INITIAL_PROPERTIES / INITIAL_LEADS
  // Load initial properties from localStorage backup or fallback to INITIAL_PROPERTIES
  const [properties, setProperties] = useState<Property[]>(() => {
    try {
      const backup = localStorage.getItem('aria_properties_backup');
      if (backup) {
        const parsed = JSON.parse(backup);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_PROPERTIES;
  });
  const [leads, setLeads] = useState<Lead[]>(() => {
    return user?.isDemoAccount ? INITIAL_LEADS : [];
  });
  const [botConfig, setBotConfig] = useState<BotConfig>(INITIAL_BOT_CONFIG);
  const [selectedLeadForChat, setSelectedLeadForChat] = useState<string | undefined>(undefined);

  // Sync HTML5 BrowserRouter (pathname & pushState)
  const handleRouteChange = (route: AppRoute) => {
    const targetPath = getPathFromRoute(route);
    if (window.location.pathname !== targetPath || window.location.hash) {
      window.history.pushState({}, '', targetPath);
    }
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (window.location.hash) {
      const initialRoute = getRouteFromPath();
      const cleanPath = getPathFromRoute(initialRoute);
      window.history.replaceState({}, '', cleanPath);
    }

    const handlePopState = () => {
      setCurrentRoute(getRouteFromPath());
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // Global Slide-Over Assistant State
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [prefilledPrompt, setPrefilledPrompt] = useState<string>('');

  const handleOpenPrompt = (promptText: string) => {
    setPrefilledPrompt(promptText);
    setSlideOverOpen(true);
  };

  // Device detection hook
  const { isMobile, deviceType, forcedDevice, overrideDevice, screenWidth } = useDeviceType();

  // Load account properties and leads dynamically from Supabase or localStorage
  useEffect(() => {
    let isMounted = true;

    async function loadUserProperties() {
      if (!isSupabaseConfigured || !supabase) {
        if (isMounted) setProperties(user?.isDemoAccount ? INITIAL_PROPERTIES : []);
        return;
      }

      let authUserId = user?.id;
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user?.id) authUserId = authData.user.id;
      } catch {}

      const orgId = (user as any)?.organizationId || authUserId;

      let query = supabase.from('properties').select('*');
      if (authUserId && !user?.isDemoAccount) {
        const validOrgId = (user as any)?.organization_id || (user as any)?.organizationId;
        const orgFilter = validOrgId ? `,organization_id.eq.${validOrgId}` : '';
        query = query.or(`user_id.eq.${authUserId}${orgFilter}`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error al cargar propiedades de Supabase:', error);
      } else if (data && isMounted) {
        console.log('Propiedades recuperadas de Supabase:', data.length);
        if (data.length > 0) {
          const mappedProps: Property[] = data.map((item: any) => ({
            id: item.id,
            title: item.title || 'Propiedad Inmobiliaria',
            code: item.code || `PROP-${String(item.id).slice(0, 4)}`,
            type: item.type || 'apartment',
            status: item.status || 'available',
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
            description: item.description || 'Excelente propiedad en excelente ubicación.',
            images:
              item.images && item.images.length > 0
                ? item.images
                : [item.image_url || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'],
            createdAt: item.created_at || new Date().toISOString(),
            documents: [],
            featured: item.featured || false,
          }));
          setProperties(mappedProps);
        } else if (user && !user.isDemoAccount) {
          setProperties([]);
        } else {
          setProperties(INITIAL_PROPERTIES);
        }
      }
    }

    loadUserProperties();

    // Query leads for real account from Supabase
    if (isSupabaseConfigured && supabase) {
      supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (isMounted) {
            if (!error && data && data.length > 0) setLeads(data as any);
            else setLeads(user?.isDemoAccount ? INITIAL_LEADS : []);
          }
        });
    }

    // Fetch bot config
    const botUrl = user?.id ? `/api/bot-config?agency_id=${encodeURIComponent(user.id)}` : '/api/bot-config';
    fetch(botUrl)
      .then((res) => res.json())
      .then((data) => {
        if (data.data && isMounted) setBotConfig(data.data);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [user?.id, user?.isDemoAccount]);

  const handleUpdateProperty = (id: string, updates: Partial<Property>) => {
    setProperties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const handleDeleteProperty = (id: string) => {
    setProperties((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAddProperty = async (newPropData: Omit<Property, 'id' | 'createdAt' | 'documents' | 'featured'>) => {
    let authUserId = user?.id;
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user?.id) authUserId = authData.user.id;
      } catch {}
    }

    const rawOp = (newPropData as any).operation_type || (newPropData as any).operation || (Number(newPropData.price) < 5000 ? 'rent' : 'sale');
    const normalizedOp = String(rawOp).toLowerCase().includes('alquiler') || String(rawOp).toLowerCase().includes('rent') ? 'rent' : 'sale';

    const dbPayload: any = {
      user_id: authUserId || null,
      organization_id: (user as any)?.organization_id || null,
      title: newPropData.title || 'Propiedad sin título',
      code: newPropData.code || `PROP-${Math.floor(100 + Math.random() * 900)}`,
      type: newPropData.type || 'apartment',
      operation_type: normalizedOp,
      price: Number(newPropData.price) || 0,
      currency: newPropData.currency || 'USD',
      surface_m2: Number(newPropData.features?.areaM2) || 0,
      area_m2: Number(newPropData.features?.areaM2) || 0,
      bedrooms: Number(newPropData.features?.bedrooms) || 0,
      bathrooms: Number(newPropData.features?.bathrooms) || 0,
      address: newPropData.location?.address || 'Ubicación pendiente',
      city: newPropData.location?.city || 'Buenos Aires',
      zone: newPropData.location?.zone || newPropData.location?.address || 'Palermo',
      description: newPropData.description || '',
      image_url: (newPropData.images && newPropData.images[0]) || '',
      images: newPropData.images || [],
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      console.log('Enviando propiedad a Supabase:', dbPayload);
      const { data, error } = await supabase
        .from('properties')
        .insert([dbPayload])
        .select()
        .single();

      if (error) {
        console.error('ERROR CRÍTICO AL INSERTAR EN SUPABASE:', error);
        alert('Error al guardar en base de datos: ' + error.message);
        return; // NO avanzar con IDs falsos si la base de datos falla
      }

      console.log('Propiedad guardada exitosamente en Supabase con ID real:', data.id);

      const realProperty: Property = {
        id: data.id,
        title: data.title || 'Propiedad Inmobiliaria',
        code: data.code || `PROP-${String(data.id).slice(0, 4)}`,
        type: data.type || 'apartment',
        status: data.status || 'available',
        price: Number(data.price || 0),
        currency: data.currency || 'USD',
        location: {
          address: data.address || 'Ubicación sin especificar',
          city: data.city || 'Buenos Aires',
          zone: data.zone || data.address || 'Palermo',
        },
        features: {
          bedrooms: data.bedrooms || 0,
          bathrooms: data.bathrooms || 0,
          areaM2: data.surface_m2 || data.area_m2 || 0,
          pool: data.pool || false,
          garage: data.garage || false,
          elevator: data.elevator || true,
          airConditioning: data.air_conditioning || true,
        },
        description: data.description || '',
        images:
          data.images && data.images.length > 0
            ? data.images
            : [data.image_url || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'],
        createdAt: data.created_at || new Date().toISOString(),
        documents: [],
        featured: data.featured || false,
      };

      setProperties((prev) => [realProperty, ...prev]);
      return;
    }

    // Fallback for offline demo mode
    const fallbackProp: Property = {
      id: `prop-${Date.now()}`,
      code: newPropData.code || `PROP-${Math.floor(100 + Math.random() * 900)}`,
      title: newPropData.title,
      type: newPropData.type,
      status: newPropData.status || 'available',
      price: newPropData.price,
      currency: newPropData.currency || 'USD',
      location: newPropData.location,
      features: newPropData.features,
      description: newPropData.description,
      images: newPropData.images,
      documents: [],
      featured: false,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setProperties((prev) => [fallbackProp, ...prev]);
  };

  const handleUpdateLeadStatus = async (leadId: string, newStatus: Lead['status']) => {
    try {
      await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      // ignore
    }
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );
  };

  const handleUpdateBotConfig = async (updated: Partial<BotConfig>) => {
    const newConfig = { ...botConfig, ...updated };
    setBotConfig(newConfig);
    try {
      await fetch('/api/bot-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
    } catch {
      // ignore
    }
  };

  const handleInterveneLead = (leadId: string) => {
    setSelectedLeadForChat(leadId);
    handleRouteChange('dashboard-leads');
  };

  const effectiveDevice = forcedDevice || (isMobile ? 'mobile' : 'desktop');

  const handleNavigate = (route: AppRoute) => {
    handleRouteChange(route);
  };

  return (
    <>
      {/* WhatsApp floating button — persistent across all pages */}
      <WhatsAppFloatingButton />
      {effectiveDevice === 'mobile' ? (
        <MobileView
          currentRoute={currentRoute}
          onRouteChange={handleNavigate}
          properties={properties}
          leads={leads}
          botConfig={botConfig}
          selectedLeadForChat={selectedLeadForChat}
          onClearSelectedLead={() => setSelectedLeadForChat(undefined)}
          onInterveneLead={handleInterveneLead}
          onAddProperty={handleAddProperty}
          onUpdateProperty={handleUpdateProperty}
          onDeleteProperty={handleDeleteProperty}
          onUpdateLeadStatus={handleUpdateLeadStatus}
          onUpdateBotConfig={handleUpdateBotConfig}
        />
      ) : (
        <DesktopView
          currentRoute={currentRoute}
          onRouteChange={handleNavigate}
          properties={properties}
          leads={leads}
          botConfig={botConfig}
          selectedLeadForChat={selectedLeadForChat}
          onClearSelectedLead={() => setSelectedLeadForChat(undefined)}
          onInterveneLead={handleInterveneLead}
          onAddProperty={handleAddProperty}
          onUpdateProperty={handleUpdateProperty}
          onDeleteProperty={handleDeleteProperty}
          onUpdateLeadStatus={handleUpdateLeadStatus}
          onUpdateBotConfig={handleUpdateBotConfig}
          onOpenPrompt={handleOpenPrompt}
        />
      )}

      {/* Slide-over Right Drawer Assistant */}
      <ChatSlideOver
        isOpen={slideOverOpen}
        onClose={() => setSlideOverOpen(false)}
        prefilledPrompt={prefilledPrompt}
      />

      {/* Floating Device Switcher Pill */}
      <DeviceSwitcherBadge
        deviceType={deviceType}
        forcedDevice={forcedDevice}
        overrideDevice={overrideDevice}
        screenWidth={screenWidth}
      />
    </>
  );
}

export default function App() {
  // Detectar si la URL actual corresponde al widget embebido antes de montar cualquier layout
  const pathname = typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '';
  const isEmbedRoute = pathname.startsWith('/embed/chat') || pathname.startsWith('/embed-chat');

  if (isEmbedRoute) {
    // Retornar ÚNICAMENTE el widget de chat aislado sin Navbar, sin Footer y sin Layouts de Landing
    return <StandaloneChatWidget />;
  }

  return (
    <LanguageProvider>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </LanguageProvider>
  );
}

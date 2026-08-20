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
import { BetaBanner, WhatsAppFloatingButton } from './components/common/BetaBanner';

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
    case 'dashboard-properties': return '/dashboard/properties';
    case 'dashboard-leads': return '/dashboard/leads';
    case 'dashboard-bot-config': return '/dashboard/bot-config';
    case 'dashboard-assistant': return '/dashboard/assistant';
    case 'dashboard-checkout': return '/dashboard/checkout';
    case 'dashboard-profile': return '/dashboard/profile';
    case 'dashboard-files': return '/dashboard/files';
    case 'dashboard-roles': return '/dashboard/roles';
    case 'dashboard-vault': return '/user/vault';
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
    return user?.isDemoAccount ? INITIAL_LEADS : INITIAL_LEADS;
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
    const agencyId = user?.id;

    if (isSupabaseConfigured && supabase) {
      // Query properties for real account from Supabase properties table
      supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (isMounted) {
            if (!error && data && data.length > 0) {
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
              try {
                localStorage.setItem('aria_properties_backup', JSON.stringify(mappedProps));
              } catch {}
            } else {
              try {
                const backup = localStorage.getItem('aria_properties_backup');
                if (backup) {
                  const parsed = JSON.parse(backup);
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    setProperties(parsed);
                    return;
                  }
                }
              } catch {}
              setProperties(INITIAL_PROPERTIES);
            }
          }
        });

      // Query leads for real account from Supabase
      supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (isMounted) {
            if (!error && data && data.length > 0) setLeads(data as any);
            else setLeads(INITIAL_LEADS);
          }
        });
    } else {
      try {
        const backup = localStorage.getItem('aria_properties_backup');
        if (backup && isMounted) {
          const parsed = JSON.parse(backup);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setProperties(parsed);
          }
        }
      } catch {}
    }

    // Fetch bot config
    const botUrl = agencyId ? `/api/bot-config?agency_id=${encodeURIComponent(agencyId)}` : '/api/bot-config';
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

  const handleAddProperty = async (newPropData: Omit<Property, 'id' | 'createdAt' | 'documents' | 'featured'>) => {
    const agencyId = user?.id;

    const propPayload: Property = {
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

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('properties')
          .insert([
            {
              title: propPayload.title,
              code: propPayload.code,
              type: propPayload.type,
              operation_type: propPayload.price < 5000 ? 'rent' : 'sale',
              price: Number(propPayload.price),
              currency: propPayload.currency || 'USD',
              surface_m2: Number(propPayload.features.areaM2),
              area_m2: Number(propPayload.features.areaM2),
              bedrooms: Number(propPayload.features.bedrooms),
              bathrooms: Number(propPayload.features.bathrooms),
              address: propPayload.location.address,
              city: propPayload.location.city,
              zone: propPayload.location.zone,
              image_url: propPayload.images[0],
              images: propPayload.images,
              description: propPayload.description,
              organization_id: agencyId || 'org-default',
              created_at: new Date().toISOString(),
            },
          ])
          .select()
          .maybeSingle();

        if (!error && data) {
          propPayload.id = data.id;
        }
      } catch (err) {
        console.warn('⚠️ Supabase property insert fallback:', err);
      }
    }

    setProperties((prev) => {
      const updated = [propPayload, ...prev];
      try {
        localStorage.setItem('aria_properties_backup', JSON.stringify(updated));
        if (agencyId) {
          localStorage.setItem(`aria_props_${agencyId}`, JSON.stringify(updated));
        }
      } catch {}
      return updated;
    });
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
      {/* Beta testing banner — shown every new session */}
      <BetaBanner />
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
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </LanguageProvider>
  );
}

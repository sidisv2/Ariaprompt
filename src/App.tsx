import React, { useState, useEffect } from 'react';
import { AppRoute, Property, Lead, BotConfig } from './types';
import { INITIAL_PROPERTIES, INITIAL_LEADS, INITIAL_BOT_CONFIG } from './data/mockData';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { useDeviceType } from './hooks/useDeviceType';
import { DesktopView } from './components/desktop/DesktopView';
import { MobileView } from './components/mobile/MobileView';
import { DeviceSwitcherBadge } from './components/common/DeviceSwitcherBadge';
import { FloatingAssistant } from './components/common/FloatingAssistant';
import { ChatSlideOver } from './components/chat/ChatSlideOver';

const getRouteFromPath = (): AppRoute => {
  // Check pathname first, fallback to legacy hash if user comes from old bookmark
  const path = (window.location.pathname + window.location.hash).toLowerCase();
  if (path.includes('app') || path.includes('producto')) return 'app';
  if (path.includes('soluciones')) return 'soluciones';
  if (path.includes('recursos')) return 'recursos';
  if (path.includes('pricing')) return 'pricing';
  if (path.includes('comparar/manual')) return 'comparar-manual';
  if (path.includes('comparar/crm')) return 'comparar-crm';
  if (path.includes('comparar/chatbots')) return 'comparar-chatbots';
  if (path.includes('dashboard/metrics')) return 'dashboard-metrics';
  if (path.includes('dashboard/properties')) return 'dashboard-properties';
  if (path.includes('dashboard/leads')) return 'dashboard-leads';
  if (path.includes('dashboard/bot-config')) return 'dashboard-bot-config';
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
    case 'app':
    case 'producto': return '/app';
    case 'soluciones': return '/soluciones';
    case 'recursos': return '/recursos';
    case 'pricing': return '/pricing';
    case 'comparar-manual': return '/comparar/manual';
    case 'comparar-crm': return '/comparar/crm';
    case 'comparar-chatbots': return '/comparar/chatbots';
    case 'dashboard-metrics': return '/dashboard/metrics';
    case 'dashboard-properties': return '/dashboard/properties';
    case 'dashboard-leads': return '/dashboard/leads';
    case 'dashboard-bot-config': return '/dashboard/bot-config';
    case 'dashboard-checkout': return '/dashboard/checkout';
    case 'dashboard-profile': return '/dashboard/profile';
    case 'dashboard-files': return '/dashboard/files';
    case 'dashboard-roles': return '/dashboard/roles';
    case 'dashboard-vault': return '/user/vault';
    case 'embed-preview': return '/embed-preview';
    default: return '/';
  }
};

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() => getRouteFromPath());
  const [properties, setProperties] = useState<Property[]>(INITIAL_PROPERTIES);
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
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
    // If user loaded with legacy hash (e.g. /#/soluciones), convert to clean pathname (/soluciones)
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

  // Fetch initial state from server API
  useEffect(() => {
    fetch('/api/properties')
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setProperties(data.data);
      })
      .catch(() => {});

    fetch('/api/leads')
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setLeads(data.data);
      })
      .catch(() => {});

    fetch('/api/bot-config')
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setBotConfig(data.data);
      })
      .catch(() => {});
  }, []);

  const handleAddProperty = async (newPropData: Omit<Property, 'id' | 'createdAt' | 'documents' | 'featured'>) => {
    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPropData),
      });
      const result = await res.json();
      if (result.data) {
        setProperties((prev) => [result.data, ...prev]);
      } else {
        const localProp: Property = {
          id: `prop-${Date.now()}`,
          createdAt: new Date().toISOString().split('T')[0],
          documents: [],
          featured: false,
          ...newPropData,
        };
        setProperties((prev) => [localProp, ...prev]);
      }
    } catch {
      const localProp: Property = {
        id: `prop-${Date.now()}`,
        createdAt: new Date().toISOString().split('T')[0],
        documents: [],
        featured: false,
        ...newPropData,
      };
      setProperties((prev) => [localProp, ...prev]);
    }
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
    <LanguageProvider>
      <AuthProvider>
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
      </AuthProvider>
    </LanguageProvider>
  );
}

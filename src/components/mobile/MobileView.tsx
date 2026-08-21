import React from 'react';
import { AppRoute, Property, Lead, BotConfig } from '../../types';
import { MobileHeader } from './MobileHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileHeroSection } from './MobileHeroSection';
import { MobilePricingSection } from './MobilePricingSection';
import { MobileAuthBottomSheet } from './MobileAuthBottomSheet';
import { MobileDevNotice } from './MobileDevNotice';
import { TechStackBanner } from '../marketing/TechStackBanner';
import { RealUseCaseNarrative } from '../marketing/RealUseCaseNarrative';
import { ComparisonSection } from '../marketing/ComparisonSection';
import { WhyAriaSection } from '../marketing/WhyAriaSection';
import { BentoGridFeatures } from '../marketing/BentoGridFeatures';
import { Playground } from '../playground/Playground';
import { SolutionsGrid } from '../solutions/SolutionsGrid';
import { FAQ } from '../FAQ/FAQ';
import { Footer } from '../marketing/Footer';
import { MetricsView } from '../dashboard/MetricsView';
import { PropertiesView } from '../dashboard/PropertiesView';
import { LeadsView } from '../dashboard/LeadsView';
import { BotConfigView } from '../dashboard/BotConfigView';
import { CheckoutView } from '../dashboard/CheckoutView';
import { CrmIntegrationsView } from '../dashboard/CrmIntegrationsView';
import { SummaryDashboardView } from '../dashboard/SummaryDashboardView';
import { UserProfileDashboard } from '../profile/UserProfileDashboard';
import { UserRolesDashboard } from '../profile/UserRolesDashboard';
import { EmbedChatWidget } from '../embed/EmbedChatWidget';
import { ProductoPage } from '../pages/ProductoPage';
import { SolucionesPage } from '../pages/SolucionesPage';
import { RecursosPage } from '../pages/RecursosPage';
import { TerminosPage } from '../pages/TerminosPage';
import { PrivacidadPage } from '../pages/PrivacidadPage';
import { ReembolsosPage } from '../pages/ReembolsosPage';
import { CheckoutSuccessPage } from '../pages/CheckoutSuccessPage';
import { PublicCatalogPage } from '../../pages/PublicCatalogPage';
import { ProblemSection } from '../marketing/ProblemSection';
import { HowItWorksSection } from '../marketing/HowItWorksSection';
import { InteractiveDemoSection } from '../marketing/InteractiveDemoSection';
import { TechStackSection } from '../marketing/TechStackSection';
import { TrustSecuritySection } from '../marketing/TrustSecuritySection';
import { RestructuredLandingPage } from '../marketing/RestructuredLandingPage';
import { IAParaInmobiliariasPage } from '../../pages/seo/IAParaInmobiliariasPage';
import { AutomatizarWhatsAppPage } from '../../pages/seo/AutomatizarWhatsAppPage';
import { ChatbotVsAgentePage } from '../../pages/seo/ChatbotVsAgentePage';

interface MobileViewProps {
  currentRoute: AppRoute;
  onRouteChange: (route: AppRoute) => void;
  properties: Property[];
  leads: Lead[];
  botConfig: BotConfig;
  selectedLeadForChat?: string;
  onClearSelectedLead: () => void;
  onInterveneLead: (leadId: string) => void;
  onAddProperty: (newProp: Omit<Property, 'id' | 'createdAt' | 'documents' | 'featured'>) => Promise<void>;
  onUpdateLeadStatus: (leadId: string, status: Lead['status']) => Promise<void>;
  onUpdateBotConfig: (config: Partial<BotConfig>) => Promise<void>;
  onOpenPrompt?: (promptText: string) => void;
}

export const MobileView: React.FC<MobileViewProps> = ({
  currentRoute,
  onRouteChange,
  properties,
  leads,
  botConfig,
  selectedLeadForChat,
  onClearSelectedLead,
  onInterveneLead,
  onAddProperty,
  onUpdateLeadStatus,
  onUpdateBotConfig,
  onOpenPrompt,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
      <MobileHeader currentRoute={currentRoute} onRouteChange={onRouteChange} />
      <MobileDevNotice />

      <main className="flex-1 pb-20">
        {currentRoute === 'dashboard-metrics' ? (
          <SummaryDashboardView leads={leads} onRouteChange={onRouteChange} />
        ) : currentRoute === 'dashboard-properties' ? (
          <PropertiesView properties={properties} onAddProperty={onAddProperty} />
        ) : currentRoute === 'dashboard-leads' ? (
          <LeadsView
            leads={leads}
            onUpdateLeadStatus={onUpdateLeadStatus}
            selectedLeadForChat={selectedLeadForChat}
            onClearSelectedLead={onClearSelectedLead}
          />
        ) : currentRoute === 'dashboard-bot-config' ? (
          <BotConfigView botConfig={botConfig} onUpdateBotConfig={onUpdateBotConfig} />
        ) : currentRoute === 'dashboard-checkout' ? (
          <CheckoutView onRouteChange={onRouteChange} />
        ) : currentRoute === 'dashboard-integrations' ? (
          <CrmIntegrationsView />
        ) : currentRoute === 'dashboard-roles' ? (
          <UserRolesDashboard onRouteChange={onRouteChange} />
        ) : (currentRoute === 'dashboard-files' || currentRoute === 'dashboard-profile') ? (
          <UserProfileDashboard
            initialTab={currentRoute === 'dashboard-profile' ? 'profile' : 'files'}
            onRouteChange={onRouteChange}
          />
        ) : (currentRoute === 'aria-ai' || currentRoute === 'producto') ? (
          <div>
            <ProductoPage onRouteChange={onRouteChange} onOpenPrompt={onOpenPrompt} />
            <Footer />
          </div>
        ) : currentRoute === 'soluciones' ? (
          <div>
            <SolucionesPage onRouteChange={onRouteChange} onOpenPrompt={onOpenPrompt} />
            <Footer />
          </div>
        ) : currentRoute === 'recursos' ? (
          <div>
            <RecursosPage onRouteChange={onRouteChange} />
            <Footer onRouteChange={onRouteChange} />
          </div>
        ) : currentRoute === 'terminos' ? (
          <div>
            <TerminosPage onRouteChange={onRouteChange} />
          </div>
        ) : currentRoute === 'privacidad' ? (
          <div>
            <PrivacidadPage onRouteChange={onRouteChange} />
          </div>
        ) : currentRoute === 'reembolsos' ? (
          <div>
            <ReembolsosPage onRouteChange={onRouteChange} />
          </div>
        ) : currentRoute === 'checkout-success' ? (
          <div>
            <CheckoutSuccessPage onRouteChange={onRouteChange} />
          </div>
        ) : currentRoute === 'embed-preview' ? (
          <div className="p-4 space-y-4 text-center">
            <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30">
              <h2 className="text-lg font-bold text-white">Widget Embebible Mobile</h2>
            </div>
            <EmbedChatWidget botConfig={botConfig} properties={properties} />
          </div>
        ) : currentRoute === 'ia-para-inmobiliarias' ? (
          <div>
            <IAParaInmobiliariasPage onRouteChange={onRouteChange} onOpenPrompt={onOpenPrompt} />
          </div>
        ) : currentRoute === 'whatsapp-para-inmobiliarias' || currentRoute === 'automatizar-whatsapp-inmobiliaria' ? (
          <div>
            <AutomatizarWhatsAppPage onRouteChange={onRouteChange} onOpenPrompt={onOpenPrompt} />
          </div>
        ) : currentRoute === 'chatbot-inmobiliario' || currentRoute === 'chatbot-vs-agente-ia' ? (
          <div>
            <ChatbotVsAgentePage onRouteChange={onRouteChange} onOpenPrompt={onOpenPrompt} />
          </div>
        ) : currentRoute === 'catalog' || currentRoute === 'explorar' ? (
          <div>
            <PublicCatalogPage onRouteChange={onRouteChange} />
          </div>
        ) : currentRoute === 'pricing' ? (
          <div>
            <MobilePricingSection onRouteChange={onRouteChange} />
            <FAQ />
            <Footer />
          </div>
        ) : (
          <div className="space-y-4 animate-page-fade">
            <RestructuredLandingPage onRouteChange={onRouteChange} onOpenPrompt={onOpenPrompt} />
            <Footer onRouteChange={onRouteChange} />
          </div>
        )}
      </main>

      <MobileBottomNav currentRoute={currentRoute} onRouteChange={onRouteChange} />

      {/* Native Mobile Auth Bottom Sheet Modal */}
      <MobileAuthBottomSheet />
    </div>
  );
};

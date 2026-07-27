import React from 'react';
import { AppRoute, Property, Lead, BotConfig } from '../../types';
import { MobileHeader } from './MobileHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileHeroSection } from './MobileHeroSection';
import { MobilePricingSection } from './MobilePricingSection';
import { MobileAuthBottomSheet } from './MobileAuthBottomSheet';
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
import { ProblemSection } from '../marketing/ProblemSection';
import { HowItWorksSection } from '../marketing/HowItWorksSection';
import { InteractiveDemoSection } from '../marketing/InteractiveDemoSection';
import { TechStackSection } from '../marketing/TechStackSection';
import { TrustSecuritySection } from '../marketing/TrustSecuritySection';
import { IntegrationsSection } from '../marketing/IntegrationsSection';
import { FinalCtaSection } from '../marketing/FinalCtaSection';
import { TermsPage } from '../legal/TermsPage';
import { PrivacyPage } from '../legal/PrivacyPage';
import { RefundPage } from '../legal/RefundPage';

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
            <Footer onRouteChange={onRouteChange} />
          </div>
        ) : currentRoute === 'soluciones' ? (
          <div>
            <SolucionesPage onRouteChange={onRouteChange} onOpenPrompt={onOpenPrompt} />
            <Footer onRouteChange={onRouteChange} />
          </div>
        ) : currentRoute === 'recursos' ? (
          <div>
            <RecursosPage onRouteChange={onRouteChange} />
            <Footer onRouteChange={onRouteChange} />
          </div>
        ) : currentRoute === 'terms' ? (
          <TermsPage onRouteChange={onRouteChange} />
        ) : currentRoute === 'privacy' ? (
          <PrivacyPage onRouteChange={onRouteChange} />
        ) : currentRoute === 'refund' ? (
          <RefundPage onRouteChange={onRouteChange} />
        ) : currentRoute === 'embed-preview' ? (
          <div className="p-4 space-y-4 text-center">
            <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30">
              <h2 className="text-lg font-bold text-white">Widget Embebible Mobile</h2>
            </div>
            <EmbedChatWidget botConfig={botConfig} properties={properties} />
          </div>
        ) : currentRoute === 'pricing' ? (
          <div>
            <MobilePricingSection onRouteChange={onRouteChange} />
            <FAQ />
            <Footer onRouteChange={onRouteChange} />
          </div>
        ) : (
          <div className="space-y-8 animate-page-fade">
            {/* Section 2: Mobile Hero */}
            <MobileHeroSection sampleProperties={properties} onRouteChange={onRouteChange} />

            {/* Section 2: Banner de Stack e Integraciones */}
            <TechStackBanner />

            {/* Section 3: Caso de Uso Narrativo */}
            <RealUseCaseNarrative />

            {/* Section 4: Comparativa Sin Aria vs Con Aria */}
            <ComparisonSection />

            {/* Section 5: ¿Por qué Aria y no ChatGPT o CRM tradicional? */}
            <WhyAriaSection />

            {/* Section 6: Sección de Problema */}
            <ProblemSection />

            {/* Section 7: Cómo Funciona (4 Pasos) */}
            <HowItWorksSection />

            {/* Section 8: Funcionalidades Clave */}
            <BentoGridFeatures />

            {/* Section 9: Demo Interactiva */}
            <InteractiveDemoSection />

            {/* Section 10: Sellos de Confianza y Seguridad */}
            <TrustSecuritySection />

            {/* Section 10: Integraciones */}
            <IntegrationsSection />

            {/* Section 11: Precios / Cotización */}
            <MobilePricingSection onRouteChange={onRouteChange} />

            {/* Section 12: Arquitectura y Stack Técnico */}
            <TechStackSection />

            {/* Section 13: Preguntas Frecuentes (FAQ) */}
            <FAQ />

            {/* Section 13: CTA Final de Cierre */}
            <FinalCtaSection />

            {/* Section 14: Footer Completo */}
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

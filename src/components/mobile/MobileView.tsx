import React from 'react';
import { AppRoute, Property, Lead, BotConfig } from '../../types';
import { MobileHeader } from './MobileHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileHeroSection } from './MobileHeroSection';
import { MobilePricingSection } from './MobilePricingSection';
import { MobileAuthBottomSheet } from './MobileAuthBottomSheet';
import { SocialProofMarquee } from '../marketing/SocialProofMarquee';
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
import { UserProfileDashboard } from '../profile/UserProfileDashboard';
import { UserRolesDashboard } from '../profile/UserRolesDashboard';
import { EmbedChatWidget } from '../embed/EmbedChatWidget';
import { ProductoPage } from '../pages/ProductoPage';
import { SolucionesPage } from '../pages/SolucionesPage';
import { RecursosPage } from '../pages/RecursosPage';
import { ProblemSection } from '../marketing/ProblemSection';
import { HowItWorksSection } from '../marketing/HowItWorksSection';
import { InteractiveDemoSection } from '../marketing/InteractiveDemoSection';
import { TestimonialsSection } from '../marketing/TestimonialsSection';
import { TrustSecuritySection } from '../marketing/TrustSecuritySection';
import { IntegrationsSection } from '../marketing/IntegrationsSection';
import { FinalCtaSection } from '../marketing/FinalCtaSection';

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-24 selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Mobile Top Header Bar */}
      <MobileHeader
        currentRoute={currentRoute}
        onRouteChange={onRouteChange}
        agencyName={botConfig.agencyName}
      />

      {/* Main Content Flow */}
      <main className="flex-1 overflow-x-hidden animate-page-fade">
        {currentRoute === 'dashboard-metrics' && (
          <div className="p-2 sm:p-4">
            <MetricsView leads={leads} onInterveneLead={onInterveneLead} />
          </div>
        )}

        {currentRoute === 'dashboard-properties' && (
          <div className="p-2 sm:p-4">
            <PropertiesView properties={properties} onAddProperty={onAddProperty} />
          </div>
        )}

        {currentRoute === 'dashboard-leads' && (
          <div className="p-2 sm:p-4">
            <LeadsView
              leads={leads}
              onUpdateLeadStatus={onUpdateLeadStatus}
              selectedLeadForChat={selectedLeadForChat}
              onClearSelectedLead={onClearSelectedLead}
            />
          </div>
        )}

        {currentRoute === 'dashboard-bot-config' && (
          <div className="p-2 sm:p-4">
            <BotConfigView botConfig={botConfig} onUpdateBotConfig={onUpdateBotConfig} />
          </div>
        )}

        {currentRoute === 'dashboard-checkout' && (
          <div className="p-2 sm:p-4">
            <CheckoutView onRouteChange={onRouteChange} />
          </div>
        )}

        {currentRoute === 'dashboard-roles' && (
          <div className="p-2 sm:p-4">
            <UserRolesDashboard onRouteChange={onRouteChange} />
          </div>
        )}

        {(currentRoute === 'dashboard-files' || currentRoute === 'dashboard-profile') && (
          <div className="p-2 sm:p-4">
            <UserProfileDashboard
              initialTab={currentRoute === 'dashboard-profile' ? 'profile' : 'files'}
              onRouteChange={onRouteChange}
            />
          </div>
        )}

        {(currentRoute === 'aria-ai' || currentRoute === 'producto') && (
          <div>
            <ProductoPage onRouteChange={onRouteChange} onOpenPrompt={onOpenPrompt} />
            <Footer />
          </div>
        )}

        {currentRoute === 'soluciones' && (
          <div>
            <SolucionesPage onRouteChange={onRouteChange} onOpenPrompt={onOpenPrompt} />
            <Footer />
          </div>
        )}

        {currentRoute === 'recursos' && (
          <div>
            <RecursosPage onRouteChange={onRouteChange} />
            <Footer />
          </div>
        )}

        {currentRoute === 'embed-preview' && (
          <div className="p-4 space-y-4 text-center">
            <div className="p-5 bg-slate-900 border border-emerald-500/30 rounded-2xl space-y-2">
              <h2 className="text-base font-bold text-white">Widget Embebible de IA</h2>
              <p className="text-xs text-slate-400">
                Chatea con nuestra IA en tiempo real. Escribe tus dudas y consulta información del catálogo.
              </p>
            </div>
            <EmbedChatWidget botConfig={botConfig} properties={properties} />
          </div>
        )}

        {currentRoute === 'pricing' && (
          <div>
            <MobilePricingSection onRouteChange={onRouteChange} />
            <FAQ />
            <Footer />
          </div>
        )}

        {(currentRoute === 'marketing' || !currentRoute) && (
          <div>
            {/* Section 2: Mobile Hero */}
            <MobileHeroSection sampleProperties={properties} onRouteChange={onRouteChange} />

            {/* Section 3: Barra de Confianza (Social Proof) */}
            <SocialProofMarquee />

            {/* Section 4: Sección de Problema */}
            <ProblemSection />

            {/* Section 5: Cómo Funciona (4 Pasos) */}
            <HowItWorksSection />

            {/* Section 6: Funcionalidades Clave */}
            <BentoGridFeatures />

            {/* Section 7: Demo Interactiva */}
            <InteractiveDemoSection />

            {/* Section 8: Testimonios / Resultados */}
            <TestimonialsSection />

            {/* Section 9: Sellos de Confianza y Seguridad */}
            <TrustSecuritySection />

            {/* Section 10: Integraciones */}
            <IntegrationsSection />

            {/* Section 11: Precios / Cotización */}
            <MobilePricingSection onRouteChange={onRouteChange} />

            {/* Section 12: Preguntas Frecuentes (FAQ) */}
            <FAQ />

            {/* Section 13: CTA Final de Cierre */}
            <FinalCtaSection />

            {/* Section 14: Footer Completo */}
            <Footer />
          </div>
        )}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <MobileBottomNav
        currentRoute={currentRoute}
        onRouteChange={onRouteChange}
        propertiesCount={properties.length}
        leadsCount={leads.length}
      />

      {/* Mobile Exclusive Bottom Sheet Auth Modal */}
      <MobileAuthBottomSheet />

    </div>
  );
};

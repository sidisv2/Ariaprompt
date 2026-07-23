import React, { useState } from 'react';
import { AppRoute, Property, Lead, BotConfig } from '../../types';
import { Header } from '../common/Header';
import { DashboardSidebar } from '../common/DashboardSidebar';
import { HeroSection } from '../marketing/HeroSection';
import { SocialProofMarquee } from '../marketing/SocialProofMarquee';
import { BentoGridFeatures } from '../marketing/BentoGridFeatures';
import { PricingSection } from '../marketing/PricingSection';
import { Footer } from '../marketing/Footer';
import { MetricsView } from '../dashboard/MetricsView';
import { PropertiesView } from '../dashboard/PropertiesView';
import { LeadsView } from '../dashboard/LeadsView';
import { BotConfigView } from '../dashboard/BotConfigView';
import { CheckoutView } from '../dashboard/CheckoutView';
import { UserProfileDashboard } from '../profile/UserProfileDashboard';
import { UserRolesDashboard } from '../profile/UserRolesDashboard';
import { UserVaultPage } from '../profile/UserVaultPage';
import { EmbedChatWidget } from '../embed/EmbedChatWidget';
import { AuthModal } from '../auth/AuthModal';
import { SolutionsGrid } from '../solutions/SolutionsGrid';
import { FAQ } from '../FAQ/FAQ';
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
import { DiscountOfferModal } from '../common/DiscountOfferModal';
import { RoiSavingsCalculatorSection } from '../marketing/RoiSavingsCalculatorSection';
import { ComparisonPage } from '../pages/ComparisonPage';
import { useAuth } from '../../context/AuthContext';
import { Tag, Sparkles } from 'lucide-react';

interface DesktopViewProps {
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

export const DesktopView: React.FC<DesktopViewProps> = ({
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
  const { authModalOpen, modalTab, closeAuthModal } = useAuth();
  const [showDiscountModal, setShowDiscountModal] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* 5% Discount Top Announcement Bar */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 py-1.5 px-4 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-inner animate-discount-pulse" onClick={() => setShowDiscountModal(true)}>
        <Tag className="w-3.5 h-3.5 fill-current" />
        <span>¡Oferta de Bienvenida! Reclama tu <strong>5% de Descuento Adicional</strong> con el código <u>OFERTA5</u></span>
        <Sparkles className="w-3.5 h-3.5" />
      </div>

      {/* PC Top Navbar */}
      <Header
        currentRoute={currentRoute}
        onRouteChange={onRouteChange}
        agencyName={botConfig.agencyName}
      />

      {/* Main Content Layout */}
      {currentRoute.startsWith('dashboard-') ? (
        <div className="flex-1 flex min-h-[calc(100vh-4rem)] animate-page-fade">
          <DashboardSidebar
            currentRoute={currentRoute}
            onRouteChange={onRouteChange}
            propertiesCount={properties.length}
            leadsCount={leads.length}
          />
          
          <main className="flex-1 overflow-x-hidden bg-slate-950 p-6">
            {currentRoute === 'dashboard-metrics' && (
              <MetricsView leads={leads} onInterveneLead={onInterveneLead} />
            )}
            {currentRoute === 'dashboard-properties' && (
              <PropertiesView properties={properties} onAddProperty={onAddProperty} />
            )}
            {currentRoute === 'dashboard-leads' && (
              <LeadsView
                leads={leads}
                onUpdateLeadStatus={onUpdateLeadStatus}
                selectedLeadForChat={selectedLeadForChat}
                onClearSelectedLead={onClearSelectedLead}
              />
            )}
            {currentRoute === 'dashboard-bot-config' && (
              <BotConfigView botConfig={botConfig} onUpdateBotConfig={onUpdateBotConfig} />
            )}
            {currentRoute === 'dashboard-checkout' && (
              <CheckoutView onRouteChange={onRouteChange} />
            )}
            {currentRoute === 'dashboard-roles' && (
              <UserRolesDashboard onRouteChange={onRouteChange} />
            )}
            {currentRoute === 'dashboard-vault' && (
              <UserVaultPage onRouteChange={onRouteChange} />
            )}
            {(currentRoute === 'dashboard-files' || currentRoute === 'dashboard-profile') && (
              <UserProfileDashboard
                initialTab={currentRoute === 'dashboard-profile' ? 'profile' : 'files'}
                onRouteChange={onRouteChange}
              />
            )}
          </main>
        </div>
      ) : (currentRoute === 'aria-ai' || currentRoute === 'producto') ? (
        <main className="flex-1 animate-page-fade">
          <ProductoPage onRouteChange={onRouteChange} onOpenPrompt={onOpenPrompt} />
          <Footer onRouteChange={onRouteChange} />
        </main>
      ) : currentRoute === 'soluciones' ? (
        <main className="flex-1 animate-page-fade">
          <SolucionesPage onRouteChange={onRouteChange} onOpenPrompt={onOpenPrompt} />
          <Footer onRouteChange={onRouteChange} />
        </main>
      ) : currentRoute === 'recursos' ? (
        <main className="flex-1 animate-page-fade">
          <RecursosPage onRouteChange={onRouteChange} />
          <Footer onRouteChange={onRouteChange} />
        </main>
      ) : currentRoute === 'comparar-manual' ? (
        <main className="flex-1 animate-page-fade">
          <ComparisonPage type="manual" onRouteChange={onRouteChange} />
        </main>
      ) : currentRoute === 'comparar-crm' ? (
        <main className="flex-1 animate-page-fade">
          <ComparisonPage type="crm" onRouteChange={onRouteChange} />
        </main>
      ) : currentRoute === 'comparar-chatbots' ? (
        <main className="flex-1 animate-page-fade">
          <ComparisonPage type="chatbots" onRouteChange={onRouteChange} />
        </main>
      ) : currentRoute === 'embed-preview' ? (
        <div className="flex-1 p-8 max-w-4xl mx-auto space-y-6 text-center animate-page-fade">
          <div className="p-8 rounded-3xl bg-slate-900 border border-emerald-500/30 space-y-4">
            <h2 className="text-2xl font-bold text-white">Interfaz del Widget Embebible</h2>
            <p className="text-xs text-slate-400 max-w-xl mx-auto">
              Chatea directamente con nuestra IA comercial integrada en la tarjeta del widget. Muestra tu catálogo, cualifica leads y analiza ideas en tiempo real.
            </p>
          </div>
          <EmbedChatWidget botConfig={botConfig} properties={properties} />
        </div>
      ) : currentRoute === 'pricing' ? (
        <main className="flex-1 animate-page-fade">
          <PricingSection onRouteChange={onRouteChange} />
          <FAQ />
          <Footer onRouteChange={onRouteChange} />
        </main>
      ) : (
        <main className="flex-1 animate-page-fade">
          {/* Section 1: Hero con Asistente Interactivo Cloudairy */}
          <HeroSection sampleProperties={properties} onRouteChange={onRouteChange} />

          {/* Section 2: Barra de Confianza (Social Proof) */}
          <SocialProofMarquee />

          {/* Section 3: Sección de Problema (Agitación de Dolor) */}
          <ProblemSection />

          {/* Section 4: Calculadora Interactiva de Ahorro / Pérdidas de Leads */}
          <RoiSavingsCalculatorSection onRouteChange={onRouteChange} />

          {/* Section 5: Cómo Funciona (Flujo en 4 Pasos) */}
          <HowItWorksSection />

          {/* Section 6: Funcionalidades Clave (Bento Grid estilo Cloudairy) */}
          <BentoGridFeatures />

          {/* Section 7: Demo Interactiva */}
          <InteractiveDemoSection />

          {/* Section 8: Testimonios con Métricas de Resultado */}
          <TestimonialsSection />

          {/* Section 9: Sellos de Confianza y Seguridad Enterprise */}
          <TrustSecuritySection />

          {/* Section 10: Integraciones (WhatsApp, Calendar, CRMs, Portales) */}
          <IntegrationsSection />

          {/* Section 11: Precios / Cotización */}
          <PricingSection onRouteChange={onRouteChange} />

          {/* Section 12: Preguntas Frecuentes (FAQ) */}
          <FAQ />

          {/* Section 13: CTA Final de Cierre */}
          <FinalCtaSection />

          {/* Section 14: Footer Completo */}
          <Footer onRouteChange={onRouteChange} />
        </main>
      )}

      {/* Desktop Centered Popup Modal */}
      <AuthModal isOpen={authModalOpen} onClose={closeAuthModal} initialTab={modalTab} />

      {/* 5% Discount Offer Modal */}
      <DiscountOfferModal
        isOpen={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        onApplyDiscount={() => {
          setShowDiscountModal(false);
          onRouteChange('pricing');
        }}
      />
    </div>
  );
};

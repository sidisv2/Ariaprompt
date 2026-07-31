import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { AppRoute } from '../../types';
import { ShieldCheck, FileText, ArrowLeft, ExternalLink, HelpCircle } from 'lucide-react';
import { Footer } from '../marketing/Footer';

interface TerminosPageProps {
  onRouteChange: (route: AppRoute) => void;
}

export const TerminosPage: React.FC<TerminosPageProps> = ({ onRouteChange }) => {
  const { lang } = useLanguage();

  const isEn = lang === 'en';
  const isPt = lang === 'pt';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Header Banner */}
      <div className="bg-slate-900/80 border-b border-white/10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <button
            onClick={() => onRouteChange('marketing')}
            className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isEn ? 'Back to Home' : isPt ? 'Voltar al Inicio' : 'Volver al Inicio'}</span>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">Aria Prop Legal</span>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                {isEn ? 'Terms of Service' : isPt ? 'Termos de Serviço' : 'Términos de Servicio'}
              </h1>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            {isEn
              ? 'Last updated: July 2026. Please read these terms carefully before using Aria Prop.'
              : isPt
              ? 'Última atualização: Julho de 2026. Leia atentamente estes termos antes de usar a Aria Prop.'
              : 'Última actualización: Julio de 2026. Lea atentamente estos términos antes de utilizar Aria Prop.'}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 text-xs sm:text-sm leading-relaxed text-slate-300">
        
        {/* Placeholder Info Banner */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3">
          <HelpCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold mb-0.5">
              {isEn ? 'Information for Domain Approval & Legal Identity' : isPt ? 'Informação para Aprovação do Domínio' : 'Información para Aprovisión de Licencia Paddle & Identidad Legal'}
            </strong>
            <span>
              {isEn
                ? 'Services and subscriptions are billed and processed globally via Paddle.com (our Merchant of Record).'
                : isPt
                ? 'Os serviços e assinaturas são faturados e processados globalmente via Paddle.com (nosso Merchant of Record).'
                : 'Los servicios y suscripciones son facturados y procesados globalmente a través de Paddle.com (nuestro Merchant of Record).'}
            </span>
          </div>
        </div>

        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
            <span>1.</span>
            <span>{isEn ? 'Acceptance of Terms & Service Description' : isPt ? 'Aceitação dos Termos e Descrição do Serviço' : 'Aceptación de los Términos y Descripción del Servicio'}</span>
          </h2>
          <p>
            {isEn
              ? 'Aria Prop ("the Service") is a B2B Software as a Service (SaaS) property sales assistant and CRM integration platform provided by Valentin Lautaro Morales ("Company", "we", "us"). By registering, accessing or using the platform, you agree to be bound by these Terms of Service.'
              : isPt
              ? 'A Aria Prop ("o Serviço") é uma plataforma B2B de assistência comercial imobiliária e integração com CRMs fornecida por Valentin Lautaro Morales ("Empresa", "nós"). Ao se registrar ou usar a plataforma, você concorda em cumprir estes Termos de Serviço.'
              : 'Aria Prop ("el Servicio") es una plataforma B2B de software como servicio (SaaS) para asistencia comercial inmobiliaria, cualificación de prospectos y sincronización de catálogos con CRMs, provista por Valentin Lautaro Morales ("La Empresa", "nosotros"). Al registrarse, acceder o utilizar la plataforma, usted acepta quedar vinculado por estos Términos de Servicio.'}
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
            <span>2.</span>
            <span>{isEn ? 'Billing, Subscriptions & Payment Processing (Paddle)' : isPt ? 'Faturamento, Assinaturas e Processamento de Pagamento (Paddle)' : 'Facturación, Suscripciones y Procesamiento de Pagos (Paddle)'}</span>
          </h2>
          <p>
            {isEn
              ? 'Our order process and payment processing are conducted by our online reseller and Merchant of Record, Paddle.com. Paddle.com is the Merchant of Record for all our orders. Paddle handles all customer service inquiries, billing, taxes (VAT/Sales Tax) and returns.'
              : isPt
              ? 'Nosso processo de pedido e processamento de pagamentos são realizados pelo nosso revendedor online e Merchant of Record, Paddle.com. A Paddle gerencia todas as dúvidas de atendimento ao cliente, faturamento, impostos e reembolsos.'
              : 'Nuestras suscripciones y procesos de pago son gestionados y facturados de forma segura por nuestro distribuidor autorizado y Merchant of Record, Paddle.com. Paddle.com actúa como el comerciante registrado para todas las órdenes de Aria Prop, gestionando la cobranza, el cálculo de impuestos aplicables (IVA/Sales Tax), facturación y atención al cliente sobre transacciones.'}
          </p>
          <p>
            {isEn
              ? 'Subscriptions (Solo Agent, Agency Pro, Enterprise) auto-renew periodically (monthly or annually) unless canceled prior to the renewal date via the dashboard or Paddle receipt.'
              : isPt
              ? 'As assinaturas são renovadas automaticamente, a menos que sejam canceladas antes da data de renovação no painel de controle ou no recibo da Paddle.'
              : 'Las suscripciones (Solo Agent, Agency Pro, Enterprise) se renuevan automáticamente al final de cada período (mensual o anual) salvo que el usuario cancele su suscripción desde su panel de control (/dashboard/checkout) o mediante el enlace provisto en el recibo digital de Paddle antes del inicio del siguiente ciclo.'}
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
            <span>3.</span>
            <span>{isEn ? 'User Accounts & Acceptable Use' : isPt ? 'Contas de Usuário e Uso Aceitável' : 'Cuentas de Usuario y Uso Aceptable'}</span>
          </h2>
          <p>
            {isEn
              ? 'You are responsible for maintaining the confidentiality of your account credentials and for all activities conducted under your account. You agree not to use the Service for illegal purposes, spamming, or fraudulent real estate offers.'
              : isPt
              ? 'Você é responsável por manter a confidencialidade de suas credenciais de conta e por todas as atividades realizadas sob sua conta.'
              : 'Usted es responsable de mantener la confidencialidad de las credenciales de su cuenta y de todas las actividades realizadas en su espacio de trabajo. Queda prohibido utilizar el servicio para spamming, difusión de inmuebles fraudulentos o cualquier uso indebido contrario a las leyes aplicables.'}
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
            <span>4.</span>
            <span>{isEn ? 'Intellectual Property & Data Ownership' : isPt ? 'Propriedade Intelectual e Propriedade dos Dados' : 'Propiedad Intelectual y Propiedad de los Datos'}</span>
          </h2>
          <p>
            {isEn
              ? 'You retain all ownership rights to the property catalog data and lead information uploaded to Aria Prop. Aria Prop retains all rights to the software, trademarks, AI engines, and interface code.'
              : isPt
              ? 'Você retém todos os direitos sobre os dados de imóveis e leads carregados. A Aria Prop detém todos os direitos sobre o software e código.'
              : 'Usted conserva la propiedad exclusiva de los datos de sus inmuebles y la información de los leads procesados. Aria Prop conserva la propiedad exclusiva de la plataforma, marcas, motores de inteligencia artificial y código fuente.'}
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
            <span>5.</span>
            <span>{isEn ? 'Limitation of Liability & Availability' : isPt ? 'Limitação de Responsabilidade' : 'Limitación de Responsabilidad y Disponibilidad'}</span>
          </h2>
          <p>
            {isEn
              ? 'Aria Prop strives to maintain 99.9% uptime. However, the Service is provided "as is" without warranty of any kind. In no event shall Company or Paddle be liable for indirect, incidental, or consequential damages.'
              : isPt
              ? 'A Aria Prop busca manter 99,9% de disponibilidade. O Serviço é fornecido "como está".'
              : 'Aria Prop realiza sus mejores esfuerzos para garantizar una disponibilidad del 99.9%. El servicio se proporciona "tal cual". En ningún caso La Empresa o Paddle serán responsables por daños indirectos, lucros cesantes o pérdidas derivadas de interrupciones temporales de terceros.'}
          </p>
        </section>

        {/* Section 6: Contact */}
        <section className="space-y-3 p-5 rounded-2xl bg-slate-900 border border-white/10">
          <h2 className="text-base font-bold text-emerald-400">
            {isEn ? '6. Contact & Legal Entity' : isPt ? '6. Contato e Entidade Legal' : '6. Contacto y Entidad Legal'}
          </h2>
          <p className="text-slate-300">
            {isEn
              ? 'If you have questions about these Terms, please contact our legal team:'
              : isPt
              ? 'Se você tiver dúvidas sobre estes Termos, entre em contato:'
              : 'Para cualquier consulta relacionada con estos Términos de Servicio, contáctenos en:'}
          </p>
          <ul className="space-y-1 text-slate-300 text-xs font-mono">
            <li>• <strong>{isEn ? 'Legal Holder / Company:' : isPt ? 'Razão Social:' : 'Razón Social / Titular Legal:'}</strong> Valentin Lautaro Morales</li>
            <li>• <strong>{isEn ? 'Tax ID / CUIT:' : isPt ? 'ID Fiscal:' : 'Identificación Fiscal / CUIT:'}</strong> CUIT 20-46398072-2 (20463980722)</li>
            <li>• <strong>{isEn ? 'Address:' : isPt ? 'Endereço:' : 'Dirección Fiscal:'}</strong> San Rafael, Argentina</li>
            <li>• <strong>Email Support:</strong> <a href="mailto:soporte@ariaprop.online" className="text-emerald-400 underline">soporte@ariaprop.online</a></li>
            <li>• <strong>Billing Merchant:</strong> Paddle.com Market Ltd, Judo Bank Building, 70 Red Lion St, London WC1R 4NA, UK</li>
          </ul>
        </section>

      </main>

      <Footer onRouteChange={onRouteChange} />
    </div>
  );
};

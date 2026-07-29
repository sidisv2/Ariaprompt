import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { AppRoute } from '../../types';
import { ShieldCheck, Lock, ArrowLeft, Database, CheckCircle2 } from 'lucide-react';
import { Footer } from '../marketing/Footer';

interface PrivacidadPageProps {
  onRouteChange: (route: AppRoute) => void;
}

export const PrivacidadPage: React.FC<PrivacidadPageProps> = ({ onRouteChange }) => {
  const { language } = useLanguage();

  const isEn = language === 'en';
  const isPt = language === 'pt';

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
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">Aria Prop Security & Compliance</span>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                {isEn ? 'Privacy Policy' : isPt ? 'Política de Privacidade' : 'Política de Privacidad'}
              </h1>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            {isEn
              ? 'Last updated: July 2026. How we collect, use, and safeguard your agency and lead data.'
              : isPt
              ? 'Última atualização: Julho de 2026. Como coletamos e protegemos seus dados.'
              : 'Última actualización: Julio de 2026. Cómo recopilamos, protegemos y resguardamos los datos de su agencia e inventario.'}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 text-xs sm:text-sm leading-relaxed text-slate-300">
        
        {/* Security Highlights Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 flex items-center gap-3">
            <Lock className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <strong className="block text-white text-xs">{isEn ? '256-bit SSL/TLS Encryption' : 'Cifrado SSL/TLS 256-bit'}</strong>
              <span className="text-[11px] text-slate-400">{isEn ? 'In-transit and rest protection' : 'Protección en tránsito y reposo'}</span>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 flex items-center gap-3">
            <Database className="w-5 h-5 text-teal-400 shrink-0" />
            <div>
              <strong className="block text-white text-xs">{isEn ? 'Isolated Supabase Vault' : 'Bóveda Privada Supabase'}</strong>
              <span className="text-[11px] text-slate-400">{isEn ? 'Row Level Security per agency' : 'Aislamiento de RLS por agencia'}</span>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <strong className="block text-white text-xs">Paddle Certified</strong>
              <span className="text-[11px] text-slate-400">{isEn ? 'Merchant of Record PCI-DSS' : 'Procesamiento PCI-DSS vía Paddle'}</span>
            </div>
          </div>
        </div>

        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
            <span>1.</span>
            <span>{isEn ? 'Data Controller & Responsibility' : isPt ? 'Controlador de Dados' : 'Responsable del Tratamiento de Datos'}</span>
          </h2>
          <p>
            {isEn
              ? 'Aria Prop ("Company", "we") is committed to protecting the privacy of real estate agencies, independent brokers, and their leads. The entity responsible for processing your account data is [NOMBRE_DE_LA_EMPRESA_O_TITULAR].'
              : isPt
              ? 'A Aria Prop está comprometida em proteger a privacidade das agências e corretores.'
              : 'Aria Prop ("La Empresa") se compromete a proteger la privacidad de las agencias inmobiliarias, corredores independientes y prospectos. El responsable del tratamiento de los datos de su cuenta es [NOMBRE_DE_LA_EMPRESA_O_TITULAR].'}
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
            <span>2.</span>
            <span>{isEn ? 'Information We Collect' : isPt ? 'Informações que Coletamos' : 'Información que Recopilamos'}</span>
          </h2>
          <p>
            {isEn
              ? 'We collect: (a) Account registration info (name, business email, agency name, phone); (b) Real estate inventory details provided or synced via CRMs (Tokko Broker, EasyBroker); (c) Lead interactions qualified by our AI engine.'
              : isPt
              ? 'Coletamos: (a) Informações de conta (nome, e-mail, telefone); (b) Detalhes dos imóveis; (c) Conversas dos leads.'
              : 'Recopilamos: (a) Datos de registro de cuenta (nombre, correo corporativo, agencia, teléfono); (b) Datos de catálogo e inventarios inmobiliarios provistos o sincronizados vía CRM (Tokko Broker, EasyBroker); (c) Historial de consultas y cualificación de leads comercializados a través de nuestro motor de IA.'}
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
            <span>3.</span>
            <span>{isEn ? 'Payment Data & Paddle Processing' : isPt ? 'Dados de Pagamento e Processamento pela Paddle' : 'Datos de Pago y Procesamiento por Paddle'}</span>
          </h2>
          <p>
            {isEn
              ? 'Payment details (credit card numbers, billing addresses) are processed directly and securely by Paddle.com Market Ltd. Aria Prop does not store full credit card data or payment card CVVs on its servers.'
              : isPt
              ? 'Os dados de pagamento são processados diretamente e com segurança pela Paddle.com.'
              : 'Los datos de pago (números de tarjeta de crédito, código de seguridad CVV, direcciones de facturación) son recopilados y procesados de manera directa y cifrada por Paddle.com Market Ltd. Aria Prop no almacena ni recopila datos de tarjeta completos en sus servidores.'}
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
            <span>4.</span>
            <span>{isEn ? 'Data Storage & Security Measures' : isPt ? 'Armazenamento de Dados e Segurança' : 'Almacenamiento y Medidas de Seguridad'}</span>
          </h2>
          <p>
            {isEn
              ? 'All data is stored in cloud databases (Supabase) protected with Row Level Security (RLS), ensuring strict data isolation per agency workspace. Transmissions are encrypted using TLS 1.3 / SSL 256-bit.'
              : isPt
              ? 'Todos os dados são armazenados na nuvem (Supabase) protegidos com RLS.'
              : 'Todos los datos de cuentas e inventarios se almacenan en infraestructura cloud protegida mediante Supabase con políticas de Row Level Security (RLS) que garantizan que ninguna agencia pueda acceder a los datos de otra. Las transmisiones usan cifrado de grado bancario SSL/TLS 256-bit.'}
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
            <span>5.</span>
            <span>{isEn ? 'User Rights & Data Deletion' : isPt ? 'Direitos do Usuário e Exclusão de Dados' : 'Derechos del Usuario y Supresión de Datos'}</span>
          </h2>
          <p>
            {isEn
              ? 'You have the right to access, export, modify or request the full deletion of your personal and agency data at any time by contacting privacy@ariaprop.online.'
              : isPt
              ? 'Você tem o direito de solicitar o acesso, modificação ou exclusão total dos seus dados.'
              : 'Usted tiene derecho a acceder, rectificar, exportar o solicitar la eliminación total de sus datos personales y catálogo comercial en cualquier momento escribiendo a privacidad@ariaprop.online.'}
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-3 p-5 rounded-2xl bg-slate-900 border border-white/10">
          <h2 className="text-base font-bold text-emerald-400">
            {isEn ? '6. Contact Privacy Team' : isPt ? '6. Contato de Privacidade' : '6. Contacto de Privacidad'}
          </h2>
          <ul className="space-y-1 text-slate-300 text-xs font-mono">
            <li>• <strong>{isEn ? 'Company / Legal Holder:' : 'Razón Social / Titular:'}</strong> [NOMBRE_DE_LA_EMPRESA_O_TITULAR]</li>
            <li>• <strong>{isEn ? 'Privacy Email:' : 'Email de Privacidad:'}</strong> <a href="mailto:privacidad@ariaprop.online" className="text-emerald-400 underline">privacidad@ariaprop.online</a></li>
            <li>• <strong>{isEn ? 'General Support Email:' : 'Email de Soporte:'}</strong> <a href="mailto:soporte@ariaprop.online" className="text-emerald-400 underline">soporte@ariaprop.online</a></li>
          </ul>
        </section>

      </main>

      <Footer onRouteChange={onRouteChange} />
    </div>
  );
};

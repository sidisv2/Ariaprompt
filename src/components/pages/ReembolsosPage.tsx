import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { AppRoute } from '../../types';
import { RefreshCw, CheckCircle2, ArrowLeft, CreditCard, ShieldCheck, HelpCircle, ExternalLink } from 'lucide-react';
import { Footer } from '../marketing/Footer';

interface ReembolsosPageProps {
  onRouteChange: (route: AppRoute) => void;
}

export const ReembolsosPage: React.FC<ReembolsosPageProps> = ({ onRouteChange }) => {
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
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">Aria Prop Guarantees</span>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                {isEn ? 'Refund & Cancellation Policy' : isPt ? 'Política de Reembolso e Cancelamento' : 'Política de Reembolso y Cancelación'}
              </h1>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            {isEn
              ? 'Transparent 14-day refund guarantee and easy one-click cancellation processed via Paddle.'
              : isPt
              ? 'Garantia de reembolso de 14 dias e cancelamento fácil processado via Paddle.'
              : 'Garantía transparente de reembolso de 14 días y cancelación simple en 1 clic procesada a través de Paddle.'}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 text-xs sm:text-sm leading-relaxed text-slate-300">
        
        {/* Highlight Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/30 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>{isEn ? '14-Day Money Back Guarantee' : 'Garantía de 14 Días'}</span>
            </div>
            <p className="text-xs text-slate-300">
              {isEn
                ? 'Full refund available within 14 days of purchase if technical issues occur or service does not meet requirements.'
                : 'Reembolso completo disponible durante los primeros 14 días si el servicio presenta fallas técnicas comprobables o no cumple sus expectativas.'}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/30 space-y-2">
            <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
              <CreditCard className="w-4 h-4" />
              <span>{isEn ? 'Processed by Paddle.com' : 'Procesado por Paddle.com'}</span>
            </div>
            <p className="text-xs text-slate-300">
              {isEn
                ? 'Refunds are automatically issued back to your original payment method via Paddle within 5-10 business days.'
                : 'Los reembolsos se procesan automáticamente hacia su tarjeta o medio de pago original a través de Paddle en 5-10 días hábiles.'}
            </p>
          </div>
        </div>

        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
            <span>1.</span>
            <span>{isEn ? 'Refund Eligibility & 14-Day Guarantee' : isPt ? 'Elegibilidade de Reembolso' : 'Elegibilidad de Reembolso y Garantía de 14 Días'}</span>
          </h2>
          <p>
            {isEn
              ? 'Aria Prop offers a 14-day refund policy for all subscription purchases (Solo Agent, Agency Pro). If you experience technical errors, duplicate charges, or the service does not function as described, you can request a 100% refund within 14 calendar days from the transaction date.'
              : isPt
              ? 'A Aria Prop oferece uma política de reembolso de 14 dias para todas as assinaturas.'
              : 'Aria Prop ofrece una política de reembolso de 14 días para todas las compras de suscripción (Solo Agent, Agency Pro). Si experimenta fallos técnicos no resueltos, duplicación de cargos o si el servicio no satisface sus requisitos comerciales, puede solicitar la devolución del 100% de lo abonado dentro de los 14 días corridos desde la fecha del cargo.'}
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
            <span>2.</span>
            <span>{isEn ? 'How to Request a Refund' : isPt ? 'Como Solicitar um Reembolso' : 'Cómo Solicitar un Reembolso'}</span>
          </h2>
          <p>
            {isEn
              ? 'To request a refund, simply send an email to pagos@ariaprop.online or soporte@ariaprop.online with: (a) Your registered account email; (b) The order or receipt number from Paddle. Alternatively, you can request a refund directly using Paddle’s buyer support link provided in your email receipt.'
              : isPt
              ? 'Para solicitar um reembolso, envie um e-mail para pagos@ariaprop.online com o e-mail da sua conta e o número do recibo da Paddle.'
              : 'Para solicitar su reembolso, envíe un correo electrónico a pagos@ariaprop.online o soporte@ariaprop.online incluyendo: (a) El correo electrónico registrado en su cuenta de Aria Prop; (b) El número de orden o recibo emitido por Paddle. De manera alternativa, puede abrir un ticket de reembolso directamente desde el enlace provisto en el recibo digital enviado por Paddle.com.'}
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
            <span>3.</span>
            <span>{isEn ? 'Subscription Cancellation Policy' : isPt ? 'Política de Cancelamento de Assinatura' : 'Política de Cancelación de Suscripción'}</span>
          </h2>
          <p>
            {isEn
              ? 'You can cancel your subscription at any time with no cancellation fees. To cancel, navigate to your workspace dashboard (/dashboard/checkout) and click "Cancel Subscription", or use the cancel link in your Paddle billing email. Once canceled, you will retain full access until the end of your current billing period.'
              : isPt
              ? 'Você pode cancelar sua assinatura a qualquer momento sem taxas de cancelamento.'
              : 'Usted puede cancelar su suscripción en cualquier momento sin penalizaciones ni comisiones adicionales. Para cancelar, acceda a su panel (/dashboard/checkout) y seleccione "Cancelar Suscripción", o bien utilice el enlace de gestión provisto por Paddle en los correos de facturación. Al cancelar, conservará acceso completo a su plan hasta que finalice el ciclo facturado.'}
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
            <span>4.</span>
            <span>{isEn ? 'Processing & Merchant of Record Role' : isPt ? 'Processamento e Papel da Paddle' : 'Tiempo de Procesamiento y Rol de Paddle'}</span>
          </h2>
          <p>
            {isEn
              ? 'All refunds are approved and executed through Paddle.com Market Ltd. Refunds usually reflect on your bank or credit card statement within 5 to 10 business days depending on your financial institution.'
              : isPt
              ? 'Todos os reembolsos são aprovados e executados através da Paddle.com.'
              : 'Todos los reembolsos son autorizados y liquidados a través de Paddle.com Market Ltd. La acreditación del importe en su extracto bancario o tarjeta de crédito suele completarse en un plazo de 5 a 10 días hábiles conforme a los tiempos de su entidad bancaria.'}
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-3 p-5 rounded-2xl bg-slate-900 border border-white/10">
          <h2 className="text-base font-bold text-emerald-400">
            {isEn ? '5. Payment & Refund Contacts' : isPt ? '5. Contatos de Pagamento' : '5. Contacto para Pagos y Reembolsos'}
          </h2>
          <ul className="space-y-1 text-slate-300 text-xs font-mono">
            <li>• <strong>{isEn ? 'Company / Legal Holder:' : 'Razón Social / Titular:'}</strong> MORALES VALENTIN LAUTARO</li>
            <li>• <strong>{isEn ? 'Tax ID / CUIT:' : isPt ? 'ID Fiscal:' : 'Identificación Fiscal / CUIT:'}</strong> CUIT 20-46398072-2 (20463980722)</li>
            <li>• <strong>{isEn ? 'Address:' : isPt ? 'Endereço:' : 'Dirección Fiscal / Domicilio Legal:'}</strong> Mariano Moreno 78, Villa Atuel, Mendoza, Argentina</li>
            <li>• <strong>{isEn ? 'Refunds Department:' : 'Departamento de Reembolsos:'}</strong> <a href="mailto:pagos@ariaprop.online" className="text-emerald-400 underline">pagos@ariaprop.online</a></li>
            <li>• <strong>{isEn ? 'Customer Support:' : 'Soporte Comercial:'}</strong> <a href="mailto:soporte@ariaprop.online" className="text-emerald-400 underline">soporte@ariaprop.online</a></li>
            <li>• <strong>Merchant of Record Support:</strong> <a href="https://paddle.net" target="_blank" rel="noreferrer" className="text-emerald-400 underline inline-flex items-center gap-1">Paddle Buyer Support <ExternalLink className="w-3 h-3" /></a></li>
          </ul>
        </section>

      </main>

      <Footer onRouteChange={onRouteChange} />
    </div>
  );
};

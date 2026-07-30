import React, { useState } from 'react';
import { Calculator, TrendingUp, AlertTriangle, DollarSign, Clock, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';

interface RoiLeadCalculatorProps {
  onPlanSelect?: (planId: string) => void;
}

export function RoiLeadCalculator({ onPlanSelect }: RoiLeadCalculatorProps) {
  // Configurable / Editable parameters with realistic defaults for LATAM
  const [monthlyLeads, setMonthlyLeads] = useState<number>(60);
  const [afterHoursPercentage, setAfterHoursPercentage] = useState<number>(35); // 35% arrives after 8 PM or weekends
  const [avgCommissionUsd, setAvgCommissionUsd] = useState<number>(1800); // Average commission in USD
  const [conversionRatePercent, setConversionRatePercent] = useState<number>(3); // 3% conversion rate of leads to deals

  // Dynamic calculations
  const afterHoursLeads = Math.round((monthlyLeads * afterHoursPercentage) / 100);
  const potentialDealsLostPerMonth = (afterHoursLeads * (conversionRatePercent / 100));
  const revenueLostPerMonthUsd = Math.round(potentialDealsLostPerMonth * avgCommissionUsd);
  const revenueLostPerYearUsd = revenueLostPerMonthUsd * 12;

  // Plan costs
  const ariaMonthlyCostUsd = 35; // Solo Agent Plan
  const netGainPerMonthUsd = Math.max(0, revenueLostPerMonthUsd - ariaMonthlyCostUsd);
  const roiMultiplier = revenueLostPerMonthUsd > 0 ? (revenueLostPerMonthUsd / ariaMonthlyCostUsd).toFixed(1) : '0';

  return (
    <div className="w-full max-w-5xl mx-auto my-12 p-6 md:p-8 bg-slate-900/90 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-xl text-slate-100 font-sans">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
          <Calculator className="w-4 h-4" />
          Calculadora de Impacto Inmobiliario
        </div>
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-3">
          ¿Cuánto dinero está perdiendo tu inmobiliaria por demoras en respuesta?
        </h3>
        <p className="text-slate-400 text-sm md:text-base">
          Ingresá los datos de tu agencia para calcular cuántas comisiones quedán en riesgo al no responder consultas de noche o fines de semana.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Controls Section */}
        <div className="lg:col-span-6 space-y-6 bg-slate-950/60 p-6 rounded-2xl border border-slate-800/80">
          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Parámetros de tu Inmobiliaria
          </h4>

          {/* Slider 1: Monthly Leads */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <label className="text-slate-300 font-medium">Leads recibidos por mes:</label>
              <span className="text-emerald-400 font-bold text-base">{monthlyLeads} prospectos</span>
            </div>
            <input
              type="range"
              min="10"
              max="300"
              step="5"
              value={monthlyLeads}
              onChange={(e) => setMonthlyLeads(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>10 leads</span>
              <span>150 leads</span>
              <span>300 leads</span>
            </div>
          </div>

          {/* Slider 2: After Hours Percentage */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <label className="text-slate-300 font-medium">Consultas fuera de horario / fines de semana:</label>
              <span className="text-emerald-400 font-bold text-base">{afterHoursPercentage}% ({afterHoursLeads} leads)</span>
            </div>
            <input
              type="range"
              min="10"
              max="70"
              step="5"
              value={afterHoursPercentage}
              onChange={(e) => setAfterHoursPercentage(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <p className="text-[11px] text-slate-400 italic">
              * Ajustá este valor según tu experiencia real con tus propios leads.
            </p>
          </div>

          {/* Input 3: Average Commission USD */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Comisión promedio por operación (USD):</label>
            <div className="relative rounded-xl shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-slate-500">$</span>
              </div>
              <input
                type="number"
                min="100"
                max="50000"
                step="100"
                value={avgCommissionUsd}
                onChange={(e) => setAvgCommissionUsd(Math.max(0, Number(e.target.value)))}
                className="block w-full rounded-xl border border-slate-700 bg-slate-900 pl-8 pr-4 py-2.5 text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-emerald-500 text-sm font-semibold"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Ej: Comisión típica por venta de propiedad mediana (~$60.000 USD al 3%) o alquileres de mayor valor.
            </p>
          </div>

          {/* Slider 4: Estimated Conversion Rate */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <label className="text-slate-300 font-medium">Tasa de conversión estimada a cierre:</label>
              <span className="text-emerald-400 font-bold text-base">{conversionRatePercent}%</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={conversionRatePercent}
              onChange={(e) => setConversionRatePercent(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
        </div>

        {/* Results Output Section */}
        <div className="lg:col-span-6 space-y-5 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6 rounded-2xl border border-emerald-500/20 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <TrendingUp className="w-32 h-32 text-emerald-400" />
          </div>

          <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Resultado del Análisis de Pérdida
          </h4>

          {/* Metric 1: Lost Leads */}
          <div className="flex items-center justify-between p-4 bg-slate-900/80 rounded-xl border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 rounded-lg text-amber-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Leads nocturnos en riesgo al mes</p>
                <p className="text-lg font-bold text-white">{afterHoursLeads} prospectos</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full">
              Sin atención 24/7
            </span>
          </div>

          {/* Metric 2: Revenue Lost Monthly */}
          <div className="p-5 bg-gradient-to-r from-red-500/10 via-slate-900 to-slate-900 rounded-xl border border-red-500/20">
            <p className="text-xs text-slate-400 font-medium mb-1">Comisiones en riesgo estimado por mes:</p>
            <p className="text-3xl font-extrabold text-red-400">
              ${revenueLostPerMonthUsd.toLocaleString('en-US')} USD <span className="text-sm font-normal text-slate-400">/mes</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Equivalente a <strong className="text-red-300">${revenueLostPerYearUsd.toLocaleString('en-US')} USD</strong> al año en oportunidades que se enfrían.
            </p>
          </div>

          {/* Metric 3: ROI with Aria Prop */}
          <div className="p-5 bg-gradient-to-r from-emerald-500/10 via-slate-900 to-slate-900 rounded-xl border border-emerald-500/30">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Con Aria Prop ($35/mes)
              </span>
              <span className="text-xs font-extrabold text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-full">
                ROI {roiMultiplier}x
              </span>
            </div>
            <p className="text-sm text-slate-300">
              Recuperando incluso 1 sola operación nocturna al mes, obtenés una ganancia estimada de:
            </p>
            <p className="text-2xl font-black text-emerald-400 mt-2">
              +${netGainPerMonthUsd.toLocaleString('en-US')} USD <span className="text-xs text-slate-400 font-normal">de retorno neto al mes</span>
            </p>
          </div>

          {/* CTA Button */}
          <button
            onClick={() => onPlanSelect ? onPlanSelect('starter') : (window.location.href = '/pricing')}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm transition-all duration-200 shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>Evitá perder leads con Aria Prop desde $35/mes</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}

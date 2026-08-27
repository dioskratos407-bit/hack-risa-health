'use client';

import React from 'react';
import { CrossDataCorrelations } from '@/components/prioritized/CrossDataCorrelations';
import {
  GitCompare,
  HeartPulse,
  FlaskConical,
  Pill,
  Wifi,
  BrainCircuit,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Database,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export default function CorrelacionDatosPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Page Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
              <GitCompare className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Correlación & Fusión de Datos Multi-Fuente
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-0.5">
                Cruce determinista y fundamentación clínica entre telemetría continua, historia médica electrónica (EHR), biomarcadores y telemetría de red
              </p>
            </div>
          </div>
        </div>

        {/* Clinical Rationale & Sustentación Teórica */}
        <div className="rounded-xl bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/40 border border-indigo-100 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Sustentación Clínica del Cruce Multidimensional
            </h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            En entornos clínicos complejos, monitorizar exclusivamente la serie temporal de signos vitales genera una alta tasa de falsos positivos y diagnósticos tardíos. La correlación multi-base de datos del sistema <strong className="font-semibold text-slate-800">RISA</strong> fundamenta sus decisiones unificando los 4 dominios clínicos bajo la columna pivote <code className="font-mono bg-white px-1 py-0.5 rounded border border-indigo-200 text-indigo-700 font-bold">patient_id</code> y una ventana temporal deslizante:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
            {/* Rationale 1 */}
            <div className="p-3.5 rounded-xl bg-white border border-indigo-100/80 shadow-xs space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-amber-50 text-amber-600">
                  <HeartPulse className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-bold text-slate-800">1. Antecedentes (EHR)</h3>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Modulan la línea base fisiológica: una taquicardia o hipotensión aguda no se interpreta igual en un paciente con insuficiencia cardíaca previa que en uno sin comorbilidades.
              </p>
            </div>

            {/* Rationale 2 */}
            <div className="p-3.5 rounded-xl bg-white border border-indigo-100/80 shadow-xs space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-cyan-50 text-cyan-600">
                  <FlaskConical className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-bold text-slate-800">2. Biomarcadores (30d)</h3>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Confirman la etiología celular: niveles séricos alterados de Lactato o Troponina corroboran si una alteración en signos vitales es choque séptico o daño miocárdico.
              </p>
            </div>

            {/* Rationale 3 */}
            <div className="p-3.5 rounded-xl bg-white border border-indigo-100/80 shadow-xs space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-violet-50 text-violet-600">
                  <Pill className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-bold text-slate-800">3. Farmacoterapia (30d)</h3>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Permite discriminar respuestas farmacológicas esperadas (ej. bradicardia tras betabloqueantes o vasodilatación) de deterioros primarios del paciente.
              </p>
            </div>

            {/* Rationale 4 */}
            <div className="p-3.5 rounded-xl bg-white border border-indigo-100/80 shadow-xs space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-rose-50 text-rose-600">
                  <Wifi className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-bold text-slate-800">4. Red & Telemetría (7d)</h3>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Discrimina fallas de captura de red (<code className="font-mono text-[10px]">DATA_GAP</code> por latencia o desconexión del concentrador) de paradas cardíacas o pérdida real de señal vital.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Correlations Component with Recharts and Schema Graph */}
      <CrossDataCorrelations />
    </div>
  );
}

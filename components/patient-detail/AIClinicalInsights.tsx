'use client';

import React from 'react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import { AIInsightsData } from '@/lib/mockAIInsights';
import { BrainCircuit, FileSearch, Loader2 } from 'lucide-react';

export type InsightStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface AIClinicalInsightsProps {
  status: InsightStatus;
  insightsData: AIInsightsData | null;
}

const Header: React.FC<{ subtitle: string }> = ({ subtitle }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
        <BrainCircuit className="h-6 w-6" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">Hallazgos Destacados (IA)</h2>
        <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
      </div>
    </div>
    <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-200 self-start sm:self-center">
      Solo soporte analítico - No diagnóstico
    </span>
  </div>
);

export const AIClinicalInsights: React.FC<AIClinicalInsightsProps> = ({ status, insightsData }) => {
  if (status === 'loading') {
    return (
      <div className="w-full bg-white rounded-xl shadow-sm border-l-4 border-l-indigo-500 border-y border-r border-slate-200 p-6 space-y-5">
        <Header subtitle="Analizando el contexto completo del paciente..." />
        <div className="flex items-center gap-3 text-indigo-600 py-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">Generando análisis contextual con IA...</span>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-slate-100 rounded-full animate-pulse w-full" />
          <div className="h-3 bg-slate-100 rounded-full animate-pulse w-5/6" />
          <div className="h-3 bg-slate-100 rounded-full animate-pulse w-2/3" />
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="w-full bg-white rounded-xl shadow-sm border-l-4 border-l-slate-300 border-y border-r border-slate-200 p-6 space-y-3">
        <Header subtitle="No se pudo obtener el análisis" />
        <p className="text-sm text-slate-500">
          Ocurrió un error al generar o recuperar el análisis contextual. Se reintentará en la próxima detección.
        </p>
      </div>
    );
  }

  if (status === 'idle' || !insightsData) {
    return (
      <div className="w-full bg-white rounded-xl shadow-sm border-l-4 border-l-slate-300 border-y border-r border-slate-200 p-6 space-y-3">
        <Header subtitle="Sin análisis generado todavía" />
        <p className="text-sm text-slate-500">
          Aún no se ha detectado una condición de prioridad alta que amerite un análisis contextual por IA para este
          paciente. Reproduce la simulación en &quot;Viaje en el Tiempo&quot; para generar uno.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border-l-4 border-l-indigo-500 border-y border-r border-slate-200 p-6 space-y-5">
      <Header subtitle="Análisis contextual de todas las variables monitoreadas" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start pt-1">
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <p className="text-slate-700 leading-relaxed font-normal text-xs sm:text-sm">
              {insightsData.objectiveAnalysis}
            </p>
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
              <FileSearch className="w-3.5 h-3.5 text-indigo-500" />
              <span>Variables Analizadas:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {insightsData.analyzedSources.map((source, idx) => (
                <span
                  key={idx}
                  className="bg-slate-100 text-slate-700 text-xs font-medium py-1 px-2.5 rounded-md border border-slate-200 flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  {source}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 uppercase tracking-wider pb-1">
            <span>Métricas con Desviación Detectada</span>
            <span>Tendencia reciente</span>
          </div>

          {insightsData.keyAnomalies.map((anomaly) => (
            <div
              key={anomaly.metric}
              className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs hover:border-slate-300 transition-colors"
            >
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-800 block">
                  {anomaly.label} ({anomaly.metric})
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-extrabold font-mono ${
                      anomaly.isDanger ? 'text-red-600' : 'text-emerald-600'
                    }`}
                  >
                    {anomaly.change}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">Variación reciente</span>
                </div>
              </div>

              <div className="h-10 w-28 shrink-0">
                <ResponsiveContainer width="100%" height={40}>
                  <LineChart data={anomaly.sparklineData}>
                    <Line
                      type="monotone"
                      dataKey="val"
                      stroke={anomaly.isDanger ? '#ef4444' : '#2563eb'}
                      strokeWidth={2.5}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIClinicalInsights;

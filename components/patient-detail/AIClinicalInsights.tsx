'use client';

import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import { mockAIInsights, AIInsightsData } from '@/lib/mockAIInsights';
import { BrainCircuit, FileSearch, ShieldCheck } from 'lucide-react';

export interface AIClinicalInsightsProps {
  insightsData?: AIInsightsData;
}

export const AIClinicalInsights: React.FC<AIClinicalInsightsProps> = ({
  insightsData = mockAIInsights,
}) => {
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border-l-4 border-l-indigo-500 border-y border-r border-slate-200 p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">
              Hallazgos Destacados (IA)
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Procesamiento analítico de parámetros fisiológicos y telemetría
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-200 self-start sm:self-center">
          Solo soporte analítico - No diagnóstico
        </span>
      </div>

      {/* Main Grid: Left Column Objective Analysis & Sources | Right Column Sparkline Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start pt-1">
        {/* Left Column: Objective Analysis & Sources */}
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <p className="text-slate-700 leading-relaxed font-normal text-xs sm:text-sm">
              {insightsData.objectiveAnalysis}
            </p>
          </div>

          {/* Sources Section */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
              <FileSearch className="w-3.5 h-3.5 text-indigo-500" />
              <span>Fuentes Analizadas:</span>
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

        {/* Right Column: Sparkline Anomaly Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 uppercase tracking-wider pb-1">
            <span>Métricas con Desviación Detectada</span>
            <span>Tendencia 1h</span>
          </div>

          {insightsData.keyAnomalies.map((anomaly) => (
            <div
              key={anomaly.metric}
              className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs hover:border-slate-300 transition-colors"
            >
              {/* Left Side: Metric Name & Change */}
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
                  <span className="text-[11px] text-slate-400 font-medium">
                    Variación reciente
                  </span>
                </div>
              </div>

              {/* Right Side: Recharts Sparkline */}
              <div className="h-10 w-28 shrink-0">
                {isMounted ? (
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
                ) : (
                  <div className="h-10 w-28 bg-slate-200/60 rounded-md animate-pulse" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIClinicalInsights;

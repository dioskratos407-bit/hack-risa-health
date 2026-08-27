'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { getPatientDetailById } from '@/lib/mockTwinData';
import { PatientHeader } from '@/components/patient-detail/PatientHeader';
import { AIClinicalInsights, InsightStatus } from '@/components/patient-detail/AIClinicalInsights';
import { AIInsightsData } from '@/lib/mockAIInsights';
import { PatientEventLog } from '@/components/patient-detail/PatientEventLog';
import { TimeTravelClock } from '@/components/patient-detail/TimeTravelClock';
import { useSimulatedClock } from '@/components/patient-detail/useSimulatedClock';
import { useGlobalSimulation } from '@/components/simulation/GlobalSimulationContext';
import { Clock, History } from 'lucide-react';

function mapInsightRow(row: any): AIInsightsData {
  return {
    analyzedSources: row.analyzed_variables || [],
    objectiveAnalysis: row.objective_analysis,
    keyAnomalies: (row.key_anomalies || []).map((k: any) => ({
      metric: k.metric,
      label: k.label,
      change: k.change,
      isDanger: k.isDanger,
      sparklineData: k.sparklineData || [],
    })),
  };
}

export default function PatientDetailPage() {
  const params = useParams();
  const rawId = typeof params?.id === 'string' ? params.id : 'PAT-0001';
  const patient = getPatientDetailById(rawId);

  // Active tab state: 'eventos' | 'reloj'
  const [activeTab, setActiveTab] = useState<'reloj' | 'eventos'>('reloj');

  // Hallazgos Destacados: se hidrata desde el último análisis contextual persistido
  // (generado por Gemini cuando el motor de priorización detecta algo HIGH/CRITICAL).
  // Nunca se muestran datos inventados: mientras no exista un análisis real, el estado
  // es 'idle' (o 'loading' mientras se genera uno nuevo) y el panel lo comunica así.
  const [liveInsight, setLiveInsight] = useState<AIInsightsData | null>(null);
  const [insightStatus, setInsightStatus] = useState<InsightStatus>('idle');

  const fetchInsight = useCallback(async () => {
    try {
      const res = await fetch(`/api/insights?patientId=${encodeURIComponent(rawId)}`);
      const json = await res.json();
      if (json.success && json.data) {
        setLiveInsight(mapInsightRow(json.data));
        setInsightStatus('ready');
      } else if (json.success) {
        setInsightStatus('idle');
      } else {
        setInsightStatus('error');
      }
    } catch {
      setInsightStatus('error');
    }
  }, [rawId]);

  useEffect(() => {
    setLiveInsight(null);
    setInsightStatus('idle');
    fetchInsight();
  }, [rawId, fetchInsight]);

  const handleAnalysisEvent = useCallback(
    (event: 'start' | 'done' | 'skipped') => {
      if (event === 'start') {
        setInsightStatus('loading');
      } else if (event === 'done') {
        fetchInsight();
      } else {
        // 'skipped' (cooldown activo o fallo de Gemini): vuelve al último estado válido.
        setInsightStatus((prev) => (prev === 'loading' ? (liveInsight ? 'ready' : 'idle') : prev));
      }
    },
    [fetchInsight, liveInsight]
  );

  // Reloj de simulación compartido a nivel de página: así "Viaje en el Tiempo" y
  // "Log de Eventos" ven el mismo avance de timeT y no se reinicia al cambiar de tab.
  const clock = useSimulatedClock(rawId, handleAnalysisEvent);

  // Cuando la Simulación del Sistema genera un nuevo análisis de IA para este paciente
  // (el análisis corre server-side dentro del tick), refresca "Hallazgos Destacados".
  const { focusedInsightVersion } = useGlobalSimulation();
  useEffect(() => {
    if (focusedInsightVersion > 0) fetchInsight();
  }, [focusedInsightVersion, fetchInsight]);

  const tabs = [
    {
      id: 'reloj',
      label: 'Viaje en el Tiempo',
      icon: History,
    },
    {
      id: 'eventos',
      label: 'Log de Eventos',
      icon: Clock,
    },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Top Patient Header Container */}
      <section className="w-full">
        <PatientHeader patient={patient} />
      </section>

      {/* AI Clinical Insights Panel (Analytical Support - Non Diagnostic) */}
      <section className="w-full">
        <AIClinicalInsights status={insightStatus} insightsData={liveInsight} />
      </section>

      {/* Tabs Navigation Bar */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-xs px-4 md:px-6 pt-2">
        <div className="flex items-center gap-2 sm:gap-8 border-b border-slate-200 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center gap-2 py-3 px-1 text-sm transition-all duration-150 border-b-2 cursor-pointer whitespace-nowrap
                  ${
                    isActive
                      ? 'border-blue-600 text-blue-600 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-700 font-medium'
                  }
                `}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Dynamic Tab Content Renderer */}
      <section className="w-full">
        {activeTab === 'reloj' && <TimeTravelClock clock={clock} />}
        {activeTab === 'eventos' && (
          <PatientEventLog records={clock.data} currentTimeISO={clock.currentTimeISO} loading={clock.loading} />
        )}
      </section>
    </div>
  );
}

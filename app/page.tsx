'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { MetricCards, DashboardTotals } from '@/components/dashboard/MetricCards';
import { RiskTable, DashboardSignal } from '@/components/dashboard/RiskTable';
import { formatRelativeTime } from '@/lib/formatRelativeTime';
import { useGlobalSimulation } from '@/components/simulation/GlobalSimulationContext';
import { ShieldAlert, RefreshCw, AlertCircle } from 'lucide-react';

// Mientras la simulación corre, los datos cambian cada pocos segundos: se refresca
// seguido para que las tarjetas no se vean congeladas. En reposo no hay nada que
// actualizar, así que el intervalo es mucho más largo.
const AUTO_REFRESH_RUNNING_MS = 6_000;
const AUTO_REFRESH_IDLE_MS = 30_000;

interface RawSignal {
  id: string;
  patientId: string;
  riskScore: number;
  priorityLevel: 'MEDIUM' | 'HIGH' | 'CRITICAL';
  signalType: string;
  lastUpdateISO: string;
}

export default function HomePage() {
  const [totals, setTotals] = useState<DashboardTotals | null>(null);
  const [signals, setSignals] = useState<DashboardSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const { running, insightVersion } = useGlobalSimulation();

  const fetchDashboard = useCallback(async (isBackground: boolean) => {
    if (isBackground) setRefreshing(true);
    try {
      const res = await fetch('/api/dashboard');
      const json = await res.json();
      if (!json.success) {
        setError(json.error || 'No se pudo cargar el dashboard.');
        return;
      }
      setError(null);
      setTotals(json.totals);
      setSignals(
        (json.recentSignals as RawSignal[]).map((s) => ({
          id: s.id,
          patientId: s.patientId,
          riskScore: s.riskScore,
          priorityLevel: s.priorityLevel,
          signalType: s.signalType,
          lastUpdate: formatRelativeTime(s.lastUpdateISO),
        }))
      );
      setLastFetched(new Date());
    } catch (err: any) {
      setError(err.message || 'No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard(false);
  }, [fetchDashboard]);

  useEffect(() => {
    const interval = setInterval(
      () => fetchDashboard(true),
      running ? AUTO_REFRESH_RUNNING_MS : AUTO_REFRESH_IDLE_MS
    );
    return () => clearInterval(interval);
  }, [fetchDashboard, running]);

  // Refresco inmediato cuando la simulación produce un diagnóstico nuevo, sin esperar
  // al siguiente intervalo.
  useEffect(() => {
    if (insightVersion > 0) fetchDashboard(true);
  }, [insightVersion, fetchDashboard]);

  return (
    <div className="space-y-6">
      {/* Metric Summary Cards Section */}
      <section>
        <MetricCards totals={totals} loading={loading} />
      </section>

      {error && (
        <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-3 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Prioritized Patient Risk Table Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                Señales de Riesgo Recientes
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Últimas alertas generadas por el motor de priorización, en toda la base de pacientes
              </p>
            </div>
          </div>

          <button
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-blue-600 font-medium bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{lastFetched ? `Actualizado ${formatRelativeTime(lastFetched.toISOString())}` : 'Actualizar'}</span>
          </button>
        </div>

        {/* Risk Table */}
        <RiskTable signals={signals} loading={loading} />
      </section>
    </div>
  );
}

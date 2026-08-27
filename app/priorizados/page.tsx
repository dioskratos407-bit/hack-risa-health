'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PrioritizedHeader, FilterOption } from '@/components/prioritized/PrioritizedHeader';
import { AlertGrid } from '@/components/prioritized/AlertGrid';
import { PrioritizedPatient } from '@/lib/mockPrioritized';
import { formatRelativeTime } from '@/lib/formatRelativeTime';
import { useGlobalSimulation } from '@/components/simulation/GlobalSimulationContext';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface RawPrioritized {
  id: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  riskScore: number;
  alertReason: string;
  timestampISO: string;
  hasDiagnosis: boolean;
  insightCount: number;
  source: 'ALERT' | 'DIAGNOSIS';
}

// Igual que el dashboard: mientras la simulación corre la bandeja cambia seguido, así
// que se refresca rápido; en reposo el intervalo es largo.
const AUTO_REFRESH_RUNNING_MS = 6_000;
const AUTO_REFRESH_IDLE_MS = 30_000;

const PRIORITY_PARAM_TO_FILTER: Record<string, FilterOption> = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
};

function PriorizadosContent() {
  const searchParams = useSearchParams();
  const initialFilter = PRIORITY_PARAM_TO_FILTER[searchParams.get('priority') || ''] || 'ALL';

  const [activeFilter, setActiveFilter] = useState<FilterOption>(initialFilter);
  const [patients, setPatients] = useState<PrioritizedPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { running, insightVersion } = useGlobalSimulation();

  const fetchPrioritized = useCallback(async (isBackground: boolean) => {
    if (isBackground) setRefreshing(true);
    try {
      const res = await fetch('/api/dashboard');
      const json = await res.json();
      if (!json.success) {
        setError(json.error || 'No se pudo cargar la bandeja de alertas.');
        return;
      }
      setError(null);
      setPatients(
        (json.prioritized as RawPrioritized[]).map((p) => ({
          id: p.id,
          priority: p.priority,
          riskScore: p.riskScore,
          alertReason: p.alertReason,
          timestamp: formatRelativeTime(p.timestampISO),
          hasDiagnosis: p.hasDiagnosis,
          insightCount: p.insightCount,
          source: p.source,
        }))
      );
    } catch (err: any) {
      setError(err.message || 'No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPrioritized(false);
  }, [fetchPrioritized]);

  useEffect(() => {
    const interval = setInterval(
      () => fetchPrioritized(true),
      running ? AUTO_REFRESH_RUNNING_MS : AUTO_REFRESH_IDLE_MS
    );
    return () => clearInterval(interval);
  }, [fetchPrioritized, running]);

  useEffect(() => {
    if (insightVersion > 0) fetchPrioritized(true);
  }, [insightVersion, fetchPrioritized]);

  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      if (activeFilter === 'CRITICAL') {
        return patient.priority === 'CRITICAL';
      }
      if (activeFilter === 'HIGH') {
        return patient.priority === 'HIGH';
      }
      if (activeFilter === 'CRITICAL_HIGH') {
        return patient.priority === 'CRITICAL' || patient.priority === 'HIGH';
      }
      return true; // 'ALL'
    });
  }, [activeFilter, patients]);

  return (
    <div className="space-y-6">
      {/* Header with Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <PrioritizedHeader
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          totalCount={filteredPatients.length}
        />
      </div>

      <button
        onClick={() => fetchPrioritized(true)}
        disabled={refreshing}
        className="flex items-center gap-2 text-xs text-slate-500 hover:text-blue-600 font-medium bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 -mt-3"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        <span>Actualizar</span>
      </button>

      {error && (
        <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-3 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Alert Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-56 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <AlertGrid patients={filteredPatients} />
      )}
    </div>
  );
}

export default function PriorizadosPage() {
  return (
    <Suspense fallback={null}>
      <PriorizadosContent />
    </Suspense>
  );
}

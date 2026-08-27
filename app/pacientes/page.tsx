'use client';

import React, { Suspense, useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { mockPatientsList } from '@/lib/mockPatients';
import { PatientFilters } from '@/components/patients/PatientFilters';
import { PatientDirectoryTable } from '@/components/patients/PatientDirectoryTable';
import { useGlobalSimulation } from '@/components/simulation/GlobalSimulationContext';
import { PatientDemographics } from '@/lib/patientDemographics';
import {
  PatientState,
  PatientStateInfo,
  PatientStateRaw,
  PATIENT_STATE_LABELS,
  PATIENT_STATE_RANK,
  PATIENT_STATE_STYLES,
  derivePatientState,
} from '@/lib/patientStates';
import { Users, RefreshCw, AlertCircle } from 'lucide-react';

const AUTO_REFRESH_MS = 15_000;

const VALID_STATE_PARAMS = new Set<string>([
  'DIAGNOSTICADO',
  'ANALIZANDO',
  'CON_ALERTAS',
  'SIN_ACTIVIDAD',
]);

function PacientesContent() {
  const searchParams = useSearchParams();
  const estadoParam = searchParams.get('estado') || '';

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>(
    VALID_STATE_PARAMS.has(estadoParam) ? estadoParam : 'Todos'
  );
  const [sortBy, setSortBy] = useState<string>('estado');
  const [regionFilter, setRegionFilter] = useState<string>('Todos');
  const [programFilter, setProgramFilter] = useState<string>('Todos');
  const [ageGroupFilter, setAgeGroupFilter] = useState<string>('Todos');

  const [rawStates, setRawStates] = useState<Record<string, PatientStateRaw>>({});
  const [demoById, setDemoById] = useState<Record<string, PatientDemographics>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { analyzingPatientIds, insightVersion, running } = useGlobalSimulation();

  const fetchStates = useCallback(async (isBackground: boolean) => {
    if (isBackground) setRefreshing(true);
    try {
      const res = await fetch('/api/patient-states');
      const json = await res.json();
      if (!json.success) {
        setError(json.error || 'No se pudieron cargar los estados de los pacientes.');
        return;
      }
      setError(null);
      const map: Record<string, PatientStateRaw> = {};
      (json.states as PatientStateRaw[]).forEach((s) => {
        map[s.patientId] = s;
      });
      setRawStates(map);
    } catch (err: any) {
      setError(err.message || 'No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStates(false);
  }, [fetchStates]);

  // Metadatos demográficos: son estáticos (una fila fija por paciente), a diferencia
  // de los estados -- se piden una sola vez, sin el ciclo de auto-refresh.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/patients')
      .then((res) => res.json())
      .then((json) => {
        if (cancelled || !json.success) return;
        const map: Record<string, PatientDemographics> = {};
        (json.patients as PatientDemographics[]).forEach((p) => {
          map[p.patientId] = p;
        });
        setDemoById(map);
      })
      .catch(() => {
        // El perfil demográfico es un complemento visual; si falla, el directorio
        // sigue funcionando con estado/alertas/diagnósticos igual que antes.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Refresca cuando la simulación produce un diagnóstico nuevo, y en segundo plano
  // mientras está corriendo (para reflejar alertas nuevas sin recargar).
  useEffect(() => {
    if (insightVersion > 0) fetchStates(true);
  }, [insightVersion, fetchStates]);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => fetchStates(true), AUTO_REFRESH_MS);
    return () => clearInterval(interval);
  }, [running, fetchStates]);

  const analyzingSet = useMemo(() => new Set(analyzingPatientIds), [analyzingPatientIds]);

  // Estado mostrado por paciente: lo persistido en la base, con "Analizando" superpuesto
  // para los que tienen una llamada a la IA en vuelo en este instante.
  const stateById = useMemo(() => {
    const map: Record<string, PatientStateInfo> = {};
    mockPatientsList.forEach((p) => {
      const raw = rawStates[p.id];
      map[p.id] = {
        patientId: p.id,
        state: derivePatientState(raw, analyzingSet.has(p.id)),
        insightCount: raw?.insightCount ?? 0,
        lastInsightAtISO: raw?.lastInsightAtISO ?? null,
        alertCount: raw?.alertCount ?? 0,
        topTier: raw?.topTier ?? null,
      };
    });
    return map;
  }, [rawStates, analyzingSet]);

  const counts = useMemo(() => {
    const c: Record<PatientState, number> = {
      ANALIZANDO: 0,
      DIAGNOSTICADO: 0,
      CON_ALERTAS: 0,
      SIN_ACTIVIDAD: 0,
    };
    Object.values(stateById).forEach((info) => {
      c[info.state]++;
    });
    return c;
  }, [stateById]);

  const filteredPatients = useMemo(() => {
    return mockPatientsList
      .filter((patient) => {
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch = patient.id.toLowerCase().includes(query);

        const state = stateById[patient.id]?.state ?? 'SIN_ACTIVIDAD';
        const matchesStatus = statusFilter === 'Todos' || state === statusFilter;

        const demo = demoById[patient.id];
        const matchesRegion = regionFilter === 'Todos' || demo?.regionType === regionFilter;
        const matchesProgram = programFilter === 'Todos' || demo?.careProgram === programFilter;
        const matchesAgeGroup = ageGroupFilter === 'Todos' || demo?.ageGroup === ageGroupFilter;

        return matchesSearch && matchesStatus && matchesRegion && matchesProgram && matchesAgeGroup;
      })
      .sort((a, b) => {
        const infoA = stateById[a.id];
        const infoB = stateById[b.id];

        if (sortBy === 'estado') {
          const rankDiff =
            (PATIENT_STATE_RANK[infoB?.state ?? 'SIN_ACTIVIDAD'] ?? 0) -
            (PATIENT_STATE_RANK[infoA?.state ?? 'SIN_ACTIVIDAD'] ?? 0);
          if (rankDiff !== 0) return rankDiff;
          return a.id.localeCompare(b.id);
        }
        if (sortBy === 'diagnosticos') {
          const countDiff = (infoB?.insightCount ?? 0) - (infoA?.insightCount ?? 0);
          if (countDiff !== 0) return countDiff;
          return a.id.localeCompare(b.id);
        }
        return a.id.localeCompare(b.id);
      });
  }, [searchQuery, statusFilter, sortBy, stateById, demoById, regionFilter, programFilter, ageGroupFilter]);

  const summaryStates: PatientState[] = ['DIAGNOSTICADO', 'ANALIZANDO', 'CON_ALERTAS', 'SIN_ACTIVIDAD'];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              Directorio de Pacientes
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Estado de análisis y diagnósticos generados por el motor RISA
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchStates(true)}
          disabled={refreshing}
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-blue-600 font-medium bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 px-3 py-2 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 self-start sm:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Actualizar estados</span>
        </button>
      </div>

      {/* State Summary: click para filtrar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryStates.map((state) => {
          const style = PATIENT_STATE_STYLES[state];
          const isActive = statusFilter === state;
          return (
            <button
              key={state}
              onClick={() => setStatusFilter(isActive ? 'Todos' : state)}
              className={`flex items-center justify-between gap-3 p-4 rounded-xl border bg-white text-left transition-all cursor-pointer ${
                isActive
                  ? 'border-blue-400 ring-2 ring-blue-500/20 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <div>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <span
                    className={`w-2 h-2 rounded-full ${style.dot} ${
                      style.pulse && counts[state] > 0 ? 'animate-pulse' : ''
                    }`}
                  />
                  {PATIENT_STATE_LABELS[state]}
                </span>
                <span className="block text-2xl font-bold text-slate-800 mt-1">{counts[state]}</span>
              </div>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-3 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search & Filters */}
      <PatientFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        regionFilter={regionFilter}
        onRegionFilterChange={setRegionFilter}
        programFilter={programFilter}
        onProgramFilterChange={setProgramFilter}
        ageGroupFilter={ageGroupFilter}
        onAgeGroupFilterChange={setAgeGroupFilter}
      />

      {/* Directory Table */}
      <PatientDirectoryTable
        patients={filteredPatients}
        stateById={stateById}
        demoById={demoById}
        loading={loading}
      />
    </div>
  );
}

export default function PacientesPage() {
  return (
    <Suspense fallback={null}>
      <PacientesContent />
    </Suspense>
  );
}

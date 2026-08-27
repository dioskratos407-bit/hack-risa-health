'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { mockPatientsList } from '@/lib/mockPatients';

const TICK_INTERVAL_MS = 2000;
const BATCH_SIZE = 8;

interface TickResult {
  id: string;
  newCursor?: string;
  done: boolean;
  alertsCreated: number;
}

interface AICandidate {
  id: string;
  timeT: string;
  preScore: number;
}

export interface GlobalSimulationState {
  running: boolean;
  start: () => void;
  stop: () => void;
  ticks: number;
  passesCompleted: number;
  alertsThisSession: number;
  lastBatchPatientIds: string[];
  /** Paciente cuyo expediente está abierto -- se incluye en TODOS los ticks (no solo en
   * el round-robin) para que su reloj avance de forma fluida mientras se lo mira. */
  focusedPatientId: string | null;
  setFocusedPatient: (id: string | null) => void;
  /** Último cursor (ISO) conocido para el paciente enfocado, actualizado en cada tick. */
  focusedCursor: string | null;
  /** Se incrementa cuando un tick genera un nuevo análisis de IA para el paciente
   * enfocado -- la página del expediente lo observa para refrescar "Hallazgos Destacados". */
  focusedInsightVersion: number;
  /** Análisis de IA generados por el motor global en esta sesión (todos los pacientes). */
  insightsThisSession: number;
  /** Pacientes con una llamada a la IA en vuelo AHORA MISMO -- alimenta el estado
   * "Analizando (IA)" del directorio de pacientes. */
  analyzingPatientIds: string[];
  /** Se incrementa cada vez que CUALQUIER paciente obtiene un diagnóstico nuevo, para
   * que las vistas que listan estados (directorio) se refresquen. */
  insightVersion: number;
}

const GlobalSimulationContext = createContext<GlobalSimulationState | null>(null);

/**
 * Motor de simulación a nivel de sistema: recorre el roster de pacientes en lotes,
 * avanzando el reloj de cada uno vía /api/simulate/tick (misma lógica de detección que
 * el reloj individual de /pacientes/[id], reutilizada server-side). Vive en el layout
 * raíz para que siga corriendo aunque el usuario navegue entre Dashboard, Priorizados y
 * pacientes -- "el tiempo del sistema" no depende de qué pestaña esté abierta.
 */
export const GlobalSimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [running, setRunning] = useState(false);
  const [ticks, setTicks] = useState(0);
  const [passesCompleted, setPassesCompleted] = useState(0);
  const [alertsThisSession, setAlertsThisSession] = useState(0);
  const [lastBatchPatientIds, setLastBatchPatientIds] = useState<string[]>([]);
  const [focusedPatientId, setFocusedPatientId] = useState<string | null>(null);
  const [focusedCursor, setFocusedCursor] = useState<string | null>(null);
  const [focusedInsightVersion, setFocusedInsightVersion] = useState(0);
  const [insightsThisSession, setInsightsThisSession] = useState(0);
  const [analyzingPatientIds, setAnalyzingPatientIds] = useState<string[]>([]);
  const [insightVersion, setInsightVersion] = useState(0);

  const cursorsRef = useRef<Record<string, string | undefined>>({});
  const pointerRef = useRef(0);
  const inFlightRef = useRef(false);
  const focusedPatientRef = useRef<string | null>(null);
  const rosterRef = useRef(mockPatientsList.map((p) => p.id));
  const analyzingRef = useRef<Set<string>>(new Set());

  /**
   * Dispara el análisis contextual de un candidato. Corre en paralelo al bucle de ticks
   * (no lo bloquea) y mantiene el set de "analizando" para que la UI refleje en vivo
   * sobre qué paciente está trabajando la IA en este momento.
   */
  const runAnalysis = useCallback(async (candidate: AICandidate) => {
    if (analyzingRef.current.has(candidate.id)) return;
    analyzingRef.current.add(candidate.id);
    setAnalyzingPatientIds(Array.from(analyzingRef.current));

    try {
      const res = await fetch('/api/analyze-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: candidate.id, timeT: candidate.timeT }),
      });
      const json = await res.json();

      if (json.success && json.insightUpdated) {
        setInsightsThisSession((prev) => prev + 1);
        setInsightVersion((v) => v + 1);
        if (candidate.id === focusedPatientRef.current) {
          setFocusedInsightVersion((v) => v + 1);
        }
      }
    } catch {
      // El análisis es un enriquecimiento: si falla, las alertas y el avance del reloj
      // ya quedaron persistidos por el tick y la simulación continúa.
    } finally {
      analyzingRef.current.delete(candidate.id);
      setAnalyzingPatientIds(Array.from(analyzingRef.current));
    }
  }, []);

  const setFocusedPatient = useCallback((id: string | null) => {
    focusedPatientRef.current = id;
    setFocusedPatientId(id);
    setFocusedCursor(id ? cursorsRef.current[id] ?? null : null);
  }, []);

  const runTick = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const roster = rosterRef.current;
      const focused = focusedPatientRef.current;
      const batchIds: string[] = focused ? [focused] : [];

      while (batchIds.length < BATCH_SIZE) {
        const candidate = roster[pointerRef.current % roster.length];
        pointerRef.current++;
        if (pointerRef.current % roster.length === 0) {
          setPassesCompleted((prev) => prev + 1);
        }
        if (candidate === focused) continue;
        batchIds.push(candidate);
      }
      setLastBatchPatientIds(batchIds);

      const patients = batchIds.map((id) => ({ id, cursor: cursorsRef.current[id] }));

      const res = await fetch('/api/simulate/tick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patients }),
      });
      const json = await res.json();

      if (json.success) {
        let created = 0;
        (json.results as TickResult[]).forEach((r) => {
          cursorsRef.current[r.id] = r.done ? undefined : r.newCursor;
          created += r.alertsCreated;
          if (r.id === focusedPatientRef.current) {
            setFocusedCursor(r.done ? null : r.newCursor ?? null);
          }
        });
        setAlertsThisSession((prev) => prev + created);

        // Los análisis se lanzan sin await: corren en paralelo mientras el bucle sigue
        // avanzando el reloj del resto del roster.
        (json.aiCandidates as AICandidate[] | undefined)?.forEach((c) => {
          void runAnalysis(c);
        });
      }
      setTicks((prev) => prev + 1);
    } catch {
      // Un tick fallido no debe detener el bucle -- se reintenta en el siguiente intervalo.
    } finally {
      inFlightRef.current = false;
    }
  }, [runAnalysis]);

  const start = useCallback(() => setRunning(true), []);
  const stop = useCallback(() => setRunning(false), []);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(runTick, TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [running, runTick]);

  return (
    <GlobalSimulationContext.Provider
      value={{
        running,
        start,
        stop,
        ticks,
        passesCompleted,
        alertsThisSession,
        lastBatchPatientIds,
        focusedPatientId,
        setFocusedPatient,
        focusedCursor,
        focusedInsightVersion,
        insightsThisSession,
        analyzingPatientIds,
        insightVersion,
      }}
    >
      {children}
    </GlobalSimulationContext.Provider>
  );
};

export function useGlobalSimulation(): GlobalSimulationState {
  const ctx = useContext(GlobalSimulationContext);
  if (!ctx) throw new Error('useGlobalSimulation debe usarse dentro de GlobalSimulationProvider');
  return ctx;
}
